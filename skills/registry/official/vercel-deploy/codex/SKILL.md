# Vercel Deploy Check

Use this skill when a project deploys through Vercel and you need a safe release check.

Workflow:
1. Confirm the target branch, commit, and environment.
2. Check build output and missing environment variables.
3. Verify the current production deployment and rollback target.
4. Capture the public URL, request identifiers, and any blocking error.
5. Summarize release status and next action.
