import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Plus,
  Trash2,
  Users,
  ArrowLeft,
  AlertTriangle,
  Search,
  CheckCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  subscribeToUserThreads,
  subscribeToMessages,
  sendChatMessage,
  getChatThreads,
  deleteChatThread,
  matchesUserEmail,
  isSameUser,
  markThreadAsRead,
  getThreadUnreadCount,
  validateChatMessage,
  resolveDisplayName,
  resolveAvatar,
  resolveUserRole,
  isGenericPlaceholderAvatar,
  getAvatarGradient,
  getMessageTime
} from '../services/chatService';
import { detectProfanity } from '../services/jobTaxonomy';
import { getUsersDB } from '../lib/ivaiConecta';
import { getUserProfile } from '../services/authService';
import { db } from '../lib/firebase';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { isUserOnline, formatPresenceStatus, findContactInUsers } from '../services/presenceService';

function getRoleBadge(role) {
  const r = (role || '').toLowerCase();
  if (r.includes('empresa') || r.includes('company')) {
    return {
      label: 'Empresa',
      icon: '🏢',
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
    };
  }
  if (r.includes('prestador') || r.includes('freelancer') || r.includes('talent')) {
    return {
      label: 'Prestador de Serviço',
      icon: '💼',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
    };
  }
  if (r.includes('professor') || r.includes('docente') || r.includes('teacher')) {
    return {
      label: 'Docente / Professor',
      icon: '👨‍🏫',
      classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
    };
  }
  if (r.includes('admin') || r.includes('administrador')) {
    return {
      label: 'Administrador',
      icon: '🛡️',
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
    };
  }
  return {
    label: 'Aluno / Candidato',
    icon: '🎓',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
  };
}

