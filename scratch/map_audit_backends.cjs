const fs = require('fs');
const path = require('path');

const fields = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_data.json'), 'utf8')).filter(f => f.type !== 'hidden');

console.log('Generating complete structured inventory for', fields.length, 'fields...');

// Mapping file to functional module and backend mapping
const moduleMap = {
  'App/src/pages/Login.jsx': {
    category: '1. Autenticação & Cadastro',
    backend: 'Firebase Auth & users (authService.loginWithEmail / registerWithEmail / resetUserPassword)'
  },
  'App/src/pages/CompletarPerfil.jsx': {
    category: '1. Autenticação & Cadastro',
    backend: 'users (authService.updateAuthUser / UserRepository.update)'
  },
  'App/src/pages/Configuracoes.jsx': {
    category: '2. Configurações de Conta & Segurança',
    backend: 'users & Firebase Auth (authService.updateAuthUser / updateUserPassword)'
  },
  'App/src/components/EditProfileModal.jsx': {
    category: '3. Gestão de Perfis (Aluno / Geral)',
    backend: 'users (talentsService.updateTalentProfile / authService.updateAuthUser)'
  },
  'App/src/pages/PerfilAluno.jsx': {
    category: '3. Gestão de Perfis (Aluno / Geral)',
    backend: 'endorsement_requests (talentsService.requestTeacherEndorsement / approveEndorsementRequest)'
  },
  'App/src/components/EditCompanyProfileModal.jsx': {
    category: '4. Gestão de Perfil de Empresa',
    backend: 'users (authService.updateAuthUser)'
  },
  'App/src/pages/PerfilEmpresa.jsx': {
    category: '4. Gestão de Perfil de Empresa',
    backend: 'users (authService.updateAuthUser)'
  },
  'App/src/components/EditTeacherProfileModal.jsx': {
    category: '5. Gestão de Perfil de Professor',
    backend: 'users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)'
  },
  'App/src/components/EditFreelancerProfileModal.jsx': {
    category: '6. Gestão de Perfil de Freelancer',
    backend: 'users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)'
  },
  'App/src/pages/PerfilFreelancer.jsx': {
    category: '6. Gestão de Perfil de Freelancer',
    backend: 'users (authService.updateAuthUser)'
  },
  'App/src/components/PublishJobModal.jsx': {
    category: '7. Módulo de Vagas (Recrutamento)',
    backend: 'jobs (jobsService.createJob / jobsService.updateJob)'
  },
  'App/src/components/ui/JobTitleCombobox.jsx': {
    category: '7. Módulo de Vagas (Recrutamento)',
    backend: 'Consulta CBO / jobs (jobsService.createJob)'
  },
  'App/src/components/ui/BenefitCombobox.jsx': {
    category: '7. Módulo de Vagas (Recrutamento)',
    backend: 'jobs (jobsService.createJob)'
  },
  'App/src/components/ui/SkillCombobox.jsx': {
    category: '7. Módulo de Vagas (Recrutamento)',
    backend: 'jobs / users (jobsService / talentsService)'
  },
  'App/src/pages/Vagas.jsx': {
    category: '7. Módulo de Vagas (Recrutamento)',
    backend: 'Client-side query / Firestore jobs query (jobsService.getAllJobs)'
  },
  'App/src/pages/GerenciamentoVagasEmpresa.jsx': {
    category: '7. Módulo de Vagas (Recrutamento)',
    backend: 'applications & jobs (jobsService.updateApplicationStage / updateJob)'
  },
  'App/src/pages/MinhasVagas.jsx': {
    category: '7. Módulo de Vagas (Recrutamento)',
    backend: 'endorsement_requests (talentsService.approveEndorsementRequest)'
  },
  'App/src/components/PublishServiceModal.jsx': {
    category: '8. Marketplace de Serviços & Ordens',
    backend: 'services (servicesService.createService)'
  },
  'App/src/components/SolicitarServicoModal.jsx': {
    category: '8. Marketplace de Serviços & Ordens',
    backend: 'service_orders (servicesService.createServiceOrder)'
  },
  'App/src/components/AvaliarServicoModal.jsx': {
    category: '8. Marketplace de Serviços & Ordens',
    backend: 'services.reviews (servicesService.addServiceReview)'
  },
  'App/src/pages/Servicos.jsx': {
    category: '8. Marketplace de Serviços & Ordens',
    backend: 'services (servicesService.createService / getAllServices)'
  },
  'App/src/pages/BancoDeTalentos.jsx': {
    category: '9. Banco de Talentos & Busca Global',
    backend: 'Client-side query / Firestore users query (talentsService.getAllTalents)'
  },
  'App/src/pages/Dashboard.jsx': {
    category: '9. Banco de Talentos & Busca Global',
    backend: 'Client-side search (jobs & services)'
  },
  'App/src/components/ui/CustomSelect.jsx': {
    category: '9. Banco de Talentos & Busca Global',
    backend: 'Filtro local UI'
  },
  'App/src/components/ChatModal.jsx': {
    category: '10. Mensageria & Chat em Tempo Real',
    backend: 'chats/{chatId}/messages (chatService.sendMessage)'
  },
  'App/src/pages/admin/AdminUsers.jsx': {
    category: '11. Módulo Administrativo',
    backend: 'Client-side search / users query'
  },
  'App/src/pages/admin/AdminJobs.jsx': {
    category: '11. Módulo Administrativo',
    backend: 'Client-side search / jobs query'
  },
  'App/src/pages/admin/AdminServices.jsx': {
    category: '11. Módulo Administrativo',
    backend: 'Client-side search / services query'
  },
  'App/src/components/admin/AdminConfirmModal.jsx': {
    category: '11. Módulo Administrativo',
    backend: 'users / jobs / services (adminService.blockUser / deleteJobAdmin)'
  }
};

fs.writeFileSync(path.join(__dirname, 'audit_module_map.json'), JSON.stringify(moduleMap, null, 2), 'utf8');
console.log('Module mapping saved.');
