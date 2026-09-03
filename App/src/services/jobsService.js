// Jobs & Applications Service for Ivaí Conecta (Firestore Realtime)
import { db } from '../lib/firebase.js';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { STORAGE_KEY_JOBS, STORAGE_KEY_APPLICATIONS } from '../data/seedData.js';
import { validateProfessionalText, validateJobTitle } from './jobTaxonomy.js';

export const STORAGE_KEY_DELETED_JOBS = 'ivai_conecta_deleted_job_ids';
export const STORAGE_KEY_JOB_STATUSES = 'ivai_conecta_job_statuses';

function getDeletedJobIds() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_JOBS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getJobStatusOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOB_STATUSES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isCleanProfessionalJob(job) {
  if (!job || typeof job !== 'object' || !job.title) return false;
  try {
    const tCheck = validateJobTitle(String(job.title));
    if (!tCheck.valid) return false;
    const salStr = String(job.salary || '').toLowerCase().trim();
    if (salStr === 'cu' || salStr === 'bosta') return false;
    if (job.description) {
      const dCheck = validateProfessionalText(String(job.description), 'Descrição', 5);
      if (!dCheck.valid) return false;
    }
  } catch {
    return true;
  }
  return true;
}

function applyJobOverrides(job) {
  if (!job || typeof job !== 'object') return null;
  const deletedIds = getDeletedJobIds();
  const idStr = String(job.id || job.firestoreId || '');
  const fIdStr = job.firestoreId ? String(job.firestoreId) : null;

  if (deletedIds.includes(idStr) || (fIdStr && deletedIds.includes(fIdStr))) {
    return null; // Vaga excluída permanentemente pelo usuário
  }

  const statusOverrides = getJobStatusOverrides();
  const overrideStatus = statusOverrides[idStr] || (fIdStr && statusOverrides[fIdStr]);

  // Garante que requiredSkills e benefits sejam sempre arrays limpos de strings
  const safeRequiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.map(s => String(s || '').trim()).filter(Boolean)
    : (typeof job.requiredSkills === 'string'
      ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : []);

  const safeBenefits = Array.isArray(job.benefits)
    ? job.benefits.map(b => String(b || '').trim()).filter(Boolean)
    : (typeof job.benefits === 'string'
      ? job.benefits.split(',').map(b => b.trim()).filter(Boolean)
      : []);

  const finalJob = {
    ...job,
    id: job.id || job.firestoreId || idStr,
    title: String(job.title || 'Oportunidade Profissional'),
    company: String(job.company || 'Empresa Regional'),
    city: String(job.city || 'Ivaiporã'),
    type: String(job.type || 'Tempo Integral'),
    status: overrideStatus || job.status || 'Ativa',
    requiredSkills: safeRequiredSkills,
    benefits: safeBenefits
  };

  return isCleanProfessionalJob(finalJob) ? finalJob : null;
}

/**
 * Escuta vagas em tempo real via Firestore onSnapshot
 */
export function subscribeToJobs(city = 'Todas as Cidades', callback) {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;

    return onSnapshot(q, (snapshot) => {
      const remoteJobs = snapshot.docs
        .map(d => ({
          id: d.id,
          firestoreId: d.id,
          ...d.data()
        }))
        .map(applyJobOverrides)
        .filter(Boolean);

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
      console.warn('[Firestore Applications Listener] Offline fallback:', error.message);
      callback(getUserApplications(candidateUid));
    });
  } catch (error) {
    console.warn('[Firestore Applications Listener] Falha ao assinar candidaturas:', error.message);
    callback(getUserApplications(candidateUid));
    return () => {};
  }
}

