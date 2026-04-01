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
  referenceText?: string;
  openQuestionText?: string;
  combinedText: string;
}

type StructuredHintKey =
  | 'name'
  | 'slug'
  | 'domains'
  | 'language'
  | 'framework'
  | 'architecture'
  | 'core_feature'
  | 'audio_processing'
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
  | 'scheduled_jobs'
  | 'dependency'
  | 'environment';

type TechDecisionItem = FormState['planning']['tech_decisions'][number];
type ExternalDependencyItem = FormState['planning']['external_dependencies'][number];
type CanonicalPrimaryLanguage = FormState['tech']['primary_language'];

interface ReferenceRepoMatch {
  name: string;
  source: string;
}

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

function stripListMarker(line: string): string {
  return line.replace(/^(?:[-*•・]\s*|\d+[.)]\s*)/, '').trim();
}

function splitLines(...texts: Array<string | undefined>): string[] {
  return texts
    .flatMap((text) => (text ?? '').split('\n'))
    .map(stripListMarker)
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
  if (/^(architecture|workflow architecture|pipeline architecture|処理構造|処理フロー|処理パイプライン|アーキテクチャ)$/.test(normalized)) return 'architecture';
  if (/^(core feature|core features|key feature|key features|主要機能|コア機能)$/.test(normalized)) return 'core_feature';
  if (/^(audio processing|audio processing library|audio processing libraries|audio dependencies|audio stack|音声処理|音声処理ライブラリ|音声処理依存)$/.test(normalized)) return 'audio_processing';
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
  if (/^(dependency|dependencies|external dependency|external dependencies|外部依存|外部依存候補)$/.test(normalized)) return 'dependency';
  if (/^(environment|execution environment|target environment|実行環境|対象環境)$/.test(normalized)) return 'environment';
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
  if (category === 'model' && lowered.includes('qwen')) return 'self-hosted Qwen';
  if (category === 'ocr') return lowered.includes('ocr') ? 'OCR service' : value;
  return value;
}

function canonicalizeModelChoice(value: string): string {
  const lowered = value.trim().toLowerCase();
  if (lowered.includes('qwen')) return 'self-hosted Qwen';
  return value.trim();
}

