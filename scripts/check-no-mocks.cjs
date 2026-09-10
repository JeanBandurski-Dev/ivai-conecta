/**
 * Check No Mocks Script
 * Scans App/src to prevent committing or pushing hardcoded mock datasets to GitHub.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'App', 'src');

const SUSPICIOUS_PATTERNS = [
  /\bconst\s+(?:mockJobs|mockCandidates|mockUsers|mockTalents|mockCompanies|mockData|MOCK_[A-Z_]+)\s*=\s*\[/i,
  /\blet\s+(?:mockJobs|mockCandidates|mockUsers|mockTalents|mockCompanies|mockData|MOCK_[A-Z_]+)\s*=\s*\[/i,
  /\bvar\s+(?:mockJobs|mockCandidates|mockUsers|mockTalents|mockCompanies|mockData|MOCK_[A-Z_]+)\s*=\s*\[/i,
  /\bexport\s+const\s+(?:MOCK_[A-Z_]+|mock[A-Z][a-zA-Z0-9_]*Data)\s*=/i,
  /\[\s*\{\s*id:\s*['"]?mock_/i
];

// Files or substrings that are allowed (e.g. sanitizers or no-op seed scripts)
const ALLOWED_FILES = [
  'seedFirestore.js',
  'check-no-mocks.cjs'
];

let hasErrors = false;
const issues = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(jsx?|tsx?|json)$/i.test(entry.name)) {
      if (ALLOWED_FILES.some(f => entry.name.includes(f))) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip comments
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return;
        }

        // Check if line matches suspicious mock patterns
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(line)) {
            issues.push({
              file: path.relative(path.resolve(__dirname, '..'), fullPath),
              line: index + 1,
              content: trimmed
            });
            hasErrors = true;
          }
        }
      });
    }
  }
}

console.log('🔍 Verificando ausência de dados mockados em App/src...');
scanDirectory(SRC_DIR);

if (hasErrors) {
  console.error('\n❌ [ERRO DE VALIDAÇÃO] Foram encontrados dados mockados no código:');
  issues.forEach(issue => {
    console.error(`  - ${issue.file}:${issue.line} -> "${issue.content}"`);
  });
  console.error('\n⚠️ Remova os dados mockados antes de enviar para o GitHub.');
  process.exit(1);
} else {
  console.log('✅ Nenhum dado mockado encontrado. O código está limpo para envio ao GitHub!\n');
  process.exit(0);
}
