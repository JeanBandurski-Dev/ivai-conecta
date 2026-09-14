// Jobs & Applications Service for Ivaí Conecta (Firestore Realtime)
import { db } from '../lib/firebase.js';
import {
  collection,
  getDocs,
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
import { validateProfessionalText, validateJobTitle, validateSkill, hasProfanity } from './jobTaxonomy.js';
import { calculateMatchScore, safeSkillsArray } from './matchService.js';
import { matchCity } from '../utils/searchUtils.js';

export const STORAGE_KEY_DELETED_JOBS = 'ivai_conecta_deleted_job_ids';
export const STORAGE_KEY_JOB_STATUSES = 'ivai_conecta_job_statuses';

// Cache em memória como fallback quando localStorage estiver cheio
let _memJobsCache = null;

/**
 * Salva no localStorage de forma segura, limpando dados antigos se a quota for excedida.
 */
function safeSetLS(key, value) {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)) {
      // Tenta limpar chaves pesadas para liberar espaço
      const heavyKeys = [
        'ivai_conecta_db_jobs',
        'ivai_conecta_db_talents',
        'ivai_conecta_db_services',
        'ivai_conecta_user_applications',
      ];
      for (const hk of heavyKeys) {
        if (hk !== key) {
          try { localStorage.removeItem(hk); } catch {}
        }
      }
      // Segunda tentativa após limpeza
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.warn('[JobsService] localStorage quota persistente - usando cache em memória.');
        return false;
      }
    }
    return false;
  }
}

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
    // Apenas bloqueia conteúdo ofensivo (palavrões) - não rejeita títulos de cargos válidos
    // que não estejam na lista padronizada (empresas podem criar vagas com títulos customizados)
    const titleStr = String(job.title || '');
    if (!titleStr.trim()) return false;
    if (hasProfanity(titleStr)) return false;
    const salStr = String(job.salary || '').toLowerCase().trim();
    if (hasProfanity(salStr)) return false;
    if (job.description && hasProfanity(String(job.description))) return false;
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
  const rawRequiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.map(s => String(s || '').trim()).filter(Boolean)
    : (typeof job.requiredSkills === 'string'
      ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : []);

  // Remove apenas habilidades com conteúdo ofensivo (palavrões) — não rejeita competências válidas
  const safeRequiredSkills = rawRequiredSkills.filter(s => s && !hasProfanity(s));

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
 * Salva vagas no cache (localStorage com fallback em memória).
 * Mescla com jobs em memória para nunca perder vagas recém-criadas.
 * Limita a 150 vagas mais recentes para evitar quota exceeded.
 */
function persistJobs(jobs) {
  if (!Array.isArray(jobs)) return;

  const map = new Map();
  // 1. Adiciona jobs recebidos
  jobs.forEach(j => {
    if (j && (j.id || j.firestoreId)) {
      map.set(String(j.id || j.firestoreId), j);
    }
  });

  // 2. Preserva jobs em memória que possam não estar ainda no snapshot recebido
  if (Array.isArray(_memJobsCache)) {
    _memJobsCache.forEach(j => {
      if (j && (j.id || j.firestoreId)) {
        const key = String(j.id || j.firestoreId);
        if (!map.has(key)) {
          map.set(key, j);
        }
      }
    });
  }

  const merged = Array.from(map.values())
    .map(applyJobOverrides)
    .filter(Boolean)
    .sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0))
    .slice(0, 150);

  _memJobsCache = merged;
  if (typeof localStorage !== 'undefined') {
    safeSetLS(STORAGE_KEY_JOBS, JSON.stringify(merged));
  }
}

/**
 * Escuta vagas em tempo real via Firestore onSnapshot + Eventos Locais Imediatos
 */
