import type { FormState } from '../state/actions.ts';
import type { DependencyCategory, TechDecisionStatus } from '../constants/enums.ts';

interface DependencyMatcher {
  name: string;
  category: DependencyCategory;
  pattern: RegExp;
  env_vars: string[];
  source?: string;
  data_outbound: boolean;
  decisionTopic?: string;
}

interface PlanningSuggestionInput {
  currentState: FormState;
  candidateText: string;
  externalText: string;
  combinedText: string;
}

type StructuredHintKey =
  | 'name'
  | 'slug'
  | 'domains'
  | 'language'
  | 'framework'
  | 'database'
  | 'storage'
  | 'db_storage'
  | 'auth'
  | 'ai_api'
  | 'ai_model'
  | 'pdf_extractor'
  | 'notification'
  | 'security_level'
  | 'repo_style'
  | 'phases'
  | 'scheduled_jobs';

type TechDecisionItem = FormState['planning']['tech_decisions'][number];
type ExternalDependencyItem = FormState['planning']['external_dependencies'][number];

const DEPENDENCY_MATCHERS: DependencyMatcher[] = [
  {
    name: 'OpenAI API',
    category: 'ai_api',
    pattern: /\bopenai api\b|\bopenai\b/i,
    env_vars: ['OPENAI_API_KEY'],
    source: 'https://platform.openai.com/',
    data_outbound: true,
    decisionTopic: 'AI API',
  },
  {
    name: 'Anthropic API',
    category: 'ai_api',
    pattern: /\banthropic api\b|\banthropic\b/i,
    env_vars: ['ANTHROPIC_API_KEY'],
    source: 'https://www.anthropic.com/api',
    data_outbound: true,
    decisionTopic: 'AI API',
  },
  {
    name: 'Gemini API',
    category: 'ai_api',
    pattern: /\bgemini api\b|\bgemini\b/i,
    env_vars: ['GEMINI_API_KEY'],
    source: 'https://ai.google.dev/',
    data_outbound: true,
    decisionTopic: 'AI API',
  },
  {
    name: 'self-hosted Qwen',
    category: 'model',
    pattern: /\bself-hosted qwen\b|\bqwen\b/i,
    env_vars: ['QWEN_BASE_URL'],
    data_outbound: false,
    decisionTopic: 'Model',
  },
  {
    name: 'Supabase Auth',
    category: 'auth',
    pattern: /\bsupabase auth\b/i,
    env_vars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    source: 'https://supabase.com/',
    data_outbound: true,
    decisionTopic: 'Authentication',
  },
  {
    name: 'Supabase Storage',
    category: 'storage',
    pattern: /\bsupabase storage\b/i,
    env_vars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    source: 'https://supabase.com/',
    data_outbound: true,
    decisionTopic: 'Storage',
  },
  {
    name: 'Supabase',
    category: 'database',
    pattern: /\bsupabase\b/i,
    env_vars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    source: 'https://supabase.com/',
    data_outbound: true,
    decisionTopic: 'Database',
  },
  {
    name: 'Slack',
    category: 'notification',
    pattern: /\bslack\b|スラック/i,
    env_vars: ['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID'],
    source: 'https://api.slack.com/',
    data_outbound: true,
    decisionTopic: 'Notification',
  },
  {
    name: 'Email provider',
    category: 'notification',
    pattern: /メール|email provider|email/i,
    env_vars: ['EMAIL_PROVIDER_API_KEY'],
    data_outbound: true,
    decisionTopic: 'Notification',
  },
  {
    name: 'Resend',
    category: 'notification',
    pattern: /\bresend\b/i,
    env_vars: ['RESEND_API_KEY'],
    source: 'https://resend.com/',
    data_outbound: true,
    decisionTopic: 'Notification',
  },
  {
    name: 'SendGrid',
    category: 'notification',
    pattern: /\bsendgrid\b/i,
    env_vars: ['SENDGRID_API_KEY'],
    source: 'https://sendgrid.com/',
    data_outbound: true,
    decisionTopic: 'Notification',
  },
  {
    name: 'OCR service',
    category: 'ocr',
    pattern: /\bocr\b|文書解析/i,
    env_vars: ['OCR_API_KEY'],
    data_outbound: true,
    decisionTopic: 'OCR',
  },
];

