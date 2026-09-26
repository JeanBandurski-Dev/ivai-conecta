/**
 * Ivaí Conecta - Service DTO & Schema
 * 
 * Contrato de dados e validação para Serviços Autônomos (Marketplace Freelancer).
 */

import { ServiceStatus } from './enums.js';
import { validationResult, validateString, validateEmail, sanitizeStringArray } from './schemaValidator.js';

/**
 * Normaliza um documento bruto de serviço do Firestore ou cache
 * 
 * @param {object} raw 
 * @param {string} [fallbackId] 
 * @returns {object} ServiceDTO
 */
export function normalizeServiceDTO(raw, fallbackId = '') {
  const data = (raw && typeof raw === 'object') ? raw : {};
  const effectiveId = String(data.id || data.firestoreId || fallbackId || '').trim();
  const providerUid = String(data.providerUid || data.createdBy || data.providerId || '').trim();

  return {
    id: effectiveId,
    firestoreId: effectiveId,
    title: String(data.title || 'Serviço Profissional').trim(),
    providerName: String(data.providerName || data.name || 'Prestador de Serviço').trim(),
    providerEmail: String(data.providerEmail || data.email || '').toLowerCase().trim(),
    providerAvatar: String(data.providerAvatar || data.avatar || '').trim(),
    providerPhone: String(data.providerPhone || data.phone || '').trim(),
    providerUid,
    createdBy: providerUid,
    category: String(data.category || 'Tecnologia & Design').trim(),
    city: String(data.city || 'Ivaiporã').trim(),
    price: data.price !== undefined && data.price !== null ? data.price : 'A Combinar',
    pricingType: String(data.pricingType || data.priceType || 'fixo').trim(),
    priceType: String(data.priceType || data.pricingType || 'fixo').trim(),
    description: String(data.description || '').trim(),
    rating: Number(data.rating || 5.0),
    reviewCount: Number(data.reviewCount || data.reviewsCount || 0),
    reviewsCount: Number(data.reviewsCount || data.reviewCount || 0),
    status: String(data.status || ServiceStatus.ATIVO).trim(),
    tags: sanitizeStringArray(data.tags),
    image: String(data.image || data.imageUrl || '').trim(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * Valida a publicação de um novo Serviço
 * @param {object} payload 
 * @returns {{ isValid: boolean, data: object, errors: Record<string, string>, errorMessages: string[] }}
 */
export function validateServiceDTO(payload) {
  const errors = {};
  const data = payload || {};

  const titleVal = validateString(data.title, { min: 3, max: 120, required: true, fieldName: 'Título do serviço' });
  if (!titleVal.valid) errors.title = titleVal.error;

  const descVal = validateString(data.description, { min: 10, max: 3000, required: true, fieldName: 'Descrição do serviço' });
  if (!descVal.valid) errors.description = descVal.error;

  if (data.providerEmail) {
    const emailVal = validateEmail(data.providerEmail, 'E-mail do prestador');
    if (!emailVal.valid) errors.providerEmail = emailVal.error;
  }

  const normalized = normalizeServiceDTO(data);
  return validationResult(Object.keys(errors).length === 0, normalized, errors);
}
