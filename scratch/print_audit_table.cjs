const fs = require('fs');
const path = require('path');

const fields = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_data.json'), 'utf8'));

// Filter out hidden inputs like value ?? ''
const textFields = fields.filter(f => f.type !== 'hidden');

console.log('Total real text fields to audit:', textFields.length);

const grouped = {};
textFields.forEach(f => {
  if (!grouped[f.file]) grouped[f.file] = [];
  grouped[f.file].push(f);
});

let md = '# AUDITORIA COMPLETA DE CAMPOS DE TEXTO DO PROJETO IVAÍ CONECTA\n\n';
md += `**Total de campos de texto mapeados:** ${textFields.length}\n`;
md += `**Total de arquivos com formulários/inputs:** ${Object.keys(grouped).length}\n\n`;

for (const [file, items] of Object.entries(grouped)) {
  md += `## Arquivo: \`${file}\` (${items.length} campos)\n\n`;
  md += '| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |\n';
  md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';
  items.forEach(it => {
    md += `| L${it.line} | \`<${it.tag} type="${it.type}">\` | \`${it.nameOrId}\` | ${it.placeholder ? '"' + it.placeholder + '"' : '-'} | ${it.required ? 'Sim' : 'Não'} | ${it.maxLength || '-'} | |\n`;
  });
  md += '\n';
}

fs.writeFileSync(path.join(__dirname, 'audit_initial_table.md'), md, 'utf8');
console.log('Saved initial markdown to scratch/audit_initial_table.md');
