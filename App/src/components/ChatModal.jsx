import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare, X, Send, User, Check, Clock, ShieldCheck,
  Building2, ArrowLeft, Search, Sparkles, MessageCircle, Plus
} from 'lucide-react';
import {
  getChatThreads,
  sendMessageToThread,
  subscribeToFirestoreChat,
  createOrGetDirectThread,
  markThreadAsRead,
  getOtherParticipant,
  isSameUser
} from '../services/chatService';
import useAppStore from '../store/useAppStore';

const ALL_SUGGESTED_CONTACTS = [
  // Candidatos / Alunos (para empresas conversarem)
  {
    name: 'Lucas Eduardo Silva',
    role: 'aluno',
    email: 'aluno@ivaiconecta.com.br',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    subject: 'Candidato - ADS (IFPR Campus Ivaiporã)'
  },
  {
    name: 'Juliana Aparecida Melo',
    role: 'aluno',
    email: 'juliana.melo@ifpr.edu.br',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    subject: 'Candidata - ADS (IFPR Campus Ivaiporã)'
  },
  {
    name: 'Rafael Gomes Costa',
    role: 'candidato',
    email: 'rafael.costa@uenp.edu.br',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    subject: 'Candidato - Eng. Software (UENP)'
  },

  // Professores / Docentes
  {
    name: 'Prof. Dr. Ronan Silva',
    role: 'professor',
    email: 'ronan.silva@ifpr.edu.br',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    subject: 'Parecer Pedagógico - IFPR'
  },
  {
    name: 'Prof. Dr. Ricardo Oliveira',
    role: 'professor',
    email: 'ricardo.oliveira@ifpr.edu.br',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    subject: 'Parecer Pedagógico - IFPR'
  },

  // Empresas (para alunos e candidatos conversarem)
  {
    name: 'ValeTech Soluções Digitais',
    role: 'empresa',
    email: 'empresa@ivaiconecta.com.br',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150',
    subject: 'Desenvolvedor Front-end Junior'
  },
  {
    name: 'Cooperativa Agropecuária do Vale',
    role: 'empresa',
    email: 'contato@coopvale.com.br',
    avatar: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=150',
    subject: 'Assistente Administrativo & Financeiro'
  }
];

