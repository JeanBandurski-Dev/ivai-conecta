// Favorites Service for Ivaí Conecta (Firestore + User-Scoped Local Storage Sync)
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { STORAGE_KEY_FAV_JOBS, STORAGE_KEY_FAV_TALENTS } from '../data/seedData';

export function getUserStorageKey(baseKey, userOrUid) {
  const uid = typeof userOrUid === 'object' && userOrUid !== null
    ? (userOrUid.uid || userOrUid.id || userOrUid.email)
    : userOrUid;
  if (!uid) return `${baseKey}_guest`;
  const sanitized = String(uid).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${baseKey}_${sanitized}`;
}

export function getFavoriteJobs(userOrUid = null) {
  if (typeof localStorage === 'undefined') return [];
  const key = getUserStorageKey(STORAGE_KEY_FAV_JOBS, userOrUid);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchUserFavoriteJobsFromFirestore(userUid) {
  if (!userUid) return [];
  try {
    const favRef = collection(db, 'favorites');
    const q = query(favRef, where('userUid', '==', String(userUid)), where('targetType', '==', 'job'));
    const snap = await getDocs(q);
    const firestoreFavs = [];
    snap.forEach(d => {
      const data = d.data();
      if (data?.targetId) firestoreFavs.push(String(data.targetId));
    });

    const current = getFavoriteJobs(userUid);
    const merged = Array.from(new Set([...current.map(String), ...firestoreFavs]));
    if (typeof localStorage !== 'undefined') {
      const key = getUserStorageKey(STORAGE_KEY_FAV_JOBS, userUid);
      localStorage.setItem(key, JSON.stringify(merged));
    }
    return merged;
  } catch (err) {
    console.error('Erro ao buscar favoritos de vagas do Firestore:', err);
    return getFavoriteJobs(userUid);
  }
}

export function toggleFavoriteJob(jobId, userOrUid = null) {
  const userUid = typeof userOrUid === 'object' && userOrUid !== null
    ? (userOrUid.uid || userOrUid.id)
    : userOrUid;
  const current = getFavoriteJobs(userOrUid);
  const exists = current.some(id => String(id) === String(jobId));
  const updated = exists ? current.filter(id => String(id) !== String(jobId)) : [...current, String(jobId)];
  
  if (typeof localStorage !== 'undefined') {
    const key = getUserStorageKey(STORAGE_KEY_FAV_JOBS, userOrUid);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  // Sincronizar com Firestore se usuario estiver logado
  if (userUid) {
    try {
      if (!exists) {
        addDoc(collection(db, 'favorites'), {
          userUid: String(userUid),
          targetId: String(jobId),
          targetType: 'job',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } else {
        const favRef = collection(db, 'favorites');
        const q = query(favRef, where('userUid', '==', String(userUid)), where('targetId', '==', String(jobId)));
        getDocs(q).then(snap => {
          snap.forEach(d => deleteDoc(doc(db, 'favorites', d.id)));
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao persistir favorito de vaga no Firestore:', err);
    }
  }

  return updated;
}

export function getFavoriteTalents(userOrUid = null) {
  if (typeof localStorage === 'undefined') return [];
  const key = getUserStorageKey(STORAGE_KEY_FAV_TALENTS, userOrUid);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchUserFavoriteTalentsFromFirestore(userUid) {
  if (!userUid) return [];
  try {
    const favRef = collection(db, 'favorites');
    const q = query(favRef, where('userUid', '==', String(userUid)), where('targetType', '==', 'talent'));
    const snap = await getDocs(q);
    const firestoreFavs = [];
    snap.forEach(d => {
      const data = d.data();
      if (data?.targetId) firestoreFavs.push(String(data.targetId));
    });

    const current = getFavoriteTalents(userUid);
    const merged = Array.from(new Set([...current.map(String), ...firestoreFavs]));
    if (typeof localStorage !== 'undefined') {
      const key = getUserStorageKey(STORAGE_KEY_FAV_TALENTS, userUid);
      localStorage.setItem(key, JSON.stringify(merged));
    }
    return merged;
  } catch (err) {
    console.error('Erro ao buscar favoritos de talentos do Firestore:', err);
    return getFavoriteTalents(userUid);
  }
}

export function toggleFavoriteTalent(talentId, userOrUid = null) {
  const userUid = typeof userOrUid === 'object' && userOrUid !== null
    ? (userOrUid.uid || userOrUid.id)
    : userOrUid;
  const current = getFavoriteTalents(userOrUid);
  const exists = current.some(id => String(id) === String(talentId));
  const updated = exists ? current.filter(id => String(id) !== String(talentId)) : [...current, String(talentId)];
  
  if (typeof localStorage !== 'undefined') {
    const key = getUserStorageKey(STORAGE_KEY_FAV_TALENTS, userOrUid);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  // Sincronizar com Firestore
  if (userUid) {
    try {
      if (!exists) {
        addDoc(collection(db, 'favorites'), {
          userUid: String(userUid),
          targetId: String(talentId),
          targetType: 'talent',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } else {
        const favRef = collection(db, 'favorites');
        const q = query(favRef, where('userUid', '==', String(userUid)), where('targetId', '==', String(talentId)));
        getDocs(q).then(snap => {
          snap.forEach(d => deleteDoc(doc(db, 'favorites', d.id)));
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao persistir favorito de talento no Firestore:', err);
    }
  }

  return updated;
}
