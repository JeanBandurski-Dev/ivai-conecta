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
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Checks if a given job (by object or id) is in the favorite list.
 * Supports comparison against numeric ID, string ID, and firestoreId.
 */
export function isJobFavorited(jobOrId, favoriteJobsList = []) {
  if (!jobOrId || !Array.isArray(favoriteJobsList) || favoriteJobsList.length === 0) return false;

  const targetIds = new Set();
  if (typeof jobOrId === 'object' && jobOrId !== null) {
    if (jobOrId.id !== undefined && jobOrId.id !== null) targetIds.add(String(jobOrId.id));
    if (jobOrId.firestoreId) targetIds.add(String(jobOrId.firestoreId));
    if (jobOrId._id) targetIds.add(String(jobOrId._id));
  } else if (jobOrId !== undefined && jobOrId !== null) {
    targetIds.add(String(jobOrId));
  }

  if (targetIds.size === 0) return false;

  return favoriteJobsList.some(favId => {
    if (favId === undefined || favId === null) return false;
    return targetIds.has(String(favId));
  });
}

export async function fetchUserFavoriteJobsFromFirestore(userUid) {
  if (!userUid) return getFavoriteJobs(null);
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

export function toggleFavoriteJob(jobOrId, userOrUid = null) {
  const userUid = typeof userOrUid === 'object' && userOrUid !== null
    ? (userOrUid.uid || userOrUid.id)
    : userOrUid;

  const targetIds = new Set();
  let primaryId = '';

  if (typeof jobOrId === 'object' && jobOrId !== null) {
    if (jobOrId.id !== undefined && jobOrId.id !== null) {
      primaryId = String(jobOrId.id);
      targetIds.add(primaryId);
    }
    if (jobOrId.firestoreId) {
      const fId = String(jobOrId.firestoreId);
      if (!primaryId) primaryId = fId;
      targetIds.add(fId);
    }
    if (jobOrId._id) {
      const uId = String(jobOrId._id);
      if (!primaryId) primaryId = uId;
      targetIds.add(uId);
    }
  } else if (jobOrId !== undefined && jobOrId !== null) {
    primaryId = String(jobOrId);
    targetIds.add(primaryId);
  }

  if (!primaryId) return getFavoriteJobs(userOrUid);

  const current = getFavoriteJobs(userOrUid);
  const exists = current.some(id => targetIds.has(String(id)));

  let updated;
  if (exists) {
    updated = current.filter(id => !targetIds.has(String(id)));
  } else {
    const idsToAdd = Array.from(targetIds);
    updated = Array.from(new Set([...current.map(String), ...idsToAdd]));
  }

  if (typeof localStorage !== 'undefined') {
    const key = getUserStorageKey(STORAGE_KEY_FAV_JOBS, userOrUid);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  // Sincronizar com Firestore se usuario estiver logado
  if (userUid) {
    try {
      const targetIdList = Array.from(targetIds);
      if (!exists) {
        addDoc(collection(db, 'favorites'), {
          userUid: String(userUid),
          targetId: primaryId,
          targetType: 'job',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } else {
        const favRef = collection(db, 'favorites');
        const q = query(favRef, where('userUid', '==', String(userUid)), where('targetType', '==', 'job'));
        getDocs(q).then(snap => {
          snap.forEach(d => {
            const data = d.data();
            if (data?.targetId && targetIdList.includes(String(data.targetId))) {
              deleteDoc(doc(db, 'favorites', d.id)).catch(() => {});
            }
          });
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
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Checks if a given talent (by object or id) is in the favorite list.
 */
export function isTalentFavorited(talentOrId, favoriteTalentsList = []) {
  if (!talentOrId || !Array.isArray(favoriteTalentsList) || favoriteTalentsList.length === 0) return false;

  const targetIds = new Set();
  if (typeof talentOrId === 'object' && talentOrId !== null) {
    if (talentOrId.id !== undefined && talentOrId.id !== null) targetIds.add(String(talentOrId.id));
    if (talentOrId.uid) targetIds.add(String(talentOrId.uid));
    if (talentOrId.firestoreId) targetIds.add(String(talentOrId.firestoreId));
  } else if (talentOrId !== undefined && talentOrId !== null) {
    targetIds.add(String(talentOrId));
  }

  if (targetIds.size === 0) return false;

  return favoriteTalentsList.some(favId => {
    if (favId === undefined || favId === null) return false;
    return targetIds.has(String(favId));
  });
}

export async function fetchUserFavoriteTalentsFromFirestore(userUid) {
  if (!userUid) return getFavoriteTalents(null);
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

export function toggleFavoriteTalent(talentOrId, userOrUid = null) {
  const userUid = typeof userOrUid === 'object' && userOrUid !== null
    ? (userOrUid.uid || userOrUid.id)
    : userOrUid;

  const targetIds = new Set();
  let primaryId = '';

  if (typeof talentOrId === 'object' && talentOrId !== null) {
    if (talentOrId.id !== undefined && talentOrId.id !== null) {
      primaryId = String(talentOrId.id);
      targetIds.add(primaryId);
    }
    if (talentOrId.uid) {
      const uId = String(talentOrId.uid);
      if (!primaryId) primaryId = uId;
      targetIds.add(uId);
    }
    if (talentOrId.firestoreId) {
      const fId = String(talentOrId.firestoreId);
      if (!primaryId) primaryId = fId;
      targetIds.add(fId);
    }
  } else if (talentOrId !== undefined && talentOrId !== null) {
    primaryId = String(talentOrId);
    targetIds.add(primaryId);
  }

  if (!primaryId) return getFavoriteTalents(userOrUid);

  const current = getFavoriteTalents(userOrUid);
  const exists = current.some(id => targetIds.has(String(id)));

  let updated;
  if (exists) {
    updated = current.filter(id => !targetIds.has(String(id)));
  } else {
    const idsToAdd = Array.from(targetIds);
    updated = Array.from(new Set([...current.map(String), ...idsToAdd]));
  }

  if (typeof localStorage !== 'undefined') {
    const key = getUserStorageKey(STORAGE_KEY_FAV_TALENTS, userOrUid);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  // Sincronizar com Firestore
  if (userUid) {
    try {
      const targetIdList = Array.from(targetIds);
      if (!exists) {
        addDoc(collection(db, 'favorites'), {
          userUid: String(userUid),
          targetId: primaryId,
          targetType: 'talent',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } else {
        const favRef = collection(db, 'favorites');
        const q = query(favRef, where('userUid', '==', String(userUid)), where('targetType', '==', 'talent'));
        getDocs(q).then(snap => {
          snap.forEach(d => {
            const data = d.data();
            if (data?.targetId && targetIdList.includes(String(data.targetId))) {
              deleteDoc(doc(db, 'favorites', d.id)).catch(() => {});
            }
          });
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao persistir favorito de talento no Firestore:', err);
    }
  }

  return updated;
}
