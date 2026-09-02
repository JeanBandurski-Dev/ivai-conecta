// Jobs Service for Ivaí Conecta (Firestore + Local Storage Sync)
import { db } from '../lib/firebase.js';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { STORAGE_KEY_JOBS, STORAGE_KEY_APPLICATIONS, SEED_JOBS, SEED_APPLICATIONS } from '../data/seedData.js';

/**
 * Escuta vagas em tempo real via Firestore onSnapshot
 */
export function subscribeToJobs(city = 'Todas as Cidades', callback) {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remoteJobs = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
        const localJobs = getJobs(city);
        const merged = [...remoteJobs, ...localJobs.filter(j => !remoteJobs.some(rj => String(rj.id) === String(j.id)))];
        callback(merged);
      } else {
        callback(getJobs(city));
      }
    }, (error) => {
      console.warn('[Firestore Jobs Listener] Offline fallback:', error.message);
      callback(getJobs(city));
    });
  } catch (error) {
    console.warn('[Firestore Jobs Listener] Falha ao assinar vagas:', error.message);
    callback(getJobs(city));
    return () => {};
  }
}

/**
 * Escuta candidaturas em tempo real via Firestore onSnapshot
 */
export function subscribeToApplications(candidateUid, callback) {
  try {
    const appsRef = collection(db, 'applications');
    const q = candidateUid ? query(appsRef, where('candidateUid', '==', candidateUid)) : appsRef;
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remoteApps = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
        const localApps = getUserApplications();
        const merged = [...remoteApps, ...localApps.filter(a => !remoteApps.some(ra => String(ra.id) === String(a.id)))];
        callback(merged);
      } else {
        callback(getUserApplications());
      }
    }, (error) => {
      console.warn('[Firestore Apps Listener] Fallback:', error.message);
      callback(getUserApplications());
    });
  } catch (error) {
    console.warn('[Firestore Apps Listener] Falha ao assinar candidaturas:', error.message);
    callback(getUserApplications());
    return () => {};
  }
}

/**
 * Busca vagas (sincronamente usando cache/seedData e atualizando Firestore em background)
 */
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

  // Sincronização assíncrona com Cloud Firestore
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;
    getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        const remoteJobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const merged = [...remoteJobs, ...jobs.filter(j => !remoteJobs.some(rj => String(rj.id) === String(j.id)))];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(merged));
        }
      }
    }).catch(err => console.warn('[Firestore] getJobs offline fallback:', err.message));
  } catch {}

  if (!city || city === 'Todas as Cidades') return jobs;
  return jobs.filter(j => j.city.toLowerCase() === city.toLowerCase());
}

/**
 * Busca vagas diretamente do Firestore via Promise (assíncrono)
 */
export async function getJobsAsync(city = 'Todas as Cidades') {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
    }
  } catch (error) {
    console.warn('[Firestore] Erro ao buscar vagas do Firestore:', error.message);
  }
  return getJobs(city);
}

export function getJobById(id) {
  const jobs = getJobs('Todas as Cidades');
  return jobs.find(j => j.id === Number(id) || j.id === id || String(j.id) === String(id));
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
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }

  // Sincronização imediata no Firestore
  try {
    addDoc(collection(db, 'jobs'), newJob)
      .then(docRef => { newJob.firestoreId = docRef.id; })
      .catch(err => console.warn('[Firestore] Sync erro ao cadastrar vaga:', err.message));
  } catch {}

  return newJob;
}

export function updateJobStatus(jobId, action) {
  const jobs = getJobs('Todas as Cidades');
  const updated = jobs.map(j => {
    if (j.id === Number(jobId) || j.id === jobId || String(j.id) === String(jobId)) {
      const newStatus = action === 'close' ? 'Encerrada' : 'Ativa';
      const updatedJob = { ...j, status: newStatus };
      if (j.firestoreId) {
        try {
          updateDoc(doc(db, 'jobs', j.firestoreId), { status: newStatus }).catch(() => {});
        } catch {}
      }
      return updatedJob;
    }
    return j;
  });
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }
  return updated;
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

  if (user.role === 'aluno' && !user.isVerifiedStudent) {
    return {
      success: false,
      requiresVerification: true,
      message: '🔒 Para sua segurança e das empresas contratantes, envie sua Declaração de Matrícula nas Configurações para liberar candidaturas!'
    };
  }

  const apps = getUserApplications();
  const existing = apps.find(a => a.jobId === Number(jobId) || a.jobId === jobId || String(a.jobId) === String(jobId));
  if (existing) {
    return { success: false, message: 'Você já se candidatou a esta vaga!' };
  }

  const job = getJobById(jobId);
  const newApp = {
    id: `app_${Date.now()}`,
    jobId: Number(jobId) || jobId,
    candidateUid: user.uid || user.id || 'usr_guest',
    candidateName: user.name || 'Candidato Ivaí Conecta',
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
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));
  }

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
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }

  // Enviar a candidatura ao Firestore
  try {
    addDoc(collection(db, 'applications'), newApp).catch(err => console.warn('[Firestore] Erro candidatar vaga:', err.message));
  } catch {}

  return { success: true, application: newApp };
}

