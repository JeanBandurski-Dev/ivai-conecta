import { Star, MessageSquare } from 'lucide-react';
import useAppStore from '../store/useAppStore';

export default function ServiceCard({ service }) {
  const { title, name, providerName, category, city, rating, reviewsCount, badge, description, providerEmail, avatar } = service;
  const { currentUser, showToast, startChatWith } = useAppStore();

  const serviceTitle = title || name || category || 'Serviço Profissional';
  const provider = providerName || 'Profissional Regional';

  const handleContact = async () => {
    if (!currentUser) {
      showToast('Faça login para conversar com o prestador de serviço!');
      return;
    }

    const targetEmail = providerEmail || `${provider.toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br`;

    await startChatWith({
      name: provider,
      email: targetEmail,
      role: 'freelancer',
      avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
    }, `Serviço: ${serviceTitle}`);
  };

  return (
    <div className="card gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className="badge-endorsement">{category}</span>
        <span className="text-xs font-bold text-gray-600 dark:text-slate-400 shrink-0">{city}</span>
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{serviceTitle}</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Por <span className="font-semibold text-gray-700 dark:text-slate-300">{provider}</span>
        </p>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5 text-sm">
        <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
        <span className="font-bold text-gray-800 dark:text-slate-200">{typeof rating === 'number' ? rating.toFixed(1) : (rating || '5.0')}</span>
        <span className="text-gray-500 dark:text-slate-400 text-xs">
          ({reviewsCount || 0} {(reviewsCount || 0) === 1 ? 'avaliação' : 'avaliações'})
        </span>
        {badge && (
          <span className="ml-auto text-xs font-semibold text-accent-green dark:text-green-400">{badge}</span>
        )}
      </div>

      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed flex-1">{description}</p>

      {/* Action */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleContact}
          className="btn btn-primary btn-sm w-full text-xs gap-1.5 cursor-pointer font-bold"
        >
          <MessageSquare size={14} />
          Conversar no Chat
        </button>
      </div>
    </div>
  );
}
