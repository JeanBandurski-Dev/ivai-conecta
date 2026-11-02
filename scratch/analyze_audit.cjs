const fs = require('fs');
const path = require('path');

const fields = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_data.json'), 'utf8'));

const files = [...new Set(fields.map(f => f.file))];
console.log('Total files:', files.length);

files.forEach(f => {
  const fileFields = fields.filter(x => x.file === f);
  console.log('\n============================================================');
  console.log('FILE:', f, '(' + fileFields.length + ' campos)');
  console.log('============================================================');
  fileFields.forEach(ff => {
    console.log(`L${ff.line} | ${ff.tag} [type=${ff.type}] | Field: ${ff.nameOrId} | Req: ${ff.required} | Max: ${ff.maxLength || 'N/A'} | Placeholder: "${ff.placeholder}"`);
  });
});
