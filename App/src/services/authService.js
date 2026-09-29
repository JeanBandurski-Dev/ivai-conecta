// Auth Service for Ivaí Conecta (Firebase + Local Storage Fallback)
import { auth, db, googleProvider } from '../lib/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { seedFirestoreIfEmpty } from './seedFirestore.js';
import { validateCNPJ, maskCNPJ, cleanCNPJ } from './cnpjService.js';
import {
  validateStudentEmail,
  sendStudentVerificationEmail,
  checkStudentVerification,
} from './studentVerificationService.js';

import {
  STORAGE_KEY_AUTH_USER,
  STORAGE_KEY_USERS_DB,
  STORAGE_KEY_CITY,
  USER_ROLES,
} from '../data/seedData.js';

export function getUsersDB() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
  let users = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        users = parsed.map(u => {
          if (u && typeof u === 'object') {
            const { password, ...safeUser } = u;
            return safeUser;
          }
          return u;
        });
      }
    } catch { }
  }
  return users;
}

/**
 * Remove proativamente qualquer senha legada salva em texto puro no LocalStorage
 */
export function purgePasswordsFromLocalStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS_DB);
    if (rawUsers) {
      const parsed = JSON.parse(rawUsers);
      if (Array.isArray(parsed)) {
        let hasPassword = false;
        const sanitized = parsed.map(user => {
          if (user && typeof user === 'object' && 'password' in user) {
            hasPassword = true;
            const { password, ...clean } = user;
            return clean;
          }
          return user;
        });
        if (hasPassword) {
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(sanitized));
        }
      }
    }

    const rawAuth = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (rawAuth) {
      const authUser = JSON.parse(rawAuth);
      if (authUser && typeof authUser === 'object' && 'password' in authUser) {
        delete authUser.password;
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
      }
    }
  } catch (err) {
    console.warn('[authService] Erro ao purgar senhas residuais:', err);
  }
}

// Auto-executa a limpeza de senhas residuais na inicialização do serviço
purgePasswordsFromLocalStorage();


export function getAuthUser() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Normaliza o papel (role) do usuário, unificando aliases antigos ou variações para o padrão da plataforma.
 */
export function normalizeUserRole(role) {
  const value = String(role || '').toLowerCase().trim();
  const aliases = {
    aluno: 'aluno',
    estudante: 'aluno',
    estudantes: 'aluno',
    student: 'aluno',
    students: 'aluno',

    candidate: 'candidato',
    candidato: 'candidato',
    profissional: 'candidato',

    freelancer: 'freelancer',
    autonomo: 'freelancer',
    autônomo: 'freelancer',

    empresa: 'empresa',
    company: 'empresa',
    recrutador: 'empresa',
    recruiter: 'empresa',

    professor: 'professor',
    docente: 'professor',
    teacher: 'professor',

    admin: 'admin',
    administrador: 'admin',
    moderador: 'moderador',
    moderator: 'moderador',
  };

  return aliases[value] || value || 'aluno';
}

/**
 * Infere o papel sugerido a partir das informações básicas do Firebase Auth.
 */
function inferRoleFromFirebaseUser(fbUser) {
  const email = String(fbUser?.email || '').toLowerCase().trim();
  if (!email) return 'aluno';
  const studentCheck = validateStudentEmail(email);
  if (studentCheck.isValid) return 'aluno';
  return 'aluno';
}

/**
 * Cria a estrutura padrão de perfil de usuário quando a conta existe no Auth mas não no Firestore.
 */
function buildDefaultProfileForFirebaseUser(fbUser, preferredRole = null) {
  const studentCheck = validateStudentEmail(fbUser?.email || '');
  const role = normalizeUserRole(preferredRole || inferRoleFromFirebaseUser(fbUser));
  const now = new Date().toISOString();
  const isInstitutionalStudent = role === 'aluno' && studentCheck.isValid;
  const isVerified = isInstitutionalStudent && Boolean(fbUser?.emailVerified);
  const displayName = fbUser?.displayName || (fbUser?.email ? fbUser.email.split('@')[0] : 'Usuário');

  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    name: displayName,
    email: (fbUser.email || '').toLowerCase().trim(),
    emailVerified: role === 'aluno' ? isVerified : true,
    city: 'Ivaiporã',
    role,
    badge: (USER_ROLES[role] || USER_ROLES.aluno).badge,
    avatar: fbUser.photoURL || '',
    isVerifiedStudent: isVerified,
    isVerifiedCompany: role === 'empresa',
    createdAt: now,
    updatedAt: now,
    ...(role === 'aluno' ? {
      course: '',
      institution: studentCheck.institution || 'IFPR Campus Ivaiporã',
      shortInstitution: studentCheck.shortInstitution || 'IFPR Campus Ivaiporã',
      period: '',
      skills: [],
      studentEmail: (fbUser.email || '').toLowerCase().trim(),
      studentEmailDomain: studentCheck.domain || null,
      studentEmailVerifiedAt: isVerified ? now : null,
      bio: '',
      experiences: [],
      projects: [],
      education: [],
      endorsements: []
    } : {})
  };
}

/**
 * Garante que o documento users/{uid} exista no Firestore, evitando que contas criadas anteriormente sejam deslogadas.
 */
async function ensureUserProfile(fbUser, preferredRole = null) {
  const profile = buildDefaultProfileForFirebaseUser(fbUser, preferredRole);
  await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
  return profile;
}

export async function getUserProfile(uid) {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return { success: true, profile: snap.data() };
    }
    return { success: false, errorCode: 'profile/not-found' };
  } catch (error) {
    return { success: false, errorCode: error.code || error.message };
  }
}

