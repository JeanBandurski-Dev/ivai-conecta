// Jobs Service for Ivaí Conecta
import { STORAGE_KEY_JOBS, STORAGE_KEY_APPLICATIONS, SEED_JOBS, SEED_APPLICATIONS, SEED_TALENTS } from '../data/seedData';

export const STORAGE_KEY_JOB_CANDIDATES = 'ivai_conecta_job_candidates_map';

export const SELECTION_STAGES = [
  { id: 'triagem', name: 'Triagem / Novos', color: 'blue', description: 'Candidaturas recebidas recentemente' },
  { id: 'analise', name: 'Em Análise', color: 'amber', description: 'Currículo em avaliação detalhada' },
  { id: 'entrevista', name: 'Entrevista Agendada', color: 'purple', description: 'Entrevista marcada ou em andamento' },
  { id: 'desafio', name: 'Desafio Técnico', color: 'indigo', description: 'Teste prático ou case de negócios' },
  { id: 'aprovado', name: 'Aprovado / Proposta', color: 'emerald', description: 'Candidato selecionado / proposta enviada' },
  { id: 'reprovado', name: 'Banco de Talentos', color: 'slate', description: 'Não aprovado nesta vaga / mantido no banco' },
];

export const INITIAL_JOB_CANDIDATES = {
  101: [
    {
      id: 1,
      name: 'Lucas Eduardo Silva',
      course: 'Análise e Desenvolvimento de Sistemas',
      institution: 'IFPR Campus Ivaiporã',
      period: '5º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      matchScore: 95,
      stage: 'entrevista',
      appliedAt: '16/08/2026',
      phone: '5543999887766',
      email: 'lucas.eduardo@aluno.ifpr.edu.br',
      isVerifiedStudent: true,
      raNumber: 'IFPR-2024-8891',
      rating: 5,
      notes: 'Excelente domínio de React, Tailwind e Git. Apresentou o projeto do Ivaí Conecta no GitHub com código limpo e arquitetura bem estruturada. Parecer pedagógico positivo do Prof. Ronan.',
      interview: {
        date: '2026-08-28',
        time: '14:30',
        format: 'Google Meet',
        link: 'https://meet.google.com/abc-defg-hij',
        notes: 'Entrevista com o Tech Lead'
      },
      skills: ['React', 'JavaScript', 'HTML5/CSS3', 'Git', 'Node.js', 'SQL'],
      endorsements: [
        { profName: 'Prof. Dr. Ronan Silva', institution: 'IFPR Campus Ivaiporã', discipline: 'Programação de Computadores', quote: 'Excelente aluno, destaque na resolução de algoritmos e desenvolvimento prático.' },
        { profName: 'Prof. Dr. Ricardo Oliveira', institution: 'IFPR Campus Ivaiporã', discipline: 'Desenvolvimento Web', quote: 'Profissional exemplar, com ótimo raciocínio lógico e liderança em projetos práticos.' }
      ],
      activity: [
        { date: '16/08/2026 09:30', text: 'Candidatura submetida pelo aluno via Ivaí Conecta' },
        { date: '17/08/2026 14:00', text: 'Currículo triado e aprovado para avaliação' },
        { date: '19/08/2026 16:30', text: 'Entrevista técnica agendada para 28/08 via Google Meet' }
      ]
    },
    {
      id: 2,
      name: 'Juliana Aparecida Melo',
      course: 'Análise e Desenvolvimento de Sistemas',
      institution: 'IFPR Campus Ivaiporã',
      period: '4º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
      matchScore: 89,
      stage: 'desafio',
      appliedAt: '17/08/2026',
      phone: '5543999112233',
      email: 'juliana.melo@aluno.ifpr.edu.br',
      isVerifiedStudent: true,
      raNumber: 'IFPR-2024-3312',
      rating: 4,
      notes: 'Boa desenvoltura em lógica de programação e componentes React. Enviado o desafio prático de consumo de API de produtos.',
      interview: null,
      skills: ['JavaScript', 'React', 'HTML5/CSS3', 'Git', 'Figma'],
      endorsements: [
        { profName: 'Profª. Ma. Amanda Costa', institution: 'IFPR Campus Ivaiporã', discipline: 'Engenharia de Software', quote: 'Aluna muito focada em boas práticas de código e testes automatizados.' }
      ],
      activity: [
        { date: '17/08/2026 11:20', text: 'Candidatura submetida' },
        { date: '18/08/2026 15:45', text: 'Triagem realizada' },
        { date: '21/08/2026 10:00', text: 'Desafio técnico de React enviado por e-mail com prazo de 5 dias' }
      ]
    },
    {
      id: 3,
      name: 'Rafael Gomes Costa',
      course: 'Engenharia de Software',
      institution: 'UENP',
      period: '6º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      matchScore: 86,
      stage: 'analise',
      appliedAt: '18/08/2026',
      phone: '5543999445566',
      email: 'rafael.costa@uenp.edu.br',
      isVerifiedStudent: true,
      raNumber: 'UENP-2024-1189',
      rating: 4,
      notes: 'Forte conhecimento em backend Python/APIs e banco de dados. Demonstra interesse em atuar no front-end em React.',
      interview: null,
      skills: ['Python', 'REST APIs', 'Git', 'JavaScript', 'SQL', 'Docker'],
      endorsements: [
        { profName: 'Prof. Dr. André Luciano', institution: 'UENP', discipline: 'Engenharia de Software Avançada', quote: 'Rafael demonstra maturidade técnica rara para um estudante.' }
      ],
      activity: [
        { date: '18/08/2026 16:15', text: 'Candidatura submetida' },
        { date: '20/08/2026 09:00', text: 'Perfil movido para análise detalhada do Tech Lead' }
      ]
    },
    {
      id: 4,
      name: 'Camila Fernandes',
      course: 'Design Gráfico & UI/UX',
      institution: 'UENP / Unicesumar',
      period: 'Graduada',
      city: 'Manoel Ribas',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      matchScore: 82,
      stage: 'aprovado',
      appliedAt: '15/08/2026',
      phone: '5543999334455',
      email: 'camila.fernandes@gmail.com',
      isVerifiedStudent: true,
      raNumber: 'UENP-2023-5510',
      rating: 5,
      notes: 'Perfeita sintonia entre design de interfaces e front-end Tailwind/HTML. Aprovada na entrevista final, proposta de estágio encaminhada.',
      interview: {
        date: '2026-08-20',
        time: '10:00',
        format: 'Presencial',
        link: 'Av. Brasil, 800 - Ivaiporã',
        notes: 'Entrevista de alinhamento com Diretoria'
      },
      skills: ['Figma', 'UI/UX Design', 'HTML5/CSS3', 'Branding', 'Tailwind'],
      endorsements: [
        { profName: 'Profª. Dra. Vanessa Martins', institution: 'UENP', discipline: 'Identidade Visual & UX/UI', quote: 'Camila possui um olhar estético apurado e cria identidades visuais memoráveis.' }
      ],
      activity: [
        { date: '15/08/2026 08:30', text: 'Candidatura recebida' },
        { date: '17/08/2026 11:00', text: 'Entrevista técnica realizada com sucesso' },
        { date: '22/08/2026 17:00', text: 'Candidata aprovada! Proposta de contratação formalizada' }
      ]
    },
    {
      id: 5,
      name: 'Gabriel Augusto Lima',
      course: 'Sistemas de Informação',
      institution: 'Univale Ivaiporã',
      period: '3º Semestre',
      city: 'Jardim Alegre',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      matchScore: 75,
      stage: 'triagem',
      appliedAt: '22/08/2026',
      phone: '5543999778899',
      email: 'gabriel.lima@univale.edu.br',
      isVerifiedStudent: true,
      raNumber: 'UNIVALE-2025-0912',
      rating: 3,
      notes: 'Estudante motivado, em fase inicial de aprendizado em React.',
      interview: null,
      skills: ['JavaScript', 'HTML5/CSS3', 'MySQL'],
      endorsements: [],
      activity: [
        { date: '22/08/2026 14:10', text: 'Candidatura recebida' }
      ]
    },
    {
      id: 6,
      name: 'Lucas Vinicius Prado',
      course: 'Técnico em Informática',
      institution: 'IFPR Campus Ivaiporã',
      period: 'Concluído',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250',
      matchScore: 64,
      stage: 'reprovado',
      appliedAt: '14/08/2026',
      phone: '5543999221100',
      email: 'lucas.prado@email.com',
      isVerifiedStudent: false,
      raNumber: '',
      rating: 2,
      notes: 'Não possui experiência suficiente com React nesta etapa. Adicionado ao banco de talentos para futuras oportunidades de suporte e WordPress.',
      interview: null,
      skills: ['WordPress', 'HTML5/CSS3', 'Suporte Técnico'],
      endorsements: [],
      activity: [
        { date: '14/08/2026 19:00', text: 'Candidatura recebida' },
        { date: '16/08/2026 10:00', text: 'Feedback construtivo registrado e perfil guardado no banco' }
      ]
    }
  ],
  102: [
    {
      id: 2,
      name: 'Beatriz Santos',
      course: 'Administração',
      institution: 'Univale Ivaiporã',
      period: '7º Semestre',
      city: 'Jardim Alegre',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
      matchScore: 96,
      stage: 'entrevista',
      appliedAt: '12/08/2026',
      phone: '5543999112233',
      email: 'beatriz.santos@univale.edu.br',
      isVerifiedStudent: true,
      raNumber: 'UNIVALE-2023-4122',
      rating: 5,
      notes: 'Destaque acadêmico em Gestão Financeira e Excel Avançado. Experiência sólida em conciliação bancária e sistemas ERP.',
      interview: {
        date: '2026-08-27',
        time: '09:00',
        format: 'Presencial',
        link: 'Sede da Cooperativa - Ivaiporã',
        notes: 'Entrevista com o Gerente Administrativo'
      },
      skills: ['Gestão Financeira', 'Excel Avançado', 'ERP', 'Atendimento ao Cliente', 'Marketing Digital'],
      endorsements: [
        { profName: 'Prof. Carlos Alberto Ramos', institution: 'Univale Ivaiporã', discipline: 'Gestão Financeira e Orçamentária', quote: 'Extremamente dedicada, responsável e proativa na solução de casos de gestão empresarial.' }
      ],
      activity: [
        { date: '12/08/2026 10:00', text: 'Candidatura recebida via Ivaí Conecta' },
        { date: '14/08/2026 15:30', text: 'Entrevista presencial agendada' }
      ]
    },
    {
      id: 7,
      name: 'Larissa de Oliveira',
      course: 'Processos Gerenciais',
      institution: 'Univale Ivaiporã',
      period: '4º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      matchScore: 88,
      stage: 'analise',
      appliedAt: '14/08/2026',
      phone: '5543999665544',
      email: 'larissa.oliveira@univale.edu.br',
      isVerifiedStudent: true,
      raNumber: 'UNIVALE-2024-8821',
      rating: 4,
      notes: 'Boa experiência prévia em emissão de notas fiscais e atendimento.',
      interview: null,
      skills: ['Excel Avançado', 'Gestão Financeira', 'Atendimento ao Cliente'],
      endorsements: [],
      activity: [
        { date: '14/08/2026 14:20', text: 'Candidatura recebida' }
      ]
    }
  ],
  103: [
    {
      id: 3,
      name: 'Matheus Henrique',
      course: 'Técnico em Eletrotécnica',
      institution: 'IFPR Campus Ivaiporã',
      period: 'Concluído',
      city: 'São João do Ivaí',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      matchScore: 98,
      stage: 'entrevista',
      appliedAt: '13/08/2026',
      phone: '5543999443322',
      email: 'matheus.eletro@aluno.ifpr.edu.br',
      isVerifiedStudent: true,
      raNumber: 'IFPR-2024-9912',
      rating: 5,
      notes: 'Certificação NR-10 em dia, domínio pleno de comandos elétricos industriais e automação com CLPs.',
      interview: {
        date: '2026-08-29',
        time: '10:30',
        format: 'Presencial',
        link: 'Fábrica - São João do Ivaí',
        notes: 'Teste prático de bancada e entrevista de segurança'
      },
      skills: ['Instalações Elétricas', 'Automação Industrial', 'Comandos Elétricos', 'AutoCAD', 'NR-10'],
      endorsements: [
        { profName: 'Prof. Eng. Fernando Souza', institution: 'IFPR Campus Ivaiporã', discipline: 'Instalações Elétricas Industriais', quote: 'Profissional técnico com excelente visão de segurança e precisão em diagramas unifilares.' }
      ],
      activity: [
        { date: '13/08/2026 11:00', text: 'Candidatura submetida' },
        { date: '15/08/2026 16:00', text: 'Entrevista na fábrica agendada' }
      ]
    }
  ]
};

