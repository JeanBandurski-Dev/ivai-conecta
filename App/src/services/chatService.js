// Chat & Direct Messaging Service for Ivaí Conecta
// Arquitetura Híbrida: LocalStorage (0ms) + BroadcastChannel + Firestore Realtime
// Com Bloqueio Estrito de Linguagem Imprópria & Suporte a Todos os Usuários (Empresa, Freelancer, Aluno, Professor, Admin)

import { db } from '../lib/firebase.js';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { detectProfanity } from './jobTaxonomy.js';

export const STORAGE_KEY_CHAT_THREADS = 'ivai_conecta_chat_threads';
export const STORAGE_KEY_DELETED_THREADS = 'ivai_conecta_deleted_threads';
export const STORAGE_KEY_CHAT_READ_TIMESTAMPS = 'ivai_conecta_chat_read_timestamps';

// ─── CANAL DE COMUNICAÇÃO ENTRE ABAS LOCAIS ─────────────────────────────
const chatChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ivai_conecta_chat_bus') : null;

// ─── HELPERS DE IDENTIDADE E PERFIL ─────────────────────────────────────

/**
 * Conhecidos IDs de stock photos de pessoas / avatares genéricos no Unsplash
 */
export const GENERIC_STOCK_AVATAR_IDS = [
  'photo-1534528741775-53994a69daeb',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1494790108377-be9c29b29330',
  'photo-1517841905240-472988babdf9',
  'photo-1500648767791-00dcc994a43e',
  'photo-1573496359142-b8d87734a5a2',
  'photo-1560250097-0b93528c311a'
];

/**
 * Verifica se a URL de avatar informada é um placeholder genérico de banco de fotos
 */
export function isGenericPlaceholderAvatar(url) {
  if (!url || typeof url !== 'string') return true;
  const u = url.trim().toLowerCase();
  if (!u) return true;
  for (const stockId of GENERIC_STOCK_AVATAR_IDS) {
    if (u.includes(stockId)) return true;
  }
  return false;
}

/**
 * Retorna um gradiente determinístico atraente baseado no nome do usuário para o avatar de iniciais
 */
export function getAvatarGradient(name = '') {
  const gradients = [
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-violet-600 to-purple-600',
    'from-amber-600 to-orange-600',
    'from-rose-600 to-pink-600',
    'from-cyan-600 to-blue-600',
    'from-fuchsia-600 to-pink-600',
    'from-teal-600 to-emerald-700'
  ];
  let hash = 0;
  const str = String(name || 'U');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * Sanitiza avatares de uma thread de conversa, removendo referências a fotos genéricas
 */
export function sanitizeThreadAvatars(thread) {
  if (!thread) return thread;
  const copy = { ...thread };
  if (copy.participantAvatars && typeof copy.participantAvatars === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(copy.participantAvatars)) {
      cleaned[k] = isGenericPlaceholderAvatar(v) ? '' : v;
    }
    copy.participantAvatars = cleaned;
  }
  if (copy.participantAvatar && isGenericPlaceholderAvatar(copy.participantAvatar)) {
    copy.participantAvatar = '';
  }
  if (Array.isArray(copy.messages)) {
    copy.messages = copy.messages.map(m => {
      if (m.senderAvatar && isGenericPlaceholderAvatar(m.senderAvatar)) {
        return { ...m, senderAvatar: '' };
      }
      return m;
    });
  }
  return copy;
}

/**
 * Resolve o nome de exibição para qualquer perfil de usuário
 * Suporta Empresas (company, nomeFantasia, razaoSocial), Freelancers, Candidatos, Professores e Admins
 */
export function resolveDisplayName(user) {
  if (!user) return 'Usuário Conectado';
  if (typeof user === 'string') return user.trim();
  const name =
    user.company ||
    user.nomeFantasia ||
    user.razaoSocial ||
    user.name ||
    user.displayName ||
    user.nome ||
    user.contactName ||
    (user.email ? user.email.split('@')[0] : 'Usuário Conectado');
  return String(name).trim();
}

/**
 * Resolve a imagem de avatar para qualquer perfil de usuário
 */
