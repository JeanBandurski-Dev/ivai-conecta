/**
 * @file ServiceRepository.js
 * @description Repositório de dados para a coleção 'services' (Serviços e Freelancers Locais).
 */

import { BaseRepository, handleFirestoreError } from './BaseRepository.js';
import { normalizeServiceDTO, validateServiceDTO } from '../models/ServiceDTO.js';

export class ServiceRepository extends BaseRepository {
  constructor() {
    super('services');
  }

  /**
   * Busca um serviço pelo ID do documento.
   * @param {string} serviceId
   * @returns {Promise<Object|null>}
   */
  async findServiceById(serviceId) {
    if (!serviceId) return null;
    const raw = await this.findById(serviceId);
    return raw ? normalizeServiceDTO(raw) : null;
  }

  /**
   * Busca serviços com filtros opcionais de cidade e categoria.
   * @param {Object} [filters]
   * @returns {Promise<Array<Object>>}
   */
  async findServices(filters = {}) {
    try {
      const raw = await this.findAll();
      let normalized = raw.map(normalizeServiceDTO);

      if (filters.city && filters.city !== 'Todas as Cidades') {
        const cleanCity = filters.city.toLowerCase().trim();
        normalized = normalized.filter(s =>
          String(s.city || '').toLowerCase().trim() === cleanCity
        );
      }

      if (filters.category && filters.category !== 'Todos') {
        const cleanCat = filters.category.toLowerCase().trim();
        normalized = normalized.filter(s =>
          String(s.category || '').toLowerCase().trim() === cleanCat
        );
      }

      if (filters.providerId) {
        const targetProv = String(filters.providerId).trim();
        normalized = normalized.filter(s =>
          String(s.providerId) === targetProv || String(s.freelancerId) === targetProv
        );
      }

      return normalized;
    } catch (err) {
      throw handleFirestoreError(err, 'findServices', this.collectionName);
    }
  }

  /**
   * Cria um novo serviço com validação e normalização.
   * @param {Object} rawData
   * @returns {Promise<Object>}
   */
  async createService(rawData) {
    const validation = validateServiceDTO(rawData);
    if (!validation.isValid) {
      throw new Error(`Validação de serviço falhou: ${validation.errors.join('; ')}`);
    }

    const normalized = normalizeServiceDTO(rawData);
    const created = await this.create(normalized);
    return normalizeServiceDTO(created);
  }

  /**
   * Assina atualizações de serviços em tempo real.
   * @param {Function} onServicesUpdated
   * @param {Function} [onError]
   * @returns {Function} Unsubscribe
   */
  subscribeToServices(onServicesUpdated, onError = null) {
    return this.subscribe(
      (docs) => {
        const normalized = docs.map(normalizeServiceDTO);
        onServicesUpdated(normalized);
      },
      onError
    );
  }
}

export const serviceRepository = new ServiceRepository();