export const STORAGE_KEY_JOB_CANDIDATES = 'ivai_conecta_job_candidates_map';
export const STORAGE_KEY_COMPANY_CUSTOM_STAGES = 'ivai_conecta_custom_stages';

export const SELECTION_STAGES = [
  { id: 'triagem', name: 'Triagem / Novos', color: 'blue', description: 'Candidaturas recebidas recentemente' },
  { id: 'analise', name: 'Em Análise', color: 'amber', description: 'Currículo em avaliação detalhada' },
  { id: 'entrevista', name: 'Entrevista Agendada', color: 'purple', description: 'Entrevista marcada ou em andamento' },
  { id: 'desafio', name: 'Desafio Técnico', color: 'indigo', description: 'Teste prático ou case de negócios' },
  { id: 'aprovado', name: 'Aprovados', color: 'emerald', description: 'Candidatos que passaram na entrevista' },
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
        { date: '16/08/2026 14:30', text: 'Candidatura submetida via Ivaí Conecta' },
        { date: '17/08/2026 10:15', text: 'Triagem realizada pelo RH' },
        { date: '19/08/2026 16:00', text: 'Entrevista técnica agendada com o Tech Lead via Google Meet' }
      ]
    },
    {
      id: 2,
      name: 'Juliana Aparecida Melo',
      course: 'Análise e Desenvolvimento de Sistemas',
      institution: 'IFPR Campus Ivaiporã',
      period: '3º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
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
    },
    {
      id: 7,
      name: 'Mariana Azevedo',
      course: 'Sistemas de Informação',
      institution: 'Univale Ivaiporã',
      period: '6º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
      matchScore: 92,
      stage: 'triagem',
      appliedAt: '25/08/2026',
      phone: '5543999998888',
      email: 'mariana.azevedo@univale.edu.br',
      isVerifiedStudent: true,
      raNumber: 'UNIVALE-2024-1122',
      rating: 4,
      notes: 'Boa bagagem em desenvolvimento front-end com Vue e React. Participativa.',
      interview: null,
      skills: ['Vue.js', 'React', 'Git', 'CSS3'],
      endorsements: [],
      activity: [
        { date: '25/08/2026 09:30', text: 'Candidatura submetida via Ivaí Conecta' }
      ]
    },
    {
      id: 8,
      name: 'Fernando Rocha',
      course: 'Técnico em Informática',
      institution: 'IFPR Campus Ivaiporã',
      period: '4º Semestre',
      city: 'Arapuã',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      matchScore: 78,
      stage: 'analise',
      appliedAt: '24/08/2026',
      phone: '5543999776655',
      email: 'fernando.rocha@aluno.ifpr.edu.br',
      isVerifiedStudent: true,
      raNumber: 'IFPR-2025-0044',
      rating: 3,
      notes: 'Interesse por DevOps e infraestrutura, mas quer focar em React no momento.',
      interview: null,
      skills: ['Linux', 'Redes', 'JavaScript', 'HTML5'],
      endorsements: [],
      activity: [
        { date: '24/08/2026 14:00', text: 'Candidatura submetida via Ivaí Conecta' },
        { date: '26/08/2026 10:15', text: 'Triagem realizada pelo RH' }
      ]
    },
    {
      id: 9,
      name: 'Patrícia Souza',
      course: 'Análise e Desenvolvimento de Sistemas',
      institution: 'IFPR Campus Ivaiporã',
      period: '2º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      matchScore: 85,
      stage: 'triagem',
      appliedAt: '27/08/2026',
      phone: '5543999223344',
      email: 'patricia.souza@aluno.ifpr.edu.br',
      isVerifiedStudent: true,
      raNumber: 'IFPR-2026-0123',
      rating: 4,
      notes: 'Iniciante muito focada, projetos no GitHub mostram boa evolução.',
      interview: null,
      skills: ['JavaScript', 'HTML', 'CSS', 'Figma'],
      endorsements: [],
      activity: [
        { date: '27/08/2026 11:20', text: 'Candidatura submetida via Ivaí Conecta' }
      ]
    },
    {
      id: 10,
      name: 'Thiago Mendes',
      course: 'Engenharia de Software',
      institution: 'UENP',
      period: '8º Semestre',
      city: 'Ivaiporã',
      avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=250',
      matchScore: 94,
      stage: 'entrevista',
      appliedAt: '21/08/2026',
      phone: '5543999881122',
      email: 'thiago.mendes@uenp.edu.br',
      isVerifiedStudent: true,
      raNumber: 'UENP-2022-0998',
      rating: 5,
      notes: 'Excelente currículo. Tem experiência prévia como freelancer.',
      interview: {
        date: '2026-08-30',
        time: '15:00',
        format: 'Google Meet',
        link: 'https://meet.google.com/xyz-abcd-efg',
        notes: 'Entrevista com o CTO'
      },
      skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      endorsements: [
        { profName: 'Prof. Dr. Ricardo Silva', institution: 'UENP', discipline: 'Projeto Integrador', quote: 'Líder técnico nato. Excelente comunicação e resolução de problemas complexos.' }
      ],
      activity: [
        { date: '21/08/2026 09:00', text: 'Candidatura submetida via Ivaí Conecta' },
        { date: '23/08/2026 14:00', text: 'Entrevista técnica agendada' }
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      matchScore: 84,
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

export function getAllJobCandidatesMap() {
  if (typeof localStorage === 'undefined') return INITIAL_JOB_CANDIDATES;
  const raw = localStorage.getItem(STORAGE_KEY_JOB_CANDIDATES);
  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {}
  }
  
  if (parsed && typeof parsed === 'object') {
    let updated = false;
    Object.keys(INITIAL_JOB_CANDIDATES).forEach(jobId => {
      if (!parsed[jobId]) {
        parsed[jobId] = INITIAL_JOB_CANDIDATES[jobId];
        updated = true;
      } else {
        INITIAL_JOB_CANDIDATES[jobId].forEach(initialCand => {
          if (!parsed[jobId].find(c => c.id === initialCand.id)) {
            parsed[jobId].push(initialCand);
            updated = true;
          }
        });
      }
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(parsed));
    }
    return parsed;
  }

  localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(INITIAL_JOB_CANDIDATES));
  return INITIAL_JOB_CANDIDATES;
}

