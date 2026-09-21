/**
 * studentVerificationService.js
 * Serviço de verificação e validação de e-mails estudantis/institucionais
 * para o ecossistema Ivaí Conecta.
 */

// Mapeamento de domínios conhecidos para nomes oficiais das instituições
const KNOWN_INSTITUTIONS = [
  {
    pattern: /ifpr\.edu\.br$/i,
    name: 'IFPR - Instituto Federal do Paraná (Campus Ivaiporã)',
    shortName: 'IFPR Campus Ivaiporã',
    badge: 'Federal'
  },
  {
    pattern: /uenp\.edu\.br$/i,
    name: 'UENP - Universidade Estadual do Norte do Paraná',
    shortName: 'UENP',
    badge: 'Estadual'
  },
  {
    pattern: /(univale\.edu\.br|faive\.edu\.br)$/i,
    name: 'UNIVALE - Faculdades Integradas do Vale do Ivaí',
    shortName: 'UNIVALE',
    badge: 'Regional'
  },
  {
    pattern: /utfpr\.edu\.br$/i,
    name: 'UTFPR - Universidade Tecnológica Federal do Paraná',
    shortName: 'UTFPR',
    badge: 'Federal'
  },
  {
    pattern: /uem\.br$/i,
    name: 'UEM - Universidade Estadual de Maringá',
    shortName: 'UEM',
    badge: 'Estadual'
  },
  {
    pattern: /unicesumar\.edu\.br$/i,
    name: 'UniCesumar - Centro Universitário Cesumar',
    shortName: 'UniCesumar',
    badge: 'Privada'
  },
  {
    pattern: /fafiman\.br$/i,
    name: 'FAFIMAN - Fundação de Ensino Superior de Mandaguari',
    shortName: 'FAFIMAN',
    badge: 'Regional'
  },
  {
    pattern: /(anhanguera\.com|kroton\.com\.br)$/i,
    name: 'Faculdade Anhanguera',
    shortName: 'Anhanguera',
    badge: 'Privada'
  },
  {
    pattern: /unicentro\.br$/i,
    name: 'UNICENTRO - Universidade Estadual do Centro-Oeste',
    shortName: 'UNICENTRO',
    badge: 'Estadual'
  },
  {
    pattern: /uel\.br$/i,
    name: 'UEL - Universidade Estadual de Londrina',
    shortName: 'UEL',
    badge: 'Estadual'
  }
];

// Domínios públicos não-institucionais para alerta rápido
const COMMON_PUBLIC_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'yahoo.com.br',
  'live.com',
  'icloud.com',
  'bol.com.br',
  'uol.com.br',
  'protonmail.com'
];

/**
 * Obtém os detalhes da instituição de ensino a partir do domínio do e-mail.
 * @param {string} email 
 * @returns {{ name: string, shortName: string, badge: string } | null}
 */
export function getInstitutionFromEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null;
  }

  const clean = email.toLowerCase().trim();
  const domain = clean.split('@')[1];
  if (!domain) return null;

  for (const inst of KNOWN_INSTITUTIONS) {
    if (inst.pattern.test(domain)) {
      return {
        name: inst.name,
        shortName: inst.shortName,
        badge: inst.badge
      };
    }
  }

  // Se o domínio for .edu.br ou .edu geral
  if (domain.endsWith('.edu.br')) {
    const parts = domain.replace('.edu.br', '').split('.');
    const rawName = parts[parts.length - 1].toUpperCase();
    return {
      name: `Instituição de Ensino Superior (${rawName})`,
      shortName: rawName,
      badge: 'Acadêmica'
    };
  }

  if (domain.endsWith('.edu')) {
    return {
      name: 'Instituição Educacional / Acadêmica (.edu)',
      shortName: 'Educação Superior',
      badge: 'Internacional'
    };
  }

  return null;
}

/**
 * Valida se um e-mail é institucional de estudante/acadêmico.
 * @param {string} email
 * @returns {{
 *   isValid: boolean,
 *   isPublicPersonalDomain: boolean,
 *   institution: string | null,
 *   shortInstitution: string | null,
 *   domain: string | null,
 *   error?: string
 * }}
 */
export function validateStudentEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      isPublicPersonalDomain: false,
      institution: null,
      shortInstitution: null,
      domain: null,
      error: 'Por favor, informe seu e-mail estudantil institucional.'
    };
  }

  const clean = email.toLowerCase().trim();
  const parts = clean.split('@');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      isValid: false,
      isPublicPersonalDomain: false,
      institution: null,
      shortInstitution: null,
      domain: null,
      error: 'Formato de e-mail inválido.'
    };
  }

  const localPart = parts[0];
  const domain = parts[1];

  // 1. Checa se é um domínio público pessoal
  if (COMMON_PUBLIC_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      isPublicPersonalDomain: true,
      institution: null,
      shortInstitution: null,
      domain,
      error: `O domínio @${domain} é pessoal. Para comprovar vínculo como Aluno, utilize a conta fornecida pela sua faculdade/escola.`
    };
  }

  // 2. Checa se bate com instituições conhecidas
  const detectedInst = getInstitutionFromEmail(clean);
  if (detectedInst) {
    return {
      isValid: true,
      isPublicPersonalDomain: false,
      institution: detectedInst.name,
      shortInstitution: detectedInst.shortName,
      domain,
      badge: detectedInst.badge
    };
  }

  // 3. Checa regras genéricas de e-mail educacional:
  // - Termina em .edu.br ou .edu
  // - Contém subdomínio "aluno.", "alunos.", "estudante.", "pos."
  const isEduDomain = domain.endsWith('.edu.br') || domain.endsWith('.edu');
  const hasStudentSubdomain = /(^|\.)(aluno|alunos|estudante|estudantes|academico|pos)\./i.test(domain);

  if (isEduDomain || hasStudentSubdomain) {
    return {
      isValid: true,
      isPublicPersonalDomain: false,
      institution: 'Instituição de Ensino Superior Reconhecida',
      shortInstitution: 'Ensino Superior',
      domain,
      badge: 'Acadêmica'
    };
  }

  // Não reconhecido como e-mail estudantil
  return {
    isValid: false,
    isPublicPersonalDomain: false,
    institution: null,
    shortInstitution: null,
    domain,
    error: 'O e-mail deve pertencer a uma instituição de ensino (ex: @estudante.ifpr.edu.br, @aluno.uenp.edu.br, @univale.edu.br ou qualquer domínio .edu.br).'
  };
}
