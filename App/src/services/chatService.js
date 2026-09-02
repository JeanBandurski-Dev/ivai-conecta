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

export function getDeletedThreads() {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_DELETED_THREADS) || '[]');
  } catch {
    return [];
  }
}

// Canal de comunicação instantâneo (0ms) entre abas normais no mesmo navegador
const chatChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ivai_conecta_chat_bus') : null;

// Helper para mapear apelidos e aliases de empresas/alunos conhecidos
export function matchesUserEmail(participantEmail, userEmail) {
  if (!participantEmail || !userEmail) return false;
  const p = participantEmail.toLowerCase().trim();
  const u = userEmail.toLowerCase().trim();
  if (p === u) return true;

  // Alias para SimasTurbo (suporta tanto o e-mail real turbosimas@gmail.com quanto simasturbo@ivaiconecta.com.br)
  if (
    (u === 'turbosimas@gmail.com' || u === 'simasturbo@ivaiconecta.com.br') &&
    (p === 'turbosimas@gmail.com' || p === 'simasturbo@ivaiconecta.com.br')
  ) {
    return true;
  }

  // Alias para AlunoTeste (suporta tanto emailaluno@gmail.com quanto alunoteste@ivaiconecta.com.br)
  if (
    (u === 'emailaluno@gmail.com' || u === 'alunoteste@ivaiconecta.com.br') &&
    (p === 'emailaluno@gmail.com' || p === 'alunoteste@ivaiconecta.com.br')
  ) {
    return true;
  }

  return false;
}

export const SEED_CHAT_THREADS = [
  {
    id: 'thread_101',
    participants: ['aluno@ivaiconecta.com.br', 'empresa@ivaiconecta.com.br'],
    participantNames: {
      'aluno@ivaiconecta.com.br': 'Lucas Eduardo Silva',
      'empresa@ivaiconecta.com.br': 'ValeTech Soluções Digitais'
    },
    participantAvatars: {
      'aluno@ivaiconecta.com.br': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      'empresa@ivaiconecta.com.br': 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'
    },
    participantRoles: {
      'aluno@ivaiconecta.com.br': 'aluno',
      'empresa@ivaiconecta.com.br': 'empresa'
    },
    contextTitle: 'Desenvolvedor Front-end Junior',
    lastMessage: 'Excelente! Agendamos sua entrevista técnica para Quinta-feira às 14:00.',
    lastMessageAt: '19/08/2026 - 14:30',
    updatedAt: Date.now() - 3600000,
    messages: [
      { id: 'm1', senderId: 'empresa', sender: 'ValeTech Soluções Digitais', senderName: 'ValeTech Soluções Digitais', senderEmail: 'empresa@ivaiconecta.com.br', text: 'Olá Lucas! Analisamos suas qualificações em React e seu parecer docente do IFPR.', timestamp: '19/08/2026 - 14:15', createdAt: Date.now() - 7200000 },
      { id: 'm2', senderId: 'aluno', sender: 'Lucas Eduardo Silva', senderName: 'Lucas Eduardo Silva', senderEmail: 'aluno@ivaiconecta.com.br', text: 'Olá! Muito obrigado pela oportunidade. Tenho total interesse na vaga híbrida em Ivaiporã.', timestamp: '19/08/2026 - 14:22', createdAt: Date.now() - 5400000 },
      { id: 'm3', senderId: 'empresa', sender: 'ValeTech Soluções Digitais', senderName: 'ValeTech Soluções Digitais', senderEmail: 'empresa@ivaiconecta.com.br', text: 'Excelente! Agendamos sua entrevista técnica para Quinta-feira às 14:00.', timestamp: '19/08/2026 - 14:30', createdAt: Date.now() - 3600000 }
    ]
  },
  {
    id: 'thread_102',
    participants: ['aluno@ivaiconecta.com.br', 'professor@ivaiconecta.com.br'],
    participantNames: {
      'aluno@ivaiconecta.com.br': 'Lucas Eduardo Silva',
      'professor@ivaiconecta.com.br': 'Prof. Dr. Ronan Silva'
    },
    participantAvatars: {
      'aluno@ivaiconecta.com.br': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      'professor@ivaiconecta.com.br': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    },
    participantRoles: {
      'aluno@ivaiconecta.com.br': 'aluno',
      'professor@ivaiconecta.com.br': 'professor'
    },
    contextTitle: 'Parecer Pedagógico - Programação',
    lastMessage: 'Olá Lucas! Recebi sua solicitação e já emiti seu parecer pedagógico verificado.',
    lastMessageAt: '20/08/2026 - 09:10',
    updatedAt: Date.now() - 1800000,
    messages: [
      { id: 'm10', senderId: 'aluno', sender: 'Lucas Eduardo Silva', senderName: 'Lucas Eduardo Silva', senderEmail: 'aluno@ivaiconecta.com.br', text: 'Olá Professor Ronan! Gostaria de solicitar um parecer sobre meu desempenho acadêmico.', timestamp: '20/08/2026 - 08:45', createdAt: Date.now() - 3600000 },
      { id: 'm11', senderId: 'professor', sender: 'Prof. Dr. Ronan Silva', senderName: 'Prof. Dr. Ronan Silva', senderEmail: 'professor@ivaiconecta.com.br', text: 'Olá Lucas! Recebi sua solicitação e já emiti seu parecer pedagógico verificado com selo do IFPR.', timestamp: '20/08/2026 - 09:10', createdAt: Date.now() - 1800000 }
    ]
  }
];

export function getChatThreads() {
  if (typeof localStorage === 'undefined') return SEED_CHAT_THREADS;
  const raw = localStorage.getItem(STORAGE_KEY_CHAT_THREADS);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch { }
  }
  localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(SEED_CHAT_THREADS));
  return SEED_CHAT_THREADS;
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
      t.participants?.some(p => matchesUserEmail(p, cleanEmail))
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
  } catch (e) { }

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
  } catch (err) { }

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

// 4. Iniciar uma nova conversa (ou recuperar existente)
export async function getOrCreateChat(currentUser, targetUser, contextTitle = 'Contato Direto') {
  const user1Email = (currentUser?.email || 'empresa@ivaiconecta.com.br').toLowerCase().trim();
  const user2Email = (targetUser?.email || 'aluno@ivaiconecta.com.br').toLowerCase().trim();

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
