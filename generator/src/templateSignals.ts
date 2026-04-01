import type { ProjectBrief } from './schema';
import { getDependenciesByStatus } from './planning';

const CLI_PATTERN = /\bcli\b|command line|コマンドライン|コマンド|terminal|ターミナル/i;
const TTS_PATTERN = /\btts\b|text[- ]to[- ]speech|speech synthesis|voice synthesis|voice generation|irodori|音声合成|読み上げ|発話/i;
const TRANSCRIPTION_PATTERN = /\btranscription\b|speech[- ]to[- ]text|\basr\b|whisper|文字起こし|書き起こし|議事録|議事録作成|会議ログ|音声認識/i;
const AUDIO_PATTERN = /\baudio\b|\bvoice\b|\bspeech\b|\bwav\b|\bmp3\b|音声/i;
const UNITY_PATTERN = /\bunity\b|ユニティ/i;
const PIPELINE_PATTERN = /pipeline|パイプライン|前処理|後処理|post[- ]?process|post[- ]?processing|pre[- ]?process|pre[- ]?processing/i;
const TUNABLE_PARAMETER_PATTERN = /pitch|speed|rate|tempo|breath|break|prosody|emotion|感情|パラメータ/i;
const EXPLICIT_PIPELINE_TOPIC_PATTERN = /core workflow architecture|workflow architecture|pipeline architecture/i;
const CORE_FEATURE_TOPIC_PATTERN = /core feature/i;
const SUPPORTING_LANGUAGE_TOPIC_PATTERN = /supporting language/i;
const TRANSCRIPT_SEGMENTATION_TOPIC_PATTERN = /transcript segmentation/i;
const CANONICAL_TRANSCRIPT_FORMAT_TOPIC_PATTERN = /canonical transcript format/i;
const TRANSCRIPT_EXPORT_TOPIC_PATTERN = /transcript export/i;
const AUTOSAVE_TOPIC_PATTERN = /autosave/i;
const WINDOWS_HOST_PATTERN = /\bwindows\b|windows\s+\d+|win11|win10/i;
const GPU_HOST_PATTERN = /\brtx\s*\d{3,4}\b|\bgpu\b|cuda/i;
const MAC_CLIENT_PATTERN = /\bfrom mac(?:os)?\b|reachable from mac(?:os)?|mac(?:os)? client|macから|mac から|mac上|mac からも/i;
const BROWSER_CLIENT_PATTERN = /\bbrowser\b|ブラウザ|webui|web ui|web-ui/i;
const WEB_UI_FRAMEWORK_PATTERN = /\bnext(?:\.js|js)?\b|\breact\b|\bvue(?:\.js|js)?\b|\bnuxt(?:\.js|js)?\b|\bsvelte\s*kit\b|\bsveltekit\b|\bvite\b/i;
const DESKTOP_UI_FRAMEWORK_PATTERN = /\belectron\b|\btauri\b/i;
const DESKTOP_APP_PATTERN = /\bdesktop\b|デスクトップアプリ|デスクトップ|ローカルデスクトップ/i;
const TRANSCRIPTION_CONTROL_PATTERN = /話者分離|speaker|diarization|timestamp|タイムスタンプ|segment|chunk|vad|language|言語|議事録|要約|markdown|保存形式|出力形式/i;

function splitListChoice(choice: string): string[] {
  return choice
    .split(/\s*(?:、|,|\/|・|\band\b|\n)\s*/i)
    .map((item) => item.trim().replace(/^[-*]\s*/, '').replace(/[.)。]+$/, ''))
    .filter(Boolean);
}

function extractPlanningChoiceValues(
  brief: ProjectBrief,
  topicPattern: RegExp,
  statuses: Array<ProjectBrief['planning']['tech_decisions'][number]['status']> = ['adopted', 'candidate'],
): string[] {
  const planning = brief.planning ?? { tech_decisions: [], external_dependencies: [] };
  return planning.tech_decisions
    .filter((item) => statuses.includes(item.status) && topicPattern.test(item.topic) && item.choice.trim())
    .map((item) => item.choice.trim());
}

function extractExplicitPipelineStages(brief: ProjectBrief): string[] {
  const pipelineChoices = extractPlanningChoiceValues(brief, EXPLICIT_PIPELINE_TOPIC_PATTERN);
  for (const choice of pipelineChoices) {
    if (!/(->|→|⇒|=>)/.test(choice)) continue;
    const stages = choice
      .replace(/\s*(?:→|⇒|=>)\s*/g, ' -> ')
      .split(/\s*->\s*/)
      .map((stage) => stage.trim().replace(/^[-*]\s*/, '').replace(/[.)。]+$/, ''))
      .filter(Boolean);
    if (stages.length > 1) return stages;
  }
  return [];
}

