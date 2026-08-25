import { create } from 'zustand';
import {
  getAuthUser,
  login as libLogin,
  logout as libLogout,
  register as libRegister,
  loginWithGoogle as libLoginGoogle,
  completeUserProfile as libCompleteProfile,
  getSelectedCity,
  setSelectedCity as libSetCity,
  CITIES,
} from '../lib/ivaiConecta';

const useAppStore = create((set, get) => ({
  // ─── Auth State ────────────────────────────────────────
  currentUser: getAuthUser(),

  login: async (email, password) => {
    const result = await libLogin(email, password);
    if (result.success) {
      set({ currentUser: result.user });
    }
    return result;
  },

  register: async (data) => {
    const result = await libRegister(data);
    if (result.success) {
      set({ currentUser: result.user });
    }
    return result;
  },

  loginWithGoogle: async () => {
    const result = await libLoginGoogle();
    if (result.success) {
      set({ currentUser: result.user });
    }
    return result;
  },

  completeProfile: async (uid, data) => {
    const result = await libCompleteProfile(uid, data);
    if (result.success) {
      set({ currentUser: result.user });
    }
    return result;
  },

  logout: async () => {
    await libLogout();
    set({ currentUser: null });
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  // ─── City State ────────────────────────────────────────
  selectedCity: getSelectedCity(),
  cities: CITIES,

  setCity: (city) => {
    libSetCity(city);
    set({ selectedCity: city });
  },

  // ─── Theme State ───────────────────────────────────────
  theme: (() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ivai_conecta_theme') : null;
    if (saved === 'dark' || saved === 'light') {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', saved === 'dark');
      }
      return saved;
    }
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = prefersDark ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', initial === 'dark');
    }
    return initial;
  })(),

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('ivai_conecta_theme', nextTheme);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }
    set({ theme: nextTheme });
  },

  // ─── Favorites State ───────────────────────────────────
  favoriteJobs: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('ivai_conecta_fav_jobs') || '[]')) : [],
  favoriteTalents: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('ivai_conecta_fav_talents') || '[]')) : [],

  toggleFavoriteJob: (jobId) => {
    const current = get().favoriteJobs;
    const exists = current.includes(jobId);
    const updated = exists ? current.filter(id => id !== jobId) : [...current, jobId];
    if (typeof window !== 'undefined') {
      localStorage.setItem('ivai_conecta_fav_jobs', JSON.stringify(updated));
    }
    set({ favoriteJobs: updated });
    return !exists;
  },

  toggleFavoriteTalent: (talentId) => {
    const current = get().favoriteTalents;
    const exists = current.includes(talentId);
    const updated = exists ? current.filter(id => id !== talentId) : [...current, talentId];
    if (typeof window !== 'undefined') {
      localStorage.setItem('ivai_conecta_fav_talents', JSON.stringify(updated));
    }
    set({ favoriteTalents: updated });
    return !exists;
  },

  // ─── Toast State ──────────────────────────────────────
  toasts: [],

  showToast: (message, duration = 3500) => {
    const id = Date.now();
    set(state => ({ toasts: [...state.toasts, { id, message }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, duration);
  },
}));

export default useAppStore;
