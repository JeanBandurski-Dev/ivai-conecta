// Jobs & Applications Service for Ivaí Conecta (Firestore Realtime)
import { db, auth } from '../lib/firebase.js';
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
import { STORAGE_KEY_JOBS, STORAGE_KEY_APPLICATIONS, STORAGE_KEY_AUTH_USER, STORAGE_KEY_USERS_DB } from '../data/seedData.js';
import {
  validateJobTitle,
  validateSkill,
  validateSalary,
  validatePhoneNumber,
  validateJobDescription,
  validateResponsibility,
  validateWorkingHours,
  validateBenefit,
  STANDARD_WORKING_HOURS,
  hasProfanity
} from './jobTaxonomy.js';
import { calculateMatchScore, safeSkillsArray } from './matchService.js';
import { matchCity } from '../utils/searchUtils.js';

export const STORAGE_KEY_DELETED_JOBS = 'ivai_conecta_deleted_job_ids';
export const STORAGE_KEY_JOB_STATUSES = 'ivai_conecta_job_statuses';

// Cache em memória como fallback quando localStorage estiver cheio
let _memJobsCache = null;
let _memAppsCache = null;

function getAuthUserSafe() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getUsersDBSafe() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

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
export function subscribeToApplications(candidateUserOrUid, callback) {
  let candidateUid = '';
  let candidateEmail = '';

  if (typeof candidateUserOrUid === 'string') {
    if (candidateUserOrUid.includes('@')) {
      candidateEmail = candidateUserOrUid.toLowerCase().trim();
    } else {
      candidateUid = candidateUserOrUid.trim();
    }
  } else if (typeof candidateUserOrUid === 'object' && candidateUserOrUid !== null) {
    candidateUid = String(candidateUserOrUid.uid || candidateUserOrUid.id || '').trim();
    candidateEmail = String(candidateUserOrUid.email || '').toLowerCase().trim();
  }

  if (!candidateUid && auth?.currentUser?.uid) candidateUid = auth.currentUser.uid;
  if (!candidateEmail && auth?.currentUser?.email) candidateEmail = auth.currentUser.email.toLowerCase().trim();
  if (!candidateUid) {
    const authUser = getAuthUserSafe();
    if (authUser?.uid) candidateUid = authUser.uid;
    if (authUser?.email) candidateEmail = String(authUser.email).toLowerCase().trim();
  }

  if (!candidateUid && !candidateEmail) {
    callback(getUserApplications());
    return () => {};
  }

  try {
    const appsRef = collection(db, 'applications');
    const q = candidateUid
      ? query(appsRef, where('candidateUid', '==', candidateUid))
      : query(appsRef, where('candidateEmail', '==', candidateEmail));

    return onSnapshot(q, (snapshot) => {
      const myApps = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        firestoreApplicationId: d.id,
        ...d.data()
      }));

      // Mescla com cache local de applications sem apagar candidaturas de outros contextos
      const currentLocal = getUserApplications();
      const map = new Map();
      myApps.forEach(m => map.set(m.id, m));
      currentLocal.forEach(loc => {
        if (!map.has(loc.id)) map.set(loc.id, loc);
      });
      const updated = Array.from(map.values());
      _memAppsCache = updated;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));
        } catch {}
      }

      callback(myApps);
    }, (error) => {
      console.warn('[Firestore Applications Listener] Offline fallback:', error.message);
      callback(getUserApplications(candidateUid || candidateEmail));
    });
  } catch (error) {
    console.warn('[Firestore Applications Listener] Falha ao assinar candidaturas:', error.message);
    callback(getUserApplications(candidateUid || candidateEmail));
    return () => {};
  }
}

/**
 * Escuta todos os candidatos de uma vaga específica em tempo real via Firestore
 */
