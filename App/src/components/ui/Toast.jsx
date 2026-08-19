import { useEffect, useState } from 'react';
import useAppStore from '../../store/useAppStore';

export default function Toast() {
  const { toasts } = useAppStore();
  const [visible, setVisible] = useState({});

  useEffect(() => {
    toasts.forEach(t => {
      if (!visible[t.id]) {
        setTimeout(() => setVisible(v => ({ ...v, [t.id]: true })), 10);
      }
    });
  }, [toasts]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`bg-primary-dark text-white text-sm font-medium px-5 py-3.5 rounded-xl shadow-brand-xl pointer-events-auto transition-all duration-300 ${
            visible[t.id] ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