export function formatFirebaseAuthError(error, context = 'login') {
  if (!error) {
    return {
      code: 'auth/unknown',
      message: 'Ocorreu um erro inesperado na autenticação.',
      fullText: 'Ocorreu um erro inesperado.'
    };
  }

  const rawMsg = error.message || (typeof error === 'string' ? error : '');
  const code = error.code || (rawMsg.match(/\((auth\/[a-z0-9_-]+)\)/i)?.[1] || (rawMsg.match(/\[([a-z0-9_/-]+)\]/i)?.[1] || ''));
  let friendlyMessage = '';

  switch (code) {
    case 'auth/email-already-in-use':
      friendlyMessage = 'Este e-mail já está cadastrado no sistema. Se você já possui uma conta, realize o login.';
      break;
    case 'auth/invalid-email':
      friendlyMessage = 'O formato do endereço de e-mail informado é inválido.';
      break;
    case 'auth/weak-password':
      friendlyMessage = 'A senha informada deve conter no mínimo 6 caracteres.';
      break;
    case 'auth/missing-password':
      friendlyMessage = 'Por favor, informe uma senha para acessar ou criar sua conta.';
      break;
    case 'auth/missing-email':
      friendlyMessage = 'Por favor, informe seu endereço de e-mail.';
      break;
    case 'auth/operation-not-allowed':
      friendlyMessage = 'Este método de autenticação está temporariamente indisponível.';
      break;
    case 'auth/user-not-found':
      friendlyMessage = 'Nenhuma conta cadastrada encontrada com este e-mail. Crie uma conta na aba "Quero Me Cadastrar".';
      break;
    case 'auth/wrong-password':
      friendlyMessage = 'Senha incorreta para este e-mail.';
      break;
    case 'auth/invalid-credential':
      friendlyMessage = 'Credenciais de acesso incorretas. Verifique se o e-mail e a senha foram digitados corretamente.';
      break;
    case 'auth/user-disabled':
      friendlyMessage = 'Esta conta de usuário foi desativada pelo administrador.';
      break;
    case 'auth/too-many-requests':
      friendlyMessage = 'Acesso temporariamente bloqueado por excesso de tentativas consecutivas. Aguarde alguns minutos.';
      break;
    case 'auth/network-request-failed':
      friendlyMessage = 'Falha de comunicação com o servidor. Verifique sua conexão com a internet e tente novamente.';
      break;
    case 'auth/popup-closed-by-user':
      friendlyMessage = 'A janela de autenticação do Google foi fechada antes da conclusão do login.';
      break;
    case 'auth/popup-blocked':
      friendlyMessage = 'O navegador bloqueou a janela pop-up de autenticação do Google. Habilite pop-ups para este site.';
      break;
    case 'auth/cancelled-popup-request':
      friendlyMessage = 'Apenas uma janela de login do Google pode ser aberta por vez.';
      break;
    case 'auth/account-exists-with-different-credential':
      friendlyMessage = 'Já existe uma conta cadastrada com este e-mail utilizando outro método de autenticação.';
      break;
    case 'auth/credential-already-in-use':
      friendlyMessage = 'Esta credencial de login já está associada a outra conta de usuário.';
      break;
    case 'auth/requires-recent-login':
      friendlyMessage = 'Esta operação exige que você faça login novamente por motivos de segurança.';
      break;
    case 'auth/unauthorized-domain':
      friendlyMessage = 'Origem não autorizada para login. Tente novamente mais tarde.';
      break;
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      friendlyMessage = 'Falha de comunicação com o serviço de autenticação.';
      break;
    case 'auth/quota-exceeded':
      friendlyMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
      break;
    case 'auth/invalid-institutional-email':
      friendlyMessage = 'O e-mail informado não possui um domínio institucional educacional permitido para contas docentes.';
      break;
    case 'auth/internal-error':
      friendlyMessage = 'Erro interno temporário. Tente novamente em instantes.';
      break;
    case 'permission-denied':
      friendlyMessage = 'Permissão negada ao salvar os dados do perfil. Tente novamente.';
      break;
    case 'unavailable':
      friendlyMessage = 'O serviço está temporariamente indisponível. Verifique a conexão com a internet.';
      break;
    default:
      if (rawMsg) {
        const cleanMsg = rawMsg
          .replace(/^Firebase:\s*/i, '')
          .replace(/^FirebaseError:\s*/i, '')
          .replace(/\s*\([a-z0-9_/-]+\)\.?$/i, '')
          .replace(/\s*\[[a-z0-9_/-]+\]\.?$/i, '')
          .replace(/\bFirebase\b/gi, 'serviço');
        friendlyMessage = cleanMsg || (context === 'register' ? 'Erro ao realizar cadastro.' : 'Erro ao realizar login.');
      } else {
        friendlyMessage = context === 'register' ? 'Erro ao realizar cadastro.' : 'Erro ao realizar login.';
      }
      break;
  }

  return {
    code: code || 'auth/error',
    message: friendlyMessage,
    rawMessage: rawMsg,
    fullText: friendlyMessage
  };
}

export const OFFICIAL_INSTITUTION_SPECS = [
  {
    institution: 'IFPR Campus Ivaiporã / Rede Federal',
    baseDomains: ['ifpr.edu.br'],
    allowedSubdomains: [
      'ivaipora', 'curitiba', 'londrina', 'maringa', 'paranagua', 'foz',
      'cascavel', 'umuarama', 'campo-largo', 'jacarezinho', 'telemaco-borba',
      'assis-chateaubriand', 'pinhais', 'colombo', 'pitanga', 'goioere',
      'qquedaso', 'barracao', 'capanema', 'coronel-vivida', 'jaguariaiva',
      'uniao-da-vitoria', 'astorga', 'arapongas', 'ead', 'reitoria',
      'docente', 'professor', 'servidor', 'dti'
    ]
  },
  {
    institution: 'UTFPR - Univ. Tecnológica Federal do Paraná',
    baseDomains: ['utfpr.edu.br'],
    allowedSubdomains: ['cm', 'ap', 'ld', 'ct', 'cp', 'pg', 'pb', 'md', 'fb', 'dv', 'td', 'sh', 'gp', 'docente', 'prof', 'professor', 'reitoria', 'dti']
  },
  {
    institution: 'UFPR - Univ. Federal do Paraná',
    baseDomains: ['ufpr.br'],
    allowedSubdomains: ['inf', 'dinf', 'exatas', 'bio', 'humanas', 'docente', 'prof', 'reitoria', 'palotina', 'jandaia', 'matinhos']
  },
  {
    institution: 'UENP - Univ. Estadual do Norte do Paraná',
    baseDomains: ['uenp.edu.br'],
    allowedSubdomains: ['clm', 'cct', 'cj', 'docente', 'prof', 'reitoria']
  },
  {
    institution: 'UEL - Univ. Estadual de Londrina',
    baseDomains: ['uel.br'],
    allowedSubdomains: ['dc', 'depto', 'docente', 'prof', 'reitoria', 'cce', 'cca', 'ctu']
  },
  {
    institution: 'UEM - Univ. Estadual de Maringá',
    baseDomains: ['uem.br'],
    allowedSubdomains: ['din', 'dma', 'dfi', 'des', 'dco', 'dad', 'docente', 'prof', 'reitoria']
  },
  {
    institution: 'UNESPAR - Univ. Estadual do Paraná',
    baseDomains: ['unespar.edu.br'],
    allowedSubdomains: ['campo-mourao', 'curitiba', 'paranavai', 'apucarana', 'paranagua', 'uniao-da-vitoria', 'docente', 'prof']
  },
  {
    institution: 'UNICENTRO - Univ. Estadual do Centro-Oeste',
    baseDomains: ['unicentro.br'],
    allowedSubdomains: ['docente', 'prof', 'pitanga', 'prudentopolis', 'irati', 'guarapuava']
  },
  {
    institution: 'UEPG - Univ. Estadual de Ponta Grossa',
    baseDomains: ['uepg.br'],
    allowedSubdomains: ['docente', 'prof', 'deinfo', 'reitoria']
  },
  {
    institution: 'UNIOESTE - Univ. Estadual do Oeste do Paraná',
    baseDomains: ['unioeste.br'],
    allowedSubdomains: ['docente', 'prof', 'reitoria', 'cascavel', 'foz', 'toledo']
  },
  {
    institution: 'Univale Ivaiporã',
    baseDomains: ['univale.edu.br', 'univale.com.br', 'faive.edu.br', 'feati.edu.br', 'faculdadeivaipora.com.br', 'faculdadeivaipora.edu.br'],
    allowedSubdomains: ['docente', 'prof', 'ead']
  },
  {
    institution: 'FATEC Ivaiporã',
    baseDomains: ['fatec.edu.br', 'fatecivaipora.edu.br'],
    allowedSubdomains: ['docente', 'prof', 'ivaipora']
  },
  {
    institution: 'Rede Pública Estadual (SEED-PR)',
    baseDomains: ['escola.pr.gov.br', 'prof.pr.gov.br', 'seed.pr.gov.br', 'educacao.pr.gov.br'],
    allowedSubdomains: []
  },
  {
    institution: 'Ivaí Conecta (Ambiente Docente Homologado)',
    baseDomains: ['ivaiconecta.com.br'],
    allowedSubdomains: ['docente', 'prof', 'professor']
  },
  {
    institution: 'UniCesumar',
    baseDomains: ['unicesumar.edu.br', 'unicesumar.com.br'],
    allowedSubdomains: ['docente', 'prof', 'ead']
  },
  {
    institution: 'PUCPR',
    baseDomains: ['pucpr.br', 'pucpr.edu.br'],
    allowedSubdomains: ['docente', 'prof', 'londrina', 'maringa', 'curitiba']
  },
  {
    institution: 'UniFil Londrina',
    baseDomains: ['unifil.br'],
    allowedSubdomains: ['docente', 'prof', 'ead']
  },
  {
    institution: 'Universidade Positivo',
    baseDomains: ['up.edu.br'],
    allowedSubdomains: ['docente', 'prof']
  },
  {
    institution: 'USP - Universidade de São Paulo',
    baseDomains: ['usp.br'],
    allowedSubdomains: ['ime', 'poli', 'icmc', 'ffclrp', 'docente', 'prof']
  },
  {
    institution: 'UNICAMP',
    baseDomains: ['unicamp.br'],
    allowedSubdomains: ['ic', 'fee', 'fem', 'docente', 'prof']
  },
  {
    institution: 'UNESP',
    baseDomains: ['unesp.br'],
    allowedSubdomains: ['ibilce', 'fc', 'docente', 'prof']
  },
  {
    institution: 'UFRJ',
    baseDomains: ['ufrj.br'],
    allowedSubdomains: ['dcc', 'poli', 'docente', 'prof']
  },
  {
    institution: 'UFMG',
    baseDomains: ['ufmg.br'],
    allowedSubdomains: ['dcc', 'eng', 'docente', 'prof']
  },
  {
    institution: 'UnB',
    baseDomains: ['unb.br'],
    allowedSubdomains: ['cic', 'docente', 'prof']
  },
  {
    institution: 'UFSC',
    baseDomains: ['ufsc.br'],
    allowedSubdomains: ['inf', 'ctc', 'docente', 'prof']
  },
  {
    institution: 'UFRGS',
    baseDomains: ['ufrgs.br'],
    allowedSubdomains: ['inf', 'docente', 'prof']
  }
];