const TOPIC_CATEGORY_MAP: Array<{
  pattern: RegExp;
  topic: string;
  category?: DependencyCategory;
}> = [
  { pattern: /\bai api\b|ai基盤|モデルapi/i, topic: 'AI API', category: 'ai_api' },
  { pattern: /\bmodel\b|モデル/i, topic: 'Model', category: 'model' },
  { pattern: /\bdb\b|database|データベース/i, topic: 'Database', category: 'database' },
  { pattern: /storage|ストレージ|file保存|ファイル保存/i, topic: 'Storage', category: 'storage' },
  { pattern: /auth|認証/i, topic: 'Authentication', category: 'auth' },
  { pattern: /notification|通知/i, topic: 'Notification', category: 'notification' },
  { pattern: /\bocr\b|pdf extraction|pdf解析|文書解析/i, topic: 'OCR', category: 'ocr' },
  { pattern: /github|githubリポジトリ|external code/i, topic: 'External Code', category: 'github_repo' },
  { pattern: /外部oss|外部 oss|\boss\b/i, topic: 'External OSS', category: 'oss' },
  { pattern: /npm package|\bnpm\b/i, topic: 'Package', category: 'npm_package' },
  { pattern: /scheduled_jobs|scheduled jobs|cron|batch|バッチ|定期実行/i, topic: 'Batch / Scheduled Jobs', category: 'batch' },
];

const MODEL_PATTERN = /\b(gpt-[\w.-]+|claude-[\w.-]+|gemini-[\w.-]+|qwen[\w.-]*)\b/gi;

function splitLines(...texts: Array<string | undefined>): string[] {
  return texts
    .flatMap((text) => (text ?? '').split('\n'))
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function normalizeStatus(line: string, fallback: TechDecisionStatus = 'candidate'): TechDecisionStatus {
  if (/却下|採用しない|不要|対象外/i.test(line)) return 'rejected';
  if (/未確定|未定|要確認|かどうか|または|優先順位|方針/i.test(line)) return 'open';
  if (/想定|候補|検討|later/i.test(line)) return 'candidate';
  if (/採用|必須|固定|前提|利用する|使う/i.test(line)) return 'adopted';
  return fallback;
}

function normalizeDecisionTopic(label: string): { topic: string; category?: DependencyCategory } | null {
  const trimmed = label.trim();
  for (const entry of TOPIC_CATEGORY_MAP) {
    if (entry.pattern.test(trimmed)) {
      return { topic: entry.topic, category: entry.category };
    }
  }
  return null;
}

function normalizeStructuredHintKey(label: string): StructuredHintKey | null {
  const normalized = label.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[／]/g, '/');

  if (/^(name|project name|project_name|プロジェクト名)$/.test(normalized)) return 'name';
  if (/^(slug|project slug|project_slug|スラッグ)$/.test(normalized)) return 'slug';
  if (/^(domain|domains|技術ドメイン)$/.test(normalized)) return 'domains';
  if (/^(language|primary language|primary_language|言語)$/.test(normalized)) return 'language';
  if (/^(framework|frameworks|フレームワーク)$/.test(normalized)) return 'framework';
  if (/^(db|database|データベース)$/.test(normalized)) return 'database';
  if (/^(storage|ストレージ|ファイル保存|file保存)$/.test(normalized)) return 'storage';
  if (/^(db\/storage|database\/storage)$/.test(normalized)) return 'db_storage';
  if (/^(auth|authentication|認証)$/.test(normalized)) return 'auth';
  if (/^(ai api|ai_api|採用するai api|利用するai api)$/.test(normalized)) return 'ai_api';
  if (/^(model|ai model|ai_model|採用するモデル|利用するモデル)$/.test(normalized)) return 'ai_model';
  if (/^(pdf extractor|pdf extraction|pdf_extractor|pdf解析|文書解析|採用する外部oss \/ githubリポジトリ \/ npm package|外部oss \/ githubリポジトリ \/ npm package)$/.test(normalized)) return 'pdf_extractor';
  if (/^(notification|通知|通知手段)$/.test(normalized)) return 'notification';
  if (/^(security|security level|security_level|セキュリティレベル)$/.test(normalized)) return 'security_level';
  if (/^(repo style|repo_style|repository style|リポジトリ構成)$/.test(normalized)) return 'repo_style';
  if (/^(phase|phases|進め方の段階数|段階数)$/.test(normalized)) return 'phases';
  if (/^(scheduled_jobs|scheduled jobs|batch|cron|定期実行|バッチ)$/.test(normalized)) return 'scheduled_jobs';
  return null;
}

