import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Send, Sparkles, AlertCircle, CheckCircle2, MapPin, DollarSign,
  Calendar, Phone, MessageSquare, ThumbsUp, Check, Building2
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { createServiceOrder, maskPhone, CITIES } from '../lib/ivaiConecta';
import { validatePhoneNumber } from '../services/jobTaxonomy';
import {
  validateServiceRequestDescription,
  validateServiceDeadline,
  formatCurrencyBRL,
  maskCurrencyLive,
  validateCurrency,
  REQUEST_SUGGESTION_CHIPS,
  QUICK_BUDGET_OPTIONS,
  QUICK_DEADLINE_OPTIONS
} from '../utils/formValidation';

export default function SolicitarServicoModal({ service, onClose, onSuccess }) {
  const { currentUser, showToast } = useAppStore();

  // Identificação do tipo de contratante (Empresa vs Pessoa Física)
  const isCompanyUser = useMemo(() => Boolean(
    currentUser?.role === 'empresa' ||
    currentUser?.role === 'company' ||
    currentUser?.role === 'recrutador' ||
    currentUser?.company ||
    currentUser?.companyName ||
    currentUser?.razaoSocial ||
    currentUser?.cnpj
  ), [currentUser]);

  const clientName = useMemo(() => (
    currentUser?.company ||
    currentUser?.companyName ||
    currentUser?.tradeName ||
    currentUser?.razaoSocial ||
    currentUser?.nomeFantasia ||
    currentUser?.name ||
    (isCompanyUser ? 'Empresa Regional' : 'Cliente Ivaí Conecta')
  ).trim(), [currentUser, isCompanyUser]);

  const [description, setDescription] = useState('');
  const [city, setCity] = useState(currentUser?.city || service?.city || 'Ivaiporã');
  const [budget, setBudget] = useState('A combinar');
  const [deadline, setDeadline] = useState('A combinar com o prestador');
  const [phone, setPhone] = useState(
    currentUser?.phone || currentUser?.contactPhone || currentUser?.whatsapp
      ? maskPhone(currentUser?.phone || currentUser?.contactPhone || currentUser?.whatsapp)
      : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [touchedDesc, setTouchedDesc] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedDeadline, setTouchedDeadline] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isSubmitting]);

  // Validações em tempo real memorizadas
  const descVal = useMemo(
    () => validateServiceRequestDescription(description, { minLength: 20, maxLength: 800 }),
    [description]
  );
  const phoneVal = useMemo(() => validatePhoneNumber(phone, true), [phone]);
  const budgetVal = useMemo(
    () => validateCurrency(budget, { min: 10, max: 200000, required: false }),
    [budget]
  );
  const deadlineVal = useMemo(
    () => validateServiceDeadline(deadline, { required: true }),
    [deadline]
  );

  const handleChipClick = useCallback((chipText) => {
    setErrorMsg('');
    setTouchedDesc(true);
    setDescription(prev => {
      const current = prev.trim();
      if (!current) return chipText;
      if (current.includes(chipText)) return current;
      return `${current} ${chipText}`;
    });
  }, []);

  if (!service) return null;

  const serviceTitle = service.title || service.name || 'Serviço Profissional';
  const providerName = service.providerName || 'Profissional Regional';

  const handleBudgetChange = (e) => {
    const raw = e.target.value;
    if (/a\s*combinar/i.test(raw)) {
      setBudget('A combinar');
      return;
    }
    // Aplica máscara ao vivo
    setBudget(maskCurrencyLive(raw));
  };

  const handleBudgetBlur = () => {
    if (!budget.trim() || budget.trim() === 'R$' || /a\s*combinar/i.test(budget)) {
      setBudget('A combinar');
      return;
    }
    // Auto-preenche os centavos ",00" quando o usuário digita inteiro como "1500"
    setBudget(formatCurrencyBRL(budget));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('⚠️ Você precisa estar logado para solicitar um serviço!');
      return;
    }

    setTouchedDesc(true);
    setTouchedPhone(true);
    setTouchedDeadline(true);

    const descCheck = validateServiceRequestDescription(description, { minLength: 20, maxLength: 800 });
    if (!descCheck.valid) {
      setErrorMsg(descCheck.error);
      return;
    }

    const phoneCheck = validatePhoneNumber(phone, true);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.error);
      return;
    }

    const budgetCheck = validateCurrency(budget, { min: 10, max: 200000, required: false });
    if (!budgetCheck.valid) {
      setErrorMsg(budgetCheck.error);
      return;
    }

    const deadlineCheck = validateServiceDeadline(deadline, { required: true });
    if (!deadlineCheck.valid) {
      setErrorMsg(deadlineCheck.error);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const clientId = currentUser.uid || currentUser.id || 'usr_guest';
      const providerId = service.createdBy || service.providerUid || '';

      const order = await createServiceOrder({
        serviceId: service.firestoreId || service.id,
        serviceTitle,
        providerId,
        providerUid: providerId,
        providerName,
        providerEmail: service.providerEmail || '',
        clientId,
        clientUid: clientId,
        clientName,
        clientRole: isCompanyUser ? 'empresa' : (currentUser?.role || 'cliente'),
        isCompanyOrder: isCompanyUser,
        clientEmail: (currentUser.email || '').toLowerCase().trim(),
        clientPhone: phone || currentUser.phone || currentUser.contactPhone || '',
        city,
        description: description.trim(),
        budget: budget.trim() || 'A combinar',
        deadline: deadline.trim() || 'A combinar com o prestador'
      });

      showToast('🎉 Demanda de serviço enviada com sucesso! O prestador receberá a notificação.');
      if (onSuccess) onSuccess(order);
      onClose();
    } catch (err) {
      console.error('[SolicitarServicoModal] Erro ao enviar solicitação:', err);
      setErrorMsg('Erro ao registrar a solicitação no sistema. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100 dark:border-slate-800 overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        {/* Header Profissional com Gradiente */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Fechar formulário"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-1.5 uppercase tracking-wider">
            <Sparkles size={14} className="text-teal-300" />
            <span>Solicitação Formal de Serviço / Orçamento</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">{serviceTitle}</h2>

          <div className="flex items-center justify-between text-xs text-blue-200 mt-2 pt-2 border-t border-white/15 flex-wrap gap-2">
            <p>
              Prestador: <span className="font-semibold text-white">{providerName}</span> • {service.city || 'Vale do Ivaí'}
            </p>
            {currentUser && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 text-[11px] font-semibold text-sky-200">
                {isCompanyUser ? <Building2 size={13} className="text-amber-300" /> : null}
                <span>{isCompanyUser ? 'Empresa Solicitante:' : 'Solicitante:'}</span>
                <strong className="text-white">{clientName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Formulário com Validação Aprimorada */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2.5 text-xs font-medium text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campo Descrição da Demanda */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-primary-blue" />
                <span>Descrição da Demanda / O que você precisa?</span>
                <span className="text-red-500">*</span>
              </label>

              {/* Indicador de Validação e Contador */}
              <div className="flex items-center gap-2 text-[11px]">
                {descVal.valid ? (
                  <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Escopo Válido
                  </span>
                ) : description.trim().length > 0 && description.trim().length < 20 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Faltam {20 - description.trim().length} {20 - description.trim().length === 1 ? 'letra' : 'letras'}
                  </span>
                ) : description.trim().length >= 20 && !descVal.valid ? (
                  <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                    <AlertCircle size={13} /> {descVal.errorTitle || 'Revise o texto'}
                  </span>
                ) : null}
                <span className="font-mono text-gray-400 dark:text-slate-500">
                  {description.length}/800
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  setErrorMsg('');
                }}
                onBlur={() => setTouchedDesc(true)}
                placeholder="Ex: Preciso de uma reforma na fiação do escritório com 4 tomadas novas e revisão do disjuntor principal..."
                className={`input w-full text-xs sm:text-sm resize-none rounded-2xl p-3.5 leading-relaxed transition-all ${
                  (touchedDesc || description.trim().length >= 20) && !descVal.valid && description.trim().length > 0
                    ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20 dark:bg-red-950/10'
                    : descVal.valid
                    ? 'border-green-400 focus:ring-green-400 focus:border-green-500'
                    : ''
                }`}
              />
            </div>

            {/* Alerta Detalhado de Validação da Descrição */}
            {(touchedDesc || description.trim().length >= 20) && !descVal.valid && description.trim().length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-xs font-medium text-red-700 dark:text-red-300 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">{descVal.errorTitle}:</span>
                  <span>{descVal.error}</span>
                </div>
              </div>
            )}

            {/* Sugestões Rápidas de Demanda */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                <ThumbsUp size={12} className="text-primary-blue" />
                <span>Ideias rápidas (clique para adicionar ao escopo):</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {REQUEST_SUGGESTION_CHIPS.map((chip, idx) => {
                  const isAdded = description.includes(chip);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                        isAdded
                          ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-800 border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isAdded ? <Check size={11} className="text-primary-blue" /> : <Sparkles size={11} className="text-primary-blue" />}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cidade e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Cidade do Atendimento
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="input pl-9.5 w-full text-xs font-semibold rounded-xl"
                >
                  {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Seu WhatsApp / Telefone <span className="text-red-500">*</span>
                </label>
                {phoneVal.valid && phone.length >= 14 && (
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 size={11} /> Válido
                  </span>
                )}
              </div>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => {
                    setPhone(maskPhone(e.target.value));
                    setErrorMsg('');
                  }}
                  onBlur={() => setTouchedPhone(true)}
                  placeholder="(43) 99999-0000"
                  className={`input pl-9.5 w-full text-xs rounded-xl ${
                    touchedPhone && !phoneVal.valid ? 'border-red-400 focus:ring-red-400' : ''
                  }`}
                />
              </div>
              {touchedPhone && !phoneVal.valid && (
                <span className="text-[10px] text-red-500 mt-1 block">
                  {phoneVal.error || 'Informe um telefone com DDD válido.'}
                </span>
              )}
            </div>
          </div>

          {/* Orçamento Estimado & Prazo Desejado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Orçamento Estimado
                </label>
                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                  Digita 1500 &rarr; R$ 1.500,00
                </span>
              </div>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                <input
                  type="text"
                  value={budget}
                  onChange={handleBudgetChange}
                  onBlur={handleBudgetBlur}
                  placeholder="Ex: R$ 1.500,00 ou A combinar"
                  className={`input pl-9.5 w-full text-xs font-semibold rounded-xl ${
                    !budgetVal.valid ? 'border-amber-400' : ''
                  }`}
                />
              </div>

              {/* Botões Rápidos de Orçamento */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {QUICK_BUDGET_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBudget(opt)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all border cursor-pointer ${
                      budget === opt
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Prazo Desejado <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  {deadlineVal.valid && deadline.trim().length > 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 size={11} /> Válido
                    </span>
                  ) : (touchedDeadline || deadline.trim().length >= 3) && !deadlineVal.valid ? (
                    <span className="text-red-500 font-bold flex items-center gap-0.5">
                      <AlertCircle size={11} /> {deadlineVal.errorTitle || 'Inválido'}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={deadline}
                  onChange={e => {
                    setDeadline(e.target.value);
                    setErrorMsg('');
                  }}
                  onBlur={() => setTouchedDeadline(true)}
                  placeholder="Ex: Até sexta-feira / Imediato"
                  className={`input pl-9.5 w-full text-xs rounded-xl transition-all ${
                    (touchedDeadline || deadline.trim().length >= 3) && !deadlineVal.valid
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20 dark:bg-red-950/10'
                      : deadlineVal.valid && deadline.trim().length > 0
                      ? 'border-green-400'
                      : ''
                  }`}
                />
              </div>

              {/* Alerta de Erro do Prazo */}
              {(touchedDeadline || deadline.trim().length >= 3) && !deadlineVal.valid && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle size={11} className="shrink-0" />
                  {deadlineVal.error}
                </span>
              )}

              {/* Botões Rápidos de Prazo */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {QUICK_DEADLINE_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setDeadline(opt);
                      setTouchedDeadline(true);
                      setErrorMsg('');
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all border cursor-pointer ${
                      deadline === opt
                        ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 font-bold shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer de Envio */}
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              * O prestador receberá os detalhes e responderá pelo chat.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-outline btn-sm text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !descVal.valid || !phoneVal.valid || !budgetVal.valid || !deadlineVal.valid}
                className={`btn btn-sm text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer ${
                  descVal.valid && phoneVal.valid && budgetVal.valid && deadlineVal.valid
                    ? 'btn-primary'
                    : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send size={13} />
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