export interface BriefSignals {
  hasAi: boolean;
  hasCli: boolean;
  hasWeb: boolean;
  hasUnity: boolean;
  hasAudio: boolean;
  hasTts: boolean;
  hasTranscription: boolean;
  hasPipeline: boolean;
  hasTunableParameters: boolean;
  hasTranscriptionControls: boolean;
  hasDistributedRuntimeBoundary: boolean;
  hasWindowsGpuHost: boolean;
  hasBrowserClient: boolean;
  hasMacClient: boolean;
  hasDesktopApp: boolean;
  hasOperatorFacingUi: boolean;
  hasStableCliSurface: boolean;
}

export function collectBriefContextText(brief: ProjectBrief): string {
  const planning = brief.planning ?? { tech_decisions: [], external_dependencies: [] };
  const decisionText = planning.tech_decisions
    .map((item) => [item.topic, item.choice, item.rationale, item.notes].filter(Boolean).join(' '))
    .join('\n');
  const dependencyText = planning.external_dependencies
    .map((item) => [item.name, item.purpose, item.source, item.notes].filter(Boolean).join(' '))
    .join('\n');
  const repoText = brief.structure.repos
    .map((repo) => [repo.name, repo.type, repo.description].filter(Boolean).join(' '))
    .join('\n');

  return [
    brief.project.name,
    brief.project.description,
    brief.tech.domains.join(' '),
    brief.tech.frameworks.join(' '),
    decisionText,
    dependencyText,
    repoText,
  ].join('\n');
}

export function inferBriefSignals(brief: ProjectBrief): BriefSignals {
  const text = collectBriefContextText(brief);
  const planning = brief.planning ?? { tech_decisions: [], external_dependencies: [] };
  const frameworkText = [
    brief.tech.frameworks.join(' '),
    ...planning.tech_decisions
      .filter((item) => /framework/i.test(item.topic))
      .map((item) => item.choice),
  ].join(' ');
  const operatorInterfaceText = planning.tech_decisions
    .filter((item) => /operator interface/i.test(item.topic))
    .map((item) => [item.choice, item.rationale, item.notes].filter(Boolean).join(' '))
    .join(' ');
  const hasAi = brief.tech.domains.includes('ai') || /\bai\b|\bllm\b|生成ai|生成 ai|model/i.test(text);
  const hasCli = brief.tech.domains.includes('cli') || CLI_PATTERN.test(text);
  const hasTts = TTS_PATTERN.test(text);
  const hasTranscription = TRANSCRIPTION_PATTERN.test(text);
  const hasWindowsHost = WINDOWS_HOST_PATTERN.test(text);
  const hasGpuHost = GPU_HOST_PATTERN.test(text);
  const hasMacClient = MAC_CLIENT_PATTERN.test(text);
  const hasBrowserClient = BROWSER_CLIENT_PATTERN.test(text);
  const hasDesktopApp = DESKTOP_APP_PATTERN.test(text) || DESKTOP_UI_FRAMEWORK_PATTERN.test(frameworkText);
  const hasDistributedRuntimeBoundary = hasWindowsHost && hasGpuHost && (hasMacClient || hasBrowserClient);
  const hasOperatorFacingUi = brief.tech.domains.includes('web')
    || hasBrowserClient
    || hasDesktopApp
    || WEB_UI_FRAMEWORK_PATTERN.test(frameworkText)
    || DESKTOP_UI_FRAMEWORK_PATTERN.test(frameworkText)
    || /\bui\b|画面|ブラウザ|web ui|desktop|デスクトップ/i.test(operatorInterfaceText);
  const hasStableCliSurface = brief.tech.frameworks.some((framework) => /typer/i.test(framework))
    || planning.tech_decisions.some((item) =>
      /framework/i.test(item.topic) && /typer/i.test(item.choice))
    || planning.tech_decisions.some((item) =>
      /operator interface/i.test(item.topic)
      && item.status !== 'open'
      && CLI_PATTERN.test([item.choice, item.rationale, item.notes].filter(Boolean).join(' ')))
    || (brief.tech.domains.includes('cli') && CLI_PATTERN.test(text));

  return {
    hasAi,
    hasCli,
    hasWeb: brief.tech.domains.includes('web'),
    hasUnity: brief.tech.domains.includes('unity') || UNITY_PATTERN.test(text),
    hasAudio: hasTts || hasTranscription || AUDIO_PATTERN.test(text),
    hasTts,
    hasTranscription,
    hasPipeline: hasTts || hasTranscription || PIPELINE_PATTERN.test(text) || (hasAi && hasCli),
    hasTunableParameters: hasTts || TUNABLE_PARAMETER_PATTERN.test(text),
    hasTranscriptionControls: hasTranscription && TRANSCRIPTION_CONTROL_PATTERN.test(text),
    hasDistributedRuntimeBoundary,
    hasWindowsGpuHost: hasWindowsHost && hasGpuHost,
    hasBrowserClient,
    hasMacClient,
    hasDesktopApp,
    hasOperatorFacingUi,
    hasStableCliSurface,
  };
}

export function hasOperatorFacingUi(brief: ProjectBrief): boolean {
  return inferBriefSignals(brief).hasOperatorFacingUi;
}

