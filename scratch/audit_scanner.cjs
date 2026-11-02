const fs = require('fs');
const path = require('path');

const files = [
  'App/src/pages/Login.jsx',
  'App/src/pages/CompletarPerfil.jsx',
  'App/src/pages/Configuracoes.jsx',
  'App/src/components/EditProfileModal.jsx',
  'App/src/pages/PerfilAluno.jsx',
  'App/src/components/EditCompanyProfileModal.jsx',
  'App/src/pages/PerfilEmpresa.jsx',
  'App/src/components/EditTeacherProfileModal.jsx',
  'App/src/components/EditFreelancerProfileModal.jsx',
  'App/src/pages/PerfilFreelancer.jsx',
  'App/src/components/PublishJobModal.jsx',
  'App/src/components/ui/JobTitleCombobox.jsx',
  'App/src/components/ui/BenefitCombobox.jsx',
  'App/src/components/ui/SkillCombobox.jsx',
  'App/src/pages/Vagas.jsx',
  'App/src/pages/GerenciamentoVagasEmpresa.jsx',
  'App/src/pages/MinhasVagas.jsx',
  'App/src/components/PublishServiceModal.jsx',
  'App/src/components/SolicitarServicoModal.jsx',
  'App/src/components/AvaliarServicoModal.jsx',
  'App/src/pages/Servicos.jsx',
  'App/src/pages/BancoDeTalentos.jsx',
  'App/src/pages/Dashboard.jsx',
  'App/src/components/ui/CustomSelect.jsx',
  'App/src/components/ChatModal.jsx',
  'App/src/pages/admin/AdminUsers.jsx',
  'App/src/pages/admin/AdminUserDetail.jsx',
  'App/src/pages/admin/AdminJobs.jsx',
  'App/src/pages/admin/AdminServices.jsx',
  'App/src/components/admin/AdminConfirmModal.jsx'
];

const auditResults = [];

files.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((l, idx) => {
    if (/<(input|textarea)/i.test(l)) {
      const block = lines.slice(idx, Math.min(lines.length, idx + 10)).join(' ');
      const isTextarea = /<textarea/i.test(l);
      const typeMatch = block.match(/type=["']([^"']+)["']/);
      const nameMatch = block.match(/name=["']([^"']+)["']/);
      const idMatch = block.match(/id=["']([^"']+)["']/);
      const placeholderMatch = block.match(/placeholder=["']([^"']+)["']/);
      const valMatch = block.match(/value=\{([^}]+)\}/);
      const reqMatch = /required/i.test(block);
      const maxLenMatch = block.match(/maxLength=\{?(\d+)\}?/);
      const minLenMatch = block.match(/minLength=\{?(\d+)\}?/);
      
      const fieldType = isTextarea ? 'textarea' : (typeMatch ? typeMatch[1] : 'text');
      
      // ignore pure file inputs or checkboxes if not text
      if (fieldType === 'file' || fieldType === 'checkbox' || fieldType === 'radio') {
        return;
      }

      auditResults.push({
        file: relPath.replace(/\\/g, '/'),
        line: idx + 1,
        tag: isTextarea ? 'textarea' : 'input',
        type: fieldType,
        nameOrId: (nameMatch ? nameMatch[1] : (idMatch ? idMatch[1] : (valMatch ? valMatch[1].trim() : 'unnamed'))),
        placeholder: placeholderMatch ? placeholderMatch[1] : '',
        valueExpr: valMatch ? valMatch[1].trim() : '',
        required: reqMatch,
        maxLength: maxLenMatch ? maxLenMatch[1] : null,
        minLength: minLenMatch ? minLenMatch[1] : null
      });
    }
  });
});

fs.writeFileSync(path.join(process.cwd(), 'scratch', 'audit_data.json'), JSON.stringify(auditResults, null, 2), 'utf8');
console.log('Successfully saved', auditResults.length, 'fields to scratch/audit_data.json');
