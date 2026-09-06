import { useState, useEffect } from 'react';
import { X, Phone, Send, MessageSquare, MapPin, Check, Copy, Sparkles, ShieldCheck } from 'lucide-react';
import {
  generateWhatsAppLink,
  sanitizeWhatsAppPhone,
  maskPhone,
  WHATSAPP_MESSAGE_PRESETS,
  incrementServiceContact
} from '../lib/ivaiConecta';
import useAppStore from '../store/useAppStore';

export default function WhatsAppContactModal({ isOpen, onClose, service, onOpenChat }) {
  const { showToast } = useAppStore();
  const [selectedPresetId, setSelectedPresetId] = useState('orcamento');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  const providerName = service?.providerName || 'Profissional';
  const serviceTitle = service?.title || service?.name || service?.category || 'Serviço';
  const city = service?.city || 'Ivaiporã';
  const rawPhone = service?.phone || '';
  const cleanPhone = sanitizeWhatsAppPhone(rawPhone);
  const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 10);

  // Inicializa o texto da mensagem quando abre ou muda o preset (sem violar regras de hooks)
  useEffect(() => {
    if (!isOpen || !service) return;
    const preset = WHATSAPP_MESSAGE_PRESETS.find(p => p.id === selectedPresetId);
    if (preset) {
      setCustomText(preset.getTemplate({ providerName, serviceTitle, city }));
    }
  }, [isOpen, service, selectedPresetId, providerName, serviceTitle, city]);

  if (!isOpen || !service) return null;

  const handleSelectPreset = (id) => {
    setSelectedPresetId(id);
    const preset = WHATSAPP_MESSAGE_PRESETS.find(p => p.id === id);
    if (preset) {
      setCustomText(preset.getTemplate({ providerName, serviceTitle, city }));
    }
  };

  const handleSendWhatsApp = () => {
    if (!hasPhone) {
      showToast('⚠️ Este prestador não possui número de WhatsApp cadastrado. Utilize o Chat da plataforma.');
      return;
    }

    // Registra métrica de contato/lead
    incrementServiceContact(service.id || service.firestoreId);

    const link = generateWhatsAppLink(cleanPhone, customText);
    window.open(link, '_blank', 'noopener,noreferrer');
    showToast('💬 Redirecionando para o WhatsApp...');
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    showToast('📋 Mensagem copiada para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Visual com Identidade WhatsApp & Ivaí Conecta */}
        <div className="bg-[linear-gradient(135deg,#075E54_0%,#128C7E_60%,#25D366_100%)] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3.5 sm:gap-4 pr-6">
            <img
              src={service.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}
              alt={providerName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-sm shrink-0 bg-white"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                  Contato Direto WhatsApp
                </span>
                <span className="text-[11px] font-semibold bg-black/20 px-2 py-0.5 rounded text-white/90 flex items-center gap-1">
                  <ShieldCheck size={11} /> Prestador Regional
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-white truncate mt-1">
                {providerName}
              </h2>
              <div className="text-xs text-white/90 font-medium truncate">
                {serviceTitle} · <span className="inline-flex items-center gap-1"><MapPin size={11} />{city}, PR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Seletor de Tipo de Mensagem */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-green-600 dark:text-green-400" />
              Selecione o Objetivo do Contato
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WHATSAPP_MESSAGE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'border-green-500 bg-green-50/80 dark:bg-green-950/40 shadow-xs ring-1 ring-green-500'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>{preset.icon}</span>
                        {preset.label}
                      </span>
                      {isSelected && <Check size={14} className="text-green-600 dark:text-green-400" />}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo de Mensagem Editável */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                Mensagem Formatada para o WhatsApp
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-primary-blue dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copied ? 'Copiada!' : 'Copiar texto'}
              </button>
            </div>

            <textarea
              rows={3}
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setSelectedPresetId('custom');
              }}
              className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all leading-relaxed"
              placeholder="Digite sua mensagem personalizada..."
            />
          </div>

          {/* Balão de Pré-visualização estilo WhatsApp */}
          <div className="bg-[#EFEAE2] dark:bg-slate-950 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <span>💬</span> Prévia no WhatsApp do prestador:
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none max-w-[92%] shadow-xs text-xs sm:text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed border border-black/5">
              {customText}
              <div className="text-[10px] text-gray-400 dark:text-slate-500 text-right mt-1 font-mono flex items-center justify-end gap-1">
                <span>Agora</span>
                <span className="text-[#34B7F1] font-bold">✓✓</span>
              </div>
            </div>
          </div>

          {/* Alerta de Telefone */}
          {!hasPhone && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <span className="shrink-0 text-base">⚠️</span>
              <div>
                <strong className="font-bold">WhatsApp não informado:</strong> Este prestador ainda não cadastrou um número público. Você pode conversar diretamente com ele usando o <strong>Chat Interno do Ivaí Conecta</strong>.
              </div>
            </div>
          )}

          {hasPhone && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-200/80 dark:border-slate-700/80">
              <Phone size={14} className="text-green-600 shrink-0" />
              <span>Número de destino:</span>
              <strong className="text-gray-900 dark:text-white font-mono">{maskPhone(rawPhone) || cleanPhone}</strong>
              <span className="text-[11px] text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/80 px-2 py-0.5 rounded-md font-bold ml-auto">
                DDD 43 Validado
              </span>
            </div>
          )}

        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Alternativa: Chat Interno */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenChat) onOpenChat();
            }}
            className="btn btn-outline btn-sm text-xs font-bold text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:border-primary-blue hover:text-primary-blue flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare size={14} />
            Conversar pelo Chat Interno
          </button>

          {/* Botão Primário WhatsApp */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={!hasPhone}
            className={`btn btn-sm text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer ${
              hasPhone
                ? 'bg-[#25D366] hover:bg-[#1EBE5D] text-white'
                : 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={15} />
            Abrir WhatsApp Agora
          </button>
        </div>

      </div>
    </div>
  );
}