export function hasStableCliSurface(brief: ProjectBrief): boolean {
  return inferBriefSignals(brief).hasStableCliSurface;
}

export function inferPipelineStages(brief: ProjectBrief): string[] {
  const explicitStages = extractExplicitPipelineStages(brief);
  if (explicitStages.length > 0) {
    return explicitStages;
  }

  const signals = inferBriefSignals(brief);

  if (signals.hasTts) {
    return ['parameter preparation', 'synthesis / generation', 'post-processing / export'];
  }

  if (signals.hasTranscription) {
    return ['audio capture / ingest', 'transcription', 'review / save / export'];
  }

  if (signals.hasAi && signals.hasCli) {
    return ['input normalization', 'generation or external processing', 'post-processing / output emission'];
  }

  if (signals.hasAi) {
    return ['input preparation', 'model-driven processing', 'result shaping'];
  }

  if (signals.hasCli) {
    return ['argument parsing', 'core processing', 'output emission'];
  }

  return [];
}

export function summarizeCoreFeatures(brief: ProjectBrief, max = 4): string[] {
  const features = extractPlanningChoiceValues(brief, CORE_FEATURE_TOPIC_PATTERN)
    .flatMap((choice) => splitListChoice(choice));
  return Array.from(new Set(features)).slice(0, max);
}

export function summarizeSupportingLanguages(brief: ProjectBrief, max = 3): string[] {
  const languages = extractPlanningChoiceValues(brief, SUPPORTING_LANGUAGE_TOPIC_PATTERN)
    .flatMap((choice) => splitListChoice(choice))
    .map((choice) => choice.toLowerCase());
  return Array.from(new Set(languages)).slice(0, max);
}

export function summarizeDependencyNames(
  brief: ProjectBrief,
  status: 'adopted' | 'candidate' | 'open' | 'rejected',
  max = 4,
): string[] {
  return getDependenciesByStatus(brief, status)
    .map((item) => item.name.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function summarizeOpenPlanningItems(brief: ProjectBrief, max = 5): string[] {
  const planning = brief.planning ?? { tech_decisions: [], external_dependencies: [] };
  const items = [
    ...planning.tech_decisions
      .filter((item) => item.status === 'open' && item.topic.trim())
      .map((item) =>
      `Resolve ${item.topic}${item.choice ? ` -> ${item.choice}` : ''}`),
    ...getDependenciesByStatus(brief, 'open').map((item) => `Decide whether to adopt ${item.name}`),
  ];

  if (items.length > 0) {
    return Array.from(new Set(items)).slice(0, max);
  }

  const fallbackItems = [
    ...planning.tech_decisions
      .filter((item) => item.status === 'candidate' && item.topic.trim())
      .map((item) =>
      `Confirm candidate decision: ${item.topic}${item.choice ? ` -> ${item.choice}` : ''}`),
    ...getDependenciesByStatus(brief, 'candidate').map((item) => `Confirm candidate dependency: ${item.name}`),
  ];

  return Array.from(new Set(fallbackItems)).slice(0, max);
}

export function summarizeRuntimeBoundary(brief: ProjectBrief): string[] {
  const text = collectBriefContextText(brief);
  const signals = inferBriefSignals(brief);
  if (!signals.hasDistributedRuntimeBoundary) return [];

  const gpuModel = text.match(/\bRTX\s*\d{3,4}\b/i)?.[0]?.toUpperCase() ?? '';
  const hostParts = [
    'Windows',
    gpuModel || 'GPU',
  ].filter(Boolean);

  return [
    signals.hasBrowserClient
      ? `The operator-facing client is a browser UI${signals.hasMacClient ? ' reachable from macOS' : ''}.`
      : `The operator-facing client is managed from ${signals.hasMacClient ? 'macOS' : 'a separate client machine'}.`,
    `Inference and media-heavy processing run on a ${hostParts.join(' ')} host.`,
    'The handoff between client and host stays explicit, including transport, artifact transfer, and failure recovery.',
  ];
}

export interface TranscriptionContractSummary {
  segmentation?: string;
  canonicalFormat?: string;
  exportFormat?: string;
  autosave?: string;
}

function lastPlanningChoice(
  brief: ProjectBrief,
  pattern: RegExp,
): string | undefined {
  const values = extractPlanningChoiceValues(brief, pattern);
  return values.length > 0 ? values[values.length - 1] : undefined;
}

export function summarizeTranscriptionContract(brief: ProjectBrief): TranscriptionContractSummary {
  return {
    segmentation: lastPlanningChoice(brief, TRANSCRIPT_SEGMENTATION_TOPIC_PATTERN),
    canonicalFormat: lastPlanningChoice(brief, CANONICAL_TRANSCRIPT_FORMAT_TOPIC_PATTERN),
    exportFormat: lastPlanningChoice(brief, TRANSCRIPT_EXPORT_TOPIC_PATTERN),
    autosave: lastPlanningChoice(brief, AUTOSAVE_TOPIC_PATTERN),
  };
}