export function subscribeToJobs(city = 'Todas as Cidades', callback) {
  // 1. Emite dados locais imediatamente
  callback(getJobs(city));

  // 2. Escuta atualizações locais para sincronização instantânea entre abas e telas
  const handleLocalUpdate = () => {
    callback(getJobs(city));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('ivai_jobs_updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);
  }

  // 3. Sincronização em tempo real via Cloud Firestore
  // Escuta sempre a coleção completa para que o cache local nunca fique truncado por cidade
  let unsubFirestore = () => {};
  try {
    const jobsRef = collection(db, 'jobs');
    unsubFirestore = onSnapshot(jobsRef, (snapshot) => {
      const remoteJobs = snapshot.docs
        .map(d => ({
          id: d.id,
          firestoreId: d.id,
          ...d.data()
        }))
        .map(applyJobOverrides)
        .filter(Boolean);

      // Persiste no cache global completo
      persistJobs(remoteJobs);

      // Filtra pela cidade solicitada apenas ao entregar para o callback
      const filtered = remoteJobs.filter(j => matchCity(j.city, city));

      callback(filtered);
    }, (error) => {
      console.warn('[Firestore Jobs Listener] Offline fallback:', error.message);
      callback(getJobs(city));
    });
  } catch (error) {
    console.warn('[Firestore Jobs Listener] Falha ao assinar vagas:', error.message);
    callback(getJobs(city));
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('ivai_jobs_updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
    }
    if (typeof unsubFirestore === 'function') unsubFirestore();
  };
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
 * Busca vagas do cache local (memória com fallback em localStorage)
 */
export function getJobs(city = 'Todas as Cidades') {
  let jobs = [];

  // 1. Tenta memória primeiro
  if (Array.isArray(_memJobsCache) && _memJobsCache.length > 0) {
    jobs = _memJobsCache;
  } else if (typeof localStorage !== 'undefined') {
    // 2. Tenta localStorage se a memória ainda não tiver
    try {
      const raw = localStorage.getItem(STORAGE_KEY_JOBS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          jobs = parsed;
          _memJobsCache = parsed;
        }
      }
    } catch {}
  }

  // Aplica overrides de status e deleções
  jobs = jobs.map(applyJobOverrides).filter(Boolean);

  if (!city || city === 'Todas as Cidades') return jobs;
  return jobs.filter(j => matchCity(j.city, city));
}

/**
 * Busca vagas diretamente do Firestore via Promise (assíncrono)
 */
export async function getJobsAsync(city = 'Todas as Cidades') {
  try {
    const jobsRef = collection(db, 'jobs');
    const snapshot = await getDocs(jobsRef);
    const remoteJobs = snapshot.docs
      .map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }))
      .map(applyJobOverrides)
      .filter(Boolean);
    
    persistJobs(remoteJobs);

    if (!city || city === 'Todas as Cidades') return remoteJobs;
    return remoteJobs.filter(j => matchCity(j.city, city));
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
  const currentJobs = getJobs('Todas as Cidades') || [];
  const rawSkills = Array.isArray(jobData?.requiredSkills) ? jobData.requiredSkills : [];
  // Usa filtro leve (apenas palavrões) para não descartar skills legítimas que o usuário digitou
  const cleanSkills = rawSkills.filter(s => s && typeof s === 'string' && s.trim() && !hasProfanity(s));

  // Sanitiza dados de entrada removendo qualquer chave com valor undefined
  const cleanData = {};
  if (jobData && typeof jobData === 'object') {
    Object.keys(jobData).forEach(key => {
      if (jobData[key] !== undefined) {
        cleanData[key] = jobData[key];
      }
    });
  }

  const newJob = {
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtTimestamp: Date.now(),
    status: 'Ativa',
    applicantsCount: 0,
    ...cleanData,
    requiredSkills: cleanSkills.length > 0 ? cleanSkills : (Array.isArray(cleanData.requiredSkills) && cleanData.requiredSkills.length > 0 ? cleanData.requiredSkills : ['Comunicação Assertiva'])
  };

  // 1. Sincronização no Firestore
  try {
    const docRef = await addDoc(collection(db, 'jobs'), newJob);
    newJob.id = docRef.id;
    newJob.firestoreId = docRef.id;
  } catch (err) {
    console.warn('[Firestore] Erro ao cadastrar vaga no Firestore:', err.message);
    newJob.id = `job_${Date.now()}`;
    newJob.firestoreId = newJob.id;
  }

  // 2. Mescla a nova vaga com todas as vagas existentes sem perder nada
  const existingWithoutNew = currentJobs.filter(j => j && String(j.id) !== String(newJob.id) && String(j.firestoreId) !== String(newJob.id));
  const updated = [newJob, ...existingWithoutNew].map(applyJobOverrides).filter(Boolean);

  persistJobs(updated);

  try {
    window.dispatchEvent(new CustomEvent('ivai_jobs_updated', { detail: updated }));
  } catch (evErr) {
    console.warn('[JobsService] Aviso no evento ivai_jobs_updated:', evErr);
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

  persistJobs(updated);

  try {
    window.dispatchEvent(new CustomEvent('ivai_jobs_updated', { detail: updated }));
  } catch (evErr) {
    console.warn('[JobsService] Aviso no evento ivai_jobs_updated:', evErr);
  }

  return updated;
}

