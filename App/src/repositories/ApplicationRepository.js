/**
 * @file ApplicationRepository.js
 * @description Repositório de dados para a coleção 'applications' (Candidaturas e Funil de Vagas).
 */

import {
  doc,
  getDoc,
  setDoc,
  where,
  query,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../lib/firebase.js';
import { BaseRepository, handleFirestoreError } from './BaseRepository.js';
import {
  normalizeApplicationDTO,
  validateApplicationDTO,
  validateStageTransitionDTO,
} from '../models/ApplicationDTO.js';
import { ApplicationStage, ApplicationStatus } from '../models/enums.js';

const ALLOWED_APPLICATION_CREATE_KEYS = new Set([
  'id', 'firestoreId', 'jobId', 'firestoreJobId', 'originalJobId',
  'companyUid', 'company', 'companyLogo', 'recruiterEmail', 'recruiterUid', 'recruiterPhone',
  'candidateUid', 'candidateId', 'candidateName', 'candidateRole', 'candidateEmail',
  'candidateAvatar', 'candidateCourse', 'candidateInstitution', 'candidateCity', 'candidatePhone',
  'isVerifiedStudent', 'skills', 'title', 'city', 'type', 'appliedAt', 'appliedTimestamp',
  'matchScore', 'status', 'stage', 'statusClass', 'currentStageIndex', 'nextStepNote', 'stages',
  'createdAt', 'updatedAt', '_timestamp',
]);

const ALLOWED_INITIAL_STATUSES = new Set([
  'Pendente',
  'Enviada',
  'Candidatura Enviada',
  'Proposta PJ Enviada',
  'Em Análise',
  'Triagem de Currículo',
]);

function isCallableUnavailableError(err) {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  // Rejeições explícitas de regra de negócio NÃO devem acionar fallback
  if (
    code.includes('already-exists') ||
    code.includes('failed-precondition') ||
    code.includes('invalid-argument') ||
    code.includes('permission-denied') ||
    code.includes('unauthenticated')
  ) {
    return false;
  }
  return (
    code.includes('not-found') ||
    code.includes('unavailable') ||
    code.includes('unimplemented') ||
    code.includes('internal') ||
    code.includes('unknown') ||
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('cors') ||
    msg.includes('failed to fetch') ||
    msg.includes('network')
  );
}

export class ApplicationRepository extends BaseRepository {
  constructor() {
    super('applications');
  }

  /**
   * Busca todas as candidaturas de um estudante por UID ou e-mail.
   * @param {string} candidateUidOrEmail
   * @returns {Promise<Array<Object>>}
   */
  async findByCandidate(candidateUidOrEmail) {
    if (!candidateUidOrEmail) return [];
    const key = String(candidateUidOrEmail).trim();
    const isEmail = key.includes('@');

    try {
      const q = isEmail
        ? query(this.collectionRef, where('candidateEmail', '==', key.toLowerCase()))
        : query(this.collectionRef, where('candidateUid', '==', key));

      const snap = await getDocs(q);
      return snap.docs.map(d => normalizeApplicationDTO({ id: d.id, firestoreId: d.id, ...d.data() }));
    } catch (err) {
      throw handleFirestoreError(err, 'findByCandidate', this.collectionName);
    }
  }

  /**
   * Busca todas as candidaturas para uma vaga específica.
   * @param {string|number} jobId
   * @returns {Promise<Array<Object>>}
   */
  async findByJobId(jobId) {
    if (!jobId) return [];
    const idStr = String(jobId).trim();
    try {
      const [byJobId, byFirestoreJobId] = await Promise.all([
        getDocs(query(this.collectionRef, where('jobId', '==', idStr))),
        getDocs(query(this.collectionRef, where('firestoreJobId', '==', idStr))),
      ]);

      const applications = new Map();
      [...byJobId.docs, ...byFirestoreJobId.docs].forEach((snapshot) => {
        applications.set(snapshot.id, normalizeApplicationDTO({
          id: snapshot.id,
          firestoreId: snapshot.id,
          ...snapshot.data(),
        }));
      });

      return [...applications.values()];
    } catch (err) {
      throw handleFirestoreError(err, 'findByJobId', this.collectionName);
    }
  }

  /**
   * Verifica se o candidato já se inscreveu na vaga.
   * @param {string|number} jobId
   * @param {string} candidateUid
   * @param {string} candidateEmail
   * @returns {Promise<boolean>}
   */
  async hasApplied(jobId, candidateUid, candidateEmail = '') {
    const apps = await this.findByCandidate(candidateUid || candidateEmail);
    const targetJobId = String(jobId);
    return apps.some(a => String(a.jobId) === targetJobId || String(a.firestoreJobId) === targetJobId);
  }

  /**
   * Registra uma nova candidatura com validação e normalização de DTO.
   * @param {Object} rawData
   * @returns {Promise<Object>}
   */
  async createApplication(rawData) {
    const validation = validateApplicationDTO(rawData);
    if (!validation.isValid) {
      throw new Error(`Validação de candidatura falhou: ${validation.errors.join('; ')}`);
    }

    const normalized = normalizeApplicationDTO(rawData);
    const created = await this.create(normalized);
    return normalizeApplicationDTO(created);
  }

  /**
   * Fallback direto no Cloud Firestore compatível 100% com `firestore.rules`
   * para ambientes sem Cloud Functions implantadas (ex.: plano Spark).
   * @param {Object} normalized
   * @param {string} jobDocId
   * @returns {Promise<Object>}
   */
  async _createApplicationDirectInFirestore(normalized, jobDocId) {
    const cleanJobId = String(jobDocId || '').trim();
    const authUid = String(auth?.currentUser?.uid || normalized.candidateUid || '').trim();
    const authEmail = String(auth?.currentUser?.email || normalized.candidateEmail || '').trim();

    if (!authUid || !authEmail) {
      throw new Error('Sua sessão expirou. Faça login novamente para concluir a candidatura.');
    }

    // 1. Lê o documento oficial da vaga para garantir correspondência exata com `applicationDataMatchesJob`
    const jobSnap = await getDoc(doc(db, 'jobs', cleanJobId));
    if (!jobSnap.exists()) {
      throw new Error('Esta vaga não foi encontrada ou não está mais disponível.');
    }
    const jobData = jobSnap.data() || {};
    if (jobData.status && jobData.status !== 'Ativa') {
      throw new Error('Esta vaga não está mais ativa para novas candidaturas.');
    }

    // 2. Evita duplicidade consultando candidaturas do próprio usuário
    try {
      const alreadyApplied = await this.hasApplied(cleanJobId, authUid, authEmail);
      if (alreadyApplied) {
        const dupErr = new Error('Você já se candidatou a esta vaga!');
        dupErr.code = 'already-exists';
        throw dupErr;
      }
    } catch (dupCheckErr) {
      if (dupCheckErr?.code === 'already-exists') throw dupCheckErr;
    }

    const appId = `${cleanJobId}_${authUid}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const canonicalOwnerUid = String(jobData.createdBy || normalized.recruiterUid || normalized.companyUid || '').trim();
    const canonicalRecruiterEmail = Object.prototype.hasOwnProperty.call(jobData, 'recruiterEmail')
      ? jobData.recruiterEmail
      : (normalized.recruiterEmail || '');
    const initialStatus = ALLOWED_INITIAL_STATUSES.has(normalized.status)
      ? normalized.status
      : 'Candidatura Enviada';

    const merged = {
      ...normalized,
      id: appId,
      firestoreId: appId,
      jobId: cleanJobId,
      firestoreJobId: cleanJobId,
      originalJobId: cleanJobId,
      companyUid: canonicalOwnerUid,
      recruiterUid: canonicalOwnerUid,
      company: String(jobData.company || normalized.company || '').trim(),
      title: String(jobData.title || normalized.title || '').trim(),
      recruiterEmail: canonicalRecruiterEmail,
      candidateUid: authUid,
      candidateId: authUid,
      candidateEmail: authEmail,
      status: initialStatus,
      createdAt: normalized.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _timestamp: serverTimestamp(),
    };

    // Mantém estritamente os campos autorizados em firestore.rules
    const safePayload = {};
    for (const [key, value] of Object.entries(merged)) {
      if (ALLOWED_APPLICATION_CREATE_KEYS.has(key) && value !== undefined) {
        safePayload[key] = value;
      }
    }

    await setDoc(doc(db, 'applications', appId), safePayload);
    return normalizeApplicationDTO({ ...safePayload, id: appId, firestoreId: appId });
  }

  /**
   * Cria a candidatura e atualiza o contador da vaga em uma unica transacao.
   * Tenta a Cloud Function `createJobApplication` primeiro e faz fallback direto no Firestore
   * (respeitando integralmente `firestore.rules`) caso Cloud Functions não estejam implantadas.
   * @param {Object} rawData
   * @param {string} jobDocId
   * @returns {Promise<Object>}
   */
  async createApplicationAtomically(rawData, jobDocId) {
    const validation = validateApplicationDTO(rawData);
    if (!validation.isValid) {
      throw new Error(`Validação de candidatura falhou: ${validation.errors.join('; ')}`);
    }

    const normalized = normalizeApplicationDTO(rawData);
    try {
      const createApplication = httpsCallable(functions, 'createJobApplication');
      const result = await createApplication({
        application: {
          ...normalized,
          jobId: String(jobDocId),
          firestoreJobId: String(jobDocId),
          originalJobId: String(jobDocId),
        },
      });
      const data = result?.data || {};
      if (!data.id) {
        throw Object.assign(new Error('Callable createJobApplication indisponível'), { code: 'functions/not-found' });
      }
      return normalizeApplicationDTO({ ...normalized, id: data.id, firestoreId: data.id });
    } catch (err) {
      if (err?.code === 'already-exists') throw err;

      if (isCallableUnavailableError(err)) {
        try {
          return await this._createApplicationDirectInFirestore(normalized, jobDocId);
        } catch (directErr) {
          if (directErr?.code === 'already-exists') throw directErr;
          throw handleFirestoreError(directErr, 'createApplicationAtomically(direct)', this.collectionName);
        }
      }

      throw handleFirestoreError(err, 'createApplicationAtomically', this.collectionName);
    }
  }

  async withdrawApplication(applicationId, jobId = '') {
    const withdrawApplication = httpsCallable(functions, 'withdrawJobApplication');
    try {
      const result = await withdrawApplication({ applicationId, jobId });
      return result.data;
    } catch (err) {
      throw handleFirestoreError(err, 'withdrawApplication', this.collectionName);
    }
  }

  /**
   * Transiciona uma candidatura de estágio no funil de seleção.
   * @param {string} applicationId
   * @param {string} newStage - ApplicationStage
   * @param {string} [feedback]
   * @returns {Promise<Object>}
   */
  /**
   * @deprecated Não utiliza o fluxo atual de candidatura. O fluxo ativo deve
   * ser localizado no serviço de vagas/candidaturas e deve ser consolidado
   * antes de novas alterações nesta função.
   */
  async updateStage(applicationId, newStage, feedback = '') {
    const validation = validateStageTransitionDTO(newStage);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    const current = await this.findById(applicationId);
    if (!current) throw new Error(`Candidatura não encontrada com ID: ${applicationId}`);

    const history = Array.isArray(current.stageHistory) ? [...current.stageHistory] : [];
    history.push({
      stage: newStage,
      date: new Date().toISOString(),
      note: feedback || `Avançou para ${newStage}`,
    });

    const status = (newStage === ApplicationStage.APROVADO)
      ? ApplicationStatus.APROVADO
      : (newStage === ApplicationStage.REPROVADO)
      ? ApplicationStatus.REJEITADO
      : ApplicationStatus.EM_ANALISE;

    const updates = {
      currentStage: newStage,
      stage: newStage,
      status,
      feedback: feedback || current.feedback || '',
      stageHistory: history,
      updatedAt: new Date().toISOString(),
    };

    await this.update(applicationId, updates);
    return normalizeApplicationDTO({ ...current, ...updates });
  }

  /**
   * Assina candidaturas de um usuário em tempo real.
   * @param {string} candidateUidOrEmail
   * @param {Function} onAppsUpdated
   * @param {Function} [onError]
   * @returns {Function} Unsubscribe
   */
  subscribeToCandidate(candidateUidOrEmail, onAppsUpdated, onError = null) {
    const key = String(candidateUidOrEmail || '').trim();
    const isEmail = key.includes('@');
    const constraints = [
      where(isEmail ? 'candidateEmail' : 'candidateUid', '==', isEmail ? key.toLowerCase() : key)
    ];

    return this.subscribe(
      (docs) => {
        const normalized = docs.map(normalizeApplicationDTO);
        onAppsUpdated(normalized);
      },
      onError,
      constraints
    );
  }
}

export const applicationRepository = new ApplicationRepository();