export function resolveAvatar(user) {
  if (!user || typeof user === 'string') return '';
  const raw = user.logo || user.avatar || user.photoURL || user.foto || '';
  if (isGenericPlaceholderAvatar(raw)) return '';
  return raw;
}

/**
 * Resolve o papel amigável formatado (Empresa, Prestador de Serviço, Aluno/Candidato, Docente, Administrador)
 */
export function resolveUserRole(user) {
  if (!user) return 'Usuário Conectado';
  const rawRole = (typeof user === 'object' ? user.role : user) || '';
  const r = String(rawRole).toLowerCase().trim();

  if (r === 'empresa' || r === 'company') return 'Empresa';
  if (r === 'freelancer' || r === 'prestador' || r === 'talent') return 'Prestador de Serviço';
  if (r === 'professor' || r === 'teacher' || r === 'docente') return 'Docente / Professor';
  if (r === 'admin' || r === 'administrador') return 'Administrador';
  return 'Aluno / Candidato';
}

/**
 * Helper para verificar correspondência de e-mail entre participantes (case-insensitive)
 */
export function matchesUserEmail(participantEmail, userEmail) {
  if (!participantEmail || !userEmail) return false;
  return participantEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
}

/**
 * Compara se dois usuários são a mesma pessoa (por UID ou E-mail)
 */
export function isSameUser(userA, userB) {
  if (!userA || !userB) return false;
  if (userA.uid && userB.uid && String(userA.uid) === String(userB.uid)) return true;
  if (userA.id && userB.id && String(userA.id) === String(userB.id)) return true;
  if (userA.uid && userB.id && String(userA.uid) === String(userB.id)) return true;
  if (userA.id && userB.uid && String(userA.id) === String(userB.uid)) return true;
  if (userA.email && userB.email && userA.email.toLowerCase().trim() === userB.email.toLowerCase().trim()) return true;
  return false;
}

/**
 * Extrai o timestamp numérico exato de uma mensagem, com múltiplos fallbacks defensivos
 * (Firestore Timestamp, objeto serializado, número millis, ISO string, timestamp formatado ou ID com timestamp).
 * NUNCA retorna NaN.
 */
export function getMessageTime(m) {
  if (!m) return 0;
  if (typeof m.createdAt === 'number' && !isNaN(m.createdAt) && m.createdAt > 0) {
    return m.createdAt;
  }
  if (m.createdAt && typeof m.createdAt.toMillis === 'function') {
    return m.createdAt.toMillis();
  }
  if (m.createdAt && typeof m.createdAt.seconds === 'number') {
    return m.createdAt.seconds * 1000 + Math.round((m.createdAt.nanoseconds || 0) / 1000000);
  }
  if (typeof m.createdAt === 'string') {
    const parsed = Date.parse(m.createdAt);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (m.timestamp && typeof m.timestamp === 'string') {
    const parts = m.timestamp.split(' - ');
    if (parts.length === 2) {
      const dateParts = parts[0].split('/');
      const timeParts = parts[1].split(':');
      if (dateParts.length === 3 && timeParts.length >= 2) {
        const d = parseInt(dateParts[0], 10);
        const mo = parseInt(dateParts[1], 10) - 1;
        const y = parseInt(dateParts[2], 10);
        const h = parseInt(timeParts[0], 10);
        const mi = parseInt(timeParts[1], 10);
        const dt = new Date(y, mo, d, h, mi);
        if (!isNaN(dt.getTime())) return dt.getTime();
      }
    }
  }
  if (typeof m.id === 'string' && m.id.startsWith('m_')) {
    const segs = m.id.split('_');
    const ts = parseInt(segs[1], 10);
    if (!isNaN(ts) && ts > 0) return ts;
  }
  if (typeof m.clientMsgId === 'string' && m.clientMsgId.startsWith('m_')) {
    const segs = m.clientMsgId.split('_');
    const ts = parseInt(segs[1], 10);
    if (!isNaN(ts) && ts > 0) return ts;
  }
  return 0;
}

/**
 * Identifica se duas instâncias representam a mesma mensagem lógica (id local vs id Firestore vs mesmo texto/remetente/horário)
 */
export function isSameChatMessage(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.clientMsgId && b.clientMsgId && a.clientMsgId === b.clientMsgId) return true;
  if (a.clientMsgId && b.id && a.clientMsgId === b.id) return true;
  if (a.id && b.clientMsgId && a.id === b.clientMsgId) return true;

  const sameSender =
    (a.senderEmail && b.senderEmail && a.senderEmail.toLowerCase().trim() === b.senderEmail.toLowerCase().trim()) ||
    (a.senderId && b.senderId && a.senderId === b.senderId);
  const sameText = String(a.text || '').trim() === String(b.text || '').trim();

  if (sameSender && sameText) {
    if (a.timestamp && b.timestamp && a.timestamp === b.timestamp) return true;
    const timeA = getMessageTime(a);
    const timeB = getMessageTime(b);
    if (timeA > 0 && timeB > 0 && Math.abs(timeA - timeB) < 60000) return true;
  }

  return false;
}

