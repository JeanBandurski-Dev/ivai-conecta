// Jobs & Applications Service for Ivaí Conecta (Firestore Realtime)
import { db } from '../lib/firebase.js';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { STORAGE_KEY_JOBS, STORAGE_KEY_APPLICATIONS } from '../data/seedData.js';

/**
 * Escuta vagas em tempo real via Firestore onSnapshot
 */
export function subscribeToJobs(city = 'Todas as Cidades', callback) {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;

    return onSnapshot(q, (snapshot) => {
      const remoteJobs = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      // Atualiza cache local apenas com dados reais retornados pelo Firestore
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(remoteJobs));
      }

      callback(remoteJobs);
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
 * Escuta candidaturas de um usuário em tempo real via Firestore onSnapshot
 */
export function subscribeToApplications(candidateUid, callback) {
  try {
    const appsRef = collection(db, 'applications');
    const q = candidateUid ? query(appsRef, where('candidateUid', '==', candidateUid)) : appsRef;

    return onSnapshot(q, (snapshot) => {
      const remoteApps = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(remoteApps));
      }

      callback(remoteApps);
    }, (error) => {
      console.warn('[Firestore Apps Listener] Fallback:', error.message);
      callback(getUserApplications(candidateUid));
    });
  } catch (error) {
    console.warn('[Firestore Apps Listener] Falha ao assinar candidaturas:', error.message);
    callback(getUserApplications(candidateUid));
    return () => {};
  }
}

/**
 * Escuta candidatos inscritos em uma vaga específica em tempo real
 */
export function subscribeToJobApplicants(jobId, callback) {
  if (!jobId) {
    callback([]);
    return () => {};
  }

  try {
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, where('jobId', 'in', [jobId, Number(jobId) || jobId, String(jobId)]));

    return onSnapshot(q, (snapshot) => {
      const applicants = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));
      callback(applicants);
    }, (error) => {
      console.warn('[Firestore Job Applicants Listener] Erro:', error.message);
      // Fallback para cache local filtrado
      const allApps = getUserApplications();
      const matched = allApps.filter(a => String(a.jobId) === String(jobId));
      callback(matched);
    });
  } catch (error) {
    console.warn('[Firestore Job Applicants] Falha ao assinar:', error.message);
    callback([]);
    return () => {};
  }
}

/**
 * Busca vagas do cache local (sem seeds fictícios)
 */
export function getJobs(city = 'Todas as Cidades') {
  let jobs = [];
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) jobs = parsed;
      } catch {}
    }
  }

  // Sincronização assíncrona com Cloud Firestore
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;
    getDocs(q).then(snapshot => {
      const remoteJobs = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(remoteJobs));
      }
    }).catch(err => console.warn('[Firestore] getJobs offline:', err.message));
  } catch {}

  if (!city || city === 'Todas as Cidades') return jobs;
  return jobs.filter(j => j.city && j.city.toLowerCase() === city.toLowerCase());
}

/**
 * Busca vagas diretamente do Firestore via Promise (assíncrono)
 */
export async function getJobsAsync(city = 'Todas as Cidades') {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;
    const snapshot = await getDocs(q);
    const remoteJobs = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(remoteJobs));
    }
    return remoteJobs;
  } catch (error) {
    console.warn('[Firestore] Erro ao buscar vagas do Firestore:', error.message);
    return getJobs(city);
  }
}

export function getJobById(id) {
  const jobs = getJobs('Todas as Cidades');
  return jobs.find(j => j.id === Number(id) || j.id === id || String(j.id) === String(id) || j.firestoreId === id);
}

export async function addJob(jobData) {
  const jobs = getJobs('Todas as Cidades');
  const newJob = {
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtTimestamp: Date.now(),
    status: 'Ativa',
    applicantsCount: 0,
    ...jobData,
  };

  // Sincronização no Firestore
  try {
    const docRef = await addDoc(collection(db, 'jobs'), newJob);
    newJob.id = docRef.id;
    newJob.firestoreId = docRef.id;
  } catch (err) {
    console.warn('[Firestore] Erro ao cadastrar vaga no Firestore:', err.message);
    newJob.id = `job_${Date.now()}`;
  }

  const updated = [newJob, ...jobs];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }

  return newJob;
}

