/**
 * Upload public/data/** to Cloudflare R2 (keys: data/...).
 *
 * Usage:
 *   npm run seed:r2              # remote bucket (requires wrangler login)
 *   npm run seed:r2 -- --local   # local Miniflare R2 (wrangler pages dev)
 *
 * Env:
 *   R2_BUCKET  — bucket name (default: fifaworldcup-data from wrangler.toml)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const BUCKET = process.env.R2_BUCKET?.trim() || 'fifaworldcup-data';
const useLocal = process.argv.includes('--local');
const remoteFlag = useLocal ? '' : ' --remote';

function walkFiles(dir, relative = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(abs, rel));
    } else {
      files.push({ abs, key: `data/${rel.replace(/\\/g, '/')}` });
    }
  }
  return files;
}

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Missing ${DATA_DIR}`);
  process.exit(1);
}

const files = walkFiles(DATA_DIR);
console.log(`Uploading ${files.length} files to R2 bucket "${BUCKET}"${useLocal ? ' (local)' : ' (remote)'}…`);

for (const { abs, key } of files) {
  const objectPath = `${BUCKET}/${key}`;
  const cmd = `npx wrangler r2 object put "${objectPath}" --file="${abs}"${remoteFlag}`;
  console.log(`→ ${key}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

console.log('Done.');
