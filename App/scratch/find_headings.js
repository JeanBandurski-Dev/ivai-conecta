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
const headings = [];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (/<(h1|h2|h3|h4|h5|h6)\b/.test(line)) {
      if (!line.includes('dark:text-') && !line.includes('text-white') && !line.includes('text-transparent')) {
        headings.push({ file: f, line: idx + 1, code: line.trim() });
      }
    }
  });
});

console.log('Total headings without explicit dark:text or text-white:', headings.length);
headings.forEach(h => {
  console.log(`${h.file}:${h.line} -> ${h.code.slice(0, 110)}`);
});
