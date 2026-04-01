// Generated from generator/dist/generateFromSpec.js. Run `npm run sync:generator-bundle` from app/ to refresh.
var d=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var C=d(R=>{"use strict";Object.defineProperty(R,"__esModule",{value:!0});R.LEGACY_AI_TOOLS=R.AI_TOOLS=void 0;R.normalizeAiTools=Q;R.deriveLegacyAiTool=mn;R.deriveLegacyAiToolDetail=hn;R.hasAiTool=Ye;R.getToolWrapperFile=Qe;R.getToolWrapperFiles=Ze;R.formatToolWrapperFiles=et;R.buildToolWrapperExampleClause=gn;R.formatAiTools=fn;R.AI_TOOLS=["codex","claude_code","gemini_cli","other"];R.LEGACY_AI_TOOLS=["claude_cli","other"];var Ke={codex:"Codex",claude_code:"Claude Code",gemini_cli:"Gemini CLI"},pn={codex:"AGENTS.md",claude_code:"CLAUDE.md",gemini_cli:"GEMINI.md"},un=["codex","claude_code","gemini_cli"];function Q(e){let t=Array.from(new Set(e.ai_tools??[])).filter(n=>R.AI_TOOLS.includes(n));return t.length>0?t:e.ai_tool==="claude_cli"?["claude_code"]:e.ai_tool==="other"?["other"]:[]}function mn(e){return e.includes("claude_code")?"claude_cli":"other"}function hn(e,t){let n=e.filter(o=>o!=="claude_code"&&o!=="other").map(o=>Ke[o]);return e.includes("other")&&t?.trim()&&n.push(t.trim()),Array.from(new Set(n)).join(", ")}function Ye(e,t){return Q(e).includes(t)}function Qe(e){return pn[e]}function Ze(e){return un.filter(t=>Ye(e,t)).map(t=>Qe(t))}function et(e){let t=Ze(e).map(n=>`\`${n}\``);return t.length===0?"":t.length===1?t[0]:t.length===2?`${t[0]} or ${t[1]}`:`${t.slice(0,-1).join(", ")}, or ${t[t.length-1]}`}function gn(e){let t=et(e);return t?` (for example ${t})`:""}function fn(e){return Q(e).map(t=>t==="other"?e.ai_tool_detail?.trim()||"Other":Ke[t]).join(", ")}});var I=d(b=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0});b.formatPlanningStatus=En;b.formatDependencyCategory=Z;b.getTechDecisionsByStatus=ee;b.getDependenciesByStatus=G;b.getAdoptedEnvVars=Rn;b.getAdoptedTechSummaryLines=_n;b.getAdoptedDependencySummaryLines=wn;b.getAdoptedTechBulletLines=vn;b.getAdoptedDependencyBulletLines=kn;var yn={adopted:"Adopted",candidate:"Candidate",open:"Open",rejected:"Rejected"},Tn={ai_api:"AI API",model:"Model",external_service:"External Service",oss:"OSS",github_repo:"GitHub Repository",npm_package:"npm Package",auth:"Authentication",database:"Database",storage:"Storage",notification:"Notification",ocr:"OCR / Document Analysis",batch:"Batch / Scheduler",other:"Other"};function tt(e){return e.planning??{tech_decisions:[],external_dependencies:[]}}function En(e){return yn[e]}function Z(e){return Tn[e]}function ee(e,t){return tt(e).tech_decisions.filter(n=>n.status===t&&n.topic.trim()&&n.choice.trim())}function G(e,t){return tt(e).external_dependencies.filter(n=>n.status===t&&n.name.trim())}function Rn(e){return Array.from(new Set(G(e,"adopted").flatMap(t=>t.env_vars.map(n=>n.trim()).filter(Boolean))))}function _n(e){return ee(e,"adopted").map(t=>`${t.topic}: ${t.choice}`)}function wn(e){return G(e,"adopted").map(t=>`${t.name} (${Z(t.category)})${t.env_vars.length>0?` / env: ${t.env_vars.join(", ")}`:""}`)}function vn(e){return ee(e,"adopted").map(t=>`- ${t.topic}: ${t.choice}${t.rationale?` \u2014 ${t.rationale}`:""}`)}function kn(e){return G(e,"adopted").map(t=>{let n=t.env_vars.length>0?` / env: ${t.env_vars.join(", ")}`:"",o=t.purpose?` \u2014 ${t.purpose}`:"";return`- ${t.name} (${Z(t.category)})${o}${n}`})}});var P=d(A=>{"use strict";Object.defineProperty(A,"__esModule",{value:!0});A.collectBriefContextText=oe;A.inferBriefSignals=x;A.hasOperatorFacingUi=Hn;A.hasStableCliSurface=Xn;A.inferPipelineStages=zn;A.summarizeCoreFeatures=Jn;A.summarizeSupportingLanguages=Kn;A.summarizeDependencyNames=Yn;A.summarizeOpenPlanningItems=Qn;A.summarizeRuntimeBoundary=Zn;A.summarizeTranscriptionContract=eo;var ne=I(),te=/\bcli\b|command line|コマンドライン|コマンド|terminal|ターミナル/i,An=/\btts\b|text[- ]to[- ]speech|speech synthesis|voice synthesis|voice generation|irodori|音声合成|読み上げ|発話/i,Sn=/\btranscription\b|speech[- ]to[- ]text|\basr\b|whisper|文字起こし|書き起こし|議事録|議事録作成|会議ログ|音声認識/i,bn=/\baudio\b|\bvoice\b|\bspeech\b|\bwav\b|\bmp3\b|音声/i,In=/\bunity\b|ユニティ/i,Cn=/pipeline|パイプライン|前処理|後処理|post[- ]?process|post[- ]?processing|pre[- ]?process|pre[- ]?processing/i,On=/pitch|speed|rate|tempo|breath|break|prosody|emotion|感情|パラメータ/i,Pn=/core workflow architecture|workflow architecture|pipeline architecture/i,$n=/core feature/i,Dn=/supporting language/i,Nn=/transcript segmentation/i,jn=/canonical transcript format/i,xn=/transcript export/i,Ln=/autosave/i,Mn=/\bwindows\b|windows\s+\d+|win11|win10/i,Un=/\brtx\s*\d{3,4}\b|\bgpu\b|cuda/i,Bn=/\bfrom mac(?:os)?\b|reachable from mac(?:os)?|mac(?:os)? client|macから|mac から|mac上|mac からも/i,Gn=/\bbrowser\b|ブラウザ|webui|web ui|web-ui/i,qn=/\bnext(?:\.js|js)?\b|\breact\b|\bvue(?:\.js|js)?\b|\bnuxt(?:\.js|js)?\b|\bsvelte\s*kit\b|\bsveltekit\b|\bvite\b/i,nt=/\belectron\b|\btauri\b/i,Fn=/\bdesktop\b|デスクトップアプリ|デスクトップ|ローカルデスクトップ/i,Vn=/話者分離|speaker|diarization|timestamp|タイムスタンプ|segment|chunk|vad|language|言語|議事録|要約|markdown|保存形式|出力形式/i;function ot(e){return e.split(/\s*(?:、|,|\/|・|\band\b|\n)\s*/i).map(t=>t.trim().replace(/^[-*]\s*/,"").replace(/[.)。]+$/,"")).filter(Boolean)}function F(e,t,n=["adopted","candidate"]){return(e.planning??{tech_decisions:[],external_dependencies:[]}).tech_decisions.filter(r=>n.includes(r.status)&&t.test(r.topic)&&r.choice.trim()).map(r=>r.choice.trim())}function Wn(e){let t=F(e,Pn);for(let n of t){if(!/(->|→|⇒|=>)/.test(n))continue;let o=n.replace(/\s*(?:→|⇒|=>)\s*/g," -> ").split(/\s*->\s*/).map(r=>r.trim().replace(/^[-*]\s*/,"").replace(/[.)。]+$/,"")).filter(Boolean);if(o.length>1)return o}return[]}function oe(e){let t=e.planning??{tech_decisions:[],external_dependencies:[]},n=t.tech_decisions.map(s=>[s.topic,s.choice,s.rationale,s.notes].filter(Boolean).join(" ")).join(`
`),o=t.external_dependencies.map(s=>[s.name,s.purpose,s.source,s.notes].filter(Boolean).join(" ")).join(`
`),r=e.structure.repos.map(s=>[s.name,s.type,s.description].filter(Boolean).join(" ")).join(`
`);return[e.project.name,e.project.description,e.tech.domains.join(" "),e.tech.frameworks.join(" "),n,o,r].join(`
`)}function x(e){let t=oe(e),n=e.planning??{tech_decisions:[],external_dependencies:[]},o=[e.tech.frameworks.join(" "),...n.tech_decisions.filter(h=>/framework/i.test(h.topic)).map(h=>h.choice)].join(" "),r=n.tech_decisions.filter(h=>/operator interface/i.test(h.topic)).map(h=>[h.choice,h.rationale,h.notes].filter(Boolean).join(" ")).join(" "),s=e.tech.domains.includes("ai")||/\bai\b|\bllm\b|生成ai|生成 ai|model/i.test(t),a=e.tech.domains.includes("cli")||te.test(t),l=An.test(t),i=Sn.test(t),u=Mn.test(t),p=Un.test(t),c=Bn.test(t),g=Gn.test(t),_=Fn.test(t)||nt.test(o),T=u&&p&&(c||g),v=e.tech.domains.includes("web")||g||_||qn.test(o)||nt.test(o)||/\bui\b|画面|ブラウザ|web ui|desktop|デスクトップ/i.test(r),E=e.tech.frameworks.some(h=>/typer/i.test(h))||n.tech_decisions.some(h=>/framework/i.test(h.topic)&&/typer/i.test(h.choice))||n.tech_decisions.some(h=>/operator interface/i.test(h.topic)&&h.status!=="open"&&te.test([h.choice,h.rationale,h.notes].filter(Boolean).join(" ")))||e.tech.domains.includes("cli")&&te.test(t);return{hasAi:s,hasCli:a,hasWeb:e.tech.domains.includes("web"),hasUnity:e.tech.domains.includes("unity")||In.test(t),hasAudio:l||i||bn.test(t),hasTts:l,hasTranscription:i,hasPipeline:l||i||Cn.test(t)||s&&a,hasTunableParameters:l||On.test(t),hasTranscriptionControls:i&&Vn.test(t),hasDistributedRuntimeBoundary:T,hasWindowsGpuHost:u&&p,hasBrowserClient:g,hasMacClient:c,hasDesktopApp:_,hasOperatorFacingUi:v,hasStableCliSurface:E}}function Hn(e){return x(e).hasOperatorFacingUi}function Xn(e){return x(e).hasStableCliSurface}function zn(e){let t=Wn(e);if(t.length>0)return t;let n=x(e);return n.hasTts?["parameter preparation","synthesis / generation","post-processing / export"]:n.hasTranscription?["audio capture / ingest","transcription","review / save / export"]:n.hasAi&&n.hasCli?["input normalization","generation or external processing","post-processing / output emission"]:n.hasAi?["input preparation","model-driven processing","result shaping"]:n.hasCli?["argument parsing","core processing","output emission"]:[]}function Jn(e,t=4){let n=F(e,$n).flatMap(o=>ot(o));return Array.from(new Set(n)).slice(0,t)}function Kn(e,t=3){let n=F(e,Dn).flatMap(o=>ot(o)).map(o=>o.toLowerCase());return Array.from(new Set(n)).slice(0,t)}function Yn(e,t,n=4){return(0,ne.getDependenciesByStatus)(e,t).map(o=>o.name.trim()).filter(Boolean).slice(0,n)}function Qn(e,t=5){let n=e.planning??{tech_decisions:[],external_dependencies:[]},o=[...n.tech_decisions.filter(s=>s.status==="open"&&s.topic.trim()).map(s=>`Resolve ${s.topic}${s.choice?` -> ${s.choice}`:""}`),...(0,ne.getDependenciesByStatus)(e,"open").map(s=>`Decide whether to adopt ${s.name}`)];if(o.length>0)return Array.from(new Set(o)).slice(0,t);let r=[...n.tech_decisions.filter(s=>s.status==="candidate"&&s.topic.trim()).map(s=>`Confirm candidate decision: ${s.topic}${s.choice?` -> ${s.choice}`:""}`),...(0,ne.getDependenciesByStatus)(e,"candidate").map(s=>`Confirm candidate dependency: ${s.name}`)];return Array.from(new Set(r)).slice(0,t)}function Zn(e){let t=oe(e),n=x(e);if(!n.hasDistributedRuntimeBoundary)return[];let r=["Windows",(t.match(/\bRTX\s*\d{3,4}\b/i)?.[0]?.toUpperCase()??"")||"GPU"].filter(Boolean);return[n.hasBrowserClient?`The operator-facing client is a browser UI${n.hasMacClient?" reachable from macOS":""}.`:`The operator-facing client is managed from ${n.hasMacClient?"macOS":"a separate client machine"}.`,`Inference and media-heavy processing run on a ${r.join(" ")} host.`,"The handoff between client and host stays explicit, including transport, artifact transfer, and failure recovery."]}function q(e,t){let n=F(e,t);return n.length>0?n[n.length-1]:void 0}function eo(e){return{segmentation:q(e,Nn),canonicalFormat:q(e,jn),exportFormat:q(e,xn),autosave:q(e,Ln)}}});var $=d(L=>{"use strict";Object.defineProperty(L,"__esModule",{value:!0});L.formatOwner=to;L.formatDomains=no;L.formatProjectDescription=oo;function to(e){return e.trim()||"TBD"}function no(e){return e.length>0?e.join(", "):"unspecified"}function oo(e){let t=e.split(`
`).map(r=>r.trim()).filter(Boolean);if(t.length===0)return"TBD";let n=t.map(r=>r.replace(/^[-*]\s*/,"").replace(/^\d+[.)]\s*/,"").trim());return t.every(r=>/^[-*]\s*/.test(r)||/^\d+[.)]\s*/.test(r))?n.join(" / "):n.join(" ")}});var st=d(ie=>{"use strict";Object.defineProperty(ie,"__esModule",{value:!0});ie.generateProjectMd=lo;var V=C(),rt=I(),ro=P(),D=$();function re(e){let{security:t}=e,n=`### 2. Security
- Never output real API keys, tokens, or credentials.
- Never store secrets in markdown or JSON.
- Always use placeholders: \`YOUR_API_KEY_HERE\`, \`YOUR_SECRET_HERE\`.
- Never echo back credentials if user pastes them.
- Never suggest committing .env or secret files.
- .env must always be in .gitignore.`;return t.has_payment_data&&(n+=`
- NEVER include payment data, card numbers, or financial credentials in code, comments, or documentation.
- All payment-related logic must reference PCI DSS compliance requirements.`),t.has_ip_sensitive&&(n+=`
- NEVER include client-confidential information, proprietary algorithms, or NDA-protected content in code comments or documentation.
- All references to client projects must use codenames or anonymized identifiers.`),n}function se(e){return["PROJECT.md",...(0,V.getToolWrapperFiles)(e.tech)]}function so(e){let t=se(e).map(n=>`\u251C\u2500\u2500 ${n}`).join(`
`);return`\`\`\`
${e.project.slug}/
${t}
\u251C\u2500\u2500 docs/
\u2502   \u251C\u2500\u2500 ACTIVE_CONTEXT.md
\u2502   \u251C\u2500\u2500 AI_TOOLING.md
\u2502   \u251C\u2500\u2500 TECH_DECISIONS.md
\u2502   \u251C\u2500\u2500 EXTERNAL_DEPENDENCIES.md
\u2502   \u251C\u2500\u2500 REQUIREMENTS.md
\u2502   \u251C\u2500\u2500 ARCHITECTURE.md
\u2502   \u251C\u2500\u2500 ROADMAP.md
\u2502   \u251C\u2500\u2500 VERSIONING_STANDARD.md
\u2502   \u251C\u2500\u2500 ADR/
\u2502   \u2502   \u2514\u2500\u2500 0000-template.md
\u2502   \u2514\u2500\u2500 runbooks/
\u2502       \u251C\u2500\u2500 README.md
\u2502       \u251C\u2500\u2500 production-bootstrap.md
\u2502       \u251C\u2500\u2500 production-cutover.md
\u2502       \u251C\u2500\u2500 production-checks.md
\u2502       \u251C\u2500\u2500 rollback.md
\u2502       \u251C\u2500\u2500 incident-response.md
\u2502       \u2514\u2500\u2500 skill-install.md
\u251C\u2500\u2500 plans/
\u2502   \u2514\u2500\u2500 template.md
\u251C\u2500\u2500 prompts/
\u2502   \u2514\u2500\u2500 restart.md
\u251C\u2500\u2500 skills/
\u2502   \u2514\u2500\u2500 README.md
\u251C\u2500\u2500 repogenesis.skills.json
\u251C\u2500\u2500 CONTRIBUTING.md
\u251C\u2500\u2500 .github/
\u2502   \u251C\u2500\u2500 PULL_REQUEST_TEMPLATE.md
\u2502   \u2514\u2500\u2500 ISSUE_TEMPLATE/
\u2502       \u251C\u2500\u2500 bug_report.md
\u2502       \u2514\u2500\u2500 feature_request.md
\u251C\u2500\u2500 .repogenesis/
\u2502   \u2514\u2500\u2500 manifest.json
\u251C\u2500\u2500 SECURITY.md
\u251C\u2500\u2500 .env.example
\u2514\u2500\u2500 .gitignore
\`\`\`
Optional bundled skill artifacts may also appear under provider-specific directories such as \`.claude/\` when selected at generation time.`}function io(e){let t=se(e).map(o=>`\u251C\u2500\u2500 ${o}`).join(`
`),n=e.structure.repos.map(o=>`\u251C\u2500\u2500 ${o.name}/`).join(`
`);return`\`\`\`
${e.project.slug}/
${t}
\u251C\u2500\u2500 GLOBAL_CONTEXT.md
\u251C\u2500\u2500 REQUIREMENTS.md
\u251C\u2500\u2500 SECURITY.md
\u251C\u2500\u2500 VERSIONING_STANDARD.md
\u251C\u2500\u2500 docs/
\u2502   \u251C\u2500\u2500 AI_TOOLING.md
\u2502   \u251C\u2500\u2500 TECH_DECISIONS.md
\u2502   \u251C\u2500\u2500 EXTERNAL_DEPENDENCIES.md
\u2502   \u2514\u2500\u2500 runbooks/
\u2502       \u251C\u2500\u2500 README.md
\u2502       \u251C\u2500\u2500 production-bootstrap.md
\u2502       \u251C\u2500\u2500 production-cutover.md
\u2502       \u251C\u2500\u2500 production-checks.md
\u2502       \u251C\u2500\u2500 rollback.md
\u2502       \u251C\u2500\u2500 incident-response.md
\u2502       \u2514\u2500\u2500 skill-install.md
\u251C\u2500\u2500 prompts/
\u2502   \u2514\u2500\u2500 restart.md
\u251C\u2500\u2500 skills/
\u2502   \u2514\u2500\u2500 README.md
\u251C\u2500\u2500 repogenesis.skills.json
\u251C\u2500\u2500 CONTRIBUTING.md
\u251C\u2500\u2500 .github/
\u2502   \u251C\u2500\u2500 PULL_REQUEST_TEMPLATE.md
\u2502   \u2514\u2500\u2500 ISSUE_TEMPLATE/
\u2502       \u251C\u2500\u2500 bug_report.md
\u2502       \u2514\u2500\u2500 feature_request.md
\u251C\u2500\u2500 .repogenesis/
\u2502   \u2514\u2500\u2500 manifest.json
\u251C\u2500\u2500 .gitignore
${n}
\`\`\`
Optional bundled skill artifacts may also appear under provider-specific directories such as \`.claude/\` when selected at generation time.`}function ao(e,t){let n=se(e).map(o=>`\u251C\u2500\u2500 ${o}`).join(`
`);return`\`\`\`
${t.name}/
${n}
\u251C\u2500\u2500 docs/
\u2502   \u251C\u2500\u2500 ACTIVE_CONTEXT.md
\u2502   \u251C\u2500\u2500 ARCHITECTURE.md
\u2502   \u251C\u2500\u2500 ROADMAP.md
\u2502   \u251C\u2500\u2500 VERSIONING_STANDARD.md
\u2502   \u2514\u2500\u2500 ADR/
\u2502       \u2514\u2500\u2500 0000-template.md
\u251C\u2500\u2500 plans/
\u2502   \u2514\u2500\u2500 template.md
\u251C\u2500\u2500 prompts/
\u2502   \u2514\u2500\u2500 restart.md
\u251C\u2500\u2500 .env.example
\u2514\u2500\u2500 .gitignore
\`\`\``}function co(e){let t=(0,rt.getAdoptedTechBulletLines)(e),n=(0,rt.getAdoptedDependencyBulletLines)(e);if(t.length===0&&n.length===0)return"";let o=[];return t.length>0&&o.push(`- Adopted Decisions:
${t.map(r=>`  ${r}`).join(`
`)}`),n.length>0&&o.push(`- Adopted External Dependencies:
${n.map(r=>`  ${r}`).join(`
`)}`),`${o.join(`
`)}
`}function lo(e,t={}){let n=t.scope??(e.structure.repo_type==="multi"?"workspace":"single"),o=t.repo,r=co(e),s=(0,ro.summarizeSupportingLanguages)(e),a=e.tech.frameworks.length>0?`- Frameworks: ${e.tech.frameworks.join(", ")}
`:"",l=s.length>0?`- Supporting Languages: ${s.join(", ")}
`:"";if(n==="repo"&&o){let i=o.depends_on.length>0?`- Dependencies: ${o.depends_on.join(", ")}
`:"";return`# ${o.name} \u2014 Repository Constitution

## Part of
${e.project.name} (workspace: ${e.project.slug})

## Repository Info
- Name: ${o.name}
- Type: ${o.type}
- Description: ${o.description}
- Owner: ${(0,D.formatOwner)(o.owner)}
${i}## Tech Stack
- Domains: ${(0,D.formatDomains)(e.tech.domains)}
- Primary Language: ${e.tech.primary_language}
${a}${l}- AI Tooling Policy: \`../docs/AI_TOOLING.md\`
${r}

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${re(e)}

### 3. File Authority
- \`docs/ACTIVE_CONTEXT.md\` is the single source of truth for this repository's current state.
- \`docs/ROADMAP.md\` tracks phase progression for this repository.
- \`docs/ARCHITECTURE.md\` defines this repository's technical boundaries.
- \`docs/VERSIONING_STANDARD.md\` defines runtime traceability rules.
- \`../docs/AI_TOOLING.md\` defines the provider-neutral AI tooling policy for the workspace.
- \`../docs/TECH_DECISIONS.md\` tracks workspace-level adopted, candidate, and open technical decisions.
- \`../docs/EXTERNAL_DEPENDENCIES.md\` tracks workspace-level external dependencies and their status.
- \`../GLOBAL_CONTEXT.md\` is the workspace-level source of truth for cross-repo context.

### 4. Session Protocol
- Read \`PROJECT.md\` first.
- Read \`../docs/AI_TOOLING.md\`.
- Read the tool-specific wrapper${(0,V.buildToolWrapperExampleClause)(e.tech)} if your tool uses one.
- Read \`docs/ACTIVE_CONTEXT.md\`.
- Read \`../GLOBAL_CONTEXT.md\` when changes cross repository boundaries.
- Summarize current state before taking any action.

## Repository Structure
${ao(e,o)}
`}if(n==="workspace"){let i=e.structure.repos.map(u=>{let p=u.depends_on.length>0?` (depends on: ${u.depends_on.join(", ")})`:"";return`- ${u.name}: ${u.description}${p}`}).join(`
`);return`# ${e.project.name} \u2014 Workspace Constitution

## What is this workspace?
${(0,D.formatProjectDescription)(e.project.description)}

## Tech Stack
- Domains: ${(0,D.formatDomains)(e.tech.domains)}
- Primary Language: ${e.tech.primary_language}
${a}${l}- AI Tooling Policy: \`docs/AI_TOOLING.md\`
${r}

## Workspace Repositories
${i}

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${re(e)}

### 3. File Authority
- \`GLOBAL_CONTEXT.md\` is the single source of truth for workspace-level current state.
- \`REQUIREMENTS.md\` is the single source of truth for workspace-level requirements.
- \`SECURITY.md\` defines shared security rules.
- \`docs/AI_TOOLING.md\` defines the provider-neutral AI tooling policy.
- \`docs/TECH_DECISIONS.md\` tracks adopted, candidate, and open technical decisions.
- \`docs/EXTERNAL_DEPENDENCIES.md\` tracks adopted, candidate, and open external dependencies.
- Each repository's \`PROJECT.md\` defines repository-local rules.
- Each repository's \`docs/ACTIVE_CONTEXT.md\` defines repository-local state.

### 4. Session Protocol
- Read \`PROJECT.md\` first.
- Read \`docs/AI_TOOLING.md\`.
- Read the tool-specific wrapper${(0,V.buildToolWrapperExampleClause)(e.tech)} if your tool uses one.
- Read \`GLOBAL_CONTEXT.md\`.
- Read the target repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\` before editing it.

## Repository Structure
${io(e)}
`}return`# ${e.project.name} \u2014 Project Constitution

## What is this project?
${(0,D.formatProjectDescription)(e.project.description)}

## Tech Stack
- Domains: ${(0,D.formatDomains)(e.tech.domains)}
- Primary Language: ${e.tech.primary_language}
${a}${l}- AI Tooling Policy: \`docs/AI_TOOLING.md\`
${r}

## Development Workflow
- Use the tool-specific wrapper that matches your environment when present.
- Use \`docs/AI_TOOLING.md\` as the provider-neutral entry point for AI tooling rules.
- Keep shared project knowledge in \`PROJECT.md\` and \`docs/\`.
- Use tool-specific files only for tool behavior, not for project truth.

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${re(e)}

### 3. File Authority
- \`PROJECT.md\` is the common constitution for the repository.
- \`docs/ACTIVE_CONTEXT.md\` is the single source of truth for current project state.
- \`docs/ROADMAP.md\` is the single source of truth for phase progression.
- \`docs/REQUIREMENTS.md\` is the single source of truth for what the system must do.
- \`docs/AI_TOOLING.md\` defines the provider-neutral AI tooling policy and wrapper expectations.
- \`docs/TECH_DECISIONS.md\` tracks adopted, candidate, and open technical decisions.
- \`docs/EXTERNAL_DEPENDENCIES.md\` tracks adopted, candidate, and open external dependencies.
- \`docs/VERSIONING_STANDARD.md\` defines release/version traceability rules.
- If conversation conflicts with files, files win.

### 4. Session Protocol
- Read \`PROJECT.md\` first.
- Read \`docs/AI_TOOLING.md\`.
- Read the tool-specific wrapper${(0,V.buildToolWrapperExampleClause)(e.tech)} if your tool uses one.
- Read \`docs/ACTIVE_CONTEXT.md\` and \`docs/REQUIREMENTS.md\` before taking action.
- Summarize current state before taking any action.

## Repository Structure
${so(e)}
`}});var H=d(ae=>{"use strict";Object.defineProperty(ae,"__esModule",{value:!0});ae.generateToolGuidance=ho;var W=P(),po=C(),uo={codex:"Codex",claude_code:"Claude Code",gemini_cli:"Gemini CLI"},mo={codex:"- Prefer repository-local Codex skills or guidance artifacts when they exist.",claude_code:"- Prefer repository-local Claude Code skills when they exist.",gemini_cli:"- Prefer repository-local Gemini commands or context artifacts when they exist."};function ho(e,t,n={}){let o=n.scope??"single",r=uo[t],s=(0,po.getToolWrapperFile)(t),a=mo[t],l=(0,W.inferBriefSignals)(e),i=(0,W.hasOperatorFacingUi)(e),u=(0,W.hasStableCliSurface)(e),c=(0,W.summarizeSupportingLanguages)(e).includes("python"),g=e.tech.frameworks.some(E=>/tauri/i.test(E))||(e.planning?.tech_decisions??[]).some(E=>/framework/i.test(E.topic)&&/tauri/i.test(E.choice)),_=e.tech.frameworks.some(E=>/typer/i.test(E))||(e.planning?.tech_decisions??[]).some(E=>/framework/i.test(E.topic)&&/typer/i.test(E.choice)),T=[u?"- Treat the CLI contract as first-class: keep command examples, flags, exit behavior, and output locations explicit.":null,u&&e.tech.primary_language==="python"&&_?"- For Python CLI projects using `Typer`, keep command groups, help text, option types, and generated CLI help aligned with the documented contract.":null,u&&e.tech.primary_language==="python"&&!_?"- For Python CLI projects, prefer `pyproject.toml` and default to `argparse` unless a richer subcommand tree is clearly justified.":null,l.hasPipeline?"- Keep the first processing pipeline explicit end to end, including stage inputs, outputs, and tunable parameters that affect results.":null,l.hasTts?"- When synthesis or media quality depends on parameters such as voice, speed, pitch, breath, or break, document their defaults and intended effect next to the implementation.":null,l.hasTranscription?"- For transcription products, keep capture source, timestamp or speaker-label behavior, transcript storage format, and export contract explicit from the first release.":null,i&&(g||c)?"- If the operator UI uses a desktop shell or local sidecar runtime, keep the shell-to-sidecar bridge, packaging method, and local artifact handoff explicit from the start.":null,l.hasUnity?"- Keep the Unity integration boundary explicit: define handoff artifacts, expected file formats, and runtime assumptions before coding across the boundary.":null,i?"- For operator-facing UI, keep a small low-emphasis runtime label in the top-right header showing release version, commit, and deploy or publication time during active development and rollout.":null,i?"- Implement the runtime label so it can later be hidden, feature-flagged, or restricted to admins without removing API/log-based traceability.":null].filter(Boolean),v=T.length>0?`${T.join(`
`)}
`:"";return o==="workspace"?`# Read PROJECT.md first.

## ${r} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`GLOBAL_CONTEXT.md\` -> \`REQUIREMENTS.md\`.
- Before editing a repository, also read that repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${s}\` is only the ${r}-specific overlay.
- Treat \`${s}\` as a thin adapter over the shared project constitution.
${a}
${v}
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`:o==="repo"&&n.repo?`# Read PROJECT.md first.

## ${r} rules
- On session start, read: \`PROJECT.md\` -> \`../docs/AI_TOOLING.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`../GLOBAL_CONTEXT.md\`.
- \`${s}\` contains ${r}-specific workflow only. Project truth lives in \`PROJECT.md\` and \`docs/\`.
- Treat \`${s}\` as a thin adapter over the shared repository and workspace constitutions.
- If work changes another repository, return to \`../GLOBAL_CONTEXT.md\` and update both repositories' context files.
${a}
${v}
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`:`# Read PROJECT.md first.

## ${r} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`docs/REQUIREMENTS.md\` -> \`docs/ROADMAP.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${s}\` is only the ${r}-specific overlay.
- Treat \`${s}\` as a thin adapter over the shared project constitution.
${a}
${v}
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`}});var it=d(ce=>{"use strict";Object.defineProperty(ce,"__esModule",{value:!0});ce.generateAgentsMd=fo;var go=H();function fo(e,t={}){return(0,go.generateToolGuidance)(e,"codex",t)}});var at=d(de=>{"use strict";Object.defineProperty(de,"__esModule",{value:!0});de.generateClaudeMd=To;var yo=H();function To(e,t={}){return(0,yo.generateToolGuidance)(e,"claude_code",t)}});var ct=d(le=>{"use strict";Object.defineProperty(le,"__esModule",{value:!0});le.generateGeminiMd=Ro;var Eo=H();function Ro(e,t={}){return(0,Eo.generateToolGuidance)(e,"gemini_cli",t)}});var lt=d(pe=>{"use strict";Object.defineProperty(pe,"__esModule",{value:!0});pe.generateActiveContext=vo;var _o=C(),dt=I(),wo=$();function vo(e){let{project:t}=e,n=new Date().toISOString().split("T")[0],o=e.workflow.phases_count===1?"Phase 0 \u2014 Project Initialization":"Phase 1 \u2014 Planning",r=e.workflow.phases_count===1?"Phase 0 execution has started. Turn the generated starter into a concrete first delivery.":"Phase 1 planning is in progress. Convert generated docs into concrete requirements, architecture, and first tasks.",s=["`PROJECT.md`",...(0,_o.getToolWrapperFiles)(e.tech).map(l=>`\`${l}\``)].join(`
- `),a=[`- Project initialized: ${t.name} (${t.slug})`,`- Owner: ${(0,wo.formatOwner)(t.owner)}`,...(0,dt.getAdoptedTechSummaryLines)(e).map(l=>`- Adopted decision: ${l}`),...(0,dt.getAdoptedDependencySummaryLines)(e).map(l=>`- Adopted dependency: ${l}`)];return`# ACTIVE_CONTEXT.md \u2014 Current Project State

## Last Updated
${n}

## Current Phase
${o}

## What Has Been Done
- Project structure generated by RepoGenesis.
- Common constitution created in PROJECT.md.
- Tool-specific wrapper files created when enabled.
- Documentation templates created.

## What Is Being Done Now
- ${r}

## What Is Blocked
- No technical blockers detected at generation time.
- Product scope may still contain TBD items that should be resolved during planning.

## Key Decisions Made
${a.join(`
`)}

## Files That Exist
- ${s}
- \`docs/ACTIVE_CONTEXT.md\` (this file)
- \`docs/AI_TOOLING.md\`
- \`docs/TECH_DECISIONS.md\`
- \`docs/EXTERNAL_DEPENDENCIES.md\`
- \`docs/REQUIREMENTS.md\`
- \`docs/ARCHITECTURE.md\`
- \`docs/ROADMAP.md\`
- \`docs/VERSIONING_STANDARD.md\`
- \`docs/ADR/0000-template.md\`
- \`docs/runbooks/README.md\`
- \`docs/runbooks/skill-install.md\`
- \`plans/template.md\`
- \`prompts/restart.md\`
- \`SECURITY.md\`
- \`.env.example\`
- \`.gitignore\`
- \`skills/README.md\`
- \`repogenesis.skills.json\`
- \`.repogenesis/manifest.json\`

## Next Step
Turn the generated docs into concrete Phase 1 decisions before starting implementation.
`}});var pt=d(me=>{"use strict";Object.defineProperty(me,"__esModule",{value:!0});me.generateAiTooling=ko;var ue=C();function ko(e){let t=(0,ue.getToolWrapperFiles)(e.tech),n=(0,ue.formatAiTools)(e.tech)||"None",o=t.length>0?t.map(s=>`\`${s}\``).join(" / "):"None",r=t.length>0?`- Thin wrapper files: ${(0,ue.formatToolWrapperFiles)(e.tech)}`:"- Thin wrapper files are not generated for this project.";return`# AI_TOOLING.md \u2014 AI Tooling Contract

## Purpose
Keep AI-tool-specific workflow guidance separate from project truth for ${e.project.name}.

## Enabled Tooling
- Enabled AI tools: ${n}
- Wrapper files generated: ${o}
- Optional AI work guides are tracked in \`skills/README.md\` and \`repogenesis.skills.json\`.

## Rules
- \`PROJECT.md\` and \`docs/\` remain the source of truth for project state, requirements, and architecture.
${r}
- Wrapper files may define provider-specific workflow preferences, but they must not replace project truth.
- If the current AI tool has no wrapper file, follow \`PROJECT.md\`, \`docs/ACTIVE_CONTEXT.md\`, and \`docs/REQUIREMENTS.md\` directly.
- Optional AI work guides should stay reviewable in the repository and must be pinned in \`repogenesis.skills.json\`.
- During substantive work, prefer progress updates that include a short checklist of what is done / remaining and a rough time estimate.
- Treat the progress checklist + time estimate as default-on guidance; only reduce it when the user explicitly prefers terser updates.

## Session Start Order
1. Read \`PROJECT.md\`.
2. Read \`docs/AI_TOOLING.md\`.
3. Read the matching wrapper file when one exists.
4. Read \`docs/ACTIVE_CONTEXT.md\` and the planning docs before making changes.

## Update Policy
- Add or remove wrapper files only when the selected AI tools change.
- Keep wrapper-specific instructions thin and move shared rules back into \`PROJECT.md\` or \`docs/\`.
- Update \`skills/README.md\` and \`repogenesis.skills.json\` together when optional AI work guides change.
`}});var mt=d(he=>{"use strict";Object.defineProperty(he,"__esModule",{value:!0});he.generateTechDecisions=Ao;var ut=I();function X(e,t,n,o){let r=(0,ut.getTechDecisionsByStatus)(e,t);return r.length===0?`## ${n}
${o}`:`## ${n}
${r.map(s=>`### ${s.topic}
- **Choice**: ${s.choice}
- **Status**: ${(0,ut.formatPlanningStatus)(s.status)}
- **Rationale**: ${s.rationale||"TBD"}
- **Decision Date**: ${s.decision_date||"TBD"}
- **Notes**: ${s.notes||"None"}
`).join(`
`)}`}function Ao(e){return`# TECH_DECISIONS.md \u2014 Technology Decisions

## Purpose
Track technology choices separately from product requirements so the team can see what is adopted, what is only a candidate, and what is still open.

## Status Guide
- **Adopted**: the project starts with this choice.
- **Candidate**: likely direction, but not locked yet.
- **Open**: still unresolved and needs a decision.
- **Rejected**: explicitly not chosen for now.

${X(e,"adopted","Adopted Decisions","No adopted technology decisions were captured at generation time.")}

${X(e,"candidate","Candidate Decisions","No candidate technology decisions were captured at generation time.")}

${X(e,"open","Open Decisions","No open technology decisions were captured at generation time.")}

${X(e,"rejected","Rejected Decisions","No rejected technology decisions were captured at generation time.")}
`}});var ht=d(fe=>{"use strict";Object.defineProperty(fe,"__esModule",{value:!0});fe.generateExternalDependencies=So;var ge=I();function z(e,t,n,o){let r=(0,ge.getDependenciesByStatus)(e,t);return r.length===0?`## ${n}
${o}`:`## ${n}
${r.map(s=>`### ${s.name}
- **Category**: ${(0,ge.formatDependencyCategory)(s.category)}
- **Status**: ${(0,ge.formatPlanningStatus)(s.status)}
- **Purpose**: ${s.purpose||"TBD"}
- **Owner**: ${s.owner||"TBD"}
- **Source**: ${s.source||"TBD"}
- **License / Terms**: ${s.license||"TBD"}
- **Env Vars**: ${s.env_vars.length>0?s.env_vars.join(", "):"None"}
- **Data Outbound**: ${s.data_outbound?"Yes":"No"}
- **Notes**: ${s.notes||"None"}
`).join(`
`)}`}function So(e){return`# EXTERNAL_DEPENDENCIES.md \u2014 External Dependencies

## Purpose
Track external APIs, services, OSS, GitHub repositories, and packages used by the project.

## Status Guide
- **Adopted**: required from the start.
- **Candidate**: likely to be used, but not locked.
- **Open**: unresolved.
- **Rejected**: evaluated and not selected for now.

${z(e,"adopted","Adopted Dependencies","No adopted external dependencies were captured at generation time.")}

${z(e,"candidate","Candidate Dependencies","No candidate external dependencies were captured at generation time.")}

${z(e,"open","Open Dependencies","No open external dependencies were captured at generation time.")}

${z(e,"rejected","Rejected Dependencies","No rejected external dependencies were captured at generation time.")}
`}});var gt=d(ye=>{"use strict";Object.defineProperty(ye,"__esModule",{value:!0});ye.generateRequirements=Io;var bo=I(),O=P(),J=$();function Io(e){let{project:t,tech:n,security:o,structure:r}=e,s=e.planning??{tech_decisions:[],external_dependencies:[]},a=(0,O.inferBriefSignals)(e),l=(0,O.inferPipelineStages)(e),i=(0,O.summarizeCoreFeatures)(e),u=(0,O.summarizeDependencyNames)(e,"adopted"),p=(0,O.summarizeRuntimeBoundary)(e),c=(0,O.summarizeSupportingLanguages)(e),g=(0,O.summarizeTranscriptionContract)(e),_=(0,O.hasOperatorFacingUi)(e),T=(0,O.hasStableCliSurface)(e),v=n.domains.includes("web")||n.frameworks.length>0||s.tech_decisions.some(m=>/framework/i.test(m.topic)),E=n.frameworks.length>0||s.tech_decisions.some(m=>/framework/i.test(m.topic)&&m.choice.trim()),h=n.frameworks.length>0?`- Frameworks: ${n.frameworks.join(", ")}
`:"",N=c.length>0?`- Supporting Languages: ${c.join(", ")}
`:"",w=[{title:"R1: Deliver the primary workflow",description:`${t.name} must support the first useful user outcome described in the overview: ${(0,J.formatProjectDescription)(t.description)}.`,criteria:[`A user can complete the first end-to-end workflow for ${t.name}.`,"The main inputs and outputs for that workflow are explicitly handled in code or documented in the repository.","The first workflow is small enough to deliver within the current planning horizon without broadening scope unnecessarily.","The exact boundary of the initial scope is written down, including what is included now and what is explicitly deferred."]},{title:"R2: Keep the project operable and traceable from day one",description:`${t.name} must remain easy to start, safe to configure, and easy to inspect while the product scope is still evolving.`,criteria:["Local setup expectations and required environment placeholders are documented.",`Security expectations for level \`${o.level}\` are reflected in implementation and deployment decisions.`,"Release version and commit identity can be surfaced by the running service, API, or CLI when applicable.",..._?["Operator-facing UI keeps a low-emphasis runtime label in the top-right header showing release version, commit SHA, and deploy or publication time during active development and rollout.","The UI label can later be hidden, feature-flagged, or restricted to admins without removing other runtime identity surfaces."]:[]]}];if(r.repo_type==="multi"){let m=r.repos.map(y=>y.name).join(", ");w.push({title:`R${w.length+1}: Keep repository boundaries explicit`,description:`The workspace must keep responsibilities clear across the initial repositories: ${m}.`,criteria:["Each repository has a clearly named responsibility and owner.","Cross-repository dependencies are documented before implementation work starts.","Shared decisions stay in workspace-level docs and do not drift into repo-local copies."]})}if(a.hasPipeline){let y=[l.length>0?`The initial stage order is explicit: ${l.join(" -> ")}.`:"The initial stage order is explicit and documented before implementation expands.","Inputs, outputs, and failure boundaries for each stage are documented in code, tests, or repository docs.","The output contract for the first workflow is specified, including response, file, or artifact format when applicable."];a.hasTunableParameters&&y.push("Tunable parameters that materially affect generated output are listed with defaults and intended effects."),a.hasTts&&y.push("Audio-related parameters and output format requirements are documented when they affect quality or compatibility."),a.hasTranscriptionControls&&(y.push("Transcription-related controls and output format requirements are documented when they affect review quality, timestamps, speaker markers, or downstream compatibility."),g.segmentation&&y.push(`Transcript segmentation is defined for the first workflow: ${g.segmentation}.`),g.canonicalFormat&&y.push(`A canonical transcript artifact format is defined before exports fan out: ${g.canonicalFormat}.`),g.exportFormat&&y.push(`Review and export targets are named explicitly for the first release: ${g.exportFormat}.`),g.autosave&&y.push(`Autosave behavior is defined for operator sessions: ${g.autosave}.`)),w.push({title:`R${w.length+1}: Keep the processing pipeline explicit and testable`,description:`${t.name} must describe and validate the ordered processing stages needed for the first useful output.`,criteria:y})}i.length>0&&w.push({title:`R${w.length+1}: Preserve the differentiating workflow features`,description:`${t.name} must keep the project-specific features that make the first workflow valuable explicit from the first release.`,criteria:[`The first release preserves these differentiating features: ${i.join(", ")}.`,"Each feature is mapped to code, configuration, or acceptance checks rather than being left as a generic quality goal.","Feature-specific behavior is documented close to the first workflow so implementation and review use the same language."]}),p.length>0&&w.push({title:`R${w.length+1}: Keep the client-host runtime boundary explicit`,description:`${t.name} must keep the operator-facing client and the inference or media-processing host aligned as separate but coordinated runtime responsibilities.`,criteria:[...p,"The runtime transport between client and host is named before implementation expands across machines.","Host OS, GPU, and runtime prerequisites are documented close to setup and deployment notes."]}),T&&w.push({title:`R${w.length+1}: Provide a stable operator-facing CLI contract`,description:`${t.name} must be runnable as a documented command-line workflow from the first release.`,criteria:["The primary command entrypoint and invocation examples are documented.","Arguments or options that materially change behavior are documented with expected inputs.","Exit behavior and output location or stdout/stderr contract are defined for the first workflow.","Help and version surfaces exist or are explicitly planned before release."]}),u.length>0&&w.push({title:`R${w.length+1}: Integrate adopted external dependencies intentionally`,description:`The first workflow depends on adopted external dependencies that must be introduced deliberately: ${u.join(", ")}.`,criteria:["Each adopted dependency required for the first workflow is named and mapped to a clear purpose.","License or usage terms are reviewed for adopted dependencies before release.","Required environment variables and setup prerequisites are documented.","Dependencies that send data externally have documented outbound-data expectations."]});let K=w.flatMap((m,y)=>[y===0?`### ${m.title}`:"",y===0?`- Description: ${m.description}`:`### ${m.title}`,y===0?"- Acceptance Criteria:":`- Description: ${m.description}`,...y===0?m.criteria.map(j=>`  - [ ] ${j}`):["- Acceptance Criteria:",...m.criteria.map(j=>`  - [ ] ${j}`)]]).filter(Boolean),Y=s.tech_decisions.some(m=>m.status==="open"&&/operator interface/i.test(m.topic)),B=[t.owner.trim()?null:"- Project owner is still TBD.",n.domains.length>0?null:"- Technical domain is still TBD.",v&&!E?"- Framework choice is still TBD.":null,Y&&!T?"- Operator interface is still open; do not treat CLI as the default delivery surface yet.":null,...s.tech_decisions.filter(m=>m.status==="open"&&m.topic.trim()).slice(0,5).map(m=>`- Open decision: ${m.topic}${m.choice?` -> ${m.choice}`:""}.`),...(0,bo.getDependenciesByStatus)(e,"open").slice(0,5).map(m=>`- Open dependency: ${m.name} (${m.category}).`)].filter(Boolean);return`# REQUIREMENTS.md \u2014 Functional Requirements

## Purpose
Define what ${t.name} must do. This is the single source of truth for functional requirements.

## Project Overview
- **Name**: ${t.name}
- **Slug**: ${t.slug}
- **Description**: ${(0,J.formatProjectDescription)(t.description)}
- **Owner**: ${(0,J.formatOwner)(t.owner)}

## Technical Context
- Domains: ${(0,J.formatDomains)(n.domains)}
- Primary Language: ${n.primary_language}
${h}${N}- AI Tooling Policy: \`docs/AI_TOOLING.md\`

## Core Requirements
${K.join(`
`)}

## Non-Requirements
- Anything outside the first workflow or current roadmap phase remains out of scope until explicitly added.
- New integrations, automation, or scaling work should be introduced only after the initial workflow is stable.

## Known TBDs
${B.length>0?B.join(`
`):"- No major TBDs were detected at generation time."}

## Operational Standards

### Version Traceability
- Running services must expose release version and commit SHA.
- Running services should expose deploy or publication time where operators inspect runtime identity.
- APIs should expose deploy identity through health/version surfaces or logs.
- CLI tools should support version output.
`}});var yt=d(Ee=>{"use strict";Object.defineProperty(Ee,"__esModule",{value:!0});Ee.generateArchitecture=Co;var ft=I(),M=P(),Te=$();function Co(e){let{project:t,tech:n,structure:o}=e,r=e.planning??{tech_decisions:[],external_dependencies:[]},s=(0,ft.getAdoptedTechBulletLines)(e),a=(0,ft.getAdoptedDependencyBulletLines)(e),l=(0,M.inferPipelineStages)(e),i=(0,M.summarizeCoreFeatures)(e),u=(0,M.summarizeRuntimeBoundary)(e),p=(0,M.summarizeSupportingLanguages)(e),c=(0,M.summarizeTranscriptionContract)(e),g=n.frameworks.some(f=>/tauri/i.test(f))||r.tech_decisions.some(f=>/framework/i.test(f.topic)&&/tauri/i.test(f.choice)),_=p.includes("python"),T=r.tech_decisions.find(f=>/inference bridge/i.test(f.topic)&&f.choice.trim())?.choice,v=r.tech_decisions.find(f=>/sidecar packaging/i.test(f.topic)&&f.choice.trim())?.choice,E=n.frameworks.length>0?`- Frameworks: ${n.frameworks.join(", ")}
`:"",h=p.length>0?`- Supporting Languages: ${p.join(", ")}
`:"",N;if(o.repo_type==="single")N=`## Repository Structure
Single repository: \`${t.slug}\``;else{let f=o.repos.map(k=>{let ln=k.depends_on.length>0?` (depends on: ${k.depends_on.join(", ")})`:"";return`- **${k.name}** (${k.type}): ${k.description}${ln} \u2014 Owner: ${(0,Te.formatOwner)(k.owner)}`}).join(`
`);N=`## Repository Structure
Multi-repository workspace: \`${t.slug}\`

### Repositories
${f}`}let w=o.repo_type==="single"?`${t.name} starts as a single-repository project focused on the first usable workflow. The architecture should keep product logic, planning docs, security rules, and release traceability close together until the system proves it needs further separation.`:`${t.name} starts as a multi-repository workspace so each major responsibility can evolve with a clear boundary. Workspace-level docs define shared rules, while repository-level docs define local architecture and execution details.`,K=i.length>0?` The first release should preserve these differentiating features explicitly: ${i.join(", ")}.`:"",Y=o.repo_type==="single"?[`- **Core product workflow**: the main implementation for ${t.name}, built in \`${n.primary_language}\` and expanded from the generated starter repository.`,...g?["- **Desktop shell**: a Tauri v2 shell hosts the operator-facing local desktop UI and app packaging boundary."]:[],..._?["- **Inference / sidecar runtime**: Python handles local ASR or media-heavy execution that should stay isolated from the UI shell."]:[],...T?[`- **Bridge layer**: ${T} keeps audio capture, inference, and transcript artifact handoff explicit between the UI shell and sidecar.`]:[],...v?[`- **Distribution packaging**: ${v} is part of the first packaging story for the sidecar or local runtime.`]:[],...i.map(f=>`- **Differentiating feature**: ${f} stays explicit in the first workflow, not implicit in generic quality language.`),"- **Documentation and planning layer**: `PROJECT.md`, `docs/REQUIREMENTS.md`, `docs/ACTIVE_CONTEXT.md`, and `docs/ROADMAP.md` hold current truth and execution context.","- **Security and configuration layer**: `SECURITY.md` and `.env.example` define setup boundaries and secret-handling expectations.","- **Version traceability layer**: `docs/VERSIONING_STANDARD.md` and `.repogenesis/manifest.json` define how release and commit identity should be exposed."].join(`
`):["- **Workspace governance layer**: `PROJECT.md`, `GLOBAL_CONTEXT.md`, `REQUIREMENTS.md`, and `SECURITY.md` define shared rules.",...o.repos.map(f=>`- **${f.name}**: ${f.description} \u2014 Owner: ${(0,Te.formatOwner)(f.owner)}.`),"- **Version traceability layer**: workspace and repository outputs should expose release and commit identity consistently."].join(`
`),B=o.repo_type==="single"?l.length>0?l.map((f,k)=>k===0?`1. The first workflow starts with \`${f}\`.`:k===l.length-1?`${k+1}. The system emits the first usable result through \`${f}\`.`:`${k+1}. The workflow advances through \`${f}\` before moving to the next stage.`).concat(T&&(g||_)?[`${l.length+1}. The UI shell and sidecar exchange artifacts through \`${T}\` before save or export completes.`]:[]).join(`
`):[`1. A user or operator starts the primary workflow described for ${t.name}.`,`2. The application validates and transforms inputs using the core ${n.primary_language} codebase.`,"3. Domain-specific processing runs inside the same repository with shared docs and security rules nearby.","4. Outputs are returned to the user, persisted by the application, or documented for the next phase of work."].join(`
`):[`1. Inputs enter through one or more workspace repositories for ${t.name}.`,"2. Each repository handles its own bounded responsibility and uses declared dependencies for cross-repo interactions.","3. Shared decisions and architectural changes are reflected back into workspace-level docs.","4. Outputs are coordinated across repositories while keeping ownership and release boundaries explicit."].join(`
`),m=o.repo_type==="single"?[`- Start from one deployable repository: \`${t.slug}\`.`,`- Use security level \`${e.security.level}\` as the minimum operational baseline.`,"- Keep environment-specific values outside the repository and use placeholders in `.env.example`.","- Add hosting or runtime topology only after Phase 1 planning clarifies the deployment target."].join(`
`):[`- Start from the workspace \`${t.slug}\` and deploy repositories independently as needed.`,`- Use security level \`${e.security.level}\` as the minimum shared baseline across repositories.`,"- Keep shared secrets and deployment conventions documented at the workspace layer before repo-level divergence.","- Document repository-specific hosting targets only when the delivery plan requires them."].join(`
`),y=[c.segmentation?`- Segmentation: ${c.segmentation}`:null,c.canonicalFormat?`- Canonical format: ${c.canonicalFormat}`:null,c.exportFormat?`- Review / export targets: ${c.exportFormat}`:null,c.autosave?`- Autosave: ${c.autosave}`:null].filter(Boolean),j=u.length>0?u.map(f=>`- ${f}`).join(`
`):[g?"- The operator UI runs inside a local Tauri v2 desktop shell.":null,_?"- Media-heavy or ASR work runs in a local Python sidecar rather than inside the UI shell.":null,T?`- The shell-to-sidecar handoff is explicit through ${T}.`:null,v?`- Sidecar distribution is expected to use ${v}.`:null,!g&&!_?"- The first release currently assumes a single runtime boundary unless later planning says otherwise.":null].filter(Boolean).join(`
`);return`# ARCHITECTURE.md \u2014 System Architecture

## Project
${t.name} \u2014 ${t.description}

## Tech Stack
- Domains: ${(0,Te.formatDomains)(n.domains)}
- Primary Language: ${n.primary_language}
${E}${h}
${N}

## Adopted Technology Decisions
${s.length>0?s.join(`
`):"- No adopted technology decisions were captured at generation time."}

## Adopted External Dependencies
${a.length>0?a.join(`
`):"- No adopted external dependencies were captured at generation time."}

## Architecture Overview
${w}${K}

## First Workflow Shape
${l.length>0?l.map((f,k)=>`${k+1}. ${f}`).join(`
`):"- The first workflow shape has not been made explicit yet."}

${y.length>0?`## Transcript Contract
${y.join(`
`)}

`:""}## Key Components
${Y}

## Data Flow
${B}

## Runtime Boundary
${j}

## Infrastructure
${m}
`}});var Tt=d(Re=>{"use strict";Object.defineProperty(Re,"__esModule",{value:!0});Re.generateRoadmap=Po;var U=P(),Oo=["Project Setup & Foundation","Primary Workflow Delivery","Integration & Hardening","Review, QA & Release","Expansion & Automation","Stabilization & Documentation","Release Preparation","Post-Launch Iteration","Scale & Governance","Long-Term Maintenance"];function Po(e){let{project:t,workflow:n}=e,o=(0,U.inferBriefSignals)(e),r=(0,U.inferPipelineStages)(e),s=(0,U.summarizeDependencyNames)(e,"adopted"),a=(0,U.summarizeOpenPlanningItems)(e),l=(0,U.hasStableCliSurface)(e);function i(p){switch(p){case 0:return{goals:["Create the starter repository structure and baseline docs.","Lock project rules, security handling, and version traceability conventions."],deliverables:["Starter repository committed and readable by the team.","Current docs aligned enough for Phase 1 planning."]};case 1:{let c=["Turn the generated starter into a concrete execution plan.","Define the first end-to-end workflow and the smallest useful release scope."];return a.length>0&&(c.push("Resolve the highest-risk open planning items first."),c.push(...a.map(g=>g.endsWith(".")?g:`${g}.`))),o.hasDistributedRuntimeBoundary&&c.push("Document the browser client and Windows/GPU host boundary before implementation spreads across both sides."),{goals:c,deliverables:["Filled requirements, architecture, and implementation plan for the first workflow.","Resolved-vs-deferred list for open decisions and dependencies."]}}case 2:{let c=[r.length>0?`Implement the first working pipeline: ${r.join(" -> ")}.`:"Implement the first working end-to-end workflow."];return s.length>0&&c.push(`Integrate adopted dependencies needed for the first workflow: ${s.join(", ")}.`),o.hasDistributedRuntimeBoundary&&c.push("Implement the first browser-to-host handoff between the operator UI and the inference or media runtime."),l&&c.push("Lock the operator-facing command surface, arguments, and output contract for the first release."),{goals:c,deliverables:["First working vertical slice of the primary workflow.","Smoke checks or fixtures for the main workflow."]}}case 3:{let c=["Validate output quality, failure handling, and operator experience for the first workflow."];return o.hasTts?c.push("Verify synthesis parameters, output format, and post-processing quality gates."):o.hasTranscription&&c.push("Validate transcription accuracy, timestamp or speaker-label expectations, and export quality gates."),o.hasDistributedRuntimeBoundary&&c.push("Validate browser-to-host latency, transport failures, and recovery behavior on target hardware."),o.hasUnity&&c.push("Stabilize the Unity or downstream runtime handoff boundary before expanding scope."),{goals:c,deliverables:["Acceptance checks executed against the release-candidate workflow.","Release and rollback expectations captured in docs or runbooks."]}}case 4:return{goals:["Implement deferred integrations or automation items that were intentionally left out of the first release.","Convert remaining candidate dependencies into adopted, rejected, or explicitly deferred outcomes."],deliverables:["Deferred scope either shipped or intentionally rescheduled.","Planning docs updated to reflect what changed after the first release candidate."]};case 5:return{goals:["Stabilize documentation, observability, and supportability around the implemented workflow.","Reduce drift between starter docs, live behavior, and operational expectations."],deliverables:["Operational docs aligned with the real system.","Known support, monitoring, and maintenance tasks captured."]};case 6:return{goals:["Prepare the next release boundary with explicit scope, cutover checks, and rollback expectations.","Confirm that versioning and traceability surfaces remain accurate after feature expansion."],deliverables:["Release plan for the next milestone.","Updated versioning and traceability checklist."]};case 7:return{goals:["Collect post-launch feedback and convert it into scoped follow-up work.","Tighten the workflow based on real usage rather than assumptions."],deliverables:["Prioritized iteration backlog.","Documented learnings from initial users or operators."]};case 8:return{goals:["Scale governance, ownership, and operational controls without breaking the first workflow.","Clarify what must become policy versus what can remain team convention."],deliverables:["Updated governance and ownership model.","Expanded operational controls where justified by real usage."]};default:return{goals:[`Keep ${t.name} maintainable as scope expands.`,"Reassess technical debt, ownership, and operational load before adding more surface area."],deliverables:["Maintenance backlog reviewed and reprioritized.","Current architecture and requirements kept aligned with reality."]}}}let u=[];for(let p=0;p<n.phases_count;p++){let c=p,g=Oo[p]??`Iteration ${c}`,_=n.phases_count===1?"In Progress":p===0?"Complete":p===1?"In Progress":"Not Started",T=_==="Complete"?"x":" ",{goals:v,deliverables:E}=i(p);u.push(`### Phase ${c}: ${g}
- **Status**: ${_}
- **Goals**:
${v.map(h=>`  - [${T}] ${h}`).join(`
`)}
- **Deliverables**:
${E.map(h=>`  - [${T}] ${h}`).join(`
`)}
`)}return`# ROADMAP.md \u2014 Phase Plan

## Project
${t.name}

## Phase Overview
Total phases: ${n.phases_count}

${u.join(`
`)}
## Completion Criteria
- [ ] All phases completed
- [ ] All deliverables met
- [ ] Documentation up to date
`}});var Et=d(_e=>{"use strict";Object.defineProperty(_e,"__esModule",{value:!0});_e.generateAdrTemplate=$o;function $o(e){return`# ADR-XXXX: [Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Date
YYYY-MM-DD

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
### Positive
- ...

### Negative
- ...

## Alternatives Considered
- ...
`}});var Rt=d(we=>{"use strict";Object.defineProperty(we,"__esModule",{value:!0});we.generatePlansTemplate=Do;function Do(e){return`# Plan: [Task Title]

## Objective
What is the goal of this task?

## Background
Why is this task needed? What context is relevant?

## Approach
1. Step 1
2. Step 2
3. Step 3

## Files to Create/Modify
- \`path/to/file\` \u2014 description of changes

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
- Any additional context or constraints
`}});var _t=d(ve=>{"use strict";Object.defineProperty(ve,"__esModule",{value:!0});ve.generateRestart=jo;var No=C();function jo(e,t={}){let n=t.scope??(e.structure.repo_type==="multi"?"workspace":"single"),o=n==="repo"?"../docs/AI_TOOLING.md":"docs/AI_TOOLING.md",r=n==="repo"?"../GLOBAL_CONTEXT.md":"GLOBAL_CONTEXT.md";return`# Session Restart Protocol

When starting a new session or restarting, follow these steps:

## Step 1: Read Constitution
\`\`\`
Read PROJECT.md
Read ${o} if it exists
Read the tool-specific wrapper if present${(0,No.buildToolWrapperExampleClause)(e.tech)}
\`\`\`

## Step 2: Read Current State
\`\`\`
Read docs/ACTIVE_CONTEXT.md if it exists
Read ${r} or ../GLOBAL_CONTEXT.md if it exists
\`\`\`

## Step 3: Summarize
Before taking any action, summarize:
- Current phase
- What has been done
- What is being done now
- What is blocked
- What is the next step

## Step 4: Confirm
State your summary and wait for user confirmation before proceeding.

## Rules
- Do not infer or guess project state.
- If ACTIVE_CONTEXT.md conflicts with conversation, the file wins.
- Always re-read files \u2014 do not rely on memory from previous sessions.
`}});var wt=d(ke=>{"use strict";Object.defineProperty(ke,"__esModule",{value:!0});ke.generateSecurity=xo;function xo(e){let{project:t,security:n}=e,o="## Secret Management\n- All secrets must be stored in environment variables.\n- `.env` files must never be committed to version control.\n- `.env` is listed in `.gitignore`.\n- Use `.env.example` with placeholder values for documentation.";(n.level==="medium"||n.level==="high")&&(o+=`

## Logging & Output
- Never log secrets, tokens, or credentials to stdout, stderr, or log files.
- Environment variables must be loaded through a controlled loader; never read directly in business logic.
- Pre-commit hooks are recommended to prevent secret leaks (e.g., git-secrets, detect-secrets).`),n.level==="high"&&(o+=`

## Secret Rotation Policy
- All API keys and credentials must have a defined rotation schedule.
- Rotation procedures must be documented and tested.
- Expired credentials must be revoked immediately.

## Access Control
- Apply principle of least privilege for all service accounts.
- Document who has access to production secrets.
- Review access permissions quarterly.

## Incident Response
- If a secret is leaked, rotate immediately.
- Document the incident in an ADR.
- Review and update security policies after any incident.`);let r="";return n.has_api_keys&&(r+=`

## API Key Handling
- Store all API keys in \`.env\` \u2014 never hardcode.
- Use secret scanning tools (e.g., GitHub secret scanning, git-secrets) in CI.
- Rotate API keys regularly.`),n.has_user_data&&(r+=`

## Personal Data Policy
- Comply with applicable data protection regulations (e.g., GDPR, APPI).
- Never log personally identifiable information (PII).
- Encrypt user data at rest and in transit.
- Document data retention and deletion policies.`),n.has_payment_data&&(r+=`

## Payment Data Policy
- Reference PCI DSS requirements for all payment-related logic.
- Never store raw card numbers, CVVs, or PINs.
- Use tokenization for payment data handling.
- Payment processing must go through PCI-compliant service providers.
- Audit payment-related code changes with heightened scrutiny.`),n.has_ip_sensitive&&(r+=`

## IP Confidentiality
- This project contains NDA-protected or IP-sensitive information.
- Never include client-specific details in commit messages, comments, or documentation.
- Use codenames or anonymized identifiers for client references.
- Ensure all team members have signed applicable NDAs.`),n.has_credentials&&(r+=`

## Credential Management
- Store certificate paths and key files in \`.env\` \u2014 never in the repository.
- Certificate and key files are excluded via \`.gitignore\`.
- Define a rotation schedule for all certificates.
- Document certificate expiry dates and renewal procedures.`),`# SECURITY.md \u2014 Security Policy

## Project
${t.name}

## Security Level
**${n.level.toUpperCase()}**

${o}${r}
`}});var vt=d(Ae=>{"use strict";Object.defineProperty(Ae,"__esModule",{value:!0});Ae.generateEnvExample=Mo;var Lo=I();function Mo(e){let{security:t}=e,n=(0,Lo.getAdoptedEnvVars)(e),o=`# Environment Variables
# Copy this file to .env and fill in real values.
# NEVER commit .env to version control.

# Application
NODE_ENV=development
PORT=3000`;if(n.length>0){o+=`

# Adopted External Services`;for(let r of n)o+=`
${r}=YOUR_${r}_HERE`}else t.has_api_keys&&(o+=`

# API Keys
API_KEY=YOUR_API_KEY_HERE
API_SECRET=YOUR_SECRET_HERE`);return t.has_credentials&&(o+=`

# Certificates & Credentials
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
CA_CERT_PATH=/path/to/ca.pem`),o+=`
`,o}});var kt=d(Se=>{"use strict";Object.defineProperty(Se,"__esModule",{value:!0});Se.generateGitignore=Uo;function Uo(e){let{tech:t,security:n}=e,o=`# Dependencies
node_modules/
vendor/

# Environment
.env
.env.local
.env.*.local

# Build output
dist/
build/
out/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo`;return t.domains.includes("unity")&&(o+=`

# Unity
Library/
Temp/
Obj/
Logs/
UserSettings/
*.csproj
*.sln
*.pidb
*.userprefs`),t.domains.includes("mobile")&&(o+=`

# Mobile
*.apk
*.ipa
*.dSYM.zip
*.dSYM`),t.domains.includes("xr")&&(o+=`

# XR
*.unitypackage
StreamingAssets/`),n.has_credentials&&(o+=`

# Certificates & Credentials
*.pem
*.key
*.cert
*.p12
*.pfx`),n.has_ip_sensitive&&(o+=`

# Confidential / IP-sensitive
confidential/
nda/
*.confidential.*`),o+=`
`,o}});var bt=d(be=>{"use strict";Object.defineProperty(be,"__esModule",{value:!0});be.generateGlobalContext=Go;var Bo=C(),At=I(),St=$();function Go(e){let{project:t,structure:n}=e,o=(0,At.getAdoptedTechSummaryLines)(e),r=(0,At.getAdoptedDependencySummaryLines)(e),s=n.repos.map(p=>{let c=p.depends_on.length>0?` \u2192 depends on: ${p.depends_on.join(", ")}`:"";return`- **${p.name}** (${p.type}): ${p.description} \u2014 Owner: ${(0,St.formatOwner)(p.owner)}${c}`}).join(`
`),a=n.repos.filter(p=>p.depends_on.length>0),l="";a.length>0&&(l=`

## Dependency Graph
\`\`\`
      ${a.map(c=>c.depends_on.map(g=>`  ${c.name} \u2192 ${g}`).join(`
`)).join(`
`)}
\`\`\``);let i=(0,Bo.formatToolWrapperFiles)(e.tech),u=i?`- Tool-specific wrappers such as ${i} are thin adapters only.`:"- Tool-specific wrappers are thin adapters only.";return`# GLOBAL_CONTEXT.md \u2014 Multi-Repository Workspace

## Project
${t.name} \u2014 ${t.description}

## Owner
${(0,St.formatOwner)(t.owner)}

## Repositories
${s}
${l}

## Shared Decisions
${o.length>0?o.map(p=>`- ${p}`).join(`
`):"- No adopted technology decisions were captured at generation time."}

## Shared External Dependencies
${r.length>0?r.map(p=>`- ${p}`).join(`
`):"- No adopted external dependencies were captured at generation time."}

## Cross-Repo Conventions
- Each repository has its own \`PROJECT.md\` with repository-specific rules.
${u}
- Shared decisions are documented in this file.
- Workspace-level AI tooling policy lives in \`docs/AI_TOOLING.md\`.
- Workspace-level technology decisions live in \`docs/TECH_DECISIONS.md\`.
- Workspace-level external dependencies live in \`docs/EXTERNAL_DEPENDENCIES.md\`.
- Dependencies between repos should be managed explicitly.
- When a change in one repo affects another, update both repos' \`ACTIVE_CONTEXT.md\`.
`}});var It=d(Ie=>{"use strict";Object.defineProperty(Ie,"__esModule",{value:!0});Ie.generateContributing=qo;function qo(e){return`# Contributing to ${e.project.name}

## Branch Naming

\`\`\`
<type>/<short-description>
\`\`\`

| Type | \u7528\u9014 |
|------|------|
| \`feat/\` | \u65B0\u6A5F\u80FD |
| \`fix/\` | \u30D0\u30B0\u4FEE\u6B63 |
| \`refactor/\` | \u30EA\u30D5\u30A1\u30AF\u30BF\u30EA\u30F3\u30B0 |
| \`docs/\` | \u30C9\u30AD\u30E5\u30E1\u30F3\u30C8 |
| \`chore/\` | \u4F9D\u5B58\u30FB\u8A2D\u5B9A\u7B49 |
| \`test/\` | \u30C6\u30B9\u30C8\u8FFD\u52A0\u30FB\u4FEE\u6B63 |

\u4F8B: \`feat/add-auth\`, \`fix/null-check-user\`

## Commit Rules (Conventional Commits)

\`\`\`
<type>(<scope>): <summary>
\`\`\`

- **type**: feat | fix | refactor | docs | chore | test | ci | perf
- **scope**: \u4EFB\u610F\u3002\u5909\u66F4\u5BFE\u8C61\u306E\u30E2\u30B8\u30E5\u30FC\u30EB\u540D
- **summary**: \u82F1\u8A9E\u3001\u547D\u4EE4\u5F62\u3001\u5C0F\u6587\u5B57\u59CB\u307E\u308A\u3001\u672B\u5C3E\u306B\u30D4\u30EA\u30AA\u30C9\u4E0D\u8981

\u4F8B:
\`\`\`
feat(auth): add JWT token refresh
fix(api): handle null response from payment service
docs(readme): update install instructions
\`\`\`

## Pull Request Rules

### \u30BF\u30A4\u30C8\u30EB
Conventional Commits \u5F62\u5F0F\u306B\u5F93\u3046: \`feat(scope): summary\`

### \u672C\u6587\uFF08\u5FC5\u9808\u9805\u76EE\uFF09
PR\u672C\u6587\u306B\u306F\u4EE5\u4E0B\u3092\u5FC5\u305A\u542B\u3081\u308B\u3053\u3068:

1. **\u76EE\u7684** \u2014 \u306A\u305C\u3053\u306E\u5909\u66F4\u304C\u5FC5\u8981\u304B
2. **\u5909\u66F4\u70B9** \u2014 \u4F55\u3092\u5909\u3048\u305F\u304B\uFF08\u7B87\u6761\u66F8\u304D\uFF09
3. **\u30C6\u30B9\u30C8** \u2014 \u3069\u3046\u30C6\u30B9\u30C8\u3057\u305F\u304B
4. **\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30C1\u30A7\u30C3\u30AF** \u2014 \u4EE5\u4E0B\u3092\u78BA\u8A8D\u6E08\u307F\u3067\u3042\u308B\u3053\u3068:
   - [ ] API \u30AD\u30FC\u30FB\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u304C\u30B3\u30FC\u30C9\u306B\u542B\u307E\u308C\u3066\u3044\u306A\u3044
   - [ ] .env \u30D5\u30A1\u30A4\u30EB\u304C\u30B3\u30DF\u30C3\u30C8\u3055\u308C\u3066\u3044\u306A\u3044
   - [ ] \u30ED\u30B0\u306B\u30BB\u30F3\u30B7\u30C6\u30A3\u30D6\u60C5\u5831\u304C\u51FA\u529B\u3055\u308C\u306A\u3044

## Security

- **API \u30AD\u30FC\u30FB\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u30FB\u30C8\u30FC\u30AF\u30F3\u3092\u30B3\u30FC\u30C9\u306B\u542B\u3081\u308B\u3053\u3068\u306F\u7981\u6B62\u3002**
- \`.env\` \u30D5\u30A1\u30A4\u30EB\u306F\u7D76\u5BFE\u306B\u30B3\u30DF\u30C3\u30C8\u3057\u306A\u3044\u3002
- \u30D7\u30EC\u30FC\u30B9\u30DB\u30EB\u30C0\u30FC\uFF08\`YOUR_API_KEY_HERE\`\uFF09\u3092\u4F7F\u3046\u3053\u3068\u3002
- \u9055\u53CD\u3092\u767A\u898B\u3057\u305F\u5834\u5408\u306F\u5373\u5EA7\u306B\u30ED\u30FC\u30C6\u30FC\u30B7\u30E7\u30F3\u3057\u3001ADR \u306B\u8A18\u9332\u3059\u308B\u3053\u3068\u3002

## Release Tags

\`\`\`
vX.Y.Z
\`\`\`

- [Semantic Versioning](https://semver.org/) \u306B\u5F93\u3046
- **X**: \u7834\u58CA\u7684\u5909\u66F4
- **Y**: \u5F8C\u65B9\u4E92\u63DB\u306E\u6A5F\u80FD\u8FFD\u52A0
- **Z**: \u30D0\u30B0\u4FEE\u6B63
- tag push \u3067 CI/CD \u304C\u767A\u706B\u3059\u308B\u524D\u63D0
`}});var Ct=d(Ce=>{"use strict";Object.defineProperty(Ce,"__esModule",{value:!0});Ce.generatePrTemplate=Fo;function Fo(e){return`## Purpose
<!-- \u306A\u305C\u3053\u306E\u5909\u66F4\u304C\u5FC5\u8981\u304B\u30021\u301C2\u6587\u3067\u3002 -->

## Changes
<!-- \u4F55\u3092\u5909\u3048\u305F\u304B\u3002\u7B87\u6761\u66F8\u304D\u3002 -->
-
-

## Test
<!-- \u3069\u3046\u30C6\u30B9\u30C8\u3057\u305F\u304B\u3002\u624B\u52D5/\u81EA\u52D5\u306E\u533A\u5225\u3092\u660E\u8A18\u3002 -->
- [ ] \u30E6\u30CB\u30C3\u30C8\u30C6\u30B9\u30C8\u8FFD\u52A0/\u66F4\u65B0
- [ ] \u30ED\u30FC\u30AB\u30EB\u3067\u52D5\u4F5C\u78BA\u8A8D\u6E08\u307F

## Security Checklist
- [ ] API\u30AD\u30FC\u30FB\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u304C\u30B3\u30FC\u30C9\u306B\u542B\u307E\u308C\u3066\u3044\u306A\u3044
- [ ] .env\u30D5\u30A1\u30A4\u30EB\u304C\u30B3\u30DF\u30C3\u30C8\u3055\u308C\u3066\u3044\u306A\u3044
- [ ] \u30ED\u30B0\u306B\u30BB\u30F3\u30B7\u30C6\u30A3\u30D6\u60C5\u5831\u304C\u51FA\u529B\u3055\u308C\u306A\u3044

## Related Issues
<!-- \u95A2\u9023Issue: closes #XX -->
`}});var Ot=d(Oe=>{"use strict";Object.defineProperty(Oe,"__esModule",{value:!0});Oe.generateIssueBugReport=Vo;function Vo(e){return`---
name: Bug Report
about: \u30D0\u30B0\u3092\u5831\u544A\u3059\u308B
title: "fix: "
labels: bug
---

## \u73FE\u8C61
<!-- \u4F55\u304C\u8D77\u304D\u305F\u304B\u3092\u7C21\u6F54\u306B\u3002 -->

## \u518D\u73FE\u624B\u9806
1.
2.
3.

## \u671F\u5F85\u3059\u308B\u52D5\u4F5C
<!-- \u672C\u6765\u3069\u3046\u306A\u308B\u3079\u304D\u304B\u3002 -->

## \u5B9F\u969B\u306E\u52D5\u4F5C
<!-- \u5B9F\u969B\u306B\u4F55\u304C\u8D77\u304D\u305F\u304B\u3002\u30A8\u30E9\u30FC\u30E1\u30C3\u30BB\u30FC\u30B8\u304C\u3042\u308C\u3070\u8CBC\u308B\u3002 -->

## \u74B0\u5883
- OS:
- Node.js:
- \u30D0\u30FC\u30B8\u30E7\u30F3:

## \u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8
<!-- \u3042\u308C\u3070\u6DFB\u4ED8\u3002 -->
`}});var Pt=d(Pe=>{"use strict";Object.defineProperty(Pe,"__esModule",{value:!0});Pe.generateIssueFeatureRequest=Wo;function Wo(e){return`---
name: Feature Request
about: \u65B0\u6A5F\u80FD\u306E\u63D0\u6848
title: "feat: "
labels: enhancement
---

## \u6982\u8981
<!-- \u4F55\u3092\u5B9F\u73FE\u3057\u305F\u3044\u304B\u30021\u301C2\u6587\u3067\u3002 -->

## \u80CC\u666F\u30FB\u52D5\u6A5F
<!-- \u306A\u305C\u3053\u306E\u6A5F\u80FD\u304C\u5FC5\u8981\u304B\u3002 -->

## \u63D0\u6848\u3059\u308B\u89E3\u6C7A\u7B56
<!-- \u3069\u3046\u5B9F\u88C5\u3059\u308B\u304B\u3002\u53EF\u80FD\u306A\u3089\u5177\u4F53\u7684\u306B\u3002 -->

## \u4EE3\u66FF\u6848
<!-- \u4ED6\u306B\u691C\u8A0E\u3057\u305F\u65B9\u6CD5\u304C\u3042\u308C\u3070\u3002 -->

## \u8FFD\u52A0\u60C5\u5831
<!-- \u53C2\u8003\u30EA\u30F3\u30AF\u3001\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8\u7B49\u3002 -->
`}});var $t=d($e=>{"use strict";Object.defineProperty($e,"__esModule",{value:!0});$e.generateVersioningStandard=Xo;var Ho=P();function Xo(e){let t=(0,Ho.hasOperatorFacingUi)(e)?`### 6. Preferred operator UI label
- For operator-facing web or desktop UI, default placement is a small low-emphasis label in the top-right of the header.
- Preferred compact label: \`v<release> (<commit>) <deploy time>\` (for example \`v2.2.13 (b41ecc0) 6:14\`).
- Keep the label visible during active development and rollout so operators can tell whether the current screen reflects the latest deploy.
- After the product stabilizes, the label may be hidden, feature-flagged, or restricted to admins if the same runtime identity remains inspectable elsewhere.
`:`### 6. Optional operator UI label
- If the project later adds operator-facing web or desktop UI, default placement for runtime identity is a small low-emphasis label in the top-right of the header.
- Preferred compact label: \`v<release> (<commit>) <deploy time>\`.
- The label may be hidden, feature-flagged, or restricted to admins after launch, as long as runtime identity remains inspectable elsewhere.
`;return`# VERSIONING_STANDARD.md

## Purpose
Define how ${e.project.name} should expose release identity and runtime traceability.

## Rules

### 1. Stable releases must be tagged
- Stable releases use Git tags in the form \`vMAJOR.MINOR.PATCH\`.
- A stable release must correspond to a tested deployable state.

### 2. Runtime identity must be inspectable
- Deployable services must expose:
  - release version
  - commit SHA
  - deploy or publication time
  - environment
- If the identity is shown in UI, prefer a compact low-emphasis label such as \`v2.2.13 (4094d23) 6:14\`.
- The requirement is observability, not a fixed UI layout.

### 3. API services
- APIs should expose version identity via:
  - \`/healthz\`
  - \`/version\`
  - response headers
  - structured logs

### 4. CLI tools
- CLI tools should support \`--version\`.
- Output should identify the release and, when possible, the commit.

### 5. Release policy
- Release version is the human-facing stable label.
- Commit SHA is the exact deployed code identity.
- Both should be retained for rollback and incident handling.

${t}

### 7. Minimum operational requirement
- Operators must be able to answer:
  - What release is running?
  - What commit is running?
  - When was this deploy or publication made visible?
  - Which environment is affected?
`}});var Dt=d(De=>{"use strict";Object.defineProperty(De,"__esModule",{value:!0});De.createEmptySkillsManifest=zo;function zo(){return{version:1,source:"repogenesis",installed:[]}}});var Nt=d(Ne=>{"use strict";Object.defineProperty(Ne,"__esModule",{value:!0});Ne.generateSkillsReadme=Jo;function Jo(e,t=[],n){let o=n?.bundledAtGeneration??!1,r=t.length>0?`Selected AI work guides at generation time: ${t.map(a=>`${a.name} (${a.id})`).join(", ")}.`:"No AI work guides were pre-selected at generation time.",s=o?"The selected AI work guides are already bundled in this repository and recorded in `repogenesis.skills.json`.":"No AI work guides are installed by default.";return`# skills/README.md

## Purpose
This directory is reserved for optional AI work guides used by ${e.project.name}.

RepoGenesis does not place project knowledge directly into generator core.
Instead, optional AI work guides can be added here when the project explicitly opts in.

## Rules
- Treat AI work guides as an optional layer, not part of the core repository constitution.
- Record every installed guide and its pinned version in \`repogenesis.skills.json\`.
- Do not auto-update guides without project review.
- Prefer \`copy + pin\` so the installed files remain reviewable in this repository.
- Use provider-specific artifacts when needed:
  - Codex / Claude Code: skill instructions
  - Gemini CLI: commands, context files, or extensions
- Keep the source type (\`official\`, \`curated\`, \`internal\`) traceable in the manifest.
- Bundled guides do not run automatically. They help when you work with this repository in the supported AI tool.

## Expected Future Flow
1. A curated registry lists approved AI work guides.
2. This project opts into specific guides and providers.
3. Installed provider-specific artifacts are copied into this repository.
4. \`repogenesis.skills.json\` is updated with the installed versions and artifact paths.

## Current State
${s}
${r}

${t.length>0&&!o?"Use `scripts/install-selected-skills.sh` after ZIP extraction to add the selected AI work guides.":""}
`}});var xe=d(je=>{"use strict";Object.defineProperty(je,"__esModule",{value:!0});je.buildSelectedSkillInstallCommands=Zo;var Ko=C();function Yo(e){let t=(0,Ko.normalizeAiTools)(e.tech),n=new Set;return t.includes("codex")&&n.add("codex"),t.includes("claude_code")&&n.add("claude_code"),t.includes("gemini_cli")&&n.add("gemini_cli"),n}function Qo(e,t){let n=Yo(e),o=t.providers.filter(r=>r!=="tool_agnostic"&&n.has(r));return o.length>0?o:t.providers.includes("tool_agnostic")?["tool_agnostic"]:t.providers.filter(r=>r!=="tool_agnostic")}function Zo(e,t,n='"$PROJECT_ROOT"',o='"$REGISTRY_ROOT"'){return t.map(r=>{let a=Qo(e,r).map(l=>` --provider ${l}`).join("");return`node dist/index.js skills add --project ${n} --registry ${o} --skill "${r.id}"${a}`})}});var jt=d(Le=>{"use strict";Object.defineProperty(Le,"__esModule",{value:!0});Le.generateInstallSelectedSkillsScript=tr;var er=xe();function tr(e,t){return`#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPOGENESIS_ROOT="\${REPOGENESIS_ROOT:-/path/to/RepoGenesis}"
GENERATOR_DIR="$REPOGENESIS_ROOT/generator"
REGISTRY_ROOT="$REPOGENESIS_ROOT/skills/registry"

if [ ! -d "$GENERATOR_DIR" ]; then
  echo "generator directory not found: $GENERATOR_DIR" >&2
  echo "Set REPOGENESIS_ROOT to your RepoGenesis checkout before running this script." >&2
  exit 1
fi

cd "$GENERATOR_DIR"
npm run build

${(0,er.buildSelectedSkillInstallCommands)(e,t).join(`
`)}
`}});var xt=d(Me=>{"use strict";Object.defineProperty(Me,"__esModule",{value:!0});Me.generateRunbookReadme=nr;function nr(e){return`# Runbooks

## Purpose
Store operational procedures for ${e.project.name}.

## Generated baseline
- \`production-bootstrap.md\`: production target, ownership, and secret inventory before first deploy
- \`production-cutover.md\`: first deployment checklist and stop conditions
- \`production-checks.md\`: repeatable pre/post-deploy verification checklist
- \`rollback.md\`: release rollback steps and data integrity notes
- \`incident-response.md\`: severity, containment, recovery, and follow-up flow
- \`skill-install.md\`: selected skill installation handoff for AI tooling

## How to maintain these runbooks
- Keep them aligned with \`docs/TECH_DECISIONS.md\`, \`docs/EXTERNAL_DEPENDENCIES.md\`, \`.env.example\`, and \`SECURITY.md\`.
- Replace placeholders with concrete deploy commands, URLs, owners, and dashboards before production use.
- Re-run \`repogenesis doctor --project <project-root>\` after major structural edits so generated docs stay coherent.
`}});var Lt=d(Ue=>{"use strict";Object.defineProperty(Ue,"__esModule",{value:!0});Ue.generateProductionBootstrapRunbook=or;function or(e){let t=e.structure.repo_type==="multi"?"workspace root and each deployable repository":"repository root";return`# production-bootstrap.md

## Purpose
Prepare ${e.project.name} for its first real deployment before any cutover work starts.

## Inputs to confirm
- \`PROJECT.md\`
- \`docs/TECH_DECISIONS.md\`
- \`docs/EXTERNAL_DEPENDENCIES.md\`
- \`.env.example\`
- \`SECURITY.md\`
- tool wrapper files (\`AGENTS.md\` / \`CLAUDE.md\` / \`GEMINI.md\`) when present

## Bootstrap checklist
1. Confirm the deployment scope for this project.
   - Expected scope: ${t}
   - Record the environment names to support: development / staging / production.
2. Assign owners.
   - Product owner
   - Technical owner
   - Operations owner
   - Security contact
3. Provision required external services.
   - Cross-check adopted dependencies in \`docs/EXTERNAL_DEPENDENCIES.md\`.
   - Record which service is the system of record for data, auth, storage, queues, notifications, and observability.
4. Create the environment variable inventory.
   - Start from \`.env.example\`.
   - Record where each secret lives and who can rotate it.
5. Define access control.
   - Decide who can deploy, who can change secrets, and who can approve production rollout.
   - If this project handles user data, credentials, or regulated data, map those controls back to \`SECURITY.md\`.
6. Decide monitoring and alerting.
   - Runtime health check
   - Error reporting
   - Audit trail location
   - On-call or primary responder
7. Decide backup and restore expectations.
   - Data backup schedule
   - Restore owner
   - Recovery point / recovery time expectations

## Exit criteria
- All adopted external dependencies have named owners.
- All required env vars have a real secret source.
- Production access and approval roles are defined.
- Monitoring, rollback owner, and incident contact are documented.
`}});var Mt=d(Be=>{"use strict";Object.defineProperty(Be,"__esModule",{value:!0});Be.generateProductionCutoverRunbook=rr;function rr(e){let t=e.structure.repo_type==="multi"?`- Repeat the deployment and verification steps for each production-facing repository in the workspace.
`:"";return`# production-cutover.md

## Purpose
Run the first production deployment for ${e.project.name} in a controlled way.

## Preconditions
- \`docs/runbooks/production-bootstrap.md\` is complete.
- The current generated docs still match the intended release.
- \`repogenesis doctor --project <project-root>\` passes on the release candidate.
- All adopted env vars from \`.env.example\` are provisioned in the target environment.
- Any required migrations, seed data, or infrastructure changes are prepared and reviewed.

## Cutover steps
1. Freeze the release candidate.
   - Record the commit SHA, build artifact, and deploy operator.
2. Confirm environment readiness.
   - Secrets present
   - External dependencies reachable
   - Monitoring destination enabled
3. Apply schema or infrastructure changes in the approved order.
4. Deploy the application release.
${t}5. Run smoke checks.
   - Public entrypoint responds
   - Auth path responds, if auth exists
   - Primary write path or mutation path succeeds
   - Logging and alerting receive fresh events
6. Verify the first operational workflow end to end.
   - Choose one representative workflow from \`docs/REQUIREMENTS.md\`.
7. Announce cutover completion with known limitations and rollback owner.

## Stop conditions
- Required secrets are missing.
- A migration is only partially applied.
- Primary workflow smoke checks fail.
- Monitoring is blind during deploy.

## Evidence to capture
- Deployed version / commit
- Time of deploy
- Operator
- Smoke test result
- Any partial failures or mitigations
`}});var Ut=d(Ge=>{"use strict";Object.defineProperty(Ge,"__esModule",{value:!0});Ge.generateProductionChecksRunbook=sr;function sr(e){let t=e.structure.repo_type==="multi"?"workspace root plus each deployable repository":"repository root";return`# production-checks.md

## Purpose
Provide a repeatable verification checklist for ${e.project.name} after deploys and during support work.

## Before deploy
- Run \`repogenesis doctor --project <project-root>\`.
- Confirm generated docs under ${t} still reflect the intended release.
- Confirm adopted dependencies in \`docs/EXTERNAL_DEPENDENCIES.md\` are reachable.
- Confirm all required env vars from \`.env.example\` exist in the target environment.
- Confirm rollback target is known before starting.

## After deploy
- Entry URL returns the expected status code.
- Authentication flow works, if present.
- A representative read path succeeds.
- A representative write path succeeds.
- Background jobs, queues, cron, or notifications run as expected, if present.
- Logs, metrics, and error tracking receive fresh traffic.
- Any external dependency with outbound data flow is verified once.

## Operational evidence
- Release version / commit
- Time window checked
- Operator
- Links to logs, dashboards, or incident notes

## When to escalate
- Primary workflow fails after deploy.
- Auth or permissions behave differently from the documented expectations.
- Error rate spikes or logs stop arriving.
- Data integrity is unclear after a deploy or migration.
`}});var Bt=d(qe=>{"use strict";Object.defineProperty(qe,"__esModule",{value:!0});qe.generateRollbackRunbook=ir;function ir(e){return`# rollback.md

## Purpose
Restore ${e.project.name} to the last known good production state when a release is not safe to keep running.

## Rollback triggers
- Primary workflow is unavailable or corrupt after release.
- Authentication, authorization, or billing behavior regresses.
- Error rate or latency exceeds the agreed operational threshold.
- A migration or integration change cannot be completed safely.

## Rollback procedure
1. Declare rollback ownership.
   - Name the incident lead and communication owner.
2. Freeze further deploys and config changes.
3. Identify the last known good release.
   - Commit SHA
   - Artifact or image tag
   - Required matching config version
4. Revert application and infrastructure changes in the approved order.
5. If migrations are involved, decide whether rollback is safe or whether forward-fix is safer.
6. Run the checks in \`docs/runbooks/production-checks.md\`.
7. Announce rollback completion and remaining risk.

## Data integrity notes
- Record whether any writes happened during the failed release window.
- Record whether third-party side effects already occurred.
- If secrets or credentials may have been exposed, rotate them immediately after service is stable.

## Follow-up
- Open a post-incident review.
- Capture the exact rollback trigger.
- Update deployment and cutover docs before the next production release.
`}});var Gt=d(Fe=>{"use strict";Object.defineProperty(Fe,"__esModule",{value:!0});Fe.generateIncidentResponseRunbook=ar;function ar(e){return`# incident-response.md

## Purpose
Coordinate response work when ${e.project.name} has an operational or security incident.

## Severity guide
- SEV-1: Broad outage, data loss risk, or active security event.
- SEV-2: Major feature degraded, workaround exists, or repeated customer impact.
- SEV-3: Limited impact, internal-only degradation, or support issue without sustained outage.

## First response
1. Name the incident lead.
2. Record start time, affected surface, and current symptoms.
3. Decide severity and communication channel.
4. Preserve evidence.
   - Error logs
   - Audit trail
   - Recent deploy or config change
   - External dependency status

## Containment
- Stop or limit the blast radius.
- Disable the failing feature, revert the deploy, or isolate the dependency if needed.
- If credentials may be compromised, rotate them and invalidate sessions.

## Recovery
- Restore the primary workflow first.
- Use \`docs/runbooks/rollback.md\` when rollback is the safest path.
- Run \`docs/runbooks/production-checks.md\` before declaring recovery complete.

## Communication
- Keep an incident timeline with decisions and owners.
- Record customer-facing updates separately from internal debugging notes.
- Capture which dependency owners or vendors were contacted.

## Aftercare
- Publish a brief incident summary.
- Open follow-up tasks for monitoring, tests, docs, or architecture changes.
- Review whether \`SECURITY.md\`, \`.env.example\`, or the planning docs should change.
`}});var qt=d(Ve=>{"use strict";Object.defineProperty(Ve,"__esModule",{value:!0});Ve.generateSkillInstallRunbook=dr;var cr=xe();function dr(e,t=[],n){let o=n?.bundledAtGeneration??!1,r=t.length>0?(0,cr.buildSelectedSkillInstallCommands)(e,t,'"$PROJECT_ROOT"','"$REGISTRY_ROOT"').join(`
`):"",s=t.length>0&&o?`
## Bundled In This Repository
${t.map(a=>`- ${a.name} (\`${a.id}\`, ${a.sourceType}, ${a.version})`).join(`
`)}

## Current State
- The selected AI work guides were copied into this repository during generation.
- \`repogenesis.skills.json\` already records the bundled artifact paths.
- Additional install commands are not required for the initial setup.
- These guides do not run automatically. Use them when working with this repository in the supported AI tool.
`:t.length>0?`
## Recommended For This Project
${t.map(a=>`- ${a.name} (\`${a.id}\`, ${a.sourceType}, ${a.version})`).join(`
`)}

## Suggested Next Step
Use the generated selection as the initial install shortlist. Review provider-specific artifacts before installing.

## Generated Install Script
- Script: \`scripts/install-selected-skills.sh\`
- Before running, set \`REPOGENESIS_ROOT\` to your local RepoGenesis checkout.

## Equivalent Commands
\`\`\`bash
PROJECT_ROOT="/path/to/generated-project"
REGISTRY_ROOT="/path/to/RepoGenesis/skills/registry"
cd /path/to/RepoGenesis/generator
npm run build
${r}
\`\`\`
`:"";return`# skill-install.md

## Purpose
This runbook explains how to add optional AI work guides to ${e.project.name}.

## Current Policy
- AI work guides are optional. They are not part of the core repository structure.
- Installed guides must be recorded in \`repogenesis.skills.json\`.
- Initial install mode is \`copy + pin\`.
- Guides must not auto-update without project review.
- Provider-specific artifacts are allowed when required by Codex, Claude Code, or Gemini CLI.

## Manual Install Flow
1. Choose an approved skill from the curated registry.
2. Review the skill owner, source type, risk level, and provider-specific artifacts.
3. Copy the required artifact files into the project.
4. Add or update the matching entry in \`repogenesis.skills.json\` with each installed artifact path.
5. Commit the skill files and manifest change together.

## Manual Update Flow
1. Check the currently pinned version in \`repogenesis.skills.json\`.
2. Review the changelog of the target version.
3. Replace the installed provider-specific artifacts.
4. Update the pinned version and artifact metadata in \`repogenesis.skills.json\`.
5. Review and test before merge.

## Manual Remove Flow
1. Confirm which files belong to the skill.
2. Remove the copied artifacts for each provider.
3. Remove the manifest entry from \`repogenesis.skills.json\`.
4. Review the diff to ensure no project-specific customization is lost.

## Notes
- High-risk skills should require an explicit review before install.
- Project-specific scripts, hooks, and editor settings should not be treated as curated skills by default.
- Gemini CLI artifacts may be commands, context files, or extensions instead of a single \`SKILL.md\`.
${s}
`}});var Ft=d(S=>{"use strict";Object.defineProperty(S,"__esModule",{value:!0});S.DEFAULT_RUNBOOK_PATHS=void 0;S.buildDefaultRunbookEntries=yr;var lr=xt(),pr=Lt(),ur=Mt(),mr=Ut(),hr=Bt(),gr=Gt(),fr=qt();S.DEFAULT_RUNBOOK_PATHS=["docs/runbooks/README.md","docs/runbooks/production-bootstrap.md","docs/runbooks/production-cutover.md","docs/runbooks/production-checks.md","docs/runbooks/rollback.md","docs/runbooks/incident-response.md","docs/runbooks/skill-install.md"];function yr(e,t,n){return[[S.DEFAULT_RUNBOOK_PATHS[0],(0,lr.generateRunbookReadme)(e)],[S.DEFAULT_RUNBOOK_PATHS[1],(0,pr.generateProductionBootstrapRunbook)(e)],[S.DEFAULT_RUNBOOK_PATHS[2],(0,ur.generateProductionCutoverRunbook)(e)],[S.DEFAULT_RUNBOOK_PATHS[3],(0,mr.generateProductionChecksRunbook)(e)],[S.DEFAULT_RUNBOOK_PATHS[4],(0,hr.generateRollbackRunbook)(e)],[S.DEFAULT_RUNBOOK_PATHS[5],(0,gr.generateIncidentResponseRunbook)(e)],[S.DEFAULT_RUNBOOK_PATHS[6],(0,fr.generateSkillInstallRunbook)(e,t,n)]]}});var Nr=d(Je=>{Object.defineProperty(Je,"__esModule",{value:!0});Je.generateFromSpec=Dr;var Vt=C(),We=st(),Tr=it(),Er=at(),Rr=ct(),_r=lt(),Wt=pt(),Ht=mt(),Xt=ht(),zt=gt(),wr=yt(),Jt=Tt(),Kt=Et(),Yt=Rt(),Qt=_t(),Zt=wt(),en=vt(),He=kt(),vr=bt(),tn=It(),nn=Ct(),on=Ot(),rn=Pt(),Xe=$t(),sn=Dt(),an=Nt(),cn=jt(),kr=$(),dn=Ft(),Ar="1.0";function Sr(e,t){return"specVersion"in e?e.specVersion:t?.specVersion??Ar}function br(e){if("specVersion"in e){let{specVersion:t,...n}=e;return n}return e}function Ir(e,t,n,o,r){return{specVersion:o,generatorVersion:n?.generatorVersion??"dev",generatedAt:n?.generatedAt??new Date().toISOString(),source:n?.source??r,projectSlug:e.project.slug,repoType:e.structure.repo_type,fileCount:t,selectedSkills:n?.selectedSkills??[]}}function ze(e,t){let n=t.prefix??"",o=[];for(let r of(0,Vt.normalizeAiTools)(e.tech))if(r!=="other"){if(r==="codex"){o.push([`${n}AGENTS.md`,(0,Tr.generateAgentsMd)(e,t)]);continue}if(r==="claude_code"){o.push([`${n}CLAUDE.md`,(0,Er.generateClaudeMd)(e,t)]);continue}o.push([`${n}GEMINI.md`,(0,Rr.generateGeminiMd)(e,t)])}return o}function Cr(e,t){let n=new Date().toISOString().split("T")[0],o=t.depends_on.length>0?`- Depends on: ${t.depends_on.join(", ")}`:"- No dependencies",r=["`PROJECT.md`",...(0,Vt.getToolWrapperFiles)(e.tech).map(s=>`\`${s}\``)].filter(Boolean).join(`
- `);return`# ACTIVE_CONTEXT.md \u2014 ${t.name}

## Last Updated
${n}

## Current Phase
Phase 0 \u2014 Repository Initialization

## What Has Been Done
- Repository structure generated by RepoGenesis.
- Common constitution created in PROJECT.md.
- Tool-specific wrapper files created when enabled.
${o}

## What Is Being Done Now
- Ready for Phase 1 planning.

## What Is Blocked
- Nothing currently blocked.

## Files That Exist
- ${r}
- \`docs/ACTIVE_CONTEXT.md\` (this file)
- \`docs/ARCHITECTURE.md\`
- \`docs/ROADMAP.md\`
- \`docs/VERSIONING_STANDARD.md\`
- \`../docs/AI_TOOLING.md\`
- \`../docs/TECH_DECISIONS.md\`
- \`../docs/EXTERNAL_DEPENDENCIES.md\`
- \`docs/ADR/0000-template.md\`
- \`plans/template.md\`
- \`prompts/restart.md\`

## Next Step
Begin Phase 1 planning for ${t.name}.
`}function Or(e,t){let n=t.depends_on.length>0?`
### Dependencies
${t.depends_on.map(o=>`- ${o}`).join(`
`)}`:"";return`# ARCHITECTURE.md \u2014 ${t.name}

## Repository
- **Name**: ${t.name}
- **Type**: ${t.type}
- **Description**: ${t.description}
- **Owner**: ${(0,kr.formatOwner)(t.owner)}

## Part of
${e.project.name} (workspace: ${e.project.slug})
${n}

## Architecture Overview
[Describe the architecture for this ${t.type} repository]

## Key Components
[List and describe key components]

## Data Flow
[Describe data flow within this repository and with dependencies]
`}function Pr(e,t){let n=new Map,o=t?.selectedSkills??[],r=t?.selectedSkillsBundled??!1,s=t?.selectedSkillsManifest??(0,sn.createEmptySkillsManifest)(),a=t?.selectedSkillFiles??[],l=[["PROJECT.md",(0,We.generateProjectMd)(e,{scope:"single"})],...ze(e,{scope:"single"}),["docs/ACTIVE_CONTEXT.md",(0,_r.generateActiveContext)(e)],["docs/AI_TOOLING.md",(0,Wt.generateAiTooling)(e)],["docs/TECH_DECISIONS.md",(0,Ht.generateTechDecisions)(e)],["docs/EXTERNAL_DEPENDENCIES.md",(0,Xt.generateExternalDependencies)(e)],["docs/REQUIREMENTS.md",(0,zt.generateRequirements)(e)],["docs/ARCHITECTURE.md",(0,wr.generateArchitecture)(e)],["docs/ROADMAP.md",(0,Jt.generateRoadmap)(e)],["docs/VERSIONING_STANDARD.md",(0,Xe.generateVersioningStandard)(e)],["docs/ADR/0000-template.md",(0,Kt.generateAdrTemplate)(e)],...(0,dn.buildDefaultRunbookEntries)(e,o,{bundledAtGeneration:r}),["plans/template.md",(0,Yt.generatePlansTemplate)(e)],["prompts/restart.md",(0,Qt.generateRestart)(e,{scope:"single"})],["SECURITY.md",(0,Zt.generateSecurity)(e)],[".env.example",(0,en.generateEnvExample)(e)],[".gitignore",(0,He.generateGitignore)(e)],["skills/README.md",(0,an.generateSkillsReadme)(e,o,{bundledAtGeneration:r})],["repogenesis.skills.json",`${JSON.stringify(s,null,2)}
`],["CONTRIBUTING.md",(0,tn.generateContributing)(e)],[".github/PULL_REQUEST_TEMPLATE.md",(0,nn.generatePrTemplate)(e)],[".github/ISSUE_TEMPLATE/bug_report.md",(0,on.generateIssueBugReport)(e)],[".github/ISSUE_TEMPLATE/feature_request.md",(0,rn.generateIssueFeatureRequest)(e)]];for(let[i,u]of l)n.set(i,u);o.length>0&&!r&&n.set("scripts/install-selected-skills.sh",(0,cn.generateInstallSelectedSkillsScript)(e,o));for(let[i,u]of a)n.set(i,u);return n}function $r(e,t){let n=new Map,o=t?.selectedSkills??[],r=t?.selectedSkillsBundled??!1,s=t?.selectedSkillsManifest??(0,sn.createEmptySkillsManifest)(),a=t?.selectedSkillFiles??[],l=[["PROJECT.md",(0,We.generateProjectMd)(e,{scope:"workspace"})],...ze(e,{scope:"workspace"}),["GLOBAL_CONTEXT.md",(0,vr.generateGlobalContext)(e)],["docs/AI_TOOLING.md",(0,Wt.generateAiTooling)(e)],["docs/TECH_DECISIONS.md",(0,Ht.generateTechDecisions)(e)],["docs/EXTERNAL_DEPENDENCIES.md",(0,Xt.generateExternalDependencies)(e)],["REQUIREMENTS.md",(0,zt.generateRequirements)(e)],["SECURITY.md",(0,Zt.generateSecurity)(e)],["VERSIONING_STANDARD.md",(0,Xe.generateVersioningStandard)(e)],...(0,dn.buildDefaultRunbookEntries)(e,o,{bundledAtGeneration:r}),[".gitignore",(0,He.generateGitignore)(e)],["skills/README.md",(0,an.generateSkillsReadme)(e,o,{bundledAtGeneration:r})],["repogenesis.skills.json",`${JSON.stringify(s,null,2)}
`],["CONTRIBUTING.md",(0,tn.generateContributing)(e)],[".github/PULL_REQUEST_TEMPLATE.md",(0,nn.generatePrTemplate)(e)],[".github/ISSUE_TEMPLATE/bug_report.md",(0,on.generateIssueBugReport)(e)],[".github/ISSUE_TEMPLATE/feature_request.md",(0,rn.generateIssueFeatureRequest)(e)]];for(let[i,u]of l)n.set(i,u);o.length>0&&!r&&n.set("scripts/install-selected-skills.sh",(0,cn.generateInstallSelectedSkillsScript)(e,o));for(let[i,u]of a)n.set(i,u);for(let i of e.structure.repos){let u=[[`${i.name}/PROJECT.md`,(0,We.generateProjectMd)(e,{scope:"repo",repo:i})],...ze(e,{prefix:`${i.name}/`,scope:"repo",repo:i}),[`${i.name}/docs/ACTIVE_CONTEXT.md`,Cr(e,i)],[`${i.name}/docs/ARCHITECTURE.md`,Or(e,i)],[`${i.name}/docs/ROADMAP.md`,(0,Jt.generateRoadmap)(e)],[`${i.name}/docs/VERSIONING_STANDARD.md`,(0,Xe.generateVersioningStandard)(e)],[`${i.name}/docs/ADR/0000-template.md`,(0,Kt.generateAdrTemplate)(e)],[`${i.name}/plans/template.md`,(0,Yt.generatePlansTemplate)(e)],[`${i.name}/prompts/restart.md`,(0,Qt.generateRestart)(e,{scope:"repo"})],[`${i.name}/.env.example`,(0,en.generateEnvExample)(e)],[`${i.name}/.gitignore`,(0,He.generateGitignore)(e)]];for(let[p,c]of u)n.set(p,c)}return n}function Dr(e,t){let n="specVersion"in e?"projectSpec":"legacyBrief",o=Sr(e,t),r=br(e),s=r.structure.repo_type==="multi"?$r(r,t):Pr(r,t),a=Ir(r,s.size+1,t,o,n);return s.set(".repogenesis/manifest.json",`${JSON.stringify(a,null,2)}
`),s}});export default Nr();
