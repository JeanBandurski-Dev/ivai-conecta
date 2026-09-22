// Storage Keys and Domain Constants for Ivaí Conecta

export const STORAGE_KEY_CITY                 = 'ivai_conecta_selected_city';
export const STORAGE_KEY_TALENTS              = 'ivai_conecta_db_talents';
export const STORAGE_KEY_JOBS                 = 'ivai_conecta_db_jobs';
export const STORAGE_KEY_SERVICES             = 'ivai_conecta_db_services';
export const STORAGE_KEY_AUTH_USER            = 'ivai_conecta_auth_user';
export const STORAGE_KEY_USERS_DB             = 'ivai_conecta_users_db';
export const STORAGE_KEY_APPLICATIONS         = 'ivai_conecta_user_applications';
export const STORAGE_KEY_FAV_JOBS             = 'ivai_conecta_fav_jobs';
export const STORAGE_KEY_FAV_TALENTS          = 'ivai_conecta_fav_talents';
export const STORAGE_KEY_TEACHERS             = 'ivai_conecta_teachers_db';
export const STORAGE_KEY_ENDORSEMENT_REQUESTS = 'ivai_conecta_endorsement_requests';

export const USER_ROLES = {
  aluno:      { id: 'aluno',      name: 'Aluno / Estudante',          badge: 'Estudante (IFPR/UENP/Univale)' },
  freelancer: { id: 'freelancer', name: 'Freelancer / Autônomo',      badge: 'Prestador de Serviço Autônomo' },
  candidato:  { id: 'candidato',  name: 'Candidato / Profissional',   badge: 'Candidato / Profissional' },
  empresa:    { id: 'empresa',    name: 'Empresa / Recrutador',       badge: 'Empresa / Recrutador' },
  professor:  { id: 'professor',  name: 'Professor / Docente',        badge: 'Docente (IFPR/UENP/Univale)' },
  admin:      { id: 'admin',      name: 'Administrador do Sistema',    badge: 'Administrador do Sistema' },
};

export const CITIES = [
  'Todas as Cidades',
  'Ivaiporã',
  'Jardim Alegre',
  'São João do Ivaí',
  'Manoel Ribas',
  'Lunardelli',
  'Borrazópolis',
  'Ariranha do Ivaí',
  'Grandes Rios',
];
