// Copies the Pyodide runtime files we need into public/pyodide/<version>/,
// so Python is served from our own domain (no third-party CDN requests).
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pyodide');
const { version } = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8'));
const dest = join(root, 'public', 'pyodide', version);
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

mkdirSync(dest, { recursive: true });
let copied = 0;
for (const f of files) {
  const from = join(src, f);
  const to = join(dest, f);
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  copyFileSync(from, to);
  copied++;
}
console.log(`pyodide ${version}: ${copied ? `copied ${copied} file(s)` : 'up to date'} -> public/pyodide/${version}/`);
