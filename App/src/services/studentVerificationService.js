/**
 * studentVerificationService.js
 * Serviço de verificação e validação de e-mails estudantis/institucionais
 * com Prova de Propriedade via Firebase Auth para o ecossistema Ivaí Conecta.
 */
import { auth, db } from '../lib/firebase.js';
import { sendEmailVerification, verifyBeforeUpdateEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { STORAGE_KEY_AUTH_USER } from '../data/seedData';

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
  },
  {
    pattern: /(escola\.pr\.gov\.br|seed\.pr\.gov\.br|estudante\.seed\.pr\.gov\.br)$/i,
    name: 'SEED-PR - Secretaria de Estado da Educação do Paraná',
    shortName: 'SEED-PR Estudante',
    badge: 'Estadual'
  },
  {
    pattern: /(^|\.)(estudantes?|alunos?)\./i,
    name: 'Instituição de Ensino Estudantil',
    shortName: 'Estudante',
    badge: 'Acadêmica'
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
  // - Contém termo "aluno", "alunos", "estudante", "estudantes", "academico", "escola"
  const isEduDomain = domain.endsWith('.edu.br') || domain.endsWith('.edu');
  const hasStudentSubdomain = /(^|\.)(aluno|alunos|estudante|estudantes|academico|pos|escola)/i.test(domain) || /estudantes?/i.test(domain);

  if (isEduDomain || hasStudentSubdomain) {
    return {
      isValid: true,
      isPublicPersonalDomain: false,
      institution: 'Instituição de Ensino Reconhecida',
      shortInstitution: 'Estudante',
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

/**
 * Dispara o e-mail de verificação oficial do Firebase Auth para o e-mail estudantil.
 * Implementa Prova de Propriedade (sendEmailVerification ou verifyBeforeUpdateEmail).
 * 
 * @param {string} [studentEmail] - E-mail estudantil opcional (caso seja diferente do login atual)
 * @param {import('firebase/auth').User} [customUser] - Usuário Firebase Auth opcional
 * @returns {Promise<{ success: boolean, alreadyVerified?: boolean, message?: string, error?: string, errorCode?: string }>}
 */
export async function sendStudentVerificationEmail(studentEmail = null, customUser = null) {
  const user = customUser || auth.currentUser;
  if (!user) {
    return {
      success: false,
      error: 'É necessário estar autenticado para solicitar a validação do e-mail estudantil.'
    };
  }

  const targetEmail = (studentEmail || user.email || '').toLowerCase().trim();
  if (!targetEmail) {
    return {
      success: false,
      error: 'Por favor, informe seu e-mail institucional.'
    };
  }

  // 1. Validação do formato e domínio institucional
  const check = validateStudentEmail(targetEmail);
  if (!check.isValid) {
    return {
      success: false,
      error: check.error || 'O e-mail deve pertencer a uma instituição de ensino reconhecida.'
    };
  }

  // 2. Se o e-mail do usuário no Firebase Auth já é igual ao targetEmail e já está verificado
  if (user.email?.toLowerCase() === targetEmail && user.emailVerified) {
    return {
      success: true,
      alreadyVerified: true,
      message: `O e-mail ${targetEmail} já está verificado pelo Firebase Auth.`
    };
  }

  try {
    // 3. Disparo da verificação de acordo com o caso:
    // Se o e-mail for diferente do atual do Auth, usa verifyBeforeUpdateEmail (muda o email apenas após o clique do link)
    // Se for o mesmo e-mail, dispara o sendEmailVerification padrão
    if (studentEmail && user.email && studentEmail.toLowerCase() !== user.email.toLowerCase()) {
      await verifyBeforeUpdateEmail(user, targetEmail);
    } else {
      await sendEmailVerification(user);
    }

    // 4. Registra no Firestore a data de envio e o e-mail pendente
    try {
      await setDoc(doc(db, 'users', user.uid), {
        studentEmail: targetEmail,
        institution: check.institution || 'Instituição de Ensino',
        shortInstitution: check.shortInstitution || 'Ensino Superior',
        studentEmailVerificationSentAt: new Date().toISOString(),
        isVerifiedStudent: false // Garante que continua desativado até a confirmação
      }, { merge: true });
    } catch (dbErr) {
      console.warn('[sendStudentVerificationEmail] Falha ao registrar log no Firestore:', dbErr);
    }

    return {
      success: true,
      message: `Enviamos um link de confirmação para ${targetEmail}. Abra sua caixa de entrada institucional e clique no link para ativar seu Selo de Estudante.`
    };
  } catch (error) {
    console.error('[sendStudentVerificationEmail] Erro Firebase:', error);
    let errorMsg = 'Não foi possível enviar o e-mail de confirmação. Tente novamente.';
    if (error.code === 'auth/too-many-requests') {
      errorMsg = 'Muitas solicitações recentes. Por favor, aguarde alguns minutos antes de solicitar um novo link de confirmação.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMsg = 'Por segurança, faça logout e login novamente antes de vincular um novo e-mail institucional.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'Este e-mail institucional já está cadastrado em outra conta do Ivaí Conecta.';
    }
    return {
      success: false,
      error: errorMsg,
      errorCode: error.code
    };
  }
}

/**
 * Recarrega os dados do Firebase Auth e verifica se user.emailVerified agora é true.
 * Em caso afirmativo, concede o Selo de Estudante Verificado no Firestore e no cache local.
 * 
 * @param {import('firebase/auth').User} [customUser] - Usuário Firebase Auth opcional
 * @returns {Promise<{
 *   success: boolean,
 *   verified: boolean,
 *   message: string,
 *   institution?: string,
 *   shortInstitution?: string,
 *   user?: any,
 *   error?: string
 * }>}
 */
export async function checkStudentVerification(customUser = null) {
  const user = customUser || auth.currentUser;
  if (!user) {
    return {
      success: false,
      verified: false,
      message: 'Sessão expirada. Faça login novamente para verificar seu e-mail.'
    };
  }

  // 1. Recarregar o usuário é OBRIGATÓRIO no Firebase Auth para atualizar a propriedade emailVerified
  try {
    await user.reload();
  } catch (reloadErr) {
    console.warn('[checkStudentVerification] Erro ao recarregar usuário:', reloadErr);
  }

  // 2. Checar se o Firebase Auth já confirmou a titularidade
  if (!user.emailVerified) {
    return {
      success: true,
      verified: false,
      message: `O e-mail ${user.email} ainda não foi confirmado. Acesse sua caixa postal institucional, clique no link recebido e tente novamente.`
    };
  }

  // 3. Confirmar se o e-mail autenticado pertence a um domínio educacional válido
  const check = validateStudentEmail(user.email);
  if (!check.isValid) {
    return {
      success: false,
      verified: false,
      message: `O e-mail ${user.email} foi confirmado, mas não pertence a uma instituição estudantil reconhecida.`
    };
  }

  // 4. Concessão legítima do Selo de Estudante no Firestore
  const updatePayload = {
    isVerifiedStudent: true,
    emailVerified: true,
    studentEmail: user.email.toLowerCase().trim(),
    institution: check.institution || 'Instituição de Ensino Superior',
    shortInstitution: check.shortInstitution || 'Ensino Superior',
    studentEmailVerifiedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', user.uid), updatePayload, { merge: true });
  } catch (dbErr) {
    console.error('[checkStudentVerification] Erro ao salvar status verificado no Firestore:', dbErr);
  }

  // 5. Atualizar cache local de sessão para efeito imediato na UI
  let updatedSessionUser = null;
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        updatedSessionUser = { ...parsed, ...updatePayload };
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updatedSessionUser));
      } catch {}
    }
  }

  return {
    success: true,
    verified: true,
    institution: check.institution,
    shortInstitution: check.shortInstitution,
    user: updatedSessionUser || updatePayload,
    message: `🎓 Titularidade confirmada com sucesso! Vínculo acadêmico com ${check.institution || 'a Instituição'} comprovado. Selo de Estudante ativado!`
  };
}
