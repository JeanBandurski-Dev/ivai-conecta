// Favorites Service for Ivaí Conecta (Firestore + Local Storage Sync)
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { STORAGE_KEY_FAV_JOBS, STORAGE_KEY_FAV_TALENTS } from '../data/seedData';

export function getFavoriteJobs() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAV_JOBS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteJob(jobId, userUid) {
  const current = getFavoriteJobs();
  const exists = current.includes(jobId);
  const updated = exists ? current.filter(id => id !== jobId) : [...current, jobId];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_FAV_JOBS, JSON.stringify(updated));
  }

  // Sincronizar com Firestore se usuario estiver logado
  if (userUid) {
    try {
      if (!exists) {
        addDoc(collection(db, 'favorites'), {
          userUid,
          targetId: String(jobId),
          targetType: 'job',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } else {
        const favRef = collection(db, 'favorites');
        const q = query(favRef, where('userUid', '==', userUid), where('targetId', '==', String(jobId)));
        getDocs(q).then(snap => {
          snap.forEach(d => deleteDoc(doc(db, 'favorites', d.id)));
        }).catch(() => {});
      }
    } catch {}
  }

  return updated;
}

export function getFavoriteTalents() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAV_TALENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteTalent(talentId, userUid) {
  const current = getFavoriteTalents();
  const exists = current.includes(talentId);
  const updated = exists ? current.filter(id => id !== talentId) : [...current, talentId];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_FAV_TALENTS, JSON.stringify(updated));
  }

  // Sincronizar com Firestore
  if (userUid) {
    try {
      if (!exists) {
        addDoc(collection(db, 'favorites'), {
          userUid,
          targetId: String(talentId),
          targetType: 'talent',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } else {
        const favRef = collection(db, 'favorites');
        const q = query(favRef, where('userUid', '==', userUid), where('targetId', '==', String(talentId)));
        getDocs(q).then(snap => {
          snap.forEach(d => deleteDoc(doc(db, 'favorites', d.id)));
        }).catch(() => {});
      }
    } catch {}
  }

  return updated;
}
