import { useEffect, useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

/**
 * Reusable Confirmation Modal for Administrative Actions
 */
export default function AdminConfirmModal({
  isOpen,
  title = 'Confirmação',
  message = 'Tem certeza que deseja executar esta ação?',
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  requireReason = false,
  reasonPlaceholder = 'Digite o motivo desta ação...',
  isLoading = false,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isLoading) onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(requireReason ? reason : undefined);
  };

  const isDanger = confirmVariant === 'danger';
  const isWarning = confirmVariant === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                : isWarning
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
            }`}>
              {isDanger ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
            </div>
            <h3 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>

          {requireReason && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                Justificativa / Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-blue dark:focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold rounded-xl text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-red-500/20'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 shadow-amber-500/20'
                : 'bg-primary-blue hover:bg-primary-hover shadow-primary-blue/20'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
