/**
 * Ivaí Conecta - Domain Enums & Constants
 * 
 * Centraliza valores canônicos para evitar Strings Mágicas, 
 * garantindo tipagem consistente, integridade de dados e facilidade de manutenção.
 */

export const UserRole = Object.freeze({
  ALUNO: 'aluno',
  CANDIDATO: 'candidato',
  FREELANCER: 'freelancer',
  EMPRESA: 'empresa',
  PROFESSOR: 'professor',
  ADMIN: 'admin'
});

export const UserRoleLabels = Object.freeze({
  [UserRole.ALUNO]: 'Aluno / Estudante',
  [UserRole.CANDIDATO]: 'Candidato / Profissional',
  [UserRole.FREELANCER]: 'Freelancer / Autônomo',
  [UserRole.EMPRESA]: 'Empresa / Recrutador',
  [UserRole.PROFESSOR]: 'Professor / Docente',
  [UserRole.ADMIN]: 'Administrador do Sistema'
});

export const UserRoleBadges = Object.freeze({
  [UserRole.ALUNO]: 'Estudante (IFPR/UENP/Univale)',
  [UserRole.CANDIDATO]: 'Candidato / Profissional',
  [UserRole.FREELANCER]: 'Prestador de Serviço Autônomo',
  [UserRole.EMPRESA]: 'Empresa / Recrutador',
  [UserRole.PROFESSOR]: 'Docente (IFPR/UENP/Univale)',
  [UserRole.ADMIN]: 'Administrador do Sistema'
});

export const JobStatus = Object.freeze({
  ATIVA: 'Ativa',
  PAUSADA: 'Pausada',
  ENCERRADA: 'Encerrada'
});

export const JobType = Object.freeze({
  TEMPO_INTEGRAL: 'Tempo Integral',
  MEIO_PERIODO: 'Meio Período',
  ESTAGIO: 'Estágio',
  PJ: 'Prestador de Serviço (PJ)',
  TEMPORARIO: 'Temporário'
});

export const WorkplaceType = Object.freeze({
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto'
});

export const ApplicationStatus = Object.freeze({
  ENVIADA: 'Candidatura Enviada',
  PROPOSTA_PJ: 'Proposta PJ Enviada',
  EM_ANALISE: 'Em Análise',
  ENTREVISTA: 'Entrevista Agendada',
  FINALISTA: 'Finalista',
  APROVADA: 'Aprovada',
  REJEITADA: 'Não Selecionado'
});

export const ApplicationStage = Object.freeze({
  TRIAGEM: 'triagem',
  ANALISE: 'analise',
  ENTREVISTA: 'entrevista',
  FINAL: 'final',
  CONTRATADO: 'contratado',
  REJEITADO: 'rejeitado'
});

export const ServiceStatus = Object.freeze({
  ATIVO: 'Ativo',
  PAUSADO: 'Pausado',
  INDISPONIVEL: 'Indisponível'
});

export const ServiceOrderStatus = Object.freeze({
  SOLICITADO: 'solicitado',
  PENDENTE: 'solicitado',
  ACEITO: 'aceito',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
  AVALIADO: 'avaliado',
  RECUSADO: 'recusado',
  CANCELADO: 'cancelado'
});

export const EndorsementStatus = Object.freeze({
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado'
});

export const MatchTier = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'med',
  LOW: 'low'
});

/**
 * Valida se um valor de role é válido
 * @param {string} role 
 * @returns {boolean}
 */
export function isValidUserRole(role) {
  if (!role || typeof role !== 'string') return false;
  return Object.values(UserRole).includes(role.toLowerCase().trim());
}

/**
 * Normaliza um role qualquer para o valor canônico de UserRole
 * @param {string} role 
 * @returns {string}
 */
export function normalizeRole(role) {
  const r = String(role || '').toLowerCase().trim();
  if (['aluno', 'estudante', 'student'].includes(r)) return UserRole.ALUNO;
  if (['freelancer', 'prestador', 'autonomo'].includes(r)) return UserRole.FREELANCER;
  if (['empresa', 'company', 'recrutador'].includes(r)) return UserRole.EMPRESA;
  if (['professor', 'docente', 'teacher'].includes(r)) return UserRole.PROFESSOR;
  if (['admin', 'administrator'].includes(r)) return UserRole.ADMIN;
  if (['candidato', 'profissional'].includes(r)) return UserRole.CANDIDATO;
  return UserRole.CANDIDATO;
}

/**
 * Valida se um status de vaga é válido
 * @param {string} status 
 * @returns {boolean}
 */
export function isValidJobStatus(status) {
  if (!status || typeof status !== 'string') return false;
  return Object.values(JobStatus).some(s => s.toLowerCase() === status.toLowerCase().trim());
}
