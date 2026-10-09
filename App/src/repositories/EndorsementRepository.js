/**
 * @file EndorsementRepository.js
 * @description Repositório de dados para a coleção 'endorsement_requests' (Solicitações e Pareceres de Professores).
 */

import { where, query, getDocs } from 'firebase/firestore';
import { BaseRepository, handleFirestoreError } from './BaseRepository.js';
import {
  normalizeEndorsementRequestDTO,
  validateEndorsementRequestCreateDTO,
} from '../models/EndorsementDTO.js';

export class EndorsementRepository extends BaseRepository {
  constructor() {
    super('endorsement_requests');
  }

  /**
   * Busca todas as solicitações recebidas por um professor (por UID ou e-mail institucional).
   * @param {string} profUidOrEmail
   * @returns {Promise<Array<Object>>}
   */
  async findRequestsForProfessor(profUidOrEmail) {
    if (!profUidOrEmail) return [];
    const key = String(profUidOrEmail).trim();
    const isEmail = key.includes('@');

    try {
      const q = isEmail
        ? query(this.collectionRef, where('profEmail', '==', key.toLowerCase()))
        : query(this.collectionRef, where('profId', '==', key));

      const snap = await getDocs(q);
      let requests = snap.docs.map(d => normalizeEndorsementRequestDTO({ id: d.id, firestoreId: d.id, ...d.data() }));

      if (!isEmail && requests.length === 0) {
        const qLegacy = query(this.collectionRef, where('profUid', '==', key));
        const snapLegacy = await getDocs(qLegacy);
        requests = snapLegacy.docs.map(d => normalizeEndorsementRequestDTO({ id: d.id, firestoreId: d.id, ...d.data() }));
      }

      return requests;
    } catch (err) {
      throw handleFirestoreError(err, 'findRequestsForProfessor', this.collectionName);
    }
  }

  /**
   * Busca todas as solicitações enviadas por um aluno.
   * @param {string} studentId
   * @returns {Promise<Array<Object>>}
   */
  async findRequestsByStudent(studentId) {
    if (!studentId) return [];
    const id = String(studentId).trim();
    try {
      const q = query(this.collectionRef, where('studentId', '==', id));
      const snap = await getDocs(q);
      return snap.docs.map(d => normalizeEndorsementRequestDTO({ id: d.id, firestoreId: d.id, ...d.data() }));
    } catch (err) {
      throw handleFirestoreError(err, 'findRequestsByStudent', this.collectionName);
    }
  }

  /**
   * Cria uma nova solicitação de parecer acadêmico.
   * @param {Object} rawData
   * @returns {Promise<Object>}
   */
  async createRequest(rawData) {
    const validation = validateEndorsementRequestCreateDTO(rawData);
    if (!validation.isValid) {
      throw new Error(`Validação de solicitação falhou: ${validation.errors.join('; ')}`);
    }

    const normalized = normalizeEndorsementRequestDTO(rawData);
    const created = await this.create(normalized);
    return normalizeEndorsementRequestDTO(created);
  }

  /**
   * Atualiza o parecer do professor (Aprovar com quote ou Recusar).
   * @param {string} requestId
   * @param {Object} responsePayload
   * @param {string} responsePayload.status - EndorsementStatus (Aprovado ou Recusado)
   * @param {string} [responsePayload.quote]
   * @returns {Promise<Object>}
   */
  async respondToRequest(requestId, { status, quote = '' }) {
    const req = await this.findById(requestId);
    if (!req) throw new Error(`Solicitação não encontrada: ${requestId}`);

    const updates = {
      status,
      responseQuote: quote,
      quote,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.update(requestId, updates);
    return normalizeEndorsementRequestDTO({ ...req, ...updates });
  }

  /**
   * Assina solicitações de um professor em tempo real.
   * @param {string} profUidOrEmail
   * @param {Function} onRequestsUpdated
   * @param {Function} [onError]
   * @returns {Function} Unsubscribe
   */
  subscribeToTeacherRequests(profUidOrEmail, onRequestsUpdated, onError = null) {
    const key = String(profUidOrEmail || '').trim();
    const isEmail = key.includes('@');
    const constraints = [
      where(isEmail ? 'profEmail' : 'profId', '==', isEmail ? key.toLowerCase() : key)
    ];

    return this.subscribe(
      (docs) => {
        const normalized = docs.map(normalizeEndorsementRequestDTO);
        onRequestsUpdated(normalized);
      },
      onError,
      constraints
    );
  }
}

export const endorsementRepository = new EndorsementRepository();
