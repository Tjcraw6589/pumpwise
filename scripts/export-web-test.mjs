// Builds the web version for the Playwright smoke test, pointed at a made-up local price feed
// (dist/test-feed) instead of the live GitHub Pages feed.
// Usage: npm run export:web:test, then npm run test:e2e
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (command, env = {}) => execSync(command, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });

run('npx expo export --platform web --clear', { EXPO_PUBLIC_FEED_URL: '/test-feed' });
run(`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/feed/fixture.ts "${join(root, 'dist', 'test-feed')}"`);
