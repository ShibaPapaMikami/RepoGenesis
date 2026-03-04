import type { ProjectBrief } from '../schema';

export function generateGitignore(brief: ProjectBrief): string {
  const { tech, security } = brief;

  let content = `# Dependencies
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
*.swo`;

  // Domain-specific ignores
  if (tech.domains.includes('unity')) {
    content += `

# Unity
Library/
Temp/
Obj/
Logs/
UserSettings/
*.csproj
*.sln
*.pidb
*.userprefs`;
  }

  if (tech.domains.includes('mobile')) {
    content += `

# Mobile
*.apk
*.ipa
*.dSYM.zip
*.dSYM`;
  }

  if (tech.domains.includes('xr')) {
    content += `

# XR
*.unitypackage
StreamingAssets/`;
  }

  // Security flag ignores
  if (security.has_credentials) {
    content += `

# Certificates & Credentials
*.pem
*.key
*.cert
*.p12
*.pfx`;
  }

  if (security.has_ip_sensitive) {
    content += `

# Confidential / IP-sensitive
confidential/
nda/
*.confidential.*`;
  }

  content += '\n';
  return content;
}