// ─── VALIDAÇÃO RIGOROSA DE MENSAGENS (ANTI-PROFANIDADE E REGRAS) ─────────

/**
 * Valida o conteúdo da mensagem antes de enviar:
 * 1. Não pode ser vazia ou apenas espaços em branco.
 * 2. Limite razoável de caracteres (2.500 máx).
 * 3. Bloqueia termos ofensivos, agressivos, palavrões e discursos inadequados.
 */
export function validateChatMessage(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'A mensagem não pode estar vazia.' };
  }
  const clean = text.trim();
  if (clean.length === 0) {
    return { valid: false, error: 'A mensagem não pode conter apenas espaços em branco.' };
  }
  if (clean.length > 2500) {
    return { valid: false, error: 'A mensagem é muito longa (limite máximo de 2.500 caracteres por envio).' };
  }

  // Análise anti-profanidade e termos ofensivos
  const profanityCheck = detectProfanity(clean);
  if (profanityCheck && profanityCheck.hasProfanity) {
    const termInfo = profanityCheck.matchedWord ? ` (termo detectado: "${profanityCheck.matchedWord}")` : '';
    return {
      valid: false,
      hasProfanity: true,
      matchedWord: profanityCheck.matchedWord || '',
      error: `Mensagem bloqueada: contém linguagem imprópria ou termos ofensivos${termInfo}. Mantenha o respeito e o profissionalismo na plataforma Ivaí Conecta.`
    };
  }

  return { valid: true, cleanText: clean };
}

// ─── GERENCIAMENTO DE LEITURA E NOTIFICAÇÕES ────────────────────────────

export function getDeletedThreads() {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_DELETED_THREADS) || '[]');
  } catch {
    return [];
  }
}

export function getReadTimestamps() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHAT_READ_TIMESTAMPS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveReadTimestamps(map) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHAT_READ_TIMESTAMPS, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('ivai_chat_updated'));
  }
}

/**
 * Marca uma conversa como lida pelo usuário atual
 */
export function markThreadAsRead(threadId, userEmail) {
  if (!threadId || !userEmail) return;
  const cleanEmail = userEmail.toLowerCase().trim();
  const key = `${threadId}_${cleanEmail}`;
  const map = getReadTimestamps();
  map[key] = Date.now();
  saveReadTimestamps(map);
}

/**
 * Calcula a quantidade de mensagens não lidas em uma conversa específica
 */
export function getThreadUnreadCount(thread, userEmail) {
  if (!thread || !userEmail) return 0;
  const cleanEmail = userEmail.toLowerCase().trim();
  const key = `${thread.id}_${cleanEmail}`;
  const map = getReadTimestamps();
  const lastRead = map[key] || 0;

  const messages = thread.messages || [];
  let unread = 0;
  for (const m of messages) {
    const isFromOther = m.senderEmail && !matchesUserEmail(m.senderEmail, cleanEmail);
    const msgTime = getMessageTime(m);
    if (isFromOther && msgTime > lastRead) {
      unread++;
    }
  }
  return unread;
}

/**
 * Retorna o total geral de mensagens não lidas do usuário
 */
