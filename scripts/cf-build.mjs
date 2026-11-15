// Builds the Cloudflare Worker without local .env files.
// OpenNext inlines .env* values into the Worker bundle; production values
// must come from Worker vars/secrets (wrangler.jsonc + `wrangler secret`).
import { existsSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ENV_FILES = ['.env', '.env.local', '.env.production', '.env.production.local'];
const moved = [];

try {
  for (const file of ENV_FILES) {
    if (existsSync(file)) {
      renameSync(file, `${file}.cf-build-bak`);
      moved.push(file);
    }
  }
  const result = spawnSync('npx', ['opennextjs-cloudflare', 'build'], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  for (const file of moved) renameSync(`${file}.cf-build-bak`, file);
}