function dependencyKey(category: DependencyCategory, name: string): string {
  return `${category}:${name.toLowerCase()}`;
}

function decisionKey(topic: string, choice: string): string {
  return `${topic.toLowerCase()}:${choice.toLowerCase()}`;
}

function mergeStatus(current: TechDecisionStatus, next: TechDecisionStatus): TechDecisionStatus {
  const order: TechDecisionStatus[] = ['adopted', 'candidate', 'open', 'rejected'];
  return order.indexOf(next) < order.indexOf(current) ? next : current;
}

function mergeDecision(bucket: Map<string, TechDecisionItem>, item: TechDecisionItem) {
  if (!item.topic.trim() || !item.choice.trim()) return;
  const key = decisionKey(item.topic, item.choice);
  const existing = bucket.get(key);
  if (!existing) {
    bucket.set(key, item);
    return;
  }
  bucket.set(key, {
    ...existing,
    status: mergeStatus(existing.status, item.status),
    rationale: existing.rationale || item.rationale,
    decision_date: existing.decision_date || item.decision_date,
    notes: [existing.notes, item.notes].filter(Boolean).join(' / '),
  });
}

function mergeDependency(bucket: Map<string, ExternalDependencyItem>, item: ExternalDependencyItem) {
  if (!item.name.trim()) return;
  const key = dependencyKey(item.category, item.name);
  const existing = bucket.get(key);
  if (!existing) {
    bucket.set(key, item);
    return;
  }
  bucket.set(key, {
    ...existing,
    status: mergeStatus(existing.status, item.status),
    purpose: existing.purpose || item.purpose,
    owner: existing.owner || item.owner,
    source: existing.source || item.source,
    license: existing.license || item.license,
    env_vars: Array.from(new Set([...existing.env_vars, ...item.env_vars])),
    data_outbound: existing.data_outbound || item.data_outbound,
    notes: [existing.notes, item.notes].filter(Boolean).join(' / '),
  });
}

function inferEnvVars(name: string, category: DependencyCategory): string[] {
  const lowered = name.toLowerCase();
  if (category === 'ai_api') {
    if (lowered.includes('openai')) return ['OPENAI_API_KEY'];
    if (lowered.includes('anthropic')) return ['ANTHROPIC_API_KEY'];
    if (lowered.includes('gemini')) return ['GEMINI_API_KEY'];
  }
  if (category === 'model' && lowered.includes('qwen')) return ['QWEN_BASE_URL'];
  if (lowered.includes('supabase')) return ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  if (lowered.includes('slack')) return ['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID'];
  if (lowered.includes('resend')) return ['RESEND_API_KEY'];
  if (lowered.includes('sendgrid')) return ['SENDGRID_API_KEY'];
  if (category === 'notification') return ['EMAIL_PROVIDER_API_KEY'];
  if (category === 'ocr') return ['OCR_API_KEY'];
  return [];
}

function canonicalizeStructuredDependencyName(value: string, category: DependencyCategory): string {
  const lowered = value.toLowerCase();
  if (category === 'ai_api') {
    if (lowered.includes('openai')) return 'OpenAI API';
    if (lowered.includes('anthropic')) return 'Anthropic API';
    if (lowered.includes('gemini')) return 'Gemini API';
  }
  if (category === 'model' && lowered.includes('qwen')) return 'self-hosted Qwen';
  if (category === 'database' && lowered.includes('supabase')) return 'Supabase';
  if (category === 'storage' && lowered.includes('supabase')) return 'Supabase Storage';
  if (category === 'auth' && lowered.includes('supabase')) return 'Supabase Auth';
  if (category === 'ocr') return lowered.includes('ocr') ? 'OCR service' : value;
  return value;
}

