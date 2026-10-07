/**
 * Ivaí Conecta - Service Order DTO & Schema
 * 
 * Contrato de dados e validação para Pedidos / Ordens de Serviço (Contratação de Freelancers).
 */

import { ServiceOrderStatus } from './enums.js';
import { validationResult, validateString, validateEmail } from './schemaValidator.js';

/**
 * Normaliza um documento bruto de ordem de serviço do Firestore ou cache
 * 
 * @param {object} raw 
 * @param {string} [fallbackId] 
 * @returns {object} ServiceOrderDTO
 */
export function normalizeServiceOrderDTO(raw, fallbackId = '') {
  const data = (raw && typeof raw === 'object') ? raw : {};
  const effectiveId = String(data.id || data.firestoreId || fallbackId || '').trim();
  const providerUid = String(data.providerUid || data.providerId || '').trim();
  const clientUid = String(data.clientUid || data.clientId || data.buyerUid || '').trim();

  return {
    id: effectiveId,
    firestoreId: effectiveId,
    serviceId: String(data.serviceId || '').trim(),
    serviceTitle: String(data.serviceTitle || data.title || 'Serviço Solicitado').trim(),
    providerUid,
    providerId: providerUid,
    providerEmail: String(data.providerEmail || '').toLowerCase().trim(),
    providerName: String(data.providerName || 'Prestador').trim(),
    clientUid,
    clientId: clientUid,
    clientEmail: String(data.clientEmail || data.buyerEmail || '').toLowerCase().trim(),
    clientName: String(data.clientName || data.buyerName || 'Contratante').trim(),
    clientPhone: String(data.clientPhone || '').trim(),
    details: String(data.details || data.description || '').trim(),
    description: String(data.description || data.details || '').trim(),
    deadline: String(data.deadline || '').trim(),
    budget: data.budget !== undefined && data.budget !== null ? data.budget : 'A Combinar',
    status: String(data.status || ServiceOrderStatus.PENDENTE).trim(),
    review: data.review ? String(data.review).trim() : null,
    rating: typeof data.rating === 'number' ? data.rating : null,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * Valida o envio de um pedido de contratação de serviço
 * @param {object} payload 
 * @returns {{ isValid: boolean, data: object, errors: Record<string, string>, errorMessages: string[] }}
 */
export function validateServiceOrderDTO(payload) {
  const errors = {};
  const data = payload || {};

  if (!data.serviceId) {
    errors.serviceId = 'O identificador do serviço é obrigatório.';
  }

  const detailsVal = validateString(data.details || data.description, {
    min: 5,
    max: 2000,
    required: true,
    fieldName: 'Detalhes da solicitação'
  });
  if (!detailsVal.valid) errors.details = detailsVal.error;

  const emailVal = validateEmail(data.clientEmail || data.buyerEmail, 'E-mail do solicitante');
  if (!emailVal.valid) errors.clientEmail = emailVal.error;

  const normalized = normalizeServiceOrderDTO(data);
  return validationResult(Object.keys(errors).length === 0, normalized, errors);
}
