import type { ProjectBrief } from './schema';
import { getDependenciesByStatus } from './planning';

const CLI_PATTERN = /\bcli\b|command line|コマンドライン|コマンド|terminal|ターミナル/i;
const TTS_PATTERN = /\btts\b|text[- ]to[- ]speech|speech synthesis|voice synthesis|voice generation|irodori|音声合成|読み上げ|発話/i;
const AUDIO_PATTERN = /\baudio\b|\bvoice\b|\bspeech\b|\bwav\b|\bmp3\b|音声/i;
const UNITY_PATTERN = /\bunity\b|ユニティ/i;
const PIPELINE_PATTERN = /pipeline|パイプライン|前処理|後処理|post[- ]?process|post[- ]?processing|pre[- ]?process|pre[- ]?processing/i;
const TUNABLE_PARAMETER_PATTERN = /pitch|speed|rate|tempo|breath|break|prosody|emotion|感情|パラメータ/i;

export interface BriefSignals {
  hasAi: boolean;
  hasCli: boolean;
  hasWeb: boolean;
  hasUnity: boolean;
  hasAudio: boolean;
  hasTts: boolean;
  hasPipeline: boolean;
  hasTunableParameters: boolean;
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
  const hasAi = brief.tech.domains.includes('ai') || /\bai\b|\bllm\b|生成ai|生成 ai|model/i.test(text);
  const hasCli = brief.tech.domains.includes('cli') || CLI_PATTERN.test(text);
  const hasTts = TTS_PATTERN.test(text);

  return {
    hasAi,
    hasCli,
    hasWeb: brief.tech.domains.includes('web'),
    hasUnity: brief.tech.domains.includes('unity') || UNITY_PATTERN.test(text),
    hasAudio: hasTts || AUDIO_PATTERN.test(text),
    hasTts,
    hasPipeline: hasTts || PIPELINE_PATTERN.test(text) || (hasAi && hasCli),
    hasTunableParameters: hasTts || TUNABLE_PARAMETER_PATTERN.test(text),
  };
}

export function inferPipelineStages(brief: ProjectBrief): string[] {
  const signals = inferBriefSignals(brief);

  if (signals.hasTts || signals.hasAudio) {
    return ['parameter preparation', 'synthesis / generation', 'post-processing / export'];
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

export function summarizeOpenPlanningItems(brief: ProjectBrief, max = 3): string[] {
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
