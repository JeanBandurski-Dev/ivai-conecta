// Auth Service for Ivaí Conecta (Firebase + Local Storage Fallback)
import { auth, db, googleProvider } from '../lib/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { seedFirestoreIfEmpty } from './seedFirestore.js';
import { validateCNPJ, maskCNPJ, cleanCNPJ } from './cnpjService.js';

import {
  STORAGE_KEY_AUTH_USER,
  STORAGE_KEY_USERS_DB,
  STORAGE_KEY_CITY,
  USER_ROLES,
} from '../data/seedData';
import { DEFAULT_AVATAR } from '../utils/defaultAssets.js';

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
    } catch {}
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

export async function login(email, password) {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Buscar perfil adicional no Firestore
    const profileRes = await getUserProfile(fbUser.uid);
    const role = profileRes.profile?.role || 'aluno';
    const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;

    const isEmailVerified = Boolean(
      fbUser.emailVerified ||
      profileRes.profile?.emailVerified ||
      getAuthUser()?.emailVerified
    );

    const sessionUser = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      name: profileRes.profile?.name || fbUser.displayName || 'Usuário',
      city: profileRes.profile?.city || 'Ivaiporã',
      role,
      badge: roleMeta.badge,
      avatar: profileRes.profile?.avatar || fbUser.photoURL || '',
      isVerifiedStudent: profileRes.profile?.isVerifiedStudent ?? (role === 'aluno' ? false : true),
      isVerifiedCompany: profileRes.profile?.isVerifiedCompany ?? (role === 'empresa'),
      ...(profileRes.profile || {}),
      emailVerified: isEmailVerified,
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  } catch (error) {
    let errorMsg = 'E-mail ou senha incorretos. Verifique seus dados.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMsg = 'E-mail ou senha inválidos. Verifique suas credenciais.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMsg = 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
    }
    return { success: false, error: errorMsg };
  }
}

export async function register(data) {
  const { email, name, city, role, password } = data;
  const cleanEmail = email.toLowerCase().trim();
  const selectedRole = role || 'aluno';
  const roleMeta = USER_ROLES[selectedRole] || USER_ROLES.aluno;

  const defaultRoleData = {
    aluno: {
      course: data.course || '',
      institution: data.institution || '',
      period: data.period || '',
      skills: data.skills || [],
      isVerifiedStudent: false,
      raNumber: '',
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
      degree: data.degree || '',
      institution: data.institution || '',
      discipline: data.discipline || '',
      endorsementCount: 0,
      verified: false,
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

    // 2. Salvar documento completo no Firestore em users/{uid}
    const profileData = {
      id: fbUser.uid,
      uid: fbUser.uid,
      name,
      email: cleanEmail,
      emailVerified: Boolean(fbUser.emailVerified),
      city: city || 'Ivaiporã',
      role: selectedRole,
      badge: roleMeta.badge,
      avatar: DEFAULT_AVATAR,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...roleSpecific
    };
    await setDoc(doc(db, 'users', fbUser.uid), profileData);
    seedFirestoreIfEmpty();

    const sessionUser = {
      ...profileData,
      emailVerified: Boolean(fbUser.emailVerified),
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
    } catch {}

    return { success: true, user: sessionUser };
  } catch (error) {
    console.warn('[Firebase Auth Register] Falha no Firebase:', error.code, error.message);

    // Mensagens explicativas para erros comuns do Firebase Auth
    let userFriendlyError = null;
    if (error.code === 'auth/operation-not-allowed') {
      userFriendlyError = 'O método E-mail/Senha não está ativado no Firebase Console (Vá em Authentication > Sign-in method e ative E-mail/senha).';
    } else if (error.code === 'auth/email-already-in-use') {
      userFriendlyError = 'Este e-mail já está cadastrado no Firebase.';
    } else if (error.code === 'auth/weak-password') {
      userFriendlyError = 'A senha deve conter no mínimo 6 caracteres.';
    } else if (error.code === 'auth/invalid-email') {
      userFriendlyError = 'Formato de e-mail inválido.';
    } else if (error.code === 'auth/network-request-failed') {
      userFriendlyError = 'Falha de conexão com o servidor. Verifique sua conexão com a internet e tente novamente.';
    } else {
      userFriendlyError = error.message || 'Erro ao realizar cadastro no Firebase. Tente novamente.';
    }

    return { success: false, error: userFriendlyError, errorCode: error.code };
  }
}

export async function loginWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const fbUser = userCredential.user;

    // Checar perfil existente no Firestore
    const profileRes = await getUserProfile(fbUser.uid);
    let needsProfileCompletion = !profileRes.success || !profileRes.profile?.role;

    const role = profileRes.profile?.role || 'aluno';
    const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;

    const isEmailVerified = Boolean(
      fbUser.emailVerified ||
      profileRes.profile?.emailVerified ||
      getAuthUser()?.emailVerified
    );

    const sessionUser = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      name: profileRes.profile?.name || fbUser.displayName || 'Usuário Google',
      city: profileRes.profile?.city || 'Ivaiporã',
      role,
      badge: roleMeta.badge,
      avatar: fbUser.photoURL || profileRes.profile?.avatar || DEFAULT_AVATAR,
      isVerifiedStudent: profileRes.profile?.isVerifiedStudent ?? false,
      isVerifiedCompany: role === 'empresa',
      ...(profileRes.profile || {}),
      emailVerified: isEmailVerified,
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser, needsProfileCompletion };
  } catch (error) {
    return { success: false, error: 'Falha ao autenticar com o Google: ' + (error.message || error.code) };
  }
}

