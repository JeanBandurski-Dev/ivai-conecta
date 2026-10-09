import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function Toast() {
  const { toasts } = useAppStore();
  const [visible, setVisible] = useState({});

  useEffect(() => {
    toasts.forEach(t => {
      setTimeout(() => {
        setVisible(v => (v[t.id] ? v : { ...v, [t.id]: true }));
      }, 10);
    });
  }, [toasts]);

  return (
    <div className="fixed top-6 right-6 sm:bottom-6 sm:top-auto z-[250] flex flex-col gap-3 pointer-events-none max-w-md w-full px-4 sm:px-0">
      {toasts.map(t => {
        const isSuccess = t.type === 'success' ||
          (typeof t.message === 'string' && /sucesso|enviad|concedid|salv|aprovad|parab|conclu/i.test(t.message));
        const isError = t.type === 'error' ||
          (typeof t.message === 'string' && /erro|falha|recusad|inválid|bloquead|duplicad/i.test(t.message));

        return (
          <div
            key={t.id}
            className={`pointer-events-auto transition-all duration-300 rounded-2xl p-4 shadow-2xl flex items-center gap-3 border ${
              visible[t.id] ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
            } ${
              isSuccess
                ? 'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-400 shadow-emerald-950/40'
                : isError
                  ? 'bg-rose-600 dark:bg-rose-600 text-white border-rose-400 shadow-rose-950/40'
                  : 'bg-primary-dark dark:bg-slate-900 text-white border-slate-700 shadow-brand-xl'
            }`}
          >
            <div className="shrink-0">
              {isSuccess ? (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              ) : isError ? (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertCircle size={18} className="text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Info size={18} className="text-primary-blue dark:text-blue-400" />
                </div>
              )}
            </div>
            <div className="text-sm font-semibold leading-snug">
              {t.message}
            </div>
          </div>
        );
      })}
    </div>
  );
}
