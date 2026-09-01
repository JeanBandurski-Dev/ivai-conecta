// Data Seed for Ivaí Conecta

export const STORAGE_KEY_CITY                 = 'ivai_conecta_selected_city';
export const STORAGE_KEY_TALENTS              = 'ivai_conecta_db_talents';
export const STORAGE_KEY_JOBS                 = 'ivai_conecta_db_jobs';
export const STORAGE_KEY_SERVICES             = 'ivai_conecta_db_services';
export const STORAGE_KEY_AUTH_USER            = 'ivai_conecta_auth_user';
export const STORAGE_KEY_USERS_DB             = 'ivai_conecta_users_db';
export const STORAGE_KEY_APPLICATIONS         = 'ivai_conecta_user_applications';
export const STORAGE_KEY_FAV_JOBS             = 'ivai_conecta_fav_jobs';
export const STORAGE_KEY_FAV_TALENTS          = 'ivai_conecta_fav_talents';
export const STORAGE_KEY_TEACHERS             = 'ivai_conecta_teachers_db';
export const STORAGE_KEY_ENDORSEMENT_REQUESTS = 'ivai_conecta_endorsement_requests';

export const USER_ROLES = {
  aluno:      { id: 'aluno',      name: 'Aluno / Estudante',          badge: 'Estudante (IFPR/UENP/Univale)' },
  freelancer: { id: 'freelancer', name: 'Freelancer / Autônomo',      badge: 'Prestador de Serviço Autônomo' },
  candidato:  { id: 'candidato',  name: 'Candidato / Profissional',   badge: 'Candidato / Profissional' },
  empresa:    { id: 'empresa',    name: 'Empresa / Recrutador',       badge: 'Empresa / Recrutador' },
  professor:  { id: 'professor',  name: 'Professor / Docente',        badge: 'Docente (IFPR/UENP/Univale)' },
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

export const SEED_TEACHERS = [
  {
    id: 'prof_1',
    name: 'Prof. Dr. Ronan Silva',
    degree: 'Doutor em Ciência da Computação (UFPR)',
    institution: 'IFPR Campus Ivaiporã',
    email: 'ronan.silva@ifpr.edu.br',
    discipline: 'Programação de Computadores & Redes',
    endorsementCount: 18,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    bio: 'Professor de Engenharia e Análise de Sistemas no IFPR Campus Ivaiporã. Atua no desenvolvimento de projetos práticos e orientação de alunos para o mercado de trabalho regional.',
    education: [
      { degree: 'Doutorado em Ciência da Computação', institution: 'Universidade Federal do Paraná (UFPR)', year: '2020' },
      { degree: 'Mestrado em Engenharia Elétrica & Computação', institution: 'Universidade Estadual de Londrina (UEL)', year: '2016' },
      { degree: 'Bacharelado em Ciência da Computação', institution: 'Universidade Estadual de Maringá (UEM)', year: '2013' }
    ],
    classes: ['Lógica de Programação I', 'Redes de Computadores', 'Estrutura de Dados em C/Python']
  },
  {
    id: 'prof_2',
    name: 'Prof. Dr. Ricardo Oliveira',
    degree: 'Doutor em Engenharia de Software (UNICAMP)',
    institution: 'IFPR Campus Ivaiporã',
    email: 'ricardo.oliveira@ifpr.edu.br',
    discipline: 'Desenvolvimento Web & Banco de Dados',
    endorsementCount: 24,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    bio: 'Docente e pesquisador com mais de 12 anos de experiência em banco de dados relacioais e aplicações web modernas.',
    education: [
      { degree: 'Doutorado em Engenharia de Software', institution: 'UNICAMP', year: '2018' },
      { degree: 'Bacharelado em Sistemas de Informação', institution: 'UTFPR', year: '2012' }
    ],
    classes: ['Desenvolvimento Web I & II', 'Banco de Dados Relacional MySQL/PostgreSQL']
  },
  {
    id: 'prof_3',
    name: 'Profª. Ma. Amanda Costa',
    degree: 'Mestre em Engenharia de Software (UTFPR)',
    institution: 'IFPR Campus Ivaiporã',
    email: 'amanda.costa@ifpr.edu.br',
    discipline: 'Engenharia de Software & Metodologias Ágeis',
    endorsementCount: 15,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    bio: 'Especialista em metodologias ágeis Scrum/Kanban e qualidade de software. Mentora de grupos de inovação acadêmica.',
    education: [
      { degree: 'Mestrado em Engenharia de Software', institution: 'UTFPR', year: '2019' },
      { degree: 'Bacharelado em Ciência da Computação', institution: 'UENP', year: '2015' }
    ],
    classes: ['Metodologias Ágeis & Scrum', 'Arquitetura de Software', 'Gestão de Projetos de TI']
  },
  {
    id: 'prof_4',
    name: 'Prof. Carlos Alberto Ramos',
    degree: 'Especialista em Gestão Financeira & Controladoria (FEA/USP)',
    institution: 'Univale Ivaiporã',
    email: 'carlos.ramos@univale.edu.br',
    discipline: 'Gestão Financeira e Orçamentária',
    endorsementCount: 12,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    bio: 'Consultor empresarial e professor do curso de Administração na Univale. Orientador de empresas juniores.',
    education: [
      { degree: 'Especialização em Controladoria', institution: 'FEA/USP', year: '2017' },
      { degree: 'Graduação em Administração de Empresas', institution: 'Univale', year: '2011' }
    ],
    classes: ['Análise de Balanço & DRE', 'Planejamento Orçamentário Empresarial']
  },
  {
    id: 'prof_5',
    name: 'Profª. Dra. Vanessa Martins',
    degree: 'Doutora em Design & Comunicação Visual (UFSC)',
    institution: 'UENP Campus Jacarezinho / Ivaiporã',
    email: 'vanessa.martins@uenp.edu.br',
    discipline: 'Identidade Visual & UX/UI',
    endorsementCount: 9,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    bio: 'Pesquisadora em experiência do usuário e design de interfaces para aplicativos móveis e web.',
    education: [
      { degree: 'Doutorado em Design', institution: 'UFSC', year: '2021' },
      { degree: 'Bacharelado em Design Gráfico', institution: 'UEL', year: '2014' }
    ],
    classes: ['Design de Interfaces UX/UI', 'Tipografia e Identidade de Marca']
  }
];

export const SEED_ENDORSEMENT_REQUESTS = [
  {
    id: 'req_1',
    studentId: 1,
    studentName: 'Lucas Eduardo Silva',
    studentCourse: 'Análise e Desenvolvimento de Sistemas (IFPR)',
    profEmail: 'ronan.silva@ifpr.edu.br',
    profName: 'Prof. Dr. Ronan Silva',
    discipline: 'Programação de Computadores',
    requestedAt: '20/08/2026',
    message: 'Olá Professor Ronan, solicito um parecer sobre meu desempenho na disciplina de Programação de Computadores para meu currículo no Ivaí Conecta.',
    status: 'Pendente'
  },
  {
    id: 'req_2',
    studentId: 2,
    studentName: 'Beatriz Santos',
    studentCourse: 'Administração (Univale)',
    profEmail: 'carlos.ramos@univale.edu.br',
    profName: 'Prof. Carlos Alberto Ramos',
    discipline: 'Gestão Financeira e Orçamentária',
    requestedAt: '21/08/2026',
    message: 'Olá Professor Carlos, solicito uma recomendação pedagógica referente aos trabalhos de orçamento desenvolvidos no semestre.',
    status: 'Pendente'
  }
];

export const SEED_TALENTS = [
  {
    id: 1,
    name: 'Lucas Eduardo Silva',
    email: 'aluno@ivaiconecta.com.br',
    course: 'Análise e Desenvolvimento de Sistemas',
    institution: 'IFPR Campus Ivaiporã',
    period: '5º Semestre (Vespertino)',
    city: 'Ivaiporã',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    skills: ['JavaScript', 'HTML5/CSS3', 'React', 'Node.js', 'Git', 'SQL'],
    isVerifiedStudent: true,
    raNumber: 'IFPR-2024-8891',
    linkedin: 'https://linkedin.com/in/lucas-eduardo-dev',
    github: 'https://github.com/lucas-dev',
    bio: 'Estudante de ADS apaixonado por desenvolvimento web e mobile. Busco oportunidade de estágio ou vaga junior na região de Ivaiporã.',
    experiences: [
      { id: 'exp1', role: 'Estagiário de TI', company: 'Prefeitura de Ivaiporã', period: 'Jan/2025 - Atual', description: 'Desenvolvimento de telas responsivas e suporte a banco de dados MySQL para o portal público.' },
      { id: 'exp2', role: 'Monitor de Programação', company: 'IFPR Campus Ivaiporã', period: 'Mar/2024 - Dez/2024', description: 'Auxílio aos alunos ingressantes nas disciplinas de Lógica e Estrutura de Dados.' }
    ],
    projects: [
      { id: 'proj1', title: 'Ivaí Conecta - Plataforma Regional', tech: 'React, Node, Tailwind', link: 'https://github.com/lucas-dev/ivai-conecta', description: 'Sistema de ponte de empregabilidade regional para o Vale do Ivaí.' }
    ],
    endorsements: [
      { id: 'end_01', profName: 'Prof. Dr. Ricardo Oliveira', profEmail: 'ricardo.oliveira@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Desenvolvimento Web & Banco de Dados', quote: 'Profissional exemplar, com ótimo raciocínio lógico e liderança em projetos práticos.' },
      { id: 'end_02', profName: 'Prof. Dr. Ronan Silva', profEmail: 'ronan.silva@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Programação de Computadores & Redes', quote: 'Excelente aluno, destaque na resolução de algoritmos e desenvolvimento prático.' }
    ]
  },
  {
    id: 2,
    name: 'Beatriz Santos',
    email: 'candidato@ivaiconecta.com.br',
    course: 'Administração',
    institution: 'Univale Ivaiporã',
    period: '7º Semestre',
    city: 'Jardim Alegre',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    skills: ['Gestão Financeira', 'Excel Avançado', 'Marketing Digital', 'ERP', 'Atendimento ao Cliente'],
    isVerifiedStudent: true,
    raNumber: 'UNIVALE-2023-4122',
    linkedin: 'https://linkedin.com/in/beatriz-santos-adm',
    github: 'https://github.com/beatriz-santos-adm',
    bio: 'Estudante de Administração com foco em controle orçamentário e rotinas financeiras empresariais.',
    experiences: [],
    projects: [],
    endorsements: [
      { id: 'end_03', profName: 'Prof. Carlos Alberto Ramos', profEmail: 'carlos.ramos@univale.edu.br', institution: 'Univale Ivaiporã', discipline: 'Gestão Financeira e Orçamentária', quote: 'Extremamente dedicada, responsável e proativa na solução de casos de gestão empresarial.' }
    ]
  },
  {
    id: 3,
    name: 'Matheus Henrique',
    course: 'Técnico em Eletrotécnica',
    institution: 'IFPR Campus Ivaiporã',
    city: 'São João do Ivaí',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    skills: ['Instalações Elétricas', 'Automação Industrial', 'Comandos Elétricos', 'AutoCAD', 'NR-10'],
    isVerifiedStudent: true,
    raNumber: 'IFPR-2024-9912',
    linkedin: 'https://linkedin.com/in/matheus-henrique-eletro',
    github: 'https://github.com/matheus-henrique-dev',
    endorsements: [
      { id: 'end_04', profName: 'Prof. Eng. Fernando Souza', profEmail: 'fernando.souza@ifpr.edu.br', institution: 'IFPR Campus Ivaiporã', discipline: 'Instalações Elétricas Industriais', quote: 'Profissional técnico com excelente visão de segurança e precisão em diagramas unifilares.' }
    ]
  },
  {
    id: 4,
    name: 'Camila Fernandes',
    course: 'Design Gráfico & Mídias',
    institution: 'UENP / Unicesumar',
    city: 'Manoel Ribas',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    skills: ['Figma', 'Photoshop', 'Branding', 'UI/UX Design', 'Social Media'],
    isVerifiedStudent: true,
    raNumber: 'UENP-2023-5510',
    linkedin: 'https://linkedin.com/in/camila-design',
    github: 'https://github.com/camila-fernandes-design',
    endorsements: [
      { id: 'end_05', profName: 'Profª. Dra. Vanessa Martins', profEmail: 'vanessa.martins@uenp.edu.br', institution: 'UENP', discipline: 'Identidade Visual & Experiência do Usuário', quote: 'Camila possui um olhar estético apurado e cria identidades visuais memoráveis para o comércio regional.' }
    ]
  },
  {
    id: 5,
    name: 'Rafael Gomes Costa',
    course: 'Engenharia de Software',
    institution: 'UENP',
    city: 'Ivaiporã',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
    isVerifiedStudent: true,
    raNumber: 'UENP-2024-1189',
    linkedin: 'https://linkedin.com/in/rafael-costa-eng',
    github: 'https://github.com/rafael-costa',
    endorsements: [
      { id: 'end_06', profName: 'Prof. Dr. André Luciano', profEmail: 'andre.luciano@uenp.edu.br', institution: 'UENP', discipline: 'Engenharia de Software Avançada', quote: 'Rafael demonstra maturidade técnica rara para um estudante, com projetos de backend robustos e bem documentados.' }
    ]
  }
];

export const SEED_JOBS = [
  {
    id: 101,
    title: 'Desenvolvedor Front-end Junior / Estagiário',
    company: 'ValeTech Soluções Digitais',
    companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150',
    city: 'Ivaiporã',
    type: 'Tempo Integral / Híbrido',
    salary: 'R$ 2.200 - R$ 2.800 / mês',
    workingHours: '08:00 às 18:00 (Segunda a Sexta)',
    recruiterPhone: '5543999887766',
    status: 'Ativa',
    isVerifiedCompany: true,
    cnpj: '12.345.678/0001-90',
    createdAt: '15/08/2026',
    expiresAt: '15/09/2026',
    benefits: ['Vale Transporte', 'Vale Refeição R$ 32/dia', 'Plano de Saúde Unimed', 'Seguro de Vida', 'Horário Flexível'],
    requiredSkills: ['JavaScript', 'HTML5/CSS3', 'React', 'Git'],
    description: 'Buscamos um desenvolvedor front-end entusiasmado para se juntar à equipe da ValeTech. Você irá criar e manter interfaces modernas em React para sistemas web e e-commerce de empresas do comércio do Vale do Ivaí.',
    responsibilities: [
      'Desenvolver componentes reutilizáveis em React e Tailwind CSS',
      'Integrar APIs RESTful fornecidas pela equipe de backend',
      'Garantir responsividade e boa navegação em dispositivos móveis'
    ],
    applicantsCount: 5
  },
  {
    id: 102,
    title: 'Assistente Administrativo & Financeiro',
    company: 'Cooperativa Agropecuária do Vale',
    companyLogo: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=150',
    city: 'Ivaiporã',
    type: 'Tempo Integral',
    salary: 'R$ 2.600 - R$ 3.100 / mês',
    workingHours: '07:30 às 17:30 (Segunda a Sexta)',
    recruiterPhone: '5543999112233',
    status: 'Ativa',
    isVerifiedCompany: true,
    cnpj: '98.765.432/0001-10',
    createdAt: '10/08/2026',
    expiresAt: '10/09/2026',
    benefits: ['Vale Alimentação R$ 600/mês', 'Vale Transporte', 'Plano Odontológico', 'Auxílio Educação'],
    requiredSkills: ['Excel Avançado', 'Gestão Financeira', 'ERP', 'Atendimento ao Cliente'],
    description: 'Vaga para atuação direta no departamento administrativo da cooperativa, realizando conciliação bancária, lançamento de contas e atendimento a cooperados.',
    responsibilities: [
      'Processar lançamentos de contas a pagar e a receber em sistema ERP',
      'Gerar relatórios de fluxo de caixa quinzenais em Excel'
    ],
    applicantsCount: 8
  },
  {
    id: 103,
    title: 'Técnico de Manutenção Elétrica Industrial',
    company: 'Indústria Metalúrgica Ivaiporã',
    companyLogo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=150',
    city: 'São João do Ivaí',
    type: 'Tempo Integral',
    salary: 'R$ 3.200 - R$ 4.000 / mês',
    workingHours: '08:00 às 17:48 (Escala Industrial)',
    recruiterPhone: '5543999443322',
    status: 'Ativa',
    isVerifiedCompany: true,
    cnpj: '45.123.789/0001-55',
    createdAt: '12/08/2026',
    expiresAt: '12/09/2026',
    benefits: ['Refeitório na Empresa', 'Vale Transporte', 'Periculosidade 30%', 'Plano de Saúde'],
    requiredSkills: ['Instalações Elétricas', 'Comandos Elétricos', 'NR-10', 'Automação Industrial'],
    description: 'Atuação na manutenção preventiva e corretiva de máquinas industriais, inversores de frequência e painéis de acionamento.',
    responsibilities: [
      'Executar manutenção elétrica preventiva e emergencial no maquinário da fábrica'
    ],
    applicantsCount: 4
  }
];

export const SEED_SERVICES = [
  {
    id: 201,
    providerName: 'Marcos Eletricista & Automação',
    category: 'Construção & Manutenção',
    city: 'Ivaiporã',
    address: 'Rua Paraná, 450 - Centro, Ivaiporã - PR',
    phone: '5543999887766',
    rating: 4.9,
    reviewsCount: 38,
    badge: 'Verificado Ivaí Conecta',
    description: 'Serviços residenciais e comerciais, padrões Copel, quadros de distribuição e manutenção de emergência 24h.',
    analytics: { views: 412, contacts: 58, closedDeals: 49, nonBuyers: 9, conversionRate: '84.4%' },
    reviews: [
      { id: 'r1', client: 'João Paulo', stars: 5, date: '14/08/2026', comment: 'Excelente profissional! Trocou toda a fiação da minha loja sem sujeira e no prazo.' }
    ],
    forumTopics: []
  }
];

export const SEED_APPLICATIONS = [
  { id: 'app_101', jobId: 101, title: 'Desenvolvedor Front-end Junior / Estagiário', company: 'ValeTech Soluções Digitais', recruiterPhone: '5543999887766', city: 'Ivaiporã', type: 'Tempo Integral / Híbrido', appliedAt: '16/08/2026', matchScore: 92, status: 'Entrevista Agendada', statusClass: 'badge-match-high', currentStageIndex: 2, nextStepNote: 'Entrevista técnica agendada para Quinta-feira às 14:00 via Google Meet.', stages: [{ name: 'Candidatura Enviada', date: '16/08/2026', completed: true }, { name: 'Triagem de Currículo', date: '17/08/2026', completed: true }, { name: 'Entrevista / Teste Técnico', date: '19/08/2026', completed: false, active: true }, { name: 'Proposta / Admissão', date: 'Pendente', completed: false }] }
];

export const DEFAULT_USERS = [
  { id: 1, email: 'aluno@ivaiconecta.com.br', password: '123456', name: 'Lucas Eduardo Silva', city: 'Ivaiporã', role: 'aluno', badge: 'Estudante (IFPR Campus Ivaiporã)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', skills: ['JavaScript', 'HTML5/CSS3', 'React', 'Node.js', 'Git', 'SQL'], isVerifiedStudent: true, raNumber: 'IFPR-2024-8891', linkedin: 'https://linkedin.com/in/lucas-eduardo-dev', github: 'https://github.com/lucas-dev' },
  { id: 201, email: 'freelancer@ivaiconecta.com.br', password: '123456', name: 'Marcos Eletricista & Automação', city: 'Ivaiporã', role: 'freelancer', badge: 'Prestador de Serviço Autônomo', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', skills: ['Instalações Elétricas', 'Automação Industrial', 'Comandos Elétricos'] },
  { id: 2, email: 'candidato@ivaiconecta.com.br', password: '123456', name: 'Beatriz Santos', city: 'Jardim Alegre', role: 'candidato', badge: 'Candidato / Profissional', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250', skills: ['Gestão Financeira', 'Excel Avançado', 'Marketing Digital', 'ERP', 'Atendimento ao Cliente'], linkedin: 'https://linkedin.com/in/beatriz-santos-adm', github: 'https://github.com/beatriz-santos-adm' },
  { id: 101, email: 'empresa@ivaiconecta.com.br', password: '123456', name: 'ValeTech Soluções Digitais', city: 'Ivaiporã', role: 'empresa', badge: 'Empresa / Recrutador', avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150', skills: [], isVerifiedCompany: true, cnpj: '12.345.678/0001-90' },
  { id: 'prof_1', email: 'professor@ivaiconecta.com.br', password: '123456', name: 'Prof. Dr. Ronan Silva', city: 'Ivaiporã', role: 'professor', badge: 'Docente (IFPR Campus Ivaiporã)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', institution: 'IFPR Campus Ivaiporã', discipline: 'Programação de Computadores & Redes', degree: 'Doutor em Ciência da Computação (UFPR)' },
  { id: 'usr_simas', email: 'turbosimas@gmail.com', password: '123', name: 'SimasTurbo', city: 'Ivaiporã', role: 'empresa', badge: 'Empresa / Recrutador', avatar: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=150', isVerifiedCompany: true },
  { id: 'usr_aluno_teste', email: 'emailaluno@gmail.com', password: '123', name: 'AlunoTeste', city: 'Ivaiporã', role: 'aluno', badge: 'Estudante', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
];