export async function completeUserProfile(uid, additionalData) {
  try {
    const roleMeta = USER_ROLES[additionalData.role] || USER_ROLES.aluno;
    const avatar = additionalData.avatar || auth.currentUser?.photoURL || getAuthUser()?.avatar || DEFAULT_AVATAR;

    const payload = {
      name: additionalData.name,
      email: additionalData.email,
      city: additionalData.city,
      role: additionalData.role,
      avatar: avatar,
      updatedAt: new Date().toISOString(),
      ...(additionalData.cnpj && { cnpj: additionalData.cnpj }),
      ...(additionalData.razaoSocial && { razaoSocial: additionalData.razaoSocial }),
      ...(additionalData.nomeFantasia && { nomeFantasia: additionalData.nomeFantasia }),
      ...(additionalData.situacaoCnpj && { situacaoCnpj: additionalData.situacaoCnpj }),
      ...(additionalData.isVerifiedCompany !== undefined ? { isVerifiedCompany: additionalData.isVerifiedCompany } : (additionalData.role === 'empresa' && !!additionalData.cnpj ? { isVerifiedCompany: true } : {}))
    };

    await setDoc(doc(db, 'users', uid), payload, { merge: true });

    const updated = updateAuthUser({
      name: additionalData.name,
      city: additionalData.city,
      role: additionalData.role,
      avatar: avatar,
      badge: roleMeta.badge,
      ...(additionalData.cnpj && { cnpj: additionalData.cnpj }),
      ...(additionalData.razaoSocial && { razaoSocial: additionalData.razaoSocial }),
      ...(additionalData.nomeFantasia && { nomeFantasia: additionalData.nomeFantasia }),
      ...(additionalData.situacaoCnpj && { situacaoCnpj: additionalData.situacaoCnpj }),
      isVerifiedCompany: additionalData.isVerifiedCompany ?? (additionalData.role === 'empresa' && !!additionalData.cnpj),
    });

    return { success: true, user: updated };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch {}
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
  try {
    return onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          seedFirestoreIfEmpty();
          let profileRes = { success: false, profile: {} };
          try {
            profileRes = await getUserProfile(fbUser.uid);
          } catch (pErr) {
            console.warn('[watchAuthState] Erro ao buscar perfil do Firestore:', pErr);
          }

          const role = profileRes.profile?.role || 'aluno';
          const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;
          const cachedLocal = getAuthUser();
          const isEmailVerified = Boolean(
            fbUser.emailVerified ||
            profileRes.profile?.emailVerified ||
            (cachedLocal?.uid === fbUser.uid && cachedLocal?.emailVerified)
          );

          const sessionUser = {
            uid: fbUser.uid,
            id: fbUser.uid,
            email: fbUser.email,
            name: profileRes.profile?.name || fbUser.displayName || 'Usuário',
            city: profileRes.profile?.city || 'Ivaiporã',
            role,
            badge: roleMeta.badge,
            avatar: profileRes.profile?.avatar || fbUser.photoURL || DEFAULT_AVATAR,
            isVerifiedStudent: profileRes.profile?.isVerifiedStudent ?? (role === 'aluno' ? false : true),
            isVerifiedCompany: profileRes.profile?.isVerifiedCompany ?? (role === 'empresa'),
            ...(profileRes.profile || {}),
            emailVerified: isEmailVerified,
          };
          localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
          callback(sessionUser);
        } else {
          const localUser = getAuthUser();
          if (localUser && (localUser.id?.startsWith?.('usr_') || localUser.id?.startsWith?.('prof_') || localUser.email?.includes?.('@ivaiconecta.com.br'))) {
            callback(localUser);
          } else {
            localStorage.removeItem(STORAGE_KEY_AUTH_USER);
            callback(null);
          }
        }
      } catch (innerErr) {
        console.warn('[watchAuthState] Erro no processamento do estado de auth:', innerErr);
        callback(getAuthUser() || null);
      }
    }, (authError) => {
      console.warn('[watchAuthState] Erro no Firebase onAuthStateChanged:', authError);
      callback(getAuthUser() || null);
    });
  } catch (outerErr) {
    console.warn('[watchAuthState] Falha ao iniciar observador de auth:', outerErr);
    callback(getAuthUser() || null);
    return () => {};
  }
}

