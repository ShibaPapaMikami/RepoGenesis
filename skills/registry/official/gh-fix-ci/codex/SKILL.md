# GH Fix CI

Use this skill when a GitHub Actions workflow is red and you need the smallest safe fix.

Workflow:
1. Identify the failing job, step, and annotation.
2. Separate infrastructure noise from a real code or config regression.
3. Reproduce the failing check locally when possible.
4. Prefer the narrowest change that restores the intended contract.
5. Summarize root cause, fix, and remaining follow-up.
