import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  HelpCircle,
  X,
  Send,
  RotateCcw,
  ArrowUpRight,
  MessageSquare,
  Compass,
  ShieldCheck,
  Zap
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { normalizeUserRole } from '../services/authService';
import {
  ROLE_CONTEXT_META,
  getPageLabel,
  getContextualHelpTopics,
  getArticleById,
  normalizeRoleKey
} from '../data/helpKnowledgeBase';
import {
  askAiHelp,
  getAiQuotaStatus,
  validateHelpPrompt,
  MAX_HELP_MESSAGE_LENGTH
} from '../services/aiHelpService';

function createMessageId() {
  return `help_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Renderiza **negrito** de forma segura em React sem dangerouslySetInnerHTML.
 */
function renderFormattedLine(line) {
  const parts = String(line).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedMessageText({ text }) {
  const lines = String(text || '').split('\n');
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed break-words">
      {lines.map((line, index) => {
        if (!line.trim()) {
          return <div key={index} className="h-1" />;
        }
        return (
          <p key={index} className="m-0">
            {renderFormattedLine(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function HelpAssistantWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    isChatOpen,
    openChat,
    isHelpOpen,
    openHelp,
    closeHelp
  } = useAppStore();

  const isAuthenticated = Boolean(currentUser);
  const userRole = useMemo(
    () => normalizeRoleKey(normalizeUserRole(currentUser?.role)),
    [currentUser?.role]
  );
  const roleMeta = ROLE_CONTEXT_META[userRole] || ROLE_CONTEXT_META.visitante;
  const pageLabel = getPageLabel(location.pathname);

  const contextualTopics = useMemo(
    () =>
      getContextualHelpTopics({
        pathname: location.pathname,
        userRole,
        isAuthenticated
      }),
    [location.pathname, userRole, isAuthenticated]
  );

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputError, setInputError] = useState(null);
  const [quota, setQuota] = useState(() => getAiQuotaStatus(isAuthenticated));

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const activeRequestRef = useRef(0);

  // Atualiza status de cota quando muda estado de autenticação ou abre o painel
  useEffect(() => {
    setQuota(getAiQuotaStatus(isAuthenticated));
  }, [isAuthenticated, isHelpOpen]);

  // Fecha com Escape quando aberto
  useEffect(() => {
    if (!isHelpOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeHelp();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHelpOpen, closeHelp]);

  // Foco automático no input ao abrir o painel
  useEffect(() => {
    if (isHelpOpen && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isHelpOpen]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (isHelpOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isGenerating, isHelpOpen]);

  const handleResetConversation = useCallback(() => {
    activeRequestRef.current += 1;
    setIsGenerating(false);
    setMessages([]);
    setInputError(null);
  }, []);

  const handleActionClick = useCallback(
    (action) => {
      if (!action) return;
      if (action.type === 'open_chat') {
        closeHelp();
        openChat();
        return;
      }
      if (action.type === 'navigate' && action.to) {
        closeHelp();
        navigate(action.to);
      }
    },
    [closeHelp, navigate, openChat]
  );

  const handleSendToAi = useCallback(
    async (rawQuestion) => {
      const validation = validateHelpPrompt(rawQuestion);
      if (!validation.valid) {
        setInputError(validation.error);
        return;
      }
      if (isGenerating) return;

      const requestId = activeRequestRef.current + 1;
      activeRequestRef.current = requestId;

      setInputError(null);
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const userMsg = {
        id: createMessageId(),
        sender: 'user',
        text: validation.text
      };
      const assistantPlaceholderId = createMessageId();
      const assistantPlaceholder = {
        id: assistantPlaceholderId,
        sender: 'assistant',
        text: '',
        source: 'ai',
        isStreaming: true,
        actions: []
      };

      const historySnapshot = [...messages];
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsGenerating(true);

      try {
        const result = await askAiHelp({
          question: validation.text,
          history: historySnapshot,
          pathname: location.pathname,
          userRole,
          isAuthenticated,
          onChunk: (partialText) => {
            if (activeRequestRef.current !== requestId) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholderId
                  ? { ...m, text: partialText, isStreaming: true }
                  : m
              )
            );
          }
        });

        if (activeRequestRef.current !== requestId) return;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  text: result.text,
                  actions: result.actions || [],
                  source: result.source,
                  isStreaming: false
                }
              : m
          )
        );
        if (typeof result.remainingQuota === 'number') {
          setQuota((prev) => ({ ...prev, remaining: result.remainingQuota }));
        } else {
          setQuota(getAiQuotaStatus(isAuthenticated));
        }
      } catch (err) {
        if (activeRequestRef.current !== requestId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  text: err?.message || 'Não foi possível processar sua pergunta agora. Tente novamente.',
                  source: 'local-fallback',
                  isStreaming: false,
                  actions: [{ type: 'navigate', to: '/vagas', label: 'Explorar Vagas' }]
                }
              : m
          )
        );
      } finally {
        if (activeRequestRef.current === requestId) {
          setIsGenerating(false);
        }
      }
    },
    [isAuthenticated, isGenerating, location.pathname, messages, userRole]
  );

  const handleQuickTopic = useCallback(
    (topic) => {
      if (!topic || isGenerating) return;
      if (!topic.preferAI && topic.articleId) {
        const article = getArticleById(topic.articleId, { isAuthenticated });
        if (article) {
          setMessages((prev) => [
            ...prev,
            { id: createMessageId(), sender: 'user', text: topic.question },
            {
              id: createMessageId(),
              sender: 'assistant',
              text: `**${article.title}**\n\n${article.answer}`,
              actions: article.actions || [],
              source: 'instant-guide',
              isStreaming: false
            }
          ]);
          return;
        }
      }
      handleSendToAi(topic.question);
    },
    [handleSendToAi, isAuthenticated, isGenerating]
  );

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendToAi(inputValue);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendToAi(inputValue);
    }
  };

  // Evita conflito visual quando o modal de Chat em tempo real está aberto
  if (isChatOpen) return null;

  const firstName = currentUser?.name ? String(currentUser.name).split(' ')[0] : null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {/* Painel do Assistente */}
      {isHelpOpen && (
        <section
          role="dialog"
          aria-label="Assistente de Ajuda Ivaí Conecta"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[400px] h-[min(580px,calc(100vh-6.5rem))] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/90 rounded-3xl shadow-brand-xl flex flex-col overflow-hidden animate-smooth-in"
        >
          {/* Cabeçalho */}
          <header className="px-4 py-3.5 bg-gradient-to-r from-primary-dark via-slate-900 to-primary-blue text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-accent-sky" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-heading font-bold text-white truncate m-0">
                    Ajuda Ivaí Conecta
                  </h2>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-green/20 text-emerald-200 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                    IA
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/85 truncate m-0 flex items-center gap-1">
                  <Compass size={11} className="shrink-0" />
                  <span>{roleMeta.shortLabel} · {pageLabel}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  title="Reiniciar conversa"
                  aria-label="Reiniciar conversa"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={closeHelp}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                title="Fechar ajuda"
                aria-label="Fechar assistente de ajuda"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Área de Conversa + Atalhos Contextuais */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/70 dark:bg-slate-950/60">
            {/* Cartão de Boas-vindas & Atalhos Contextuais */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-brand-sm space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary-blue dark:text-sky-400 uppercase tracking-wider m-0">
                  Assistente Contextual
                </p>
                <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed m-0">
                  {firstName ? `Olá, ${firstName}! ` : 'Olá! '}
                  Posso tirar dúvidas sobre o Ivaí Conecta, ajudar com seu perfil/currículo ou orientar na criação de vagas e serviços.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Sugestões para esta tela:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {contextualTopics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleQuickTopic(topic)}
                      className="inline-flex items-center gap-1.5 text-left text-xs font-medium px-2.5 py-1.5 rounded-xl border border-blue-200/80 dark:border-slate-700 bg-primary-light/70 dark:bg-slate-800 text-primary-dark dark:text-slate-200 hover:border-primary-blue hover:bg-primary-light dark:hover:border-sky-400 dark:hover:bg-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {topic.preferAI ? (
                        <Sparkles size={12} className="text-primary-blue dark:text-sky-400 shrink-0" />
                      ) : (
                        <Zap size={12} className="text-amber-500 shrink-0" />
                      )}
                      <span>{topic.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Histórico de mensagens */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                      isUser
                        ? 'bg-primary-blue text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-gray-200/80 dark:border-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words m-0 font-medium">
                        {msg.text}
                      </p>
                    ) : msg.isStreaming && !msg.text ? (
                      <div className="flex items-center gap-1.5 py-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-bounce [animation-delay:120ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-bounce [animation-delay:240ms]" />
                        <span className="ml-1">Pensando...</span>
                      </div>
                    ) : (
                      <>
                        <FormattedMessageText text={msg.text} />
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary-blue/80 animate-pulse align-middle rounded-xs" />
                        )}
                      </>
                    )}

                    {/* Botões de ação diretos na resposta */}
                    {!isUser && Array.isArray(msg.actions) && msg.actions.length > 0 && !msg.isStreaming && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={`${msg.id}_act_${idx}`}
                            type="button"
                            onClick={() => handleActionClick(action)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-primary-blue/10 hover:bg-primary-blue text-primary-blue hover:text-white dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-slate-950 transition-colors cursor-pointer"
                          >
                            {action.type === 'open_chat' ? (
                              <MessageSquare size={12} />
                            ) : (
                              <ArrowUpRight size={13} />
                            )}
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isUser && !msg.isStreaming && (
                    <span className="mt-1 px-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {msg.source === 'instant-guide'
                        ? 'Guia instantâneo'
                        : msg.source === 'local-fallback'
                          ? 'Guia local da plataforma'
                          : 'Respondido por IA Gemini'}
                    </span>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Rodapé com Input + Aviso */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shrink-0 space-y-2">
            {inputError && (
              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 m-0 px-1">
                {inputError}
              </p>
            )}

            <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  maxLength={MAX_HELP_MESSAGE_LENGTH}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (inputError) setInputError(null);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 108)}px`;
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Digite sua dúvida sobre o site..."
                  rows={1}
                  disabled={isGenerating}
                  aria-label="Digite sua dúvida para o assistente"
                  className="w-full text-[13px] py-2.5 px-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary-blue dark:focus:border-sky-400 resize-none min-h-[42px] max-h-[108px] overflow-y-auto"
                />
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || isGenerating}
                className="w-10 h-10 rounded-2xl bg-primary-blue hover:bg-primary-hover text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-xs"
                title="Enviar dúvida"
                aria-label="Enviar dúvida"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-slate-400 dark:text-slate-500">
              <span className="inline-flex items-center gap-1 truncate">
                <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
                Não envie senhas ou dados pessoais
              </span>
              <span className="shrink-0 font-semibold">
                {inputValue.length >= 450
                  ? `${inputValue.length}/${MAX_HELP_MESSAGE_LENGTH}`
                  : quota.remaining <= 10
                    ? `Restam ${quota.remaining} IA hoje`
                    : 'Guia grátis · IA pronta'}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Botão Flutuante (FAB) */}
      <button
        type="button"
        onClick={() => (isHelpOpen ? closeHelp() : openHelp())}
        aria-expanded={isHelpOpen}
        aria-label={isHelpOpen ? 'Fechar assistente de ajuda' : 'Abrir assistente de ajuda com IA'}
        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-dark to-primary-blue hover:from-primary-blue hover:to-blue-600 text-white shadow-brand-lg hover:shadow-brand-xl border border-white/15 px-3.5 py-3 sm:px-4 sm:py-3 transition-all duration-200 cursor-pointer active:scale-95"
      >
        {isHelpOpen ? (
          <X size={20} className="shrink-0" />
        ) : (
          <div className="relative flex items-center justify-center">
            <HelpCircle size={20} className="shrink-0" />
            <Sparkles
              size={11}
              className="absolute -top-1.5 -right-1.5 text-accent-sky group-hover:scale-110 transition-transform"
            />
          </div>
        )}
        <span className="hidden sm:inline text-xs font-heading font-bold tracking-wide whitespace-nowrap">
          {isHelpOpen ? 'Fechar Ajuda' : 'Ajuda IA'}
        </span>
      </button>
    </div>
  );
}
