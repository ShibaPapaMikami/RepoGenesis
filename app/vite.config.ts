import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const appPackage = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version?: string };
const commit = process.env.VERCEL_GIT_COMMIT_SHA;
const commitLabel = commit && commit.length >= 7 ? commit.slice(0, 7) : 'local';
const deployedAt = process.env.VITE_DEPLOY_PUBLISHED_AT
  ?? process.env.VERCEL_DEPLOYMENT_CREATED_AT
  ?? new Date().toISOString();
const releaseLabel = process.env.VITE_RELEASE_VERSION
  ?? appPackage.version
  ?? 'unreleased';
const runtimeLabelMode = (() => {
  const raw = process.env.VITE_RUNTIME_LABEL_MODE?.trim().toLowerCase();
  if (raw === 'admin' || raw === 'hidden') return raw;
  return 'public';
})();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_RELEASE__: JSON.stringify(releaseLabel),
    __APP_COMMIT__: JSON.stringify(commitLabel),
    __APP_DEPLOYED_AT__: JSON.stringify(deployedAt),
    __APP_RUNTIME_LABEL_MODE__: JSON.stringify(runtimeLabelMode),
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
});