export async function deleteJob(jobId) {
  const idStr = String(jobId);

  // 1. Busca vaga para identificar tanto o ID numérico quanto o firestoreId
  const jobs = getJobs('Todas as Cidades');
  const target = jobs.find(j => j.id === Number(jobId) || j.id === jobId || String(j.id) === idStr || (j.firestoreId && String(j.firestoreId) === idStr));
  const targetFirestoreId = target?.firestoreId || (isNaN(Number(jobId)) ? idStr : null);
  const targetNumericId = target?.id ? String(target.id) : (!isNaN(Number(jobId)) ? idStr : null);

  // 2. Registra no banco de IDs deletados para não ressurgir em cache
  if (typeof localStorage !== 'undefined') {
    const deletedIds = getDeletedJobIds();
    if (!deletedIds.includes(idStr)) deletedIds.push(idStr);
    if (targetFirestoreId && !deletedIds.includes(targetFirestoreId)) deletedIds.push(targetFirestoreId);
    if (targetNumericId && !deletedIds.includes(targetNumericId)) deletedIds.push(targetNumericId);
    localStorage.setItem(STORAGE_KEY_DELETED_JOBS, JSON.stringify(deletedIds));
  }

  // 3. Remove da lista local imediatamente
  const updated = jobs.filter(j => !(
    j.id === Number(jobId) || j.id === jobId || String(j.id) === idStr ||
    (targetFirestoreId && (String(j.id) === targetFirestoreId || String(j.firestoreId) === targetFirestoreId)) ||
    (targetNumericId && String(j.id) === targetNumericId)
  ));

  persistJobs(updated);

  try {
    window.dispatchEvent(new CustomEvent('ivai_jobs_updated', { detail: updated }));
  } catch (evErr) {
    console.warn('[JobsService] Aviso no evento ivai_jobs_updated:', evErr);
  }

  // 4. Exclui do Cloud Firestore
  try {
    if (targetFirestoreId) {
      await deleteDoc(doc(db, 'jobs', targetFirestoreId));
    }
    if (targetNumericId) {
      const qNum = query(collection(db, 'jobs'), where('id', '==', Number(targetNumericId)));
      const snap = await getDocs(qNum);
      snap.forEach(d => deleteDoc(doc(db, 'jobs', d.id)).catch(() => {}));
    }
  } catch (err) {
    console.warn('[Firestore] Erro ao excluir vaga:', err.message);
  }

  return updated;
}

export function getUserApplications(candidateIdentifier) {
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
  if (candidateIdentifier) {
    const idStr = String(candidateIdentifier).toLowerCase().trim();
    return apps.filter(a => 
      String(a.candidateUid || '').toLowerCase().trim() === idStr ||
      String(a.candidateId || '').toLowerCase().trim() === idStr ||
      String(a.candidateEmail || '').toLowerCase().trim() === idStr
    );
  }
  return apps;
}