function UserAvatar({ src, name, className = 'w-9 h-9', isOnline = undefined }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  const isInvalidOrPlaceholder = !src || isGenericPlaceholderAvatar(src) || imgError;
  const gradientClass = getAvatarGradient(name);

  return (
    <div className="relative inline-block shrink-0">
      {!isInvalidOrPlaceholder ? (
        <img
          src={src}
          alt={name || 'Usuário'}
          onError={() => setImgError(true)}
          className={`${className} rounded-full object-cover border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800`}
        />
      ) : (
        <div
          className={`${className} rounded-full bg-gradient-to-tr ${gradientClass} text-white font-bold text-xs flex items-center justify-center border border-white/20 shadow-xs`}
        >
          {initials || 'U'}
        </div>
      )}
      {typeof isOnline === 'boolean' && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400 dark:bg-slate-500'
          }`}
          title={isOnline ? 'Online agora' : 'Offline'}
        />
      )}
    </div>
  );
}

function getOtherParticipant(thread, currentUser) {
  const myEmail = currentUser?.email?.toLowerCase().trim();
  const myUid = String(currentUser?.uid || currentUser?.id || '');
  const otherEmail = (thread.participants || []).find(e => !matchesUserEmail(e, myEmail)) || thread.lastSenderEmail || '';

  const name = thread.participantNames?.[otherEmail] || thread.participantName || resolveDisplayName({ email: otherEmail });
  const rawAvatar = thread.participantAvatars?.[otherEmail] || thread.participantAvatar || '';
  const avatar = isGenericPlaceholderAvatar(rawAvatar) ? '' : rawAvatar;
  const role = thread.participantRoles?.[otherEmail] || thread.participantRole || 'Usuário Conectado';

  let uid = '';
  if (Array.isArray(thread.participantUids)) {
    uid = thread.participantUids.find(u => String(u) !== myUid) || '';
  }

  return { email: otherEmail, name, avatar, role, uid };
}

export default function ChatModal({ onClose }) {
  const {
    currentUser,
    activeChatThreadId,
    chatDraftMessage,
    setChatDraftMessage,
    startChatWith,
    showConfirm,
    showToast
  } = useAppStore();

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(activeChatThreadId || null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(Boolean(activeChatThreadId));
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendError, setSendError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Fechar no Escape
  useEffect(() => {
    const handleEscapeKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscapeKeyDown);
    return () => window.removeEventListener('keydown', handleEscapeKeyDown);
  }, [onClose]);
  const textareaRef = useRef(null);

  // Carrega lista de usuários reais do Firestore para novos contatos
  useEffect(() => {
    try {
      const q = query(collection(db, 'users'), limit(150));
      const unsub = onSnapshot(q, (snap) => {
        const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setRemoteUsers(users);
      }, () => {});
      return () => unsub();
    } catch { }
  }, []);

  useEffect(() => {
    if (activeChatThreadId) {
      setActiveThreadId(activeChatThreadId);
      setMobileShowChat(true);
    }
  }, [activeChatThreadId]);

  useEffect(() => {
    if (chatDraftMessage) {
      setMessageInput(chatDraftMessage);
      setChatDraftMessage(null);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
      }, 50);
    }
  }, [chatDraftMessage, setChatDraftMessage]);

  // Assinatura em tempo real de todas as conversas do usuário
  useEffect(() => {
    if (!currentUser?.email) {
      setThreads([]);
      setActiveThreadId(null);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserThreads(currentUser.email, (liveChats) => {
      setThreads(liveChats || []);
      setLoading(false);

      if (liveChats && liveChats.length > 0) {
        setActiveThreadId(current => {
          if (current && liveChats.some(t => t.id === current)) {
            return current;
          }
          return liveChats[0].id;
        });
      } else {
        setActiveThreadId(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const hasActiveThread = Boolean(activeThread);
  const otherPerson = activeThread ? getOtherParticipant(activeThread, currentUser) : null;

  // Assinatura em tempo real das mensagens da conversa selecionada
  useEffect(() => {
    if (!activeThreadId || !currentUser?.email || !hasActiveThread) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeThreadId, (liveMessages) => {
      setMessages(liveMessages || []);
    }, currentUser.email);

    return () => unsubscribe();
  }, [activeThreadId, currentUser?.email, hasActiveThread]);

  // Marca conversa como lida
  useEffect(() => {
    if (activeThreadId && currentUser?.email && hasActiveThread) {
      markThreadAsRead(activeThreadId, currentUser.email);
    }
  }, [activeThreadId, currentUser?.email, messages, hasActiveThread]);

  // Ordenação cronológica estrita defensiva (mensagens mais antigas no topo, mais recentes embaixo)
  const sortedMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    const copy = [...messages];
    copy.sort((a, b) => getMessageTime(a) - getMessageTime(b));
    return copy;
  }, [messages]);

  // Garante rolagem para a mensagem mais recente ao abrir conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(timer);
  }, [activeThreadId]);

  // Rola para a mensagem mais recente quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages]);

  // Envio de mensagem com bloqueio estrito de palavras ofensivas
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeThreadId || !activeThread || isSending) return;

    const rawText = messageInput.trim();

    // 1. Validação prévia no cliente (Anti-profanidade & regras de conduta)
    const validation = validateChatMessage(rawText);
    if (!validation.valid) {
      setSendError(validation.error);
      return;
    }

    setSendError(null);
    setIsSending(true);

    try {
      await sendChatMessage(activeThreadId, currentUser, rawText);
      setMessageInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('[Chat] Erro no envio:', err);
      setSendError(err.message || 'Não foi possível enviar a mensagem no momento.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteThread = async (threadId, e) => {
    e.stopPropagation();

    const doDelete = async () => {
      await deleteChatThread(threadId);
      const myEmail = currentUser?.email?.toLowerCase().trim();
      const all = getChatThreads();
      const remaining = all.filter(t => t.participants?.some(p => matchesUserEmail(p, myEmail)));
      setThreads(remaining);
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
        if (remaining.length === 0) setMobileShowChat(false);
      }
      if (showToast) showToast('Conversa removida com sucesso.', 'info');
    };

    if (showConfirm) {
      showConfirm({
        title: 'Excluir conversa?',
        message: 'Deseja realmente remover esta conversa? O histórico local e as mensagens serão excluídos.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        onConfirm: doDelete
      });
    } else if (window.confirm('Deseja realmente excluir esta conversa?')) {
      await doDelete();
    }
  };

  const allUsers = remoteUsers.length > 0 ? remoteUsers : (getUsersDB() || []);
  const myEmail = currentUser?.email?.toLowerCase().trim();
  const availableContacts = allUsers.filter(u => {
    const contactEmail = (u.email || u.studentEmail || '').toLowerCase().trim();
    return (
      !isSameUser(currentUser, u) &&
      contactEmail &&
      !matchesUserEmail(contactEmail, myEmail)
    );
  });

  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return threads;
    const term = searchTerm.toLowerCase().trim();
    return threads.filter(t => {
      const other = getOtherParticipant(t, currentUser);
      return (
        other.name.toLowerCase().includes(term) ||
        (t.contextTitle && t.contextTitle.toLowerCase().includes(term)) ||
        (t.lastMessage && t.lastMessage.toLowerCase().includes(term))
      );
    });
  }, [threads, searchTerm, currentUser]);

  const navigate = useNavigate();

  const currentRoleBadge = otherPerson ? getRoleBadge(otherPerson.role) : null;
  const currentUserName = resolveDisplayName(currentUser);

  // Encontra os dados completos do outro usuário no banco para navegação ao perfil e presença
  const otherUserData = useMemo(() => {
    if (!otherPerson) return null;
    const all = remoteUsers.length > 0 ? remoteUsers : (getUsersDB() || []);
    return findContactInUsers(all, otherPerson);
  }, [otherPerson, remoteUsers]);

  const [asyncOtherUser, setAsyncOtherUser] = useState(null);

  useEffect(() => {
    if (!otherPerson) {
      setAsyncOtherUser(null);
      return;
    }
    if (otherUserData) {
      setAsyncOtherUser(otherUserData);
      return;
    }
    const target = otherPerson.uid || otherPerson.email || otherPerson.name;
    if (!target) return;

    let isMounted = true;
    getUserProfile(target).then(res => {
      if (isMounted && res && res.success && res.profile) {
        setAsyncOtherUser(res.profile);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [otherPerson, otherUserData]);

  // Status de presença real do interlocutor (calculado a partir de heartbeat e Firestore)
  const otherPersonPresence = useMemo(() => {
    if (!otherPerson) return { isOnline: false, label: 'Offline', color: 'gray' };
    const resolvedUser = asyncOtherUser || otherUserData || otherPerson;
    return formatPresenceStatus(resolvedUser);
  }, [otherPerson, otherUserData, asyncOtherUser]);

  const handleOpenUserProfile = () => {
    if (!otherPerson) return;
    const resolvedUser = asyncOtherUser || otherUserData || otherPerson;
    const roleRaw = String(resolvedUser?.role || resolvedUser?.activeRole || resolvedUser?.selectedRole || otherPerson.role || '').toLowerCase();
    const targetId = resolvedUser?.uid || resolvedUser?.id || otherPerson.uid || resolvedUser?.name || otherPerson.name || otherPerson.email;
    if (!targetId) return;

    let path = `/perfil/${encodeURIComponent(targetId)}`;
    if (roleRaw.includes('empresa') || roleRaw.includes('company') || roleRaw.includes('recrutador')) {
      path = `/empresa/${encodeURIComponent(resolvedUser?.uid || resolvedUser?.id || resolvedUser?.nomeFantasia || resolvedUser?.razaoSocial || otherPerson.name || targetId)}`;
    } else if (roleRaw.includes('professor') || roleRaw.includes('docente') || roleRaw.includes('teacher')) {
      path = `/professor/${encodeURIComponent(targetId)}`;
    } else if (roleRaw.includes('freelancer') || roleRaw.includes('prestador')) {
      path = `/freelancer/${encodeURIComponent(targetId)}`;
    } else {
      path = `/perfil/${encodeURIComponent(targetId)}`;
    }

    if (onClose) onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-4xl h-[86vh] sm:h-[84vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Superior Principal */}
        <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-slate-800/90 border-b border-gray-200/80 dark:border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {mobileShowChat && (
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden p-1.5 -ml-1 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                title="Voltar às conversas"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-primary-blue text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <MessageSquare size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white leading-tight truncate">
                  Mensagens Diretas &amp; Chat
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Em Tempo Real
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                Logado como: <strong className="text-primary-blue dark:text-blue-400">{currentUserName}</strong>
                <span className="ml-1.5 text-[11px] opacity-75">({resolveUserRole(currentUser)})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200/70 dark:hover:bg-slate-700/70 rounded-full text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Fechar chat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo do Chat Responsivo */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden">
          {/* Painel Esquerdo: Lista de Conversas e Contatos */}
          <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 overflow-y-auto p-3 space-y-2.5 flex-col h-full`}>
            {/* Header da lista de conversas */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Conversas Ativas
              </span>
              <span className="text-[10px] bg-primary-blue/10 text-primary-blue dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                {threads.length}
              </span>
            </div>

            {/* Barra de busca rápida */}
            {threads.length > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-hidden focus:border-primary-blue"
                />
              </div>
            )}

            {/* Botão Nova Conversa */}
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="w-full btn btn-sm bg-primary-blue text-white hover:bg-blue-700 font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all shadow-xs cursor-pointer text-xs py-2"
            >
              <Plus size={14} /> {showNewChat ? 'Fechar Contatos' : 'Nova Conversa'}
            </button>

            {/* Dropdown de Usuários Disponíveis */}
            {showNewChat && (
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-primary-blue/30 shadow-md space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-gray-700 dark:text-slate-200 px-1 flex items-center gap-1.5">
                  <Users size={13} className="text-primary-blue" /> Iniciar conversa com:
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {availableContacts.length === 0 ? (
                    <div className="text-center py-3 text-[11px] text-gray-400 dark:text-slate-500">
                      Nenhum outro usuário disponível no momento.
                    </div>
                  ) : (
                    availableContacts.map(c => {
                      const cName = resolveDisplayName(c);
                      const cAvatar = resolveAvatar(c);
                      const cRole = resolveUserRole(c);
                      const badge = getRoleBadge(cRole);
                      const isContactOnline = isUserOnline(c);
                      const contactPresence = formatPresenceStatus(c);

                      return (
                        <button
                          key={c.email || c.uid}
                          onClick={() => {
                            startChatWith(c, 'Contato Direto');
                            setShowNewChat(false);
                            setMobileShowChat(true);
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-primary-blue/10 dark:hover:bg-slate-700/80 flex items-center gap-2.5 transition-colors cursor-pointer border border-transparent hover:border-primary-blue/20"
                        >
                          <UserAvatar src={cAvatar} name={cName} className="w-8 h-8 text-[11px]" isOnline={isContactOnline} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{cName}</div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                              <span>{badge.icon} {badge.label}</span>
                              <span>·</span>
                              <span className={`flex items-center gap-1 ${isContactOnline ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-slate-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isContactOnline ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-slate-500'}`}></span>
                                {contactPresence.label}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Lista de Threads */}
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <span className="loading loading-spinner loading-xs text-primary-blue"></span>
                Carregando conversas...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-5 text-center space-y-2 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 my-auto">
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  {searchTerm ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ativa.'}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">
                  {searchTerm ? 'Tente outro termo de busca.' : 'Clique em "+ Nova Conversa" acima para iniciar!'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
                {filteredThreads.map(t => {
                  const other = getOtherParticipant(t, currentUser);
                  const isSelected = t.id === activeThreadId;
                  const threadUnread = getThreadUnreadCount(t, currentUser?.email);
                  const badge = getRoleBadge(other.role);
                  const otherContact = findContactInUsers(remoteUsers, other);
                  const isOtherOnline = isUserOnline(otherContact);

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setMobileShowChat(true);
                      }}
                      className={`group p-2.5 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 relative ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border border-primary-blue/50 shadow-xs ring-1 ring-primary-blue/20'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <UserAvatar src={other.avatar} name={other.name} className="w-10 h-10" isOnline={isOtherOnline} />

                      <div className="min-w-0 flex-1 pr-5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                            {other.name}
                          </span>
                          {threadUnread > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shrink-0 animate-in zoom-in-75">
                              {threadUnread > 99 ? '99+' : threadUnread}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                          <span>{badge.icon}</span>
                          <span className="truncate">{t.contextTitle || badge.label}</span>
                        </div>

                        <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-1">
                          {(() => {
                            const pCheck = detectProfanity(t.lastMessage || '');
                            if (pCheck.hasProfanity) {
                              return (
                                <span className="text-red-500/90 dark:text-red-400 font-medium italic">
                                  [Mensagem moderada: conteúdo impróprio]
                                </span>
                              );
                            }
                            return t.lastMessage || 'Conversa iniciada';
                          })()}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteThread(t.id, e)}
                        title="Remover conversa"
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-all absolute top-2.5 right-2 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Painel Direito: Janela de Mensagens */}
          <div className={`${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col h-full bg-white dark:bg-slate-900 overflow-hidden`}>
            {activeThread && otherPerson ? (
              <div className="flex flex-col h-full">
                {/* Header do Chat Ativo */}
                <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/40 dark:bg-slate-800/40 shrink-0 gap-3">
                  <div
                    onClick={handleOpenUserProfile}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group hover:opacity-95 transition-all"
                    title={`Ver perfil de ${otherPerson.name}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenUserProfile(); }}
                  >
                    <UserAvatar
                      src={otherPerson.avatar}
                      name={otherPerson.name}
                      className="w-10 h-10 group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary-blue/30 transition-all shadow-2xs"
                      isOnline={otherPersonPresence.isOnline}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 truncate">
                        <span className="truncate group-hover:text-primary-blue dark:group-hover:text-blue-400 group-hover:underline transition-colors">
                          {otherPerson.name}
                        </span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${currentRoleBadge?.classes}`}>
                          <span>{currentRoleBadge?.icon}</span>
                          <span>{currentRoleBadge?.label}</span>
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className={`flex items-center gap-1.5 font-medium text-[11px] ${
                          otherPersonPresence.isOnline
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-gray-500 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            otherPersonPresence.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400 dark:bg-slate-500'
                          }`}></span>
                          <span>{otherPersonPresence.label}</span>
                        </span>
                        <span>·</span>
                        <span className="truncate text-primary-blue dark:text-blue-400 font-medium">
                          {activeThread.contextTitle || 'Contato Direto'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenUserProfile}
                      className="btn btn-outline btn-sm text-xs font-bold py-1.5 px-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-blue hover:text-primary-blue dark:hover:text-blue-400 bg-white dark:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={`Ver perfil completo de ${otherPerson.name}`}
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">Ver Perfil</span>
                    </button>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500 hidden md:inline flex items-center gap-1 pl-1">
                      <ShieldCheck size={13} className="text-emerald-500" /> Canal Seguro
                    </span>
                  </div>
                </div>

                {/* Lista de Mensagens em Tempo Real */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/20 dark:bg-slate-900/40 custom-scrollbar">
                  {sortedMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center mb-1">
                        <Sparkles size={22} />
                      </div>
                      <p className="text-xs font-bold text-gray-700 dark:text-slate-200">
                        Início da conversa com {otherPerson.name}
                      </p>
                      <p className="text-[11px] max-w-xs text-gray-500 dark:text-slate-400">
                        Envie uma mensagem abaixo para iniciar a comunicação profissional em tempo real.
                      </p>
                    </div>
                  ) : (
                    sortedMessages.map((m, idx) => {
                      const isMe = matchesUserEmail(m.senderEmail, currentUser?.email);
                      const pCheck = detectProfanity(m.text || '');

                      return (
                        <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-1 duration-150`}>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                            <span className="font-medium text-gray-600 dark:text-slate-400">{m.senderName || m.sender}</span>
                            <span>·</span>
                            <span>{m.timestamp}</span>
                            {isMe && <CheckCheck size={12} className="text-primary-blue" />}
                          </div>

                          {pCheck.hasProfanity ? (
                            <div
                              className={`max-w-[85%] sm:max-w-[76%] px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2 border shadow-xs ${
                                isMe
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30'
                                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60'
                              }`}
                            >
                              <AlertTriangle size={15} className="shrink-0 text-red-500" />
                              <span className="italic font-medium">
                                Mensagem ocultada pela moderação (conteúdo impróprio detectado)
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`max-w-[85%] sm:max-w-[76%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                isMe
                                  ? 'bg-primary-blue text-white rounded-br-xs shadow-xs font-medium'
                                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-bl-xs shadow-xs'
                              }`}
                            >
                              {m.text?.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                                /(https?:\/\/[^\s]+)/g.test(part) ? (
                                  <a
                                    key={i}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`underline font-bold inline-flex items-center gap-0.5 hover:opacity-80 break-all ${
                                      isMe ? 'text-white' : 'text-primary-blue dark:text-blue-400'
                                    }`}
                                  >
                                    {part} <ExternalLink size={11} className="inline ml-0.5" />
                                  </a>
                                ) : (
                                  part
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Banner de Erro / Bloqueio de Palavras Ofensivas */}
                {sendError && (
                  <div className="mx-3 sm:mx-4 mb-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 leading-relaxed font-medium">
                        {sendError}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSendError(null)}
                      className="text-red-400 hover:text-red-700 p-0.5 rounded-lg shrink-0 cursor-pointer"
                      title="Fechar aviso"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Formulário de Envio com Validação Estrita */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-end gap-2 shrink-0">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={e => {
                        setMessageInput(e.target.value);
                        if (sendError) setSendError(null);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={`Mensagem para ${otherPerson.name}... (Enter para enviar, Shift+Enter para nova linha)`}
                      className={`w-full input input-bordered text-sm py-3 px-4 rounded-xl dark:bg-slate-800 dark:text-white border-gray-200 dark:border-slate-700 focus:outline-hidden focus:border-primary-blue resize-none overflow-y-auto min-h-[46px] max-h-[160px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 ${
                        sendError ? 'border-red-400 dark:border-red-600 focus:border-red-500 ring-1 ring-red-400/20' : ''
                      }`}
                      rows={1}
                      disabled={isSending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSending}
                    className="btn btn-primary btn-sm px-4 h-[46px] rounded-xl flex items-center gap-1.5 font-bold cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSending ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <Send size={15} /> <span className="hidden sm:inline">Enviar</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Empty State Quando Nenhuma Conversa Está Selecionada */
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white dark:bg-slate-900">
                <div className="w-16 h-16 rounded-3xl bg-primary-blue/10 text-primary-blue flex items-center justify-center mb-1">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-gray-900 dark:text-white">
                    Nenhuma conversa selecionada
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
                    Selecione uma conversa ao lado ou inicie contato com um dos usuários ativos abaixo:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-2">
                  {availableContacts.slice(0, 4).map(contact => {
                    const cName = resolveDisplayName(contact);
                    const cAvatar = resolveAvatar(contact);
                    const cRole = resolveUserRole(contact);
                    const badge = getRoleBadge(cRole);
                    const isContactOnline = isUserOnline(contact);
                    const contactPresence = formatPresenceStatus(contact);

                    return (
                      <button
                        key={contact.email || contact.uid}
                        onClick={() => {
                          startChatWith(contact, 'Contato Geral');
                          setMobileShowChat(true);
                        }}
                        className="p-3 bg-gray-50 dark:bg-slate-800/80 hover:bg-primary-blue/5 dark:hover:bg-primary-blue/10 border border-gray-200 dark:border-slate-700 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left group"
                      >
                        <UserAvatar src={cAvatar} name={cName} className="w-9 h-9" isOnline={isContactOnline} />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:text-primary-blue transition-colors">
                            {cName}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span>{badge.icon} {badge.label}</span>
                            <span>·</span>
                            <span className={isContactOnline ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-slate-500'}>
                              {contactPresence.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
