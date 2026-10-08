import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Trash2, FileText } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { deleteService } from '../lib/ivaiConecta';
import { isGenericPlaceholderAvatar } from '../services/chatService';
import SolicitarServicoModal from './SolicitarServicoModal';

export default function ServiceCard({ service, onDelete, onRequestService }) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const {
    id, title, name, providerName, category, city, rating,
    reviewsCount, badge, description, providerEmail, avatar, createdBy, providerUid
  } = service;
  const { currentUser, showToast, startChatWith, showConfirm } = useAppStore();

  const serviceTitle = title || name || category || 'Serviço Profissional';
  const provider = providerName || 'Profissional Regional';

  const isOwner = Boolean(
    currentUser && (
      (createdBy && currentUser.uid && String(createdBy) === String(currentUser.uid)) ||
      (createdBy && currentUser.id && String(createdBy) === String(currentUser.id)) ||
      (providerUid && currentUser.uid && String(providerUid) === String(currentUser.uid)) ||
      (providerUid && currentUser.id && String(providerUid) === String(currentUser.id))
    )
  );

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Remover Anúncio de Serviço',
      message: `Tem certeza que deseja remover o anúncio de serviço "${serviceTitle}"?\nEsta ação não poderá ser desfeita.`,
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar',
      variant: 'danger',
      badge: 'Exclusão'
    });
    if (confirmed) {
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

    const targetEmail = providerEmail || service.providerEmail || '';
    const targetUid = createdBy || service.providerUid || service.userId || '';

    if (!targetEmail && !targetUid) {
      showToast('Prestador de serviço não possui canal de chat configurado.');
      return;
    }

    const draft = `Olá, vi seu anúncio do serviço "${serviceTitle}" no Ivaí Conecta e gostaria de solicitar um orçamento.`;

    await startChatWith({
      name: provider,
      email: targetEmail,
      uid: targetUid,
      role: 'freelancer',
      avatar: (avatar && !isGenericPlaceholderAvatar(avatar)) ? avatar : ''
    }, `Serviço: ${serviceTitle}`, null, draft);
  };

  const providerProfileId = createdBy || service.providerUid || service.userId;

  return (
    <div className="card gap-3 hover:border-primary-blue/30 transition-all flex flex-col h-full">
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
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Por{' '}
          {providerProfileId ? (
            <Link
              to={`/freelancer/${providerProfileId}`}
              className="font-semibold text-gray-700 dark:text-slate-300 hover:text-primary-blue hover:underline transition-colors"
            >
              {provider}
            </Link>
          ) : (
            <span className="font-semibold text-gray-700 dark:text-slate-300">{provider}</span>
          )}
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
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
        {isOwner ? (
          <div className="text-xs text-center py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary-blue dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60 flex items-center justify-center gap-1.5">
            <span>✨ Seu anúncio de serviço</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleContactChat}
              className="btn btn-outline btn-sm text-xs gap-1.5 cursor-pointer font-bold py-2 rounded-xl flex items-center justify-center border-gray-200 dark:border-slate-700 hover:border-primary-blue"
            >
              <MessageSquare size={14} />
              Chat
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  showToast('Faça login para solicitar este serviço!');
                  return;
                }
                if (onRequestService) {
                  onRequestService(service);
                } else {
                  setShowOrderModal(true);
                }
              }}
              className="btn btn-primary btn-sm text-xs gap-1.5 cursor-pointer font-bold shadow-brand-sm py-2 rounded-xl flex items-center justify-center"
            >
              <FileText size={14} />
              Solicitar
            </button>
          </div>
        )}
      </div>

      {!onRequestService && showOrderModal && (
        <SolicitarServicoModal
          service={service}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  );
}
