// Writes audio/index.json listing every audio/<id>.mp3 file that exists.
// Runs automatically when the site is deployed. Locally: node scripts/build-audio-index.mjs
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'audio');
const ids = existsSync(dir)
  ? readdirSync(dir).filter((f) => /^[a-z]+\.mp3$/.test(f)).map((f) => f.replace(/\.mp3$/, '')).sort()
  : [];
writeFileSync(join(dir, 'index.json'), JSON.stringify(ids) + '\n');
console.log(`audio/index.json: ${ids.length} recording(s)`);