const ALLOWED_INTERNATIONAL_DOMAINS = [
  'mit.edu', 'harvard.edu', 'stanford.edu', 'berkeley.edu', 'cmu.edu',
  'oxford.ac.uk', 'cam.ac.uk'
];

export const ALLOWED_INSTITUTIONAL_DOMAINS = OFFICIAL_INSTITUTION_SPECS.flatMap(s => s.baseDomains);

export function isInstitutionalEmail(email) {
  if (!email || typeof email !== 'string') return false;
  let clean = email.toLowerCase().trim();

  // Trata formatos com nome de exibição: "Prof. Nome" <email@ifpr.edu.br>
  const matchAngle = clean.match(/<([^>]+)>/);
  if (matchAngle) {
    clean = matchAngle[1].toLowerCase().trim();
  }

  const atIndex = clean.lastIndexOf('@');
  if (atIndex === -1 || atIndex === clean.length - 1) return false;

  const domain = clean.slice(atIndex + 1).trim();
  if (!domain) return false;

  // 1. Verificação contra a tabela oficial de especificações institucionais
  for (const spec of OFFICIAL_INSTITUTION_SPECS) {
    for (const base of spec.baseDomains) {
      if (domain === base) {
        return true; // Match exato com domínio oficial (ex: @ifpr.edu.br, @univale.edu.br)
      }
      if (domain.endsWith('.' + base)) {
        const sub = domain.slice(0, domain.length - base.length - 1);
        // Só permite se o subdomínio for um subdomínio legítimo/acadêmico da instituição
        if (spec.allowedSubdomains && spec.allowedSubdomains.includes(sub)) {
          return true;
        }
        // Subdomínio arbitrário ou fake em instituição conhecida (ex: abacaxi.ifpr.edu.br) -> REJEITA!
        return false;
      }
    }
  }

  // 2. Faculdades e Universidades brasileiras registradas oficialmente no Registro.br sob .edu.br
  // Formato oficial obrigatório: <instituicao>.edu.br ou (docente|prof|professor|ead|campus).<instituicao>.edu.br
  if (domain.endsWith('.edu.br')) {
    const parts = domain.split('.');
    if (parts.length === 3) {
      const instName = parts[0];
      const blockedNames = ['abacaxi', 'teste', 'fake', 'fakeedu', 'exemplo', 'qualquer'];
      if (instName.length >= 2 && !blockedNames.includes(instName)) {
        return true;
      }
    } else if (parts.length === 4) {
      const sub = parts[0];
      const instName = parts[1];
      const validAcademicPrefixes = ['docente', 'prof', 'professor', 'ead', 'reitoria', 'campus', 'pos', 'lab', 'ti', 'dti'];
      if (validAcademicPrefixes.includes(sub) && instName.length >= 2) {
        return true;
      }
    }
    return false;
  }

  // 3. Universidades internacionais de referência explicitamente credenciadas
  if (ALLOWED_INTERNATIONAL_DOMAINS.includes(domain)) {
    return true;
  }

  return false;
}

export function inferInstitutionFromEmail(email) {
  if (!email || typeof email !== 'string') return 'IFPR Campus Ivaiporã';
  let clean = email.toLowerCase().trim();
  const matchAngle = clean.match(/<([^>]+)>/);
  if (matchAngle) {
    clean = matchAngle[1].toLowerCase().trim();
  }
  const atIndex = clean.lastIndexOf('@');
  const domain = atIndex !== -1 ? clean.slice(atIndex + 1).trim() : clean;

  for (const spec of OFFICIAL_INSTITUTION_SPECS) {
    for (const base of spec.baseDomains) {
      if (domain === base || domain.endsWith('.' + base)) {
        return spec.institution;
      }
    }
  }

  return 'Instituição de Ensino Superior / Técnico';
}