export function getTotalUnreadMessagesCount(userEmail) {
  if (!userEmail) return 0;
  const cleanEmail = userEmail.toLowerCase().trim();
  const allThreads = getChatThreads();
  const myThreads = allThreads.filter(t =>
    t.participants?.some(p => matchesUserEmail(p, cleanEmail))
  );

  let total = 0;
  for (const t of myThreads) {
    total += getThreadUnreadCount(t, cleanEmail);
  }
  return total;
}

/**
 * Escuta em tempo real o contador de mensagens não lidas
 */
export function subscribeToUnreadCount(userEmail, callback) {
  if (!userEmail) {
    callback(0);
    return () => {};
  }

  const cleanEmail = userEmail.toLowerCase().trim();

  const emit = () => {
    const count = getTotalUnreadMessagesCount(cleanEmail);
    callback(count);
  };

  emit();

  const handleUpdate = () => emit();
  window.addEventListener('storage', handleUpdate);
  window.addEventListener('ivai_chat_updated', handleUpdate);

  if (chatChannel) {
    chatChannel.addEventListener('message', handleUpdate);
  }

  const unsubThreads = subscribeToUserThreads(cleanEmail, () => {
    emit();
  });

  return () => {
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('ivai_chat_updated', handleUpdate);
    if (chatChannel) {
      chatChannel.removeEventListener('message', handleUpdate);
    }
    unsubThreads();
  };
}

// ─── PERSISTÊNCIA E SINCRONIZAÇÃO DE THREADS ────────────────────────────

export function getChatThreads() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_CHAT_THREADS);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeThreadAvatars);
      }
    } catch { }
  }
  return [];
}

export function saveChatThreads(threads) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(threads));
    window.dispatchEvent(new CustomEvent('ivai_chat_updated'));
  }
}

// Sincronização via servidor local do Vite apenas em ambiente de desenvolvimento
async function syncWithLocalServer() {
  if (!import.meta.env.DEV) return;
  try {
    const res = await fetch('/api/chat/sync');
    if (!res.ok) return;
    const serverThreads = await res.json();
    if (serverThreads && Array.isArray(serverThreads)) {
      const local = getChatThreads();
      const merged = [...local];
      let hasChanges = false;

      serverThreads.forEach(st => {
        const idx = merged.findIndex(m => m.id === st.id);
        if (idx === -1) {
          merged.push(st);
          hasChanges = true;
        } else {
          const localMsgs = (merged[idx].messages || []).map(m => ({ ...m, createdAt: getMessageTime(m) }));
          const remoteMsgs = (st.messages || []).map(m => ({ ...m, createdAt: getMessageTime(m) }));
          let addedNew = false;
          remoteMsgs.forEach(rm => {
            if (!localMsgs.some(lm => isSameChatMessage(lm, rm))) {
              localMsgs.push(rm);
              addedNew = true;
            }
          });
          if (addedNew) {
            localMsgs.sort((a, b) => getMessageTime(a) - getMessageTime(b));
            merged[idx].messages = localMsgs;
            merged[idx].lastMessage = st.lastMessage || localMsgs[localMsgs.length - 1]?.text;
            merged[idx].lastMessageAt = st.lastMessageAt || localMsgs[localMsgs.length - 1]?.timestamp;
            merged[idx].updatedAt = Date.now();
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        saveChatThreads(merged);
      }
    }
  } catch { }
}

/**
 * Exclui permanentemente uma conversa de todas as abas e janelas
 */
export async function deleteChatThread(threadId) {
  if (!threadId) return [];

  // 1. Remove da lista local
  const all = getChatThreads().filter(t => t.id !== threadId);
  saveChatThreads(all);

  // 2. Registra na lista de excluídos
  const deleted = getDeletedThreads();
  if (!deleted.includes(threadId)) {
    deleted.push(threadId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DELETED_THREADS, JSON.stringify(deleted));
    }
  }

  // 3. Remove do servidor local (apenas em dev)
  if (import.meta.env.DEV) {
    try {
      fetch('/api/chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_THREAD', threadId })
      }).catch(() => { });
    } catch { }
  }

  // 4. Emite no BroadcastChannel
  if (chatChannel) {
    try {
      chatChannel.postMessage({ type: 'DELETE_THREAD', threadId });
    } catch { }
  }

  // 5. Remove do Firestore em background
  try {
    deleteDoc(doc(db, 'chats', threadId)).catch(() => { });
  } catch { }

  return all;
}

