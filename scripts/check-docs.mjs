import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}
const files = await walk(root);
let links = 0;
for (const file of files.filter(path => extname(path) === '.md')) {
  const source = await readFile(file, 'utf8');
  // Ignore code examples; check actual relative links and embedded images.
  const prose = source.replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^\n$]*\$/g, '');
  for (const match of prose.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) continue;
    const relative = target.split('#')[0].split('?')[0];
    if (!relative) continue;
    links++;
    try { await stat(resolve(dirname(file), decodeURIComponent(relative))); }
    catch { failures.push(`${file.slice(root.length + 1)} → ${target}`); }
  }
}
if (failures.length) {
  console.error(`Broken local links (${failures.length}):\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation links OK: ${links} local targets across ${files.filter(path => extname(path) === '.md').length} Markdown files.`);
}
