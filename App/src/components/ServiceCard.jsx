import { Link } from 'react-router-dom';
import { Star, MessageSquare, Trash2, User, ExternalLink } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { deleteService, DEFAULT_AVATAR } from '../lib/ivaiConecta';

export default function ServiceCard({ service, onDelete }) {
  const {
    id, title, name, providerName, category, city, rating,
    reviewsCount, badge, description, providerEmail, avatar, createdBy
  } = service;
  const { currentUser, showToast, startChatWith } = useAppStore();

  const serviceTitle = title || name || category || 'Serviço Profissional';
  const provider = providerName || 'Profissional Regional';
  const providerIdentifier = createdBy || providerEmail || id;
  const profileUrl = `/freelancer/${providerIdentifier}`;

  const isOwner = currentUser && (
    (createdBy && currentUser.uid && String(createdBy) === String(currentUser.uid)) ||
    (createdBy && currentUser.id && String(createdBy) === String(currentUser.id)) ||
    (createdBy && currentUser.email && String(createdBy).toLowerCase() === String(currentUser.email).toLowerCase()) ||
    (providerEmail && currentUser.email && providerEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
    (currentUser.name && providerName && currentUser.name.toLowerCase().trim() === providerName.toLowerCase().trim())
  );

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Deseja remover o anúncio de serviço "${serviceTitle}"?`)) {
      deleteService(id);
      showToast('🗑️ Serviço excluído com sucesso.');
      if (onDelete) onDelete(id);
    }
  };

  const handleContactChat = async () => {
    if (!currentUser) {
      showToast('Faça login para conversar com o prestador de serviço!');
      return;
    }

    if (isOwner) {
      showToast('⚠️ Você não pode enviar mensagens para o seu próprio anúncio de serviço.');
      return;
    }

    const targetEmail = providerEmail || `${provider.toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br`;
    const draft = `Olá, vi seu anúncio do serviço "${serviceTitle}" no Ivaí Conecta e gostaria de solicitar um orçamento.`;

    await startChatWith({
      name: provider,
      email: targetEmail,
      role: 'freelancer',
      avatar: avatar || DEFAULT_AVATAR
    }, `Serviço: ${serviceTitle}`, null, draft);
  };

  return (
    <div className="card gap-3 hover:border-primary-blue/40 transition-all flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className="badge-endorsement">{category}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold text-gray-600 dark:text-slate-400">{city}</span>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Excluir este serviço"
              aria-label="Excluir serviço"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{serviceTitle}</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Por</span>
          <Link
            to={profileUrl}
            className="font-semibold text-primary-blue dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {provider}
          </Link>
        </p>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5 text-sm">
        <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
        <span className="font-bold text-gray-800 dark:text-slate-200">
          {typeof rating === 'number' ? rating.toFixed(1) : (rating || '5.0')}
        </span>
        <span className="text-gray-500 dark:text-slate-400 text-xs">
          ({reviewsCount || 0} {(reviewsCount || 0) === 1 ? 'avaliação' : 'avaliações'})
        </span>
        {badge && (
          <span className="ml-auto text-xs font-semibold text-accent-green dark:text-green-400">{badge}</span>
        )}
      </div>

      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed flex-1">{description}</p>

      {/* Actions */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
        <Link
          to={profileUrl}
          className="btn btn-secondary btn-sm flex-1 text-xs gap-1.5 cursor-pointer font-bold justify-center py-2.5 rounded-xl"
        >
          <User size={14} />
          Ver Perfil
        </Link>
        {isOwner ? (
          <div className="text-xs text-center py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary-blue dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60 flex items-center justify-center gap-1">
            <span>✨ Seu anúncio</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleContactChat}
            className="btn btn-primary btn-sm flex-1 text-xs gap-1.5 cursor-pointer font-bold shadow-brand-sm transition-all flex items-center justify-center py-2.5 rounded-xl"
          >
            <MessageSquare size={14} />
            Conversar
          </button>
        )}
      </div>
    </div>
  );
}
