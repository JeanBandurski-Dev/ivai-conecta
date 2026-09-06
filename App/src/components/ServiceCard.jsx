import { useState } from 'react';
import { Star, MessageSquare, Trash2, Phone } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { deleteService } from '../lib/ivaiConecta';
import WhatsAppContactModal from './WhatsAppContactModal';

export default function ServiceCard({ service, onDelete }) {
  const {
    id, title, name, providerName, category, city, rating,
    reviewsCount, badge, description, providerEmail, avatar, createdBy, phone
  } = service;
  const { currentUser, showToast, startChatWith } = useAppStore();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const serviceTitle = title || name || category || 'Serviço Profissional';
  const provider = providerName || 'Profissional Regional';

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

    await startChatWith({
      name: provider,
      email: targetEmail,
      role: 'freelancer',
      avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
    }, `Serviço: ${serviceTitle}`);
  };

  const handleOpenWhatsAppModal = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOwner) {
      showToast('⚠️ Você não pode contatar seu próprio anúncio de serviço.');
      return;
    }

    setShowWhatsAppModal(true);
  };

  return (
    <>
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
            Por <span className="font-semibold text-gray-700 dark:text-slate-300">{provider}</span>
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
            <div className="flex items-center gap-2">
              {/* Botão WhatsApp com modal de opções de mensagem */}
              <button
                type="button"
                onClick={handleOpenWhatsAppModal}
                className="btn bg-[#25D366] hover:bg-[#1EBE5D] text-white btn-sm flex-1 text-xs gap-1.5 cursor-pointer font-bold shadow-xs border-transparent transition-all flex items-center justify-center"
              >
                <Phone size={13} className="fill-current" />
                WhatsApp
              </button>

              {/* Botão Chat Interno Ivaí Conecta */}
              <button
                type="button"
                onClick={handleContactChat}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-primary-blue dark:hover:text-blue-400 text-gray-600 dark:text-slate-300 transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Conversar pelo Chat Interno"
                aria-label="Abrir chat da plataforma"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Interativo de Contato WhatsApp com Presets de Mensagem */}
      {showWhatsAppModal && (
        <WhatsAppContactModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          service={service}
          onOpenChat={handleContactChat}
        />
      )}
    </>
  );
}
