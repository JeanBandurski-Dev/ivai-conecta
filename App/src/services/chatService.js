// Chat & Direct Messaging Service for Ivaí Conecta
// Arquitetura Híbrida: LocalStorage (0ms) + BroadcastChannel + Firestore Realtime

import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export const STORAGE_KEY_CHAT_THREADS = 'ivai_conecta_chat_threads';
export const STORAGE_KEY_DELETED_THREADS = 'ivai_conecta_deleted_threads';
export const STORAGE_KEY_CHAT_READ_TIMESTAMPS = 'ivai_conecta_chat_read_timestamps';

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

// Canal de comunicação instantâneo (0ms) entre abas normais no mesmo navegador
const chatChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ivai_conecta_chat_bus') : null;

// Helper para verificar correspondência de e-mail entre participantes
export function matchesUserEmail(participantEmail, userEmail) {
  if (!participantEmail || !userEmail) return false;
  const p = participantEmail.toLowerCase().trim();
  const u = userEmail.toLowerCase().trim();
  return p === u;
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
    const msgTime = m.createdAt || 0;
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

  // Disparo inicial imediato
  emit();

  const handleUpdate = () => emit();
  window.addEventListener('storage', handleUpdate);
  window.addEventListener('ivai_chat_updated', handleUpdate);

  if (chatChannel) {
    chatChannel.addEventListener('message', handleUpdate);
  }

  // Também assina a lista de conversas para atualizar quando chegarem mensagens remotas
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

export function isSameUser(userA, userB) {
  if (!userA || !userB) return false;
  if (userA.uid && userB.uid && String(userA.uid) === String(userB.uid)) return true;
  if (userA.id && userB.id && String(userA.id) === String(userB.id)) return true;
  if (userA.uid && userB.id && String(userA.uid) === String(userB.id)) return true;
  if (userA.id && userB.uid && String(userA.id) === String(userB.uid)) return true;
  if (userA.email && userB.email && userA.email.toLowerCase().trim() === userB.email.toLowerCase().trim()) return true;
  
  return false;
}

export function getChatThreads() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_CHAT_THREADS);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
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

// Sincronização via servidor local do Vite apenas em ambiente de desenvolvimento local
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
          const localMsgs = merged[idx].messages || [];
          const remoteMsgs = st.messages || [];
          let addedNew = false;
          remoteMsgs.forEach(rm => {
            if (!localMsgs.some(lm => lm.id === rm.id || (lm.text === rm.text && lm.timestamp === rm.timestamp))) {
              localMsgs.push(rm);
              addedNew = true;
            }
          });
          if (addedNew) {
            localMsgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
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

// Exclui permanentemente uma conversa de todas as abas e janelas
export async function deleteChatThread(threadId) {
  if (!threadId) return;

  // 1. Remove da lista local de conversas
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

// 1. Escutar todas as conversas do usuário (Híbrido: LocalStorage + Broadcast + Firestore)
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

  // Dispara imediatamente para a tela abrir em 0 milissegundos
  emitLocal();

  // Escuta atualizações locais entre abas
  const handleLocalUpdate = () => emitLocal();
  window.addEventListener('storage', handleLocalUpdate);
  window.addEventListener('ivai_chat_updated', handleLocalUpdate);

  if (chatChannel) {
    chatChannel.addEventListener('message', handleLocalUpdate);
  }

  // Polling em dev para conectar com Guia Anônima
  let syncTimer = null;
  if (import.meta.env.DEV) {
    syncTimer = setInterval(async () => {
      await syncWithLocalServer();
      emitLocal();
    }, 1500);
  }

  // Sincronização em tempo real com o Firestore
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
          const idx = merged.findIndex(m => m.id === rc.id);
          if (idx === -1) {
            merged.push(rc);
            changed = true;
          } else {
            merged[idx] = { ...merged[idx], ...rc, messages: merged[idx].messages || rc.messages || [] };
            changed = true;
          }
        });

        if (changed) {
          saveChatThreads(merged);
          emitLocal();
        }
      }
    }, () => { });
  } catch { }

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

