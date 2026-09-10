import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Briefcase, Star, MessageSquare, ArrowRight } from 'lucide-react';
import useAppStore from '../store/useAppStore';

export default function CompanyCard({ company }) {
  const { currentUser, showToast, startChatWith } = useAppStore();

  if (!company || typeof company !== 'object') return null;

  const id = company.id || company.uid || encodeURIComponent(company.name);
  const name = company.name || 'Empresa Regional';
  const logo = company.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200';
  const city = company.city || 'Ivaiporã';
  const sector = company.sector || 'Comércio & Serviços';
  const isVerified = Boolean(company.isVerified || company.cnpj);
  const rating = company.rating || 4.9;
  const reviews = company.reviews || 0;
  const perks = Array.isArray(company.perks) ? company.perks : [];
  const activeJobsCount = company.activeJobsCount ?? (company.activeJobs ? company.activeJobs.length : 0);

  const isOwner = currentUser && currentUser.role === 'empresa' && (
    (company.uid && currentUser.uid && String(company.uid) === String(currentUser.uid)) ||
    (company.id && currentUser.id && String(company.id) === String(currentUser.id)) ||
    (company.id && currentUser.uid && String(company.id) === String(currentUser.uid)) ||
    (currentUser.name && company.name && currentUser.name.toLowerCase().trim() === company.name.toLowerCase().trim()) ||
    (currentUser.razaoSocial && company.name && currentUser.razaoSocial.toLowerCase().trim() === company.name.toLowerCase().trim()) ||
    (currentUser.nomeFantasia && company.name && currentUser.nomeFantasia.toLowerCase().trim() === company.name.toLowerCase().trim())
  );

  const handleStartChat = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOwner) {
      showToast('⚠️ Você não pode iniciar uma conversa com sua própria empresa.');
      return;
    }

    const companyEmail = company.email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br`;
    startChatWith({
      name,
      email: companyEmail,
      role: 'empresa',
      avatar: logo
    }, `Contato com Empresa: ${name}`);
  };

  return (
    <div className="card gap-3.5 hover:border-primary-blue/40 transition-all group flex flex-col relative h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logo}
            alt={name}
            className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-slate-700 shadow-xs shrink-0 bg-white p-0.5"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200';
            }}
          />
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-primary-blue dark:group-hover:text-blue-400 transition-colors truncate">
              {name}
            </h3>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-slate-300">
                <MapPin size={12} className="text-gray-400 shrink-0" />
                {city}, PR
              </span>
              <span>·</span>
              <span className="truncate">{sector}</span>
            </div>
          </div>
        </div>

        {/* Verified Badge */}
        {isVerified && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 shrink-0"
            title="Empresa com CNPJ e cadastro verificados"
          >
            <ShieldCheck size={12} className="shrink-0 text-green-600 dark:text-green-400" />
            Verificada
          </span>
        )}
      </div>

      {/* Description */}
      {company.about && (
        <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed mt-1">
          {company.about}
        </p>
      )}

      {/* Rating & Vacancies Pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          <span>{Number(rating).toFixed(1)}</span>
          {reviews > 0 && (
            <span className="text-gray-400 dark:text-slate-500 text-[11px] font-normal">
              ({reviews} {reviews === 1 ? 'avaliação' : 'avaliações'})
            </span>
          )}
        </div>

        {activeJobsCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {activeJobsCount} {activeJobsCount === 1 ? 'vaga aberta' : 'vagas abertas'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
            <Briefcase size={11} className="text-gray-400" />
            Banco Ativo
          </span>
        )}
      </div>

      {/* Perks Badges */}
      {perks.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {perks.slice(0, 3).map((perk, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium bg-gray-50 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 border border-gray-200/60 dark:border-slate-700 px-2 py-0.5 rounded-md"
            >
              {perk}
            </span>
          ))}
          {perks.length > 3 && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 self-center">
              +{perks.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
        <Link
          to={`/empresa/${id}`}
          className="btn btn-outline btn-sm flex-1 text-xs font-bold text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-700 hover:border-primary-blue hover:text-primary-blue flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Ver Perfil &amp; Vagas</span>
          <ArrowRight size={13} />
        </Link>

        {/* Direct Chat with Company */}
        {!isOwner && currentUser?.role !== 'empresa' && (
          <button
            onClick={handleStartChat}
            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-400 hover:bg-primary-blue hover:text-white transition-colors shrink-0 flex items-center justify-center shadow-xs cursor-pointer"
            title={`Iniciar Chat com ${name}`}
            aria-label={`Conversar com a empresa ${name}`}
          >
            <MessageSquare size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