/**
 * Escuta todos os candidatos de uma vaga específica em tempo real
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

  // Aplica overrides de status e deleções
  jobs = jobs.map(applyJobOverrides).filter(Boolean);

  // Sincronização assíncrona com Cloud Firestore
  try {
    const jobsRef = collection(db, 'jobs');
    const q = (city && city !== 'Todas as Cidades') ? query(jobsRef, where('city', '==', city)) : jobsRef;
    getDocs(q).then(snapshot => {
      const remoteJobs = snapshot.docs
        .map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }))
        .map(applyJobOverrides)
        .filter(Boolean);
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
    const remoteJobs = snapshot.docs
      .map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }))
      .map(applyJobOverrides)
      .filter(Boolean);
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
  if (!id) return null;
  const idStr = String(id).trim();
  const jobs = getJobs('Todas as Cidades');
  return jobs.find(j => 
    j && (
      String(j.id) === idStr || 
      String(j.firestoreId) === idStr || 
      (typeof j.id === 'number' && String(j.id) === idStr)
    )
  ) || null;
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

  const updated = [newJob, ...jobs].map(applyJobOverrides).filter(Boolean);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }

  return newJob;
}

export async function updateJobStatus(jobId, action) {
  const newStatus = action === 'close' ? 'Encerrada' : 'Ativa';
  const idStr = String(jobId);

  // 1. Salva override persistente no localStorage
  if (typeof localStorage !== 'undefined') {
    const overrides = getJobStatusOverrides();
    overrides[idStr] = newStatus;
    localStorage.setItem(STORAGE_KEY_JOB_STATUSES, JSON.stringify(overrides));
  }

  // 2. Atualiza no Cloud Firestore
  const jobs = getJobs('Todas as Cidades');
  const targetJob = jobs.find(j => j.id === Number(jobId) || j.id === jobId || String(j.id) === idStr || (j.firestoreId && String(j.firestoreId) === idStr));

  if (targetJob && (targetJob.firestoreId || targetJob.id)) {
    const docId = targetJob.firestoreId || targetJob.id;
    try {
      await updateDoc(doc(db, 'jobs', String(docId)), { status: newStatus });
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar status da vaga:', err.message);
    }
  }

  const updated = jobs.map(j => {
    if (j.id === Number(jobId) || j.id === jobId || String(j.id) === idStr || (j.firestoreId && String(j.firestoreId) === idStr)) {
      return { ...j, status: newStatus };
    }
    return j;
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }

  return updated;
}

export async function deleteJob(jobId) {
  const idStr = String(jobId);

  // 1. Registra no banco de IDs deletados
  if (typeof localStorage !== 'undefined') {
    const deletedIds = getDeletedJobIds();
    if (!deletedIds.includes(idStr)) {
      deletedIds.push(idStr);
      localStorage.setItem(STORAGE_KEY_DELETED_JOBS, JSON.stringify(deletedIds));
    }
  }

  // 2. Remove da lista local
  const jobs = getJobs('Todas as Cidades');
  let targetFirestoreId = null;
  const target = jobs.find(j => j.id === Number(jobId) || j.id === jobId || String(j.id) === idStr || (j.firestoreId && String(j.firestoreId) === idStr));
  if (target?.firestoreId) targetFirestoreId = target.firestoreId;

  const updated = jobs.filter(j => !(j.id === Number(jobId) || j.id === jobId || String(j.id) === idStr || (j.firestoreId && String(j.firestoreId) === idStr)));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
  }

  // 3. Exclui do Cloud Firestore
  try {
    if (targetFirestoreId) {
      await deleteDoc(doc(db, 'jobs', targetFirestoreId));
    } else {
      const qNum = query(collection(db, 'jobs'), where('id', '==', Number(jobId)));
      const snap = await getDocs(qNum);
      snap.forEach(d => deleteDoc(doc(db, 'jobs', d.id)).catch(() => {}));
    }
  } catch (err) {
    console.warn('[Firestore] Erro ao excluir vaga:', err.message);
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

  if (user.role === 'empresa') {
    return { success: false, message: 'Perfis de empresa não podem se candidatar a vagas de emprego.' };
  }

  if (user.role === 'professor') {
    return { success: false, message: 'Perfis de docente não realizam candidaturas a vagas.' };
  }

  const job = getJobById(jobId);
  if (job) {
    const isOwner = (
      (job.createdBy && user.uid && String(job.createdBy) === String(user.uid)) ||
      (job.createdBy && user.id && String(job.createdBy) === String(user.id)) ||
      (job.createdBy && user.email && String(job.createdBy).toLowerCase() === String(user.email).toLowerCase()) ||
      (user.name && job.company && job.company.toLowerCase().trim() === user.name.toLowerCase().trim())
    );
    if (isOwner) {
      return { success: false, message: 'Você não pode se candidatar à vaga publicada pela sua própria empresa.' };
    }
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
