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

  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  const reviewsCount = typeof data.reviewsCount === 'number'
    ? data.reviewsCount
    : (typeof data.reviewCount === 'number'
        ? data.reviewCount
        : reviews.length);

  let rating = 5.0;
  if (typeof data.rating === 'number' && !isNaN(data.rating)) {
    rating = data.rating;
  } else if (data.rating !== undefined && data.rating !== null && !isNaN(Number(data.rating))) {
    rating = Number(data.rating);
  } else if (reviews.length > 0) {
    const totalScore = reviews.reduce((acc, r) => acc + (Number(r.rating || r.stars) || 5), 0);
    rating = Number((totalScore / reviews.length).toFixed(1));
  }

  return {
    id: effectiveId,
    firestoreId: effectiveId,
    title: String(data.title || data.name || 'Serviço Profissional').trim(),
    name: String(data.name || data.title || 'Serviço Profissional').trim(),
    providerName: String(data.providerName || data.name || 'Prestador de Serviço').trim(),
    providerEmail: String(data.providerEmail || data.email || '').toLowerCase().trim(),
    providerAvatar: String(data.providerAvatar || data.avatar || '').trim(),
    avatar: String(data.avatar || data.providerAvatar || '').trim(),
    providerPhone: String(data.providerPhone || data.phone || '').trim(),
    phone: String(data.phone || data.providerPhone || '').trim(),
    providerUid,
    createdBy: providerUid,
    category: String(data.category || 'Tecnologia & Design').trim(),
    city: String(data.city || 'Ivaiporã').trim(),
    address: String(data.address || '').trim(),
    price: data.price !== undefined && data.price !== null ? data.price : 'A Combinar',
    pricingType: String(data.pricingType || data.priceType || 'fixo').trim(),
    priceType: String(data.priceType || data.pricingType || 'fixo').trim(),
    budgetType: String(data.budgetType || data.pricingType || data.priceType || 'combinar').trim(),
    deliveryMode: String(data.deliveryMode || 'presencial').trim(),
    description: String(data.description || '').trim(),
    rating,
    reviewCount: reviewsCount,
    reviewsCount,
    reviews,
    badge: String(data.badge || 'Prestador Regional').trim(),
    analytics: (data.analytics && typeof data.analytics === 'object') ? data.analytics : {
      views: 0,
      contacts: 0,
      closedDeals: 0,
      nonBuyers: 0,
      conversionRate: '0%'
    },
    forumTopics: Array.isArray(data.forumTopics) ? data.forumTopics : [],
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
