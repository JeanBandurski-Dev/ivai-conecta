import { useEffect, useRef } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

/**
 * CustomConfirmModal
 * Modal global padronizado de acordo com o design system do Ivaí Conecta.
 * Substitui os alerts e confirms nativos do navegador por uma experiência
 * moderna, elegante, responsiva e com suporte a temas claro/escuro.
 */
export default function CustomConfirmModal() {
  const { confirmDialog, closeConfirm } = useAppStore();
  const confirmBtnRef = useRef(null);

  // Fecha com ESC e confirma com ENTER
  useEffect(() => {
    if (!confirmDialog) return;

    // Foca automaticamente no botão de ação principal
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeConfirm(false);
      } else if (e.key === 'Enter' && !confirmDialog.isAlert) {
        // Se o foco não estiver no botão de cancelar, dá enter para confirmar
        if (document.activeElement?.getAttribute('data-dialog-cancel') !== 'true') {
          e.preventDefault();
          closeConfirm(true);
        }
      }
    };

    // Bloqueia rolagem do body enquanto o modal estiver aberto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmDialog, closeConfirm]);

  if (!confirmDialog) return null;

  const {
    title = 'Confirmação',
    message = '',
    confirmText = confirmDialog.isAlert ? 'Entendi' : 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'primary',
    badge = null,
    isAlert = false
  } = confirmDialog;

  // Configurações visuais por variante
  const variantStyles = {
    primary: {
      bar: 'from-blue-600 to-indigo-600',
      iconBg: 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 ring-4 ring-blue-500/10',
      icon: HelpCircle,
      confirmBtn: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-600/30'
    },
    danger: {
      bar: 'from-rose-600 to-red-600',
      iconBg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 ring-4 ring-rose-500/10',
      icon: AlertTriangle,
      confirmBtn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30'
    },
    warning: {
      bar: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 ring-4 ring-amber-500/10',
      icon: AlertCircle,
      confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-600/30'
    },
    success: {
      bar: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/10',
      icon: CheckCircle2,
      confirmBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30'
    },
    info: {
      bar: 'from-sky-500 to-blue-600',
      iconBg: 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 ring-4 ring-sky-500/10',
      icon: Info,
      confirmBtn: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/30'
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const IconComponent = currentVariant.icon;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => closeConfirm(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-dialog-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl dark:shadow-brand-xl overflow-hidden transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de destaque sutil */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${currentVariant.bar}`} />

        {/* Botão fechar (X) no topo direito */}
        <button
          onClick={() => closeConfirm(false)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Cabeçalho com Ícone e Título */}
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${currentVariant.iconBg}`}>
              <IconComponent size={24} />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              {badge && (
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-1.5">
                  {badge}
                </span>
              )}
              <h3
                id="custom-dialog-title"
                className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight"
              >
                {title}
              </h3>
            </div>
          </div>

          {/* Mensagem / Corpo */}
          <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line pl-0.5">
            {message}
          </div>

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {!isAlert && (
              <button
                type="button"
                data-dialog-cancel="true"
                onClick={() => closeConfirm(false)}
                className="btn px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
              >
                {cancelText}
              </button>
            )}

            <button
              ref={confirmBtnRef}
              type="button"
              onClick={() => closeConfirm(true)}
              className={`btn px-5 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${currentVariant.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