export default function ChatModal({ onClose }) {
  const { currentUser, showToast } = useAppStore();
  const [threads, setThreads] = useState(() => getChatThreads());
  const [activeThreadId, setActiveThreadId] = useState(() => threads[0]?.id || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Filtra contatos sugeridos para NUNCA sugerir o próprio usuário ou mesma empresa
  const suggestedContacts = useMemo(() => {
    return ALL_SUGGESTED_CONTACTS.filter(c => {
      if (isSameUser(c, currentUser)) return false;
      if (currentUser?.role === 'empresa' && c.role === 'empresa') return false;
      return true;
    });
  }, [currentUser]);

  // Garantir que activeThread exista
  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0] || null;

  // Auto-scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length, activeThreadId]);

  // Listener do Firestore para a conversa ativa
  useEffect(() => {
    if (!activeThread?.id) return;
    const unsub = subscribeToFirestoreChat(activeThread.id, (remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setThreads(prev => prev.map(t => {
          if (t.id === activeThread.id) {
            const currentMsgs = t.messages || [];
            const mergedMsgs = [...currentMsgs, ...remoteMsgs.filter(rm => !currentMsgs.some(m => m.id === rm.id))];
            return { ...t, messages: mergedMsgs };
          }
          return t;
        }));
      }
    });
    return () => unsub();
  }, [activeThread?.id]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeThread?.id) return;

    const other = getOtherParticipant(activeThread, currentUser);
    if (isSameUser(other, currentUser)) {
      showToast('⚠️ Você não pode enviar mensagens para si mesmo.');
      return;
    }

    const textToSend = messageInput.trim();
    setMessageInput('');

    const updated = sendMessageToThread(activeThread.id, currentUser, textToSend);
    if (updated) {
      setThreads(getChatThreads());
    }
  };

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    markThreadAsRead(threadId);
    setThreads(getChatThreads());
    setShowMobileChat(true);
  };

  const handleStartNewChat = (contact) => {
    if (isSameUser(contact, currentUser)) {
      showToast('⚠️ Você não pode iniciar uma conversa consigo mesmo.');
      return;
    }
    const result = createOrGetDirectThread(contact, contact.subject, currentUser);
    if (result?.error) {
      showToast('⚠️ ' + result.message);
      return;
    }
    setThreads(getChatThreads());
    setActiveThreadId(result.id);
    setShowMobileChat(true);
    showToast(`Conversa aberta com ${contact.name}!`);
  };

  const filteredThreads = threads.filter(t => {
    const other = getOtherParticipant(t, currentUser);
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (other.name && other.name.toLowerCase().includes(q)) ||
      (t.jobTitle && t.jobTitle.toLowerCase().includes(q)) ||
      (t.lastMessage && t.lastMessage.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl h-[88vh] sm:h-[82vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Principal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-primary-dark via-blue-900 to-primary-blue text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-bold text-white shadow-inner shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-white leading-tight flex items-center gap-2">
                Mensagens Diretas &amp; Chat
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ao Vivo
                </span>
              </h3>
              <p className="text-xs text-blue-200 hidden sm:block">
                Canal seguro e integrado para candidatos, empresas e professores do Vale do Ivaí.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar Chat"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Chat Dividido em 2 Painéis */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden">
          
          {/* ── PAINEL ESQUERDO: LISTA DE CONVERSAS ── */}
          <div className={`flex flex-col border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/60 overflow-hidden ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Barra de Busca de Contatos */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-800">
              <div className="relative flex items-center">
                <Search size={15} className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar conversa ou empresa..."
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:border-primary-blue dark:focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Lista de Threads */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              <div className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase px-2 py-1 flex items-center justify-between">
                <span>Conversas Recentes</span>
                <span className="text-[10px] font-semibold">{filteredThreads.length}</span>
              </div>

              {filteredThreads.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Nenhuma conversa encontrada.</p>
                </div>
              ) : (
                filteredThreads.map(t => {
                  const isSelected = activeThread?.id === t.id;
                  const other = getOtherParticipant(t, currentUser);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectThread(t.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border border-primary-blue/30 shadow-xs ring-1 ring-primary-blue/20'
                          : 'hover:bg-white/80 dark:hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <img
                        src={other.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt={other.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 shrink-0 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-xs text-gray-800 dark:text-white truncate">
                            {other.name}
                          </span>
                          {t.lastMessageAt && (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">
                              {t.lastMessageAt.split(' - ')[1] || t.lastMessageAt}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-primary-blue dark:text-blue-400 truncate">
                          {t.jobTitle}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                          {t.lastMessage}
                        </div>
                      </div>

                      {t.unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-primary-blue absolute top-3 right-3 animate-pulse" />
                      )}
                    </div>
                  );
                })
              )}

              {/* Sugestões Rápidas para Iniciar Conversa */}
              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
                <div className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase px-2 mb-2 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" /> Iniciar Nova Conversa
                </div>
                <div className="space-y-1">
                  {suggestedContacts.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleStartNewChat(c)}
                      className="w-full p-2 rounded-xl text-left hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300 cursor-pointer"
                    >
                      <img src={c.avatar} alt={c.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium leading-tight">{c.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{c.subject}</div>
                      </div>
                      <Plus size={13} className="text-primary-blue dark:text-blue-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── PAINEL DIREITO: VISUALIZAÇÃO DA CONVERSA E ENVIO ── */}
          <div className={`flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden ${
            showMobileChat ? 'flex' : 'hidden md:flex'
          }`}>
            
            {activeThread ? (
              <>
                {/* Header da Conversa Ativa */}
                {(() => {
                  const otherActive = getOtherParticipant(activeThread, currentUser);
                  return (
                    <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/40 dark:bg-slate-800/40 shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Botão de Voltar no Mobile */}
                        <button
                          type="button"
                          onClick={() => setShowMobileChat(false)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 md:hidden cursor-pointer shrink-0"
                          aria-label="Voltar para a lista"
                        >
                          <ArrowLeft size={18} />
                        </button>

                        <img
                          src={otherActive.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={otherActive.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 shrink-0 bg-white"
                        />

                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-2 truncate">
                            <span className="truncate">{otherActive.name}</span>
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2 py-0.2 rounded-full shrink-0">
                              Online
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                            {otherActive.role} · {activeThread.jobTitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Área de Mensagens (Scroll) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#F8FAFC] dark:bg-slate-950/50">
                  {(activeThread.messages || []).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-2">👋</div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        Envie a primeira mensagem para iniciar a conversa!
                      </p>
                    </div>
                  ) : (
                    (activeThread.messages || []).map((m, idx) => {
                      const isMe =
                        (m.senderEmail && currentUser?.email && m.senderEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
                        (m.sender && currentUser?.name && m.sender.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
                        m.senderUid === currentUser?.uid;

                      return (
                        <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                            <span>{m.sender || 'Usuário'}</span>
                            {m.timestamp && <span>· {m.timestamp}</span>}
                          </div>
                          <div className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-primary-blue text-white rounded-br-xs shadow-sm font-medium'
                              : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-xs border border-gray-200 dark:border-slate-700 shadow-xs'
                          }`}>
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulário de Envio de Mensagem */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 shrink-0"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder={`Mensagem para ${activeThread.participantName}...`}
                    className="form-control text-xs sm:text-sm flex-1 py-2.5"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="btn btn-primary btn-sm font-bold shrink-0 flex items-center gap-1.5 px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send size={15} />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-primary-blue dark:text-blue-400 mb-4 text-2xl">
                  💬
                </div>
                <h4 className="font-heading font-bold text-base text-gray-800 dark:text-white mb-1">
                  Nenhuma conversa selecionada
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mb-4">
                  Escolha uma conversa na barra lateral ou inicie um novo contato direto com empresas e professores.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
