/**
 * Ivaí Conecta - Application DTO & Schema
 * 
 * Contrato de dados e validação para Candidaturas a Vagas de Emprego, Estágios e Propostas PJ.
 */

import { ApplicationStatus, ApplicationStage } from './enums.js';
import { validationResult, validateEmail, sanitizeStringArray } from './schemaValidator.js';

/**
 * Normaliza um documento bruto de candidatura do Firestore ou cache
 * 
 * @param {object} raw 
 * @param {string} [fallbackId] 
 * @returns {object} ApplicationDTO
 */
export function normalizeApplicationDTO(raw, fallbackId = '') {
  const data = (raw && typeof raw === 'object') ? raw : {};
  const effectiveId = String(data.id || data.firestoreId || fallbackId || '').trim();
  const effectiveJobId = String(data.jobId || data.firestoreJobId || data.originalJobId || '').trim();
  const candidateUid = String(data.candidateUid || data.candidateId || '').trim();
  const recruiterUid = String(data.recruiterUid || data.companyUid || '').trim();

  const matchScore = typeof data.matchScore === 'number' ? Math.max(0, Math.min(100, data.matchScore)) : 0;
  const statusClass = matchScore >= 75 ? 'badge-match-high' : matchScore >= 50 ? 'badge-match-med' : 'badge-match-low';

  const defaultStages = [
    { name: 'Candidatura Enviada', date: data.appliedAt || new Date().toLocaleDateString('pt-BR'), completed: true },
    { name: 'Triagem de Perfil', date: 'Pendente', completed: false, active: true },
    { name: 'Entrevista com Recrutador', date: 'A definir', completed: false },
    { name: 'Resultado Final', date: 'Pendente', completed: false }
  ];

  return {
    id: effectiveId,
    firestoreId: effectiveId,
    jobId: effectiveJobId,
    firestoreJobId: effectiveJobId,
    originalJobId: effectiveJobId,
    companyUid: recruiterUid,
    company: String(data.company || 'Empresa Contratante').trim(),
    companyLogo: String(data.companyLogo || '').trim(),
    recruiterEmail: String(data.recruiterEmail || '').toLowerCase().trim(),
    recruiterUid: recruiterUid,
    recruiterPhone: String(data.recruiterPhone || '').trim(),

    candidateUid,
    candidateId: candidateUid,
    candidateName: String(data.candidateName || 'Candidato').trim(),
    candidateRole: String(data.candidateRole || 'candidato').trim(),
    candidateEmail: String(data.candidateEmail || '').toLowerCase().trim(),
    candidateAvatar: String(data.candidateAvatar || '').trim(),
    candidateCourse: String(data.candidateCourse || '').trim(),
    candidateInstitution: String(data.candidateInstitution || '').trim(),
    candidateCity: String(data.candidateCity || 'Ivaiporã').trim(),
    candidatePhone: String(data.candidatePhone || '').trim(),
    isVerifiedStudent: Boolean(data.isVerifiedStudent),
    skills: sanitizeStringArray(data.skills),

    title: String(data.title || 'Vaga de Oportunidade').trim(),
    city: String(data.city || 'Ivaiporã').trim(),
    type: String(data.type || 'Tempo Integral').trim(),
    appliedAt: data.appliedAt || new Date().toLocaleDateString('pt-BR'),
    appliedTimestamp: Number(data.appliedTimestamp || Date.now()),
    matchScore,
    status: String(data.status || ApplicationStatus.ENVIADA).trim(),
    stage: String(data.stage || ApplicationStage.TRIAGEM).trim(),
    statusClass,
    currentStageIndex: Number(data.currentStageIndex || 0),
    nextStepNote: String(data.nextStepNote || 'Sua candidatura foi recebida e aguarda análise do recrutador.').trim(),
    stages: Array.isArray(data.stages) && data.stages.length > 0 ? data.stages : defaultStages,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * Valida a submissão de uma nova candidatura
 * @param {object} payload 
 * @returns {{ isValid: boolean, data: object, errors: Record<string, string>, errorMessages: string[] }}
 */
export function validateApplicationDTO(payload) {
  const errors = {};
  const data = payload || {};

  if (!data.jobId && !data.firestoreJobId) {
    errors.jobId = 'O identificador da vaga é obrigatório.';
  }

  if (!data.candidateUid && !data.candidateId) {
    errors.candidateUid = 'O identificador do candidato é obrigatório.';
  }

  const emailVal = validateEmail(data.candidateEmail, 'E-mail do candidato');
  if (!emailVal.valid) errors.candidateEmail = emailVal.error;

  const normalized = normalizeApplicationDTO(data);
  return validationResult(Object.keys(errors).length === 0, normalized, errors);
}

/**
 * Valida se um estágio de transição no funil de seleção é válido.
 * @param {string} stage
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateStageTransitionDTO(stage) {
  const validStages = Object.values(ApplicationStage);
  if (!stage || !validStages.includes(stage)) {
    return {
      isValid: false,
      errors: [`Estágio inválido: '${stage}'. Estágios permitidos: ${validStages.join(', ')}`],
    };
  }
  return { isValid: true, errors: [] };
}
