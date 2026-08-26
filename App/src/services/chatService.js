// Chat & Direct Messaging Service for Ivaí Conecta (Firestore + Local Storage Sync)
import { db } from '../lib/firebase.js';
import { collection, addDoc, doc, setDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
      { id: 'm1', sender: 'ValeTech Soluções Digitais', senderEmail: 'empresa@ivaiconecta.com.br', text: 'Olá Lucas! Analisamos suas qualificações em React e seu parecer docente do IFPR.', timestamp: '19/08/2026 - 14:15' },
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
    lastMessage: 'Olá Lucas! Recebi sua solicitação e já emiti seu parecer pedagógico verificado.',
    lastMessageAt: '20/08/2026 - 09:10',
    unreadCount: 0,
    messages: [
      { id: 'm10', sender: 'Lucas Eduardo Silva', senderEmail: 'aluno@ivaiconecta.com.br', text: 'Olá Professor Ronan! Gostaria de solicitar um parecer sobre meu desempenho acadêmico.', timestamp: '20/08/2026 - 08:45' },
      { id: 'm11', sender: 'Prof. Dr. Ronan Silva', senderEmail: 'professor@ivaiconecta.com.br', text: 'Olá Lucas! Recebi sua solicitação e já emiti seu parecer pedagógico verificado com selo do IFPR.', timestamp: '20/08/2026 - 09:10' }
    ]
  }
];

export function getChatThreads() {
  if (typeof localStorage === 'undefined') return SEED_CHAT_THREADS;
  const raw = localStorage.getItem(STORAGE_KEY_CHAT_THREADS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem(STORAGE_KEY_CHAT_THREADS, JSON.stringify(SEED_CHAT_THREADS));
  return SEED_CHAT_THREADS;
}

export function sendMessageToThread(threadId, senderUser, text) {
  const threads = getChatThreads();
  const threadIndex = threads.findIndex(t => t.id === threadId);
  if (threadIndex === -1) return null;

  const now = new Date();
  const timestamp = `${now.toLocaleDateString('pt-BR')} - ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const newMsg = {
    id: `m_${Date.now()}`,
    sender: senderUser?.name || 'Lucas Eduardo Silva',
    senderEmail: senderUser?.email || 'aluno@ivaiconecta.com.br',
    senderUid: senderUser?.uid || 'guest',
    text,
    timestamp
  };

  const updatedThread = {
    ...threads[threadIndex],
    lastMessage: text,
    lastMessageAt: timestamp,
    unreadCount: 0,
    messages: [...threads[threadIndex].messages, newMsg]
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
      lastMessage: text,
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

/**
 * Listener em tempo real do Firestore para ler mensagens do chat
 */
export function subscribeToFirestoreChat(chatId, callback) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(msgs);
    }, (err) => {
      console.warn('[Firestore Chat] Erro no listener:', err.message);
    });
  } catch (error) {
    console.warn('[Firestore Chat] Falha ao assinar chat:', error.message);
    return () => {};
  }
}
