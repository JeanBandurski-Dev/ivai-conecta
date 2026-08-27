import { db, auth } from '../lib/firebase.js';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { SEED_JOBS, SEED_SERVICES, SEED_TALENTS, SEED_TEACHERS, DEFAULT_USERS, SEED_APPLICATIONS } from '../data/seedData.js';
import { SEED_CHAT_THREADS } from './chatService.js';

// Helper para remover campos com valor undefined para nao quebrar o setDoc do Firestore
function cleanData(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Força a gravação de todas as coleções no Firestore.
 */
export async function forceSeedAllCollections() {
  const currentUser = auth.currentUser;
  console.log('[Firestore Seed] Usuário autenticado:', currentUser ? currentUser.uid : 'Nenhum usuário logado');

  const collectionsToSeed = [
    { name: 'users', data: DEFAULT_USERS, idKey: 'id' },
    { name: 'jobs', data: SEED_JOBS, idKey: 'id' },
    { name: 'services', data: SEED_SERVICES, idKey: 'id' },
    { name: 'applications', data: SEED_APPLICATIONS, idKey: 'id' },
    { name: 'chats', data: SEED_CHAT_THREADS, idKey: 'id' },
  ];

  const logResults = [];

  for (const item of collectionsToSeed) {
    try {
      console.log(`[Firestore Seed] Enviando coleção '${item.name}'...`);
      for (const rawEntry of item.data) {
        const entry = cleanData(rawEntry);
        const docId = entry[item.idKey] ? String(entry[item.idKey]) : `doc_${Date.now()}`;
        const docRef = doc(db, item.name, docId);
        await setDoc(docRef, {
          ...entry,
          createdBy: currentUser ? currentUser.uid : 'system',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      console.log(`✅ Coleção '${item.name}' gravada no Firestore com sucesso!`);
      logResults.push({ col: item.name, success: true });
    } catch (err) {
      console.warn(`⚠️ O Firestore recusou a gravação da coleção '${item.name}':`, err.code, err.message);
      logResults.push({ col: item.name, success: false, error: err.message, code: err.code });
    }
  }

  return logResults;
}

/**
 * Tenta semear se as coleções ainda não existirem.
 */
export async function seedFirestoreIfEmpty() {
  try {
    const collectionsToSeed = [
      { name: 'users', data: DEFAULT_USERS, idKey: 'id' },
      { name: 'jobs', data: SEED_JOBS, idKey: 'id' },
      { name: 'services', data: SEED_SERVICES, idKey: 'id' },
      { name: 'applications', data: SEED_APPLICATIONS, idKey: 'id' },
      { name: 'chats', data: SEED_CHAT_THREADS, idKey: 'id' },
    ];

    for (const item of collectionsToSeed) {
      const colRef = collection(db, item.name);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        await forceSeedAllCollections();
        break;
      }
    }
  } catch (error) {
    console.warn('[Firestore Seed] Erro ao verificar coleções:', error.message);
  }
}
