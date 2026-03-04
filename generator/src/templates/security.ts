import type { ProjectBrief } from '../schema';

export function generateSecurity(brief: ProjectBrief): string {
  const { project, security } = brief;

  // Base sections by level
  let baseSections = `## Secret Management
- All secrets must be stored in environment variables.
- \`.env\` files must never be committed to version control.
- \`.env\` is listed in \`.gitignore\`.
- Use \`.env.example\` with placeholder values for documentation.`;

  if (security.level === 'medium' || security.level === 'high') {
    baseSections += `

## Logging & Output
- Never log secrets, tokens, or credentials to stdout, stderr, or log files.
- Environment variables must be loaded through a controlled loader; never read directly in business logic.
- Pre-commit hooks are recommended to prevent secret leaks (e.g., git-secrets, detect-secrets).`;
  }

  if (security.level === 'high') {
    baseSections += `

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
- Review and update security policies after any incident.`;
  }

  // Flag-specific sections
  let flagSections = '';

  if (security.has_api_keys) {
    flagSections += `

## API Key Handling
- Store all API keys in \`.env\` — never hardcode.
- Use secret scanning tools (e.g., GitHub secret scanning, git-secrets) in CI.
- Rotate API keys regularly.`;
  }

  if (security.has_user_data) {
    flagSections += `

## Personal Data Policy
- Comply with applicable data protection regulations (e.g., GDPR, APPI).
- Never log personally identifiable information (PII).
- Encrypt user data at rest and in transit.
- Document data retention and deletion policies.`;
  }

  if (security.has_payment_data) {
    flagSections += `

## Payment Data Policy
- Reference PCI DSS requirements for all payment-related logic.
- Never store raw card numbers, CVVs, or PINs.
- Use tokenization for payment data handling.
- Payment processing must go through PCI-compliant service providers.
- Audit payment-related code changes with heightened scrutiny.`;
  }

  if (security.has_ip_sensitive) {
    flagSections += `

## IP Confidentiality
- This project contains NDA-protected or IP-sensitive information.
- Never include client-specific details in commit messages, comments, or documentation.
- Use codenames or anonymized identifiers for client references.
- Ensure all team members have signed applicable NDAs.`;
  }

  if (security.has_credentials) {
    flagSections += `

## Credential Management
- Store certificate paths and key files in \`.env\` — never in the repository.
- Certificate and key files are excluded via \`.gitignore\`.
- Define a rotation schedule for all certificates.
- Document certificate expiry dates and renewal procedures.`;
  }

  return `# SECURITY.md — Security Policy

## Project
${project.name}

## Security Level
**${security.level.toUpperCase()}**

${baseSections}${flagSections}
`;
}