// ─── 1. ASSINATURA EM TEMPO REAL: THREADS DO USUÁRIO ────────────────────

export function subscribeToUserThreads(userEmail, callback) {
  if (!userEmail) return () => { };
  const cleanEmail = userEmail.toLowerCase().trim();

  const emitLocal = () => {
    const allThreads = getChatThreads();
    const myThreads = allThreads.filter(t =>
      t.participants?.some(p => matchesUserEmail(p, cleanEmail)) &&
      !(t.participants?.length === 2 && matchesUserEmail(t.participants[0], t.participants[1]))
    );
    myThreads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    callback(myThreads);
  };

  // Disparo imediato (0ms de latência)
  emitLocal();

  const handleLocalUpdate = () => emitLocal();
  window.addEventListener('storage', handleLocalUpdate);
  window.addEventListener('ivai_chat_updated', handleLocalUpdate);

  if (chatChannel) {
    chatChannel.addEventListener('message', handleLocalUpdate);
  }

  // Polling em dev para suporte a Guia Anônima
  let syncTimer = null;
  if (import.meta.env.DEV) {
    syncTimer = setInterval(async () => {
      await syncWithLocalServer();
      emitLocal();
    }, 1500);
  }

  // Listener oficial em tempo real com o Cloud Firestore
  let unsubscribeFirestore = () => { };
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', cleanEmail)
    );
    unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remoteChats = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now())
          };
        });

        const local = getChatThreads();
        const merged = [...local];
        let changed = false;

        remoteChats.forEach(rc => {
          const sanitizedRc = sanitizeThreadAvatars(rc);
          const idx = merged.findIndex(m => m.id === sanitizedRc.id);
          if (idx === -1) {
            merged.push(sanitizedRc);
            changed = true;
          } else {
            merged[idx] = {
              ...merged[idx],
              ...sanitizedRc,
              messages: merged[idx].messages || sanitizedRc.messages || []
            };
            changed = true;
          }
        });

        if (changed) {
          saveChatThreads(merged);
          emitLocal();
        }
      }
    }, (err) => {
      console.warn('[Chat] Erro no listener do Firestore para conversas:', err);
    });
  } catch (err) {
    console.warn('[Chat] Falha ao configurar listener de conversas:', err);
  }

  return () => {
    if (syncTimer) clearInterval(syncTimer);
    window.removeEventListener('storage', handleLocalUpdate);
    window.removeEventListener('ivai_chat_updated', handleLocalUpdate);
    if (chatChannel) {
      chatChannel.removeEventListener('message', handleLocalUpdate);
    }
    unsubscribeFirestore();
  };
}

// ─── 2. ASSINATURA EM TEMPO REAL: MENSAGENS DE UM CHAT ESPECÍFICO ───────

