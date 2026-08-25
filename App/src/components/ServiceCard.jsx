import { Star, MessageCircle } from 'lucide-react';
import { generateWhatsAppLink } from '../lib/ivaiConecta';

export default function ServiceCard({ service }) {
  const { providerName, category, city, phone, rating, reviewsCount, badge, description } = service;

  const waLink = generateWhatsAppLink(phone, category, providerName, city);

  return (
    <div className="card gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className="badge-endorsement">{category}</span>
        <span className="text-xs font-bold text-gray-600 dark:text-slate-400 shrink-0">{city}</span>
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
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp btn-sm w-full text-xs gap-1.5"
        >
          <MessageCircle size={13} />
          Contatar via WhatsApp
        </a>
      </div>
    </div>
  );
}
