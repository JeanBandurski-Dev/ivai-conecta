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

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

import { seedFirestoreIfEmpty } from './seedFirestore.js';

import {
  validateCNPJ,
  maskCNPJ,
  cleanCNPJ,
} from './cnpjService.js';

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
} from '../data/seedData';

/**
 * Retorna o banco local de usuários sem senhas.
 */
export function getUsersDB() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((user) => {
      if (user && typeof user === 'object') {
        const { password, ...safeUser } = user;
        return safeUser;
      }

      return user;
    });
  } catch {
    return [];
  }
}

/**
 * Remove senhas legadas armazenadas em texto puro no LocalStorage.
 */
export function purgePasswordsFromLocalStorage() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS_DB);

    if (rawUsers) {
      const parsed = JSON.parse(rawUsers);

      if (Array.isArray(parsed)) {
        let hasPassword = false;

        const sanitized = parsed.map((user) => {
          if (
            user &&
            typeof user === 'object' &&
            'password' in user
          ) {
            hasPassword = true;

            const { password, ...clean } = user;
            return clean;
          }

          return user;
        });

        if (hasPassword) {
          localStorage.setItem(
            STORAGE_KEY_USERS_DB,
            JSON.stringify(sanitized)
          );
        }
      }
    }

    const rawAuth = localStorage.getItem(STORAGE_KEY_AUTH_USER);

    if (rawAuth) {
      const authUser = JSON.parse(rawAuth);

      if (
        authUser &&
        typeof authUser === 'object' &&
        'password' in authUser
      ) {
        delete authUser.password;

        localStorage.setItem(
          STORAGE_KEY_AUTH_USER,
          JSON.stringify(authUser)
        );
      }
    }
  } catch (error) {
    console.warn(
      '[authService] Erro ao purgar senhas residuais:',
      error
    );
  }
}

// Limpeza automática de senhas legadas.
purgePasswordsFromLocalStorage();

/**
 * Normaliza as roles utilizadas pelo sistema.
 *
 * Isso evita problemas com usuários antigos que tenham:
 * aluno
 * estudante
 * estudantes
 * student
 * students
 */
export function normalizeUserRole(role) {
  const value = String(role || '')
    .toLowerCase()
    .trim();

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
    administrator: 'admin',
  };

  return aliases[value] ||
    (USER_ROLES[value] ? value : 'aluno');
}

/**
 * Para contas Firebase antigas sem perfil no Firestore,
 * utiliza aluno como role padrão.
 *
 * O perfil pode ser completado/atualizado posteriormente.
 */
function inferRoleFromFirebaseUser() {
  return 'aluno';
}

/**
 * Cria um perfil inicial a partir do usuário Firebase.
 */
function buildDefaultProfileForFirebaseUser(
  fbUser,
  preferredRole = null
) {
  const studentCheck = validateStudentEmail(
    fbUser?.email || ''
  );

  const role = normalizeUserRole(
    preferredRole ||
      inferRoleFromFirebaseUser(fbUser)
  );

  const now = new Date().toISOString();

  const isInstitutionalStudent =
    role === 'aluno' &&
    studentCheck.isValid;

  const isVerified =
    isInstitutionalStudent &&
    Boolean(fbUser?.emailVerified);

  const displayName =
    fbUser?.displayName ||
    (
      fbUser?.email
        ? fbUser.email.split('@')[0]
        : 'Usuário'
    );

  return {
    id: fbUser.uid,
    uid: fbUser.uid,

    name: displayName,

    email: (fbUser.email || '')
      .toLowerCase()
      .trim(),

    emailVerified:
      role === 'aluno'
        ? isVerified
        : true,

    city: 'Ivaiporã',

    role,

    badge:
      (USER_ROLES[role] ||
        USER_ROLES.aluno).badge,

    avatar:
      fbUser.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',

    createdAt: now,
    updatedAt: now,

    ...(role === 'aluno'
      ? {
          course: '',

          institution:
            studentCheck.institution ||
            studentCheck.shortInstitution ||
            'IFPR Campus Ivaiporã',

          period: '',

          skills: [],

          isVerifiedStudent: isVerified,

          studentEmailVerifiedAt:
            isVerified ? now : null,

          studentEmailDomain:
            studentCheck.domain || null,

          studentEmail:
            (fbUser.email || '')
              .toLowerCase()
              .trim(),

          studentEmailVerificationSentAt:
            null,

          raNumber: '',

          bio: '',

          experiences: [],

          projects: [],

          education: [],

          endorsements: [],
        }
      : {}),
  };
}

/**
 * Garante a existência do perfil do usuário no Firestore.
 */
async function ensureUserProfile(
  fbUser,
  preferredRole = null
) {
  const profile =
    buildDefaultProfileForFirebaseUser(
      fbUser,
      preferredRole
    );

  await setDoc(
    doc(db, 'users', fbUser.uid),
    profile,
    { merge: true }
  );

  return profile;
}

/**
 * Constrói o usuário usado pela aplicação.
 */
