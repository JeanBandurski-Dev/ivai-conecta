import { create } from 'zustand';
import {
  getAuthUser,
  login as libLogin,
  logout as libLogout,
  register as libRegister,
  getSelectedCity,
  setSelectedCity as libSetCity,
  CITIES,
} from '../lib/ivaiConecta';

const useAppStore = create((set, get) => ({
  // ─── Auth State ────────────────────────────────────────
  currentUser: getAuthUser(),

  login: (email, password) => {
    const result = libLogin(email, password);
    if (result.success) {
      set({ currentUser: result.user });
    }
    return result;
  },

  register: (data) => {
    const result = libRegister(data);
    if (result.success) {
      set({ currentUser: result.user });
    }
    return result;
  },

  logout: () => {
    libLogout();
    set({ currentUser: null });
  },

  // ─── City State ────────────────────────────────────────
  selectedCity: getSelectedCity(),
  cities: CITIES,

  setCity: (city) => {
    libSetCity(city);
    set({ selectedCity: city });
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
