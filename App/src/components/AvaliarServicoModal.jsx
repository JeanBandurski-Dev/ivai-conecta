import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Star, Sparkles, Send, AlertCircle, CheckCircle2, MessageSquare,
  ThumbsUp, Check
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { submitServiceReview } from '../lib/ivaiConecta';
import { validateReviewText, REVIEW_SUGGESTION_CHIPS } from '../utils/formValidation';

export default function AvaliarServicoModal({ order, onClose, onSuccess }) {
  const { currentUser, showToast } = useAppStore();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!order) return null;

  const validation = validateReviewText(comment, { minLength: 15, maxLength: 500 });
  const isTooShort = comment.trim().length > 0 && comment.trim().length < 15;
  const isValid = validation.valid;

  const handleChipClick = (chipText) => {
    setErrorMsg('');
    setTouched(true);
    setComment(prev => {
      const current = prev.trim();
      if (!current) return chipText;
      if (current.includes(chipText)) return current;
      return `${current} ${chipText}`;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    const val = validateReviewText(comment, { minLength: 15, maxLength: 500 });
    if (!val.valid) {
      setErrorMsg(val.error);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await submitServiceReview(order.firestoreId || order.id, {
        rating,
        comment: comment.trim(),
        serviceId: order.serviceId,
        clientName: currentUser?.name || order.clientName || 'Cliente Ivaí Conecta',
        clientAvatar: currentUser?.avatar || ''
      });

      showToast('🎉 Avaliação registrada com sucesso! A nota do prestador foi atualizada.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('[AvaliarServicoModal] Erro ao enviar avaliação:', err);
      setErrorMsg('Erro ao salvar avaliação no banco de dados. Tente novamente.');
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
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-slate-800 overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        {/* Header Premium com Gradiente */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Fechar avaliação"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-amber-100 mb-1.5 uppercase tracking-wider">
            <Sparkles size={14} className="text-yellow-200" />
            <span>Avaliação de Atendimento Concluído</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            {order.serviceTitle || 'Serviço Realizado'}
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            Prestador: <strong className="text-white font-semibold">{order.providerName || 'Profissional'}</strong> • {order.city || 'Vale do Ivaí'}
          </p>
        </div>

        {/* Body do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2.5 text-xs font-medium text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seletor de Estrelas */}
          <div className="text-center py-2 px-4 rounded-2xl bg-amber-50/60 dark:bg-slate-800/50 border border-amber-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
              Como você avalia a qualidade e o atendimento prestado?
            </label>
            <div className="flex items-center justify-center gap-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                  title={`${star} estrelas`}
                >
                  <Star
                    size={32}
                    className={`${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
                        : 'text-gray-300 dark:text-slate-600'
                    } transition-all duration-150`}
                  />
                </button>
              ))}
            </div>
            <div className="mt-2 font-bold text-xs">
              <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs ${
                rating === 5 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                rating === 4 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                rating === 3 ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                {rating === 5 && '⭐⭐⭐⭐⭐ Excelente (5.0) — Superou as expectativas'}
                {rating === 4 && '⭐⭐⭐⭐ Muito Bom (4.0) — Atendimento satisfatório'}
                {rating === 3 && '⭐⭐⭐ Bom / Regular (3.0) — Cumpriu o acordado'}
                {rating === 2 && '⭐⭐ Insatisfatório (2.0) — Teve ressalvas'}
                {rating === 1 && '⭐ Muito Ruim (1.0) — Não atendeu aos critérios'}
              </span>
            </div>
          </div>

          {/* Campo de Depoimento Formatado e Destacado */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-amber-500" />
                <span>Seu depoimento / Comentário</span>
                <span className="text-red-500">*</span>
              </label>

              {/* Indicador de Validação e Contador */}
              <div className="flex items-center gap-2 text-[11px]">
                {isValid ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Válido
                  </span>
                ) : isTooShort ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Faltam {15 - comment.trim().length} letras
                  </span>
                ) : null}
                <span className={`font-mono font-medium ${
                  comment.length > 450 ? 'text-amber-600' : 'text-gray-400 dark:text-slate-500'
                }`}>
                  {comment.length}/500
                </span>
              </div>
            </div>

            {/* Container do Textarea com foco e bordas visíveis */}
            <div className="relative">
              <textarea
                required
                rows={4}
                value={comment}
                onChange={e => {
                  setComment(e.target.value);
                  setErrorMsg('');
                }}
                onBlur={() => setTouched(true)}
                placeholder="Conte com detalhes como foi o atendimento, a pontualidade, qualidade e comunicação do prestador..."
                className={`input w-full text-xs sm:text-sm resize-none rounded-2xl p-3.5 leading-relaxed transition-all ${
                  touched && !isValid && isTooShort
                    ? 'border-amber-400 dark:border-amber-500 focus:ring-amber-400'
                    : isValid
                    ? 'border-green-400 dark:border-green-500/80 focus:ring-green-400'
                    : ''
                }`}
              />
            </div>

            {/* Sugestões Rápidas de 1 Clique ("Ideias prontas para clicar e avaliar") */}
            <div className="pt-1.5 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                <ThumbsUp size={12} className="text-amber-500" />
                <span>Sugestões rápidas (clique para adicionar ao seu depoimento):</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {REVIEW_SUGGESTION_CHIPS.map((chip, idx) => {
                  const isAlreadyAdded = comment.includes(chip);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                        isAlreadyAdded
                          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-gray-100 hover:bg-amber-50 text-gray-700 hover:text-amber-800 border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isAlreadyAdded ? <Check size={11} className="text-amber-600" /> : <Sparkles size={11} className="text-amber-400" />}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer de Ações */}
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              * Mínimo de 15 caracteres para garantir uma avaliação legítima.
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
                disabled={isSubmitting}
                className={`btn btn-sm text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer ${
                  isValid
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send size={13} />
                {isSubmitting ? 'Enviando Avaliação...' : 'Publicar Avaliação'}
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