export function getJobs(city = 'Todas as Cidades') {
  let jobs = SEED_JOBS;
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.length > 0) jobs = parsed;
      } catch {}
    } else {
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(SEED_JOBS));
    }
  }

  if (!city || city === 'Todas as Cidades') return jobs;
  return jobs.filter(j => j.city.toLowerCase() === city.toLowerCase());
}

export function getJobById(id) {
  const jobs = getJobs('Todas as Cidades');
  return jobs.find(j => j.id === Number(id) || j.id === id);
}

export function addJob(jobData) {
  const jobs = getJobs('Todas as Cidades');
  const newJob = {
    id: Date.now(),
    createdAt: new Date().toLocaleDateString('pt-BR'),
    status: 'Ativa',
    applicantsCount: 0,
    ...jobData,
  };
  const updated = [newJob, ...jobs];
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  return newJob;
}

export function updateJob(jobId, jobData) {
  const jobs = getJobs('Todas as Cidades');
  const updated = jobs.map(j => {
    if (j.id === Number(jobId) || j.id === jobId) {
      return { ...j, ...jobData };
    }
    return j;
  });
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  return updated;
}

export function duplicateJob(jobId) {
  const original = getJobById(jobId);
  if (!original) return null;
  const newJob = {
    ...original,
    id: Date.now(),
    title: `${original.title} (Cópia)`,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    status: 'Ativa',
    applicantsCount: 0
  };
  const jobs = getJobs('Todas as Cidades');
  const updated = [newJob, ...jobs];
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  return newJob;
}