function inferDependencySource(name: string): string {
  const lowered = name.toLowerCase();
  if (lowered.includes('openai')) return 'https://platform.openai.com/';
  if (lowered.includes('anthropic')) return 'https://www.anthropic.com/api';
  if (lowered.includes('gemini')) return 'https://ai.google.dev/';
  if (lowered.includes('supabase')) return 'https://supabase.com/';
  if (lowered.includes('slack')) return 'https://api.slack.com/';
  if (lowered.includes('resend')) return 'https://resend.com/';
  if (lowered.includes('sendgrid')) return 'https://sendgrid.com/';
  return '';
}

function parseStructuredLine(line: string): { key: StructuredHintKey; value: string } | null {
  const colonMatch = line.match(/^([^:：]{2,80})[:：]\s*(.+)$/);
  if (colonMatch) {
    const key = normalizeStructuredHintKey(colonMatch[1]);
    const value = colonMatch[2].trim();
    if (key && value) return { key, value };
  }

  const waMatch = line.match(/^(.{2,80}?)\s*は\s*(.+)$/u);
  if (!waMatch) return null;

  const key = normalizeStructuredHintKey(waMatch[1]);
  if (!key) return null;

  const value = waMatch[2]
    .trim()
    .replace(/\s*(を|が)?\s*(採用|利用|使用)(する|したい|予定)?$/u, '')
    .replace(/\s*(を|が)?\s*想定(する|したい|です)?$/u, '')
    .replace(/\s*(が|は)\s*候補(です)?$/u, '')
    .replace(/\s*(は|が)\s*未確定(です)?$/u, '')
    .replace(/\s*(を|が)?\s*必須(です)?$/u, '')
    .trim();

  if (!value) return null;
  return { key, value };
}

function addDependency(
  dependencyBucket: Map<string, ExternalDependencyItem>,
  decisionBucket: Map<string, TechDecisionItem>,
  line: string,
  matcher: DependencyMatcher,
  status: TechDecisionStatus,
) {
  mergeDependency(dependencyBucket, {
    name: matcher.name,
    category: matcher.category,
    status,
    purpose: line,
    owner: '',
    source: matcher.source ?? '',
    license: '',
    env_vars: matcher.env_vars,
    data_outbound: matcher.data_outbound,
    notes: '',
  });

  if (matcher.decisionTopic) {
    mergeDecision(decisionBucket, {
      topic: matcher.decisionTopic,
      choice: matcher.name,
      status,
      rationale: line,
      decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
      notes: '',
    });
  }
}

function extractInlineDecision(
  line: string,
  decisionBucket: Map<string, TechDecisionItem>,
  dependencyBucket: Map<string, ExternalDependencyItem>,
  fallbackStatus: TechDecisionStatus = 'candidate',
) {
  const match = line.match(/^([^:：]{2,40})[:：]\s*(.+)$/);
  if (!match) return;

  const [, rawLabel, rawValue] = match;
  const normalized = normalizeDecisionTopic(rawLabel);
  const value = rawValue.trim();
  if (!normalized || !value) return;

  const status = normalizeStatus(line, fallbackStatus);
  mergeDecision(decisionBucket, {
    topic: normalized.topic,
    choice: value,
    status,
    rationale: line,
    decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
    notes: '',
  });

  if (normalized.category) {
    mergeDependency(dependencyBucket, {
      name: value,
      category: normalized.category,
      status,
      purpose: normalized.topic,
      owner: '',
      source: value.startsWith('http') ? value : '',
      license: '',
      env_vars: inferEnvVars(value, normalized.category),
      data_outbound: normalized.category !== 'oss' && normalized.category !== 'npm_package' && normalized.category !== 'github_repo',
      notes: line,
    });
  }
}

