import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';

export type FeedbackType = 'bug' | 'request';

export interface FeedbackRecord {
  feedbackId: string;
  requestId: string;
  createdAt: string;
  type: FeedbackType;
  userId: string;
  title: string;
  description: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditRecord {
  requestId: string;
  userId: string;
  timestamp: string;
  result: 'success' | 'failure';
  specVersion?: string;
  repoType?: 'single' | 'multi';
  fileCount?: number;
  projectSlug?: string;
  artifactFilename?: string;
  authProvider?: 'mock' | 'gugenka';
  authMode?: 'bearer' | 'cookie_session' | 'anonymous';
  selectedSkillIds?: string[];
  errorCode?: string;
}

export interface SupportDataStoreStatus {
  absolutePath: string;
  relativePath: string;
  directoryPath: string;
  configuredPath: string | null;
  usingDefaultPath: boolean;
  exists: boolean;
}

let database: DatabaseSync | null = null;
let databasePath: string | null = null;

const AUDIT_COLUMN_TYPES = {
  project_slug: 'TEXT',
  artifact_filename: 'TEXT',
  auth_provider: 'TEXT',
  auth_mode: 'TEXT',
  selected_skill_ids_json: 'TEXT',
} as const;

function quoteSqlIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function safeParseObjectJson(input: string | null): Record<string, unknown> | undefined {
  if (!input) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(input) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function safeParseStringArrayJson(input: string | null): string[] | undefined {
  if (!input) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(input) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : undefined;
  } catch {
    return undefined;
  }
}

function getConfiguredSupportDataDbPath(): string | null {
  const configuredPath = process.env.SUPPORT_DATA_DB_PATH?.trim();
  if (configuredPath && configuredPath.length > 0) {
    return configuredPath;
  }
  return null;
}

function resolveSupportDataDbPath(): string {
  const configuredPath = getConfiguredSupportDataDbPath();
  if (configuredPath) {
    return path.resolve(process.cwd(), configuredPath);
  }
  return path.resolve(process.cwd(), 'data', 'support-data.sqlite');
}

function ensureDatabaseSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback_entries (
      feedback_id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('bug', 'request')),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      email TEXT,
      metadata_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_entries_created_at
      ON feedback_entries(created_at DESC);

    CREATE TABLE IF NOT EXISTS generation_audit_entries (
      request_id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_id TEXT NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('success', 'failure')),
      spec_version TEXT,
      repo_type TEXT,
      file_count INTEGER,
      project_slug TEXT,
      artifact_filename TEXT,
      auth_provider TEXT,
      auth_mode TEXT,
      selected_skill_ids_json TEXT,
      error_code TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_generation_audit_entries_timestamp
      ON generation_audit_entries(timestamp DESC);
  `);

  for (const [columnName, columnType] of Object.entries(AUDIT_COLUMN_TYPES)) {
    ensureAuditTableColumn(db, columnName as keyof typeof AUDIT_COLUMN_TYPES, columnType);
  }
}

function ensureAuditTableColumn(
  db: DatabaseSync,
  columnName: keyof typeof AUDIT_COLUMN_TYPES,
  columnType: (typeof AUDIT_COLUMN_TYPES)[keyof typeof AUDIT_COLUMN_TYPES],
): void {
  const tableName = 'generation_audit_entries';
  const existing = db.prepare(`PRAGMA table_info(${quoteSqlIdentifier(tableName)})`).all() as Array<{ name: string }>;
  if (existing.some((column) => column.name === columnName)) {
    return;
  }
  db.exec(`ALTER TABLE ${quoteSqlIdentifier(tableName)} ADD COLUMN ${quoteSqlIdentifier(columnName)} ${columnType}`);
}

function getDatabase(): { db: DatabaseSync; dbPath: string } {
  const resolvedPath = resolveSupportDataDbPath();

  if (database && databasePath === resolvedPath) {
    return { db: database, dbPath: resolvedPath };
  }

  if (database) {
    database.close();
    database = null;
    databasePath = null;
  }

  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const db = new DatabaseSync(resolvedPath);
  ensureDatabaseSchema(db);
  database = db;
  databasePath = resolvedPath;
  return { db, dbPath: resolvedPath };
}

export function persistFeedback(record: FeedbackRecord): { absolutePath: string; relativePath: string } {
  const { db, dbPath } = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO feedback_entries (
      feedback_id,
      request_id,
      created_at,
      type,
      user_id,
      title,
      description,
      email,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.feedbackId,
    record.requestId,
    record.createdAt,
    record.type,
    record.userId,
    record.title,
    record.description,
    record.email ?? null,
    record.metadata ? JSON.stringify(record.metadata) : null,
  );

  const relativePath = `${path.relative(process.cwd(), dbPath)}#feedback:${record.feedbackId}`;
  return { absolutePath: dbPath, relativePath };
}