export function deleteJob(jobId) {
  const jobs = getJobs('Todas as Cidades');
  const updated = jobs.filter(j => j.id !== Number(jobId) && j.id !== jobId);
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  return updated;
}

export function updateJobStatus(jobId, action) {
  const jobs = getJobs('Todas as Cidades');
  const updated = jobs.map(j => {
    if (j.id === Number(jobId) || j.id === jobId) {
      if (action === 'close') return { ...j, status: 'Encerrada' };
      if (action === 'extend') return { ...j, status: 'Ativa', expiresAt: '15/10/2026' };
    }
    return j;
  });
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  return updated;
}

// ── Candidates Selection Pipeline per Job ──

export function getAllJobCandidatesMap() {
  if (typeof localStorage === 'undefined') return INITIAL_JOB_CANDIDATES;
  const raw = localStorage.getItem(STORAGE_KEY_JOB_CANDIDATES);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Object.keys(parsed).length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(INITIAL_JOB_CANDIDATES));
  return INITIAL_JOB_CANDIDATES;
}

export function getJobCandidates(jobId) {
  const map = getAllJobCandidatesMap();
  const candidates = map[jobId] || map[Number(jobId)] || [];
  return candidates;
}

export function updateCandidateStage(jobId, candidateId, newStage, note = '') {
  const map = { ...getAllJobCandidatesMap() };
  const currentList = map[jobId] || map[Number(jobId)] || [];
  const stageObj = SELECTION_STAGES.find(s => s.id === newStage);
  const stageName = stageObj ? stageObj.name : newStage;
  const nowStr = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const updatedList = currentList.map(cand => {
    if (cand.id === Number(candidateId) || cand.id === candidateId) {
      const newActivity = [
        ...(cand.activity || []),
        {
          date: nowStr,
          text: `Movido para a etapa: ${stageName}${note ? ` (${note})` : ''}`
        }
      ];
      return {
        ...cand,
        stage: newStage,
        activity: newActivity,
        ...(note ? { notes: cand.notes ? `${cand.notes}\n[${nowStr}] ${note}` : note } : {})
      };
    }
    return cand;
  });

  map[jobId] = updatedList;
  localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  return updatedList;
}

