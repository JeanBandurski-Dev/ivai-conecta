// Ivaí Conecta - Business Logic Library
// Ported from Prototipo/public/js/app.js

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY_CITY         = 'ivai_conecta_selected_city';
const STORAGE_KEY_TALENTS      = 'ivai_conecta_db_talents';
const STORAGE_KEY_JOBS         = 'ivai_conecta_db_jobs';
const STORAGE_KEY_SERVICES     = 'ivai_conecta_db_services';
const STORAGE_KEY_AUTH_USER    = 'ivai_conecta_auth_user';
const STORAGE_KEY_USERS_DB     = 'ivai_conecta_users_db';
const STORAGE_KEY_APPLICATIONS = 'ivai_conecta_user_applications';

export const USER_ROLES = {
  aluno:      { id: 'aluno',      name: 'Aluno / Estudante',          badge: 'Estudante (IFPR/UENP/Univale)' },
  freelancer: { id: 'freelancer', name: 'Freelancer / Autônomo',      badge: 'Prestador de Serviço Autônomo' },
  candidato:  { id: 'candidato',  name: 'Candidato / Profissional',   badge: 'Candidato / Profissional' },
  empresa:    { id: 'empresa',    name: 'Empresa / Recrutador',       badge: 'Empresa / Recrutador' },
};

export const CITIES = [
  'Todas as Cidades',
  'Ivaiporã',
  'Jardim Alegre',
  'São João do Ivaí',
  'Manoel Ribas',
  'Lunardelli',
  'Borrazópolis',
  'Ariranha do Ivaí',
  'Grandes Rios',
];

