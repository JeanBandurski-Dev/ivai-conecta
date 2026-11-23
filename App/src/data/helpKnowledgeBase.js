/**
 * Base de conhecimento contextual e guia rápido do Ivaí Conecta.
 * Fornece atalhos distintos por página e perfil, correspondência local de FAQ
 * e parser de ações clicáveis para o Assistente de Ajuda.
 */

export const ROLE_CONTEXT_META = {
  aluno: {
    key: 'aluno',
    label: 'Aluno / Candidato',
    shortLabel: 'Aluno',
    summary: 'Busca de vagas, match inteligente, validação estudantil, currículo em PDF e candidaturas.'
  },
  candidato: {
    key: 'candidato',
    label: 'Candidato',
    shortLabel: 'Candidato',
    summary: 'Busca de vagas, preenchimento de currículo em PDF e acompanhamento de candidaturas.'
  },
  empresa: {
    key: 'empresa',
    label: 'Empresa / Recrutador',
    shortLabel: 'Empresa',
    summary: 'Publicação de vagas com CBO, triagem de candidatos, Banco de Talentos e validação CNPJ.'
  },
  freelancer: {
    key: 'freelancer',
    label: 'Prestador / Freelancer',
    shortLabel: 'Freelancer',
    summary: 'Divulgação de serviços locais, portfólio profissional e atendimento de pedidos.'
  },
  professor: {
    key: 'professor',
    label: 'Docente / Professor',
    shortLabel: 'Professor',
    summary: 'Conexão acadêmica regional, acompanhamento de oportunidades e orientação de estudantes.'
  },
  admin: {
    key: 'admin',
    label: 'Administrador',
    shortLabel: 'Admin',
    summary: 'Gestão da plataforma, moderação de conteúdo e monitoramento.'
  },
  visitante: {
    key: 'visitante',
    label: 'Visitante',
    shortLabel: 'Visitante',
    summary: 'Exploração pública de vagas e serviços regionais no Vale do Ivaí.'
  }
};

export const PAGE_CONTEXT_META = [
  { prefix: '/gerenciamento-vagas', label: 'Gestão de Vagas' },
  { prefix: '/painel-empresa', label: 'Painel da Empresa' },
  { prefix: '/minhas-vagas', label: 'Minhas Vagas' },
  { prefix: '/vagas', label: 'Vagas & Match' },
  { prefix: '/servicos', label: 'Serviços Locais' },
  { prefix: '/talentos', label: 'Banco de Talentos' },
  { prefix: '/configuracoes', label: 'Configurações' },
  { prefix: '/completar-perfil', label: 'Completar Perfil' },
  { prefix: '/empresa', label: 'Perfil da Empresa' },
  { prefix: '/freelancer', label: 'Perfil Freelancer' },
  { prefix: '/professor', label: 'Perfil Docente' },
  { prefix: '/perfil', label: 'Meu Perfil' },
  { prefix: '/login', label: 'Acesso & Cadastro' },
  { prefix: '/', label: 'Início' }
];

