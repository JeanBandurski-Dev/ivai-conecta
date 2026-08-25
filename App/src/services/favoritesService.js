// Favorites Service for Ivaí Conecta
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

export function toggleFavoriteJob(jobId) {
  const current = getFavoriteJobs();
  const exists = current.includes(jobId);
  const updated = exists ? current.filter(id => id !== jobId) : [...current, jobId];
  localStorage.setItem(STORAGE_KEY_FAV_JOBS, JSON.stringify(updated));
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

export function toggleFavoriteTalent(talentId) {
  const current = getFavoriteTalents();
  const exists = current.includes(talentId);
  const updated = exists ? current.filter(id => id !== talentId) : [...current, talentId];
  localStorage.setItem(STORAGE_KEY_FAV_TALENTS, JSON.stringify(updated));
  return updated;
}