function extractGenericDependencies(
  line: string,
  dependencyBucket: Map<string, ExternalDependencyItem>,
  decisionBucket: Map<string, TechDecisionItem>,
  fallbackStatus: TechDecisionStatus = 'candidate',
) {
  const status = normalizeStatus(line, fallbackStatus);

  for (const matcher of DEPENDENCY_MATCHERS) {
    if (matcher.pattern.test(line)) {
      addDependency(dependencyBucket, decisionBucket, line, matcher, status);
    }
  }

  const repoUrlMatches = line.match(/https?:\/\/github\.com\/[^\s)]+/gi) ?? [];
  for (const repoUrl of repoUrlMatches) {
    const repoName = repoUrl.replace(/^https?:\/\/github\.com\//i, '');
    mergeDependency(dependencyBucket, {
      name: repoName,
      category: 'github_repo',
      status,
      purpose: line,
      owner: '',
      source: repoUrl,
      license: '',
      env_vars: [],
      data_outbound: false,
      notes: '',
    });
    mergeDecision(decisionBucket, {
      topic: 'External Code',
      choice: repoName,
      status,
      rationale: line,
      decision_date: '',
      notes: '',
    });
  }

  if (/npm package|package|oss|pdf extraction|githubリポジトリ|外部oss/i.test(line)) {
    const pkgCandidates = line.match(/`([^`]+)`|([a-z0-9][a-z0-9-]{2,})/gi) ?? [];
    for (const rawCandidate of pkgCandidates) {
      const candidate = rawCandidate.replace(/`/g, '').trim();
      if (/^(web|high|medium|low|slack|email|openai|anthropic|gemini|supabase)$/i.test(candidate)) continue;
      const category: DependencyCategory = /github/i.test(line)
        ? 'github_repo'
        : /npm package|package/i.test(line)
          ? 'npm_package'
          : 'oss';
      mergeDependency(dependencyBucket, {
        name: candidate,
        category,
        status,
        purpose: line,
        owner: '',
        source: '',
        license: '',
        env_vars: [],
        data_outbound: false,
        notes: '',
      });
    }
  }
}

function extractModelDecisions(
  line: string,
  decisionBucket: Map<string, TechDecisionItem>,
  fallbackStatus: TechDecisionStatus = 'candidate',
) {
  const matches = Array.from(line.matchAll(MODEL_PATTERN));
  for (const match of matches) {
    mergeDecision(decisionBucket, {
      topic: 'Model',
      choice: match[1],
      status: normalizeStatus(line, fallbackStatus),
      rationale: line,
      decision_date: '',
      notes: '',
    });
  }
}

function addStructuredDependency(
  dependencyBucket: Map<string, ExternalDependencyItem>,
  decisionBucket: Map<string, TechDecisionItem>,
  name: string,
  category: DependencyCategory,
  status: TechDecisionStatus,
  purpose: string,
  decisionTopic?: string,
) {
  const canonicalName = canonicalizeStructuredDependencyName(name, category);
  mergeDependency(dependencyBucket, {
    name: canonicalName,
    category,
    status,
    purpose,
    owner: '',
    source: inferDependencySource(canonicalName),
    license: '',
    env_vars: inferEnvVars(canonicalName, category),
    data_outbound: !['oss', 'npm_package', 'github_repo'].includes(category),
    notes: '',
  });

  if (decisionTopic) {
    mergeDecision(decisionBucket, {
      topic: decisionTopic,
      choice: canonicalName,
      status,
      rationale: purpose,
      decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
      notes: '',
    });
  }
}

function addNotificationDependencies(
  value: string,
  line: string,
  fallbackStatus: TechDecisionStatus,
  dependencyBucket: Map<string, ExternalDependencyItem>,
  decisionBucket: Map<string, TechDecisionItem>,
) {
  const primaryStatus = /first|先/i.test(value) ? 'adopted' : normalizeStatus(line, fallbackStatus);
  mergeDecision(decisionBucket, {
    topic: 'Notification',
    choice: value,
    status: primaryStatus,
    rationale: line,
    decision_date: primaryStatus === 'adopted' ? new Date().toISOString().split('T')[0] : '',
    notes: '',
  });

  if (/slack|スラック/i.test(value)) {
    const slackStatus = /first|先/i.test(value) ? 'adopted' : primaryStatus;
    addStructuredDependency(dependencyBucket, decisionBucket, 'Slack', 'notification', slackStatus, line);
  }
  if (/email|メール/i.test(value)) {
    const emailStatus = /later|後で|将来/i.test(value) ? 'candidate' : primaryStatus;
    addStructuredDependency(dependencyBucket, decisionBucket, 'Email provider', 'notification', emailStatus, line);
  }
}