export const HELP_ARTICLES = [
  {
    id: 'curriculo-pdf',
    roles: ['aluno', 'candidato'],
    keywords: ['curriculo', 'currículo', 'pdf', 'baixar', 'exportar', 'resumo', 'sobre mim', 'experiencia', 'formacao'],
    title: 'Como preencher e baixar meu currículo em PDF',
    answer:
      'Para gerar um currículo completo no Ivaí Conecta:\n\n' +
      '1. Acesse **Meu Perfil** e clique em **Editar Perfil**.\n' +
      '2. Preencha sua bio profissional, habilidades, formação acadêmica, experiências e links.\n' +
      '3. Depois de salvar, clique no botão de **Currículo / Exportar PDF** no seu perfil para visualizar e baixar o documento pronto para envio.',
    actions: [{ type: 'navigate', to: '/perfil', label: 'Ir para Meu Perfil' }]
  },
  {
    id: 'validacao-estudantil',
    roles: ['aluno', 'candidato', 'visitante'],
    keywords: ['validar', 'validacao', 'validação', 'estudante', 'estudantil', 'ifpr', 'uenp', 'univale', 'institucional', 'email academico', 'selo'],
    title: 'Validação do vínculo estudantil',
    answer:
      'A validação estudantil confirma seu vínculo com instituições parceiras (como IFPR, UENP, UNIVALE, FATEC e outras autorizadas) usando seu e-mail institucional.\n\n' +
      '• Vá em **Configurações > Validação Estudantil**.\n' +
      '• Informe seu e-mail institucional oficial e siga a confirmação enviada para sua caixa de entrada.\n' +
      '• Contas validadas ganham selo institucional e maior confiança com empresas da região.',
    actions: [{ type: 'navigate', to: '/configuracoes?tab=verification', label: 'Validar E-mail Estudantil' }]
  },
  {
    id: 'vagas-candidatura',
    roles: ['aluno', 'candidato', 'freelancer', 'visitante'],
    keywords: ['vaga', 'vagas', 'candidatar', 'candidatura', 'match', 'emprego', 'estagio', 'estágio', 'acompanhar', 'status', 'etapas'],
    title: 'Como buscar vagas e acompanhar candidaturas',
    answer:
      'Na aba **Vagas & Match**, você pode filtrar oportunidades por cidade do Vale do Ivaí, modalidade e área.\n\n' +
      '• Clique em uma vaga para ver requisitos, empresa e condições.\n' +
      '• Após se candidatar, acompanhe o andamento das etapas em **Minhas Vagas**.\n' +
      '• Dica: manter habilidades e resumo preenchidos no perfil melhora sua compatibilidade (Match).',
    actions: [
      { type: 'navigate', to: '/vagas', label: 'Explorar Vagas' },
      { type: 'navigate', to: '/minhas-vagas', label: 'Minhas Candidaturas', requiresAuth: true }
    ]
  },
  {
    id: 'publicar-vaga-cbo',
    roles: ['empresa'],
    keywords: ['publicar', 'criar vaga', 'nova vaga', 'cbo', 'recrutamento', 'candidatos', 'etapas', 'ats', 'gerenciar'],
    title: 'Publicar vagas, escolher CBO e gerenciar candidatos',
    answer:
      'Como empresa, você gerencia todo o processo seletivo em **Gestão de Vagas**:\n\n' +
      '• Clique em **Publicar Vaga** e pesquise o cargo pela tabela **CBO** (Classificação Brasileira de Ocupações) para padronizar o título.\n' +
      '• Descreva responsabilidades, requisitos claros, cidade e benefícios.\n' +
      '• No painel de gerenciamento, acompanhe candidatos por etapa, visualize currículos e inicie contato pelo chat.',
    actions: [{ type: 'navigate', to: '/gerenciamento-vagas', label: 'Abrir Gestão de Vagas' }]
  },
  {
    id: 'validacao-empresa-cnpj',
    roles: ['empresa'],
    keywords: ['cnpj', 'empresa', 'validar empresa', 'selo empresa', 'verificacao empresa', 'verificação'],
    title: 'Validação de empresa e CNPJ',
    answer:
      'Empresas podem validar os dados cadastrais e CNPJ para aumentar a credibilidade das vagas publicadas.\n\n' +
      '• Acesse **Configurações** na aba da empresa para enviar ou revisar os dados de verificação.\n' +
      '• Mantenha também o **Perfil da Empresa** atualizado com descrição, setor e cidade de atuação.',
    actions: [
      { type: 'navigate', to: '/configuracoes?tab=company', label: 'Validação da Empresa' },
      { type: 'navigate', to: '/empresa', label: 'Perfil da Empresa' }
    ]
  },
  {
    id: 'banco-talentos',
    roles: ['empresa'],
    keywords: ['talentos', 'banco de talentos', 'procurar candidato', 'curriculos', 'recrutar', 'filtrar talentos'],
    title: 'Como usar o Banco de Talentos',
    answer:
      'O **Banco de Talentos** é exclusivo para contas de Empresa.\n\n' +
      '• Filtre profissionais e estudantes por cidade, curso/área e habilidades.\n' +
      '• Abra o perfil completo do talento para analisar formação e experiências, favoritar perfis ou iniciar uma conversa direta pelo chat.',
    actions: [{ type: 'navigate', to: '/talentos', label: 'Abrir Banco de Talentos' }]
  },
  {
    id: 'servicos-freelancer',
    roles: ['freelancer', 'aluno', 'empresa', 'visitante'],
    keywords: ['servico', 'serviço', 'servicos', 'serviços', 'freelancer', 'prestador', 'orcamento', 'orçamento', 'solicitar', 'divulgar', 'avaliar', 'pedido'],
    title: 'Serviços Locais e atuação como Freelancer',
    answer:
      'Em **Serviços Locais**, profissionais da região divulgam serviços (TI, design, aulas, manutenção, consultoria e mais).\n\n' +
      '• **Para contratar:** escolha um serviço, clique para solicitar atendimento/orçamento e alinhe detalhes pelo chat.\n' +
      '• **Para prestar serviços:** com perfil Freelancer, publique seu serviço com descrição objetiva, cidade atendida e faixa de valor.',
    actions: [
      { type: 'navigate', to: '/servicos', label: 'Ver Serviços Locais' },
      { type: 'navigate', to: '/freelancer', label: 'Perfil Freelancer', requiresAuth: true }
    ]
  },
  {
    id: 'chat-mensagens',
    roles: ['aluno', 'candidato', 'empresa', 'freelancer', 'professor', 'admin'],
    keywords: ['chat', 'mensagem', 'mensagens', 'conversar', 'falar', 'contato', 'moderacao chat'],
    title: 'Chat em tempo real na plataforma',
    answer:
      'Você pode conversar diretamente com empresas, candidatos ou prestadores de serviço pelo **Chat** (ícone de balão de mensagem no topo da tela).\n\n' +
      '• Todas as mensagens seguem regras de respeito e moderação automática.\n' +
      '• Nunca compartilhe senhas, códigos de verificação ou dados bancários pelo chat.',
    actions: [{ type: 'open_chat', label: 'Abrir Chat Agora', requiresAuth: true }]
  },
  {
    id: 'excluir-conta',
    roles: ['aluno', 'candidato', 'empresa', 'freelancer', 'professor', 'admin'],
    keywords: ['apagar conta', 'excluir conta', 'deletar conta', 'remover conta', 'encerrar conta', 'apagar minha conta', 'excluir minha conta', 'zona de perigo'],
    title: 'Como apagar / excluir sua conta definitivamente',
    answer:
      'Para excluir sua conta do Ivaí Conecta (ação irreversível pela LGPD):\n\n' +
      '1. Acesse **Configurações** no menu do seu perfil.\n' +
      '2. Entre na aba **Conta e Segurança**.\n' +
      '3. Role até **Zona de Perigo: Exclusão Permanente da Conta** e clique em **Excluir Minha Conta Definitivamente**.\n' +
      '4. Confirme sua senha (ou digite **EXCLUIR** se entrou com Google) para remover seus dados pessoais, perfil e candidaturas.',
    actions: [{ type: 'navigate', to: '/configuracoes?tab=account', label: 'Ir para Conta e Segurança', requiresAuth: true }]
  },
  {
    id: 'conta-privacidade-notificacoes',
    roles: ['aluno', 'candidato', 'empresa', 'freelancer', 'professor', 'admin', 'visitante'],
    keywords: ['senha', 'privacidade', 'notificacao', 'notificações', 'configuracoes', 'configurações', 'perfil publico', 'lgpd', 'dados', 'links'],
    title: 'Conta, privacidade e notificações',
    answer:
      'Em **Configurações**, você controla links profissionais, preferências de notificação, visibilidade/privacidade do perfil e segurança da conta.\n\n' +
      '• Caso tenha esquecido a senha, use a opção **Esqueci minha senha** na tela de Login para receber o link de redefinição no seu e-mail.',
    actions: [{ type: 'navigate', to: '/configuracoes', label: 'Ir para Configurações', requiresAuth: true }]
  },
  {
    id: 'cadastro-acesso',
    roles: ['visitante', 'aluno', 'candidato', 'empresa', 'freelancer', 'professor'],
    keywords: ['cadastro', 'cadastrar', 'entrar', 'login', 'google', 'criar conta', 'papel', 'perfil'],
    title: 'Como criar conta e escolher seu perfil',
    answer:
      'No Ivaí Conecta você pode entrar com e-mail e senha ou conta Google.\n\n' +
      '• Ao criar a conta, escolha o perfil ideal: **Aluno/Candidato**, **Empresa**, **Freelancer** ou **Professor**.\n' +
      '• Depois do primeiro acesso, finalize os dados em **Completar Perfil** para desbloquear candidaturas, vagas e chat.',
    actions: [{ type: 'navigate', to: '/login', label: 'Acessar / Criar Conta' }]
  }
];