export function updateCandidateData(jobId, candidateId, partialData) {
  const map = { ...getAllJobCandidatesMap() };
  const currentList = map[jobId] || map[Number(jobId)] || [];

  const updatedList = currentList.map(cand => {
    if (cand.id === Number(candidateId) || cand.id === candidateId) {
      return { ...cand, ...partialData };
    }
    return cand;
  });

  map[jobId] = updatedList;
  localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  return updatedList;
}

export function scheduleCandidateInterview(jobId, candidateId, interviewDetails) {
  const map = { ...getAllJobCandidatesMap() };
  const currentList = map[jobId] || map[Number(jobId)] || [];
  const nowStr = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const updatedList = currentList.map(cand => {
    if (cand.id === Number(candidateId) || cand.id === candidateId) {
      const activityText = `Entrevista agendada para ${interviewDetails.date} às ${interviewDetails.time} (${interviewDetails.format})`;
      return {
        ...cand,
        stage: 'entrevista',
        interview: interviewDetails,
        activity: [...(cand.activity || []), { date: nowStr, text: activityText }]
      };
    }
    return cand;
  });

  map[jobId] = updatedList;
  localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  return updatedList;
}

export function getUserApplications() {
  if (typeof localStorage === 'undefined') return SEED_APPLICATIONS;
  const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(SEED_APPLICATIONS));
  return SEED_APPLICATIONS;
}

