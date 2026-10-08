/**
 * Ivaí Conecta - Job DTO & Schema
 * 
 * Contrato de dados e validação para Vagas de Emprego, Estágios e Oportunidades PJ.
 */

import { JobStatus, JobType, isValidJobStatus } from './enums.js';
import { validationResult, validateString, validateEmail, sanitizeStringArray } from './schemaValidator.js';

/**
 * Normaliza um documento bruto de vaga do Firestore ou cache local
 * 
 * @param {object} raw 
 * @param {string} [fallbackId] 
 * @returns {object} JobDTO
 */
export function normalizeJobDTO(raw, fallbackId = '') {
  const data = (raw && typeof raw === 'object') ? raw : {};
  const effectiveId = String(data.id || data.firestoreId || fallbackId || '').trim();
  const rawStatus = String(data.status || JobStatus.ATIVA).trim();
  const status = isValidJobStatus(rawStatus) ? rawStatus : JobStatus.ATIVA;

  return {
    id: effectiveId,
    firestoreId: effectiveId,
    title: String(data.title || 'Oportunidade Profissional').trim(),
    company: String(data.company || 'Empresa Regional').trim(),
    companyLogo: String(data.companyLogo || '').trim(),
    companyUid: String(data.companyUid || data.createdBy || '').trim(),
    city: String(data.city || 'Ivaiporã').trim(),
    type: String(data.type || JobType.TEMPO_INTEGRAL).trim(),
    salary: String(data.salary || 'A Combinar').trim(),
    description: String(data.description || '').trim(),
    requiredSkills: sanitizeStringArray(data.requiredSkills),
    benefits: sanitizeStringArray(data.benefits),
    responsibilities: sanitizeStringArray(data.responsibilities),
    workingHours: String(data.workingHours || '').trim(),
    status,
    applicantsCount: Number(data.applicantsCount || 0),
    viewsCount: Number(data.viewsCount || 0),
    createdBy: String(data.createdBy || '').trim(),
    recruiterEmail: String(data.recruiterEmail || '').toLowerCase().trim(),
    recruiterPhone: String(data.recruiterPhone || '').trim(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    expiresAt: data.expiresAt || null
  };
}

/**
 * Valida a criação ou edição de uma Vaga
 * @param {object} payload 
 * @returns {{ isValid: boolean, data: object, errors: Record<string, string>, errorMessages: string[] }}
 */
export function validateJobDTO(payload) {
  const errors = {};
  const data = payload || {};

  const titleVal = validateString(data.title, { min: 3, max: 120, required: true, fieldName: 'Título da vaga' });
  if (!titleVal.valid) errors.title = titleVal.error;

  const companyVal = validateString(data.company, { min: 2, max: 100, required: true, fieldName: 'Nome da empresa' });
  if (!companyVal.valid) errors.company = companyVal.error;

  const descVal = validateString(data.description, { min: 10, max: 3000, required: true, fieldName: 'Descrição da vaga' });
  if (!descVal.valid) errors.description = descVal.error;

  if (data.recruiterEmail) {
    const emailVal = validateEmail(data.recruiterEmail, 'E-mail do recrutador');
    if (!emailVal.valid) errors.recruiterEmail = emailVal.error;
  }

  const normalized = normalizeJobDTO(data);
  return validationResult(Object.keys(errors).length === 0, normalized, errors);
}
