import type { ProjectBrief } from '../schema';
import { getAdoptedEnvVars } from '../planning';

export function generateEnvExample(brief: ProjectBrief): string {
  const { security } = brief;
  const adoptedEnvVars = getAdoptedEnvVars(brief);

  let content = `# Environment Variables
# Copy this file to .env and fill in real values.
# NEVER commit .env to version control.

# Application
NODE_ENV=development
PORT=3000`;

  if (adoptedEnvVars.length > 0) {
    content += `

# Adopted External Services`;
    for (const envVar of adoptedEnvVars) {
      content += `
${envVar}=YOUR_${envVar}_HERE`;
    }
  } else if (security.has_api_keys) {
    content += `

# API Keys
API_KEY=YOUR_API_KEY_HERE
API_SECRET=YOUR_SECRET_HERE`;
  }

  if (security.has_credentials) {
    content += `

# Certificates & Credentials
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
CA_CERT_PATH=/path/to/ca.pem`;
  }

  content += '\n';
  return content;
}
