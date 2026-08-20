/**
 * IVAÍ CONECTA - CAMADA DE SERVIÇO DE AUTENTICAÇÃO E SESSÃO
 * Projeto de Extensão IFPR Campus Ivaiporã
 *
 * Responsabilidade única deste arquivo: tudo relacionado a login, cadastro,
 * sessão do usuário e perfil (Firebase Auth + Firestore).
 * Nenhuma tela deve manipular Firebase diretamente — sempre passar por aqui.
 */

import { auth, db, isFirebaseInitialized } from '../../public/js/firebase-config.js';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ==========================================
// LOGIN E CADASTRO
// ==========================================

/**
 * Autentica um usuário existente com email e senha.
 * @param {string} email
 * @param {string} password
 * @returns {{success: boolean, user?: object, errorCode?: string}}
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, errorCode: error.code };
  }
}

/**
 * Cria um novo usuário (Firebase Auth) e grava os dados complementares
 * (nome, cidade, role) como um documento na coleção 'users' do Firestore,
 * usando o uid do Auth como ID do documento — assim os dois ficam vinculados.
 *
 * @param {string} email
 * @param {string} password
 * @param {{name: string, city: string, role: string}} additionalData
 * @returns {{success: boolean, user?: object, errorCode?: string}}
 */
export async function registerUser(email, password, additionalData) {
  try {
    // 1. Cria a conta na "portaria" (Authentication)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Grava a "ficha cadastral" (Firestore), vinculada pelo mesmo uid
    if (isFirebaseInitialized) {
      await setDoc(doc(db, 'users', user.uid), {
        name: additionalData.name,
        email: email,
        city: additionalData.city,
        role: additionalData.role,
        createdAt: new Date().toISOString()
      });
    }

    return { success: true, user: user };
  } catch (error) {
    return { success: false, errorCode: error.code };
  }
}

/**
 * Autentica (ou cadastra automaticamente, na primeira vez) usando uma conta
 * Google, via popup. O Firebase Auth cuida de tudo relacionado à senha —
 * a gente só precisa saber se é a primeira vez desse usuário aqui, pra
 * decidir se ele precisa completar o perfil (nome/cidade/role) ou não.
 *
 * @returns {{success: boolean, user?: object, isNewUser?: boolean, errorCode?: string}}
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const additionalInfo = getAdditionalUserInfo(userCredential);

    return {
      success: true,
      user: userCredential.user,
      isNewUser: additionalInfo?.isNewUser ?? false
    };
  } catch (error) {
    return { success: false, errorCode: error.code };
  }
}

// ==========================================
// SESSÃO
// ==========================================

/**
 * Observa mudanças no estado de autenticação (login/logout).
 * Deve ser chamado em toda página que precisa saber se tem alguém logado.
 *
 * @param {(user: object|null) => void} callback recebe o objeto 'user' do
 *   Firebase Auth, ou null se ninguém estiver logado.
 * @returns {() => void} função para cancelar a observação (unsubscribe),
 *   útil se a página for desmontada.
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Encerra a sessão do usuário atual.
 * @returns {{success: boolean, errorCode?: string}}
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, errorCode: error.code };
  }
}

// ==========================================
// PERFIL
// ==========================================

/**
 * Busca no Firestore os dados complementares do usuário logado
 * (nome, cidade, role) usando o uid como chave do documento.
 *
 * @param {string} uid
 * @returns {{success: boolean, profile?: object, errorCode?: string}}
 */
export async function getUserProfile(uid) {
  if (!isFirebaseInitialized) {
    return { success: false, errorCode: 'firebase/not-initialized' };
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, errorCode: 'profile/not-found' };
    }

    return { success: true, profile: userDocSnap.data() };
  } catch (error) {
    return { success: false, errorCode: error.code };
  }
}

/**
 * Grava (ou sobrescreve) o perfil complementar de um usuário no Firestore.
 * Usado tanto pelo cadastro tradicional quanto pela tela de "completar
 * perfil" que aparece na primeira vez que alguém entra com o Google
 * (onde não existe senha/email pra coletar, só nome/cidade/role).
 *
 * @param {string} uid
 * @param {{name: string, email: string, city: string, role: string}} additionalData
 * @returns {{success: boolean, errorCode?: string}}
 */
export async function completeUserProfile(uid, additionalData) {
  if (!isFirebaseInitialized) {
    return { success: false, errorCode: 'firebase/not-initialized' };
  }

  try {
    await setDoc(doc(db, 'users', uid), {
      name: additionalData.name,
      email: additionalData.email,
      city: additionalData.city,
      role: additionalData.role,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, errorCode: error.code };
  }
}