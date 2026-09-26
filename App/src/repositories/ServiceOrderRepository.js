/**
 * @file ServiceOrderRepository.js
 * @description Repositório de dados para a coleção 'service_orders' (Ordens de Contratação de Serviços).
 */

import { where, query, getDocs } from 'firebase/firestore';
import { BaseRepository, handleFirestoreError } from './BaseRepository.js';
import { normalizeServiceOrderDTO, validateServiceOrderDTO } from '../models/ServiceOrderDTO.js';
import { ServiceOrderStatus } from '../models/enums.js';

export class ServiceOrderRepository extends BaseRepository {
  constructor() {
    super('service_orders');
  }

  /**
   * Busca ordens contratadas por um determinado cliente.
   * @param {string} clientId
   * @returns {Promise<Array<Object>>}
   */
  async findByClient(clientId) {
    if (!clientId) return [];
    try {
      const q = query(this.collectionRef, where('clientId', '==', String(clientId).trim()));
      const snap = await getDocs(q);
      return snap.docs.map(d => normalizeServiceOrderDTO({ id: d.id, firestoreId: d.id, ...d.data() }));
    } catch (err) {
      throw handleFirestoreError(err, 'findByClient', this.collectionName);
    }
  }

  /**
   * Busca ordens recebidas por um prestador de serviço.
   * @param {string} providerId
   * @returns {Promise<Array<Object>>}
   */
  async findByProvider(providerId) {
    if (!providerId) return [];
    try {
      const q = query(this.collectionRef, where('providerId', '==', String(providerId).trim()));
      const snap = await getDocs(q);
      return snap.docs.map(d => normalizeServiceOrderDTO({ id: d.id, firestoreId: d.id, ...d.data() }));
    } catch (err) {
      throw handleFirestoreError(err, 'findByProvider', this.collectionName);
    }
  }

  /**
   * Cria uma nova ordem de serviço com validação e normalização.
   * @param {Object} rawData
   * @returns {Promise<Object>}
   */
  async createOrder(rawData) {
    const validation = validateServiceOrderDTO(rawData);
    if (!validation.isValid) {
      throw new Error(`Validação de ordem de serviço falhou: ${validation.errors.join('; ')}`);
    }

    const normalized = normalizeServiceOrderDTO(rawData);
    const created = await this.create(normalized);
    return normalizeServiceOrderDTO(created);
  }

  /**
   * Atualiza o status da ordem de serviço.
   * @param {string} orderId
   * @param {string} newStatus - ServiceOrderStatus
   * @returns {Promise<Object>}
   */
  async updateStatus(orderId, newStatus) {
    const order = await this.findById(orderId);
    if (!order) throw new Error(`Ordem não encontrada: ${orderId}`);

    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === ServiceOrderStatus.CONCLUIDO) {
      updates.completedAt = new Date().toISOString();
    }

    await this.update(orderId, updates);
    return normalizeServiceOrderDTO({ ...order, ...updates });
  }

  /**
   * Assina ordens de um usuário (como cliente ou prestador).
   * @param {string} userId
   * @param {string} [roleField='clientId']
   * @param {Function} onOrdersUpdated
   * @param {Function} [onError]
   * @returns {Function} Unsubscribe
   */
  subscribeToUserOrders(userId, roleField = 'clientId', onOrdersUpdated, onError = null) {
    const constraints = [where(roleField, '==', String(userId).trim())];
    return this.subscribe(
      (docs) => {
        const normalized = docs.map(normalizeServiceOrderDTO);
        onOrdersUpdated(normalized);
      },
      onError,
      constraints
    );
  }
}

export const serviceOrderRepository = new ServiceOrderRepository();
