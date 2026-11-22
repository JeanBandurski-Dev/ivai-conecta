/**
 * @file ApplicationRepository.js
 * @description Repositório de dados para a coleção 'applications' (Candidaturas e Funil de Vagas).
 */

import {
  where,
  query,
  getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase.js';
import { BaseRepository, handleFirestoreError } from './BaseRepository.js';
import {
  normalizeApplicationDTO,
  validateApplicationDTO,
  validateStageTransitionDTO,
} from '../models/ApplicationDTO.js';
import { ApplicationStage, ApplicationStatus } from '../models/enums.js';

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
        : query(this.collectionRef, where('candidateId', '==', key));

      const snap = await getDocs(q);
      let apps = snap.docs.map(d => normalizeApplicationDTO({ id: d.id, firestoreId: d.id, ...d.data() }));

      // Se buscou por UID mas pode haver registros com candidateUid legado
      if (!isEmail && apps.length === 0) {
        const qLegacy = query(this.collectionRef, where('candidateUid', '==', key));
        const snapLegacy = await getDocs(qLegacy);
        apps = snapLegacy.docs.map(d => normalizeApplicationDTO({ id: d.id, firestoreId: d.id, ...d.data() }));
      }

      return apps;
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
   * Cria a candidatura e atualiza o contador da vaga em uma unica transacao.
   * O ID deterministico impede candidaturas simultaneas duplicadas.
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
      const data = result.data || {};
      return normalizeApplicationDTO({ ...normalized, id: data.id, firestoreId: data.id });
    } catch (err) {
      if (err?.code === 'already-exists') throw err;
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
      where(isEmail ? 'candidateEmail' : 'candidateId', '==', isEmail ? key.toLowerCase() : key)
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