export function normalizeRoleKey(role) {
  const value = String(role || '').toLowerCase().trim();
  if (!value) return 'visitante';
  if (value === 'student' || value === 'estudante') return 'aluno';
  if (value === 'company' || value === 'recrutador') return 'empresa';
  if (value === 'prestador' || value === 'talent') return 'freelancer';
  if (value === 'docente' || value === 'teacher') return 'professor';
  if (value === 'administrador') return 'admin';
  if (ROLE_CONTEXT_META[value]) return value;
  return 'candidato';
}

export function getPageLabel(pathname = '/') {
  const cleanPath = String(pathname || '/');
  const found = PAGE_CONTEXT_META.find((item) =>
    item.prefix === '/' ? cleanPath === '/' : cleanPath.startsWith(item.prefix)
  );
  return found ? found.label : 'Plataforma';
}

/**
 * Gera sugestões de ajuda específicas para a rota atual, adaptando detalhes ao papel do usuário.
 */
export function getContextualHelpTopics({ pathname = '/', userRole = 'visitante', isAuthenticated = false } = {}) {
  const role = normalizeRoleKey(userRole);
  const path = String(pathname || '/');

  if (path.startsWith('/login') || path.startsWith('/completar-perfil')) {
    return [
      {
        id: 'login-cadastro',
        label: 'Como criar conta e escolher perfil?',
        question: 'Como faço para criar uma conta e escolher meu perfil?',
        articleId: 'cadastro-acesso'
      },
      {
        id: 'login-validacao',
        label: 'Como funciona a validação estudantil?',
        question: 'Como funciona a validação de e-mail estudantil?',
        articleId: 'validacao-estudantil'
      },
      {
        id: 'login-ai-duvida',
        label: 'IA: Qual perfil devo escolher?',
        question: 'Qual a diferença entre os perfis Aluno, Freelancer, Empresa e Professor no Ivaí Conecta?',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/vagas')) {
    if (role === 'empresa') {
      return [
        {
          id: 'vagas-emp-publicar',
          label: 'Como publicar uma nova vaga?',
          question: 'Como publicar uma vaga e escolher o CBO correto?',
          articleId: 'publicar-vaga-cbo'
        },
        {
          id: 'vagas-emp-talentos',
          label: 'Buscar candidatos no Banco de Talentos',
          question: 'Como buscar e contatar candidatos no Banco de Talentos?',
          articleId: 'banco-talentos'
        },
        {
          id: 'vagas-emp-ai',
          label: 'IA: Escrever descrição de vaga',
          question: 'Me ajude a escrever uma descrição clara e atrativa para publicar uma vaga no Ivaí Conecta.',
          preferAI: true
        }
      ];
    }

    return [
      {
        id: 'vagas-match',
        label: 'Como funciona o Match e candidatura?',
        question: 'Como buscar vagas e acompanhar minhas candidaturas?',
        articleId: 'vagas-candidatura'
      },
      {
        id: 'vagas-curriculo',
        label: 'Como melhorar meu currículo em PDF?',
        question: 'Como preencher e baixar meu currículo em PDF?',
        articleId: 'curriculo-pdf'
      },
      {
        id: 'vagas-ai-entrevista',
        label: 'IA: Dicas para me destacar na vaga',
        question: 'Quais dicas práticas para me destacar ao me candidatar a uma vaga na minha região?',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/minhas-vagas')) {
    return [
      {
        id: 'mv-status',
        label: 'Como acompanhar etapas da vaga?',
        question: 'Como buscar vagas e acompanhar minhas candidaturas?',
        articleId: 'vagas-candidatura'
      },
      {
        id: 'mv-chat',
        label: 'Como falar com a empresa no chat?',
        question: 'Como usar o chat em tempo real da plataforma?',
        articleId: 'chat-mensagens'
      },
      {
        id: 'mv-ai-prep',
        label: 'IA: Preparação para entrevista',
        question: 'Me dê um roteiro rápido para me preparar bem para uma entrevista de estágio ou emprego.',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/gerenciamento-vagas') || path.startsWith('/painel-empresa')) {
    return [
      {
        id: 'gv-cbo',
        label: 'Publicar vaga e escolher CBO',
        question: 'Como publicar uma vaga e escolher o CBO correto?',
        articleId: 'publicar-vaga-cbo'
      },
      {
        id: 'gv-talentos',
        label: 'Como usar o Banco de Talentos?',
        question: 'Como buscar e contatar candidatos no Banco de Talentos?',
        articleId: 'banco-talentos'
      },
      {
        id: 'gv-cnpj',
        label: 'Como validar CNPJ da empresa?',
        question: 'Como validar o CNPJ da minha empresa?',
        articleId: 'validacao-empresa-cnpj'
      },
      {
        id: 'gv-ai-vaga',
        label: 'IA: Gerar texto de vaga',
        question: 'Me ajude a estruturar uma vaga com responsabilidades, requisitos e benefícios claros.',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/talentos')) {
    return [
      {
        id: 'tal-buscar',
        label: 'Filtrar e favoritar talentos',
        question: 'Como buscar e contatar candidatos no Banco de Talentos?',
        articleId: 'banco-talentos'
      },
      {
        id: 'tal-chat',
        label: 'Como chamar talento no chat?',
        question: 'Como usar o chat em tempo real da plataforma?',
        articleId: 'chat-mensagens'
      },
      {
        id: 'tal-ai-abordagem',
        label: 'IA: Mensagem para abordar candidato',
        question: 'Escreva um modelo curto e profissional de primeira mensagem no chat para convidar um talento para entrevista.',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/servicos')) {
    return [
      {
        id: 'srv-guia',
        label: 'Como contratar ou prestar serviços?',
        question: 'Como divulgar ou solicitar um serviço no Ivaí Conecta?',
        articleId: 'servicos-freelancer'
      },
      {
        id: 'srv-chat',
        label: 'Combinar orçamento pelo chat',
        question: 'Como usar o chat em tempo real da plataforma?',
        articleId: 'chat-mensagens'
      },
      {
        id: 'srv-ai-anuncio',
        label: 'IA: Melhorar descrição do serviço',
        question: 'Me dê dicas práticas para criar um título e descrição atrativos para meu serviço freelancer.',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/configuracoes')) {
    const configTopics = [
      {
        id: 'cfg-privacidade',
        label: 'Privacidade e notificações',
        question: 'Onde altero configurações de privacidade e notificações?',
        articleId: 'conta-privacidade-notificacoes'
      },
      {
        id: 'cfg-excluir',
        label: 'Como apagar minha conta?',
        question: 'Como faço para apagar minha conta no site?',
        articleId: 'excluir-conta'
      }
    ];
    if (role === 'aluno') {
      configTopics.unshift({
        id: 'cfg-validacao',
        label: 'Validar e-mail institucional',
        question: 'Como validar meu e-mail de estudante?',
        articleId: 'validacao-estudantil'
      });
    } else if (role === 'empresa') {
      configTopics.unshift({
        id: 'cfg-cnpj',
        label: 'Validar CNPJ da empresa',
        question: 'Como validar o CNPJ da minha empresa?',
        articleId: 'validacao-empresa-cnpj'
      });
    }
    return configTopics.slice(0, 4);
  }

  if (path.startsWith('/perfil')) {
    return [
      {
        id: 'prf-pdf',
        label: 'Baixar meu currículo em PDF',
        question: 'Como preencher e baixar meu currículo em PDF?',
        articleId: 'curriculo-pdf'
      },
      {
        id: 'prf-validacao',
        label: 'Validar e-mail estudantil',
        question: 'Como validar meu e-mail de estudante?',
        articleId: 'validacao-estudantil'
      },
      {
        id: 'prf-ai-bio',
        label: 'IA: Melhorar meu "Sobre mim"',
        question: 'Me ajude a escrever um resumo profissional ("Sobre mim") forte para meu currículo.',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/freelancer')) {
    return [
      {
        id: 'frl-servicos',
        label: 'Divulgar serviços no catálogo',
        question: 'Como divulgar ou solicitar um serviço no Ivaí Conecta?',
        articleId: 'servicos-freelancer'
      },
      {
        id: 'frl-config',
        label: 'Privacidade e links do perfil',
        question: 'Onde altero configurações de privacidade e notificações?',
        articleId: 'conta-privacidade-notificacoes'
      },
      {
        id: 'frl-ai-bio',
        label: 'IA: Melhorar bio de freelancer',
        question: 'Me ajude a escrever uma apresentação profissional atrativa para meu perfil de freelancer.',
        preferAI: true
      }
    ];
  }

  if (path.startsWith('/empresa')) {
    return [
      {
        id: 'emp-cnpj',
        label: 'Validar empresa e CNPJ',
        question: 'Como validar o CNPJ da minha empresa?',
        articleId: 'validacao-empresa-cnpj'
      },
      {
        id: 'emp-vagas',
        label: 'Publicar vaga e escolher CBO',
        question: 'Como publicar uma vaga e escolher o CBO correto?',
        articleId: 'publicar-vaga-cbo'
      },
      {
        id: 'emp-ai-sobre',
        label: 'IA: Apresentação da empresa',
        question: 'Me ajude a escrever uma descrição institucional atrativa para minha empresa atrair talentos.',
        preferAI: true
      }
    ];
  }

  // Dashboard / Início ("/") ou demais rotas
  if (role === 'empresa') {
    return [
      {
        id: 'home-emp-vaga',
        label: 'Publicar vaga e escolher CBO',
        question: 'Como publicar uma vaga e escolher o CBO correto?',
        articleId: 'publicar-vaga-cbo'
      },
      {
        id: 'home-emp-talentos',
        label: 'Usar o Banco de Talentos',
        question: 'Como buscar e contatar candidatos no Banco de Talentos?',
        articleId: 'banco-talentos'
      },
      {
        id: 'home-emp-ai',
        label: 'IA: Criar descrição de vaga',
        question: 'Me ajude a escrever uma boa descrição de vaga com requisitos claros.',
        preferAI: true
      }
    ];
  }

  if (role === 'freelancer') {
    return [
      {
        id: 'home-frl-servicos',
        label: 'Publicar e gerenciar serviços',
        question: 'Como divulgar ou solicitar um serviço no Ivaí Conecta?',
        articleId: 'servicos-freelancer'
      },
      {
        id: 'home-frl-vagas',
        label: 'Explorar Vagas & Match',
        question: 'Como buscar vagas e acompanhar minhas candidaturas?',
        articleId: 'vagas-candidatura'
      },
      {
        id: 'home-frl-ai',
        label: 'IA: Destacar meus serviços',
        question: 'Como tornar meus serviços mais atrativos para clientes locais do Vale do Ivaí?',
        preferAI: true
      }
    ];
  }

  const homeTopics = [
    {
      id: 'home-vagas',
      label: 'Buscar vagas e candidaturas',
      question: 'Como buscar vagas e acompanhar minhas candidaturas?',
      articleId: 'vagas-candidatura'
    },
    {
      id: 'home-curriculo',
      label: 'Montar e baixar currículo PDF',
      question: 'Como preencher e baixar meu currículo em PDF?',
      articleId: 'curriculo-pdf'
    },
    {
      id: 'home-servicos',
      label: 'Como funcionam os Serviços?',
      question: 'Como divulgar ou solicitar um serviço no Ivaí Conecta?',
      articleId: 'servicos-freelancer'
    }
  ];

  if (!isAuthenticated) {
    homeTopics.push({
      id: 'home-cadastro',
      label: 'Como criar minha conta?',
      question: 'Como faço para criar uma conta e escolher meu perfil?',
      articleId: 'cadastro-acesso'
    });
  } else {
    homeTopics.push({
      id: 'home-ai-dica',
      label: 'IA: Dica para melhorar perfil',
      question: 'Quais informações mais chamam atenção das empresas no meu perfil do Ivaí Conecta?',
      preferAI: true
    });
  }

  return homeTopics.slice(0, 4);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getArticleById(articleId, { isAuthenticated = false } = {}) {
  const article = HELP_ARTICLES.find((item) => item.id === articleId);
  if (!article) return null;
  return {
    ...article,
    actions: (article.actions || []).filter((action) => isAuthenticated || !action.requiresAuth)
  };
}

export function findLocalHelpMatch(queryText, { userRole = 'visitante', isAuthenticated = false } = {}) {
  const normalizedQuery = normalizeText(queryText);
  if (!normalizedQuery) return null;

  const role = normalizeRoleKey(userRole);
  const tokens = normalizedQuery.split(' ').filter((t) => t.length >= 2);
  let bestArticle = null;
  let bestScore = 0;

  for (const article of HELP_ARTICLES) {
    let score = 0;
    for (const kw of article.keywords) {
      const normalizedKw = normalizeText(kw);
      if (normalizedQuery.includes(normalizedKw)) {
        score += normalizedKw.includes(' ') ? 5 : 3;
      } else if (tokens.some((token) => normalizedKw.includes(token) && token.length >= 4)) {
        score += 1;
      }
    }

    if (article.roles.includes(role)) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestArticle = article;
    }
  }

  if (!bestArticle || bestScore < 3) {
    return null;
  }

  return {
    ...bestArticle,
    actions: (bestArticle.actions || []).filter((action) => isAuthenticated || !action.requiresAuth)
  };
}

const ALLOWED_ACTION_PREFIXES = [
  '/',
  '/vagas',
  '/servicos',
  '/talentos',
  '/perfil',
  '/empresa',
  '/professor',
  '/freelancer',
  '/minhas-vagas',
  '/gerenciamento-vagas',
  '/painel-empresa',
  '/configuracoes',
  '/completar-perfil',
  '/login'
];

function isSafeInternalRoute(route) {
  if (typeof route !== 'string') return false;
  const trimmed = route.trim();
  if (!trimmed.startsWith('/')) return false;
  const basePath = trimmed.split('?')[0];
  return ALLOWED_ACTION_PREFIXES.includes(basePath);
}

/**
 * Extrai marcadores de ação da resposta da IA no formato:
 * [[ACAO:/rota|Texto do botão]] ou [[CHAT|Abrir Chat]]
 */
export function parseHelpResponseActions(rawText, { isAuthenticated = false } = {}) {
  const text = String(rawText || '');
  const actions = [];
  const seenKeys = new Set();

  const cleanedText = text
    .replace(/\[\[(?:ACAO:([^|\]]+)\|([^\]]+)|CHAT\|([^\]]+))\]\]/g, (_, rawRoute, rawActionLabel, rawChatLabel) => {
      if (rawChatLabel !== undefined) {
        const label = String(rawChatLabel || 'Abrir Chat').trim().slice(0, 40);
        if (isAuthenticated && !seenKeys.has('open_chat')) {
          seenKeys.add('open_chat');
          actions.push({ type: 'open_chat', label });
        }
        return '';
      }

      const to = String(rawRoute || '').trim();
      const label = String(rawActionLabel || '').trim().slice(0, 40);
      if (isSafeInternalRoute(to) && label) {
        const key = `nav:${to}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          actions.push({ type: 'navigate', to, label });
        }
      }
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    cleanText: cleanedText,
    actions: actions.slice(0, 3)
  };
}
