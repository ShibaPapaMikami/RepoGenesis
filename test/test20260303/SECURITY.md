# SECURITY.md — Security Policy

## Project
テスト

## Security Level
**MEDIUM**

## Secret Management
- All secrets must be stored in environment variables.
- `.env` files must never be committed to version control.
- `.env` is listed in `.gitignore`.
- Use `.env.example` with placeholder values for documentation.

## Logging & Output
- Never log secrets, tokens, or credentials to stdout, stderr, or log files.
- Environment variables must be loaded through a controlled loader; never read directly in business logic.
- Pre-commit hooks are recommended to prevent secret leaks (e.g., git-secrets, detect-secrets).

## API Key Handling
- Store all API keys in `.env` — never hardcode.
- Use secret scanning tools (e.g., GitHub secret scanning, git-secrets) in CI.
- Rotate API keys regularly.

## Personal Data Policy
- Comply with applicable data protection regulations (e.g., GDPR, APPI).
- Never log personally identifiable information (PII).
- Encrypt user data at rest and in transit.
- Document data retention and deletion policies.