export async function updateJobStatus(jobId, action) {
  const jobs = getJobs('Todas as Cidades');
  const targetJob = jobs.find(j => j.id === Number(jobId) || j.id === jobId || String(j.id) === String(jobId) || j.firestoreId === jobId);
  const newStatus = action === 'close' ? 'Encerrada' : 'Ativa';

  if (targetJob && (targetJob.firestoreId || targetJob.id)) {
    const docId = targetJob.firestoreId || targetJob.id;
    try {
      await updateDoc(doc(db, 'jobs', String(docId)), { status: newStatus });
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar status da vaga:', err.message);
    }
  }

  const updated = jobs.map(j => {
    if (j.id === Number(jobId) || j.id === jobId || String(j.id) === String(jobId) || j.firestoreId === jobId) {
      return { ...j, status: newStatus };
    }
    return j;
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }
  return updated;
}

export function getUserApplications(candidateUid) {
  let apps = [];
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) apps = parsed;
      } catch {}
    }
  }
  if (candidateUid) {
    return apps.filter(a => a.candidateUid === candidateUid || a.candidateEmail === candidateUid);
  }
  return apps;
}

export async function applyToJob(jobId, user) {
  if (!user) {
    return { success: false, message: 'Você precisa estar logado para se candidatar.' };
  }

  // Bloqueia se a conta logada for do tipo empresa
  if (user.role === 'empresa') {
    return { success: false, message: 'Contas empresariais não podem se candidatar a vagas.' };
  }

  const job = getJobById(jobId);

  // Bloqueia se for o criador da própria vaga
  if (job && (
    (job.ownerUid && (job.ownerUid === user.uid || job.ownerUid === user.id)) ||
    (job.createdBy && job.createdBy.toLowerCase() === user.email?.toLowerCase())
  )) {
    return { success: false, message: 'Você não pode se candidatar à sua própria vaga!' };
  }

  if (user.role === 'aluno' && !user.isVerifiedStudent) {
    return {
      success: false,
      requiresVerification: true,
      message: '🔒 Para sua segurança e das empresas contratantes, envie sua Declaração de Matrícula nas Configurações para liberar candidaturas!'
    };
  }

  const userUid = user.uid || user.id || 'usr_guest';
  const apps = getUserApplications(userUid);
  const existing = apps.find(a => String(a.jobId) === String(jobId));
  if (existing) {
    return { success: false, message: 'Você já se candidatou a esta vaga!' };
  }
  const newApp = {
    jobId: String(jobId),
    candidateUid: userUid,
    candidateName: user.name || 'Candidato Ivaí Conecta',
    candidateEmail: user.email || '',
    candidateAvatar: user.avatar || '',
    candidateCourse: user.course || (user.role === 'aluno' ? 'Estudante' : 'Profissional'),
    candidateCity: user.city || 'Ivaiporã',
    candidatePhone: user.phone || '',
    title: job ? job.title : 'Vaga de Emprego',
    company: job ? job.company : 'Empresa do Vale do Ivaí',
    companyLogo: job ? (job.companyLogo || '') : '',
    recruiterEmail: job ? (job.recruiterEmail || job.createdBy || '') : '',
    recruiterPhone: job ? (job.recruiterPhone || '') : '',
    city: job ? job.city : 'Ivaiporã',
    type: job ? job.type : 'Tempo Integral',
    appliedAt: new Date().toLocaleDateString('pt-BR'),
    appliedTimestamp: Date.now(),
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

  // Grava candidatura no Firestore
  try {
    const docRef = await addDoc(collection(db, 'applications'), newApp);
    newApp.id = docRef.id;
    newApp.firestoreId = docRef.id;

    // Incrementa o contador de inscritos na vaga no Firestore
    const targetDocId = job?.firestoreId || job?.id || jobId;
    if (targetDocId) {
      try {
        await updateDoc(doc(db, 'jobs', String(targetDocId)), {
          applicantsCount: increment(1)
        });
      } catch {}
    }
  } catch (err) {
    console.warn('[Firestore] Erro ao gravar candidatura:', err.message);
    newApp.id = `app_${Date.now()}`;
  }

  const allApps = getUserApplications();
  const updated = [newApp, ...allApps];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));
  }

  return { success: true, application: newApp };
}

