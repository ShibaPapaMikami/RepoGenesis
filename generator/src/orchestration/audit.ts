import * as fs from 'fs';
import * as path from 'path';

export interface AuditRecord {
  requestId: string;
  userId: string;
  timestamp: string;
  result: 'success' | 'failure';
  specVersion?: string;
  repoType?: 'single' | 'multi';
  fileCount?: number;
  errorCode?: string;
}

const AUDIT_LOG_PATH = path.resolve(process.cwd(), 'logs', 'orchestration-audit.log');

export function appendAuditRecord(record: AuditRecord): void {
  const dir = path.dirname(AUDIT_LOG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(AUDIT_LOG_PATH, `${JSON.stringify(record)}\n`, 'utf-8');
}

export function getAuditLogPath(): string {
  return AUDIT_LOG_PATH;
}