export function getFeedbackRecord(feedbackId: string): FeedbackRecord | null {
  const { db } = getDatabase();
  const row = db.prepare(`
    SELECT
      feedback_id,
      request_id,
      created_at,
      type,
      user_id,
      title,
      description,
      email,
      metadata_json
    FROM feedback_entries
    WHERE feedback_id = ?
  `).get(feedbackId) as {
    feedback_id: string;
    request_id: string;
    created_at: string;
    type: FeedbackType;
    user_id: string;
    title: string;
    description: string;
    email: string | null;
    metadata_json: string | null;
  } | undefined;

  if (!row) {
    return null;
  }

  return {
    feedbackId: row.feedback_id,
    requestId: row.request_id,
    createdAt: row.created_at,
    type: row.type,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    email: row.email ?? undefined,
    metadata: safeParseObjectJson(row.metadata_json),
  };
}

export function listFeedbackRecords(options: { type?: FeedbackType; limit?: number } = {}): FeedbackRecord[] {
  const { db } = getDatabase();
  const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
  const rows = options.type
    ? db.prepare(`
        SELECT
          feedback_id,
          request_id,
          created_at,
          type,
          user_id,
          title,
          description,
          email,
          metadata_json
        FROM feedback_entries
        WHERE type = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(options.type, limit)
    : db.prepare(`
        SELECT
          feedback_id,
          request_id,
          created_at,
          type,
          user_id,
          title,
          description,
          email,
          metadata_json
        FROM feedback_entries
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit);

  return (rows as Array<{
    feedback_id: string;
    request_id: string;
    created_at: string;
    type: FeedbackType;
    user_id: string;
    title: string;
    description: string;
    email: string | null;
    metadata_json: string | null;
  }>).map((row) => ({
    feedbackId: row.feedback_id,
    requestId: row.request_id,
    createdAt: row.created_at,
    type: row.type,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    email: row.email ?? undefined,
    metadata: safeParseObjectJson(row.metadata_json),
  }));
}

export function appendAuditRecord(record: AuditRecord): void {
  const { db } = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO generation_audit_entries (
      request_id,
      timestamp,
      user_id,
      result,
      spec_version,
      repo_type,
      file_count,
      project_slug,
      artifact_filename,
      auth_provider,
      auth_mode,
      selected_skill_ids_json,
      error_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.requestId,
    record.timestamp,
    record.userId,
    record.result,
    record.specVersion ?? null,
    record.repoType ?? null,
    record.fileCount ?? null,
    record.projectSlug ?? null,
    record.artifactFilename ?? null,
    record.authProvider ?? null,
    record.authMode ?? null,
    record.selectedSkillIds ? JSON.stringify(record.selectedSkillIds) : null,
    record.errorCode ?? null,
  );
}

export function listAuditRecords(limit = 20): AuditRecord[] {
  const { db } = getDatabase();
  const rows = db.prepare(`
    SELECT
      request_id,
      timestamp,
      user_id,
      result,
      spec_version,
      repo_type,
      file_count,
      project_slug,
      artifact_filename,
      auth_provider,
      auth_mode,
      selected_skill_ids_json,
      error_code
    FROM generation_audit_entries
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit) as Array<{
    request_id: string;
    timestamp: string;
    user_id: string;
    result: 'success' | 'failure';
    spec_version: string | null;
    repo_type: 'single' | 'multi' | null;
    file_count: number | null;
    project_slug: string | null;
    artifact_filename: string | null;
    auth_provider: 'mock' | 'gugenka' | null;
    auth_mode: 'bearer' | 'cookie_session' | 'anonymous' | null;
    selected_skill_ids_json: string | null;
    error_code: string | null;
  }>;

  return rows.map((row) => ({
    requestId: row.request_id,
    timestamp: row.timestamp,
    userId: row.user_id,
    result: row.result,
    specVersion: row.spec_version ?? undefined,
    repoType: row.repo_type ?? undefined,
    fileCount: row.file_count ?? undefined,
    projectSlug: row.project_slug ?? undefined,
    artifactFilename: row.artifact_filename ?? undefined,
    authProvider: row.auth_provider ?? undefined,
    authMode: row.auth_mode ?? undefined,
    selectedSkillIds: safeParseStringArrayJson(row.selected_skill_ids_json),
    errorCode: row.error_code ?? undefined,
  }));
}

export function getSupportDataStorePath(): string {
  return getDatabase().dbPath;
}

export function getSupportDataStoreStatus(): SupportDataStoreStatus {
  const absolutePath = resolveSupportDataDbPath();
  const relativePath = path.relative(process.cwd(), absolutePath);

  return {
    absolutePath,
    relativePath: relativePath.length > 0 ? relativePath : path.basename(absolutePath),
    directoryPath: path.dirname(absolutePath),
    configuredPath: getConfiguredSupportDataDbPath(),
    usingDefaultPath: !getConfiguredSupportDataDbPath(),
    exists: fs.existsSync(absolutePath),
  };
}

export function resetSupportDataStoreForTests(): void {
  if (database) {
    database.close();
    database = null;
    databasePath = null;
  }
}
