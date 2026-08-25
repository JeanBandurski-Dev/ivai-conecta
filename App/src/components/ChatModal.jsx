import { useState } from 'react';
import { MessageSquare, X, Send, User, Check, Clock, ShieldCheck, Building2 } from 'lucide-react';
import { getChatThreads, sendMessageToThread } from '../lib/ivaiConecta';
import useAppStore from '../store/useAppStore';

export default function ChatModal({ onClose }) {
  const { currentUser, showToast } = useAppStore();
  const [threads, setThreads] = useState(getChatThreads());
  const [activeThreadId, setActiveThreadId] = useState(threads[0]?.id || 'thread_101');
  const [messageInput, setMessageInput] = useState('');

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const updated = sendMessageToThread(activeThreadId, currentUser, messageInput.trim());
    if (updated) {
      setThreads(getChatThreads());
      setMessageInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-blue text-white flex items-center justify-center font-bold">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white leading-tight">
                Mensagens Diretas &amp; Chat
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Canal direto entre estudantes, professores e empresas parceiras.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-400 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] overflow-hidden">
          
          {/* Left Panel: Threads List */}
          <div className="border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 overflow-y-auto p-3 space-y-2">
            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase px-2 mb-1">Conversas Ativas</div>
            {threads.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                  t.id === activeThreadId
                    ? 'bg-white dark:bg-slate-800 border border-primary-blue/30 shadow-xs'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <img src={t.participantAvatar} alt={t.participantName} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 bg-white" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-gray-800 dark:text-white truncate">{t.participantName}</div>
                  <div className="text-[11px] font-semibold text-primary-blue dark:text-blue-400 truncate">{t.jobTitle}</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-1">{t.lastMessage}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Panel: Messages View & Input */}
          <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            
            {/* Active Thread Header */}
            {activeThread && (
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <img src={activeThread.participantAvatar} alt={activeThread.participantName} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0 bg-white" />
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      {activeThread.participantName}
                      <span className="text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
                        Online
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{activeThread.participantRole} · {activeThread.jobTitle}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/20 dark:bg-slate-900/40">
              {activeThread?.messages.map(m => {
                const isMe = m.senderEmail === currentUser?.email || m.sender.includes(currentUser?.name?.split(' ')[0] || 'Lucas');
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500 mb-1 px-1">{m.sender} · {m.timestamp}</div>
                    <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-primary-blue text-white rounded-br-none shadow-xs font-medium'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-none border border-gray-200 dark:border-slate-700'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="form-control text-xs flex-1"
              />
              <button type="submit" className="btn btn-primary btn-sm font-bold shrink-0 flex items-center gap-1">
                <Send size={14} /> Enviar
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
