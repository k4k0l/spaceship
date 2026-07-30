import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const roots = ['.', 'src', 'tests', 'scripts', 'easter-egg'];
const files = [];
for (const root of roots) for (const name of await readdir(root)) if (/\.(?:js|mjs)$/.test(name)) files.push(`${root}/${name}`);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status) { process.stderr.write(result.stderr); process.exitCode = 1; }
}
if (!process.exitCode) console.log(`Syntax OK: ${files.length} JavaScript files`);