export function subscribeToMessages(chatId, callback, currentUserEmail = '') {
  if (!chatId) return () => { };

  const cleanEmail = currentUserEmail ? currentUserEmail.toLowerCase().trim() : '';

  const emitLocal = () => {
    const all = getChatThreads();
    const thread = all.find(t => t.id === chatId);
    if (!thread) {
      callback([]);
      return;
    }

    if (cleanEmail && thread.participants && !thread.participants.some(p => matchesUserEmail(p, cleanEmail))) {
      console.warn('[Chat] Acesso negado: usuário não é participante desta conversa.');
      callback([]);
      return;
    }

    const msgs = (thread.messages || []).map(m => ({
      ...m,
      createdAt: getMessageTime(m)
    }));
    msgs.sort((a, b) => getMessageTime(a) - getMessageTime(b));
    callback(msgs);
  };

  emitLocal();

  const handleLocalUpdate = (e) => {
    if (!e?.data || e.data?.chatId === chatId) {
      emitLocal();
    }
  };

  window.addEventListener('storage', emitLocal);
  window.addEventListener('ivai_chat_updated', emitLocal);
  if (chatChannel) {
    chatChannel.addEventListener('message', handleLocalUpdate);
  }

  // Listener em tempo real do Firestore para subcoleção de mensagens
  let unsubscribeFirestoreMsgs = () => { };
  try {
    const msgsQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    unsubscribeFirestoreMsgs = onSnapshot(msgsQuery, (snapshot) => {
      const firestoreMsgs = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          clientMsgId: d.clientMsgId || d.id || docSnap.id,
          createdAt: getMessageTime(d) || Date.now()
        };
      });

      const allThreads = getChatThreads();
      let threadIndex = allThreads.findIndex(t => t.id === chatId);

      let currentThread = threadIndex !== -1 ? allThreads[threadIndex] : null;
      if (!currentThread) {
        currentThread = {
          id: chatId,
          participants: [cleanEmail].filter(Boolean),
          lastMessage: firestoreMsgs[firestoreMsgs.length - 1]?.text || 'Nova mensagem',
          lastMessageAt: firestoreMsgs[firestoreMsgs.length - 1]?.timestamp || 'Agora',
          updatedAt: Date.now(),
          messages: []
        };
        allThreads.unshift(currentThread);
        threadIndex = 0;
      }

      if (cleanEmail && currentThread.participants && !currentThread.participants.some(p => matchesUserEmail(p, cleanEmail))) {
        return;
      }

      // Preserva mensagens locais que ainda estão sendo enviadas (não chegaram ao Firestore ainda)
      const existingMsgs = (currentThread.messages || []).map(m => ({ ...m, createdAt: getMessageTime(m) }));
      const pendingLocal = existingMsgs.filter(lm => !firestoreMsgs.some(fm => isSameChatMessage(lm, fm)));

      // Combina Firestore (fonte da verdade) com pendentes locais e ordena rigorosamente
      const unified = [...firestoreMsgs, ...pendingLocal];
      unified.sort((a, b) => getMessageTime(a) - getMessageTime(b));

      // Atualiza thread no storage local
      allThreads[threadIndex].messages = unified;
      if (unified.length > 0) {
        const last = unified[unified.length - 1];
        allThreads[threadIndex].lastMessage = last.text || allThreads[threadIndex].lastMessage;
        allThreads[threadIndex].lastMessageAt = last.timestamp || allThreads[threadIndex].lastMessageAt;
      }
      allThreads[threadIndex].updatedAt = Date.now();
      saveChatThreads(allThreads);

      // Emite lista perfeitamente ordenada e sincronizada para o componente
      callback(unified);
    }, (err) => {
      console.warn('[Chat] Erro no listener do Firestore para mensagens:', err);
    });
  } catch (err) {
    console.warn('[Chat] Falha ao configurar listener de mensagens:', err);
  }

  return () => {
    window.removeEventListener('storage', emitLocal);
    window.removeEventListener('ivai_chat_updated', emitLocal);
    if (chatChannel) {
      chatChannel.removeEventListener('message', handleLocalUpdate);
    }
    unsubscribeFirestoreMsgs();
  };
}

// ─── 3. ENVIO DE MENSAGEM COM VALIDAÇÃO ANTI-PROFANIDADE E PAPÉIS ────────

