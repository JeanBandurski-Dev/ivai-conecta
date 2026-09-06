import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Plus, Trash2, Users, ArrowLeft } from 'lucide-react';
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
  getThreadUnreadCount
} from '../services/chatService';
import { getUsersDB } from '../lib/ivaiConecta';

function getOtherParticipant(thread, currentUser) {
  const myEmail = currentUser?.email?.toLowerCase().trim();
  const otherEmail = (thread.participants || []).find(e => !matchesUserEmail(e, myEmail)) || thread.lastSenderEmail || '';
  
  const name = thread.participantNames?.[otherEmail] || thread.participantName || 'Contato';
  const avatar = thread.participantAvatars?.[otherEmail] || thread.participantAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
  const role = thread.participantRoles?.[otherEmail] || thread.participantRole || 'Usuário Conectado';

  return { email: otherEmail, name, avatar, role };
}

export default function ChatModal({ onClose }) {
  const { currentUser, activeChatThreadId, chatDraftMessage, setChatDraftMessage, startChatWith } = useAppStore();

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(activeChatThreadId || null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(Boolean(activeChatThreadId));

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (activeChatThreadId) {
      setActiveThreadId(activeChatThreadId);
      setMobileShowChat(true);
    }
  }, [activeChatThreadId]);

  useEffect(() => {
    if (chatDraftMessage) {
      setMessageInput(chatDraftMessage);
      setChatDraftMessage(null); // Limpa depois de popular
      
      // Ajusta a altura inicial se a mensagem for longa
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
      }, 50);
    }
  }, [chatDraftMessage, setChatDraftMessage]);

  useEffect(() => {
    if (!currentUser?.email) return;

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
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeThreadId, (liveMessages) => {
      setMessages(liveMessages || []);
    });

    return () => unsubscribe();
  }, [activeThreadId]);

  // Marca conversa ativa como lida
  useEffect(() => {
    if (activeThreadId && currentUser?.email) {
      markThreadAsRead(activeThreadId, currentUser.email);
    }
  }, [activeThreadId, currentUser?.email, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeThreadId) return;

    const text = messageInput.trim();
    setMessageInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reseta a altura após o envio
    }
    await sendChatMessage(activeThreadId, currentUser, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteThread = async (threadId, e) => {
    e.stopPropagation();
    await deleteChatThread(threadId);
    const myEmail = currentUser?.email?.toLowerCase().trim();
    const all = getChatThreads();
    const remaining = all.filter(t => t.participants?.some(p => matchesUserEmail(p, myEmail)));
    setThreads(remaining);
    if (activeThreadId === threadId) {
      setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
      if (remaining.length === 0) setMobileShowChat(false);
    }
  };
  const activeThread = threads.find(t => t.id === activeThreadId);
  const otherPerson = activeThread ? getOtherParticipant(activeThread, currentUser) : null;

  const allUsers = getUsersDB() || [];
  const myEmail = currentUser?.email?.toLowerCase().trim();
  const availableContacts = allUsers.filter(u => 
    !isSameUser(currentUser, u) && 
    !matchesUserEmail(u.email, myEmail)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-4xl h-[85vh] sm:h-[82vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mobileShowChat && (
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden p-1.5 -ml-1 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                title="Voltar às conversas"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-primary-blue text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <MessageSquare size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white leading-tight truncate">
                Mensagens Diretas &amp; Chat
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                Logado como: <strong className="text-primary-blue dark:text-blue-400">{currentUser?.name}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-400 dark:text-slate-400 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Chat Body Responsivo */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[290px_1fr] overflow-hidden">
          {/* Painel Esquerdo: Lista de Conversas (Esconde no mobile quando um chat está aberto) */}
          <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 overflow-y-auto p-3 space-y-2 flex-col h-full`}>
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Conversas Ativas</span>
              <span className="text-[10px] bg-primary-blue/10 text-primary-blue px-2 py-0.5 rounded-full font-bold">{threads.length}</span>
            </div>

            {/* Botão para Nova Conversa */}
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="w-full btn btn-sm bg-primary-blue text-white hover:bg-blue-700 font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all shadow-xs cursor-pointer text-xs py-2"
            >
              <Plus size={14} /> {showNewChat ? 'Fechar Contatos' : '➕ Nova Conversa'}
            </button>

            {/* Modal/Menu para selecionar usuário */}
            {showNewChat && (
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-primary-blue/30 shadow-md space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-gray-700 dark:text-slate-200 px-1 flex items-center gap-1">
                  <Users size={12} className="text-primary-blue" /> Iniciar conversa com:
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {availableContacts.map(c => (
                    <button
                      key={c.email}
                      onClick={() => {
                        startChatWith(c, 'Contato Direto');
                        setShowNewChat(false);
                        setMobileShowChat(true);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-primary-blue/10 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors cursor-pointer border border-transparent hover:border-primary-blue/20"
                    >
                      <img src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} alt={c.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{c.name}</div>
                        <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{c.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400">Carregando conversas...</div>
            ) : threads.length === 0 ? (
              <div className="p-5 text-center space-y-2 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 my-auto">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Nenhuma conversa ativa.</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">Clique em "+ Nova Conversa" acima!</p>
              </div>
            ) : (
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {threads.map(t => {
                  const other = getOtherParticipant(t, currentUser);
                  const isSelected = t.id === activeThreadId;
                  const threadUnread = getThreadUnreadCount(t, currentUser?.email);

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setMobileShowChat(true);
                      }}
                      className={`group p-2.5 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 relative ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border border-primary-blue/40 shadow-xs'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <img src={other.avatar} alt={other.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0 bg-white" />
                      <div className="min-w-0 flex-1 pr-5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-gray-800 dark:text-white truncate">{other.name}</span>
                          {threadUnread > 0 && (
                            <span className="min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shrink-0">
                              {threadUnread > 99 ? '99+' : threadUnread}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-primary-blue dark:text-blue-400 truncate">{t.contextTitle || 'Chat Direto'}</div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">{t.lastMessage || 'Conversa iniciada'}</div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteThread(t.id, e)}
                        title="Remover conversa"
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-all absolute top-2.5 right-2"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Painel Direito: Mensagens (Exibe no mobile quando chat estiver ativo) */}
          <div className={`${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col h-full bg-white dark:bg-slate-900 overflow-hidden`}>
            {activeThread && otherPerson ? (
              <div className="flex flex-col h-full">
                {/* Header do Chat Ativo */}
                <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30 shrink-0">
                  <div className="flex items-center gap-3">
                    <img src={otherPerson.avatar} alt={otherPerson.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0 bg-white" />
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        {otherPerson.name}
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
                          Online
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{otherPerson.role}</span>
                        <span>·</span>
                        <span>{activeThread.contextTitle || 'Chat Regional'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/20 dark:bg-slate-900/40">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <Sparkles className="text-primary-blue mb-2" size={24} />
                      <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">Início da conversa com {otherPerson.name}</p>
                      <p className="text-[11px]">Envie uma mensagem abaixo para começar a conversar!</p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isMe = matchesUserEmail(m.senderEmail, currentUser?.email);

                      return (
                        <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mb-1 px-1">
                            {m.senderName || m.sender} · {m.timestamp}
                          </div>
                          <div
                            className={`max-w-[85%] sm:max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                              isMe
                                ? 'bg-primary-blue text-white rounded-br-xs shadow-xs font-medium'
                                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-bl-xs shadow-xs'
                            }`}
                          >
                            {m.text?.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                              /(https?:\/\/[^\s]+)/g.test(part) ? (
                                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline font-bold hover:opacity-80 break-all ${isMe ? 'text-white' : 'text-primary-blue dark:text-blue-400'}`}>
                                  {part}
                                </a>
                              ) : (
                                part
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulário de Envio */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-end gap-2 shrink-0">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={e => {
                      setMessageInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Mensagem para ${otherPerson.name}...`}
                    className="flex-1 input input-bordered text-sm py-3 px-4 rounded-xl dark:bg-slate-800 dark:text-white border-gray-200 dark:border-slate-700 focus:outline-hidden focus:border-primary-blue resize-none overflow-y-auto min-h-[44px] max-h-[160px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="btn btn-primary btn-sm px-4 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer disabled:opacity-50"
                  >
                    <Send size={15} /> <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white dark:bg-slate-900">
                <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center mb-1">
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-gray-900 dark:text-white">Nenhuma conversa selecionada</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
                    Escolha um contato à esquerda ou selecione um abaixo para começar:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-2">
                  {availableContacts.slice(0, 4).map(contact => (
                    <button
                      key={contact.email}
                      onClick={() => {
                        startChatWith(contact, 'Contato Geral');
                        setMobileShowChat(true);
                      }}
                      className="p-3 bg-gray-50 dark:bg-slate-800/80 hover:bg-primary-blue/5 dark:hover:bg-primary-blue/10 border border-gray-200 dark:border-slate-700 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left group"
                    >
                      <img src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} alt={contact.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:text-primary-blue transition-colors">
                          {contact.name}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-400 truncate">{contact.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