export async function applyToJob(jobId, user) {
  if (!user) {
    return { success: false, message: 'Você precisa estar logado para se candidatar.' };
  }

  const role = String(user.role || '').toLowerCase().trim();
  const isCandidate = role === 'aluno' || role === 'candidato' || role === 'estudante' || role === 'student';

  if (!isCandidate) {
    if (role === 'empresa' || role === 'company' || role === 'recrutador') {
      return { success: false, message: 'Perfis de empresa não podem se candidatar a vagas de emprego.' };
    }
    if (role === 'professor' || role === 'docente' || role === 'teacher') {
      return { success: false, message: 'Perfis de professor/docente não realizam candidaturas a vagas.' };
    }
    return { success: false, message: 'Apenas perfis de alunos e candidatos podem se candidatar a vagas.' };
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

  if (role === 'aluno' && !user.isVerifiedStudent) {
    return {
      success: false,
      requiresVerification: true,
      message: 'Para sua segurança e das empresas contratantes, envie sua Declaração de Matrícula nas Configurações para liberar candidaturas!'
    };
  }

  const userUid = String(user.uid || user.id || 'usr_guest').trim();
  const userEmail = String(user.email || '').toLowerCase().trim();
  const possibleUserIds = [userUid, String(user.id || ''), userEmail].filter(Boolean);

  const possibleJobIds = [
    String(jobId),
    String(job?.id || ''),
    String(job?.firestoreId || ''),
    job?.id ? String(job.id) : null
  ].filter(Boolean);

  // 1. Verificação local imediata no cache
  const localApps = getUserApplications();
  const isDuplicateLocal = localApps.some(a => {
    const matchJob = possibleJobIds.includes(String(a.jobId || '')) ||
                     (a.firestoreJobId && possibleJobIds.includes(String(a.firestoreJobId))) ||
                     (a.originalJobId && possibleJobIds.includes(String(a.originalJobId)));
    const matchUser = possibleUserIds.includes(String(a.candidateUid || '')) ||
                      possibleUserIds.includes(String(a.candidateId || '')) ||
                      (a.candidateEmail && possibleUserIds.includes(String(a.candidateEmail).toLowerCase().trim()));
    return matchJob && matchUser;
  });

  if (isDuplicateLocal) {
    return { success: false, message: 'Você já se candidatou a esta vaga!' };
  }

  // 2. Verificação assíncrona no Cloud Firestore para evitar duplicações remotas
  try {
    const appsRef = collection(db, 'applications');
    if (userUid && userUid !== 'usr_guest') {
      const qUid = query(appsRef, where('candidateUid', '==', userUid));
      const snapUid = await getDocs(qUid);
      const existsUid = snapUid.docs.some(d => {
        const data = d.data();
        return possibleJobIds.includes(String(data.jobId || '')) ||
               (data.firestoreJobId && possibleJobIds.includes(String(data.firestoreJobId))) ||
               (data.originalJobId && possibleJobIds.includes(String(data.originalJobId)));
      });
      if (existsUid) {
        return { success: false, message: 'Você já se candidatou a esta vaga!' };
      }
    }

    if (userEmail) {
      const qEmail = query(appsRef, where('candidateEmail', '==', userEmail));
      const snapEmail = await getDocs(qEmail);
      const existsEmail = snapEmail.docs.some(d => {
        const data = d.data();
        return possibleJobIds.includes(String(data.jobId || '')) ||
               (data.firestoreJobId && possibleJobIds.includes(String(data.firestoreJobId))) ||
               (data.originalJobId && possibleJobIds.includes(String(data.originalJobId)));
      });
      if (existsEmail) {
        return { success: false, message: 'Você já se candidatou a esta vaga!' };
      }
    }
  } catch (fsErr) {
    console.warn('[Firestore] Verificação prévia de duplicidade:', fsErr.message);
  }

  const candidateSkills = safeSkillsArray(user.skills);
  const requiredSkills = safeSkillsArray(job ? job.requiredSkills : []);
  const calculatedScore = calculateMatchScore(candidateSkills, requiredSkills, {
    userCity: user.city,
    jobCity: job?.city,
    isVerifiedStudent: user.isVerifiedStudent,
    endorsementsCount: (user.endorsements?.length || user.endorsementCount || 0),
    modality: job?.modality
  });

  const targetJobId = String(job?.firestoreId || job?.id || jobId);

  const newApp = {
    jobId: targetJobId,
    firestoreJobId: targetJobId,
    originalJobId: String(job?.id || jobId),
    candidateUid: userUid,
    candidateId: String(user.id || userUid),
    candidateName: user.name || 'Candidato Ivaí Conecta',
    candidateEmail: userEmail,
    candidateAvatar: user.avatar || '',
    candidateCourse: user.course || (user.role === 'aluno' ? 'Estudante' : 'Profissional'),
    candidateCity: user.city || 'Ivaiporã',
    candidatePhone: user.phone || '',
    skills: candidateSkills,
    title: job ? job.title : 'Vaga de Emprego',
    company: job ? job.company : 'Empresa do Vale do Ivaí',
    companyLogo: job ? (job.companyLogo || '') : '',
    recruiterEmail: job ? (job.recruiterEmail || job.createdBy || '') : '',
    recruiterPhone: job ? (job.recruiterPhone || '') : '',
    city: job ? job.city : 'Ivaiporã',
    type: job ? job.type : 'Tempo Integral',
    appliedAt: new Date().toLocaleDateString('pt-BR'),
    appliedTimestamp: Date.now(),
    matchScore: calculatedScore,
    status: 'Candidatura Enviada',
    statusClass: calculatedScore >= 75 ? 'badge-match-high' : calculatedScore >= 50 ? 'badge-match-med' : 'badge-match-low',
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
  const updated = [newApp, ...allApps.filter(a => a && a.id !== newApp.id)];
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent('ivai_applications_updated', { detail: updated }));
    } catch {}
  }

  return { success: true, application: newApp };
}