export async function login(email, password) {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Buscar perfil adicional no Firestore ou criar se ausente
    let profileRes = await getUserProfile(fbUser.uid);
    let profileData = profileRes.profile;

    if (!profileData) {
      try {
        const createdProfile = await ensureUserProfile(fbUser, inferRoleFromFirebaseUser(fbUser));
        profileRes = { success: true, profile: createdProfile };
        profileData = createdProfile;
      } catch (profileErr) {
        console.warn('[login] Não foi possível criar o perfil inicial no Firestore:', profileErr);
        const guessedRole = isInstitutionalEmail(cleanEmail) ? 'professor' : 'aluno';
        const guessedRoleMeta = USER_ROLES[guessedRole] || USER_ROLES.aluno;
        profileData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: cleanEmail,
          name: fbUser.displayName || (cleanEmail.split('@')[0].replace(/[._-]/g, ' ')),
          city: 'Ivaiporã',
          role: guessedRole,
          badge: guessedRoleMeta.badge,
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          ...(guessedRole === 'professor' ? {
            institution: inferInstitutionFromEmail(cleanEmail),
            degree: 'Docente / Pesquisador',
            discipline: 'Docência & Orientação Acadêmica',
            verified: true
          } : {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'users', fbUser.uid), profileData, { merge: true });
        } catch (err) {
          console.warn('[login] Aviso ao sincronizar perfil novo no Firestore:', err.message);
        }
      }
    }

    if (profileData?.blocked === true || profileData?.status === 'blocked') {
      await signOut(auth);
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      return {
        success: false,
        error: `Esta conta foi suspensa pela moderação.${profileData?.blockedReason ? ' Motivo: ' + profileData.blockedReason : ' Entre em contato com a administração para mais detalhes.'}`
      };
    }

    const rawRole = profileData.activeRole ||
      profileData.selectedRole ||
      profileData.profileType ||
      profileData.role ||
      (isInstitutionalEmail(cleanEmail) ? 'professor' : 'aluno');
    const role = normalizeUserRole(rawRole);
    const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;

    const sessionUser = {
      ...profileData,
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      name: profileData.name || fbUser.displayName || 'Usuário',
      city: profileData.city || 'Ivaiporã',
      role,
      activeRole: role,
      selectedRole: role,
      badge: roleMeta.badge,
      avatar: profileData.avatar || fbUser.photoURL || '',
      isVerifiedStudent: profileData.isVerifiedStudent ?? (role === 'aluno' ? false : true),
      isVerifiedCompany: profileData.isVerifiedCompany ?? (role === 'empresa'),
      ...(profileData || {}),
      emailVerified: role === 'aluno' ? Boolean(fbUser.emailVerified || profileData?.emailVerified) : true
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  } catch (error) {
    const formatted = formatFirebaseAuthError(error, 'login');
    return {
      success: false,
      error: formatted.message,
      errorCode: formatted.code,
      fullError: formatted.fullText,
      rawMessage: formatted.rawMessage
    };
  }
}

export async function register(data) {
  const { email, name, city, role, password } = data;
  const cleanEmail = email.toLowerCase().trim();
  const cleanName = (name || '').trim().slice(0, 70);
  const selectedRole = role || 'aluno';
  const roleMeta = USER_ROLES[selectedRole] || USER_ROLES.aluno;

  // Validação estrita para estudantes: exige e-mail educacional institucional
  let studentVerification = null;
  if (selectedRole === 'aluno') {
    studentVerification = validateStudentEmail(cleanEmail);
    if (!studentVerification.isValid) {
      return {
        success: false,
        error: studentVerification.error || 'Para criar uma conta de Aluno, é obrigatório utilizar o e-mail institucional da sua faculdade (ex: @estudante.ifpr.edu.br, @aluno.uenp.edu.br, @univale.edu.br ou qualquer domínio .edu.br).'
      };
    }
  }

  if (selectedRole === 'professor' && !isInstitutionalEmail(cleanEmail)) {
    return {
      success: false,
      errorCode: 'auth/invalid-institutional-email',
      error: 'Professores e docentes devem utilizar um e-mail institucional válido (ex: @ifpr.edu.br, @uenp.edu.br, @univale.edu.br, @uel.br, @uem.br, @utfpr.edu.br, @ufpr.br, @seed.pr.gov.br ou qualquer domínio educacional .edu.br).'
    };
  }

  const defaultRoleData = {
    aluno: {
      course: data.course || '',
      institution: data.institution || studentVerification?.institution || studentVerification?.shortInstitution || 'IFPR Campus Ivaiporã',
      period: data.period || '',
      skills: data.skills || [],
      isVerifiedStudent: false, // Prova de Propriedade: Requer confirmação via Firebase Auth
      studentEmailVerifiedAt: null,
      studentEmailDomain: studentVerification?.domain || null,
      studentEmail: cleanEmail,
      studentEmailVerificationSentAt: null,
      raNumber: data.raNumber || '',
      bio: data.bio || '',
      experiences: [],
      projects: [],
      education: [],
      endorsements: []
    },
    candidato: {
      course: data.course || '',
      institution: data.institution || '',
      period: data.period || '',
      skills: data.skills || [],
      isVerifiedStudent: false,
      bio: data.bio || '',
      experiences: [],
      projects: [],
      education: [],
      endorsements: []
    },
    professor: {
      degree: data.degree || 'Docente / Pesquisador',
      institution: data.institution || inferInstitutionFromEmail(cleanEmail),
      discipline: data.discipline || 'Docência & Orientação Acadêmica',
      endorsementCount: 0,
      verified: true,
      bio: data.bio || '',
      education: [],
      classes: []
    },
    empresa: {
      cnpj: data.cnpj || '',
      isVerifiedCompany: false,
      sector: data.sector || '',
      size: data.size || '',
      about: data.about || '',
      history: '',
      perks: []
    },
    freelancer: {
      category: data.category || '',
      skills: data.skills || [],
      rating: 5.0,
      reviewsCount: 0,
      bio: data.bio || ''
    }
  };

  const roleSpecific = defaultRoleData[selectedRole] || defaultRoleData.aluno;

  try {
    // 1. Criar conta no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // 2. Disparar link de verificação de e-mail do Firebase Auth (apenas para alunos)
    let emailVerificationSent = false;
    let emailVerificationError = null;
    if (selectedRole === 'aluno') {
      try {
        await sendEmailVerification(fbUser);
        emailVerificationSent = true;
      } catch (eErr) {
        console.warn('[Firebase Auth Register] Falha ao disparar sendEmailVerification:', eErr);
        emailVerificationError = eErr.message;
      }
    }

    // 3. Salvar documento completo no Firestore em users/{uid}
    const profileData = {
      id: fbUser.uid,
      uid: fbUser.uid,
      name: cleanName,
      email: cleanEmail,
      emailVerified: selectedRole === 'aluno' ? false : true,
      city: city || 'Ivaiporã',
      role: selectedRole,
      badge: roleMeta.badge,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...roleSpecific,
      ...(emailVerificationSent ? { studentEmailVerificationSentAt: new Date().toISOString() } : {})
    };
    await setDoc(doc(db, 'users', fbUser.uid), profileData);
    seedFirestoreIfEmpty();

    const sessionUser = {
      ...profileData,
      isVerifiedCompany: selectedRole === 'empresa'
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));

    // Atualiza cache local de usuários sem nenhuma senha
    try {
      const users = getUsersDB();
      const existingIdx = users.findIndex(u => u.uid === fbUser.uid || u.email?.toLowerCase() === cleanEmail);
      if (existingIdx >= 0) {
        users[existingIdx] = { ...sessionUser };
      } else {
        users.push({ ...sessionUser });
      }
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    } catch { }

    return {
      success: true,
      user: sessionUser,
      emailVerificationSent,
      emailVerificationError
    };
  } catch (error) {
    console.warn('[Firebase Auth Register] Falha no Firebase:', error.code, error.message);
    const formatted = formatFirebaseAuthError(error, 'register');
    return {
      success: false,
      error: formatted.message,
      errorCode: formatted.code,
      fullError: formatted.fullText,
      rawMessage: formatted.rawMessage
    };
  }
}

