/**
 * @file JobRepository.js
 * @description Repositório de dados para a coleção 'jobs' (Vagas de Emprego, Estágio e Trainee).
 */

import { where, query, getDocs } from 'firebase/firestore';
import { BaseRepository, handleFirestoreError } from './BaseRepository.js';
import { normalizeJobDTO, validateJobDTO } from '../models/JobDTO.js';
import { JobStatus } from '../models/enums.js';

export class JobRepository extends BaseRepository {
  constructor() {
    super('jobs');
  }

  /**
   * Busca uma vaga pelo ID do documento ou pelo ID numérico legado.
   * @param {string|number} jobId
   * @returns {Promise<Object|null>}
   */
  async findJobById(jobId) {
    if (!jobId) return null;
    const idStr = String(jobId).trim();

    // 1. Tenta buscar direto pelo doc ID do Firestore
    try {
      const direct = await this.findById(idStr);
      if (direct) return normalizeJobDTO(direct);
    } catch {}

    // 2. Fallback para ID numérico ou string em campo 'id'
    try {
      const qStr = query(this.collectionRef, where('id', '==', idStr));
      const snapStr = await getDocs(qStr);
      if (!snapStr.empty) {
        const d = snapStr.docs[0];
        return normalizeJobDTO({ id: d.id, firestoreId: d.id, ...d.data() });
      }

      const numVal = Number(jobId);
      if (!isNaN(numVal)) {
        const qNum = query(this.collectionRef, where('id', '==', numVal));
        const snapNum = await getDocs(qNum);
        if (!snapNum.empty) {
          const d = snapNum.docs[0];
          return normalizeJobDTO({ id: d.id, firestoreId: d.id, ...d.data() });
        }
      }
    } catch (err) {
      throw handleFirestoreError(err, 'findJobById', this.collectionName);
    }

    return null;
  }

  /**
   * Busca todas as vagas ativas/abertas.
   * @param {Object} [filters]
   * @param {string} [filters.city]
   * @param {string} [filters.companyId]
   * @returns {Promise<Array<Object>>}
   */
  async findJobs(filters = {}) {
    try {
      const constraints = [];

      if (filters.companyId) {
        constraints.push(where('companyId', '==', String(filters.companyId).trim()));
      }

      const rawJobs = await this.findAll(constraints);
      let normalized = rawJobs.map(normalizeJobDTO);

      if (filters.city && filters.city !== 'Todas as Cidades') {
        const cleanCity = filters.city.toLowerCase().trim();
        normalized = normalized.filter(j =>
          String(j.city || '').toLowerCase().trim() === cleanCity ||
          String(j.location || '').toLowerCase().includes(cleanCity)
        );
      }

      return normalized;
    } catch (err) {
      throw handleFirestoreError(err, 'findJobs', this.collectionName);
    }
  }

  /**
   * Busca vagas publicadas por uma determinada empresa.
   * @param {string} companyIdOrUid
   * @returns {Promise<Array<Object>>}
   */
  async findJobsByCompany(companyIdOrUid) {
    if (!companyIdOrUid) return [];
    const targetId = String(companyIdOrUid).trim();
    try {
      const all = await this.findAll();
      return all
        .map(normalizeJobDTO)
        .filter(j => String(j.companyId) === targetId || String(j.companyUid) === targetId);
    } catch (err) {
      throw handleFirestoreError(err, 'findJobsByCompany', this.collectionName);
    }
  }

  /**
   * Cria uma nova vaga no Firestore com validação e normalização de DTO.
   * @param {Object} rawData
   * @returns {Promise<Object>}
   */
  async createJob(rawData) {
    const validation = validateJobDTO(rawData);
    if (!validation.isValid) {
      throw new Error(`Validação de vaga falhou: ${validation.errors.join('; ')}`);
    }

    const normalized = normalizeJobDTO(rawData);
    const created = await this.create(normalized);
    return normalizeJobDTO(created);
  }

  /**
   * Atualiza o status de uma vaga (Ativa, Pausada, Encerrada).
   * @param {string|number} jobId
   * @param {string} newStatus - JobStatus
   * @returns {Promise<Object>}
   */
  async updateJobStatus(jobId, newStatus) {
    const job = await this.findJobById(jobId);
    if (!job) throw new Error(`Vaga não encontrada com ID: ${jobId}`);

    const targetDocId = job.firestoreId || job.id;
    await this.update(targetDocId, { status: newStatus });
    return { ...job, status: newStatus };
  }

  /**
   * Assina todas as vagas em tempo real.
   * @param {Function} onJobsUpdated
   * @param {Function} [onError]
   * @returns {Function} Unsubscribe
   */
  subscribeToJobs(onJobsUpdated, onError = null) {
    return this.subscribe(
      (docs) => {
        const normalized = docs.map(normalizeJobDTO);
        onJobsUpdated(normalized);
      },
      onError
    );
  }
}

export const jobRepository = new JobRepository();