/**
 * Sanitizador contra artefatos de encoding (mojibake)
 */
export function sanitizeMojibake(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/T[├\u251c][®\u00ae]?cnico/gi, 'Técnico')
    .replace(/T[é\u00e9]cnico/gi, 'Técnico')
    .replace(/t[é\u00e9]cnic([ao])/gi, 'técnic$1')
    .replace(/An[├\u251c][í\u00ed]lise/gi, 'Análise')
    .replace(/An[á\u00e1]lise/gi, 'Análise')
    .replace(/Ivaipor[├\u251c][ú\u00fa]/gi, 'Ivaiporã')
    .replace(/Arapu[├\u251c][ú\u00fa]/gi, 'Arapuã')
    .replace(/Iva[├\u251c][¡\u00a1]/gi, 'Ivaí')
    .replace(/c[├\u251c][│\u2502]digo/gi, 'código')
    .replace(/neg[├\u251c][│\u2502]cios/gi, 'negócios')
    .replace(/pr[├\u251c][í\u00ed]tic([ao]s?)/gi, 'prátic$1')
    .replace(/avalia[├\u251c][º\u00ba][├\u251c][ú\u00fa]/gi, 'avaliação')
    .replace(/Programa[├\u251c][º\u00ba][├\u251c][ú\u00fa]/gi, 'Programação')
    .replace(/Informa[├\u251c][º\u00ba][├\u251c][ú\u00fa]/gi, 'Informação')
    .replace(/Inform[├\u251c][í\u00ed]tica/gi, 'Informática')
    .replace(/contrata[├\u251c][º\u00ba][├\u251c][ú\u00fa]/gi, 'contratação')
    .replace(/evolu[├\u251c][º\u00ba][├\u251c][ú\u00fa]/gi, 'evolução')
    .replace(/resolu[├\u251c][º\u00ba][├\u251c][ú\u00fa]/gi, 'resolução')
    .replace(/lideran[├\u251c][º\u00ba]a/gi, 'liderança')
    .replace(/avan[├\u251c][º\u00ba]ada/gi, 'avançada')
    .replace(/experi[├\u251c][¬\u00ac]ncia/gi, 'experiência')
    .replace(/est[├\u251c][í\u00ed]gio/gi, 'estágio')
    .replace(/est[├\u251c][®\u00ae]tico/gi, 'estético')
    .replace(/memor[├\u251c][í\u00ed]veis/gi, 'memoráveis')
    .replace(/Conclu[├\u251c][¡\u00a1]do/gi, 'Concluído')
    .replace(/dom[├\u251c][¡\u00a1]nio/gi, 'domínio')
    .replace(/racioc[├\u251c][¡\u00a1]nio/gi, 'raciocínio')
    .replace(/curr[├\u251c][í\u00ed]culo/gi, 'currículo')
    .replace(/pedag[├\u251c][│\u2502]gico/gi, 'pedagógico')
    .replace(/[├\u251c][│\u2502]timo/gi, 'ótimo')
    .replace(/N[├\u251c][ú\u00fa]o/gi, 'Não')
    .replace(/n[├\u251c][ú\u00fa]o/gi, 'não')
    .replace(/Gr[├\u251c][í\u00ed]fico/gi, 'Gráfico')
    .replace(/Prof[┬\u252c][¬\u00ac]\.?/gi, 'Profª.')
    .replace(/Andr[├\u251c][®\u00ae]/gi, 'André')
    .replace(/Patr[├\u251c][¡\u00a1]cia/gi, 'Patrícia')
    .replace(/C[├\u251c][│\u2502]pia/gi, 'Cópia');
}