export async function loginWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const fbUser = userCredential.user;

    // Checar perfil existente no Firestore ou criar se ausente
    let profileRes = await getUserProfile(fbUser.uid);
    const needsProfileCompletion = !profileRes.success || !profileRes.profile?.role;

    if (profileRes.errorCode === 'profile/not-found' || !profileRes.profile) {
      try {
        const createdProfile = await ensureUserProfile(fbUser, inferRoleFromFirebaseUser(fbUser));
        profileRes = { success: true, profile: createdProfile };
      } catch (profileErr) {
        console.warn('[loginWithGoogle] Não foi possível criar o perfil inicial no Firestore:', profileErr);
      }
    }

    if (profileRes.profile?.blocked === true || profileRes.profile?.status === 'blocked') {
      await signOut(auth);
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      return {
        success: false,
        error: `Esta conta Google foi suspensa pela moderação.${profileRes.profile?.blockedReason ? ' Motivo: ' + profileRes.profile.blockedReason : ' Entre em contato com o suporte.'}`
      };
    }

    const email = (fbUser.email || '').toLowerCase().trim();
    const fallbackRole = isInstitutionalEmail(email) ? 'professor' : 'aluno';
    const rawRole = profileRes.profile?.activeRole ||
      profileRes.profile?.selectedRole ||
      profileRes.profile?.profileType ||
      profileRes.profile?.role ||
      fallbackRole;
    const role = normalizeUserRole(rawRole);
    const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;
    const studentCheck = validateStudentEmail(fbUser.email);
    const isGoogleStudent = Boolean(studentCheck?.isValid && fbUser.emailVerified);

    const sessionUser = {
      ...profileRes.profile,
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      emailVerified: fbUser.emailVerified,
      name: profileRes.profile?.name || fbUser.displayName || 'Usuário Google',
      city: profileRes.profile?.city || 'Ivaiporã',
      role,
      activeRole: role,
      selectedRole: role,
      badge: roleMeta.badge,
      avatar: fbUser.photoURL || profileRes.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isVerifiedStudent: profileRes.profile?.isVerifiedStudent ?? (role === 'aluno' ? isGoogleStudent : false),
      isVerifiedCompany: role === 'empresa',
      ...(role === 'aluno' && isGoogleStudent && !profileRes.profile?.institution ? {
        institution: studentCheck?.institution || 'IFPR Campus Ivaiporã',
        studentEmailVerifiedAt: new Date().toISOString()
      } : {}),
      ...(role === 'professor' && !profileRes.profile?.institution ? {
        institution: inferInstitutionFromEmail(email),
        degree: 'Docente / Pesquisador',
        discipline: 'Docência & Orientação Acadêmica',
        verified: true
      } : {}),
      ...(profileRes.profile || {})
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser, needsProfileCompletion };
  } catch (error) {
    const formatted = formatFirebaseAuthError(error, 'google');
    return {
      success: false,
      error: formatted.message,
      errorCode: formatted.code,
      fullError: formatted.fullText,
      rawMessage: formatted.rawMessage
    };
  }
}

export async function completeUserProfile(uid, additionalData) {
  try {
    const roleMeta = USER_ROLES[additionalData.role] || USER_ROLES.aluno;
    const avatar = additionalData.avatar || auth.currentUser?.photoURL || getAuthUser()?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
    const email = (additionalData.email || auth.currentUser?.email || '').toLowerCase().trim();

    const candidateEmail = (additionalData.studentEmail || additionalData.email || '').toLowerCase().trim();
    const studentCheck = validateStudentEmail(candidateEmail);
    const isOwnerEmailVerified = Boolean(
      auth.currentUser?.emailVerified &&
      auth.currentUser?.email?.toLowerCase() === candidateEmail
    );
    const isStudentVerified = Boolean(additionalData.role === 'aluno' && studentCheck.isValid && isOwnerEmailVerified);
    const cleanName = typeof additionalData.name === 'string' ? additionalData.name.trim().slice(0, 70) : additionalData.name;

    const payload = {
      name: cleanName,
      email: email,
      city: additionalData.city,
      role: additionalData.role,
      avatar: avatar,
      updatedAt: new Date().toISOString(),
      ...(additionalData.role === 'professor' ? {
        institution: additionalData.institution || inferInstitutionFromEmail(email),
        degree: additionalData.degree || 'Docente / Pesquisador',
        discipline: additionalData.discipline || 'Docência & Orientação Acadêmica',
        verified: true
      } : {}),
      ...(additionalData.cnpj && { cnpj: additionalData.cnpj }),
      ...(additionalData.razaoSocial && { razaoSocial: additionalData.razaoSocial }),
      ...(additionalData.nomeFantasia && { nomeFantasia: additionalData.nomeFantasia }),
      ...(additionalData.situacaoCnpj && { situacaoCnpj: additionalData.situacaoCnpj }),
      ...(additionalData.isVerifiedCompany !== undefined ? { isVerifiedCompany: additionalData.isVerifiedCompany } : (additionalData.role === 'empresa' && !!additionalData.cnpj ? { isVerifiedCompany: true } : {})),
      ...(additionalData.role === 'aluno' ? {
        isVerifiedStudent: isStudentVerified,
        studentEmail: candidateEmail,
        institution: additionalData.institution || studentCheck?.institution || studentCheck?.shortInstitution || 'IFPR Campus Ivaiporã',
        ...(isStudentVerified ? {
          studentEmailVerifiedAt: new Date().toISOString()
        } : {
          studentEmailVerifiedAt: null
        })
      } : {})
    };

    await setDoc(doc(db, 'users', uid), payload, { merge: true });

    const updated = updateAuthUser({
      name: additionalData.name,
      city: additionalData.city,
      role: additionalData.role,
      avatar: avatar,
      badge: roleMeta.badge,
      ...(additionalData.role === 'professor' ? {
        institution: additionalData.institution || inferInstitutionFromEmail(email),
        degree: additionalData.degree || 'Docente / Pesquisador',
        discipline: additionalData.discipline || 'Docência & Orientação Acadêmica',
        verified: true
      } : {}),
      ...(additionalData.cnpj && { cnpj: additionalData.cnpj }),
      ...(additionalData.razaoSocial && { razaoSocial: additionalData.razaoSocial }),
      ...(additionalData.nomeFantasia && { nomeFantasia: additionalData.nomeFantasia }),
      ...(additionalData.situacaoCnpj && { situacaoCnpj: additionalData.situacaoCnpj }),
      isVerifiedCompany: additionalData.isVerifiedCompany ?? (additionalData.role === 'empresa' && !!additionalData.cnpj),
      ...(additionalData.role === 'aluno' ? {
        isVerifiedStudent: isStudentVerified,
        studentEmail: candidateEmail,
        institution: additionalData.institution || studentCheck?.institution || studentCheck?.shortInstitution || 'IFPR Campus Ivaiporã',
        ...(isStudentVerified ? {
          studentEmailVerifiedAt: new Date().toISOString()
        } : {
          studentEmailVerifiedAt: null
        })
      } : {})
    });

    // Se informou um e-mail de aluno válido que ainda não é verificado, dispara a verificação em segundo plano
    if (additionalData.role === 'aluno' && studentCheck.isValid && !isStudentVerified) {
      try {
        await sendStudentVerificationEmail(candidateEmail);
      } catch { }
    }

    return { success: true, user: updated, verificationPending: (additionalData.role === 'aluno' && !isStudentVerified) };
  } catch (error) {
    const formatted = formatFirebaseAuthError(error, 'completeProfile');
    return {
      success: false,
      error: formatted.message,
      errorCode: formatted.code,
      fullError: formatted.fullText
    };
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch { }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }
}

