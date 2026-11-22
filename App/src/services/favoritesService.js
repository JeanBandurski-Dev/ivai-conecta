// Favorites Service for Ivaí Conecta (Firestore + User-Scoped Local Storage Sync)
import { db } from '../lib/firebase';
import { collection, deleteDoc, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { STORAGE_KEY_FAV_JOBS, STORAGE_KEY_FAV_TALENTS } from '../data/seedData';

export function getUserStorageKey(baseKey, userOrUid) {
  const uid = typeof userOrUid === 'object' && userOrUid !== null
    ? (userOrUid.uid || userOrUid.id || userOrUid.email)
    : userOrUid;
  if (!uid) return `${baseKey}_guest`;
  const sanitized = String(uid).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${baseKey}_${sanitized}`;
}

function setFavoriteCache(baseKey, userOrUid, favorites) {
  if (typeof localStorage === 'undefined') return;
  const key = getUserStorageKey(baseKey, userOrUid);
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(favorites.map(String)))));
}

function getFavoriteDocumentId(userUid, targetType, targetId) {
  return `${encodeURIComponent(String(userUid))}_${targetType}_${encodeURIComponent(String(targetId))}`;
}

const favoriteOperationQueues = new Map();

function serializeFavoriteOperation(key, operation) {
  const previous = favoriteOperationQueues.get(key) || Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  favoriteOperationQueues.set(key, current);
  current.finally(() => {
    if (favoriteOperationQueues.get(key) === current) {
      favoriteOperationQueues.delete(key);
    }
  });
  return current;
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

    const confirmed = Array.from(new Set(firestoreFavs));
    setFavoriteCache(STORAGE_KEY_FAV_JOBS, userUid, confirmed);
    return confirmed;
  } catch (err) {
    console.error('Erro ao buscar favoritos de vagas do Firestore:', err);
    throw err;
  }
}

export async function toggleFavoriteJob(jobOrId, userOrUid = null) {
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

  if (!userUid) {
    const current = getFavoriteJobs(null);
    const exists = current.some(id => targetIds.has(String(id)));
    const updated = exists
      ? current.filter(id => !targetIds.has(String(id)))
      : Array.from(new Set([...current.map(String), primaryId]));
    setFavoriteCache(STORAGE_KEY_FAV_JOBS, null, updated);
    return updated;
  }

  const operationKey = `job:${userUid}:${primaryId}`;
  return serializeFavoriteOperation(operationKey, async () => {
    const remote = await fetchUserFavoriteJobsFromFirestore(userUid);
    const exists = remote.some(id => targetIds.has(String(id)));
    const favRef = collection(db, 'favorites');

    try {
      if (!exists) {
        const favoriteDoc = doc(db, 'favorites', getFavoriteDocumentId(userUid, 'job', primaryId));
        await setDoc(favoriteDoc, {
          userUid: String(userUid),
          targetId: primaryId,
          targetType: 'job',
          createdAt: new Date().toISOString()
        });
      } else {
        const q = query(favRef, where('userUid', '==', String(userUid)), where('targetType', '==', 'job'));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(async d => {
          const data = d.data();
          if (data?.targetId && targetIds.has(String(data.targetId))) {
            await deleteDoc(doc(db, 'favorites', d.id));
          }
        }));
      }
      return await fetchUserFavoriteJobsFromFirestore(userUid);
    } catch (err) {
      console.error('Erro ao persistir favorito de vaga no Firestore:', err);
      throw err;
    }
  });
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

    const confirmed = Array.from(new Set(firestoreFavs));
    setFavoriteCache(STORAGE_KEY_FAV_TALENTS, userUid, confirmed);
    return confirmed;
  } catch (err) {
    console.error('Erro ao buscar favoritos de talentos do Firestore:', err);
    throw err;
  }
}

export async function toggleFavoriteTalent(talentOrId, userOrUid = null) {
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

  if (!userUid) {
    const current = getFavoriteTalents(null);
    const exists = current.some(id => targetIds.has(String(id)));
    const updated = exists
      ? current.filter(id => !targetIds.has(String(id)))
      : Array.from(new Set([...current.map(String), primaryId]));
    setFavoriteCache(STORAGE_KEY_FAV_TALENTS, null, updated);
    return updated;
  }

  const operationKey = `talent:${userUid}:${primaryId}`;
  return serializeFavoriteOperation(operationKey, async () => {
    const remote = await fetchUserFavoriteTalentsFromFirestore(userUid);
    const exists = remote.some(id => targetIds.has(String(id)));
    const favRef = collection(db, 'favorites');

    try {
      if (!exists) {
        const favoriteDoc = doc(db, 'favorites', getFavoriteDocumentId(userUid, 'talent', primaryId));
        await setDoc(favoriteDoc, {
          userUid: String(userUid),
          targetId: primaryId,
          targetType: 'talent',
          createdAt: new Date().toISOString()
        });
      } else {
        const q = query(favRef, where('userUid', '==', String(userUid)), where('targetType', '==', 'talent'));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(async d => {
          const data = d.data();
          if (data?.targetId && targetIds.has(String(data.targetId))) {
            await deleteDoc(doc(db, 'favorites', d.id));
          }
        }));
      }
      return await fetchUserFavoriteTalentsFromFirestore(userUid);
    } catch (err) {
      console.error('Erro ao persistir favorito de talento no Firestore:', err);
      throw err;
    }
  });
}