export function deepSanitizeMojibake(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return sanitizeMojibake(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitizeMojibake);
  if (typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      res[key] = deepSanitizeMojibake(obj[key]);
    }
    return res;
  }
  return obj;
}

export function sanitizeStageItem(stage) {
  if (!stage || typeof stage !== 'object') return stage;
  let name = sanitizeMojibake(stage.name || '');
  let description = sanitizeMojibake(stage.description || '');

  if (stage.id === 'desafio' && (name.toLowerCase().includes('desafio') || name.toLowerCase().includes('t') || name.toLowerCase().includes('cnico'))) {
    name = 'Desafio Técnico';
  } else if (stage.id === 'analise') {
    name = 'Em Análise';
  } else if (stage.id === 'triagem') {
    name = 'Triagem / Novos';
  } else if (stage.id === 'entrevista') {
    name = 'Entrevista Agendada';
  } else if (stage.id === 'aprovado') {
    name = 'Aprovados';
    description = 'Candidatos que passaram na entrevista';
  } else if (stage.id === 'reprovado') {
    name = 'Banco de Talentos';
  }

  return {
    ...stage,
    name,
    description
  };
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

export const INITIAL_JOB_CANDIDATES = {};


export function getAllJobCandidatesMap() {
  if (typeof localStorage === 'undefined') return {};
  const raw = localStorage.getItem(STORAGE_KEY_JOB_CANDIDATES);
  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {}
  }
  
  if (parsed && typeof parsed === 'object') {
    parsed = deepSanitizeMojibake(parsed);
    // Purga candidatos legados de demonstração caso existam no cache do navegador
    const cleaned = {};
    let hasMock = false;
    const mockNames = new Set([
      'Lucas Eduardo Silva', 'Juliana Aparecida Melo', 'Rafael Gomes Costa',
      'Camila Fernandes', 'Thiago Martins Alencar', 'Mariana Oliveira Souza',
      'Gabriel Henrique Santos', 'Beatriz Lima Rocha', 'Felipe Augusto Ribeiro',
      'Larissa Cristina Pires', 'Beatriz Santos', 'Matheus Henrique', 'Patrícia Souza'
    ]);

    Object.keys(parsed).forEach(jobId => {
      const candidates = parsed[jobId];
      if (Array.isArray(candidates)) {
        const realCandidates = candidates.filter(c => {
          if (!c) return false;
          if (mockNames.has(c.name) || (typeof c.id === 'number' && c.id >= 1 && c.id <= 10)) {
            hasMock = true;
            return false;
          }
          return true;
        });
        if (realCandidates.length > 0) {
          cleaned[jobId] = realCandidates;
        }
      }
    });
    if (hasMock) {
      localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(cleaned));
    }
    return cleaned;
  }

  localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify({}));
  return {};
}

