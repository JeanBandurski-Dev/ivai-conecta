// Chat & Direct Messaging Service for Ivaí Conecta (Firestore + Local Storage Sync)
import { db } from '../lib/firebase.js';
import { collection, addDoc, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export const STORAGE_KEY_CHAT_THREADS = 'ivai_conecta_chat_threads';

export const SEED_CHAT_THREADS = [
  {
    id: 'thread_101',
    participantName: 'ValeTech Soluções Digitais',
    participantRole: 'Empresa / Recrutador',
    participantAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150',
    jobTitle: 'Desenvolvedor Front-end Junior',
    lastMessage: 'Excelente! Agendamos sua entrevista técnica para Quinta-feira às 14:00.',
    lastMessageAt: '19/08/2026 - 14:30',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'ValeTech Soluções Digitais', senderEmail: 'empresa@ivaiconecta.com.br', text: 'Olá! Analisamos suas qualificações em React e seu parecer docente do IFPR.', timestamp: '19/08/2026 - 14:15' },
      { id: 'm2', sender: 'Lucas Eduardo Silva', senderEmail: 'aluno@ivaiconecta.com.br', text: 'Olá! Muito obrigado pela oportunidade. Tenho total interesse na vaga híbrida em Ivaiporã.', timestamp: '19/08/2026 - 14:22' },
      { id: 'm3', sender: 'ValeTech Soluções Digitais', senderEmail: 'empresa@ivaiconecta.com.br', text: 'Excelente! Agendamos sua entrevista técnica para Quinta-feira às 14:00.', timestamp: '19/08/2026 - 14:30' }
    ]
  },
  {
    id: 'thread_102',
    participantName: 'Prof. Dr. Ronan Silva',
    participantRole: 'Docente (IFPR Campus Ivaiporã)',
    participantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    jobTitle: 'Parecer Pedagógico - Programação',
    lastMessage: 'Olá! Recebi sua solicitação e já emiti seu parecer pedagógico verificado.',
    lastMessageAt: '20/08/2026 - 09:10',
    unreadCount: 0,
    messages: [
      { id: 'm10', sender: 'Lucas Eduardo Silva', senderEmail: 'aluno@ivaiconecta.com.br', text: 'Olá Professor Ronan! Gostaria de solicitar um parecer sobre meu desempenho acadêmico.', timestamp: '20/08/2026 - 08:45' },
      { id: 'm11', sender: 'Prof. Dr. Ronan Silva', senderEmail: 'professor@ivaiconecta.com.br', text: 'Olá! Recebi sua solicitação e já emiti seu parecer pedagógico verificado com selo do IFPR.', timestamp: '20/08/2026 - 09:10' }
    ]
  }
];

function sanitizeThreads(threadsList) {
  if (!Array.isArray(threadsList)) return SEED_CHAT_THREADS;
  return threadsList.map(t => ({
    id: t?.id || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    participantName: t?.participantName || 'Usuário Ivaí Conecta',
    participantRole: t?.participantRole || 'Contato Regional',
    participantAvatar: t?.participantAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    jobTitle: t?.jobTitle || 'Conversa Direta',
    lastMessage: t?.lastMessage || 'Nenhuma mensagem recente.',
    lastMessageAt: t?.lastMessageAt || '',
    unreadCount: t?.unreadCount || 0,
    messages: Array.isArray(t?.messages) ? t.messages.map(m => ({
      id: m?.id || `m_${Date.now()}`,
      sender: m?.sender || 'Usuário',
      senderEmail: m?.senderEmail || '',
      text: m?.text || '',
      timestamp: m?.timestamp || ''
    })) : []
  }));
}

export function getChatThreads() {
  if (typeof localStorage === 'undefined') return SEED_CHAT_THREADS;
  const raw = localStorage.getItem(STORAGE_KEY_CHAT_THREADS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeThreads(parsed);
      }
    } catch {}
  }
  localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(SEED_CHAT_THREADS));
  return SEED_CHAT_THREADS;
}

