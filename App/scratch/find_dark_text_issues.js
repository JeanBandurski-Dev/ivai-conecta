import fs from 'fs';
import path from 'path';

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (full.endsWith('.jsx') || full.endsWith('.css')) files.push(full);
  }
  return files;
}

const files = walk('src');
const issues = [];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    // Check for text-primary-dark without dark:text-
    if (/text-primary-dark\b/.test(line) && !line.includes('dark:text-')) {
      issues.push({ file: f, line: idx + 1, code: line.trim(), type: 'text-primary-dark without dark:text-' });
    }
    // Check for text-gray-900 or text-gray-800 or text-slate-900 without dark:text-
    if (/(text-gray-900|text-gray-800|text-slate-900)\b/.test(line) && !line.includes('dark:text-')) {
      // ignore if it's inside something that has dark text
      issues.push({ file: f, line: idx + 1, code: line.trim(), type: 'dark text without dark:text-' });
    }
    // Check for section-title in css
    if (f.endsWith('.css') && /section-title/.test(line)) {
      issues.push({ file: f, line: idx + 1, code: line.trim(), type: 'css section-title' });
    }
  });
});

console.log('Total issues found:', issues.length);
issues.forEach(iss => {
  console.log(`${iss.file}:${iss.line} [${iss.type}] -> ${iss.code.slice(0, 110)}`);
});