function normalizePrimaryLanguageName(value: string): CanonicalPrimaryLanguage | null {
  const normalized = value.trim().toLowerCase().replace(/[()（）「」『』[\]]/g, ' ');
  if (!normalized) return null;

  if (/\btypescript\b|type\s*script/.test(normalized)) return 'typescript';
  if (/\bpython\b|python\s*3/.test(normalized)) return 'python';
  if (/\bc#\b|\bcsharp\b|c\s*sharp/.test(normalized)) return 'csharp';
  if (/\bswift\b/.test(normalized)) return 'swift';
  if (/\bgo\b|golang/.test(normalized)) return 'go';
  if (/\brust\b/.test(normalized)) return 'rust';
  if (/\bkotlin\b/.test(normalized)) return 'kotlin';
  if (/その他|other/.test(normalized)) return 'other';
  return null;
}

function normalizePrimaryLanguageChoices(value: string): CanonicalPrimaryLanguage[] {
  return splitStructuredListValue(value)
    .map((item) => normalizePrimaryLanguageName(item))
    .filter((language): language is CanonicalPrimaryLanguage => language !== null)
    .filter((language, index, list) => list.indexOf(language) === index);
}

function normalizeFrameworkName(value: string): string {
  const normalized = value.trim().replace(/[()（）「」『』[\]]/g, '');
  if (!normalized) return '';

  const lowered = normalized.toLowerCase();
  if (/^next(?:\.js|js)?$/.test(lowered)) return 'Next.js';
  if (/^fast\s*api$/.test(lowered) || lowered === 'fastapi') return 'FastAPI';
  if (/^react$/.test(lowered)) return 'React';
  if (/^vite$/.test(lowered)) return 'Vite';
  if (/^typer$/.test(lowered)) return 'Typer';
  if (/^nuxt(?:\.js|js)?$/.test(lowered)) return 'Nuxt.js';
  if (/^vue(?:\.js|js)?$/.test(lowered)) return 'Vue.js';
  if (/^svelte\s*kit$/.test(lowered) || lowered === 'sveltekit') return 'SvelteKit';
  return normalized;
}

function normalizeFrameworkChoices(value: string): string[] {
  return value
    .split(/\s*(?:、|,|\/|\n|\s+\+\s+|\s+＆\s+|\s*&\s+|\sand\s)\s*/i)
    .map((item) => normalizeFrameworkName(item))
    .filter(Boolean)
    .filter((framework, index, list) => list.indexOf(framework) === index);
}

function inferDependencySource(name: string): string {
  const lowered = name.toLowerCase();
  if (lowered.includes('openai')) return 'https://platform.openai.com/';
  if (lowered.includes('anthropic')) return 'https://www.anthropic.com/api';
  if (lowered.includes('gemini')) return 'https://ai.google.dev/';
  if (lowered === 'librosa') return 'https://librosa.org/';
  if (lowered === 'numpy') return 'https://numpy.org/';
  if (lowered === 'soundfile') return 'https://python-soundfile.readthedocs.io/';
  if (lowered.includes('supabase')) return 'https://supabase.com/';
  if (lowered.includes('slack')) return 'https://api.slack.com/';
  if (lowered.includes('resend')) return 'https://resend.com/';
  if (lowered.includes('sendgrid')) return 'https://sendgrid.com/';
  return '';
}

function inferDependencyLicense(name: string): string {
  const lowered = name.toLowerCase();
  if (lowered === 'librosa') return 'ISC';
  if (lowered === 'numpy') return 'BSD-3-Clause';
  if (lowered === 'soundfile') return 'BSD-3-Clause';
  return '';
}

function inferAudioProcessingPurpose(name: string): string {
  const lowered = name.toLowerCase();
  if (lowered === 'librosa') return 'Audio analysis and feature extraction for expressive post-processing';
  if (lowered === 'numpy') return 'Numeric processing for parameter and waveform operations';
  if (lowered === 'soundfile') return 'Read and write wav artifacts for the first workflow';
  return 'Support the first audio post-processing workflow';
}

function normalizeSecurityDecisionChoice(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (/\bhigh\b|高/.test(normalized)) return 'high';
  if (/\bmedium\b|中/.test(normalized)) return 'medium';
  if (/\blow\b|低/.test(normalized)) return 'low';
  return value;
}

function normalizeGithubRepoUrl(repoUrl: string): string | null {
  const trimmed = repoUrl.trim().replace(/[),.]+$/, '');
  const match = trimmed.match(/^https?:\/\/github\.com\/([^/\s?#]+\/[^/\s?#]+)(?:[/?#].*)?$/i);
  if (!match) return null;
  return `https://github.com/${match[1]}`;
}

function buildReferenceRepoIndex(lines: string[]): Map<string, ReferenceRepoMatch> {
  const index = new Map<string, ReferenceRepoMatch>();

  for (const line of lines) {
    const repoUrlMatches = line.match(/https?:\/\/github\.com\/[^\s)]+/gi) ?? [];
    for (const rawRepoUrl of repoUrlMatches) {
      const normalizedUrl = normalizeGithubRepoUrl(rawRepoUrl);
      if (!normalizedUrl) continue;

      const repoName = normalizedUrl.replace(/^https?:\/\/github\.com\//i, '');
      const repoBaseName = repoName.split('/').at(-1);
      const match = { name: repoName, source: normalizedUrl };

      index.set(repoName.toLowerCase(), match);
      if (repoBaseName) index.set(repoBaseName.toLowerCase(), match);
    }
  }

  return index;
}

function addGithubDependency(
  dependencyBucket: Map<string, ExternalDependencyItem>,
  decisionBucket: Map<string, TechDecisionItem>,
  repo: ReferenceRepoMatch,
  line: string,
  status: TechDecisionStatus,
) {
  mergeDependency(dependencyBucket, {
    name: repo.name,
    category: 'github_repo',
    status,
    purpose: line,
    owner: '',
    source: repo.source,
    license: '',
    env_vars: [],
    data_outbound: false,
    notes: '',
  });
  mergeDecision(decisionBucket, {
    topic: 'External Code',
    choice: repo.name,
    status,
    rationale: line,
    decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
    notes: '',
  });
}

function resolveNamedReferenceRepos(line: string, referenceRepoIndex: Map<string, ReferenceRepoMatch>): ReferenceRepoMatch[] {
  if (referenceRepoIndex.size === 0) return [];

  const lowered = line.toLowerCase();
  const matches = new Map<string, ReferenceRepoMatch>();

  for (const [alias, repo] of referenceRepoIndex.entries()) {
    if (lowered.includes(alias)) {
      matches.set(repo.name.toLowerCase(), repo);
    }
  }

  return Array.from(matches.values());
}

function extractMentionedGithubRepoNames(line: string): string[] {
  const candidates = new Set<string>();
  const namedMatches = Array.from(
    line.matchAll(/github(?:上)?(?:の|にある)?\s+([A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)?)/gi),
  );

  for (const match of namedMatches) {
    const candidate = match[1]?.trim().replace(/[),.]+$/, '');
    if (candidate) candidates.add(candidate);
  }

  return Array.from(candidates);
}

function extractReferencedGithubDependencies(
  line: string,
  dependencyBucket: Map<string, ExternalDependencyItem>,
  decisionBucket: Map<string, TechDecisionItem>,
  fallbackStatus: TechDecisionStatus,
  referenceRepoIndex: Map<string, ReferenceRepoMatch>,
) {
  const status = normalizeStatus(line, fallbackStatus);
  const resolved = new Map<string, ReferenceRepoMatch>();

  for (const repo of resolveNamedReferenceRepos(line, referenceRepoIndex)) {
    resolved.set(repo.name.toLowerCase(), repo);
  }

  for (const repoName of extractMentionedGithubRepoNames(line)) {
    const indexed = referenceRepoIndex.get(repoName.toLowerCase());
    const normalizedName = indexed?.name ?? repoName;
    resolved.set(normalizedName.toLowerCase(), {
      name: normalizedName,
      source: indexed?.source ?? '',
    });
  }

  for (const repo of resolved.values()) {
    addGithubDependency(dependencyBucket, decisionBucket, repo, line, status);
  }
}

function inferOpenQuestionDecision(line: string): { topic: string; choice: string } | null {
  if (/機密情報|社内限定|外部展開|情報の扱い範囲|公開範囲/i.test(line)) {
    return { topic: 'Data sensitivity boundary', choice: '社内限定 / 外部展開の境界' };
  }
  if (/ライセンス|商用利用/i.test(line)) {
    return { topic: 'Licensing', choice: '商用利用条件' };
  }
  if (/(unity|ユニティ)/i.test(line) && /(連携|api|ファイル)/i.test(line)) {
    return { topic: 'Unity handoff', choice: 'Unity連携方式' };
  }
  if (/リアルタイム|real-?time/i.test(line)) {
    return { topic: 'Runtime mode', choice: 'リアルタイム対応' };
  }
  if (/文字起こし|transcription|asr|音声認識/i.test(line) && /(方式|backend|バックエンド|モデル|精度|ローカル処理|候補)/i.test(line)) {
    return { topic: 'Transcription backend', choice: '文字起こし方式' };
  }
  if (/議事録生成|要約|summary|決定事項|todo|action item|アクションアイテム/i.test(line)) {
    return { topic: 'Minutes generation', choice: '議事録生成 / 要約の自動化' };
  }
  if (/保存場所|保存先|共有ストレージ|ローカル保存|google drive|notion/i.test(line)) {
    return { topic: 'Transcript storage', choice: '保存場所 / 共有方法' };
  }
  if (/話者分離|speaker separation|diarization/i.test(line)) {
    return { topic: 'Speaker separation', choice: '話者分離の初期スコープ' };
  }
  if (/(感情パラメータ|emotion|pitch|speed|breath|break|prosody)/i.test(line) && /(ルールベース|llm|生成|方式|parameter|パラメータ)/i.test(line)) {
    return { topic: 'Emotion parameter generation', choice: '感情パラメータ生成方式' };
  }
  if (/話者|speaker/i.test(line)) {
    return { topic: 'Speaker support', choice: '単一話者 / 複数話者' };
  }
  if (/(^|[^a-z])ui([^a-z]|$)|画面|interface/i.test(line)) {
    return { topic: 'Operator interface', choice: 'CLI / UI の優先度' };
  }
  if (/(tts|irodori)/i.test(line) && /(ローカル実行|他方式|利用|実行方式)/i.test(line)) {
    return { topic: 'External Code', choice: 'TTS利用方式' };
  }
  return null;
}

function extractOpenQuestionHints(
  line: string,
  decisionBucket: Map<string, TechDecisionItem>,
  dependencyBucket: Map<string, ExternalDependencyItem>,
  referenceRepoIndex: Map<string, ReferenceRepoMatch>,
) {
  extractReferencedGithubDependencies(line, dependencyBucket, decisionBucket, 'open', referenceRepoIndex);

  const inferred = inferOpenQuestionDecision(line);
  if (!inferred) return;

  mergeDecision(decisionBucket, {
    topic: inferred.topic,
    choice: inferred.choice,
    status: 'open',
    rationale: line,
    decision_date: '',
    notes: '',
  });
}

function extractImplicitDecisionHints(
  line: string,
  decisionBucket: Map<string, TechDecisionItem>,
  fallbackStatus: TechDecisionStatus,
) {
  const status = normalizeStatus(line, fallbackStatus);

  if (/\btyper\b/i.test(line)) {
    mergeDecision(decisionBucket, {
      topic: 'Framework',
      choice: 'Typer',
      status,
      rationale: line,
      decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
      notes: '',
    });
  }

  if (/fastapi/i.test(line)) {
    mergeDecision(decisionBucket, {
      topic: 'API framework',
      choice: 'FastAPI',
      status,
      rationale: line,
      decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
      notes: '',
    });
  }
}

function normalizeStructuredValue(value: string): string {
  return value
    .trim()
    .replace(/\s*(を|が|に)?\s*(採用|利用|使用)(する|したい|予定)?$/u, '')
    .replace(/\s*(を|が|に)?\s*想定(する|したい|です)?$/u, '')
    .replace(/\s*(が|は)\s*候補(です)?$/u, '')
    .replace(/\s*(は|が)\s*未確定(です)?$/u, '')
    .replace(/\s*(を|が)?\s*必須(です)?$/u, '')
    .replace(/\s*(を|に)?\s*含む(こと)?$/u, '')
    .replace(/\s*(を|に)?\s*追加(する|したい|予定)?$/u, '')
    .replace(/\s*(を|に)?\s*入れる(こと)?$/u, '')
    .trim();
}

function splitStructuredListValue(value: string): string[] {
  return value
    .split(/\s*(?:、|,|\/|・|\band\b|\n|\s+と\s+|\s+\+\s+|\s+＆\s+|\s*&\s+)\s*/i)
    .map((item) => stripListMarker(item).replace(/[.)。]+$/, ''))
    .filter(Boolean);
}

function parseStructuredLine(line: string): { key: StructuredHintKey; value: string } | null {
  const colonMatch = line.match(/^([^:：]{2,80})[:：]\s*(.+)$/);
  if (colonMatch) {
    const key = normalizeStructuredHintKey(colonMatch[1]);
    const value = normalizeStructuredValue(colonMatch[2]);
    if (key && value) return { key, value };
  }

  const waMatch = line.match(/^(.{2,80}?)\s*は\s*(.+)$/u);
  if (waMatch) {
    const key = normalizeStructuredHintKey(waMatch[1]);
    if (!key) return null;

    const value = normalizeStructuredValue(waMatch[2]);
    if (!value) return null;
    return { key, value };
  }

  const niMatch = line.match(/^(.{2,80}?)\s*に\s*(.+)$/u);
  if (!niMatch) return null;

  const key = normalizeStructuredHintKey(niMatch[1]);
  if (!key) return null;

  const value = normalizeStructuredValue(niMatch[2]);
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
    license: inferDependencyLicense(matcher.name),
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
      license: inferDependencyLicense(candidate),
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
    const choice = canonicalizeModelChoice(match[1]);
    mergeDecision(decisionBucket, {
      topic: 'Model',
      choice,
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
    license: inferDependencyLicense(canonicalName),
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
  referenceRepoIndex: Map<string, ReferenceRepoMatch>,
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
    case 'dependency': {
      const referencedRepos = new Map<string, ReferenceRepoMatch>();
      for (const repo of resolveNamedReferenceRepos(line, referenceRepoIndex)) {
        referencedRepos.set(repo.name.toLowerCase(), repo);
      }
      for (const repoName of extractMentionedGithubRepoNames(line)) {
        const indexed = referenceRepoIndex.get(repoName.toLowerCase());
        const normalizedName = indexed?.name ?? repoName;
        referencedRepos.set(normalizedName.toLowerCase(), {
          name: normalizedName,
          source: indexed?.source ?? '',
        });
      }
      if (referencedRepos.size > 0) {
        for (const repo of referencedRepos.values()) {
          addGithubDependency(dependencyBucket, decisionBucket, repo, line, status);
        }
        return true;
      }

      const category: DependencyCategory = /^https?:\/\/github\.com\//i.test(value)
        ? 'github_repo'
        : /^[a-z0-9][a-z0-9._/-]+$/i.test(value)
          ? 'npm_package'
          : 'oss';
      addStructuredDependency(dependencyBucket, decisionBucket, value, category, status, line, 'External Code');
      return true;
    }
    case 'notification':
      addNotificationDependencies(value, line, fallbackStatus, dependencyBucket, decisionBucket);
      return true;
    case 'framework':
      {
        const frameworks = normalizeFrameworkChoices(value);
        if (frameworks.length === 0) return true;
        mergeDecision(decisionBucket, {
          topic: 'Framework',
          choice: frameworks.join(', '),
          status,
          rationale: line,
          decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
          notes: '',
        });
        return true;
      }
    case 'architecture':
      mergeDecision(decisionBucket, {
        topic: 'Core workflow architecture',
        choice: value.replace(/\s*(?:→|⇒|=>)\s*/g, ' -> '),
        status,
        rationale: line,
        decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
        notes: '',
      });
      return true;
    case 'core_feature':
      for (const feature of splitStructuredListValue(value)) {
        mergeDecision(decisionBucket, {
          topic: 'Core feature',
          choice: feature,
          status,
          rationale: line,
          decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
          notes: '',
        });
      }
      return true;
    case 'audio_processing': {
      const libraries = splitStructuredListValue(value);
      if (libraries.length === 0) return true;

      mergeDecision(decisionBucket, {
        topic: 'Audio processing stack',
        choice: libraries.join(', '),
        status,
        rationale: line,
        decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
        notes: '',
      });

      for (const library of libraries) {
        const canonicalName = canonicalizeStructuredDependencyName(library, 'oss');
        mergeDependency(dependencyBucket, {
          name: canonicalName,
          category: 'oss',
          status,
          purpose: inferAudioProcessingPurpose(canonicalName),
          owner: '',
          source: inferDependencySource(canonicalName),
          license: inferDependencyLicense(canonicalName),
          env_vars: [],
          data_outbound: false,
          notes: line,
        });
      }
      return true;
    }
    case 'language':
      {
        const languages = normalizePrimaryLanguageChoices(value);
        if (languages.length === 0) return true;

        mergeDecision(decisionBucket, {
          topic: 'Primary language',
          choice: languages[0],
          status,
          rationale: line,
          decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
          notes: '',
        });

        for (const supportingLanguage of languages.slice(1)) {
          mergeDecision(decisionBucket, {
            topic: 'Supporting language',
            choice: supportingLanguage,
            status,
            rationale: line,
            decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
            notes: '',
          });
        }
      }
      return true;
    case 'security_level':
      mergeDecision(decisionBucket, {
        topic: 'Security level',
        choice: normalizeSecurityDecisionChoice(value),
        status,
        rationale: line,
        decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
        notes: '',
      });
      return true;
    case 'scheduled_jobs':
      addStructuredDependency(dependencyBucket, decisionBucket, value, 'batch', status, line, 'Batch / Scheduled Jobs');
      return true;
    case 'environment':
      mergeDecision(decisionBucket, {
        topic: 'Execution environment',
        choice: value,
        status,
        rationale: line,
        decision_date: status === 'adopted' ? new Date().toISOString().split('T')[0] : '',
        notes: '',
      });
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

function dedupeNotificationDecisions(items: TechDecisionItem[]): TechDecisionItem[] {
  const adoptedNotificationChoices = items
    .filter((item) => item.topic === 'Notification' && item.status === 'adopted')
    .map((item) => item.choice.toLowerCase())
    .join(' ');

  if (!adoptedNotificationChoices) return items;

  return items.filter((item) => {
    if (item.topic !== 'Notification' || item.status === 'adopted') return true;

    const choice = item.choice.toLowerCase();
    if (choice === 'slack' && adoptedNotificationChoices.includes('slack')) return false;
    if ((choice === 'email provider' || choice.includes('email')) && /email|メール/.test(adoptedNotificationChoices)) {
      return false;
    }

    return true;
  });
}

function dedupeFrameworkDecisions(items: TechDecisionItem[]): TechDecisionItem[] {
  const explicitFrameworkChoices = new Set(
    items
      .filter((item) => item.topic === 'Framework')
      .flatMap((item) => normalizeFrameworkChoices(item.choice))
      .map((choice) => choice.toLowerCase()),
  );

  if (explicitFrameworkChoices.size === 0) return items;

  return items.filter((item) => {
    if (item.topic !== 'API framework') return true;

    const apiFrameworkChoices = normalizeFrameworkChoices(item.choice);
    return apiFrameworkChoices.some((choice) => !explicitFrameworkChoices.has(choice.toLowerCase()));
  });
}

export function derivePlanningSuggestions(input: PlanningSuggestionInput): FormState['planning'] {
  const decisionBucket = new Map<string, TechDecisionItem>();
  const dependencyBucket = new Map<string, ExternalDependencyItem>();

  for (const item of buildDefaultTechDecisions(input.currentState)) {
    mergeDecision(decisionBucket, item);
  }

  const candidateLines = splitLines(input.candidateText);
  const externalLines = splitLines(input.externalText);
  const referenceLines = splitLines(input.referenceText);
  const openQuestionLines = splitLines(input.openQuestionText);
  const knownLines = new Set([...candidateLines, ...externalLines, ...referenceLines, ...openQuestionLines]);
  const combinedLines = splitLines(input.combinedText).filter((line) => !knownLines.has(line));
  const referenceRepoIndex = buildReferenceRepoIndex(referenceLines);

  for (const line of candidateLines) {
    if (extractStructuredHints(line, decisionBucket, dependencyBucket, 'adopted', referenceRepoIndex)) continue;
    extractInlineDecision(line, decisionBucket, dependencyBucket, 'adopted');
    extractImplicitDecisionHints(line, decisionBucket, 'adopted');
    extractReferencedGithubDependencies(line, dependencyBucket, decisionBucket, 'adopted', referenceRepoIndex);
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'adopted');
    extractModelDecisions(line, decisionBucket, 'adopted');
  }

  for (const line of externalLines) {
    if (extractStructuredHints(line, decisionBucket, dependencyBucket, 'candidate', referenceRepoIndex)) continue;
    extractInlineDecision(line, decisionBucket, dependencyBucket, 'candidate');
    extractImplicitDecisionHints(line, decisionBucket, 'candidate');
    extractReferencedGithubDependencies(line, dependencyBucket, decisionBucket, 'candidate', referenceRepoIndex);
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'candidate');
    extractModelDecisions(line, decisionBucket, 'candidate');
  }

  for (const line of referenceLines) {
    extractImplicitDecisionHints(line, decisionBucket, 'candidate');
    extractReferencedGithubDependencies(line, dependencyBucket, decisionBucket, 'candidate', referenceRepoIndex);
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'candidate');
  }

  for (const line of openQuestionLines) {
    if (extractStructuredHints(line, decisionBucket, dependencyBucket, 'open', referenceRepoIndex)) continue;
    extractInlineDecision(line, decisionBucket, dependencyBucket, 'open');
    extractImplicitDecisionHints(line, decisionBucket, 'open');
    extractOpenQuestionHints(line, decisionBucket, dependencyBucket, referenceRepoIndex);
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'open');
    extractModelDecisions(line, decisionBucket, 'open');
  }

  for (const line of combinedLines) {
    if (extractStructuredHints(line, decisionBucket, dependencyBucket, 'candidate', referenceRepoIndex)) continue;
    extractInlineDecision(line, decisionBucket, dependencyBucket, 'candidate');
    extractImplicitDecisionHints(line, decisionBucket, 'candidate');
    extractReferencedGithubDependencies(line, dependencyBucket, decisionBucket, 'candidate', referenceRepoIndex);
    extractGenericDependencies(line, dependencyBucket, decisionBucket, 'candidate');
    extractModelDecisions(line, decisionBucket, 'candidate');
  }

  return {
    tech_decisions: dedupeFrameworkDecisions(dedupeNotificationDecisions(Array.from(decisionBucket.values()))),
    external_dependencies: Array.from(dependencyBucket.values()),
  };
}