export function subscribeToJobApplicants(jobOrId, callback) {
  if (!jobOrId) {
    if (callback) callback([]);
    return () => {};
  }

  let recruiterEmail = '';
  let targetJob = null;
  const targetIds = [];

  if (typeof jobOrId === 'object' && jobOrId !== null) {
    targetJob = jobOrId;
    if (jobOrId.id) targetIds.push(String(jobOrId.id));
    if (jobOrId.firestoreId) targetIds.push(String(jobOrId.firestoreId));
    if (jobOrId.originalJobId) targetIds.push(String(jobOrId.originalJobId));
    if (jobOrId.recruiterEmail) recruiterEmail = String(jobOrId.recruiterEmail).toLowerCase().trim();
  } else {
    const str = String(jobOrId).trim();
    targetIds.push(str);
    targetJob = getJobById(str);
    if (targetJob) {
      if (targetJob.id) targetIds.push(String(targetJob.id));
      if (targetJob.firestoreId) targetIds.push(String(targetJob.firestoreId));
      if (targetJob.originalJobId) targetIds.push(String(targetJob.originalJobId));
      if (targetJob.recruiterEmail) recruiterEmail = String(targetJob.recruiterEmail).toLowerCase().trim();
    }
  }

  if (!recruiterEmail) {
    recruiterEmail = String(auth?.currentUser?.email || getAuthUserSafe()?.email || '').toLowerCase().trim();
  }
  if (!recruiterEmail && targetJob?.createdBy) {
    const cachedUsers = getUsersDBSafe();
    const foundUser = cachedUsers.find(u => u.uid === targetJob.createdBy || u.id === targetJob.createdBy);
    if (foundUser?.email) recruiterEmail = String(foundUser.email).toLowerCase().trim();
  }

  const cleanIds = Array.from(new Set(targetIds.filter(Boolean)));

  if (!recruiterEmail) {
    const allApps = getUserApplications();
    const matched = allApps.filter(a => {
      const aJobId = String(a.jobId || '');
      const aFsId = a.firestoreJobId ? String(a.firestoreJobId) : '';
      const aOrigId = a.originalJobId ? String(a.originalJobId) : '';
      return cleanIds.some(tid => tid === aJobId || tid === aFsId || tid === aOrigId);
    });
    if (callback) callback(matched);
    return () => {};
  }

  try {
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, where('recruiterEmail', '==', recruiterEmail));

    return onSnapshot(q, (snapshot) => {
      const applicants = snapshot.docs
        .map(d => ({
          id: d.id,
          firestoreId: d.id,
          firestoreApplicationId: d.id,
          ...d.data()
        }))
        .filter(app => {
          const aJobId = String(app.jobId || '');
          const aFsId = app.firestoreJobId ? String(app.firestoreJobId) : '';
          const aOrigId = app.originalJobId ? String(app.originalJobId) : '';
          return cleanIds.some(tid => tid === aJobId || tid === aFsId || tid === aOrigId);
        });

      // Também sincroniza com cache local de applications
      const currentLocal = getUserApplications();
      const map = new Map();
      applicants.forEach(a => map.set(a.id, a));
      currentLocal.forEach(loc => {
        if (!map.has(loc.id)) map.set(loc.id, loc);
      });
      const merged = Array.from(map.values());
      _memAppsCache = merged;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(merged));
        } catch {}
      }

      callback(applicants);
    }, (error) => {
      console.warn('[Firestore Job Applicants Listener] Erro:', error.message);
      const allApps = getUserApplications();
      const matched = allApps.filter(a => {
        const aJobId = String(a.jobId || '');
        const aFsId = a.firestoreJobId ? String(a.firestoreJobId) : '';
        const aOrigId = a.originalJobId ? String(a.originalJobId) : '';
        return cleanIds.some(tid => tid === aJobId || tid === aFsId || tid === aOrigId);
      });
      callback(matched);
    });
  } catch (error) {
    console.warn('[Firestore Job Applicants] Falha ao assinar:', error.message);
    if (callback) callback([]);
    return () => {};
  }
}

/**
 * Escuta todas as candidaturas pertinentes a uma empresa em tempo real via Firestore
 */
