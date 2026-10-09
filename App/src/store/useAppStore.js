import { getOrCreateChat, isSameUser, sendChatMessage } from '../services/chatService';
import { create } from 'zustand';
import {
  getAuthUser,
  watchAuthState,
  login as libLogin,
  logout as libLogout,
  register as libRegister,
  loginWithGoogle as libLoginGoogle,
  completeUserProfile as libCompleteProfile,
  getSelectedCity,
  setSelectedCity as libSetCity,
  CITIES,
  getFavoriteJobs,
  getFavoriteTalents,
  isJobFavorited,
  isTalentFavorited,
  toggleFavoriteJob as libToggleFavoriteJob,
  toggleFavoriteTalent as libToggleFavoriteTalent,
  fetchUserFavoriteJobsFromFirestore,
  fetchUserFavoriteTalentsFromFirestore,
} from '../lib/ivaiConecta';

const initialAuthUser = getAuthUser();

const useAppStore = create((set, get) => ({
  // ─── Auth State ────────────────────────────────────────
  currentUser: initialAuthUser,
  authLoading: false,
  isAuthReady: true,

  // ─── Favorites State (User-Scoped) ─────────────────────
  favoriteJobs: getFavoriteJobs(initialAuthUser),
  favoriteTalents: getFavoriteTalents(initialAuthUser),

  syncUserFavorites: async (user) => {
    if (!user) {
      const guestJobs = getFavoriteJobs(null);
      const guestTalents = getFavoriteTalents(null);
      set({ favoriteJobs: guestJobs, favoriteTalents: guestTalents });
      return;
    }
    const localJobs = getFavoriteJobs(user);
    const localTalents = getFavoriteTalents(user);
    set({ favoriteJobs: localJobs, favoriteTalents: localTalents });

    const userUid = user.uid || user.id;
    if (userUid) {
      try {
        const [remoteJobs, remoteTalents] = await Promise.all([
          fetchUserFavoriteJobsFromFirestore(userUid),
          fetchUserFavoriteTalentsFromFirestore(userUid),
        ]);
        const active = get().currentUser;
        if (active && (active.uid === userUid || active.id === userUid)) {
          set({ favoriteJobs: remoteJobs, favoriteTalents: remoteTalents });
        }
      } catch (err) {
        console.warn('Erro ao sincronizar favoritos do usuário:', err);
      }
    }
  },

  initAuthListener: () => {
    const safetyTimer = setTimeout(() => {
      if (get().authLoading) {
        set({ authLoading: false, isAuthReady: true });
      }
    }, 1500);

    const unsubscribe = watchAuthState((user) => {
      clearTimeout(safetyTimer);
      const prevUser = get().currentUser;
      const userChanged = (!prevUser && user) || (prevUser && !user) || (prevUser && user && (prevUser.uid !== user.uid || prevUser.email !== user.email));

      set({
        currentUser: user,
        authLoading: false,
        isAuthReady: true,
        ...(userChanged ? { activeChatThreadId: null, isChatOpen: false, chatDraftMessage: null } : {})
      });
      get().syncUserFavorites(user);
    });

    return () => {
      clearTimeout(safetyTimer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  },

  login: async (email, password) => {
    const result = await libLogin(email, password);
    if (result.success) {
      set({ currentUser: result.user, authLoading: false, activeChatThreadId: null, isChatOpen: false });
      get().syncUserFavorites(result.user);
    }
    return result;
  },

  register: async (data) => {
    const result = await libRegister(data);
    if (result.success) {
      set({ currentUser: result.user, authLoading: false, activeChatThreadId: null, isChatOpen: false });
      get().syncUserFavorites(result.user);
    }
    return result;
  },

  loginWithGoogle: async () => {
    const result = await libLoginGoogle();
    if (result.success) {
      set({ currentUser: result.user, authLoading: false, activeChatThreadId: null, isChatOpen: false });
      get().syncUserFavorites(result.user);
    }
    return result;
  },

  completeProfile: async (uid, data) => {
    const result = await libCompleteProfile(uid, data);
    if (result.success) {
      set({ currentUser: result.user });
      get().syncUserFavorites(result.user);
    }
    return result;
  },

  logout: async () => {
    await libLogout();
    const guestJobs = getFavoriteJobs(null);
    const guestTalents = getFavoriteTalents(null);
    set({
      currentUser: null,
      authLoading: false,
      favoriteJobs: guestJobs,
      favoriteTalents: guestTalents,
      isChatOpen: false,
      activeChatThreadId: null,
      chatDraftMessage: null
    });
  },

  setCurrentUser: (user) => {
    set({ currentUser: user, authLoading: false });
    get().syncUserFavorites(user);
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

  // ─── Favorites Actions ─────────────────────────────────
  toggleFavoriteJob: (jobOrId) => {
    const user = get().currentUser;
    const current = get().favoriteJobs;
    const wasFavorite = isJobFavorited(jobOrId, current);
    const updated = libToggleFavoriteJob(jobOrId, user);
    set({ favoriteJobs: updated });
    return !wasFavorite;
  },

  toggleFavoriteTalent: (talentOrId) => {
    const user = get().currentUser;
    const current = get().favoriteTalents;
    const wasFavorite = isTalentFavorited(talentOrId, current);
    const updated = libToggleFavoriteTalent(talentOrId, user);
    set({ favoriteTalents: updated });
    return !wasFavorite;
  },

  // ─── Toast State ──────────────────────────────────────
  toasts: [],

  // ─── Chat Global State ────────────────────────────────
  isChatOpen: false,
  activeChatThreadId: null,

  // Abre o modal do chat. Se passar um threadId, já seleciona aquela conversa
  openChat: (threadId = null) => {
    set({
      isChatOpen: true,
      ...(threadId ? { activeChatThreadId: threadId } : {})
    });
  },

  // Fecha o modal do chat
  closeChat: () => {
    set({ isChatOpen: false });
  },

  chatDraftMessage: null,
  setChatDraftMessage: (msg) => set({ chatDraftMessage: msg }),

  // Inicia ou recupera uma conversa com outro usuário e já abre a janela
  startChatWith: async (targetUser, contextTitle = 'Contato Direto', initialMessage = null, draftMessage = null) => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      get().showToast('Faça login para iniciar uma conversa!');
      return null;
    }

    if (!targetUser) return null;

    // Bloqueia categoricamente conversa consigo mesmo (empresa, freelancer ou candidato)
    const isSelf = isSameUser(currentUser, targetUser) ||
      (currentUser.email && targetUser?.email && currentUser.email.toLowerCase().trim() === targetUser.email.toLowerCase().trim()) ||
      (currentUser.uid && targetUser?.uid && String(currentUser.uid) === String(targetUser.uid));

    if (isSelf) {
      get().showToast('⚠️ Você não pode enviar mensagens para si mesmo.');
      return null;
    }

    try {
      // Chama a função que já temos no chatService para criar o ID único da conversa no Firestore
      const chatId = await getOrCreateChat(currentUser, targetUser, contextTitle);

      if (initialMessage) {
        await sendChatMessage(chatId, currentUser, initialMessage);
      }

      // Abre o modal apontando exatamente para esse chat criado
      set({
        isChatOpen: true,
        activeChatThreadId: chatId,
        chatDraftMessage: draftMessage || null
      });
      return chatId;
    } catch (error) {
      console.error('Erro ao iniciar chat: ', error);
      get().showToast(error?.message || 'Não foi possível abrir o chat no momento.');
      return null;
    }
  },

  showToast: (message, typeOrDuration = 'info', duration = 3800) => {
    const id = Date.now() + Math.random();
    let type = 'info';
    let dur = 3800;
    if (typeof typeOrDuration === 'number') {
      dur = typeOrDuration;
    } else if (typeof typeOrDuration === 'string') {
      type = typeOrDuration;
      if (typeof duration === 'number') dur = duration;
    }
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, dur);
  },

  // ─── Modal Dialog State (Alert & Confirm) ─────────────────
  confirmDialog: null,

  showConfirm: (options = {}) => {
    const config = typeof options === 'string'
      ? { message: options }
      : (options || {});

    return new Promise((resolve) => {
      set({
        confirmDialog: {
          title: config.title || 'Confirmação',
          message: config.message || 'Deseja prosseguir com esta ação?',
          confirmText: config.confirmText || 'Confirmar',
          cancelText: config.cancelText || 'Cancelar',
          variant: config.variant || 'primary',
          badge: config.badge || null,
          isAlert: false,
          resolve
        }
      });
    });
  },

  showAlert: (options = {}) => {
    const config = typeof options === 'string'
      ? { message: options }
      : (options || {});

    return new Promise((resolve) => {
      set({
        confirmDialog: {
          title: config.title || 'Aviso',
          message: config.message || '',
          confirmText: config.confirmText || 'Entendi',
          cancelText: null,
          variant: config.variant || 'info',
          badge: config.badge || null,
          isAlert: true,
          resolve
        }
      });
    });
  },

  closeConfirm: (result = false) => {
    const dialog = get().confirmDialog;
    if (dialog && typeof dialog.resolve === 'function') {
      try {
        dialog.resolve(result);
      } catch (err) {
        console.error('Erro ao resolver dialog:', err);
      }
    }
    set({ confirmDialog: null });
  },
}));

export default useAppStore;