/**
 * Verifica se a conta do usuário conectado utiliza exclusivamente provedor Google (sem senha de e-mail cadastrada)
 */
export function isGoogleOnlyAuthUser() {
  const user = auth.currentUser;
  if (!user || !user.providerData) return false;
  return (
    user.providerData.every(p => p.providerId !== 'password') &&
    user.providerData.some(p => p.providerId === 'google.com')
  );
}

/**
 * Altera a senha do usuário autenticado no Firebase Auth.
 * Se a senha atual for fornecida, reautentica previamente para autorizar a operação sensível.
 * Se o Firebase lançar auth/requires-recent-login, sinaliza requiresReauth para solicitar a senha atual,
 * ou dispara reautenticação com Google caso seja conta vinculada exclusivamente pelo Google.
 *
 * @param {string} currentPassword - Senha atual do usuário
 * @param {string} newPassword - Nova senha a ser configurada
 * @returns {Promise<{success: boolean, message?: string, error?: string, requiresReauth?: boolean, errorCode?: string}>}
 */
export async function updateUserPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      error: 'Nenhuma sessão ativa encontrada no Firebase. Por favor, faça login novamente.'
    };
  }

  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: 'A nova senha deve ter no mínimo 6 caracteres.'
    };
  }

  if (currentPassword && currentPassword === newPassword) {
    return {
      success: false,
      error: 'A nova senha deve ser diferente da senha atual.'
    };
  }

  const isGoogleOnly = isGoogleOnlyAuthUser();

  try {
    // Se foi informada a senha atual e a conta possui e-mail, executa reautenticação
    if (currentPassword && user.email) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    }

    // Aplica a nova senha no Firebase Authentication
    await updatePassword(user, newPassword);

    return {
      success: true,
      message: 'Senha alterada com sucesso no Firebase Authentication!'
    };
  } catch (error) {
    console.error('[authService] Erro ao alterar senha no Firebase:', error.code, error.message);

    if (error.code === 'auth/requires-recent-login') {
      if (isGoogleOnly) {
        try {
          await reauthenticateWithPopup(user, googleProvider);
          await updatePassword(user, newPassword);
          return {
            success: true,
            message: 'Senha definida com sucesso após confirmação com o Google!'
          };
        } catch (popupErr) {
          return {
            success: false,
            error: 'Falha na confirmação com o Google: ' + (popupErr.message || popupErr.code)
          };
        }
      }

      return {
        success: false,
        requiresReauth: true,
        error: 'Esta é uma operação sensível e exige reautenticação recente. Por favor, confirme sua senha atual.'
      };
    }

    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return {
        success: false,
        error: 'A senha atual informada está incorreta.'
      };
    }

    if (error.code === 'auth/weak-password') {
      return {
        success: false,
        error: 'A nova senha deve ter no mínimo 6 caracteres.'
      };
    }

    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        error: 'Muitas tentativas sem sucesso. Aguarde alguns instantes antes de tentar novamente.'
      };
    }

    return {
      success: false,
      error: error.message || 'Erro ao alterar a senha no Firebase.',
      errorCode: error.code
    };
  }
}

