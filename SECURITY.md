# SECURITY.md — Security Policy

## Scope
This document defines security rules for RepoGenesis itself and for all repositories it generates.

## Rules for RepoGenesis Development

### Secret Handling
- No real API keys, tokens, passwords, or credentials in any file.
- All secret references must use placeholders: `YOUR_API_KEY_HERE`, `YOUR_SECRET_HERE`.
- `.env` is always in `.gitignore`. No exceptions.
- `.env.example` uses only placeholder values.

### AI Interaction
- AI must never echo back credentials if pasted by user.
- AI must never suggest committing `.env` or secret files.
- AI must never log, store, or reference real secrets in any output.

### Code Review
- Any PR that touches security configuration must be reviewed by project owner.
- Generated SECURITY.md templates must be reviewed before distribution.

## Rules for Generated Repositories
RepoGenesis generates SECURITY.md for target projects. The content varies by security level:

### Security Level: Low
- `.env` in `.gitignore`
- `.env.example` with placeholders
- Basic secret handling reminder

### Security Level: Medium
- Everything in Low, plus:
- No secrets in logs or console output
- Secrets loaded from environment variables only
- Pre-commit hook recommendation for secret scanning

### Security Level: High
- Everything in Medium, plus:
- Secret rotation policy template
- Access control documentation template
- Incident response template
- Mandatory secret scanning in CI

## Reporting
If a secret is accidentally committed:
1. Rotate the compromised credential immediately.
2. Remove from git history (use `git filter-branch` or BFG Repo-Cleaner).
3. Document the incident.