function extractStructuredHints(
  line: string,
  decisionBucket: Map<string, TechDecisionItem>,
  dependencyBucket: Map<string, ExternalDependencyItem>,
  fallbackStatus: TechDecisionStatus,
): boolean {
  const parsed = parseStructuredLine(line);
  if (!parsed) return false;

  const status = normalizeStatus(line, fallbackStatus);
  const value = parsed.value;

  switch (parsed.key) {
    case 'ai_api':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'ai_api', status, line, 'AI API');
      return true;
    case 'ai_model':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'model', status, line, 'Model');
      return true;
    case 'database':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'database', status, line, 'Database');
      return true;
    case 'storage':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'storage', status, line, 'Storage');
      return true;
    case 'db_storage':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'database', status, line, 'Database');
      addStructuredDependency(
        dependencyBucket,
        decisionBucket,
        value.includes('Storage') ? value : `${value} Storage`,
        'storage',
        status,
        line,
        'Storage',
      );
      return true;
    case 'auth':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'auth', status, line, 'Authentication');
      return true;
    case 'pdf_extractor': {
      const category: DependencyCategory = /^https?:\/\/github\.com\//i.test(value)
        ? 'github_repo'
        : /^[a-z0-9][a-z0-9._/-]+$/i.test(value)
          ? 'npm_package'
          : 'oss';
      addStructuredDependency(dependencyBucket, decisionBucket, value, category, status, line, 'PDF extraction');
      return true;
    }
    case 'notification':
      addNotificationDependencies(value, line, fallbackStatus, dependencyBucket, decisionBucket);
      return true;
    case 'framework':
      mergeDecision(decisionBucket, {
        topic: 'Framework',
        choice: value,
        status,
        rationale: line,
        decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
        notes: '',
      });
      return true;
    case 'language':
      mergeDecision(decisionBucket, {
        topic: 'Primary language',
        choice: value,
        status,
        rationale: line,
        decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
        notes: '',
      });
      return true;
    case 'security_level':
      mergeDecision(decisionBucket, {
        topic: 'Security level',
        choice: value,
        status,
        rationale: line,
        decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
        notes: '',
      });
      return true;
    case 'scheduled_jobs':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'batch', status, line, 'Batch / Scheduled Jobs');
      return true;
    case 'repo_style':
    case 'name':
    case 'slug':
    case 'domains':
    case 'phases':
      return true;
  }
}

function buildDefaultTechDecisions(state: FormState): TechDecisionItem[] {
  const items: TechDecisionItem[] = [
    {
      topic: 'Primary language',
      choice: state.tech.primary_language,
      status: 'adopted',
      rationale: 'RepoGenesis の初期生成で選択済み',
      decision_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  ];

  if (state.tech.frameworks.length > 0) {
    items.push({
      topic: 'Framework',
      choice: state.tech.frameworks.join(', '),
      status: 'adopted',
      rationale: 'RepoGenesis の初期生成で選択済み',
      decision_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  }

  return items;
}

export function derivePlanningSuggestions(input: PlanningSuggestionInput): FormState['planning'] {
  const decisionBucket = new Map<string, TechDecisionItem>();
  const dependencyBucket = new Map<string, ExternalDependencyItem>();

  for (const item of buildDefaultTechDecisions(input.currentState)) {
    mergeDecision(decisionBucket, item);
  }

  const candidateLines = splitLines(input.candidateText);
  const externalLines = splitLines(input.externalText);
  const knownLines = new Set([...candidateLines, ...externalLines]);
  const combinedLines = splitLines(input.combinedText).filter((line) => !knownLines.has(line));

  for (const line of candidateLines) {
    if (extractStructuredHints(line, decisionBucket, dependencyBucket, 'adopted')) continue;
    extractInlineDecision(line, decisionBucket, dependencyBucket, 'adopted');
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'adopted');
    extractModelDecisions(line, decisionBucket, 'adopted');
  }

  for (const line of externalLines) {
    if (extractStructuredHints(line, decisionBucket, dependencyBucket, 'candidate')) continue;
    extractInlineDecision(line, decisionBucket, dependencyBucket, 'candidate');
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'candidate');
    extractModelDecisions(line, decisionBucket, 'candidate');
  }

  for (const line of combinedLines) {
    if (extractStructuredHints(line, decisionBucket, dependencyBucket, 'candidate')) continue;
    extractInlineDecision(line, decisionBucket, dependencyBucket, 'candidate');
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'candidate');
    extractModelDecisions(line, decisionBucket, 'candidate');
  }

  return {
    tech_decisions: Array.from(decisionBucket.values()),
    external_dependencies: Array.from(dependencyBucket.values()),
  };
}