export async function sendChatMessage(chatId, senderUser, text) {
  if (!chatId || !senderUser) {
    throw new Error('Identificação da conversa ou usuário remetente inválidos.');
  }

  // Validação estrita da mensagem
  const validation = validateChatMessage(text);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.hasProfanity = Boolean(validation.hasProfanity);
    error.matchedWord = validation.matchedWord || null;
    throw error;
  }

  const cleanText = validation.cleanText;
  const now = new Date();
  const timeFormatted = `${now.toLocaleDateString('pt-BR')} - ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const senderEmail = (senderUser.email || '').toLowerCase().trim();
  const senderName = resolveDisplayName(senderUser);
  const senderAvatar = resolveAvatar(senderUser);
  const senderRole = resolveUserRole(senderUser);
  const senderUid = senderUser.uid || senderUser.id || 'user';

  const msgId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const messageData = {
    id: msgId,
    clientMsgId: msgId,
    senderId: senderUid,
    sender: senderName,
    senderName,
    senderEmail,
    senderAvatar,
    senderRole,
    text: cleanText,
    timestamp: timeFormatted,
    createdAt: Date.now()
  };

  // 1. Grava no LocalStorage imediatamente (0ms de latência percebida)
  const allThreads = getChatThreads();
  const threadIndex = allThreads.findIndex(t => t.id === chatId);
  let currentThread = null;
  if (threadIndex !== -1) {
    currentThread = allThreads[threadIndex];
    currentThread.messages = [...(currentThread.messages || []), messageData];
    currentThread.lastMessage = cleanText;
    currentThread.lastMessageAt = timeFormatted;
    currentThread.lastSenderEmail = senderEmail;
    currentThread.lastSenderName = senderName;
    currentThread.updatedAt = Date.now();
    saveChatThreads(allThreads);
  }

  // 2. Transmite no servidor local (apenas em dev)
  if (import.meta.env.DEV) {
    try {
      fetch('/api/chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MESSAGE',
          chatId,
          message: messageData,
          thread: currentThread
        })
      }).catch(() => { });
    } catch { }
  }

  // 3. Transmite no canal de abas locais
  if (chatChannel) {
    try {
      chatChannel.postMessage({
        type: 'NEW_MESSAGE',
        chatId,
        message: messageData
      });
    } catch { }
  }

  // 4. Sincroniza no Firestore em tempo real
  try {
    const messagesCol = collection(db, 'chats', chatId, 'messages');

    addDoc(messagesCol, {
      ...messageData,
      clientMsgId: msgId,
      createdAt: serverTimestamp()
    }).catch(err => {
      console.warn('[Chat] Falha na persistência da mensagem no Firestore:', err);
    });

    const threadUpdate = {
      lastMessage: cleanText,
      lastMessageAt: timeFormatted,
      lastSenderEmail: senderEmail,
      lastSenderName: senderName,
      updatedAt: serverTimestamp()
    };

    if (currentThread) {
      if (currentThread.participants) threadUpdate.participants = currentThread.participants;
      if (currentThread.participantUids) threadUpdate.participantUids = currentThread.participantUids;
      if (currentThread.participantNames) threadUpdate.participantNames = currentThread.participantNames;
      if (currentThread.participantAvatars) threadUpdate.participantAvatars = currentThread.participantAvatars;
      if (currentThread.participantRoles) threadUpdate.participantRoles = currentThread.participantRoles;
      if (currentThread.contextTitle) threadUpdate.contextTitle = currentThread.contextTitle;
    }

    setDoc(threadRef, threadUpdate, { merge: true }).catch(err => {
      console.warn('[Chat] Falha ao atualizar dados da thread no Firestore:', err);
    });
  } catch (err) {
    console.warn('[Chat] Erro inesperado ao gravar no Firestore:', err);
  }

  return messageData;
}

// ─── 4. CRIAÇÃO / RECUPERAÇÃO DETERMINÍSTICA DE CHAT ────────────────────

export async function getOrCreateChat(currentUser, targetUser, contextTitle = 'Contato Direto') {
  if (!currentUser || !targetUser) {
    throw new Error('Usuários inválidos para iniciar conversa.');
  }

  const user1Email = (currentUser?.email || '').toLowerCase().trim();
  const currentUid = currentUser?.uid || currentUser?.id || '';
  const targetUid = targetUser?.uid || targetUser?.id || '';
  let user2Email = (targetUser?.email || '').toLowerCase().trim();

  // Se o destinatário não possui e-mail no objeto, busca o e-mail real pelo UID no Firestore
  if ((!user2Email || !user2Email.includes('@')) && targetUid) {
    try {
      const userSnap = await getDoc(doc(db, 'users', String(targetUid)));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        user2Email = (uData.email || uData.studentEmail || '').toLowerCase().trim();
        targetUser.name = resolveDisplayName(uData) || targetUser.name;
        targetUser.company = uData.company || uData.nomeFantasia || targetUser.company;
        targetUser.avatar = resolveAvatar(uData) || targetUser.avatar;
        targetUser.role = uData.role || targetUser.role;
      }
    } catch (err) {
      console.warn('[Chat] Não foi possível carregar usuário pelo UID:', err);
    }
  }

  if (!user1Email || !user1Email.includes('@')) {
    throw new Error('Você precisa estar autenticado com um e-mail válido para usar o chat.');
  }

  if (!user2Email || !user2Email.includes('@')) {
    throw new Error('O usuário selecionado não possui um canal de mensagens configurado.');
  }

  // Bloqueio rigoroso: ninguém (empresa, freelancer ou aluno) pode criar chat consigo mesmo
  if (isSameUser(currentUser, targetUser) || user1Email === user2Email) {
    console.warn('[Chat] Tentativa de iniciar conversa consigo mesmo bloqueada.');
    throw new Error('Você não pode iniciar uma conversa consigo mesmo.');
  }

  // ID determinístico único
  const sortedEmails = [user1Email, user2Email].sort();
  const chatId = `chat_${sortedEmails[0].replace(/[@.]/g, '_')}_${sortedEmails[1].replace(/[@.]/g, '_')}`;
  const participantUids = [currentUid, targetUid].filter(Boolean);

  const senderName = resolveDisplayName(currentUser);
  const targetName = resolveDisplayName(targetUser);
  const senderAvatar = resolveAvatar(currentUser);
  const targetAvatar = resolveAvatar(targetUser);
  const senderRole = resolveUserRole(currentUser);
  const targetRole = resolveUserRole(targetUser);

  const allThreads = getChatThreads();
  let thread = allThreads.find(t => t.id === chatId);

  if (!thread) {
    thread = {
      id: chatId,
      participants: [user1Email, user2Email],
      participantUids,
      participantNames: {
        [user1Email]: senderName,
        [user2Email]: targetName
      },
      participantAvatars: {
        [user1Email]: senderAvatar,
        [user2Email]: targetAvatar
      },
      participantRoles: {
        [user1Email]: senderRole,
        [user2Email]: targetRole
      },
      contextTitle,
      lastMessage: 'Conversa iniciada',
      lastMessageAt: 'Agora',
      updatedAt: Date.now(),
      messages: []
    };
    allThreads.unshift(thread);
    saveChatThreads(allThreads);
  } else {
    // Atualiza nomes, papéis e contexto caso tenham mudado
    thread.participantNames = {
      ...thread.participantNames,
      [user1Email]: senderName,
      [user2Email]: targetName
    };
    thread.participantRoles = {
      ...thread.participantRoles,
      [user1Email]: senderRole,
      [user2Email]: targetRole
    };
    if (participantUids.length > 0) {
      thread.participantUids = Array.from(new Set([...(thread.participantUids || []), ...participantUids]));
    }
    if (contextTitle && thread.contextTitle !== contextTitle) {
      thread.contextTitle = contextTitle;
    }
    saveChatThreads(allThreads);
  }

  // 1. Salva no Firestore para que o outro usuário encontre na nuvem
  try {
    setDoc(doc(db, 'chats', chatId), {
      id: chatId,
      participants: thread.participants,
      participantUids: thread.participantUids || participantUids,
      participantNames: thread.participantNames,
      participantAvatars: thread.participantAvatars,
      participantRoles: thread.participantRoles,
      contextTitle: thread.contextTitle,
      lastMessage: thread.lastMessage,
      lastMessageAt: thread.lastMessageAt,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(err => {
      console.warn('[Chat] Erro ao sincronizar conversa com o Firestore:', err);
    });
  } catch { }

  // 2. Sincroniza no servidor local (em dev)
  if (import.meta.env.DEV) {
    try {
      fetch('/api/chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_ALL', threads: allThreads })
      }).catch(() => { });
    } catch { }
  }

  if (chatChannel) {
    try {
      chatChannel.postMessage({ type: 'THREAD_UPDATED', chatId });
    } catch { }
  }

  return chatId;
}
