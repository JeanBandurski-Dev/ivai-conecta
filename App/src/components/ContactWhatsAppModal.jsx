import { useState } from 'react';
import {
  X, MessageCircle, Send, Copy, Check, Star, MapPin,
  ShieldCheck, Sparkles, ExternalLink
} from 'lucide-react';
import { WHATSAPP_MESSAGE_TEMPLATES, generateWhatsAppServiceLink } from '../services/servicesService';
import useAppStore from '../store/useAppStore';

export default function ContactWhatsAppModal({ service, onClose }) {
  const { showToast } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState('orcamento');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!service) return null;

  const { providerName, category, city, phone = '5543999887766', rating, reviewsCount, badge } = service;

  const currentTemplate = WHATSAPP_MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate) || WHATSAPP_MESSAGE_TEMPLATES[0];
  const generatedMessage = currentTemplate.generate(providerName, category, city, customNote);
  const waUrl = generateWhatsAppServiceLink(phone, providerName, category, city, selectedTemplate, customNote);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      showToast('📋 Mensagem copiada para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (onClose) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-brand-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-600 text-white p-6 sm:p-7">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shadow-inner shrink-0 font-bold">
              🛠️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 bg-white/15 px-2 py-0.5 rounded-md">
                  {category}
                </span>
                {badge && (
                  <span className="text-[11px] font-semibold text-emerald-100 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-300" /> {badge}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-heading font-extrabold text-white mt-1 leading-snug">
                {providerName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-emerald-100 mt-0.5">
                <span className="flex items-center gap-1"><MapPin size={12} />{city}</span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold">
                  <Star size={12} className="fill-amber-300 text-amber-300" /> {rating} ({reviewsCount} avaliações)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Assunto / Tipo de Contato */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 block mb-2.5">
              Escolha o Tipo de Contato:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WHATSAPP_MESSAGE_TEMPLATES.map(t => {
                const isSelected = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm mb-1">
                      <span>{t.icon}</span>
                      <span>{t.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {t.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo Opcional para Detalhes */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Detalhes / Observações (Opcional)</span>
              <span className="text-[11px] text-gray-400 font-normal">Ex: "Preciso para este sábado", "Instalar 3 pontos"</span>
            </label>
            <input
              type="text"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="Digite detalhes extras que serão anexados à mensagem..."
              className="form-control text-sm py-2.5"
            />
          </div>

          {/* Pré-visualização da Mensagem */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-500" /> Prévia da Mensagem do WhatsApp:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copiado!' : 'Copiar texto'}
              </button>
            </div>

            <div className="bg-[#EFEAE2] dark:bg-slate-950 p-3.5 rounded-2xl border border-gray-200/80 dark:border-slate-800 text-gray-800 dark:text-slate-200 text-xs sm:text-sm whitespace-pre-line leading-relaxed font-sans shadow-inner">
              <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl shadow-xs border border-black/5 dark:border-white/5">
                {generatedMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm font-semibold"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="btn btn-whatsapp font-bold shadow-md flex items-center gap-2 text-sm px-5 py-2.5"
          >
            <MessageCircle size={17} />
            Abrir Conversa no WhatsApp
            <ExternalLink size={14} className="opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
}
