import { useState } from 'react';
import { Star, MessageCircle, Trash2 } from 'lucide-react';
import ContactWhatsAppModal from './ContactWhatsAppModal';
import useAppStore from '../store/useAppStore';
import { deleteService } from '../lib/ivaiConecta';

export default function ServiceCard({ service, onDelete }) {
  const { currentUser, showToast } = useAppStore();
  const { id, providerName, category, city, rating, reviewsCount, badge, description, createdBy } = service;
  const [showModal, setShowModal] = useState(false);

  const isOwner = currentUser && (
    (createdBy && currentUser.uid && String(createdBy) === String(currentUser.uid)) ||
    (createdBy && currentUser.email && String(createdBy).toLowerCase() === String(currentUser.email).toLowerCase()) ||
    (currentUser.name && providerName && currentUser.name.toLowerCase().trim() === providerName.toLowerCase().trim())
  );

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Deseja remover o anúncio de serviço "${category}"?`)) {
      deleteService(id);
      showToast('🗑️ Serviço excluído com sucesso.');
      if (onDelete) onDelete(id);
    }
  };

  return (
    <>
      <div className="card gap-3">
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

        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{providerName}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 text-sm">
          <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
          <span className="font-bold text-gray-800 dark:text-slate-200">{rating}</span>
          <span className="text-gray-500 dark:text-slate-400 text-xs">({reviewsCount} avaliações)</span>
          {badge && (
            <span className="ml-auto text-xs font-semibold text-accent-green dark:text-green-400">{badge}</span>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed flex-1">{description}</p>

        {/* Action */}
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn btn-whatsapp btn-sm w-full text-xs gap-1.5 cursor-pointer"
          >
            <MessageCircle size={13} />
            Contatar via WhatsApp
          </button>
        </div>
      </div>

      {showModal && (
        <ContactWhatsAppModal
          service={service}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
