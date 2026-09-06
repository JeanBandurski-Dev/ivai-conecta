import fs from 'fs';
import path from 'path';

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (full.endsWith('.jsx')) files.push(full);
  }
  return files;
}

const files = walk('src');
const missingDarkBg = [];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (
      (/\bbg-white\b/.test(line) && !line.includes('dark:bg-') && !line.includes('bg-white/')) ||
      (/\bbg-gray-(50|100|200)\b/.test(line) && !line.includes('dark:bg-')) ||
      (/\bbg-slate-(50|100)\b/.test(line) && !line.includes('dark:bg-'))
    ) {
      missingDarkBg.push({ file: f, line: idx + 1, code: line.trim() });
    }
  });
});

console.log('Total potential missing dark bg:', missingDarkBg.length);
const grouped = {};
missingDarkBg.forEach(m => {
  if (!grouped[m.file]) grouped[m.file] = [];
  grouped[m.file].push(m);
});

for (const [file, items] of Object.entries(grouped)) {
  console.log(`\n=== ${file} (${items.length} occurrences) ===`);
  items.slice(0, 15).forEach(item => {
    console.log(`  Line ${item.line}: ${item.code.slice(0, 110)}`);
  });
}
