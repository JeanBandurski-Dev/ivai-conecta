const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'ivai-conecta-release.zip');

const args = [
  '-a',
  '-c',
  '-f',
  output,
  '--exclude=.git',
  '--exclude=node_modules',
  '--exclude=dist',
  '--exclude=.vite',
  '--exclude=coverage',
  '--exclude=*.zip',
  '-C',
  root,
  '.',
];

const result = spawnSync('tar', args, { stdio: 'inherit', windowsHide: true });
if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`Pacote criado em ${output}`);