export function subscribeToCompanyApplications(companyUserOrUid, callback) {
  if (!callback) return () => {};

  let email = '';
  let uid = '';

  if (typeof companyUserOrUid === 'object' && companyUserOrUid !== null) {
    email = String(companyUserOrUid.email || '').toLowerCase().trim();
    uid = String(companyUserOrUid.uid || companyUserOrUid.id || '').trim();
  } else if (typeof companyUserOrUid === 'string') {
    if (companyUserOrUid.includes('@')) {
      email = companyUserOrUid.toLowerCase().trim();
    } else {
      uid = companyUserOrUid.trim();
    }
  }

  // Fallbacks para usuário logado no auth do Firebase ou cache de sessão
  if (!email && auth?.currentUser?.email) {
    email = String(auth.currentUser.email).toLowerCase().trim();
  }
  if (!uid && auth?.currentUser?.uid) {
    uid = String(auth.currentUser.uid).trim();
  }
  if (!email) {
    const authUser = getAuthUserSafe();
    if (authUser?.email) email = String(authUser.email).toLowerCase().trim();
    if (authUser?.uid) uid = String(authUser.uid).trim();
  }
  if (!email && uid) {
    const cachedUsers = getUsersDBSafe();
    const foundUser = cachedUsers.find(u => u.uid === uid || u.id === uid);
    if (foundUser?.email) email = String(foundUser.email).toLowerCase().trim();
  }

  if (!email) {
    const cached = getUserApplications();
    callback(cached, cached);
    return () => {};
  }

  try {
    const appsRef = collection(db, 'applications');
    // Consulta filtrada estrita compatível com as regras de segurança do Firestore (recruiterEmail == auth.token.email)
    const q = query(appsRef, where('recruiterEmail', '==', email));

    return onSnapshot(q, (snapshot) => {
      const companyApps = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        firestoreApplicationId: d.id,
        ...d.data()
      }));

      // Mescla com cache local para manter persistência resiliente
      const currentLocal = getUserApplications();
      const map = new Map();
      companyApps.forEach(a => map.set(a.id, a));
      currentLocal.forEach(a => {
        if (!map.has(a.id)) map.set(a.id, a);
      });
      const merged = Array.from(map.values());

      _memAppsCache = merged;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(merged));
        } catch {}
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ivai_applications_updated', { detail: merged }));
      }

      callback(companyApps, merged);
    }, (error) => {
      console.warn('[Firestore Company Applications Listener] Offline fallback:', error.message);
      const cached = getUserApplications();
      callback(cached, cached);
    });
  } catch (error) {
    console.warn('[Firestore Company Applications] Falha ao assinar:', error.message);
    const cached = getUserApplications();
    callback(cached, cached);
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
  if (!jobData || typeof jobData !== 'object') {
    throw new Error('Dados da vaga inválidos.');
  }

  // Validação estrita defensiva de título
  const titleClean = String(jobData.title || '').trim();
  const titleVal = validateJobTitle(titleClean);
  if (!titleVal.valid) {
    throw new Error(titleVal.error);
  }

  // Validação estrita defensiva de descrição
  if (jobData.description) {
    const descClean = String(jobData.description).trim();
    const descVal = validateJobDescription(descClean);
    if (!descVal.valid) {
      throw new Error(descVal.error);
    }
  }

  // Validação estrita defensiva de telefone
  if (jobData.recruiterPhone && String(jobData.recruiterPhone).trim()) {
    const phoneVal = validatePhoneNumber(String(jobData.recruiterPhone), false);
    if (!phoneVal.valid) {
      throw new Error(phoneVal.error);
    }
  }

  // Validação estrita defensiva de remuneração
  if (jobData.salary && String(jobData.salary).trim()) {
    const salVal = validateSalary(String(jobData.salary), false);
    if (!salVal.valid) {
      throw new Error(salVal.error);
    }
  }

  // Validação de jornada de trabalho
  if (jobData.workingHours && String(jobData.workingHours).trim()) {
    const whVal = validateWorkingHours(String(jobData.workingHours));
    if (!whVal.valid) {
      throw new Error(whVal.error);
    }
  }

  // Validação de benefícios
  if (Array.isArray(jobData.benefits) && jobData.benefits.length > 0) {
    for (const b of jobData.benefits) {
      const bVal = validateBenefit(b);
      if (!bVal.valid) {
        throw new Error(bVal.error);
      }
    }
  }

  // Validação de atividades / responsabilidades
  if (Array.isArray(jobData.responsibilities) && jobData.responsibilities.length > 0) {
    for (const r of jobData.responsibilities) {
      const rVal = validateResponsibility(r);
      if (!rVal.valid) {
        throw new Error(rVal.error);
      }
    }
  }

  const currentJobs = getJobs('Todas as Cidades') || [];
  const rawSkills = Array.isArray(jobData?.requiredSkills) ? jobData.requiredSkills : [];
  // Valida cada habilidade contra a base profissional
  const cleanSkills = rawSkills
    .map(s => String(s || '').trim())
    .filter(s => s && validateSkill(s).valid);

  // Sanitiza dados de entrada removendo qualquer chave com valor undefined
  const cleanData = {};
  Object.keys(jobData).forEach(key => {
    if (jobData[key] !== undefined) {
      cleanData[key] = jobData[key];
    }
  });

  const workingHours = jobData.workingHours && typeof jobData.workingHours === 'string' && jobData.workingHours.trim()
    ? jobData.workingHours.trim()
    : (STANDARD_WORKING_HOURS[0] || '44h semanais • 08:00 às 18:00 (Segunda a Sexta / CLT Comercial)');

  const newJob = {
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtTimestamp: Date.now(),
    status: 'Ativa',
    applicantsCount: 0,
    ...cleanData,
    title: titleClean,
    workingHours,
    requiredSkills: cleanSkills.length > 0 ? cleanSkills : ['Trabalho em Equipe', 'Comunicação Assertiva']
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
  if (Array.isArray(_memAppsCache) && _memAppsCache.length > 0) {
    apps = _memAppsCache;
  } else if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          apps = parsed;
          _memAppsCache = parsed;
        }
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

export async function applyToJob(jobOrId, user) {
  if (!user) {
    return { success: false, message: 'Você precisa estar logado para se candidatar.' };
  }

  const role = String(user.role || '').toLowerCase().trim();
  const isStudent = role === 'aluno' || role === 'estudante' || role === 'student';
  const isStandardCandidate = role === 'candidato';
  const isFreelancer = role === 'freelancer' || role === 'prestador';
  const isCompany = role === 'empresa' || role === 'company' || role === 'recrutador';
  const isProfessor = role === 'professor' || role === 'docente' || role === 'teacher';

  if (isCompany) {
    return { success: false, message: 'Perfis de empresa não podem se candidatar a vagas de emprego.' };
  }
  if (isProfessor) {
    return { success: false, message: 'Perfis de professor/docente não realizam candidaturas a vagas.' };
  }

  const job = typeof jobOrId === 'object' && jobOrId !== null
    ? jobOrId
    : getJobById(jobOrId);
  const jobId = typeof jobOrId === 'object' && jobOrId !== null
    ? (jobOrId.id || jobOrId.firestoreId)
    : jobOrId;
  const jobType = String(job?.type || '').toLowerCase().trim();

  // Regra Freelancer: apenas PJ, Freelance ou Projetos
  if (isFreelancer) {
    const isPjOrFreelance = jobType.includes('pj') || jobType.includes('freelanc') || jobType.includes('projeto') || jobType.includes('prestador');
    if (!isPjOrFreelance) {
      return {
        success: false,
        message: 'Seu perfil está cadastrado como Freelancer (PJ). Esta vaga é no regime CLT / Estágio. Para se candidatar a vagas de emprego formal, acesse suas configurações para alterar seu tipo de perfil ou busque demandas e oportunidades PJ.'
      };
    }
  }

  // Regra Candidato convencional: não pode se candidatar a estágio
  if (isStandardCandidate) {
    if (jobType.includes('estágio') || jobType.includes('estagio')) {
      return {
        success: false,
        message: 'Vagas de estágio são exclusivas para estudantes regularmente matriculados (perfil Aluno). Se você é estudante, altere seu perfil para Aluno ou busque oportunidades CLT e Meio Período.'
      };
    }
  }

  // Regra Aluno: estágio exige comprovação de matrícula
  if (isStudent) {
    if ((jobType.includes('estágio') || jobType.includes('estagio')) && !user.isVerifiedStudent) {
      return {
        success: false,
        requiresVerification: true,
        message: 'Para sua segurança e das empresas contratantes, envie sua Declaração de Matrícula nas Configurações para liberar candidaturas de estágio!'
      };
    }
  }

  if (!isStudent && !isStandardCandidate && !isFreelancer) {
    return { success: false, message: 'Apenas perfis de alunos, candidatos e freelancers podem se candidatar a vagas.' };
  }

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
  const companyUid = String(job?.createdBy || job?.companyUid || '');

  let recruiterEmail = String(job?.recruiterEmail || '').toLowerCase().trim();
  if (!recruiterEmail.includes('@') && job?.createdBy) {
    if (String(job.createdBy).includes('@')) {
      recruiterEmail = String(job.createdBy).toLowerCase().trim();
    } else {
      const cachedUsers = getUsersDBSafe();
      const companyUser = cachedUsers.find(u => u.uid === job.createdBy || u.id === job.createdBy);
      if (companyUser?.email) {
        recruiterEmail = String(companyUser.email).toLowerCase().trim();
      }
    }
  }
  if (!recruiterEmail && job?.company) {
    recruiterEmail = String(job.company).toLowerCase().replace(/\s+/g, '') + '@email.com';
  }

  const newApp = {
    jobId: targetJobId,
    firestoreJobId: targetJobId,
    originalJobId: String(job?.id || jobId),
    companyUid: companyUid,
    company: job ? job.company : 'Empresa do Vale do Ivaí',
    companyLogo: job ? (job.companyLogo || '') : '',
    recruiterEmail: recruiterEmail,
    recruiterPhone: job ? (job.recruiterPhone || '') : '',
    candidateUid: userUid,
    candidateId: String(user.id || userUid),
    candidateName: user.name || 'Candidato Ivaí Conecta',
    candidateEmail: userEmail,
    candidateAvatar: user.avatar || '',
    candidateCourse: user.course || (isStudent ? 'Estudante' : 'Profissional'),
    candidateInstitution: user.institution || '',
    candidateCity: user.city || 'Ivaiporã',
    candidatePhone: user.phone || '',
    isVerifiedStudent: Boolean(user.isVerifiedStudent),
    skills: candidateSkills,
    title: job ? job.title : 'Vaga de Emprego',
    city: job ? job.city : 'Ivaiporã',
    type: job ? job.type : 'Tempo Integral',
    appliedAt: new Date().toLocaleDateString('pt-BR'),
    appliedTimestamp: Date.now(),
    matchScore: calculatedScore,
    status: 'Candidatura Enviada',
    stage: 'triagem',
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

  // Sanitiza dados para o Firestore removendo chaves com valores undefined
  const cleanApp = {};
  Object.keys(newApp).forEach(key => {
    if (newApp[key] !== undefined) {
      cleanApp[key] = newApp[key];
    }
  });

  // Grava candidatura no Firestore
  try {
    const docRef = await addDoc(collection(db, 'applications'), cleanApp);
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
  _memAppsCache = updated;
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

export function getJobCandidates(jobOrId) {
  const map = getAllJobCandidatesMap();
  let targetJob = null;
  let targetIds = [];

  if (typeof jobOrId === 'object' && jobOrId !== null) {
    targetJob = jobOrId;
    if (jobOrId.id) targetIds.push(String(jobOrId.id));
    if (jobOrId.firestoreId) targetIds.push(String(jobOrId.firestoreId));
    if (jobOrId.originalJobId) targetIds.push(String(jobOrId.originalJobId));
  } else if (jobOrId) {
    const str = String(jobOrId).trim();
    targetIds.push(str);
    targetJob = getJobById(str);
    if (targetJob) {
      if (targetJob.id) targetIds.push(String(targetJob.id));
      if (targetJob.firestoreId) targetIds.push(String(targetJob.firestoreId));
      if (targetJob.originalJobId) targetIds.push(String(targetJob.originalJobId));
    }
  }

  targetIds = Array.from(new Set(targetIds.filter(Boolean)));
  const primaryId = targetIds[0] || '';

  let list = (primaryId && map[primaryId]) || (targetJob?.id ? map[targetJob.id] : null) || [];
  list = deepSanitizeMojibake(list);

  // 1. Incorpora candidaturas reais gravadas no sistema (Firestore / LocalStorage)
  try {
    const allApps = getUserApplications();
    const jobApps = allApps.filter(a => {
      const aJobId = String(a.jobId || '');
      const aFsId = a.firestoreJobId ? String(a.firestoreJobId) : '';
      const aOrigId = a.originalJobId ? String(a.originalJobId) : '';
      return targetIds.some(tid => tid === aJobId || tid === aFsId || tid === aOrigId);
    });

    if (jobApps.length > 0) {
      const merged = [...list];
      jobApps.forEach(app => {
        const candId = app.id || app.firestoreId || app.candidateUid;
        if (!merged.find(c => String(c.id) === String(candId) || String(c.firestoreApplicationId) === String(candId))) {
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

      // Sincroniza no cache de candidaturas para atualizar visões locais
      try {
        const allApps = getUserApplications();
        const updatedApps = allApps.map(a => {
          if (a.id === appDocId || a.firestoreId === appDocId || String(a.candidateUid) === String(cand.id)) {
            return {
              ...a,
              stage: normalizedStage,
              status: stageNameMap[normalizedStage] || normalizedStage,
              updatedAt: new Date().toISOString()
            };
          }
          return a;
        });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updatedApps));
        }
      } catch {}

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
      const appDocId = cand.firestoreApplicationId || cand.id;
      if (appDocId) {
        try {
          updateDoc(doc(db, 'applications', String(appDocId)), {
            ...patchData,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        } catch {}
      }
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
  if (patchData && typeof patchData === 'object') {
    if (patchData.title) {
      const titleClean = String(patchData.title).trim();
      const titleVal = validateJobTitle(titleClean);
      if (!titleVal.valid) {
        throw new Error(titleVal.error);
      }
    }
    if (patchData.description) {
      const descClean = String(patchData.description).trim();
      const descVal = validateJobDescription(descClean);
      if (!descVal.valid) {
        throw new Error(descVal.error);
      }
    }
    if (patchData.recruiterPhone && String(patchData.recruiterPhone).trim()) {
      const phoneVal = validatePhoneNumber(String(patchData.recruiterPhone), false);
      if (!phoneVal.valid) {
        throw new Error(phoneVal.error);
      }
    }
    if (patchData.salary && String(patchData.salary).trim()) {
      const salVal = validateSalary(String(patchData.salary), false);
      if (!salVal.valid) {
        throw new Error(salVal.error);
      }
    }
    if (patchData.workingHours && String(patchData.workingHours).trim()) {
      const whVal = validateWorkingHours(String(patchData.workingHours));
      if (!whVal.valid) {
        throw new Error(whVal.error);
      }
    }
    if (Array.isArray(patchData.benefits) && patchData.benefits.length > 0) {
      for (const b of patchData.benefits) {
        const bVal = validateBenefit(b);
        if (!bVal.valid) {
          throw new Error(bVal.error);
        }
      }
    }
    if (Array.isArray(patchData.responsibilities) && patchData.responsibilities.length > 0) {
      for (const r of patchData.responsibilities) {
        const rVal = validateResponsibility(r);
        if (!rVal.valid) {
          throw new Error(rVal.error);
        }
      }
    }
  }

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
