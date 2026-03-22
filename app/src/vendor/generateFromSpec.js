// Generated from generator/dist/generateFromSpec.js. Run `npm run sync:generator-bundle` from app/ to refresh.
var a=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var f=a(u=>{"use strict";Object.defineProperty(u,"__esModule",{value:!0});u.LEGACY_AI_TOOLS=u.AI_TOOLS=void 0;u.normalizeAiTools=C;u.deriveLegacyAiTool=Mt;u.deriveLegacyAiToolDetail=Gt;u.hasAiTool=we;u.getToolWrapperFile=Ie;u.getToolWrapperFiles=Oe;u.formatToolWrapperFiles=ke;u.buildToolWrapperExampleClause=Ut;u.formatAiTools=qt;u.AI_TOOLS=["codex","claude_code","gemini_cli","other"];u.LEGACY_AI_TOOLS=["claude_cli","other"];var Se={codex:"Codex",claude_code:"Claude Code",gemini_cli:"Gemini CLI"},Lt={codex:"AGENTS.md",claude_code:"CLAUDE.md",gemini_cli:"GEMINI.md"},xt=["codex","claude_code","gemini_cli"];function C(e){let t=Array.from(new Set(e.ai_tools??[])).filter(o=>u.AI_TOOLS.includes(o));return t.length>0?t:e.ai_tool==="claude_cli"?["claude_code"]:e.ai_tool==="other"?["other"]:[]}function Mt(e){return e.includes("claude_code")?"claude_cli":"other"}function Gt(e,t){let o=e.filter(n=>n!=="claude_code"&&n!=="other").map(n=>Se[n]);return e.includes("other")&&t?.trim()&&o.push(t.trim()),Array.from(new Set(o)).join(", ")}function we(e,t){return C(e).includes(t)}function Ie(e){return Lt[e]}function Oe(e){return xt.filter(t=>we(e,t)).map(t=>Ie(t))}function ke(e){let t=Oe(e).map(o=>`\`${o}\``);return t.length===0?"":t.length===1?t[0]:t.length===2?`${t[0]} or ${t[1]}`:`${t.slice(0,-1).join(", ")}, or ${t[t.length-1]}`}function Ut(e){let t=ke(e);return t?` (for example ${t})`:""}function qt(e){return C(e).map(t=>t==="other"?e.ai_tool_detail?.trim()||"Other":Se[t]).join(", ")}});var y=a(g=>{"use strict";Object.defineProperty(g,"__esModule",{value:!0});g.formatPlanningStatus=Ft;g.formatDependencyCategory=$;g.getTechDecisionsByStatus=P;g.getDependenciesByStatus=A;g.getAdoptedEnvVars=Wt;g.getAdoptedTechSummaryLines=Xt;g.getAdoptedDependencySummaryLines=Ht;g.getAdoptedTechBulletLines=Jt;g.getAdoptedDependencyBulletLines=Yt;var Bt={adopted:"Adopted",candidate:"Candidate",open:"Open",rejected:"Rejected"},Vt={ai_api:"AI API",model:"Model",external_service:"External Service",oss:"OSS",github_repo:"GitHub Repository",npm_package:"npm Package",auth:"Authentication",database:"Database",storage:"Storage",notification:"Notification",ocr:"OCR / Document Analysis",batch:"Batch / Scheduler",other:"Other"};function Ce(e){return e.planning??{tech_decisions:[],external_dependencies:[]}}function Ft(e){return Bt[e]}function $(e){return Vt[e]}function P(e,t){return Ce(e).tech_decisions.filter(o=>o.status===t&&o.topic.trim()&&o.choice.trim())}function A(e,t){return Ce(e).external_dependencies.filter(o=>o.status===t&&o.name.trim())}function Wt(e){return Array.from(new Set(A(e,"adopted").flatMap(t=>t.env_vars.map(o=>o.trim()).filter(Boolean))))}function Xt(e){return P(e,"adopted").map(t=>`${t.topic}: ${t.choice}`)}function Ht(e){return A(e,"adopted").map(t=>`${t.name} (${$(t.category)})${t.env_vars.length>0?` / env: ${t.env_vars.join(", ")}`:""}`)}function Jt(e){return P(e,"adopted").map(t=>`- ${t.topic}: ${t.choice}${t.rationale?` \u2014 ${t.rationale}`:""}`)}function Yt(e){return A(e,"adopted").map(t=>{let o=t.env_vars.length>0?` / env: ${t.env_vars.join(", ")}`:"",n=t.purpose?` \u2014 ${t.purpose}`:"";return`- ${t.name} (${$(t.category)})${n}${o}`})}});var T=a(v=>{"use strict";Object.defineProperty(v,"__esModule",{value:!0});v.formatOwner=Kt;v.formatDomains=zt;v.formatProjectDescription=Qt;function Kt(e){return e.trim()||"TBD"}function zt(e){return e.length>0?e.join(", "):"unspecified"}function Qt(e){let t=e.split(`
`).map(r=>r.trim()).filter(Boolean);if(t.length===0)return"TBD";let o=t.map(r=>r.replace(/^[-*]\s*/,"").replace(/^\d+[.)]\s*/,"").trim());return t.every(r=>/^[-*]\s*/.test(r)||/^\d+[.)]\s*/.test(r))?o.join(" / "):o.join(" ")}});var Pe=a(N=>{"use strict";Object.defineProperty(N,"__esModule",{value:!0});N.generateProjectMd=no;var S=f(),$e=y(),_=T();function D(e){let{security:t}=e,o=`### 2. Security
- Never output real API keys, tokens, or credentials.
- Never store secrets in markdown or JSON.
- Always use placeholders: \`YOUR_API_KEY_HERE\`, \`YOUR_SECRET_HERE\`.
- Never echo back credentials if user pastes them.
- Never suggest committing .env or secret files.
- .env must always be in .gitignore.`;return t.has_payment_data&&(o+=`
- NEVER include payment data, card numbers, or financial credentials in code, comments, or documentation.
- All payment-related logic must reference PCI DSS compliance requirements.`),t.has_ip_sensitive&&(o+=`
- NEVER include client-confidential information, proprietary algorithms, or NDA-protected content in code comments or documentation.
- All references to client projects must use codenames or anonymized identifiers.`),o}function b(e){return["PROJECT.md",...(0,S.getToolWrapperFiles)(e.tech)]}function Zt(e){let t=b(e).map(o=>`\u251C\u2500\u2500 ${o}`).join(`
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
\u251C\u2500\u2500 plans/
\u2502   \u2514\u2500\u2500 template.md
\u251C\u2500\u2500 prompts/
\u2502   \u2514\u2500\u2500 restart.md
\u251C\u2500\u2500 SECURITY.md
\u251C\u2500\u2500 .env.example
\u2514\u2500\u2500 .gitignore
\`\`\``}function eo(e){let t=b(e).map(n=>`\u251C\u2500\u2500 ${n}`).join(`
`),o=e.structure.repos.map(n=>`\u251C\u2500\u2500 ${n.name}/`).join(`
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
\u2502       \u2514\u2500\u2500 skill-install.md
\u251C\u2500\u2500 prompts/
\u2502   \u2514\u2500\u2500 restart.md
\u251C\u2500\u2500 .gitignore
${o}
\`\`\``}function to(e,t){let o=b(e).map(n=>`\u251C\u2500\u2500 ${n}`).join(`
`);return`\`\`\`
${t.name}/
${o}
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
\`\`\``}function oo(e){let t=(0,$e.getAdoptedTechBulletLines)(e),o=(0,$e.getAdoptedDependencyBulletLines)(e);if(t.length===0&&o.length===0)return"";let n=[];return t.length>0&&n.push(`- Adopted Decisions:
${t.map(r=>`  ${r}`).join(`
`)}`),o.length>0&&n.push(`- Adopted External Dependencies:
${o.map(r=>`  ${r}`).join(`
`)}`),`${n.join(`
`)}
`}function no(e,t={}){let o=t.scope??(e.structure.repo_type==="multi"?"workspace":"single"),n=t.repo,r=oo(e),s=e.tech.frameworks.length>0?`- Frameworks: ${e.tech.frameworks.join(", ")}
`:"";if(o==="repo"&&n){let i=n.depends_on.length>0?`- Dependencies: ${n.depends_on.join(", ")}
`:"";return`# ${n.name} \u2014 Repository Constitution

## Part of
${e.project.name} (workspace: ${e.project.slug})

## Repository Info
- Name: ${n.name}
- Type: ${n.type}
- Description: ${n.description}
- Owner: ${(0,_.formatOwner)(n.owner)}
${i}## Tech Stack
- Domains: ${(0,_.formatDomains)(e.tech.domains)}
- Primary Language: ${e.tech.primary_language}
${s}- AI Tooling Policy: \`../docs/AI_TOOLING.md\`
${r}

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${D(e)}

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
- Read the tool-specific wrapper${(0,S.buildToolWrapperExampleClause)(e.tech)} if your tool uses one.
- Read \`docs/ACTIVE_CONTEXT.md\`.
- Read \`../GLOBAL_CONTEXT.md\` when changes cross repository boundaries.
- Summarize current state before taking any action.

## Repository Structure
${to(e,n)}
`}if(o==="workspace"){let i=e.structure.repos.map(d=>{let c=d.depends_on.length>0?` (depends on: ${d.depends_on.join(", ")})`:"";return`- ${d.name}: ${d.description}${c}`}).join(`
`);return`# ${e.project.name} \u2014 Workspace Constitution

## What is this workspace?
${(0,_.formatProjectDescription)(e.project.description)}

## Tech Stack
- Domains: ${(0,_.formatDomains)(e.tech.domains)}
- Primary Language: ${e.tech.primary_language}
${s}- AI Tooling Policy: \`docs/AI_TOOLING.md\`
${r}

## Workspace Repositories
${i}

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${D(e)}

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
- Read the tool-specific wrapper${(0,S.buildToolWrapperExampleClause)(e.tech)} if your tool uses one.
- Read \`GLOBAL_CONTEXT.md\`.
- Read the target repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\` before editing it.

## Repository Structure
${eo(e)}
`}return`# ${e.project.name} \u2014 Project Constitution

## What is this project?
${(0,_.formatProjectDescription)(e.project.description)}

## Tech Stack
- Domains: ${(0,_.formatDomains)(e.tech.domains)}
- Primary Language: ${e.tech.primary_language}
${s}- AI Tooling Policy: \`docs/AI_TOOLING.md\`
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

${D(e)}

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
- Read the tool-specific wrapper${(0,S.buildToolWrapperExampleClause)(e.tech)} if your tool uses one.
- Read \`docs/ACTIVE_CONTEXT.md\` and \`docs/REQUIREMENTS.md\` before taking action.
- Summarize current state before taking any action.

## Repository Structure
${Zt(e)}
`}});var w=a(j=>{"use strict";Object.defineProperty(j,"__esModule",{value:!0});j.generateToolGuidance=ao;var ro=f(),so={codex:"Codex",claude_code:"Claude Code",gemini_cli:"Gemini CLI"},io={codex:"- Prefer repository-local Codex skills or guidance artifacts when they exist.",claude_code:"- Prefer repository-local Claude Code skills when they exist.",gemini_cli:"- Prefer repository-local Gemini commands or context artifacts when they exist."};function ao(e,t,o={}){let n=o.scope??"single",r=so[t],s=(0,ro.getToolWrapperFile)(t),i=io[t];return n==="workspace"?`# Read PROJECT.md first.

## ${r} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`GLOBAL_CONTEXT.md\` -> \`REQUIREMENTS.md\`.
- Before editing a repository, also read that repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${s}\` is only the ${r}-specific overlay.
- Treat \`${s}\` as a thin adapter over the shared project constitution.
${i}
`:n==="repo"&&o.repo?`# Read PROJECT.md first.

## ${r} rules
- On session start, read: \`PROJECT.md\` -> \`../docs/AI_TOOLING.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`../GLOBAL_CONTEXT.md\`.
- \`${s}\` contains ${r}-specific workflow only. Project truth lives in \`PROJECT.md\` and \`docs/\`.
- Treat \`${s}\` as a thin adapter over the shared repository and workspace constitutions.
- If work changes another repository, return to \`../GLOBAL_CONTEXT.md\` and update both repositories' context files.
${i}
`:`# Read PROJECT.md first.

## ${r} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`docs/REQUIREMENTS.md\` -> \`docs/ROADMAP.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${s}\` is only the ${r}-specific overlay.
- Treat \`${s}\` as a thin adapter over the shared project constitution.
${i}
`}});var De=a(L=>{"use strict";Object.defineProperty(L,"__esModule",{value:!0});L.generateAgentsMd=lo;var co=w();function lo(e,t={}){return(0,co.generateToolGuidance)(e,"codex",t)}});var be=a(x=>{"use strict";Object.defineProperty(x,"__esModule",{value:!0});x.generateClaudeMd=uo;var po=w();function uo(e,t={}){return(0,po.generateToolGuidance)(e,"claude_code",t)}});var Ne=a(M=>{"use strict";Object.defineProperty(M,"__esModule",{value:!0});M.generateGeminiMd=ho;var mo=w();function ho(e,t={}){return(0,mo.generateToolGuidance)(e,"gemini_cli",t)}});var Le=a(G=>{"use strict";Object.defineProperty(G,"__esModule",{value:!0});G.generateActiveContext=yo;var go=f(),je=y(),fo=T();function yo(e){let{project:t}=e,o=new Date().toISOString().split("T")[0],n=e.workflow.phases_count===1?"Phase 0 \u2014 Project Initialization":"Phase 1 \u2014 Planning",r=e.workflow.phases_count===1?"Phase 0 execution has started. Turn the generated starter into a concrete first delivery.":"Phase 1 planning is in progress. Convert generated docs into concrete requirements, architecture, and first tasks.",s=["`PROJECT.md`",...(0,go.getToolWrapperFiles)(e.tech).map(d=>`\`${d}\``)].join(`
- `),i=[`- Project initialized: ${t.name} (${t.slug})`,`- Owner: ${(0,fo.formatOwner)(t.owner)}`,...(0,je.getAdoptedTechSummaryLines)(e).map(d=>`- Adopted decision: ${d}`),...(0,je.getAdoptedDependencySummaryLines)(e).map(d=>`- Adopted dependency: ${d}`)];return`# ACTIVE_CONTEXT.md \u2014 Current Project State

## Last Updated
${o}

## Current Phase
${n}

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
${i.join(`
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
`}});var xe=a(q=>{"use strict";Object.defineProperty(q,"__esModule",{value:!0});q.generateAiTooling=Eo;var U=f();function Eo(e){let t=(0,U.getToolWrapperFiles)(e.tech),o=(0,U.formatAiTools)(e.tech)||"None",n=t.length>0?t.map(s=>`\`${s}\``).join(" / "):"None",r=t.length>0?`- Thin wrapper files: ${(0,U.formatToolWrapperFiles)(e.tech)}`:"- Thin wrapper files are not generated for this project.";return`# AI_TOOLING.md \u2014 AI Tooling Contract

## Purpose
Keep AI-tool-specific workflow guidance separate from project truth for ${e.project.name}.

## Enabled Tooling
- Enabled AI tools: ${o}
- Wrapper files generated: ${n}
- Optional AI work guides are tracked in \`skills/README.md\` and \`repogenesis.skills.json\`.

## Rules
- \`PROJECT.md\` and \`docs/\` remain the source of truth for project state, requirements, and architecture.
${r}
- Wrapper files may define provider-specific workflow preferences, but they must not replace project truth.
- If the current AI tool has no wrapper file, follow \`PROJECT.md\`, \`docs/ACTIVE_CONTEXT.md\`, and \`docs/REQUIREMENTS.md\` directly.
- Optional AI work guides should stay reviewable in the repository and must be pinned in \`repogenesis.skills.json\`.

## Session Start Order
1. Read \`PROJECT.md\`.
2. Read \`docs/AI_TOOLING.md\`.
3. Read the matching wrapper file when one exists.
4. Read \`docs/ACTIVE_CONTEXT.md\` and the planning docs before making changes.

## Update Policy
- Add or remove wrapper files only when the selected AI tools change.
- Keep wrapper-specific instructions thin and move shared rules back into \`PROJECT.md\` or \`docs/\`.
- Update \`skills/README.md\` and \`repogenesis.skills.json\` together when optional AI work guides change.
`}});var Ge=a(B=>{"use strict";Object.defineProperty(B,"__esModule",{value:!0});B.generateTechDecisions=To;var Me=y();function I(e,t,o,n){let r=(0,Me.getTechDecisionsByStatus)(e,t);return r.length===0?`## ${o}
${n}`:`## ${o}
${r.map(s=>`### ${s.topic}
- **Choice**: ${s.choice}
- **Status**: ${(0,Me.formatPlanningStatus)(s.status)}
- **Rationale**: ${s.rationale||"TBD"}
- **Decision Date**: ${s.decision_date||"TBD"}
- **Notes**: ${s.notes||"None"}
`).join(`
`)}`}function To(e){return`# TECH_DECISIONS.md \u2014 Technology Decisions

## Purpose
Track technology choices separately from product requirements so the team can see what is adopted, what is only a candidate, and what is still open.

## Status Guide
- **Adopted**: the project starts with this choice.
- **Candidate**: likely direction, but not locked yet.
- **Open**: still unresolved and needs a decision.
- **Rejected**: explicitly not chosen for now.

${I(e,"adopted","Adopted Decisions","No adopted technology decisions were captured at generation time.")}

${I(e,"candidate","Candidate Decisions","No candidate technology decisions were captured at generation time.")}

${I(e,"open","Open Decisions","No open technology decisions were captured at generation time.")}

${I(e,"rejected","Rejected Decisions","No rejected technology decisions were captured at generation time.")}
`}});var Ue=a(F=>{"use strict";Object.defineProperty(F,"__esModule",{value:!0});F.generateExternalDependencies=Ro;var V=y();function O(e,t,o,n){let r=(0,V.getDependenciesByStatus)(e,t);return r.length===0?`## ${o}
${n}`:`## ${o}
${r.map(s=>`### ${s.name}
- **Category**: ${(0,V.formatDependencyCategory)(s.category)}
- **Status**: ${(0,V.formatPlanningStatus)(s.status)}
- **Purpose**: ${s.purpose||"TBD"}
- **Owner**: ${s.owner||"TBD"}
- **Source**: ${s.source||"TBD"}
- **License / Terms**: ${s.license||"TBD"}
- **Env Vars**: ${s.env_vars.length>0?s.env_vars.join(", "):"None"}
- **Data Outbound**: ${s.data_outbound?"Yes":"No"}
- **Notes**: ${s.notes||"None"}
`).join(`
`)}`}function Ro(e){return`# EXTERNAL_DEPENDENCIES.md \u2014 External Dependencies

## Purpose
Track external APIs, services, OSS, GitHub repositories, and packages used by the project.

## Status Guide
- **Adopted**: required from the start.
- **Candidate**: likely to be used, but not locked.
- **Open**: unresolved.
- **Rejected**: evaluated and not selected for now.

${O(e,"adopted","Adopted Dependencies","No adopted external dependencies were captured at generation time.")}

${O(e,"candidate","Candidate Dependencies","No candidate external dependencies were captured at generation time.")}

${O(e,"open","Open Dependencies","No open external dependencies were captured at generation time.")}

${O(e,"rejected","Rejected Dependencies","No rejected external dependencies were captured at generation time.")}
`}});var qe=a(W=>{"use strict";Object.defineProperty(W,"__esModule",{value:!0});W.generateRequirements=_o;var k=T();function _o(e){let{project:t,tech:o,security:n,structure:r}=e,s=o.frameworks.length>0?`- Frameworks: ${o.frameworks.join(", ")}
`:"",i=["### R1: Deliver the primary workflow",`- Description: ${t.name} must support the first useful user outcome described in the overview: ${(0,k.formatProjectDescription)(t.description)}.`,"- Acceptance Criteria:",`  - [ ] A user can complete the first end-to-end workflow for ${t.name}.`,"  - [ ] The main inputs and outputs for that workflow are explicitly handled in code or documented in the repository.","  - [ ] The first workflow is small enough to deliver within the current planning horizon without broadening scope unnecessarily.","  - [ ] The exact boundary of the initial scope is written down, including what is included now and what is explicitly deferred.","","### R2: Keep the project operable and traceable from day one",`- Description: ${t.name} must remain easy to start, safe to configure, and easy to inspect while the product scope is still evolving.`,"- Acceptance Criteria:","  - [ ] Local setup expectations and required environment placeholders are documented.",`  - [ ] Security expectations for level \`${n.level}\` are reflected in implementation and deployment decisions.`,"  - [ ] Release version and commit identity can be surfaced by the running service, API, or CLI when applicable."];if(r.repo_type==="multi"){let c=r.repos.map(p=>p.name).join(", ");i.push("","### R3: Keep repository boundaries explicit",`- Description: The workspace must keep responsibilities clear across the initial repositories: ${c}.`,"- Acceptance Criteria:","  - [ ] Each repository has a clearly named responsibility and owner.","  - [ ] Cross-repository dependencies are documented before implementation work starts.","  - [ ] Shared decisions stay in workspace-level docs and do not drift into repo-local copies.")}let d=[t.owner.trim()?null:"- Project owner is still TBD.",o.domains.length>0?null:"- Technical domain is still TBD.",o.frameworks.length>0?null:"- Framework choice is still TBD."].filter(Boolean);return`# REQUIREMENTS.md \u2014 Functional Requirements

## Purpose
Define what ${t.name} must do. This is the single source of truth for functional requirements.

## Project Overview
- **Name**: ${t.name}
- **Slug**: ${t.slug}
- **Description**: ${(0,k.formatProjectDescription)(t.description)}
- **Owner**: ${(0,k.formatOwner)(t.owner)}

## Technical Context
- Domains: ${(0,k.formatDomains)(o.domains)}
- Primary Language: ${o.primary_language}
${s}- AI Tooling Policy: \`docs/AI_TOOLING.md\`

## Core Requirements
${i.join(`
`)}

## Non-Requirements
- Anything outside the first workflow or current roadmap phase remains out of scope until explicitly added.
- New integrations, automation, or scaling work should be introduced only after the initial workflow is stable.

## Known TBDs
${d.length>0?d.join(`
`):"- No major TBDs were detected at generation time."}

## Operational Standards

### Version Traceability
- Running services must expose release version and commit SHA.
- APIs should expose deploy identity through health/version surfaces or logs.
- CLI tools should support version output.
`}});var Ve=a(H=>{"use strict";Object.defineProperty(H,"__esModule",{value:!0});H.generateArchitecture=vo;var Be=y(),X=T();function vo(e){let{project:t,tech:o,structure:n}=e,r=(0,Be.getAdoptedTechBulletLines)(e),s=(0,Be.getAdoptedDependencyBulletLines)(e),i=o.frameworks.length>0?`- Frameworks: ${o.frameworks.join(", ")}
`:"",d;if(n.repo_type==="single")d=`## Repository Structure
Single repository: \`${t.slug}\``;else{let E=n.repos.map(R=>{let jt=R.depends_on.length>0?` (depends on: ${R.depends_on.join(", ")})`:"";return`- **${R.name}** (${R.type}): ${R.description}${jt} \u2014 Owner: ${(0,X.formatOwner)(R.owner)}`}).join(`
`);d=`## Repository Structure
Multi-repository workspace: \`${t.slug}\`

### Repositories
${E}`}let c=n.repo_type==="single"?`${t.name} starts as a single-repository project focused on the first usable workflow. The architecture should keep product logic, planning docs, security rules, and release traceability close together until the system proves it needs further separation.`:`${t.name} starts as a multi-repository workspace so each major responsibility can evolve with a clear boundary. Workspace-level docs define shared rules, while repository-level docs define local architecture and execution details.`,p=n.repo_type==="single"?[`- **Core product workflow**: the main implementation for ${t.name}, built in \`${o.primary_language}\` and expanded from the generated starter repository.`,"- **Documentation and planning layer**: `PROJECT.md`, `docs/REQUIREMENTS.md`, `docs/ACTIVE_CONTEXT.md`, and `docs/ROADMAP.md` hold current truth and execution context.","- **Security and configuration layer**: `SECURITY.md` and `.env.example` define setup boundaries and secret-handling expectations.","- **Version traceability layer**: `docs/VERSIONING_STANDARD.md` and `.repogenesis/manifest.json` define how release and commit identity should be exposed."].join(`
`):["- **Workspace governance layer**: `PROJECT.md`, `GLOBAL_CONTEXT.md`, `REQUIREMENTS.md`, and `SECURITY.md` define shared rules.",...n.repos.map(E=>`- **${E.name}**: ${E.description} \u2014 Owner: ${(0,X.formatOwner)(E.owner)}.`),"- **Version traceability layer**: workspace and repository outputs should expose release and commit identity consistently."].join(`
`),l=n.repo_type==="single"?[`1. A user or operator starts the primary workflow described for ${t.name}.`,`2. The application validates and transforms inputs using the core ${o.primary_language} codebase.`,"3. Domain-specific processing runs inside the same repository with shared docs and security rules nearby.","4. Outputs are returned to the user, persisted by the application, or documented for the next phase of work."].join(`
`):[`1. Inputs enter through one or more workspace repositories for ${t.name}.`,"2. Each repository handles its own bounded responsibility and uses declared dependencies for cross-repo interactions.","3. Shared decisions and architectural changes are reflected back into workspace-level docs.","4. Outputs are coordinated across repositories while keeping ownership and release boundaries explicit."].join(`
`),m=n.repo_type==="single"?[`- Start from one deployable repository: \`${t.slug}\`.`,`- Use security level \`${e.security.level}\` as the minimum operational baseline.`,"- Keep environment-specific values outside the repository and use placeholders in `.env.example`.","- Add hosting or runtime topology only after Phase 1 planning clarifies the deployment target."].join(`
`):[`- Start from the workspace \`${t.slug}\` and deploy repositories independently as needed.`,`- Use security level \`${e.security.level}\` as the minimum shared baseline across repositories.`,"- Keep shared secrets and deployment conventions documented at the workspace layer before repo-level divergence.","- Document repository-specific hosting targets only when the delivery plan requires them."].join(`
`);return`# ARCHITECTURE.md \u2014 System Architecture

## Project
${t.name} \u2014 ${t.description}

## Tech Stack
- Domains: ${(0,X.formatDomains)(o.domains)}
- Primary Language: ${o.primary_language}
${i}
${d}

## Adopted Technology Decisions
${r.length>0?r.join(`
`):"- No adopted technology decisions were captured at generation time."}

## Adopted External Dependencies
${s.length>0?s.join(`
`):"- No adopted external dependencies were captured at generation time."}

## Architecture Overview
${c}

## Key Components
${p}

## Data Flow
${l}

## Infrastructure
${m}
`}});var Fe=a(J=>{"use strict";Object.defineProperty(J,"__esModule",{value:!0});J.generateRoadmap=So;var Ao=["Project Setup & Foundation","Primary Workflow Delivery","Integration & Hardening","Review, QA & Release","Expansion & Automation","Stabilization & Documentation","Release Preparation","Post-Launch Iteration","Scale & Governance","Long-Term Maintenance"];function So(e){let{project:t,workflow:o}=e,n=[];for(let r=0;r<o.phases_count;r++){let s=r,i=Ao[r]??`Iteration ${s}`,d=o.phases_count===1?"In Progress":r===0?"Complete":r===1?"In Progress":"Not Started",c=d==="Complete"?"x":" ",p=r===0?["Create the starter repository structure and baseline docs.","Lock project rules, security handling, and version traceability conventions."]:r===1?["Turn the generated starter into a concrete execution plan.","Define the first end-to-end workflow and the smallest useful release scope."]:["Define concrete goals for this phase before implementation starts."],l=r===0?["Starter repository committed and readable by the team.","Current docs aligned enough for Phase 1 planning."]:r===1?["Filled requirements, architecture, and implementation plan for the first workflow."]:["Phase deliverables clarified before work begins."];n.push(`### Phase ${s}: ${i}
- **Status**: ${d}
- **Goals**:
${p.map(m=>`  - [${c}] ${m}`).join(`
`)}
- **Deliverables**:
${l.map(m=>`  - [${c}] ${m}`).join(`
`)}
`)}return`# ROADMAP.md \u2014 Phase Plan

## Project
${t.name}

## Phase Overview
Total phases: ${o.phases_count}

${n.join(`
`)}
## Completion Criteria
- [ ] All phases completed
- [ ] All deliverables met
- [ ] Documentation up to date
`}});var We=a(Y=>{"use strict";Object.defineProperty(Y,"__esModule",{value:!0});Y.generateAdrTemplate=wo;function wo(e){return`# ADR-XXXX: [Title]

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
`}});var Xe=a(K=>{"use strict";Object.defineProperty(K,"__esModule",{value:!0});K.generatePlansTemplate=Io;function Io(e){return`# Plan: [Task Title]

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
`}});var He=a(z=>{"use strict";Object.defineProperty(z,"__esModule",{value:!0});z.generateRestart=ko;var Oo=f();function ko(e,t={}){let o=t.scope??(e.structure.repo_type==="multi"?"workspace":"single"),n=o==="repo"?"../docs/AI_TOOLING.md":"docs/AI_TOOLING.md",r=o==="repo"?"../GLOBAL_CONTEXT.md":"GLOBAL_CONTEXT.md";return`# Session Restart Protocol

When starting a new session or restarting, follow these steps:

## Step 1: Read Constitution
\`\`\`
Read PROJECT.md
Read ${n} if it exists
Read the tool-specific wrapper if present${(0,Oo.buildToolWrapperExampleClause)(e.tech)}
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
`}});var Je=a(Q=>{"use strict";Object.defineProperty(Q,"__esModule",{value:!0});Q.generateSecurity=Co;function Co(e){let{project:t,security:o}=e,n="## Secret Management\n- All secrets must be stored in environment variables.\n- `.env` files must never be committed to version control.\n- `.env` is listed in `.gitignore`.\n- Use `.env.example` with placeholder values for documentation.";(o.level==="medium"||o.level==="high")&&(n+=`

## Logging & Output
- Never log secrets, tokens, or credentials to stdout, stderr, or log files.
- Environment variables must be loaded through a controlled loader; never read directly in business logic.
- Pre-commit hooks are recommended to prevent secret leaks (e.g., git-secrets, detect-secrets).`),o.level==="high"&&(n+=`

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
- Review and update security policies after any incident.`);let r="";return o.has_api_keys&&(r+=`

## API Key Handling
- Store all API keys in \`.env\` \u2014 never hardcode.
- Use secret scanning tools (e.g., GitHub secret scanning, git-secrets) in CI.
- Rotate API keys regularly.`),o.has_user_data&&(r+=`

## Personal Data Policy
- Comply with applicable data protection regulations (e.g., GDPR, APPI).
- Never log personally identifiable information (PII).
- Encrypt user data at rest and in transit.
- Document data retention and deletion policies.`),o.has_payment_data&&(r+=`

## Payment Data Policy
- Reference PCI DSS requirements for all payment-related logic.
- Never store raw card numbers, CVVs, or PINs.
- Use tokenization for payment data handling.
- Payment processing must go through PCI-compliant service providers.
- Audit payment-related code changes with heightened scrutiny.`),o.has_ip_sensitive&&(r+=`

## IP Confidentiality
- This project contains NDA-protected or IP-sensitive information.
- Never include client-specific details in commit messages, comments, or documentation.
- Use codenames or anonymized identifiers for client references.
- Ensure all team members have signed applicable NDAs.`),o.has_credentials&&(r+=`

## Credential Management
- Store certificate paths and key files in \`.env\` \u2014 never in the repository.
- Certificate and key files are excluded via \`.gitignore\`.
- Define a rotation schedule for all certificates.
- Document certificate expiry dates and renewal procedures.`),`# SECURITY.md \u2014 Security Policy

## Project
${t.name}

## Security Level
**${o.level.toUpperCase()}**

${n}${r}
`}});var Ye=a(Z=>{"use strict";Object.defineProperty(Z,"__esModule",{value:!0});Z.generateEnvExample=Po;var $o=y();function Po(e){let{security:t}=e,o=(0,$o.getAdoptedEnvVars)(e),n=`# Environment Variables
# Copy this file to .env and fill in real values.
# NEVER commit .env to version control.

# Application
NODE_ENV=development
PORT=3000`;if(o.length>0){n+=`

# Adopted External Services`;for(let r of o)n+=`
${r}=YOUR_${r}_HERE`}else t.has_api_keys&&(n+=`

# API Keys
API_KEY=YOUR_API_KEY_HERE
API_SECRET=YOUR_SECRET_HERE`);return t.has_credentials&&(n+=`

# Certificates & Credentials
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
CA_CERT_PATH=/path/to/ca.pem`),n+=`
`,n}});var Ke=a(ee=>{"use strict";Object.defineProperty(ee,"__esModule",{value:!0});ee.generateGitignore=Do;function Do(e){let{tech:t,security:o}=e,n=`# Dependencies
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
*.swo`;return t.domains.includes("unity")&&(n+=`

# Unity
Library/
Temp/
Obj/
Logs/
UserSettings/
*.csproj
*.sln
*.pidb
*.userprefs`),t.domains.includes("mobile")&&(n+=`

# Mobile
*.apk
*.ipa
*.dSYM.zip
*.dSYM`),t.domains.includes("xr")&&(n+=`

# XR
*.unitypackage
StreamingAssets/`),o.has_credentials&&(n+=`

# Certificates & Credentials
*.pem
*.key
*.cert
*.p12
*.pfx`),o.has_ip_sensitive&&(n+=`

# Confidential / IP-sensitive
confidential/
nda/
*.confidential.*`),n+=`
`,n}});var Ze=a(te=>{"use strict";Object.defineProperty(te,"__esModule",{value:!0});te.generateGlobalContext=No;var bo=f(),ze=y(),Qe=T();function No(e){let{project:t,structure:o}=e,n=(0,ze.getAdoptedTechSummaryLines)(e),r=(0,ze.getAdoptedDependencySummaryLines)(e),s=o.repos.map(l=>{let m=l.depends_on.length>0?` \u2192 depends on: ${l.depends_on.join(", ")}`:"";return`- **${l.name}** (${l.type}): ${l.description} \u2014 Owner: ${(0,Qe.formatOwner)(l.owner)}${m}`}).join(`
`),i=o.repos.filter(l=>l.depends_on.length>0),d="";i.length>0&&(d=`

## Dependency Graph
\`\`\`
      ${i.map(m=>m.depends_on.map(E=>`  ${m.name} \u2192 ${E}`).join(`
`)).join(`
`)}
\`\`\``);let c=(0,bo.formatToolWrapperFiles)(e.tech),p=c?`- Tool-specific wrappers such as ${c} are thin adapters only.`:"- Tool-specific wrappers are thin adapters only.";return`# GLOBAL_CONTEXT.md \u2014 Multi-Repository Workspace

## Project
${t.name} \u2014 ${t.description}

## Owner
${(0,Qe.formatOwner)(t.owner)}

## Repositories
${s}
${d}

## Shared Decisions
${n.length>0?n.map(l=>`- ${l}`).join(`
`):"- No adopted technology decisions were captured at generation time."}

## Shared External Dependencies
${r.length>0?r.map(l=>`- ${l}`).join(`
`):"- No adopted external dependencies were captured at generation time."}

## Cross-Repo Conventions
- Each repository has its own \`PROJECT.md\` with repository-specific rules.
${p}
- Shared decisions are documented in this file.
- Workspace-level AI tooling policy lives in \`docs/AI_TOOLING.md\`.
- Workspace-level technology decisions live in \`docs/TECH_DECISIONS.md\`.
- Workspace-level external dependencies live in \`docs/EXTERNAL_DEPENDENCIES.md\`.
- Dependencies between repos should be managed explicitly.
- When a change in one repo affects another, update both repos' \`ACTIVE_CONTEXT.md\`.
`}});var et=a(oe=>{"use strict";Object.defineProperty(oe,"__esModule",{value:!0});oe.generateContributing=jo;function jo(e){return`# Contributing to ${e.project.name}

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
`}});var tt=a(ne=>{"use strict";Object.defineProperty(ne,"__esModule",{value:!0});ne.generatePrTemplate=Lo;function Lo(e){return`## Purpose
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
`}});var ot=a(re=>{"use strict";Object.defineProperty(re,"__esModule",{value:!0});re.generateIssueBugReport=xo;function xo(e){return`---
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
`}});var nt=a(se=>{"use strict";Object.defineProperty(se,"__esModule",{value:!0});se.generateIssueFeatureRequest=Mo;function Mo(e){return`---
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
`}});var rt=a(ie=>{"use strict";Object.defineProperty(ie,"__esModule",{value:!0});ie.generateVersioningStandard=Go;function Go(e){return`# VERSIONING_STANDARD.md

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
  - environment
- The display location is implementation-specific.
- If the identity is shown in UI, prefer a compact low-emphasis label such as \`v2.2.13 (4094d23)\`.
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

### 6. Preferred UI label
- When a web UI shows version identity, prefer the format \`v<release> (<commit>)\`.
- Keep the label visible but visually low-emphasis so it supports debugging without competing with the main product UI.

### 7. Minimum operational requirement
- Operators must be able to answer:
  - What release is running?
  - What commit is running?
  - Which environment is affected?
`}});var st=a(ae=>{"use strict";Object.defineProperty(ae,"__esModule",{value:!0});ae.createEmptySkillsManifest=Uo;function Uo(){return{version:1,source:"repogenesis",installed:[]}}});var it=a(ce=>{"use strict";Object.defineProperty(ce,"__esModule",{value:!0});ce.generateSkillsReadme=qo;function qo(e,t=[],o){let n=o?.bundledAtGeneration??!1,r=t.length>0?`Selected AI work guides at generation time: ${t.map(i=>`${i.name} (${i.id})`).join(", ")}.`:"No AI work guides were pre-selected at generation time.",s=n?"The selected AI work guides are already bundled in this repository and recorded in `repogenesis.skills.json`.":"No AI work guides are installed by default.";return`# skills/README.md

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

${t.length>0&&!n?"Use `scripts/install-selected-skills.sh` after ZIP extraction to add the selected AI work guides.":""}
`}});var le=a(de=>{"use strict";Object.defineProperty(de,"__esModule",{value:!0});de.buildSelectedSkillInstallCommands=Wo;var Bo=f();function Vo(e){let t=(0,Bo.normalizeAiTools)(e.tech),o=new Set;return t.includes("codex")&&o.add("codex"),t.includes("claude_code")&&o.add("claude_code"),t.includes("gemini_cli")&&o.add("gemini_cli"),o}function Fo(e,t){let o=Vo(e),n=t.providers.filter(r=>r!=="tool_agnostic"&&o.has(r));return n.length>0?n:t.providers.includes("tool_agnostic")?["tool_agnostic"]:t.providers.filter(r=>r!=="tool_agnostic")}function Wo(e,t,o='"$PROJECT_ROOT"',n='"$REGISTRY_ROOT"'){return t.map(r=>{let i=Fo(e,r).map(d=>` --provider ${d}`).join("");return`node dist/index.js skills add --project ${o} --registry ${n} --skill "${r.id}"${i}`})}});var at=a(pe=>{"use strict";Object.defineProperty(pe,"__esModule",{value:!0});pe.generateInstallSelectedSkillsScript=Ho;var Xo=le();function Ho(e,t){return`#!/usr/bin/env bash
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

${(0,Xo.buildSelectedSkillInstallCommands)(e,t).join(`
`)}
`}});var ct=a(ue=>{"use strict";Object.defineProperty(ue,"__esModule",{value:!0});ue.generateRunbookReadme=Jo;function Jo(e){return`# Runbooks

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
`}});var dt=a(me=>{"use strict";Object.defineProperty(me,"__esModule",{value:!0});me.generateProductionBootstrapRunbook=Yo;function Yo(e){let t=e.structure.repo_type==="multi"?"workspace root and each deployable repository":"repository root";return`# production-bootstrap.md

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
`}});var lt=a(he=>{"use strict";Object.defineProperty(he,"__esModule",{value:!0});he.generateProductionCutoverRunbook=Ko;function Ko(e){let t=e.structure.repo_type==="multi"?`- Repeat the deployment and verification steps for each production-facing repository in the workspace.
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
`}});var pt=a(ge=>{"use strict";Object.defineProperty(ge,"__esModule",{value:!0});ge.generateProductionChecksRunbook=zo;function zo(e){let t=e.structure.repo_type==="multi"?"workspace root plus each deployable repository":"repository root";return`# production-checks.md

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
`}});var ut=a(fe=>{"use strict";Object.defineProperty(fe,"__esModule",{value:!0});fe.generateRollbackRunbook=Qo;function Qo(e){return`# rollback.md

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
`}});var mt=a(ye=>{"use strict";Object.defineProperty(ye,"__esModule",{value:!0});ye.generateIncidentResponseRunbook=Zo;function Zo(e){return`# incident-response.md

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
`}});var ht=a(Ee=>{"use strict";Object.defineProperty(Ee,"__esModule",{value:!0});Ee.generateSkillInstallRunbook=tn;var en=le();function tn(e,t=[],o){let n=o?.bundledAtGeneration??!1,r=t.length>0?(0,en.buildSelectedSkillInstallCommands)(e,t,'"$PROJECT_ROOT"','"$REGISTRY_ROOT"').join(`
`):"",s=t.length>0&&n?`
## Bundled In This Repository
${t.map(i=>`- ${i.name} (\`${i.id}\`, ${i.sourceType}, ${i.version})`).join(`
`)}

## Current State
- The selected AI work guides were copied into this repository during generation.
- \`repogenesis.skills.json\` already records the bundled artifact paths.
- Additional install commands are not required for the initial setup.
- These guides do not run automatically. Use them when working with this repository in the supported AI tool.
`:t.length>0?`
## Recommended For This Project
${t.map(i=>`- ${i.name} (\`${i.id}\`, ${i.sourceType}, ${i.version})`).join(`
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
`}});var gt=a(h=>{"use strict";Object.defineProperty(h,"__esModule",{value:!0});h.DEFAULT_RUNBOOK_PATHS=void 0;h.buildDefaultRunbookEntries=ln;var on=ct(),nn=dt(),rn=lt(),sn=pt(),an=ut(),cn=mt(),dn=ht();h.DEFAULT_RUNBOOK_PATHS=["docs/runbooks/README.md","docs/runbooks/production-bootstrap.md","docs/runbooks/production-cutover.md","docs/runbooks/production-checks.md","docs/runbooks/rollback.md","docs/runbooks/incident-response.md","docs/runbooks/skill-install.md"];function ln(e,t,o){return[[h.DEFAULT_RUNBOOK_PATHS[0],(0,on.generateRunbookReadme)(e)],[h.DEFAULT_RUNBOOK_PATHS[1],(0,nn.generateProductionBootstrapRunbook)(e)],[h.DEFAULT_RUNBOOK_PATHS[2],(0,rn.generateProductionCutoverRunbook)(e)],[h.DEFAULT_RUNBOOK_PATHS[3],(0,sn.generateProductionChecksRunbook)(e)],[h.DEFAULT_RUNBOOK_PATHS[4],(0,an.generateRollbackRunbook)(e)],[h.DEFAULT_RUNBOOK_PATHS[5],(0,cn.generateIncidentResponseRunbook)(e)],[h.DEFAULT_RUNBOOK_PATHS[6],(0,dn.generateSkillInstallRunbook)(e,t,o)]]}});var On=a(Ae=>{Object.defineProperty(Ae,"__esModule",{value:!0});Ae.generateFromSpec=In;var ft=f(),Te=Pe(),pn=De(),un=be(),mn=Ne(),hn=Le(),yt=xe(),Et=Ge(),Tt=Ue(),Rt=qe(),gn=Ve(),_t=Fe(),vt=We(),At=Xe(),St=He(),wt=Je(),It=Ye(),Re=Ke(),fn=Ze(),Ot=et(),kt=tt(),Ct=ot(),$t=nt(),_e=rt(),Pt=st(),Dt=it(),bt=at(),yn=T(),Nt=gt(),En="1.0";function Tn(e,t){return"specVersion"in e?e.specVersion:t?.specVersion??En}function Rn(e){if("specVersion"in e){let{specVersion:t,...o}=e;return o}return e}function _n(e,t,o,n,r){return{specVersion:n,generatorVersion:o?.generatorVersion??"dev",generatedAt:o?.generatedAt??new Date().toISOString(),source:o?.source??r,projectSlug:e.project.slug,repoType:e.structure.repo_type,fileCount:t,selectedSkills:o?.selectedSkills??[]}}function ve(e,t){let o=t.prefix??"",n=[];for(let r of(0,ft.normalizeAiTools)(e.tech))if(r!=="other"){if(r==="codex"){n.push([`${o}AGENTS.md`,(0,pn.generateAgentsMd)(e,t)]);continue}if(r==="claude_code"){n.push([`${o}CLAUDE.md`,(0,un.generateClaudeMd)(e,t)]);continue}n.push([`${o}GEMINI.md`,(0,mn.generateGeminiMd)(e,t)])}return n}function vn(e,t){let o=new Date().toISOString().split("T")[0],n=t.depends_on.length>0?`- Depends on: ${t.depends_on.join(", ")}`:"- No dependencies",r=["`PROJECT.md`",...(0,ft.getToolWrapperFiles)(e.tech).map(s=>`\`${s}\``)].filter(Boolean).join(`
- `);return`# ACTIVE_CONTEXT.md \u2014 ${t.name}

## Last Updated
${o}

## Current Phase
Phase 0 \u2014 Repository Initialization

## What Has Been Done
- Repository structure generated by RepoGenesis.
- Common constitution created in PROJECT.md.
- Tool-specific wrapper files created when enabled.
${n}

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
`}function An(e,t){let o=t.depends_on.length>0?`
### Dependencies
${t.depends_on.map(n=>`- ${n}`).join(`
`)}`:"";return`# ARCHITECTURE.md \u2014 ${t.name}

## Repository
- **Name**: ${t.name}
- **Type**: ${t.type}
- **Description**: ${t.description}
- **Owner**: ${(0,yn.formatOwner)(t.owner)}

## Part of
${e.project.name} (workspace: ${e.project.slug})
${o}

## Architecture Overview
[Describe the architecture for this ${t.type} repository]

## Key Components
[List and describe key components]

## Data Flow
[Describe data flow within this repository and with dependencies]
`}function Sn(e,t){let o=new Map,n=t?.selectedSkills??[],r=t?.selectedSkillsBundled??!1,s=t?.selectedSkillsManifest??(0,Pt.createEmptySkillsManifest)(),i=t?.selectedSkillFiles??[],d=[["PROJECT.md",(0,Te.generateProjectMd)(e,{scope:"single"})],...ve(e,{scope:"single"}),["docs/ACTIVE_CONTEXT.md",(0,hn.generateActiveContext)(e)],["docs/AI_TOOLING.md",(0,yt.generateAiTooling)(e)],["docs/TECH_DECISIONS.md",(0,Et.generateTechDecisions)(e)],["docs/EXTERNAL_DEPENDENCIES.md",(0,Tt.generateExternalDependencies)(e)],["docs/REQUIREMENTS.md",(0,Rt.generateRequirements)(e)],["docs/ARCHITECTURE.md",(0,gn.generateArchitecture)(e)],["docs/ROADMAP.md",(0,_t.generateRoadmap)(e)],["docs/VERSIONING_STANDARD.md",(0,_e.generateVersioningStandard)(e)],["docs/ADR/0000-template.md",(0,vt.generateAdrTemplate)(e)],...(0,Nt.buildDefaultRunbookEntries)(e,n,{bundledAtGeneration:r}),["plans/template.md",(0,At.generatePlansTemplate)(e)],["prompts/restart.md",(0,St.generateRestart)(e,{scope:"single"})],["SECURITY.md",(0,wt.generateSecurity)(e)],[".env.example",(0,It.generateEnvExample)(e)],[".gitignore",(0,Re.generateGitignore)(e)],["skills/README.md",(0,Dt.generateSkillsReadme)(e,n,{bundledAtGeneration:r})],["repogenesis.skills.json",`${JSON.stringify(s,null,2)}
`],["CONTRIBUTING.md",(0,Ot.generateContributing)(e)],[".github/PULL_REQUEST_TEMPLATE.md",(0,kt.generatePrTemplate)(e)],[".github/ISSUE_TEMPLATE/bug_report.md",(0,Ct.generateIssueBugReport)(e)],[".github/ISSUE_TEMPLATE/feature_request.md",(0,$t.generateIssueFeatureRequest)(e)]];for(let[c,p]of d)o.set(c,p);n.length>0&&!r&&o.set("scripts/install-selected-skills.sh",(0,bt.generateInstallSelectedSkillsScript)(e,n));for(let[c,p]of i)o.set(c,p);return o}function wn(e,t){let o=new Map,n=t?.selectedSkills??[],r=t?.selectedSkillsBundled??!1,s=t?.selectedSkillsManifest??(0,Pt.createEmptySkillsManifest)(),i=t?.selectedSkillFiles??[],d=[["PROJECT.md",(0,Te.generateProjectMd)(e,{scope:"workspace"})],...ve(e,{scope:"workspace"}),["GLOBAL_CONTEXT.md",(0,fn.generateGlobalContext)(e)],["docs/AI_TOOLING.md",(0,yt.generateAiTooling)(e)],["docs/TECH_DECISIONS.md",(0,Et.generateTechDecisions)(e)],["docs/EXTERNAL_DEPENDENCIES.md",(0,Tt.generateExternalDependencies)(e)],["REQUIREMENTS.md",(0,Rt.generateRequirements)(e)],["SECURITY.md",(0,wt.generateSecurity)(e)],["VERSIONING_STANDARD.md",(0,_e.generateVersioningStandard)(e)],...(0,Nt.buildDefaultRunbookEntries)(e,n,{bundledAtGeneration:r}),[".gitignore",(0,Re.generateGitignore)(e)],["skills/README.md",(0,Dt.generateSkillsReadme)(e,n,{bundledAtGeneration:r})],["repogenesis.skills.json",`${JSON.stringify(s,null,2)}
`],["CONTRIBUTING.md",(0,Ot.generateContributing)(e)],[".github/PULL_REQUEST_TEMPLATE.md",(0,kt.generatePrTemplate)(e)],[".github/ISSUE_TEMPLATE/bug_report.md",(0,Ct.generateIssueBugReport)(e)],[".github/ISSUE_TEMPLATE/feature_request.md",(0,$t.generateIssueFeatureRequest)(e)]];for(let[c,p]of d)o.set(c,p);n.length>0&&!r&&o.set("scripts/install-selected-skills.sh",(0,bt.generateInstallSelectedSkillsScript)(e,n));for(let[c,p]of i)o.set(c,p);for(let c of e.structure.repos){let p=[[`${c.name}/PROJECT.md`,(0,Te.generateProjectMd)(e,{scope:"repo",repo:c})],...ve(e,{prefix:`${c.name}/`,scope:"repo",repo:c}),[`${c.name}/docs/ACTIVE_CONTEXT.md`,vn(e,c)],[`${c.name}/docs/ARCHITECTURE.md`,An(e,c)],[`${c.name}/docs/ROADMAP.md`,(0,_t.generateRoadmap)(e)],[`${c.name}/docs/VERSIONING_STANDARD.md`,(0,_e.generateVersioningStandard)(e)],[`${c.name}/docs/ADR/0000-template.md`,(0,vt.generateAdrTemplate)(e)],[`${c.name}/plans/template.md`,(0,At.generatePlansTemplate)(e)],[`${c.name}/prompts/restart.md`,(0,St.generateRestart)(e,{scope:"repo"})],[`${c.name}/.env.example`,(0,It.generateEnvExample)(e)],[`${c.name}/.gitignore`,(0,Re.generateGitignore)(e)]];for(let[l,m]of p)o.set(l,m)}return o}function In(e,t){let o="specVersion"in e?"projectSpec":"legacyBrief",n=Tn(e,t),r=Rn(e),s=r.structure.repo_type==="multi"?wn(r,t):Sn(r,t),i=_n(r,s.size+1,t,n,o);return s.set(".repogenesis/manifest.json",`${JSON.stringify(i,null,2)}
`),s}});export default On();
