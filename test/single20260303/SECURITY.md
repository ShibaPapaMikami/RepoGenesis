# SECURITY.md — Security Policy

## Project
シングルテスト

## Security Level
**LOW**

## Secret Management
- All secrets must be stored in environment variables.
- `.env` files must never be committed to version control.
- `.env` is listed in `.gitignore`.
- Use `.env.example` with placeholder values for documentation.

## API Key Handling
- Store all API keys in `.env` — never hardcode.
- Use secret scanning tools (e.g., GitHub secret scanning, git-secrets) in CI.
- Rotate API keys regularly.
