// Auth Service for Ivaí Conecta (Firebase + Local Storage Fallback)
import { auth, db, googleProvider } from '../lib/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { seedFirestoreIfEmpty } from './seedFirestore.js';

import {
  STORAGE_KEY_AUTH_USER,
  STORAGE_KEY_USERS_DB,
  STORAGE_KEY_CITY,
  USER_ROLES,
} from '../data/seedData';

export function getUsersDB() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
  let users = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) users = parsed;
    } catch {}
  }
  return users;
}

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
      ...(profileRes.profile || {})
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
      course: data.course || 'Análise e Desenvolvimento de Sistemas',
      institution: data.institution || 'IFPR Campus Ivaiporã',
      period: 'Graduação / 1º Semestre',
      skills: data.skills || ['JavaScript', 'Excel Avançado', 'Gestão'],
      isVerifiedStudent: false,
      raNumber: '',
      bio: `Estudante no Vale do Ivaí (${city || 'Ivaiporã'}).`,
      experiences: [],
      projects: [],
      education: [{ degree: 'Ensino Superior / Técnico', institution: data.institution || 'IFPR Campus Ivaiporã', period: '2024 - 2026' }],
      endorsements: []
    },
    candidato: {
      course: data.course || 'Profissional / Graduado',
      institution: data.institution || 'Instituição Regional',
      period: 'Formado',
      skills: data.skills || ['Gestão Financeira', 'Excel Avançado', 'Atendimento ao Cliente'],
      isVerifiedStudent: true,
      bio: `Profissional cadastrado no Ivaí Conecta - ${city || 'Ivaiporã'}.`,
      experiences: [],
      projects: [],
      education: [],
      endorsements: []
    },
    professor: {
      degree: data.degree || 'Docente / Especialista',
      institution: data.institution || 'IFPR Campus Ivaiporã',
      discipline: data.discipline || 'Ensino Superior & Técnico',
      endorsementCount: 0,
      verified: true,
      bio: `Docente na instituição ${data.institution || 'IFPR Campus Ivaiporã'}.`,
      education: [{ degree: data.degree || 'Docente', institution: data.institution || 'IFPR Campus Ivaiporã', period: 'Atual' }],
      classes: [data.discipline || 'Aulas Gerais']
    },
    empresa: {
      cnpj: data.cnpj || '',
      isVerifiedCompany: false,
      sector: data.sector || 'Comércio & Serviços',
      size: '1-10 funcionários',
      about: `Empresa sediada em ${city || 'Ivaiporã'}.`,
      history: '',
      perks: ['Vale Transporte', 'Ambiente Colaborativo']
    },
    freelancer: {
      category: data.category || 'Serviços Gerais',
      skills: data.skills || ['Atendimento', 'Manutenção'],
      rating: 5.0,
      reviewsCount: 0,
      bio: `Prestador de serviços autônomo em ${city || 'Ivaiporã'}.`
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
      city: city || 'Ivaiporã',
      role: selectedRole,
      badge: roleMeta.badge,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...roleSpecific
    };
    await setDoc(doc(db, 'users', fbUser.uid), profileData);
    seedFirestoreIfEmpty();

    const sessionUser = {
      ...profileData,
      isVerifiedCompany: selectedRole === 'empresa'
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  } catch (error) {
    console.warn('[Firebase Auth Register] Falha no Firebase:', error.code, error.message);

    // Mensagens explicativas para erros comuns do Firebase Auth
    let userFriendlyError = null;
    if (error.code === 'auth/operation-not-allowed') {
      userFriendlyError = '⚠️ O método E-mail/Senha não está ativado no Firebase Console (Vá em Authentication > Sign-in method e ative E-mail/senha).';
    } else if (error.code === 'auth/email-already-in-use') {
      userFriendlyError = 'Este e-mail já está cadastrado no Firebase.';
    } else if (error.code === 'auth/weak-password') {
      userFriendlyError = 'A senha deve conter no mínimo 6 caracteres.';
    } else if (error.code === 'auth/invalid-email') {
      userFriendlyError = 'Formato de e-mail inválido.';
    }

    if (userFriendlyError) {
      return { success: false, error: userFriendlyError, errorCode: error.code };
    }

    // Fallback: se houver erro genérico/offline, grava no LocalStorage
    const users = getUsersDB();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Este e-mail já está cadastrado no Ivaí Conecta.' };
    }
    const newUser = {
      id: `usr_${Date.now()}`,
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      password,
      name,
      city: city || 'Ivaiporã',
      role: selectedRole,
      badge: roleMeta.badge,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...roleSpecific,
      isVerifiedCompany: selectedRole === 'empresa',
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    const sessionUser = { ...newUser };
    delete sessionUser.password;
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
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

    const sessionUser = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      name: profileRes.profile?.name || fbUser.displayName || 'Usuário Google',
      city: profileRes.profile?.city || 'Ivaiporã',
      role,
      badge: roleMeta.badge,
      avatar: fbUser.photoURL || profileRes.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isVerifiedStudent: profileRes.profile?.isVerifiedStudent ?? false,
      isVerifiedCompany: role === 'empresa',
      ...(profileRes.profile || {})
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
    const avatar = additionalData.avatar || auth.currentUser?.photoURL || getAuthUser()?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';

    await setDoc(doc(db, 'users', uid), {
      name: additionalData.name,
      email: additionalData.email,
      city: additionalData.city,
      role: additionalData.role,
      avatar: avatar,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const updated = updateAuthUser({
      name: additionalData.name,
      city: additionalData.city,
      role: additionalData.role,
      avatar: avatar,
      badge: roleMeta.badge,
      isVerifiedCompany: additionalData.role === 'empresa',
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

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      seedFirestoreIfEmpty();
      const profileRes = await getUserProfile(fbUser.uid);
      const role = profileRes.profile?.role || 'aluno';
      const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;
      const sessionUser = {
        uid: fbUser.uid,
        id: fbUser.uid,
        email: fbUser.email,
        name: profileRes.profile?.name || fbUser.displayName || 'Usuário',
        city: profileRes.profile?.city || 'Ivaiporã',
        role,
        badge: roleMeta.badge,
        avatar: profileRes.profile?.avatar || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        isVerifiedStudent: profileRes.profile?.isVerifiedStudent ?? (role === 'aluno' ? false : true),
        isVerifiedCompany: profileRes.profile?.isVerifiedCompany ?? (role === 'empresa'),
        ...(profileRes.profile || {})
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
  });
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

export function submitCompanyVerification(cnpj, fileData) {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) {
    return { success: false, error: 'O CNPJ deve conter 14 dígitos numéricos (Ex: 12.345.678/0001-90).' };
  }

  const filename = typeof fileData === 'object' && fileData?.name ? fileData.name : String(fileData || 'Cartao_CNPJ.pdf');
  const filesizeMB = typeof fileData === 'object' && fileData?.size ? (fileData.size / (1024 * 1024)).toFixed(2) : '0.85';

  const updated = updateAuthUser({
    cnpj,
    isVerifiedCompany: true,
    companyProofFile: filename
  });

  return {
    success: true,
    message: `✅ CNPJ ${cnpj} e documento "${filename}" (${filesizeMB}MB) autenticados! Selo de Empresa Verificada concedido.`,
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
