// Jobs Service for Ivaí Conecta (Firestore + Local Storage Sync)
import { db } from '../lib/firebase.js';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
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

  // Enviar a candidatura ao Firestore
  try {
    addDoc(collection(db, 'applications'), newApp).catch(err => console.warn('[Firestore] Erro candidatar vaga:', err.message));
  } catch {}

  return { success: true, application: newApp };
}
