import type { ProjectBrief } from '../schema';

export function generateEnvExample(brief: ProjectBrief): string {
  const { security } = brief;

  let content = `# Environment Variables
# Copy this file to .env and fill in real values.
# NEVER commit .env to version control.

# Application
NODE_ENV=development
PORT=3000`;

  if (security.has_api_keys) {
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