// 2. Escutar as mensagens de uma conversa aberta em TEMPO REAL (Firestore + Local)
export function subscribeToMessages(chatId, callback) {
  if (!chatId) return () => { };

  const emitLocal = () => {
    const all = getChatThreads();
    const thread = all.find(t => t.id === chatId);
    callback(thread?.messages || []);
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
      if (!snapshot.empty) {
        const firestoreMsgs = snapshot.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
            createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.createdAt || Date.now())
          };
        });

        const allThreads = getChatThreads();
        const threadIndex = allThreads.findIndex(t => t.id === chatId);
        if (threadIndex !== -1) {
          const existingMsgs = allThreads[threadIndex].messages || [];
          const merged = [...existingMsgs];
          let added = false;

          firestoreMsgs.forEach(fm => {
            if (!merged.some(m => m.id === fm.id || (m.text === fm.text && m.timestamp === fm.timestamp))) {
              merged.push(fm);
              added = true;
            }
          });

          if (added) {
            merged.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            allThreads[threadIndex].messages = merged;
            allThreads[threadIndex].lastMessage = merged[merged.length - 1]?.text || allThreads[threadIndex].lastMessage;
            allThreads[threadIndex].lastMessageAt = merged[merged.length - 1]?.timestamp || allThreads[threadIndex].lastMessageAt;
            saveChatThreads(allThreads);
            callback(merged);
          }
        }
      }
    }, () => { });
  } catch { }

  return () => {
    window.removeEventListener('storage', emitLocal);
    window.removeEventListener('ivai_chat_updated', emitLocal);
    if (chatChannel) {
      chatChannel.removeEventListener('message', handleLocalUpdate);
    }
    unsubscribeFirestoreMsgs();
  };
}

// 3. Enviar uma mensagem
export async function sendChatMessage(chatId, senderUser, text) {
  if (!chatId || !text.trim() || !senderUser) return null;

  const cleanText = text.trim();
  const now = new Date();
  const timeFormatted = `${now.toLocaleDateString('pt-BR')} - ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const messageData = {
    id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    senderId: senderUser.uid || senderUser.id || 'user',
    sender: senderUser.name,
    senderName: senderUser.name,
    senderEmail: senderUser.email.toLowerCase().trim(),
    senderAvatar: senderUser.avatar || '',
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
    currentThread.lastSenderEmail = messageData.senderEmail;
    currentThread.updatedAt = Date.now();
    saveChatThreads(allThreads);
  }

  // 2. Transmite no servidor local (apenas se estiver rodando em dev)
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

  // 4. Sincroniza em segundo plano no Firestore
  try {
    addDoc(collection(db, 'chats', chatId, 'messages'), {
      ...messageData,
      createdAt: serverTimestamp()
    }).catch(() => { });

    setDoc(doc(db, 'chats', chatId), {
      lastMessage: cleanText,
      lastMessageAt: timeFormatted,
      lastSenderEmail: messageData.senderEmail,
      updatedAt: serverTimestamp(),
      ...(currentThread ? {
        participants: currentThread.participants,
        participantNames: currentThread.participantNames,
        participantAvatars: currentThread.participantAvatars,
        participantRoles: currentThread.participantRoles,
        contextTitle: currentThread.contextTitle
      } : {})
    }, { merge: true }).catch(() => { });
  } catch { }

  return messageData;
}

export async function getOrCreateChat(currentUser, targetUser, contextTitle = 'Contato Direto') {
  if (!currentUser || !targetUser) {
    throw new Error('Usuários inválidos para iniciar conversa.');
  }

  const user1Email = (currentUser?.email || '').toLowerCase().trim();
  const user2Email = (targetUser?.email || '').toLowerCase().trim();

  // Bloqueio rigoroso: ninguém (empresa, freelancer ou aluno) pode criar chat consigo mesmo
  if (isSameUser(currentUser, targetUser) || (user1Email && user2Email && user1Email === user2Email)) {
    console.warn('[Chat] Tentativa de iniciar conversa consigo mesmo bloqueada.');
    throw new Error('Você não pode iniciar uma conversa consigo mesmo.');
  }

  // Cria o ID determinístico único
  const sortedEmails = [user1Email, user2Email].sort();
  const chatId = `chat_${sortedEmails[0].replace(/[@.]/g, '_')}_${sortedEmails[1].replace(/[@.]/g, '_')}`;

  const allThreads = getChatThreads();
  let thread = allThreads.find(t => t.id === chatId);

  if (!thread) {
    thread = {
      id: chatId,
      participants: [user1Email, user2Email],
      participantNames: {
        [user1Email]: currentUser.name,
        [user2Email]: targetUser.name
      },
      participantAvatars: {
        [user1Email]: currentUser.avatar || '',
        [user2Email]: targetUser.avatar || ''
      },
      participantRoles: {
        [user1Email]: currentUser.role || 'aluno',
        [user2Email]: targetUser.role || 'empresa'
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
    if (contextTitle && thread.contextTitle !== contextTitle) {
      thread.contextTitle = contextTitle;
      saveChatThreads(allThreads);
    }
  }

  // 1. Salva no Firestore para que o outro usuário encontre na nuvem
  try {
    setDoc(doc(db, 'chats', chatId), {
      id: chatId,
      participants: thread.participants,
      participantNames: thread.participantNames,
      participantAvatars: thread.participantAvatars,
      participantRoles: thread.participantRoles,
      contextTitle: thread.contextTitle,
      lastMessage: thread.lastMessage,
      lastMessageAt: thread.lastMessageAt,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(() => { });
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