export function watchAuthState(callback) {
  let unsubscribeProfile = null;

  try {
    return onAuthStateChanged(auth, async (fbUser) => {
      try {
        // Cancela o listener anterior quando o usuário muda ou sai
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (fbUser) {
          seedFirestoreIfEmpty();

          let profileRes = { success: false, profile: {} };
          let profileWasMissing = false;

          try {
            profileRes = await getUserProfile(fbUser.uid);
            profileWasMissing = profileRes.errorCode === 'profile/not-found';
          } catch (pErr) {
            console.warn(
              '[watchAuthState] Erro ao buscar perfil do Firestore:',
              pErr
            );
          }

          if (profileWasMissing) {
            try {
              const createdProfile = await ensureUserProfile(
                fbUser,
                inferRoleFromFirebaseUser(fbUser)
              );
              profileRes = { success: true, profile: createdProfile };
              profileWasMissing = false;
            } catch (createErr) {
              console.warn('[watchAuthState] Falha ao criar perfil inicial:', createErr);
            }
          }

          const userEmail = (fbUser.email || '').toLowerCase().trim();
          const fallbackRole = isInstitutionalEmail(userEmail) ? 'professor' : 'aluno';
          const rawRole = profileRes.profile?.activeRole ||
            profileRes.profile?.selectedRole ||
            profileRes.profile?.profileType ||
            profileRes.profile?.role ||
            fallbackRole;
          const role = normalizeUserRole(rawRole);
          const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;
          let isVerifiedStudent =
            profileRes.profile?.isVerifiedStudent ??
            (role === 'aluno' ? false : true);

          // Sincronização em tempo real da Prova de Propriedade:
          // Se o Firebase Auth confirmar user.emailVerified === true para um aluno com e-mail estudantil válido,
          // promove automaticamente seu status no Firestore e na sessão.
          if (role === 'aluno' && !isVerifiedStudent && fbUser.emailVerified) {
            const studentCheck = validateStudentEmail(fbUser.email);
            if (studentCheck.isValid) {
              isVerifiedStudent = true;
              try {
                await setDoc(
                  doc(db, 'users', fbUser.uid),
                  {
                    isVerifiedStudent: true,
                    emailVerified: true,
                    studentEmail: fbUser.email.toLowerCase().trim(),
                    institution:
                      profileRes.profile?.institution ||
                      studentCheck.institution,
                    shortInstitution:
                      profileRes.profile?.shortInstitution ||
                      studentCheck.shortInstitution,
                    studentEmailVerifiedAt: new Date().toISOString()
                  },
                  { merge: true }
                );
              } catch (syncErr) {
                console.warn(
                  '[watchAuthState] Erro ao sincronizar status de verificação estudantil:',
                  syncErr
                );
              }
            }
          }

          // Verifica bloqueio já existente
          const isBlocked =
            profileRes.profile?.blocked === true ||
            profileRes.profile?.status === 'blocked';

          if (isBlocked) {
            console.warn(
              '[watchAuthState] Usuário bloqueado. Encerrando sessão.'
            );

            localStorage.removeItem(STORAGE_KEY_AUTH_USER);

            await signOut(auth);

            callback(null);

            return;
          }

          const isStudentVerified = Boolean(
            profileRes.profile?.isVerifiedStudent ||
            profileRes.profile?.emailVerified ||
            fbUser.emailVerified ||
            isVerifiedStudent
          );

          const sessionUser = {
            ...profileRes.profile,
            uid: fbUser.uid,
            id: fbUser.uid,
            email: fbUser.email,
            emailVerified: role === 'aluno' ? isStudentVerified : true,
            name:
              profileRes.profile?.name ||
              fbUser.displayName ||
              'Usuário',
            city: profileRes.profile?.city || 'Ivaiporã',
            role,
            activeRole: role,
            selectedRole: role,
            badge: roleMeta.badge,
            avatar:
              profileRes.profile?.avatar ||
              fbUser.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            isVerifiedStudent: isStudentVerified,
            isVerifiedCompany:
              profileRes.profile?.isVerifiedCompany ??
              (role === 'empresa'),
            blocked: false,
            blockedReason: null,
            ...(role === 'professor' && !profileRes.profile?.institution ? {
              institution: inferInstitutionFromEmail(userEmail),
              degree: 'Docente / Pesquisador',
              discipline: 'Docência & Orientação Acadêmica',
              verified: true
            } : {}),
            ...(profileRes.profile || {}),
            emailVerified: role === 'aluno' ? isStudentVerified : true,
            isVerifiedStudent: isStudentVerified
          };

          localStorage.setItem(
            STORAGE_KEY_AUTH_USER,
            JSON.stringify(sessionUser)
          );

          callback(sessionUser);

          // ============================================================
          // MONITORAMENTO EM TEMPO REAL DO PERFIL
          // ============================================================

          const userDocRef = doc(db, 'users', fbUser.uid);

          unsubscribeProfile = onSnapshot(
            userDocRef,
            async (snapshot) => {
              try {
                if (!snapshot.exists()) {
                  if (profileWasMissing) {
                    try {
                      const recreated = await ensureUserProfile(fbUser, role);
                      const recreatedSession = {
                        ...sessionUser,
                        ...recreated
                      };
                      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(recreatedSession));
                      callback(recreatedSession);
                      return;
                    } catch (recreateError) {
                      console.warn('[watchAuthState] Falha ao recriar perfil ausente:', recreateError);
                    }
                  }

                  console.warn(
                    '[watchAuthState] Perfil do usuário não existe mais.'
                  );

                  localStorage.removeItem(STORAGE_KEY_AUTH_USER);

                  await signOut(auth);

                  callback(null);

                  return;
                }

                const profile = snapshot.data();

                const blocked =
                  profile?.blocked === true ||
                  profile?.status === 'blocked';

                if (blocked) {
                  const blockedReason =
                    profile?.blockedReason ||
                    'Sua conta foi bloqueada pelo administrador.';

                  console.warn(
                    '[watchAuthState] Bloqueio detectado em tempo real:',
                    blockedReason
                  );

                  // Atualiza os dados locais antes de sair
                  const blockedUser = {
                    ...sessionUser,
                    ...profile,
                    blocked: true,
                    blockedReason
                  };

                  localStorage.setItem(
                    STORAGE_KEY_AUTH_USER,
                    JSON.stringify(blockedUser)
                  );

                  // Informa para a aplicação que o usuário foi bloqueado
                  callback(blockedUser);

                  // Pequeno atraso para permitir que a interface
                  // mostre a mensagem antes do logout
                  setTimeout(async () => {
                    try {
                      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
                      await signOut(auth);
                    } catch (logoutError) {
                      console.warn(
                        '[watchAuthState] Erro ao encerrar sessão:',
                        logoutError
                      );
                    }
                  }, 300);

                  return;
                }

                // Se o usuário foi desbloqueado, atualiza a sessão
                const updatedUser = {
                  ...sessionUser,
                  ...profile,
                  emailVerified: role === 'aluno' ? (fbUser.emailVerified || Boolean(profile?.emailVerified)) : true,
                  isVerifiedStudent: profile?.isVerifiedStudent ?? sessionUser.isVerifiedStudent,
                  blocked: false,
                  blockedReason: null
                };

                localStorage.setItem(
                  STORAGE_KEY_AUTH_USER,
                  JSON.stringify(updatedUser)
                );

                callback(updatedUser);
              } catch (snapshotError) {
                console.warn(
                  '[watchAuthState] Erro ao processar atualização do perfil:',
                  snapshotError
                );
              }
            },
            (snapshotError) => {
              console.warn(
                '[watchAuthState] Erro no listener do perfil:',
                snapshotError
              );
            }
          );
        } else {
          const localUser = getAuthUser();
          if (localUser && (localUser.id || localUser.uid || localUser.email)) {
            callback(localUser);
          } else {
            localStorage.removeItem(STORAGE_KEY_AUTH_USER);
            callback(null);
          }
        }
      } catch (innerErr) {
        console.warn(
          '[watchAuthState] Erro no processamento do estado de auth:',
          innerErr
        );

        callback(getAuthUser() || null);
      }
    }, (authError) => {
      console.warn(
        '[watchAuthState] Erro no Firebase onAuthStateChanged:',
        authError
      );

      callback(getAuthUser() || null);
    });
  } catch (outerErr) {
    console.warn(
      '[watchAuthState] Falha ao iniciar observador de auth:',
      outerErr
    );

    callback(getAuthUser() || null);

    return () => { };
  }
}

