import { MapPin, Eye, ShieldCheck, Bookmark, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { calculateMatchScore, safeSkillsArray, isJobFavorited, UserRole } from '../lib/ivaiConecta';
import { getUserApplications, isPjOrFreelanceJob, isInternshipJob } from '../services/jobsService';

export default function JobCard({ job, matchScore, onSelect }) {
  const { currentUser, favoriteJobs = [], toggleFavoriteJob, showToast } = useAppStore();

  if (!job || typeof job !== 'object') return null;

  const id = job.id || job.firestoreId || '';
  const title = job.title || 'Vaga de Emprego';
  const company = job.company || 'Empresa Regional';
  const companyLogo = job.companyLogo;
  const city = job.city || 'Ivaiporã';
  const type = job.type || 'Tempo Integral';

  const requiredSkills = safeSkillsArray(job.requiredSkills);
  const benefits = Array.isArray(job.benefits)
    ? job.benefits.map(b => String(b || '').trim()).filter(Boolean)
    : (typeof job.benefits === 'string' ? job.benefits.split(',').map(s => s.trim()).filter(Boolean) : []);

  const isFavorite = isJobFavorited(job, favoriteJobs);
  const userRole = String(currentUser?.role || '').toLowerCase().trim();
  const isStudent = userRole === UserRole.ALUNO || userRole === 'estudante' || userRole === 'student';
  const isStandardCandidate = userRole === 'candidato';
  const isFreelancer = userRole === UserRole.FREELANCER || userRole === 'prestador';
  const isCompany = Boolean(userRole === UserRole.EMPRESA || userRole === 'company' || userRole === 'recrutador');

  const isPj = isPjOrFreelanceJob(job);
  const isInternship = isInternshipJob(job);

  // Freelancer só visualiza Match para vagas PJ/Freelance
  // Candidato tradicional só visualiza Match para vagas não-estágio
  // Aluno visualiza Match
  const canSeeMatch = Boolean(
    currentUser && (
      isStudent ||
      (isStandardCandidate && !isInternship) ||
      (isFreelancer && isPj)
    )
  );

  const canApplyOrPropose = isStudent || isStandardCandidate || isFreelancer;

  const isOwner = isCompany && currentUser && (
    (job.createdBy && currentUser?.uid && String(job.createdBy) === String(currentUser.uid)) ||
    (job.createdBy && currentUser?.id && String(job.createdBy) === String(currentUser.id)) ||
    (job.createdBy && currentUser?.email && String(job.createdBy).toLowerCase() === String(currentUser.email).toLowerCase()) ||
    (currentUser?.name && job.company && job.company.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
    (currentUser?.razaoSocial && job.company && job.company.toLowerCase().trim() === currentUser.razaoSocial.toLowerCase().trim()) ||
    (currentUser?.nomeFantasia && job.company && job.company.toLowerCase().trim() === currentUser.nomeFantasia.toLowerCase().trim())
  );

  const userUid = currentUser?.uid || currentUser?.id;
  const userEmail = currentUser?.email?.toLowerCase().trim();
  const jobIds = [String(job.id || ''), String(job.firestoreId || ''), String(id)].filter(Boolean);
  
  const hasApplied = canApplyOrPropose && (getUserApplications() || []).some(a => {
    const matchesJob = jobIds.includes(String(a.jobId || '')) ||
                       (a.firestoreJobId && jobIds.includes(String(a.firestoreJobId))) ||
                       (a.originalJobId && jobIds.includes(String(a.originalJobId)));
    const matchesUser = (userUid && (String(a.candidateUid) === String(userUid) || String(a.candidateId) === String(userUid))) ||
                        (userEmail && String(a.candidateEmail || '').toLowerCase().trim() === userEmail);
    return matchesJob && matchesUser;
  });

  // Compute match score safely
  const userSkills = safeSkillsArray(currentUser?.skills);
  const computedScore = matchScore ?? (canSeeMatch ? calculateMatchScore(userSkills, requiredSkills, {
    userCity: currentUser?.city,
    jobCity: city,
    isVerifiedStudent: currentUser?.isVerifiedStudent,
    endorsementsCount: (currentUser?.endorsements?.length || currentUser?.endorsementCount || 0)
  }) : null);

  const isHighMatch = typeof computedScore === 'number' && computedScore >= 75;

  const handleClick = (e) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(job);
    }
  };

  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavoriteJob(job);
    showToast(added ? '⭐ Vaga salva em Minhas Candidaturas / Favoritos!' : 'Vaga removida dos Favoritos.');
  };

  return (
    <div className="card p-5 sm:p-5.5 gap-3.5 hover:border-primary-blue/40 transition-all group flex flex-col justify-between h-full relative rounded-2xl sm:rounded-3xl">
      <div className="space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'}
              alt={company}
              className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 shadow-2xs"
            />
            <div className="min-w-0">
              <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight group-hover:text-primary-blue dark:group-hover:text-blue-400 transition-colors truncate">
                {company}
              </div>
              <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-[11px]">
                  <ShieldCheck size={12} className="text-green-600 dark:text-green-400 shrink-0" />
                  {job.isVerifiedCompany ? 'CNPJ Validado · Vaga Verificada' : 'Vaga Ativa'}
                </span>
                {hasApplied && (
                  <span className="text-[10px] font-bold bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                    <Check size={10} strokeWidth={3} /> {isFreelancer && isPj ? 'Proposta Enviada' : 'Inscrito'}
                  </span>
                )}
                {isPj && (
                  <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                    PJ / Demanda
                  </span>
                )}
                {isOwner && (
                  <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-1.5 py-0.2 rounded">
                    Sua Empresa
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteToggle}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 hover:text-amber-500'
              }`}
              title={isFavorite ? 'Remover dos Favoritos' : 'Salvar Vaga nos Favoritos'}
              aria-label="Favoritar vaga"
            >
              <Bookmark size={15} className={isFavorite ? 'fill-amber-500' : ''} />
            </button>

            {/* Match Score Badge */}
            {canSeeMatch && typeof computedScore === 'number' && (
              <span className={`badge-match text-[11px] px-2.5 py-0.5 font-extrabold ${isHighMatch ? 'badge-match-high' : ''}`}>
                {computedScore}% Match
              </span>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold font-heading text-gray-900 dark:text-white leading-snug group-hover:text-primary-blue dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300 flex-wrap">
          <span className="flex items-center gap-1 font-medium"><MapPin size={13} className="shrink-0 text-primary-blue" />{city}</span>
          <span className="text-gray-400 dark:text-slate-600">·</span>
          <span className="font-semibold text-gray-700 dark:text-slate-300">{type}</span>
        </div>

        {/* Benefits Badges */}
        {benefits.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {benefits.slice(0, 2).map((b, i) => (
              <span key={i} className="text-[11px] font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200/70 dark:border-green-800/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <Check size={11} strokeWidth={3} /> {b}
              </span>
            ))}
            {benefits.length > 2 && (
              <span className="text-[11px] text-gray-400 dark:text-slate-400 self-center font-bold">+{benefits.length - 2}</span>
            )}
          </div>
        )}

        {/* Skills */}
        {requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {requiredSkills.slice(0, 3).map(skill => (
              <span key={skill} className="tag text-[11px] px-2 py-0.5">{skill}</span>
            ))}
            {requiredSkills.length > 3 && (
              <span className="text-[11px] text-gray-400 dark:text-slate-400 self-center font-bold">+{requiredSkills.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
        <Link
          to={`/vagas?jobId=${id}`}
          onClick={handleClick}
          className={`btn btn-sm w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl shadow-xs ${
            isOwner ? 'btn-teal' : 'btn-primary'
          }`}
        >
          <Eye size={14} /> {isOwner ? 'Gerenciar Minha Vaga' : 'Ver Detalhes da Vaga'}
        </Link>
      </div>
    </div>
  );
}
