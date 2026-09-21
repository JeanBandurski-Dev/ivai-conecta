import { useState } from 'react';
import { X, Star, Sparkles, Send, AlertCircle } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { submitServiceReview } from '../lib/ivaiConecta';

export default function AvaliarServicoModal({ order, onClose, onSuccess }) {
  const { currentUser, showToast } = useAppStore();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Por favor, deixe um comentário sobre a sua experiência com o atendimento.');
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

      showToast('Avaliação registrada com sucesso! Obrigado pelo feedback.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('[AvaliarServicoModal] Erro ao enviar avaliação:', err);
      setErrorMsg('Erro ao salvar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop z-50 flex items-center justify-center p-4">
      <div className="modal-box w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-amber-100 mb-1">
            <Sparkles size={14} /> Avaliação de Atendimento
          </div>
          <h2 className="text-xl font-bold font-heading">{order.serviceTitle || 'Serviço Realizado'}</h2>
          <p className="text-xs text-amber-100 mt-0.5">
            Prestador: <strong className="text-white">{order.providerName || 'Profissional'}</strong>
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Selector */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-2">
              Como você avalia o serviço prestado?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 dark:text-slate-600'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1.5 inline-block">
              {rating === 5 && 'Excelente (5.0)'}
              {rating === 4 && 'Muito Bom (4.0)'}
              {rating === 3 && 'Bom / Regular (3.0)'}
              {rating === 2 && 'Insatisfatório (2.0)'}
              {rating === 1 && 'Muito Ruim (1.0)'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              Seu depoimento / Comentário <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Conte como foi a pontualidade, qualidade e comunicação do prestador..."
              className="input w-full text-sm resize-none rounded-2xl"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-outline btn-sm text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn bg-amber-500 hover:bg-amber-600 text-white btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Send size={14} />
              {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