function buildSessionUser(
  fbUser,
  profile = {}
) {
  const role = normalizeUserRole(
    profile?.role
  );

  const roleMeta =
    USER_ROLES[role] ||
    USER_ROLES.aluno;

  const studentCheck =
    validateStudentEmail(
      fbUser?.email ||
      profile?.studentEmail ||
      ''
    );

  const isVerifiedStudent =
    role === 'aluno'
      ? Boolean(
          profile?.isVerifiedStudent ||
          profile?.emailVerified ||
          fbUser?.emailVerified
        )
      : Boolean(
          profile?.isVerifiedStudent ?? true
        );

  return {
    uid: fbUser.uid,
    id: fbUser.uid,

    email:
      fbUser.email ||
      profile?.email ||
      '',

    emailVerified:
      role === 'aluno'
        ? isVerifiedStudent
        : true,

    name:
      profile?.name ||
      fbUser.displayName ||
      'Usuário',

    city:
      profile?.city ||
      'Ivaiporã',

    role,

    badge: roleMeta.badge,

    avatar:
      profile?.avatar ||
      fbUser.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',

    isVerifiedStudent,

    isVerifiedCompany:
      profile?.isVerifiedCompany ??
      (role === 'empresa'),

    blocked: false,

    blockedReason: null,

    ...profile,

    // Esses campos são sempre normalizados
    // depois da expansão do perfil.
    role,

    badge: roleMeta.badge,

    emailVerified:
      role === 'aluno'
        ? isVerifiedStudent
        : true,

    isVerifiedStudent,

    ...(role === 'aluno' &&
    !profile?.institution &&
    studentCheck.isValid
      ? {
          institution:
            studentCheck.institution ||
            studentCheck.shortInstitution ||
            'IFPR Campus Ivaiporã',
        }
      : {}),
  };
}

/**
 * Retorna o usuário salvo localmente.
 */
export function getAuthUser() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY_AUTH_USER
    );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== 'object'
    ) {
      return null;
    }

    const normalizedRole =
      normalizeUserRole(parsed.role);

    const normalized = {
      ...parsed,

      role: normalizedRole,

      badge:
        (
          USER_ROLES[normalizedRole] ||
          USER_ROLES.aluno
        ).badge,
    };

    if (
      normalized.role !== parsed.role ||
      normalized.badge !== parsed.badge
    ) {
      localStorage.setItem(
        STORAGE_KEY_AUTH_USER,
        JSON.stringify(normalized)
      );
    }

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Busca o perfil de um usuário no Firestore.
 */
export async function getUserProfile(uid) {
  try {
    const userDocRef = doc(
      db,
      'users',
      uid
    );

    const snap =
      await getDoc(userDocRef);

    if (snap.exists()) {
      return {
        success: true,
        profile: snap.data(),
      };
    }

    return {
      success: false,
      errorCode: 'profile/not-found',
    };
  } catch (error) {
    return {
      success: false,
      errorCode:
        error.code ||
        error.message,
    };
  }
}

/**
 * Login com e-mail e senha.
 */