export function getJobCandidates(jobId) {
  const map = getAllJobCandidatesMap();
  const idStr = String(jobId || '');
  let list = map[jobId] || (jobId ? map[Number(jobId)] : null) || (idStr ? map[idStr] : null) || [];
  list = deepSanitizeMojibake(list);

  // 1. Incorpora candidaturas reais gravadas no sistema (Firestore / LocalStorage)
  try {
    const allApps = getUserApplications();
    const jobApps = allApps.filter(a => String(a.jobId) === idStr || (jobId && a.jobId == jobId));
    if (jobApps.length > 0) {
      const merged = [...list];
      jobApps.forEach(app => {
        const candId = app.id || app.candidateUid;
        if (!merged.find(c => String(c.id) === String(candId))) {
          const stageMap = {
            'Candidatura Enviada': 'triagem',
            'Triagem de Currículo': 'analise',
            'Entrevista': 'entrevista',
            'Desafio Técnico': 'desafio',
            'Aprovado': 'aprovado',
            'Proposta / Admissão': 'aprovado',
            'Banco de Talentos': 'reprovado'
          };
          const candSkills = safeSkillsArray(app.skills || app.candidateSkills || ['React', 'JavaScript']);
          const targetJob = getJobById(jobId);
          const computedScore = typeof app.matchScore === 'number' && app.matchScore > 0
            ? app.matchScore
            : calculateMatchScore(candSkills, targetJob ? targetJob.requiredSkills : [], {
                userCity: app.candidateCity,
                jobCity: targetJob ? targetJob.city : 'Ivaiporã',
                isVerifiedStudent: app.isVerifiedStudent ?? true
              });

          merged.push({
            id: candId,
            firestoreApplicationId: app.firestoreId || app.id,
            name: app.candidateName || 'Candidato Ivaí Conecta',
            course: app.candidateCourse || 'Análise e Desenvolvimento de Sistemas',
            institution: app.candidateInstitution || 'IFPR Campus Ivaiporã',
            city: app.candidateCity || 'Ivaiporã',
            avatar: app.candidateAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            matchScore: computedScore,
            stage: app.stage || stageMap[app.status] || 'triagem',
            appliedAt: app.appliedAt || new Date().toLocaleDateString('pt-BR'),
            phone: app.candidatePhone || '5543999887766',
            email: app.candidateEmail || 'candidato@ivaiconecta.com.br',
            isVerifiedStudent: app.isVerifiedStudent ?? true,
            rating: app.rating || 4,
            notes: app.notes || app.nextStepNote || 'Candidatura realizada através do portal.',
            skills: candSkills.length > 0 ? candSkills : ['React', 'JavaScript', 'Git'],
            activity: app.activity || [
              { date: app.appliedAt || 'Hoje', text: 'Candidatura submetida via Ivaí Conecta' }
            ],
            interview: app.interview || null,
            endorsements: app.endorsements || []
          });
        }
      });
      list = merged;
    }
  } catch {}

  return list;
}

