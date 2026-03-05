import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const commit = process.env.VERCEL_GIT_COMMIT_SHA;
const versionLabel = commit && commit.length >= 7
  ? `v-${commit.slice(0, 7)}`
  : `v-local`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(versionLabel),
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
});