export async function login(
  email,
  password
) {
  const cleanEmail =
    email
      .toLowerCase()
      .trim();

  try {
    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    const fbUser =
      userCredential.user;

    // Contas institucionais antigas podem
    // existir no Auth sem documento users/{uid}.
    let profileRes =
      await getUserProfile(
        fbUser.uid
      );

    const profileWasMissing =
      profileRes.errorCode ===
      'profile/not-found';

    if (profileWasMissing) {
      try {
        const createdProfile =
          await ensureUserProfile(
            fbUser,
            inferRoleFromFirebaseUser(
              fbUser
            )
          );

        profileRes = {
          success: true,
          profile: createdProfile,
        };
      } catch (profileErr) {
        console.warn(
          '[login] Não foi possível criar o perfil inicial no Firestore:',
          profileErr
        );
      }
    }

    // Verifica bloqueio administrativo.
    if (
      profileRes.profile?.blocked === true ||
      profileRes.profile?.status === 'blocked'
    ) {
      await signOut(auth);

      localStorage.removeItem(
        STORAGE_KEY_AUTH_USER
      );

      return {
        success: false,
        error:
          `Esta conta foi suspensa pela moderação.` +
          (
            profileRes.profile?.blockedReason
              ? ` Motivo: ${profileRes.profile.blockedReason}`
              : ' Entre em contato com a administração para mais detalhes.'
          ),
      };
    }

    const sessionUser =
      buildSessionUser(
        fbUser,
        profileRes.profile || {}
      );

    localStorage.setItem(
      STORAGE_KEY_AUTH_USER,
      JSON.stringify(sessionUser)
    );

    return {
      success: true,
      user: sessionUser,
    };
  } catch (error) {
    let errorMsg =
      'E-mail ou senha incorretos. Verifique seus dados.';

    if (
      error.code ===
        'auth/user-not-found' ||
      error.code ===
        'auth/wrong-password' ||
      error.code ===
        'auth/invalid-credential'
    ) {
      errorMsg =
        'E-mail ou senha inválidos. Verifique suas credenciais.';
    } else if (
      error.code ===
      'auth/too-many-requests'
    ) {
      errorMsg =
        'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
    }

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Cadastro de novo usuário.
 */
export async function register(
  data
) {
  const {
    email,
    name,
    city,
    role,
    password,
  } = data;

  const cleanEmail =
    email
      .toLowerCase()
      .trim();

  const selectedRole =
    normalizeUserRole(
      role || 'aluno'
    );

  const roleMeta =
    USER_ROLES[selectedRole] ||
    USER_ROLES.aluno;

  // Validação específica para alunos.
  let studentVerification = null;

  if (selectedRole === 'aluno') {
    studentVerification =
      validateStudentEmail(
        cleanEmail
      );

    if (
      !studentVerification.isValid
    ) {
      return {
        success: false,
        error:
          studentVerification.error ||
          'Para criar uma conta de Aluno, é obrigatório utilizar o e-mail institucional da sua faculdade (ex: @estudante.ifpr.edu.br, @aluno.uenp.edu.br, @univale.edu.br ou qualquer domínio .edu.br).',
      };
    }
  }

  const defaultRoleData = {
    aluno: {
      course: data.course || '',

      institution:
        data.institution ||
        studentVerification?.institution ||
        studentVerification?.shortInstitution ||
        'IFPR Campus Ivaiporã',

      period: data.period || '',

      skills: data.skills || [],

      isVerifiedStudent: false,

      studentEmailVerifiedAt:
        null,

      studentEmailDomain:
        studentVerification?.domain ||
        null,

      studentEmail: cleanEmail,

      studentEmailVerificationSentAt:
        null,

      raNumber:
        data.raNumber || '',

      bio:
        data.bio || '',

      experiences: [],
      projects: [],
      education: [],
      endorsements: [],
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
      endorsements: [],
    },

    professor: {
      degree: data.degree || '',
      institution: data.institution || '',
      discipline: data.discipline || '',
      endorsementCount: 0,
      verified: false,
      bio: data.bio || '',
      education: [],
      classes: [],
    },

    empresa: {
      cnpj: data.cnpj || '',
      isVerifiedCompany: false,
      sector: data.sector || '',
      size: data.size || '',
      about: data.about || '',
      history: '',
      perks: [],
    },

    freelancer: {
      category: data.category || '',
      skills: data.skills || [],
      rating: 5.0,
      reviewsCount: 0,
      bio: data.bio || '',
    },
  };

  const roleSpecific =
    defaultRoleData[selectedRole] ||
    defaultRoleData.aluno;

  try {
    // 1. Criar conta no Firebase Authentication.
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    const fbUser =
      userCredential.user;

    // 2. Enviar verificação para alunos.
    let emailVerificationSent = false;
    let emailVerificationError = null;

    if (selectedRole === 'aluno') {
      try {
        await sendEmailVerification(
          fbUser
        );

        emailVerificationSent = true;
      } catch (verificationError) {
        console.warn(
          '[Firebase Auth Register] Falha ao disparar sendEmailVerification:',
          verificationError
        );

        emailVerificationError =
          verificationError.message;
      }
    }

    // 3. Criar perfil completo no Firestore.
    const profileData = {
      id: fbUser.uid,
      uid: fbUser.uid,

      name,

      email: cleanEmail,

      emailVerified:
        selectedRole === 'aluno'
          ? false
          : true,

      city:
        city || 'Ivaiporã',

      role: selectedRole,

      badge: roleMeta.badge,

      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

      ...roleSpecific,

      ...(emailVerificationSent
        ? {
            studentEmailVerificationSentAt:
              new Date().toISOString(),
          }
        : {}),
    };

    await setDoc(
      doc(db, 'users', fbUser.uid),
      profileData
    );

    seedFirestoreIfEmpty();

    const sessionUser = {
      ...profileData,
      isVerifiedCompany:
        selectedRole === 'empresa',
    };

    localStorage.setItem(
      STORAGE_KEY_AUTH_USER,
      JSON.stringify(sessionUser)
    );

    // Atualiza cache local sem senhas.
    try {
      const users =
        getUsersDB();

      const existingIdx =
        users.findIndex(
          (user) =>
            user.uid === fbUser.uid ||
            user.email?.toLowerCase() ===
              cleanEmail
        );

      if (existingIdx >= 0) {
        users[existingIdx] = {
          ...sessionUser,
        };
      } else {
        users.push({
          ...sessionUser,
        });
      }

      localStorage.setItem(
        STORAGE_KEY_USERS_DB,
        JSON.stringify(users)
      );
    } catch {
      // Cache local é opcional.
    }

    return {
      success: true,
      user: sessionUser,
      emailVerificationSent,
      emailVerificationError,
    };
  } catch (error) {
    console.warn(
      '[Firebase Auth Register] Falha no Firebase:',
      error.code,
      error.message
    );

    let userFriendlyError =
      null;

    if (
      error.code ===
      'auth/operation-not-allowed'
    ) {
      userFriendlyError =
        'O método E-mail/Senha não está ativado no Firebase Console (Authentication > Sign-in method).';
    } else if (
      error.code ===
      'auth/email-already-in-use'
    ) {
      userFriendlyError =
        'Este e-mail já está cadastrado no Firebase.';
    } else if (
      error.code ===
      'auth/weak-password'
    ) {
      userFriendlyError =
        'A senha deve conter no mínimo 6 caracteres.';
    } else if (
      error.code ===
      'auth/invalid-email'
    ) {
      userFriendlyError =
        'Formato de e-mail inválido.';
    } else if (
      error.code ===
      'auth/network-request-failed'
    ) {
      userFriendlyError =
        'Falha de conexão com o servidor. Verifique sua conexão com a internet e tente novamente.';
    } else {
      userFriendlyError =
        error.message ||
        'Erro ao realizar cadastro no Firebase. Tente novamente.';
    }

    return {
      success: false,
      error: userFriendlyError,
      errorCode: error.code,
    };
  }
}

/**
 * Login com Google.
 */
export async function loginWithGoogle() {
  try {
    const userCredential =
      await signInWithPopup(
        auth,
        googleProvider
      );

    const fbUser =
      userCredential.user;

    // Buscar perfil existente.
    let profileRes =
      await getUserProfile(
        fbUser.uid
      );

    const needsProfileCompletion =
      !profileRes.success ||
      !profileRes.profile?.role;

    const profileWasMissing =
      profileRes.errorCode ===
      'profile/not-found';

    if (profileWasMissing) {
      try {
        const createdProfile =
          await ensureUserProfile(
            fbUser,
            inferRoleFromFirebaseUser(
              fbUser
            )
          );

        profileRes = {
          success: true,
          profile: createdProfile,
        };
      } catch (profileErr) {
        console.warn(
          '[loginWithGoogle] Não foi possível criar o perfil inicial no Firestore:',
          profileErr
        );
      }
    }

    // Verificar bloqueio administrativo.
    if (
      profileRes.profile?.blocked === true ||
      profileRes.profile?.status === 'blocked'
    ) {
      await signOut(auth);

      localStorage.removeItem(
        STORAGE_KEY_AUTH_USER
      );

      return {
        success: false,
        error:
          `Esta conta Google foi suspensa pela moderação.` +
          (
            profileRes.profile?.blockedReason
              ? ` Motivo: ${profileRes.profile.blockedReason}`
              : ' Entre em contato com o suporte.'
          ),
      };
    }

    const sessionUser =
      buildSessionUser(
        fbUser,
        profileRes.profile || {}
      );

    localStorage.setItem(
      STORAGE_KEY_AUTH_USER,
      JSON.stringify(sessionUser)
    );

    return {
      success: true,
      user: sessionUser,
      needsProfileCompletion,
      isNewUser: needsProfileCompletion,
    };
  } catch (error) {
    return {
      success: false,
      error:
        'Falha ao autenticar com o Google: ' +
        (
          error.message ||
          error.code
        ),
    };
  }
}

/**
 * Completa ou atualiza o perfil do usuário.
 */
export async function completeUserProfile(
  uid,
  additionalData
) {
  try {
    const selectedRole =
      normalizeUserRole(
        additionalData.role ||
          'aluno'
      );

    const roleMeta =
      USER_ROLES[selectedRole] ||
      USER_ROLES.aluno;

    const avatar =
      additionalData.avatar ||
      auth.currentUser?.photoURL ||
      getAuthUser()?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';

    const candidateEmail =
      (
        additionalData.studentEmail ||
        additionalData.email ||
        ''
      )
        .toLowerCase()
        .trim();

    const studentCheck =
      validateStudentEmail(
        candidateEmail
      );

    const isOwnerEmailVerified =
      Boolean(
        auth.currentUser?.emailVerified &&
        auth.currentUser?.email?.toLowerCase() ===
          candidateEmail
      );

    const isStudentVerified =
      Boolean(
        selectedRole === 'aluno' &&
        studentCheck.isValid &&
        isOwnerEmailVerified
      );

    const payload = {
      name: additionalData.name,
      email: additionalData.email,
      city: additionalData.city,

      role: selectedRole,

      avatar,

      updatedAt:
        new Date().toISOString(),

      ...(additionalData.cnpj
        ? {
            cnpj:
              additionalData.cnpj,
          }
        : {}),

      ...(additionalData.razaoSocial
        ? {
            razaoSocial:
              additionalData.razaoSocial,
          }
        : {}),

      ...(additionalData.nomeFantasia
        ? {
            nomeFantasia:
              additionalData.nomeFantasia,
          }
        : {}),

      ...(additionalData.situacaoCnpj
        ? {
            situacaoCnpj:
              additionalData.situacaoCnpj,
          }
        : {}),

      ...(additionalData.isVerifiedCompany !==
      undefined
        ? {
            isVerifiedCompany:
              additionalData.isVerifiedCompany,
          }
        : selectedRole === 'empresa' &&
          !!additionalData.cnpj
          ? {
              isVerifiedCompany: true,
            }
          : {}),

      ...(selectedRole === 'aluno'
        ? {
            isVerifiedStudent:
              isStudentVerified,

            studentEmail:
              candidateEmail,

            institution:
              additionalData.institution ||
              studentCheck?.institution ||
              studentCheck?.shortInstitution ||
              'IFPR Campus Ivaiporã',

            ...(isStudentVerified
              ? {
                  studentEmailVerifiedAt:
                    new Date().toISOString(),
                }
              : {
                  studentEmailVerifiedAt:
                    null,
                }),
          }
        : {}),
    };

    await setDoc(
      doc(db, 'users', uid),
      payload,
      { merge: true }
    );

    const updated =
      updateAuthUser({
        name:
          additionalData.name,

        city:
          additionalData.city,

        role:
          selectedRole,

        avatar,

        badge:
          roleMeta.badge,

        ...(additionalData.cnpj
          ? {
              cnpj:
                additionalData.cnpj,
            }
          : {}),

        ...(additionalData.razaoSocial
          ? {
              razaoSocial:
                additionalData.razaoSocial,
            }
          : {}),

        ...(additionalData.nomeFantasia
          ? {
              nomeFantasia:
                additionalData.nomeFantasia,
            }
          : {}),

        ...(additionalData.situacaoCnpj
          ? {
              situacaoCnpj:
                additionalData.situacaoCnpj,
            }
          : {}),

        isVerifiedCompany:
          additionalData.isVerifiedCompany ??
          (
            selectedRole === 'empresa' &&
            !!additionalData.cnpj
          ),

        ...(selectedRole === 'aluno'
          ? {
              isVerifiedStudent:
                isStudentVerified,

              studentEmail:
                candidateEmail,

              institution:
                additionalData.institution ||
                studentCheck?.institution ||
                studentCheck?.shortInstitution ||
                'IFPR Campus Ivaiporã',

              ...(isStudentVerified
                ? {
                    studentEmailVerifiedAt:
                      new Date().toISOString(),
                  }
                : {
                    studentEmailVerifiedAt:
                      null,
                  }),
            }
          : {}),
      });

    // Se o e-mail institucional ainda não estiver confirmado,
    // envia a verificação em segundo plano.
    if (
      selectedRole === 'aluno' &&
      studentCheck.isValid &&
      !isStudentVerified
    ) {
      try {
        await sendStudentVerificationEmail(
          candidateEmail
        );
      } catch {
        // A falha não impede o restante do cadastro.
      }
    }

    return {
      success: true,
      user: updated,
      verificationPending:
        selectedRole === 'aluno' &&
        !isStudentVerified,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Logout.
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch {
    // Mesmo que o Firebase falhe,
    // limpamos o estado local.
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(
      STORAGE_KEY_AUTH_USER
    );
  }
}

/**
 * Verifica se a conta usa somente Google.
 */
export function isGoogleOnlyAuthUser() {
  const user =
    auth.currentUser;

  if (
    !user ||
    !user.providerData
  ) {
    return false;
  }

  return (
    user.providerData.every(
      (provider) =>
        provider.providerId !==
        'password'
    ) &&
    user.providerData.some(
      (provider) =>
        provider.providerId ===
        'google.com'
    )
  );
}

/**
 * Altera a senha do usuário autenticado.
 */
export async function updateUserPassword(
  currentPassword,
  newPassword
) {
  const user =
    auth.currentUser;

  if (!user) {
    return {
      success: false,
      error:
        'Nenhuma sessão ativa encontrada no Firebase. Por favor, faça login novamente.',
    };
  }

  if (
    !newPassword ||
    newPassword.length < 6
  ) {
    return {
      success: false,
      error:
        'A nova senha deve ter no mínimo 6 caracteres.',
    };
  }

  if (
    currentPassword &&
    currentPassword === newPassword
  ) {
    return {
      success: false,
      error:
        'A nova senha deve ser diferente da senha atual.',
    };
  }

  const isGoogleOnly =
    isGoogleOnlyAuthUser();

  try {
    if (
      currentPassword &&
      user.email
    ) {
      const credential =
        EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

      await reauthenticateWithCredential(
        user,
        credential
      );
    }

    await updatePassword(
      user,
      newPassword
    );

    return {
      success: true,
      message:
        'Senha alterada com sucesso no Firebase Authentication!',
    };
  } catch (error) {
    console.error(
      '[authService] Erro ao alterar senha no Firebase:',
      error.code,
      error.message
    );

    if (
      error.code ===
      'auth/requires-recent-login'
    ) {
      if (isGoogleOnly) {
        try {
          await reauthenticateWithPopup(
            user,
            googleProvider
          );

          await updatePassword(
            user,
            newPassword
          );

          return {
            success: true,
            message:
              'Senha definida com sucesso após confirmação com o Google!',
          };
        } catch (popupErr) {
          return {
            success: false,
            error:
              'Falha na confirmação com o Google: ' +
              (
                popupErr.message ||
                popupErr.code
              ),
          };
        }
      }

      return {
        success: false,
        requiresReauth: true,
        error:
          'Esta é uma operação sensível e exige reautenticação recente. Por favor, confirme sua senha atual.',
      };
    }

    if (
      error.code ===
        'auth/wrong-password' ||
      error.code ===
        'auth/invalid-credential'
    ) {
      return {
        success: false,
        error:
          'A senha atual informada está incorreta.',
      };
    }

    if (
      error.code ===
      'auth/weak-password'
    ) {
      return {
        success: false,
        error:
          'A nova senha deve ter no mínimo 6 caracteres.',
      };
    }

    if (
      error.code ===
      'auth/too-many-requests'
    ) {
      return {
        success: false,
        error:
          'Muitas tentativas sem sucesso. Aguarde alguns instantes antes de tentar novamente.',
      };
    }

    return {
      success: false,
      error:
        error.message ||
        'Erro ao alterar a senha no Firebase.',
      errorCode: error.code,
    };
  }
}

/**
 * Observa o estado de autenticação do Firebase
 * e mantém o perfil do usuário sincronizado.
 */
export function watchAuthState(
  callback
) {
  let unsubscribeProfile = null;

  try {
    return onAuthStateChanged(
      auth,
      async (fbUser) => {
        try {
          // Remove listener anterior.
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }

          // Usuário deslogado.
          if (!fbUser) {
            callback(
              getAuthUser() || null
            );
            return;
          }

          seedFirestoreIfEmpty();

          let profileRes = {
            success: false,
            profile: {},
            errorCode: null,
          };

          try {
            profileRes =
              await getUserProfile(
                fbUser.uid
              );
          } catch (profileError) {
            console.warn(
              '[watchAuthState] Erro ao buscar perfil do Firestore:',
              profileError
            );
          }

          let profileWasMissing =
            profileRes.errorCode ===
            'profile/not-found';

          // Corrige o caso de conta autenticada
          // sem documento correspondente.
          if (profileWasMissing) {
            try {
              const createdProfile =
                await ensureUserProfile(
                  fbUser,
                  inferRoleFromFirebaseUser(
                    fbUser
                  )
                );

              profileRes = {
                success: true,
                profile: createdProfile,
              };

              profileWasMissing = false;
            } catch (profileError) {
              console.warn(
                '[watchAuthState] Falha ao criar perfil inicial:',
                profileError
              );
            }
          }

          const role =
            normalizeUserRole(
              profileRes.profile?.role
            );

          let isVerifiedStudent =
            profileRes.profile
              ?.isVerifiedStudent ??
            (
              role === 'aluno'
                ? false
                : true
            );

          // Se o Firebase confirmou um e-mail institucional,
          // sincroniza automaticamente a verificação estudantil.
          if (
            role === 'aluno' &&
            !isVerifiedStudent &&
            fbUser.emailVerified
          ) {
            const studentCheck =
              validateStudentEmail(
                fbUser.email
              );

            if (
              studentCheck.isValid
            ) {
              isVerifiedStudent = true;

              try {
                await setDoc(
                  doc(
                    db,
                    'users',
                    fbUser.uid
                  ),
                  {
                    isVerifiedStudent:
                      true,

                    emailVerified:
                      true,

                    studentEmail:
                      fbUser.email
                        .toLowerCase()
                        .trim(),

                    institution:
                      profileRes.profile
                        ?.institution ||
                      studentCheck.institution,

                    shortInstitution:
                      profileRes.profile
                        ?.shortInstitution ||
                      studentCheck.shortInstitution,

                    studentEmailVerifiedAt:
                      new Date().toISOString(),
                  },
                  { merge: true }
                );
              } catch (syncError) {
                console.warn(
                  '[watchAuthState] Erro ao sincronizar verificação estudantil:',
                  syncError
                );
              }
            }
          }

          // Bloqueio administrativo.
          if (
            profileRes.profile?.blocked === true ||
            profileRes.profile?.status ===
              'blocked'
          ) {
            localStorage.removeItem(
              STORAGE_KEY_AUTH_USER
            );

            await signOut(auth);

            callback(null);
            return;
          }

          // Cria o usuário da sessão.
          const sessionUser =
            buildSessionUser(
              fbUser,
              {
                ...(profileRes.profile || {}),
                role,
              }
            );

          if (role === 'aluno') {
            sessionUser.isVerifiedStudent =
              Boolean(
                sessionUser.isVerifiedStudent ||
                isVerifiedStudent
              );

            sessionUser.emailVerified =
              sessionUser.isVerifiedStudent;
          }

          localStorage.setItem(
            STORAGE_KEY_AUTH_USER,
            JSON.stringify(sessionUser)
          );

          callback(sessionUser);

          /**
           * Observa mudanças futuras no perfil.
           */
          const userDocRef =
            doc(
              db,
              'users',
              fbUser.uid
            );

          unsubscribeProfile =
            onSnapshot(
              userDocRef,
              async (snapshot) => {
                try {
                  if (!snapshot.exists()) {
                    /**
                     * Não encerra imediatamente uma sessão válida
                     * caso o perfil tenha desaparecido durante
                     * a inicialização.
                     */
                    if (profileWasMissing) {
                      try {
                        const recreated =
                          await ensureUserProfile(
                            fbUser,
                            role
                          );

                        const recreatedSession =
                          buildSessionUser(
                            fbUser,
                            recreated
                          );

                        localStorage.setItem(
                          STORAGE_KEY_AUTH_USER,
                          JSON.stringify(
                            recreatedSession
                          )
                        );

                        callback(
                          recreatedSession
                        );

                        return;
                      } catch (recreateError) {
                        console.warn(
                          '[watchAuthState] Falha ao recriar perfil ausente:',
                          recreateError
                        );
                      }
                    }

                    console.warn(
                      '[watchAuthState] Perfil removido depois da autenticação; encerrando sessão.'
                    );

                    localStorage.removeItem(
                      STORAGE_KEY_AUTH_USER
                    );

                    await signOut(auth);

                    callback(null);

                    return;
                  }

                  const profile =
                    snapshot.data() || {};

                  const profileRole =
                    normalizeUserRole(
                      profile.role ||
                        role
                    );

                  // Bloqueio administrativo atualizado
                  // enquanto o usuário já está logado.
                  if (
                    profile.blocked === true ||
                    profile.status ===
                      'blocked'
                  ) {
                    const blockedReason =
                      profile.blockedReason ||
                      'Sua conta foi bloqueada pelo administrador.';

                    const blockedUser = {
                      ...sessionUser,
                      ...profile,

                      role:
                        profileRole,

                      badge:
                        (
                          USER_ROLES[
                            profileRole
                          ] ||
                          USER_ROLES.aluno
                        ).badge,

                      blocked: true,
                      blockedReason,
                    };

                    localStorage.setItem(
                      STORAGE_KEY_AUTH_USER,
                      JSON.stringify(
                        blockedUser
                      )
                    );

                    callback(
                      blockedUser
                    );

                    setTimeout(
                      async () => {
                        try {
                          localStorage.removeItem(
                            STORAGE_KEY_AUTH_USER
                          );

                          await signOut(auth);
                        } catch (
                          logoutError
                        ) {
                          console.warn(
                            '[watchAuthState] Erro ao encerrar sessão:',
                            logoutError
                          );
                        }
                      },
                      300
                    );

                    return;
                  }

                  const updatedUser =
                    buildSessionUser(
                      fbUser,
                      {
                        ...profile,
                        role:
                          profileRole,
                      }
                    );

                  if (
                    profileRole ===
                    'aluno'
                  ) {
                    updatedUser.isVerifiedStudent =
                      Boolean(
                        profile?.isVerifiedStudent ||
                        profile?.emailVerified ||
                        fbUser.emailVerified
                      );

                    updatedUser.emailVerified =
                      updatedUser.isVerifiedStudent;
                  }

                  localStorage.setItem(
                    STORAGE_KEY_AUTH_USER,
                    JSON.stringify(
                      updatedUser
                    )
                  );

                  callback(
                    updatedUser
                  );
                } catch (
                  snapshotError
                ) {
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
        } catch (innerError) {
          console.warn(
            '[watchAuthState] Erro no processamento do estado de auth:',
            innerError
          );

          callback(
            getAuthUser() || null
          );
        }
      },
      (authError) => {
        console.warn(
          '[watchAuthState] Erro no Firebase onAuthStateChanged:',
          authError
        );

        callback(
          getAuthUser() || null
        );
      }
    );
  } catch (outerError) {
    console.warn(
      '[watchAuthState] Falha ao iniciar observador de auth:',
      outerError
    );

    callback(
      getAuthUser() || null
    );

    return () => {};
  }
}

/**
 * Atualiza o usuário local e sincroniza no Firestore.
 */
export function updateAuthUser(
  data
) {
  const current =
    getAuthUser();

  if (!current) {
    return null;
  }

  const updated = {
    ...current,
    ...data,
  };

  localStorage.setItem(
    STORAGE_KEY_AUTH_USER,
    JSON.stringify(updated)
  );

  const users =
    getUsersDB();

  const updatedDB =
    users.map((user) => {
      const sameUser =
        user.email &&
        current.email &&
        user.email.toLowerCase() ===
          current.email.toLowerCase();

      return sameUser
        ? { ...user, ...data }
        : user;
    });

  localStorage.setItem(
    STORAGE_KEY_USERS_DB,
    JSON.stringify(updatedDB)
  );

  const uid =
    current.uid ||
    current.id;

  if (uid) {
    try {
      setDoc(
        doc(
          db,
          'users',
          String(uid)
        ),
        {
          ...data,
          updatedAt:
            new Date().toISOString(),
        },
        { merge: true }
      ).catch((error) => {
        console.warn(
          '[Firestore] Sync erro updateAuthUser:',
          error.message
        );
      });
    } catch {
      // Falha assíncrona de sincronização
      // não deve quebrar o fluxo da interface.
    }
  }

  return updated;
}

/**
 * Registra/verifica os dados básicos de uma empresa.
 */
export function submitCompanyVerification(
  cnpj,
  fileData,
  extraData = {}
) {
  const digits =
    cleanCNPJ(cnpj);

  if (digits.length !== 14) {
    return {
      success: false,
      error:
        'O CNPJ deve conter 14 dígitos numéricos (Ex: 12.345.678/0001-90).',
    };
  }

  if (
    !validateCNPJ(digits)
  ) {
    return {
      success: false,
      error:
        'CNPJ inválido (dígitos verificadores incorretos pelo cálculo oficial da Receita Federal).',
    };
  }

  const formattedCNPJ =
    maskCNPJ(digits);

  const filename =
    typeof fileData === 'object' &&
    fileData?.name
      ? fileData.name
      : fileData
        ? String(fileData)
        : 'Cartao_CNPJ.pdf';

  const filesizeMB =
    typeof fileData === 'object' &&
    fileData?.size
      ? (
          fileData.size /
          (1024 * 1024)
        ).toFixed(2)
      : '0.85';

  // Mantido por compatibilidade com o fluxo existente.
  void filesizeMB;

  const updated =
    updateAuthUser({
      cnpj: formattedCNPJ,

      isVerifiedCompany:
        true,

      companyProofFile:
        filename,

      verifiedAt:
        new Date().toISOString(),

      ...(extraData.razaoSocial
        ? {
            razaoSocial:
              extraData.razaoSocial,
          }
        : {}),

      ...(extraData.nomeFantasia
        ? {
            nomeFantasia:
              extraData.nomeFantasia,
          }
        : {}),

      ...(extraData.situacaoCadastral
        ? {
            situacaoCnpj:
              extraData.situacaoCadastral,
          }
        : {}),

      ...(extraData.cnpjProofUrl
        ? {
            cnpjProofUrl:
              extraData.cnpjProofUrl,
          }
        : {}),
    });

  return {
    success: true,
    message:
      `✅ CNPJ ${formattedCNPJ} autenticado com sucesso! Selo de Empresa Verificada concedido.`,
    user: updated,
  };
}

/**
 * Dispara a verificação estudantil.
 */
export async function verifyStudentAccount(
  studentEmail
) {
  return await sendStudentVerificationEmail(
    studentEmail
  );
}

export {
  sendStudentVerificationEmail,
  checkStudentVerification,
};

/**
 * Recupera a cidade selecionada.
 */
export function getSelectedCity() {
  if (
    typeof localStorage === 'undefined'
  ) {
    return 'Todas as Cidades';
  }

  return (
    localStorage.getItem(
      STORAGE_KEY_CITY
    ) ||
    'Todas as Cidades'
  );
}

/**
 * Define a cidade selecionada.
 */
export function setSelectedCity(
  city
) {
  if (
    typeof localStorage === 'undefined'
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY_CITY,
    city
  );
}

/**
 * Força a atualização do usuário Firebase
 * e sincroniza emailVerified.
 */
export async function reloadAuthUser() {
  if (!auth.currentUser) {
    return {
      success: false,
      verified: false,
      error:
        'Nenhuma sessão ativa encontrada.',
    };
  }

  try {
    await auth.currentUser.reload();

    await auth.currentUser.getIdToken(
      true
    );

    const verified =
      Boolean(
        auth.currentUser.emailVerified
      );

    if (verified) {
      try {
        await setDoc(
          doc(
            db,
            'users',
            auth.currentUser.uid
          ),
          {
            emailVerified: true,

            updatedAt:
              new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.warn(
          '[reloadAuthUser] Erro ao sincronizar status no Firestore:',
          error
        );
      }

      const localUser =
        getAuthUser();

      if (localUser) {
        const updated = {
          ...localUser,
          emailVerified: true,
        };

        localStorage.setItem(
          STORAGE_KEY_AUTH_USER,
          JSON.stringify(updated)
        );
      }
    }

    return {
      success: true,
      verified,
      user: auth.currentUser,
    };
  } catch (error) {
    console.error(
      '[reloadAuthUser] Erro ao recarregar auth.currentUser:',
      error
    );

    return {
      success: false,
      verified: false,
      error: error.message,
    };
  }
}

/**
 * Reenvia o e-mail de verificação.
 */
export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    return {
      success: false,
      error:
        'Nenhum usuário logado no momento.',
    };
  }

  try {
    await sendEmailVerification(
      auth.currentUser
    );

    return {
      success: true,
    };
  } catch (error) {
    let msg =
      'Erro ao reenviar e-mail de verificação.';

    if (
      error.code ===
      'auth/too-many-requests'
    ) {
      msg =
        'Muitas solicitações seguidas. Aguarde alguns instantes antes de tentar novamente.';
    }

    return {
      success: false,
      error: msg,
      errorCode: error.code,
    };
  }
}