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
import { validateProfessionalText, validateJobTitle, validateSkill } from './jobTaxonomy.js';
import { calculateMatchScore, safeSkillsArray } from './matchService.js';

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
  const rawRequiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.map(s => String(s || '').trim()).filter(Boolean)
    : (typeof job.requiredSkills === 'string'
      ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : []);

  // Remove qualquer habilidade com palavrão, termos troll ou sequências numéricas (ex: cubosta123)
  const safeRequiredSkills = rawRequiredSkills.filter(s => validateSkill(s).valid);

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
  const rawSkills = Array.isArray(jobData?.requiredSkills) ? jobData.requiredSkills : [];
  const cleanSkills = rawSkills.filter(s => validateSkill(s).valid);

  const newJob = {
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtTimestamp: Date.now(),
    status: 'Ativa',
    applicantsCount: 0,
    ...jobData,
    requiredSkills: cleanSkills.length > 0 ? cleanSkills : ['Comunicação Assertiva']
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

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(updated));
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

  const candidateSkills = safeSkillsArray(user.skills);
  const requiredSkills = safeSkillsArray(job ? job.requiredSkills : []);
  const calculatedScore = calculateMatchScore(candidateSkills, requiredSkills, {
    userCity: user.city,
    jobCity: job?.city,
    isVerifiedStudent: user.isVerifiedStudent,
    endorsementsCount: (user.endorsements?.length || user.endorsementCount || 0),
    modality: job?.modality
  });

  const newApp = {
    jobId: String(jobId),
    candidateUid: userUid,
    candidateName: user.name || 'Candidato Ivaí Conecta',
    candidateEmail: user.email || '',
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
  const updated = [newApp, ...allApps];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));
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
    parsed = deepSanitizeMojibake(parsed);
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

  // 2. Se a lista ainda estiver vazia (vaga recém-criada em modo de teste),
  // disponibiliza candidatos de demonstração para a empresa poder testar as etapas
  if (list.length === 0) {
    if (INITIAL_JOB_CANDIDATES[jobId]) {
      return deepSanitizeMojibake(INITIAL_JOB_CANDIDATES[jobId]);
    }
    const sample = INITIAL_JOB_CANDIDATES[101] || [];
    return deepSanitizeMojibake(sample.map(c => ({ ...c, jobId: idStr })));
  }

  return list;
}

export function updateCandidateStage(jobId, candidateId, newStage) {
  const map = { ...getAllJobCandidatesMap() };
  const idStr = String(jobId || '');
  let currentList = map[jobId] || (jobId ? map[Number(jobId)] : null) || (idStr ? map[idStr] : null);
  if (!currentList || currentList.length === 0) {
    currentList = getJobCandidates(jobId);
  }
  
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

      // Sincroniza em background no Firestore caso seja uma aplicação real
      const appDocId = cand.firestoreApplicationId || cand.id;
      if (appDocId) {
        try {
          updateDoc(doc(db, 'applications', String(appDocId)), {
            stage: newStage,
            status: stageNameMap[newStage] || newStage,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        } catch {}
      }

      return { ...cand, stage: newStage, activity: newActivity };
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