// ─── Seed Data ────────────────────────────────────────────────
const SEED_TALENTS = [
  { id: 1, name: 'Lucas Eduardo Silva', course: 'Análise e Desenvolvimento de Sistemas', institution: 'IFPR Campus Ivaiporã', city: 'Ivaiporã', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', skills: ['JavaScript', 'HTML5/CSS3', 'React', 'Node.js', 'Git', 'SQL'], endorsements: [{ id: 'end_01', profName: 'Prof. Dr. Ricardo Oliveira', profEmail: 'ricardo.oliveira@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Desenvolvimento Web & Banco de Dados', quote: 'Profissional exemplar, com ótimo raciocínio lógico e liderança em projetos práticos.', isVerified: true }, { id: 'end_02', profName: 'Profª. Ma. Amanda Costa', profEmail: 'amanda.costa@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Engenharia de Software', quote: 'Demonstrou alto domínio em metodologias ágeis e capacidade técnica destacada na criação de APIs.', isVerified: true }] },
  { id: 2, name: 'Beatriz Santos', course: 'Administração', institution: 'Univale Ivaiporã', city: 'Jardim Alegre', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250', skills: ['Gestão Financeira', 'Excel Avançado', 'Marketing Digital', 'ERP', 'Atendimento ao Cliente'], endorsements: [{ id: 'end_03', profName: 'Prof. Carlos Alberto Ramos', profEmail: 'carlos.ramos@univale.edu.br', institution: 'Univale Ivaiporã', discipline: 'Gestão Financeira e Orçamentária', quote: 'Extremamente dedicada, responsável e proativa na solução de casos de gestão empresarial.', isVerified: true }] },
  { id: 3, name: 'Matheus Henrique', course: 'Técnico em Eletrotécnica', institution: 'IFPR Campus Ivaiporã', city: 'São João do Ivaí', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250', skills: ['Instalações Elétricas', 'Automação Industrial', 'Comandos Elétricos', 'AutoCAD', 'NR-10'], endorsements: [{ id: 'end_04', profName: 'Prof. Eng. Fernando Souza', profEmail: 'fernando.souza@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Instalações Elétricas Industriais', quote: 'Profissional técnico com excelente visão de segurança e precisão em diagramas unifilares.', isVerified: true }] },
  { id: 4, name: 'Camila Fernandes', course: 'Design Gráfico & Mídias', institution: 'UENP / Unicesumar', city: 'Manoel Ribas', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250', skills: ['Figma', 'Photoshop', 'Branding', 'UI/UX Design', 'Social Media'], endorsements: [{ id: 'end_05', profName: 'Profª. Dra. Vanessa Martins', profEmail: 'vanessa.martins@uenp.edu.br', institution: 'UENP', discipline: 'Identidade Visual & Experiência do Usuário', quote: 'Camila possui um olhar estético apurado e cria identidades visuais memoráveis para o comércio regional.', isVerified: true }] },
  { id: 5, name: 'Rafael Gomes Costa', course: 'Engenharia de Software', institution: 'UENP', city: 'Ivaiporã', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250', skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'], endorsements: [{ id: 'end_06', profName: 'Prof. Dr. André Luciano', profEmail: 'andre.luciano@uenp.edu.br', institution: 'UENP', discipline: 'Engenharia de Software Avançada', quote: 'Rafael demonstra maturidade técnica rara para um estudante, com projetos de backend robustos e bem documentados.', isVerified: true }] },
  { id: 6, name: 'Juliana Aparecida Melo', course: 'Análise e Desenvolvimento de Sistemas', institution: 'IFPR Campus Ivaiporã', city: 'Jardim Alegre', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250', skills: ['Vue.js', 'JavaScript', 'HTML5/CSS3', 'MySQL', 'Scrum', 'Figma'], endorsements: [{ id: 'end_07', profName: 'Prof. Ma. Renata Nunes', profEmail: 'renata.nunes@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Desenvolvimento de Sistemas Web', quote: 'Aluna comprometida, criativa e com excelente capacidade de entrega em projetos ágeis colaborativos.', isVerified: true }] },
  { id: 7, name: 'Bruno Freitas — Dev & Infra', course: 'Freelancer — Tecnologia da Informação', institution: 'Autônomo / Vale do Ivaí', city: 'Ivaiporã', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250', skills: ['Linux', 'AWS', 'Docker', 'CI/CD', 'Nginx', 'Node.js', 'TypeScript'], endorsements: [{ id: 'end_08', profName: 'ValeTech Soluções Digitais', profEmail: 'rh@valetech.com.br', institution: 'Empresa Parceira Verificada', discipline: 'Infraestrutura & DevOps', quote: 'Profissional autônomo de alta confiabilidade. Migrou toda nossa infra para cloud com zero downtime.', isVerified: true }] },
  { id: 8, name: 'Fernanda Lima', course: 'Licenciatura em Pedagogia', institution: 'Univale Ivaiporã', city: 'São João do Ivaí', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250', skills: ['Gestão de Pessoas', 'Treinamento Corporativo', 'RH', 'Google Workspace', 'Power BI'], endorsements: [] },
  { id: 9, name: 'Diego Carvalho — Design & Vídeo', course: 'Freelancer — Criação Digital', institution: 'Autônomo / Manoel Ribas', city: 'Manoel Ribas', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250', skills: ['Adobe Premiere', 'After Effects', 'Figma', 'Motion Design', 'Social Media', 'Copywriting'], endorsements: [] },
  { id: 10, name: 'Isabela Rocha', course: 'Ciências Contábeis', institution: 'UENP', city: 'Grandes Rios', avatar: 'https://images.unsplash.com/photo-1546961342-ea5f60b193b7?auto=format&fit=crop&q=80&w=250', skills: ['Contabilidade Fiscal', 'SPED', 'Excel Avançado', 'Planejamento Tributário', 'ERP Totvs'], endorsements: [] },
  { id: 11, name: 'Gustavo Henrique Prado', course: 'Agronomia & Gestão Rural', institution: 'Univale Ivaiporã', city: 'Ivaiporã', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250', skills: ['Manejo de Culturas', 'Agricultura de Precisão', 'Gestão de Safra', 'GPS Agrícola', 'Relatórios Técnicos'], endorsements: [{ id: 'end_09', profName: 'Prof. Dr. Marcelo Guimarães', profEmail: 'marcelo.guimaraes@univale.edu.br', institution: 'Univale Ivaiporã', discipline: 'Fitotecnia e Gestão de Lavouras', quote: 'Destaque acadêmico em experimentos de campo e implementação de tecnologias de precisão.', isVerified: true }] },
  { id: 12, name: 'Mariana Alcântara', course: 'Enfermagem & Saúde Ocupacional', institution: 'Univale Ivaiporã', city: 'Ivaiporã', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250', skills: ['Primeiros Socorros', 'Triagem', 'Auditoria de Saúde', 'NR-32', 'Prontuário Eletrônico'], endorsements: [{ id: 'end_10', profName: 'Profª. Ma. Cláudia Vieira', profEmail: 'claudia.vieira@univale.edu.br', institution: 'Univale Ivaiporã', discipline: 'Enfermagem do Trabalho', quote: 'Aluna com excelente postura ética, humanizada e domínio rigoroso de protocolos hospitalares.', isVerified: true }] },
  { id: 13, name: 'Tiago Zanin', course: 'Redes de Computadores & Infra', institution: 'IFPR Campus Ivaiporã', city: 'Jardim Alegre', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250', skills: ['MikroTik', 'Firewall pfSense', 'Linux Server', 'Cabeamento Estruturado', 'Segurança da Informação'], endorsements: [{ id: 'end_11', profName: 'Prof. Esp. Juliano Becker', profEmail: 'juliano.becker@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Infraestrutura de Redes', quote: 'Habilidade prática de alto nível em configuração de roteamento e segurança de perímetro.', isVerified: true }] },
  { id: 14, name: 'Larissa Medeiros', course: 'Marketing Digital & Tráfego', institution: 'Autônoma / Vale do Ivaí', city: 'São João do Ivaí', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', skills: ['Google Ads', 'Meta Ads', 'Copywriting', 'SEO Local', 'Google Analytics 4'], endorsements: [{ id: 'end_12', profName: 'Agência Conect@', profEmail: 'contato@agenciaconecta.com.br', institution: 'Parceiro Verificado', discipline: 'Gestão de Tráfego Pago', quote: 'Alavancou em 140% as conversões de clientes do comércio de Ivaiporã com campanhas assertivas.', isVerified: true }] },
  { id: 15, name: 'Felipe Silveira', course: 'Técnico em Edificações & Obras', institution: 'IFPR Campus Ivaiporã', city: 'Manoel Ribas', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250', skills: ['AutoCAD 2D/3D', 'Orçamento SINAPI', 'Topografia', 'MS Project', 'Fiscalização de Obras'], endorsements: [{ id: 'end_13', profName: 'Prof. Eng. Paulo Roberto', profEmail: 'paulo.roberto@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Construção Civil e Orçamentos', quote: 'Rigor técnico impecável em levantamentos quantitativos e modelagem de projetos.', isVerified: true }] },
  { id: 16, name: 'Carolina Neves', course: 'Engenharia de Produção', institution: 'UENP', city: 'Grandes Rios', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250', skills: ['Lean Manufacturing', 'Controle de Qualidade', '5S', 'Mapeamento de Processos', 'Excel Avançado'], endorsements: [{ id: 'end_14', profName: 'Prof. Dr. Eduardo Camargo', profEmail: 'eduardo.camargo@uenp.edu.br', institution: 'UENP', discipline: 'Gestão da Produção e Qualidade', quote: 'Excelente perfil analítico, liderou projetos de redução de desperdício em indústrias parceiras.', isVerified: true }] },
];

const SEED_JOBS = [
  { id: 101, title: 'Desenvolvedor Front-end Junior / Estagiário', company: 'ValeTech Soluções Digitais', city: 'Ivaiporã', type: 'Tempo Integral / Híbrido', requiredSkills: ['JavaScript', 'HTML5/CSS3', 'React', 'Git'] },
  { id: 102, title: 'Assistente Administrativo & Financeiro', company: 'Cooperativa Agropecuária do Vale', city: 'Ivaiporã', type: 'Tempo Integral', requiredSkills: ['Excel Avançado', 'Gestão Financeira', 'ERP', 'Atendimento ao Cliente'] },
  { id: 103, title: 'Técnico de Manutenção Elétrica Industrial', company: 'Indústria Metalúrgica Ivaiporã', city: 'São João do Ivaí', type: 'Tempo Integral', requiredSkills: ['Instalações Elétricas', 'Comandos Elétricos', 'NR-10', 'Automação Industrial'] },
  { id: 104, title: 'Designer de Mídias Sociais & Marketing', company: 'Agência Conect@ Comunicação', city: 'Jardim Alegre', type: 'Meio Período / Remoto', requiredSkills: ['Figma', 'Photoshop', 'Social Media', 'Branding'] },
  { id: 105, title: 'Analista de Dados & Business Intelligence', company: 'Cooperativa Agropecuária do Vale', city: 'Ivaiporã', type: 'Tempo Integral (CLT)', requiredSkills: ['Power BI', 'Excel Avançado', 'SQL', 'Python'] },
  { id: 106, title: 'Auxiliar Contábil e Fiscal', company: 'Escritório Contábil Pereira & Associados', city: 'Grandes Rios', type: 'Tempo Integral (CLT)', requiredSkills: ['Contabilidade Fiscal', 'SPED', 'ERP Totvs', 'Excel Avançado'] },
  { id: 107, title: 'Estágio em Desenvolvimento Backend (Python)', company: 'ValeTech Soluções Digitais', city: 'Ivaiporã', type: 'Estágio / Trainee', requiredSkills: ['Python', 'Django', 'REST APIs', 'PostgreSQL', 'Git'] },
  { id: 108, title: 'Coordenador de Treinamento & DHO', company: 'Indústria Metalúrgica Ivaiporã', city: 'São João do Ivaí', type: 'Tempo Integral (CLT)', requiredSkills: ['Gestão de Pessoas', 'Treinamento Corporativo', 'RH', 'Google Workspace'] },
  { id: 109, title: 'Produtor de Vídeo & Motion Designer', company: 'Agência Conect@ Comunicação', city: 'Manoel Ribas', type: 'Prestador de Serviço (PJ)', requiredSkills: ['Adobe Premiere', 'After Effects', 'Motion Design', 'Copywriting'] },
];

const SEED_SERVICES = [
  { id: 201, providerName: 'Marcos Eletricista & Automação', category: 'Construção & Manutenção', city: 'Ivaiporã', phone: '5543999887766', rating: 4.9, reviewsCount: 38, badge: 'Verificado Ivaí Conecta', description: 'Serviços residenciais e comerciais, padrões Copel, quadros de distribuição e manutenção de emergência 24h.' },
  { id: 202, providerName: 'Ana Paula - Design & Redes Sociais', category: 'Marketing & Design', city: 'Jardim Alegre', phone: '5543999112233', rating: 5.0, reviewsCount: 24, badge: 'Destaque da Semana', description: 'Criação de logotipos, gestão de Instagram/Facebook, materiais impressos e identidade visual para o comércio local.' },
  { id: 203, providerName: 'TechVale - Suporte em Informática', category: 'Tecnologia & Suporte', city: 'Ivaiporã', phone: '5543999445566', rating: 4.8, reviewsCount: 52, badge: 'Verificado Ivaí Conecta', description: 'Formatação, remoção de vírus, montagem de computadores gamer, redes Wi-Fi empresariais e instalação de câmeras.' },
  { id: 204, providerName: 'ClimaIvaí Climatização Split', category: 'Manutenção Doméstica', city: 'Manoel Ribas', phone: '5543999778899', rating: 4.9, reviewsCount: 19, badge: 'Certificado', description: 'Limpeza, higienização, recarga de gás e instalação de ar condicionado split em toda a microrregião.' },
  { id: 205, providerName: 'Bruno Dev — Sistemas & Sites', category: 'Tecnologia & Suporte', city: 'Ivaiporã', phone: '5543999321456', rating: 5.0, reviewsCount: 11, badge: 'Verificado Ivaí Conecta', description: 'Desenvolvimento de sites institucionais, sistemas web, APIs REST, hospedagem e manutenção em cloud. Orçamento sem compromisso.' },
  { id: 206, providerName: 'Diego Produções — Vídeo & Foto', category: 'Marketing & Design', city: 'Manoel Ribas', phone: '5543999654987', rating: 4.8, reviewsCount: 33, badge: 'Destaque da Semana', description: 'Produção de vídeos institucionais, reels, fotos de produto e campanhas para redes sociais. Cobertura em toda a região.' },
  { id: 207, providerName: 'ContaFácil — Assessoria Contábil', category: 'Finanças & Contabilidade', city: 'Grandes Rios', phone: '5543999123789', rating: 4.9, reviewsCount: 27, badge: 'Verificado Ivaí Conecta', description: 'Abertura e fechamento de empresas, declaração de IR pessoa física e jurídica, planejamento tributário e consultoria MEI.' },
  { id: 208, providerName: 'FerPedagogia — Aulas & Treinamentos', category: 'Educação & Cursos', city: 'São João do Ivaí', phone: '5543999852741', rating: 5.0, reviewsCount: 18, badge: 'Destaque da Semana', description: 'Reforço escolar, capacitações corporativas em Google Workspace e Power BI, e orientação profissional para jovens talentos.' },
];

const SEED_APPLICATIONS = [
  { id: 'app_101', jobId: 101, title: 'Desenvolvedor Front-end Junior / Estagiário', company: 'ValeTech Soluções Digitais', recruiterPhone: '5543999887766', city: 'Ivaiporã', type: 'Tempo Integral / Híbrido', appliedAt: '16/08/2026', matchScore: 92, status: 'Entrevista Agendada', statusClass: 'badge-match-high', currentStageIndex: 2, nextStepNote: 'Entrevista técnica agendada para Quinta-feira às 14:00 via Google Meet.', stages: [{ name: 'Candidatura Enviada', date: '16/08/2026', completed: true }, { name: 'Triagem de Currículo', date: '17/08/2026', completed: true }, { name: 'Entrevista / Teste Técnico', date: '19/08/2026', completed: false, active: true }, { name: 'Proposta / Admissão', date: 'Pendente', completed: false }] },
  { id: 'app_102', jobId: 102, title: 'Assistente Administrativo & Financeiro', company: 'Cooperativa Agropecuária do Vale', recruiterPhone: '5543999112233', city: 'Ivaiporã', type: 'Tempo Integral', appliedAt: '12/08/2026', matchScore: 85, status: 'Em Análise pelo Recrutador', statusClass: 'badge-endorsement', currentStageIndex: 1, nextStepNote: 'Sua candidatura está em avaliação pela equipe de Recursos Humanos.', stages: [{ name: 'Candidatura Enviada', date: '12/08/2026', completed: true }, { name: 'Triagem de Currículo', date: '14/08/2026', completed: false, active: true }, { name: 'Entrevista Presencial', date: 'A definir', completed: false }, { name: 'Proposta / Admissão', date: 'Pendente', completed: false }] },
];

const DEFAULT_USERS = [
  { email: 'aluno@ivaiconecta.com.br', password: '123456', name: 'Lucas Eduardo Silva', city: 'Ivaiporã', role: 'aluno', badge: 'Estudante (IFPR Campus Ivaiporã)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { email: 'freelancer@ivaiconecta.com.br', password: '123456', name: 'Marcos Eletricista & Automação', city: 'Ivaiporã', role: 'freelancer', badge: 'Prestador de Serviço Autônomo', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { email: 'candidato@ivaiconecta.com.br', password: '123456', name: 'Beatriz Santos', city: 'Jardim Alegre', role: 'candidato', badge: 'Candidato / Profissional', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
  { email: 'empresa@ivaiconecta.com.br', password: '123456', name: 'ValeTech Soluções Digitais', city: 'Ivaiporã', role: 'empresa', badge: 'Empresa / Recrutador', avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150' },
];

// ─── Users DB ─────────────────────────────────────────────────
function getUsersDB() {
  const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
  if (raw) {
    try { const u = JSON.parse(raw); if (u && u.length > 0) return u; } catch {}
  }
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

// ─── Auth ─────────────────────────────────────────────────────
export function getAuthUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_AUTH_USER)); } catch { return null; }
}

export function login(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass  = (password || '').trim();

  if (!cleanEmail) return { success: false, error: 'Por favor, informe seu e-mail de acesso.' };
  if (!cleanPass)  return { success: false, error: 'Por favor, informe sua senha.' };

  let db = getUsersDB();
  let account = db.find(u => u.email.toLowerCase() === cleanEmail);

  // Demo auto-create
  if (!account && cleanEmail.includes('@ivaiconecta.com.br')) {
    const roleKey = cleanEmail.split('@')[0];
    const roleConf = USER_ROLES[roleKey] || USER_ROLES.aluno;
    const demoNames = { aluno: 'Lucas Eduardo Silva', freelancer: 'Marcos Eletricista & Automação', candidato: 'Beatriz Santos', empresa: 'ValeTech Soluções Digitais' };
    account = { email: cleanEmail, password: '123456', name: demoNames[roleKey] || 'Usuário', city: 'Ivaiporã', role: roleKey, badge: roleConf.badge, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' };
    db.push(account);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(db));
  }

  if (!account) return { success: false, error: 'Nenhuma conta encontrada com este e-mail. Crie uma conta na aba "Criar Nova Conta".' };
  if (account.password !== cleanPass && !cleanEmail.includes('@ivaiconecta.com.br')) {
    return { success: false, error: 'Senha incorreta. Verifique suas credenciais e tente novamente.' };
  }

  const roleConf = USER_ROLES[account.role] || USER_ROLES.aluno;
  const authUser = { email: account.email, name: account.name, city: account.city || 'Ivaiporã', role: account.role, roleName: roleConf.name, badge: account.badge || roleConf.badge, avatar: account.avatar, loggedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
  if (account.city) setSelectedCity(account.city);
  return { success: true, user: authUser };
}

export function register({ name, email, city, role, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass  = (password || '').trim();
  const cleanName  = (name || '').trim();
  const roleId     = role || 'aluno';

  if (!cleanName || cleanName.length < 2) return { success: false, error: 'Informe seu nome completo ou razão social.' };
  if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Informe um e-mail válido.' };
  if (cleanPass.length < 6) return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };

  const db = getUsersDB();
  if (db.find(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Este e-mail já está cadastrado. Faça login na aba "Entrar na Conta".' };
  }

  const roleConf = USER_ROLES[roleId] || USER_ROLES.aluno;
  const avatars = { aluno: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', freelancer: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', candidato: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', empresa: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150' };
  const newUser = { email: cleanEmail, password: cleanPass, name: cleanName, city: city || 'Ivaiporã', role: roleId, badge: roleConf.badge, avatar: avatars[roleId] };
  db.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(db));

  const authUser = { email: newUser.email, name: newUser.name, city: newUser.city, role: newUser.role, roleName: roleConf.name, badge: newUser.badge, avatar: newUser.avatar, loggedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
  if (city) setSelectedCity(city);
  return { success: true, user: authUser };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY_AUTH_USER);
}

// ─── City ─────────────────────────────────────────────────────
export function getSelectedCity() {
  return localStorage.getItem(STORAGE_KEY_CITY) || 'Todas as Cidades';
}

export function setSelectedCity(city) {
  localStorage.setItem(STORAGE_KEY_CITY, city);
}

// ─── Data Access ──────────────────────────────────────────────
function loadOrSeed(key, seed) {
  try {
    const local = JSON.parse(localStorage.getItem(key));
    if (local && local.length >= seed.length) return local;
  } catch {}
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export function getTalents(selectedCity) {
  const city = selectedCity ?? getSelectedCity();
  const all  = loadOrSeed(STORAGE_KEY_TALENTS, SEED_TALENTS);
  return city && city !== 'Todas as Cidades' ? all.filter(t => t.city === city) : all;
}

export function getTalentById(id) {
  const all = loadOrSeed(STORAGE_KEY_TALENTS, SEED_TALENTS);
  return all.find(t => String(t.id) === String(id)) || all[0];
}

export function getJobs(selectedCity) {
  const city = selectedCity ?? getSelectedCity();
  const all  = loadOrSeed(STORAGE_KEY_JOBS, SEED_JOBS);
  return city && city !== 'Todas as Cidades' ? all.filter(j => j.city === city) : all;
}

export function getServices(selectedCity) {
  const city = selectedCity ?? getSelectedCity();
  const all  = loadOrSeed(STORAGE_KEY_SERVICES, SEED_SERVICES);
  return city && city !== 'Todas as Cidades' ? all.filter(s => s.city === city) : all;
}

export function addService(payload) {
  const all = loadOrSeed(STORAGE_KEY_SERVICES, SEED_SERVICES);
  all.unshift(payload);
  localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(all));
  return payload;
}

export function getUserApplications() {
  return loadOrSeed(STORAGE_KEY_APPLICATIONS, SEED_APPLICATIONS);
}

export function addEndorsementToTalent(id, payload) {
  const all    = loadOrSeed(STORAGE_KEY_TALENTS, SEED_TALENTS);
  const talent = all.find(t => String(t.id) === String(id));
  if (talent) {
    if (!talent.endorsements) talent.endorsements = [];
    talent.endorsements.unshift(payload);
    localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(all));
  }
}

export function updateTalentProfile(id, data) {
  const all = loadOrSeed(STORAGE_KEY_TALENTS, SEED_TALENTS);
  const idx = all.findIndex(t => String(t.id) === String(id));
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data };
    localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(all));
    return all[idx];
  }
  return null;
}

// ─── Matching ─────────────────────────────────────────────────
export function calculateMatchScore(studentSkills = [], requiredSkills = []) {
  if (!requiredSkills?.length || !studentSkills?.length) return 0;
  const norm = studentSkills.map(s => String(s).toLowerCase().trim());
  const hits = requiredSkills.filter(r => norm.includes(String(r).toLowerCase().trim())).length;
  return Math.round((hits / requiredSkills.length) * 100);
}

// ─── WhatsApp ─────────────────────────────────────────────────
export function generateWhatsAppLink(phone = '', serviceName = '', providerName = '', city = '') {
  let clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;
  const msg = `Olá ${providerName}! Encontrei seu serviço de "${serviceName}" em ${city} através da plataforma Ivaí Conecta. Gostaria de solicitar um orçamento.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

// ─── Endorsements ─────────────────────────────────────────────
export function validateEndorsement({ profName, profEmail, discipline, quote } = {}) {
  if (!profName || profName.trim().length < 3)      return { isValid: false, error: 'Informe o nome do recomendador.' };
  if (!profEmail || !profEmail.includes('@'))        return { isValid: false, error: 'Informe um e-mail de contato válido.' };
  if (!discipline || discipline.trim().length < 3)  return { isValid: false, error: 'Informe o cargo, disciplina ou área recomendada.' };
  if (!quote || quote.trim().length < 10)           return { isValid: false, error: 'O parecer deve ter no mínimo 10 caracteres.' };
  return { isValid: true };
}

export function createEndorsementPayload(data) {
  return {
    id: `endosso_${Date.now()}`,
    profName:   data.profName.trim(),
    profEmail:  data.profEmail.trim().toLowerCase(),
    institution: (data.institution || '').trim(),
    discipline:  data.discipline.trim(),
    quote:       data.quote.trim(),
    verifiedAt:  new Date().toISOString(),
    isVerified:  true,
  };
}

export function canApplyToJobs(user) {
  if (!user) return { allowed: false, reason: 'not_logged', message: 'Você precisa estar logado para se candidatar a vagas.' };
  if (user.role === 'aluno' || user.role === 'candidato') return { allowed: true };
  if (user.role === 'freelancer') {
    if (user.isCandidateEnabled) return { allowed: true };
    return { allowed: false, reason: 'hybrid_required', message: 'Como Freelancer, ative o <strong>Modo Candidato</strong> nas Configurações para se candidatar a vagas CLT/Estágio.' };
  }
  return { allowed: false, reason: 'role_blocked', message: 'Contas empresariais não podem se candidatar a vagas. Crie uma conta de Aluno ou Candidato.' };
}
