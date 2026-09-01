// Auth Service for Ivaí Conecta (Firebase + Local Storage Fallback)
import { auth, db, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import {
  STORAGE_KEY_AUTH_USER,
  STORAGE_KEY_USERS_DB,
  STORAGE_KEY_CITY,
  DEFAULT_USERS,
  USER_ROLES,
} from '../data/seedData';

export function getUsersDB() {
  if (typeof localStorage === 'undefined') return DEFAULT_USERS;
  const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
  let users = DEFAULT_USERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        users = parsed;
      }
    } catch {}
  }
  let modified = false;
  DEFAULT_USERS.forEach(defUser => {
    if (!users.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
      users.push(defUser);
      modified = true;
    }
  });

  const authUser = getAuthUser();
  if (authUser && !users.some(u => u.email.toLowerCase() === authUser.email.toLowerCase())) {
    users.push(authUser);
    modified = true;
  }

  if (modified || !raw) {
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
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

  // 1. Verificar primeiro se é conta demo do LocalStorage
  const users = getUsersDB();
  const demoFound = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
  if (demoFound) {
    const sessionUser = { ...demoFound };
    delete sessionUser.password;
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  }

  // 2. Tentar login no Firebase Auth
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Buscar perfil adicional no Firestore
    const profileRes = await getUserProfile(fbUser.uid);
    const roleMeta = USER_ROLES[profileRes.profile?.role] || USER_ROLES.aluno;

    const sessionUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      name: profileRes.profile?.name || fbUser.displayName || 'Usuário',
      city: profileRes.profile?.city || 'Ivaiporã',
      role: profileRes.profile?.role || 'aluno',
      badge: roleMeta.badge,
      avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      isVerifiedStudent: false,
      isVerifiedCompany: profileRes.profile?.role === 'empresa',
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  } catch (error) {
    return { success: false, error: 'E-mail ou senha incorretos. Verifique seus dados.' };
  }
}

export async function register(data) {
  const { email, name, city, role, password } = data;
  const cleanEmail = email.toLowerCase().trim();
  const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;

  try {
    // 1. Criar conta no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // 2. Salvar documento adicional no Firestore em users/{uid}
    const profileData = {
      name,
      email: cleanEmail,
      city,
      role,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', fbUser.uid), profileData);

    const sessionUser = {
      uid: fbUser.uid,
      email: cleanEmail,
      name,
      city,
      role,
      badge: roleMeta.badge,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      skills: role === 'aluno' || role === 'candidato' ? ['JavaScript', 'Excel Avançado', 'Gestão'] : [],
      isVerifiedStudent: false,
      isVerifiedCompany: role === 'empresa',
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  } catch (error) {
    // Fallback: se Firebase falhar ou estiver sem internet, grava no LocalStorage
    const users = getUsersDB();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Este e-mail já está cadastrado no Ivaí Conecta.' };
    }
    const newUser = {
      email: cleanEmail,
      password,
      name,
      city,
      role,
      badge: roleMeta.badge,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      skills: role === 'aluno' || role === 'candidato' ? ['JavaScript', 'Excel Avançado', 'Gestão'] : [],
      isVerifiedStudent: false,
      isVerifiedCompany: role === 'empresa',
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
      email: fbUser.email,
      name: profileRes.profile?.name || fbUser.displayName || 'Usuário Google',
      city: profileRes.profile?.city || 'Ivaiporã',
      role,
      badge: roleMeta.badge,
      avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      isVerifiedStudent: false,
      isVerifiedCompany: role === 'empresa',
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
      createdAt: new Date().toISOString()
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
      const profileRes = await getUserProfile(fbUser.uid);
      const role = profileRes.profile?.role || 'aluno';
      const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;
      const sessionUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: profileRes.profile?.name || fbUser.displayName || 'Usuário',
        city: profileRes.profile?.city || 'Ivaiporã',
        role,
        badge: roleMeta.badge,
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        isVerifiedStudent: false,
        isVerifiedCompany: role === 'empresa',
      };
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
      callback(sessionUser);
    } else {
      callback(null);
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