export function updateCandidateStage(jobId, candidateId, newStage) {
  const map = { ...getAllJobCandidatesMap() };
  const idStr = String(jobId || '');
  let currentList = map[jobId] || (jobId ? map[Number(jobId)] : null) || (idStr ? map[idStr] : null);
  if (!currentList || currentList.length === 0) {
    currentList = getJobCandidates(jobId);
  }
  
  const normalizedStage = newStage === 'banco_talentos' ? 'reprovado' : newStage;

  const stageNameMap = {
    triagem: 'Triagem / Novos',
    analise: 'Em Análise',
    entrevista: 'Entrevista Agendada',
    desafio: 'Desafio Técnico',
    aprovado: 'Aprovados',
    reprovado: 'Banco de Talentos',
    banco_talentos: 'Banco de Talentos'
  };

  const updatedList = currentList.map(cand => {
    if (cand.id === candidateId || String(cand.id) === String(candidateId)) {
      const newActivity = [
        ...(cand.activity || []),
        { date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), text: `Candidato movido para a etapa: ${stageNameMap[normalizedStage] || normalizedStage}` }
      ];
      // Sincroniza em background no Firestore caso seja uma aplicação real
      const appDocId = cand.firestoreApplicationId || cand.id;
      if (appDocId) {
        try {
          updateDoc(doc(db, 'applications', String(appDocId)), {
            stage: normalizedStage,
            status: stageNameMap[normalizedStage] || normalizedStage,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        } catch {}
      }

      return { ...cand, stage: normalizedStage, activity: newActivity };
    }
    return cand;
  });

  map[jobId] = updatedList;
  if (idStr) map[idStr] = updatedList;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return updatedList;
}

export function reorderCandidateStage(jobId, candidateId, targetCandidateId, newStage) {
  const map = { ...getAllJobCandidatesMap() };
  const idStr = String(jobId || '');
  let currentList = [...(map[jobId] || (jobId ? map[Number(jobId)] : null) || (idStr ? map[idStr] : null) || getJobCandidates(jobId))];
  
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
  if (idStr) map[idStr] = currentList;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return currentList;
}

export function updateCandidateData(jobId, candidateId, patchData) {
  const map = { ...getAllJobCandidatesMap() };
  const idStr = String(jobId || '');
  let currentList = map[jobId] || (jobId ? map[Number(jobId)] : null) || (idStr ? map[idStr] : null) || getJobCandidates(jobId);

  const updatedList = currentList.map(cand => {
    if (cand.id === candidateId || String(cand.id) === String(candidateId)) {
      return { ...cand, ...patchData };
    }
    return cand;
  });

  map[jobId] = updatedList;
  if (idStr) map[idStr] = updatedList;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return updatedList;
}

export function scheduleCandidateInterview(jobId, candidateId, interviewData) {
  const map = { ...getAllJobCandidatesMap() };
  const idStr = String(jobId || '');
  let currentList = map[jobId] || (jobId ? map[Number(jobId)] : null) || (idStr ? map[idStr] : null) || getJobCandidates(jobId);

  const updatedList = currentList.map(cand => {
    if (cand.id === candidateId || String(cand.id) === String(candidateId)) {
      const newActivity = [
        ...(cand.activity || []),
        { date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), text: `Entrevista agendada para ${interviewData.date} às ${interviewData.time} (${interviewData.format})` }
      ];

      const appDocId = cand.firestoreApplicationId || cand.id;
      if (appDocId) {
        try {
          updateDoc(doc(db, 'applications', String(appDocId)), {
            stage: 'entrevista',
            interview: interviewData,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        } catch {}
      }

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
  if (idStr) map[idStr] = updatedList;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOB_CANDIDATES, JSON.stringify(map));
  }
  return updatedList;
}

export function updateJob(jobId, patchData) {
  const jobs = getJobs('Todas as Cidades');
  const idStr = String(jobId);
  const updated = jobs.map(j => {
    if (j.id === Number(jobId) || j.id === jobId || String(j.id) === idStr || (j.firestoreId && String(j.firestoreId) === idStr)) {
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
    window.dispatchEvent(new CustomEvent('ivai_jobs_updated', { detail: updated }));
  }
  return updated;
}

export function duplicateJob(jobId) {
  const job = getJobById(jobId);
  if (!job) return null;
  const newJob = {
    ...job,
    title: `${job.title} (Cópia)`,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    status: 'Ativa',
    applicantsCount: 0
  };
  delete newJob.id;
  delete newJob.firestoreId;
  return addJob(newJob);
}

export const STORAGE_KEY_JOB_CUSTOM_STAGES = 'ivai_conecta_job_stages_map';

export function getAllJobCustomStagesMap() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOB_CUSTOM_STAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const cleaned = {};
        for (const k of Object.keys(parsed)) {
          if (Array.isArray(parsed[k])) {
            cleaned[k] = parsed[k].map(sanitizeStageItem);
          }
        }
        return cleaned;
      }
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

  if (stagesToReturn && Array.isArray(stagesToReturn)) {
    return stagesToReturn.map(sanitizeStageItem);
  }

  // 3. Fallback to default company stages
  return getCompanyCustomStages();
}

export function saveJobCustomStages(jobId, stages) {
  if (!jobId || !Array.isArray(stages)) return stages;
  const cleaned = stages.map(sanitizeStageItem);

  // 1. Save in map
  if (typeof localStorage !== 'undefined') {
    try {
      const map = { ...getAllJobCustomStagesMap() };
      map[jobId] = cleaned;
      map[String(jobId)] = cleaned;
      localStorage.setItem(STORAGE_KEY_JOB_CUSTOM_STAGES, JSON.stringify(map));
    } catch {}
  }

  // 2. Save in job item
  updateJob(jobId, { customStages: cleaned });

  return cleaned;
}

export function getCompanyCustomStages() {
  if (typeof localStorage === 'undefined') return SELECTION_STAGES.map(sanitizeStageItem);
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANY_CUSTOM_STAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.map(sanitizeStageItem);
        if (JSON.stringify(cleaned) !== raw) {
          localStorage.setItem(STORAGE_KEY_COMPANY_CUSTOM_STAGES, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch {}
  return SELECTION_STAGES.map(sanitizeStageItem);
}

export function saveCompanyCustomStages(stages) {
  if (!Array.isArray(stages)) return SELECTION_STAGES.map(sanitizeStageItem);
  const cleaned = stages.map(sanitizeStageItem);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY_CUSTOM_STAGES, JSON.stringify(cleaned));
    } catch {}
  }
  return cleaned;
}