export function getJobCandidates(jobId) {
  const map = getAllJobCandidatesMap();
  const list = map[jobId] || map[Number(jobId)] || [];
  if (list.length === 0 && INITIAL_JOB_CANDIDATES[jobId]) {
    return INITIAL_JOB_CANDIDATES[jobId];
  }
  return list;
}

export function updateCandidateStage(jobId, candidateId, newStage) {
  const map = { ...getAllJobCandidatesMap() };
  const currentList = map[jobId] || map[Number(jobId)] || INITIAL_JOB_CANDIDATES[jobId] || [];
  
  const stageNameMap = {
    triagem: 'Triagem / Novos',
    analise: 'Em Análise',
    entrevista: 'Entrevista Agendada',
    desafio: 'Desafio Técnico',
    aprovado: 'Aprovados',
    reprovado: 'Banco de Talentos'
  };

  const updatedList = currentList.map(cand => {
    if (cand.id === candidateId || String(cand.id) === String(candidateId)) {
      const newActivity = [
        ...(cand.activity || []),
        { date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), text: `Candidato movido para a etapa: ${stageNameMap[newStage] || newStage}` }
      ];
      return { ...cand, stage: newStage, activity: newActivity };
    }
    return cand;
  });

  map[jobId] = updatedList;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return updatedList;
}

export function reorderCandidateStage(jobId, candidateId, targetCandidateId, newStage) {
  const map = { ...getAllJobCandidatesMap() };
  const currentList = [...(map[jobId] || map[Number(jobId)] || INITIAL_JOB_CANDIDATES[jobId] || [])];
  
  const draggedIndex = currentList.findIndex(c => String(c.id) === String(candidateId));
  if (draggedIndex === -1) return currentList;

  const [draggedItem] = currentList.splice(draggedIndex, 1);
  draggedItem.stage = newStage;

  if (targetCandidateId) {
    const targetIndex = currentList.findIndex(c => String(c.id) === String(targetCandidateId));
    if (targetIndex !== -1) {
      currentList.splice(targetIndex, 0, draggedItem);
    } else {
      currentList.push(draggedItem);
    }
  } else {
    currentList.push(draggedItem);
  }

  map[jobId] = currentList;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return currentList;
}

export function updateCandidateData(jobId, candidateId, patchData) {
  const map = { ...getAllJobCandidatesMap() };
  const currentList = map[jobId] || map[Number(jobId)] || INITIAL_JOB_CANDIDATES[jobId] || [];

  const updatedList = currentList.map(cand => {
    if (cand.id === candidateId || String(cand.id) === String(candidateId)) {
      return { ...cand, ...patchData };
    }
    return cand;
  });

  map[jobId] = updatedList;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return updatedList;
}