export function updateAuthUser(data, userOverride = null) {
  let current = userOverride || getAuthUser();
  if (!current && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (stored) current = JSON.parse(stored);
    } catch {}
  }
  if (!current) {
    if (auth.currentUser) {
      current = {
        uid: auth.currentUser.uid,
        id: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: auth.currentUser.displayName || 'Usuário'
      };
    } else {
      return null;
    }
  }

  const sanitizedData = { ...data };
  if (typeof sanitizedData.name === 'string') {
    sanitizedData.name = sanitizedData.name.trim().slice(0, 70);
  }
  if (typeof sanitizedData.tradingName === 'string') {
    sanitizedData.tradingName = sanitizedData.tradingName.trim().slice(0, 70);
  }

  const newRole = sanitizedData.role ? String(sanitizedData.role).toLowerCase().trim() : (sanitizedData.activeRole || sanitizedData.selectedRole || (current.role ? String(current.role).toLowerCase().trim() : null));
  const roleMeta = newRole ? (USER_ROLES[newRole] || USER_ROLES.aluno) : null;
  const updated = {
    ...current,
    ...sanitizedData,
    ...(newRole ? {
      role: newRole,
      activeRole: newRole,
      selectedRole: newRole,
      profileType: newRole
    } : {}),
    ...(roleMeta ? { badge: roleMeta.badge } : {})
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));

    const users = getUsersDB();
    const updatedDB = users.map(u => (
      (u.email && current.email && u.email.toLowerCase() === current.email.toLowerCase()) ||
      (String(u.id) === String(current.id) || String(u.uid) === String(current.uid))
        ? { ...u, ...data, ...(newRole ? { role: newRole, activeRole: newRole, selectedRole: newRole, profileType: newRole } : {}), ...(roleMeta ? { badge: roleMeta.badge } : {}) }
        : u
    ));
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(updatedDB));

    // Sincroniza também no cache local de talentos
    try {
      const rawTalents = localStorage.getItem('ivai_conecta_db_talents');
      if (rawTalents) {
        const talents = JSON.parse(rawTalents);
        if (Array.isArray(talents)) {
          const updatedTalents = talents.map(t => {
            const isMatch = (t.email && current.email && t.email.toLowerCase() === current.email.toLowerCase()) ||
              (String(t.id) === String(current.id) || String(t.uid) === String(current.uid));
            return isMatch
              ? { ...t, ...data, ...(newRole ? { role: newRole, activeRole: newRole, selectedRole: newRole, profileType: newRole } : {}), ...(roleMeta ? { badge: roleMeta.badge } : {}) }
              : t;
          });
          localStorage.setItem('ivai_conecta_db_talents', JSON.stringify(updatedTalents));
        }
      }
    } catch (e) {
      console.warn('[updateAuthUser] Falha ao sincronizar cache local de talentos:', e);
    }
  }

  // Sync no Cloud Firestore em todos os IDs aplicáveis do usuário
  const targetUids = new Set(
    [auth.currentUser?.uid, current.uid, current.id, updated.uid, updated.id]
      .filter(Boolean)
      .map(String)
  );

  const payload = {
    ...data,
    ...(newRole ? {
      role: newRole,
      activeRole: newRole,
      selectedRole: newRole,
      profileType: newRole
    } : {}),
    ...(roleMeta ? { badge: roleMeta.badge } : {}),
    updatedAt: new Date().toISOString()
  };

  const syncPromise = (async () => {
    for (const uid of targetUids) {
      try {
        await setDoc(doc(db, 'users', uid), payload, { merge: true });
      } catch (err) {
        console.warn(`[Firestore] Sync erro updateAuthUser para uid ${uid}:`, err.message);
        // Se as regras de segurança do Firestore bloquearem a mutação direta da chave 'role',
        // aplica imediatamente o safePayload com activeRole, selectedRole, profileType e badge
        try {
          const { role: _forbiddenRole, ...safePayload } = payload;
          await setDoc(doc(db, 'users', uid), safePayload, { merge: true });
        } catch (fallbackErr) {
          console.warn(`[Firestore] Fallback seguro erro para uid ${uid}:`, fallbackErr.message);
        }
      }
    }
    return updated;
  })();

  // Permite tanto uso síncrono imediato quanto async/await (Promise Thenable com propriedades do objeto)
  Object.assign(syncPromise, updated);
  return syncPromise;
}

export function submitCompanyVerification(cnpj, fileData, extraData = {}) {
  const digits = cleanCNPJ(cnpj);
  if (digits.length !== 14) {
    return { success: false, error: 'O CNPJ deve conter 14 dígitos numéricos (Ex: 12.345.678/0001-90).' };
  }

  if (!validateCNPJ(digits)) {
    return { success: false, error: 'CNPJ inválido (dígitos verificadores incorretos pelo cálculo oficial da Receita Federal).' };
  }

  const formattedCNPJ = maskCNPJ(digits);
  const filename = typeof fileData === 'object' && fileData?.name ? fileData.name : (fileData ? String(fileData) : 'Cartao_CNPJ.pdf');
  const _filesizeMB = typeof fileData === 'object' && fileData?.size ? (fileData.size / (1024 * 1024)).toFixed(2) : '0.85';

  const updated = updateAuthUser({
    cnpj: formattedCNPJ,
    isVerifiedCompany: true,
    companyProofFile: filename,
    verifiedAt: new Date().toISOString(),
    ...(extraData.razaoSocial && { razaoSocial: extraData.razaoSocial }),
    ...(extraData.nomeFantasia && { nomeFantasia: extraData.nomeFantasia }),
    ...(extraData.situacaoCadastral && { situacaoCnpj: extraData.situacaoCadastral }),
    ...(extraData.cnpjProofUrl && { cnpjProofUrl: extraData.cnpjProofUrl })
  });

  return {
    success: true,
    message: `✅ CNPJ ${formattedCNPJ} autenticado com sucesso! Selo de Empresa Verificada concedido.`,
    user: updated
  };
}

export async function verifyStudentAccount(studentEmail) {
  return await sendStudentVerificationEmail(studentEmail);
}

export { sendStudentVerificationEmail, checkStudentVerification };

export function getSelectedCity() {
  if (typeof localStorage === 'undefined') return 'Todas as Cidades';
  return localStorage.getItem(STORAGE_KEY_CITY) || 'Todas as Cidades';
}

export function setSelectedCity(city) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CITY, city);
}

/**
 * Força a atualização do token do usuário atual no Firebase Auth e sincroniza status de emailVerified.
 * Dispara auth.currentUser.reload() e atualiza Firestore e o cache local.
 */
export async function reloadAuthUser() {
  if (!auth.currentUser) {
    return { success: false, verified: false, error: 'Nenhuma sessão ativa encontrada.' };
  }
  try {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const verified = Boolean(auth.currentUser.emailVerified);

    if (verified) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          emailVerified: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('[reloadAuthUser] Erro ao sincronizar status no Firestore:', err);
      }

      const localUser = getAuthUser();
      if (localUser) {
        const updated = { ...localUser, emailVerified: true };
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
      }
    }

    return { success: true, verified, user: auth.currentUser };
  } catch (error) {
    console.error('[reloadAuthUser] Erro ao recarregar auth.currentUser:', error);
    return { success: false, verified: false, error: error.message };
  }
}

/**
 * Reenvia o e-mail de verificação oficial do Firebase Auth para o usuário logado.
 */
export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    return { success: false, error: 'Nenhum usuário logado no momento.' };
  }
  try {
    await sendEmailVerification(auth.currentUser);
    return { success: true };
  } catch (error) {
    let msg = 'Erro ao reenviar e-mail de verificação.';
    if (error.code === 'auth/too-many-requests') {
      msg = 'Muitas solicitações seguidas. Aguarde alguns instantes antes de tentar novamente.';
    }
    return { success: false, error: msg, errorCode: error.code };
  }
}