export function updateAuthUser(data) {
  const current = getAuthUser();
  if (!current) return null;
  const updated = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));

  const users = getUsersDB();
  const updatedDB = users.map(u => (u.email && current.email && u.email.toLowerCase() === current.email.toLowerCase() ? { ...u, ...data } : u));
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(updatedDB));

  // Sync no Firestore
  const uid = current.uid || current.id;
  if (uid) {
    try {
      setDoc(doc(db, 'users', String(uid)), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.warn('[Firestore] Sync erro updateAuthUser:', err.message));
    } catch {}
  }

  return updated;
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
  const filesizeMB = typeof fileData === 'object' && fileData?.size ? (fileData.size / (1024 * 1024)).toFixed(2) : '0.85';

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

export function getSelectedCity() {
  if (typeof localStorage === 'undefined') return 'Todas as Cidades';
  return localStorage.getItem(STORAGE_KEY_CITY) || 'Todas as Cidades';
}

export function setSelectedCity(city) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CITY, city);
}

/**
 * Envia o e-mail de verificação oficial do Firebase Authentication para o usuário atual
 */
export async function sendEmailVerificationToUser() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Usuário não autenticado no Firebase Authentication.' };
    }
    await sendEmailVerification(user);
    return {
      success: true,
      message: `Link de confirmação enviado para ${user.email}! Verifique sua caixa de entrada e pasta de spam.`
    };
  } catch (error) {
    console.warn('[sendEmailVerificationToUser] Erro:', error);
    let msg = 'Erro ao enviar e-mail de confirmação.';
    if (error.code === 'auth/too-many-requests') {
      msg = 'Muitas solicitações recentes. Por favor, aguarde alguns minutos antes de solicitar novamente.';
    } else if (error.code === 'auth/user-token-expired') {
      msg = 'Sua sessão expirou. Faça login novamente.';
    } else if (error.message) {
      msg = error.message;
    }
    return { success: false, error: msg };
  }
}

/**
 * Recarrega os dados do Firebase Authentication e atualiza o status real de emailVerified
 */
export async function refreshEmailVerificationStatus() {
  try {
    const user = auth.currentUser;
    const local = getAuthUser();
    let verified = Boolean(local?.emailVerified);

    if (user) {
      try {
        await reload(user);
        if (user.emailVerified) verified = true;
      } catch {}

      const profileRes = await getUserProfile(user.uid);
      if (profileRes.profile?.emailVerified) {
        verified = true;
      }
    }
    const updated = updateAuthUser({ emailVerified: verified });
    return { success: true, emailVerified: verified, user: updated };
  } catch (error) {
    console.warn('[refreshEmailVerificationStatus] Erro ao sincronizar status:', error);
    return { success: false, error: error.message };
  }
}

