/**
 * Download R2 data/** into public/data/** (mirror of seed-r2.mjs).
 *
 * Usage:
 *   npm run pull:r2              # remote bucket (requires wrangler login)
 *   npm run pull:r2 -- --local   # local Miniflare R2 (wrangler pages dev)
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

/** Same keys as seed-r2 — walk local tree so we know what to fetch. */
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
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const files = walkFiles(DATA_DIR);
if (files.length === 0) {
  console.error(`No files under ${DATA_DIR} — run seed:r2 once or add edition JSON first.`);
  process.exit(1);
}

console.log(
  `Downloading ${files.length} files from R2 bucket "${BUCKET}"${useLocal ? ' (local)' : ' (remote)'}…`,
);

let ok = 0;
let failed = 0;

for (const { abs, key } of files) {
  const objectPath = `${BUCKET}/${key}`;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const cmd = `npx wrangler r2 object get "${objectPath}" --file="${abs}"${remoteFlag}`;
  process.stdout.write(`← ${key} … `);
  try {
    execSync(cmd, { stdio: 'pipe', cwd: ROOT });
    console.log('ok');
    ok++;
  } catch {
    console.log('missing or failed');
    failed++;
  }
}

console.log(`\nDone. ${ok} downloaded, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