export function createOrGetDirectThread(targetUser, jobOrSubject = 'Conversa Direta') {
  const threads = getChatThreads();
  const targetId = targetUser?.id || targetUser?.uid || targetUser?.email;
  
  const existing = threads.find(t =>
    (t.participantId && String(t.participantId) === String(targetId)) ||
    (t.participantEmail && targetUser?.email && t.participantEmail.toLowerCase() === targetUser.email.toLowerCase()) ||
    (t.participantName && targetUser?.name && t.participantName.toLowerCase() === targetUser.name.toLowerCase())
  );

  if (existing) {
    return existing;
  }

  const now = new Date();
  const timestamp = `${now.toLocaleDateString('pt-BR')} - ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const newThread = {
    id: `thread_${Date.now()}`,
    participantId: targetId,
    participantName: targetUser?.name || 'Novo Contato',
    participantEmail: targetUser?.email || '',
    participantRole: targetUser?.role ? (targetUser.role === 'empresa' ? 'Empresa / Recrutador' : targetUser.role === 'professor' ? 'Docente' : 'Candidato / Estudante') : 'Contato Regional',
    participantAvatar: targetUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    jobTitle: jobOrSubject,
    lastMessage: 'Conversa iniciada.',
    lastMessageAt: timestamp,
    unreadCount: 0,
    messages: [
      {
        id: `m_${Date.now()}`,
        sender: targetUser?.name || 'Contato',
        senderEmail: targetUser?.email || '',
        text: `Olá! Conversa iniciada referente a "${jobOrSubject}".`,
        timestamp
      }
    ]
  };

  const updated = [newThread, ...threads];
  localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(updated));
  return newThread;
}

export function sendMessageToThread(threadId, senderUser, text) {
  const threads = getChatThreads();
  const threadIndex = threads.findIndex(t => t.id === threadId);
  if (threadIndex === -1) return null;

  const now = new Date();
  const timestamp = `${now.toLocaleDateString('pt-BR')} - ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const newMsg = {
    id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    sender: senderUser?.name || 'Lucas Eduardo Silva',
    senderEmail: senderUser?.email || 'aluno@ivaiconecta.com.br',
    senderUid: senderUser?.uid || 'guest',
    text: String(text || '').trim(),
    timestamp
  };

  const currentMessages = Array.isArray(threads[threadIndex].messages) ? threads[threadIndex].messages : [];

  const updatedThread = {
    ...threads[threadIndex],
    lastMessage: newMsg.text,
    lastMessageAt: timestamp,
    unreadCount: 0,
    messages: [...currentMessages, newMsg]
  };

  const updatedThreads = [...threads];
  updatedThreads[threadIndex] = updatedThread;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(updatedThreads));
  }

  // Sincronizar conversa e mensagem no Firestore em tempo real
  try {
    const chatDocRef = doc(db, 'chats', threadId);
    setDoc(chatDocRef, {
      lastMessage: newMsg.text,
      lastMessageAt: serverTimestamp(),
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    addDoc(collection(db, 'chats', threadId, 'messages'), {
      ...newMsg,
      createdAt: serverTimestamp()
    }).catch(() => {});
  } catch {}

  return updatedThread;
}

export function getUnreadChatCount() {
  const threads = getChatThreads();
  return threads.reduce((acc, t) => acc + (Number(t.unreadCount) || 0), 0);
}

export function markThreadAsRead(threadId) {
  const threads = getChatThreads();
  const updated = threads.map(t => (t.id === threadId ? { ...t, unreadCount: 0 } : t));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(updated));
  }
  return updated;
}

export function markAllThreadsAsRead() {
  const threads = getChatThreads();
  const updated = threads.map(t => ({ ...t, unreadCount: 0 }));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Listener em tempo real do Firestore para ler mensagens do chat
 */
export function subscribeToFirestoreChat(chatId, callback) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    return onSnapshot(messagesRef, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      callback(msgs);
    }, (err) => {
      console.warn('[Firestore Chat] Erro no listener:', err.message);
    });
  } catch (error) {
    console.warn('[Firestore Chat] Falha ao assinar chat:', error.message);
    return () => {};
  }
}
