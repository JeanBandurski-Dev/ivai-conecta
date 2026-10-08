/**
 * @file EndorsementDTO.js
 * @description Modelos e DTOs para Chancelas Acadêmicas / Pareceres de Professores e Solicitações de Chancela.
 */

import { EndorsementStatus } from './enums.js';
import {
  validateString,
  validateEmail,
  validationResult,
} from './schemaValidator.js';

/**
 * Normaliza um objeto de parecer acadêmico (Endorsement) emitido por professor para um estudante.
 * @param {Object} raw
 * @returns {Object}
 */
export function normalizeEndorsementDTO(raw = {}) {
  const data = raw && typeof raw === 'object' ? raw : {};

  const profEmail = String(data.profEmail || data.email || '').toLowerCase().trim();
  const profUid = String(data.profUid || data.profId || data.uid || data.id || '').trim();
  const profName = String(data.profName || data.teacherName || data.name || 'Professor(a)').trim();
  const discipline = String(data.discipline || data.subject || data.course || '').trim();
  const institution = String(data.institution || data.school || '').trim();
  const quote = String(data.quote || data.comment || data.text || '').trim();

  const timestamp = Number(data.timestamp) || (data.date ? new Date(data.date).getTime() : Date.now());
  const dateStr = data.date || new Date(timestamp).toLocaleDateString('pt-BR');

  return {
    id: String(data.id || `${profUid || profEmail}_${timestamp}`),
    profName,
    profEmail,
    profUid,
    discipline,
    institution,
    quote,
    date: dateStr,
    timestamp,
  };
}

/**
 * Valida a emissão de uma nova chancela/parecer docente.
 * @param {Object} payload
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateEndorsementCreateDTO(payload = {}) {
  const errors = [];

  const quoteVal = validateString(payload.quote, 'Parecer / Recomendação', { min: 5, max: 2000, required: true });
  if (!quoteVal.isValid) errors.push(...quoteVal.errors);

  const profNameVal = validateString(payload.profName, 'Nome do Professor', { min: 2, max: 120, required: true });
  if (!profNameVal.isValid) errors.push(...profNameVal.errors);

  if (payload.profEmail) {
    const emailVal = validateEmail(payload.profEmail, 'E-mail do Professor', false);
    if (!emailVal.isValid) errors.push(...emailVal.errors);
  }

  return validationResult(errors);
}

/**
 * Normaliza uma solicitação de chancela acadêmica (Endorsement Request).
 * @param {Object} raw
 * @returns {Object}
 */
export function normalizeEndorsementRequestDTO(raw = {}) {
  const data = raw && typeof raw === 'object' ? raw : {};

  const statusRaw = String(data.status || EndorsementStatus.PENDENTE).trim();
  const status = Object.values(EndorsementStatus).includes(statusRaw)
    ? statusRaw
    : EndorsementStatus.PENDENTE;

  const requestedTimestamp = Number(data.requestedTimestamp) || (data.createdAt ? new Date(data.createdAt).getTime() : Date.now());

  return {
    id: String(data.id || ''),
    studentId: String(data.studentId || data.studentUid || data.uid || '').trim(),
    studentName: String(data.studentName || '').trim(),
    studentEmail: String(data.studentEmail || '').toLowerCase().trim(),
    studentCourse: String(data.studentCourse || data.course || '').trim(),
    studentInstitution: String(data.studentInstitution || data.institution || '').trim(),
    profId: String(data.profId || data.profUid || '').trim(),
    profName: String(data.profName || '').trim(),
    profEmail: String(data.profEmail || '').toLowerCase().trim(),
    discipline: String(data.discipline || data.subject || '').trim(),
    message: String(data.message || data.requestMessage || '').trim(),
    status,
    responseQuote: String(data.responseQuote || data.quote || '').trim(),
    requestedTimestamp,
    createdAt: data.createdAt || new Date(requestedTimestamp).toISOString(),
    respondedAt: data.respondedAt || null,
  };
}

/**
 * Valida a criação de um pedido de chancela por parte do aluno.
 * @param {Object} payload
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateEndorsementRequestCreateDTO(payload = {}) {
  const errors = [];

  const studentIdVal = validateString(payload.studentId || payload.studentUid, 'ID do Estudante', { min: 1, required: true });
  if (!studentIdVal.isValid) errors.push(...studentIdVal.errors);

  const studentNameVal = validateString(payload.studentName, 'Nome do Estudante', { min: 2, max: 120, required: true });
  if (!studentNameVal.isValid) errors.push(...studentNameVal.errors);

  const profEmailVal = validateEmail(payload.profEmail, 'E-mail do Professor', true);
  if (!profEmailVal.isValid) errors.push(...profEmailVal.errors);

  const disciplineVal = validateString(payload.discipline, 'Disciplina / Matéria', { min: 2, max: 100, required: true });
  if (!disciplineVal.isValid) errors.push(...disciplineVal.errors);

  return validationResult(errors);
}
