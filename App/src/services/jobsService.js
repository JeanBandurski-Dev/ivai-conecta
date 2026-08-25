// Jobs Service for Ivaí Conecta
import { STORAGE_KEY_JOBS, STORAGE_KEY_APPLICATIONS, SEED_JOBS, SEED_APPLICATIONS } from '../data/seedData';

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
  return { success: true, application: newApp };
}
