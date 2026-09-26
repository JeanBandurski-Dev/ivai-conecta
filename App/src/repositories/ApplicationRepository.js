/**
 * @file ApplicationRepository.js
 * @description Repositório de dados para a coleção 'applications' (Candidaturas e Funil de Vagas).
 */

import { where, query, getDocs } from 'firebase/firestore';
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
      const all = await this.findAll();
      return all
        .map(normalizeApplicationDTO)
        .filter(a => String(a.jobId) === idStr || String(a.firestoreJobId) === idStr);
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
   * Transiciona uma candidatura de estágio no funil de seleção.
   * @param {string} applicationId
   * @param {string} newStage - ApplicationStage
   * @param {string} [feedback]
   * @returns {Promise<Object>}
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