export function scheduleCandidateInterview(jobId, candidateId, interviewData) {
  const map = { ...getAllJobCandidatesMap() };
  const currentList = map[jobId] || map[Number(jobId)] || INITIAL_JOB_CANDIDATES[jobId] || [];

  const updatedList = currentList.map(cand => {
    if (cand.id === candidateId || String(cand.id) === String(candidateId)) {
      const newActivity = [
        ...(cand.activity || []),
        { date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), text: `Entrevista agendada para ${interviewData.date} às ${interviewData.time} (${interviewData.format})` }
      ];
      return {
        ...cand,
        stage: 'entrevista',
        interview: interviewData,
        activity: newActivity
      };
    }
    return cand;
  });

  map[jobId] = updatedList;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return updatedList;
}

export function updateJob(jobId, patchData) {
  const jobs = getJobs('Todas as Cidades');
  const updated = jobs.map(j => {
    if (j.id === Number(jobId) || j.id === jobId || String(j.id) === String(jobId)) {
      const updatedJob = { ...j, ...patchData, updatedAt: new Date().toLocaleDateString('pt-BR') };
      if (j.firestoreId) {
        try {
          updateDoc(doc(db, 'jobs', j.firestoreId), patchData).catch(() => {});
        } catch {}
      }
      return updatedJob;
    }
    return j;
  });
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }
  return updated;
}

export function duplicateJob(jobId) {
  const job = getJobById(jobId);
  if (!job) return null;
  const newJob = {
    ...job,
    id: Date.now(),
    title: `${job.title} (Cópia)`,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    status: 'Ativa',
    applicantsCount: 0
  };
  delete newJob.firestoreId;
  return addJob(newJob);
}

export function deleteJob(jobId) {
  const jobs = getJobs('Todas as Cidades');
  const target = jobs.find(j => j.id === Number(jobId) || j.id === jobId || String(j.id) === String(jobId));
  const updated = jobs.filter(j => j.id !== Number(jobId) && j.id !== jobId && String(j.id) !== String(jobId));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }
  if (target?.firestoreId) {
    try {
      deleteDoc(doc(db, 'jobs', target.firestoreId)).catch(() => {});
    } catch {}
  }
  return updated;
}

export const STORAGE_KEY_JOB_CUSTOM_STAGES = 'ivai_conecta_job_stages_map';

export function getAllJobCustomStagesMap() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOB_CUSTOM_STAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

export function getJobCustomStages(jobId) {
  if (!jobId) return getCompanyCustomStages();
  
  let stagesToReturn = null;

  // 1. Check in job object directly
  const job = getJobById(jobId);
  if (job?.customStages && Array.isArray(job.customStages) && job.customStages.length > 0) {
    stagesToReturn = job.customStages;
  } else {
    // 2. Check in specific storage map
    const map = getAllJobCustomStagesMap();
    const stages = map[jobId] || map[Number(jobId)] || map[String(jobId)];
    if (stages && Array.isArray(stages) && stages.length > 0) {
      stagesToReturn = stages;
    }
  }

  if (stagesToReturn) {
    stagesToReturn.forEach(s => {
      if (s.id === 'aprovado' && (s.name === 'Aprovado / Proposta' || s.name === 'Aprovados / Finalizados')) {
        s.name = 'Aprovados';
        s.description = 'Candidatos que passaram na entrevista';
      }
    });
    return stagesToReturn;
  }

  // 3. Fallback to default company stages
  return getCompanyCustomStages();
}

export function saveJobCustomStages(jobId, stages) {
  if (!jobId || !Array.isArray(stages)) return stages;

  // 1. Save in map
  if (typeof localStorage !== 'undefined') {
    try {
      const map = { ...getAllJobCustomStagesMap() };
      map[jobId] = stages;
      map[String(jobId)] = stages;
      localStorage.setItem(STORAGE_KEY_JOB_CUSTOM_STAGES, JSON.stringify(map));
    } catch {}
  }

  // 2. Save in job item
  updateJob(jobId, { customStages: stages });

  return stages;
}

export function getCompanyCustomStages() {
  if (typeof localStorage === 'undefined') return SELECTION_STAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANY_CUSTOM_STAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(s => {
          if (s.id === 'aprovado' && (s.name === 'Aprovado / Proposta' || s.name === 'Aprovados / Finalizados')) {
            s.name = 'Aprovados';
            s.description = 'Candidatos que passaram na entrevista';
          }
        });
        return parsed;
      }
    }
  } catch {}
  return SELECTION_STAGES;
}

export function saveCompanyCustomStages(stages) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY_CUSTOM_STAGES, JSON.stringify(stages));
    } catch {}
  }
  return stages;
}
