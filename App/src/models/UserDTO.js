/**
 * Ivaí Conecta - User DTO & Schema
 * 
 * Contrato de dados e normalização para perfis de usuários
 * (Aluno, Candidato, Freelancer, Empresa, Professor e Admin).
 */

import { UserRole, UserRoleBadges, normalizeRole, isValidUserRole } from './enums.js';
import { validationResult, validateString, validateEmail, sanitizeStringArray } from './schemaValidator.js';

/**
 * Normaliza um documento bruto de usuário do Firestore ou sessão local
 * garantindo estrutura canônica sem campos indefinidos.
 * 
 * @param {object} raw 
 * @param {string} [fallbackId] 
 * @returns {object} UserDTO
 */
export function normalizeUserDTO(raw, fallbackId = '') {
  const data = (raw && typeof raw === 'object') ? raw : {};
  const effectiveId = String(data.id || data.uid || fallbackId || '').trim();
  const rawRole = data.activeRole || data.selectedRole || data.profileType || data.role || UserRole.CANDIDATO;
  const role = normalizeRole(rawRole);
  const badge = UserRoleBadges[role] || data.badge || UserRoleBadges[UserRole.CANDIDATO];

  const endorsements = Array.isArray(data.endorsements) ? data.endorsements : [];
  const experiences = Array.isArray(data.experiences) ? data.experiences : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const skills = sanitizeStringArray(data.skills);

  return {
    id: effectiveId,
    uid: effectiveId,
    name: String(data.name || data.displayName || 'Usuário').trim(),
    email: String(data.email || '').toLowerCase().trim(),
    role,
    activeRole: role,
    selectedRole: role,
    profileType: role,
    badge,
    city: String(data.city || 'Ivaiporã').trim(),
    avatar: String(data.avatar || data.photoURL || '').trim(),
    phone: String(data.phone || '').trim(),
    bio: String(data.bio || '').trim(),
    linkedin: String(data.linkedin || '').trim(),
    github: String(data.github || '').trim(),
    skills,
    experiences,
    projects,
    education,
    endorsements,
    endorsementCount: endorsements.length,

    // Atributos específicos: Aluno / Estudante
    isVerifiedStudent: Boolean(data.isVerifiedStudent || (role === UserRole.ALUNO && endorsements.length > 0)),
    studentEmail: data.studentEmail ? String(data.studentEmail).toLowerCase().trim() : null,
    institution: String(data.institution || (role === UserRole.ALUNO ? 'IFPR Campus Ivaiporã' : '')).trim(),
    course: String(data.course || '').trim(),
    period: String(data.period || '').trim(),
    raNumber: String(data.raNumber || '').trim(),
    studentEmailVerifiedAt: data.studentEmailVerifiedAt || null,

    // Atributos específicos: Empresa
    cnpj: String(data.cnpj || '').trim(),
    razaoSocial: String(data.razaoSocial || data.name || '').trim(),
    nomeFantasia: String(data.nomeFantasia || data.tradingName || data.name || '').trim(),
    isVerifiedCompany: Boolean(data.isVerifiedCompany || (data.cnpj && String(data.cnpj).length >= 14)),
    sector: String(data.sector || data.industry || '').trim(),
    size: String(data.size || '').trim(),
    website: String(data.website || '').trim(),

    // Atributos específicos: Professor
    degree: String(data.degree || (role === UserRole.PROFESSOR ? 'Docente / Pesquisador' : '')).trim(),
    discipline: String(data.discipline || '').trim(),
    verified: Boolean(data.verified ?? (role === UserRole.PROFESSOR)),

    // Moderação e Status
    blocked: Boolean(data.blocked || data.status === 'blocked'),
    blockedReason: data.blockedReason ? String(data.blockedReason).trim() : null,
    status: data.status ? String(data.status).trim() : 'active',

    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * Valida os dados de criação ou registro de um usuário
 * @param {object} payload 
 * @returns {{ isValid: boolean, data: object, errors: Record<string, string>, errorMessages: string[] }}
 */
export function validateUserCreateDTO(payload) {
  const errors = {};
  const data = payload || {};

  const nameVal = validateString(data.name, { min: 2, max: 120, required: true, fieldName: 'Nome' });
  if (!nameVal.valid) errors.name = nameVal.error;

  const emailVal = validateEmail(data.email, 'E-mail');
  if (!emailVal.valid) errors.email = emailVal.error;

  if (data.role && !isValidUserRole(data.role)) {
    errors.role = 'O papel informado é inválido.';
  }

  const normalized = normalizeUserDTO(data);
  return validationResult(Object.keys(errors).length === 0, normalized, errors);
}

/**
 * Valida a atualização de perfil de um usuário
 * @param {object} patch 
 * @returns {{ isValid: boolean, data: object, errors: Record<string, string>, errorMessages: string[] }}
 */
export function validateUserUpdateDTO(patch) {
  const errors = {};
  if (!patch || typeof patch !== 'object') {
    return validationResult(false, {}, { payload: 'Payload de atualização inválido.' });
  }

  if (patch.name !== undefined) {
    const val = validateString(patch.name, { min: 2, max: 120, required: true, fieldName: 'Nome' });
    if (!val.valid) errors.name = val.error;
  }

  if (patch.email !== undefined) {
    const val = validateEmail(patch.email, 'E-mail');
    if (!val.valid) errors.email = val.error;
  }

  return validationResult(Object.keys(errors).length === 0, patch, errors);
}