export function applyToJob(jobId, user) {
  if (!user) {
    return { success: false, message: 'Você precisa estar logado para se candidatar.' };
  }

  // Verification requirement for students
  if (user.role === 'aluno' && !user.isVerifiedStudent) {
    return {
      success: false,
      requiresVerification: true,
      message: '🔒 Para sua segurança e das empresas contratantes, envie sua Declaração de Matrícula nas Configurações para liberar candidaturas!'
    };
  }

  const apps = getUserApplications();
  const existing = apps.find(a => a.jobId === Number(jobId) || a.jobId === jobId);
  if (existing) {
    return { success: false, message: 'Você já se candidatou a esta vaga!' };
  }

  const job = getJobById(jobId);
  const newApp = {
    id: `app_${Date.now()}`,
    jobId: Number(jobId),
    title: job ? job.title : 'Vaga de Emprego',
    company: job ? job.company : 'Empresa do Vale do Ivaí',
    recruiterPhone: job ? job.recruiterPhone : '5543999887766',
    city: job ? job.city : 'Ivaiporã',
    type: job ? job.type : 'Tempo Integral',
    appliedAt: new Date().toLocaleDateString('pt-BR'),
    matchScore: 90,
    status: 'Candidatura Enviada',
    statusClass: 'badge-match-high',
    currentStageIndex: 0,
    nextStepNote: 'Sua candidatura foi recebida com sucesso e aguarda análise do recrutador.',
    stages: [
      { name: 'Candidatura Enviada', date: new Date().toLocaleDateString('pt-BR'), completed: true },
      { name: 'Triagem de Currículo', date: 'Pendente', completed: false, active: true },
      { name: 'Entrevista', date: 'A definir', completed: false },
      { name: 'Proposta / Admissão', date: 'Pendente', completed: false }
    ]
  };

  const updated = [newApp, ...apps];
  localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));

  // Also add candidate to the company job candidate pipeline
  const map = { ...getAllJobCandidatesMap() };
  const currentList = map[jobId] || map[Number(jobId)] || [];
  const newCandEntry = {
    id: user.id || Date.now(),
    name: user.name || 'Candidato Ivaí Conecta',
    course: user.course || 'Estudante / Profissional',
    institution: user.institution || 'Instituição do Vale do Ivaí',
    period: user.period || 'Em andamento',
    city: user.city || 'Ivaiporã',
    avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    matchScore: 92,
    stage: 'triagem',
    appliedAt: new Date().toLocaleDateString('pt-BR'),
    phone: user.phone || '5543999887766',
    email: user.email || '',
    isVerifiedStudent: user.isVerifiedStudent ?? true,
    raNumber: user.raNumber || '',
    rating: 0,
    notes: 'Candidatura recebida através do portal Ivaí Conecta.',
    interview: null,
    skills: user.skills || [],
    endorsements: user.endorsements || [],
    activity: [
      { date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), text: 'Candidatura enviada pelo usuário' }
    ]
  };

  map[jobId] = [newCandEntry, ...currentList];
  localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));

  return { success: true, application: newApp };
}

