import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X, MapPin, Building2, Clock, DollarSign, CheckCircle2,
  Sparkles, Briefcase, Gift, Send, ShieldCheck, MessageSquare, XCircle, RotateCcw, Lightbulb, Users, Bookmark,
  Wrench, GraduationCap, ShieldAlert, AlertCircle, ExternalLink, Loader2
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  applyToJob, calculateMatchScore, isSkillMatch, getUsersDB,
  updateJobStatus, safeSkillsArray, getUserApplications, subscribeToApplications, isJobFavorited
} from '../lib/ivaiConecta';
import {
  getApplicationEligibility, isPjOrFreelanceJob, isInternshipJob
} from '../services/jobsService';

export default function JobDetailModal({ job, onClose, matchScore }) {
  const { currentUser, showToast, startChatWith, favoriteJobs = [], toggleFavoriteJob } = useAppStore();
  const [applied, setApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(job?.status || 'Ativa');

  if (!job || typeof job !== 'object') return null;

  const jobId = job.id || job.firestoreId || '';
  const title = job.title || 'Oportunidade Profissional';
  const company = job.company || 'Empresa Regional';
  const companyLogo = job.companyLogo;
  const city = job.city || 'Ivaiporã';
  const type = job.type || 'Tempo Integral';

  const requiredSkills = safeSkillsArray(job.requiredSkills);
  const benefits = Array.isArray(job.benefits)
    ? job.benefits.map(b => String(b || '').trim()).filter(Boolean)
    : (typeof job.benefits === 'string' ? job.benefits.split(',').map(s => s.trim()).filter(Boolean) : []);

  const responsibilities = Array.isArray(job.responsibilities)
    ? job.responsibilities.map(r => String(r || '').trim()).filter(Boolean)
    : (typeof job.responsibilities === 'string' ? job.responsibilities.split('\n').map(s => s.trim()).filter(Boolean) : []);

  const userRole = String(currentUser?.role || '').toLowerCase().trim();
  const isStudent = userRole === 'aluno' || userRole === 'estudante' || userRole === 'student';
  const isStandardCandidate = userRole === 'candidato';
  const isFreelancer = userRole === 'freelancer' || userRole === 'prestador';
  const isCandidate = Boolean(currentUser && (isStudent || isStandardCandidate));
  const isCompany = Boolean(userRole === 'empresa' || userRole === 'company' || userRole === 'recrutador');
  const isProfessor = Boolean(userRole === 'professor' || userRole === 'docente' || userRole === 'teacher');

  const isPj = isPjOrFreelanceJob(job);
  const isInternship = isInternshipJob(job);
  const eligibility = getApplicationEligibility(currentUser, job);

  const isJobOwner = isCompany && currentUser && (
    (job.createdBy && currentUser.uid && String(job.createdBy) === String(currentUser.uid)) ||
    (job.companyUid && currentUser.uid && String(job.companyUid) === String(currentUser.uid)) ||
    (job.createdBy && currentUser.id && String(job.createdBy) === String(currentUser.id)) ||
    (job.companyUid && currentUser.id && String(job.companyUid) === String(currentUser.id))
  );

  const isFavorite = isJobFavorited(job, favoriteJobs);

  const handleFavoriteToggle = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const added = toggleFavoriteJob(job);
    showToast(added ? '⭐ Vaga salva em Minhas Candidaturas / Favoritos!' : 'Vaga removida dos Favoritos.');
  };

  // Freelancers só visualizam Match para vagas PJ/Freelance
  // Candidatos padrão só visualizam Match para vagas não-estágio
  const canSeeMatch = Boolean(
    currentUser && (
      isStudent ||
      (isStandardCandidate && !isInternship) ||
      (isFreelancer && isPj)
    )
  );
  const userSkills = safeSkillsArray(currentUser?.skills);
  const calculatedScore = matchScore ?? (canSeeMatch ? calculateMatchScore(userSkills, requiredSkills, {
    userCity: currentUser?.city,
    jobCity: city,
    isVerifiedStudent: currentUser?.isVerifiedStudent,
    endorsementsCount: (currentUser?.endorsements?.length || currentUser?.endorsementCount || 0)
  }) : null);

  useEffect(() => {
    if (!currentUser || (!isCandidate && !isFreelancer)) return;
    const userUid = currentUser.uid || currentUser.id;
    const userEmail = currentUser.email?.toLowerCase().trim();
    const possibleJobIds = [
      String(job?.id || ''),
      String(job?.firestoreId || ''),
      String(jobId || '')
    ].filter(Boolean);

    const checkIsApplied = (list) => {
      if (!Array.isArray(list)) return false;
      return list.some(a => {
        const matchesJob = possibleJobIds.includes(String(a.jobId || '')) ||
                           (a.firestoreJobId && possibleJobIds.includes(String(a.firestoreJobId))) ||
                           (a.originalJobId && possibleJobIds.includes(String(a.originalJobId)));
        const matchesUser = (userUid && (String(a.candidateUid) === String(userUid) || String(a.candidateId) === String(userUid))) ||
                            (userEmail && String(a.candidateEmail || '').toLowerCase().trim() === userEmail);
        return matchesJob && matchesUser;
      });
    };

    // Verificação inicial no cache local
    if (checkIsApplied(getUserApplications())) {
      setApplied(true);
    }

    // Assinatura em tempo real de candidaturas
    const unsub = subscribeToApplications(currentUser, (apps) => {
      if (checkIsApplied(apps)) {
        setApplied(true);
      }
    });

    const handleLocalAppsUpdate = () => {
      if (checkIsApplied(getUserApplications())) {
        setApplied(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ivai_applications_updated', handleLocalAppsUpdate);
    }

    return () => {
      if (typeof unsub === 'function') unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('ivai_applications_updated', handleLocalAppsUpdate);
      }
    };
  }, [job, jobId, currentUser, isCandidate, isFreelancer]);

  const handleToggleJobStatus = async () => {
    if (isTogglingStatus) return;
    setIsTogglingStatus(true);
    try {
      const action = currentStatus === 'Ativa' ? 'close' : 'reopen';
      await updateJobStatus(jobId, action);
      const newStatus = action === 'close' ? 'Encerrada' : 'Ativa';
      setCurrentStatus(newStatus);
      showToast(action === 'close' ? 'Vaga encerrada com sucesso!' : 'Vaga reaberta com sucesso!');
    } catch (err) {
      console.error('Erro ao alterar status da vaga:', err);
      showToast('Erro ao alterar status da vaga.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleApply = async () => {
    if (!currentUser) {
      showToast('Faça login como Aluno, Candidato ou Freelancer para se candidatar!');
      return;
    }
    if (!eligibility.canApply) {
      showToast(eligibility.message || 'Candidatura não disponível para seu perfil nesta vaga.');
      return;
    }
    if (applied) {
      showToast(isFreelancer ? 'Você já enviou proposta para esta vaga!' : 'Você já se candidatou a esta vaga!');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await applyToJob(job || jobId, currentUser);
      if (res?.success) {
        setApplied(true);
        showToast(res?.message || (isFreelancer ? 'Proposta PJ enviada com sucesso!' : 'Candidatura realizada com sucesso!'));
      } else {
        showToast(res?.message || 'Não foi possível concluir a candidatura.');
        if (res?.message?.includes('já se candidatou') || res?.message?.includes('já enviou proposta')) {
          setApplied(true);
        }
      }
    } catch {
      showToast('Erro ao processar candidatura. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChat = async () => {
    if (!currentUser) {
      showToast('Faça login para conversar com a empresa!');
      return;
    }

    if (isJobOwner) {
      showToast('⚠️ Você é o autor desta vaga e não pode iniciar uma conversa com sua própria empresa.');
      return;
    }

    // Busca a empresa prioritariamente pelo UID do Firebase
    const companyUid = job.companyUid || job.createdBy;
    const allUsers = getUsersDB() || [];
    let companyUser = allUsers.find(u => 
      (companyUid && (String(u?.uid) === String(companyUid) || String(u?.id) === String(companyUid)))
    );

    let targetEmail = companyUser?.email || 
      (job.recruiterEmail && String(job.recruiterEmail).includes('@') ? job.recruiterEmail : null);

    // Se não encontrou no cache local, busca o documento oficial da empresa no Firestore pelo UID
    if (!targetEmail && companyUid && typeof companyUid === 'string' && companyUid.length > 5 && !companyUid.includes('@')) {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const userDoc = await getDoc(doc(db, 'users', companyUid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          targetEmail = uData.email;
          if (!companyUser) companyUser = { uid: userDoc.id, ...uData };
        }
      } catch (err) {
        console.warn('Erro ao buscar dados da empresa pelo UID:', err);
      }
    }

    if (!targetEmail && (!companyUid || companyUid.includes('@'))) {
      if (job.createdBy && String(job.createdBy).includes('@')) {
        targetEmail = job.createdBy;
      }
    }

    if (!targetEmail && !companyUid) {
      showToast('Esta vaga não possui um canal direto de chat disponível no momento.');
      return;
    }

    const companyTarget = {
      name: company,
      email: targetEmail || '',
      uid: companyUid || companyUser?.uid || companyUser?.id || '',
      role: 'empresa',
      avatar: companyLogo || companyUser?.avatar || ''
    };

    onClose();
    await startChatWith(companyTarget, `Vaga: ${title}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-brand-xl w-full max-w-2xl overflow-hidden my-8 border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>
        
        {/* Header Visual estilo Gupy */}
        <div className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_50%,#0052FF_100%)] text-white p-6 sm:p-8">
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <button
              onClick={handleFavoriteToggle}
              className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                isFavorite
                  ? 'bg-amber-500 border-amber-400 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
              title={isFavorite ? 'Remover dos Favoritos' : 'Salvar Vaga nos Favoritos'}
              aria-label="Favoritar vaga"
            >
              <Bookmark size={17} className={isFavorite ? 'fill-white' : ''} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
              aria-label="Fechar modal"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-start gap-4 sm:gap-5">
            <Link
              to={`/empresa/${encodeURIComponent(job.companyUid || job.createdBy || company)}`}
              onClick={onClose}
              className="shrink-0 group/logo"
              title={`Ver perfil da empresa ${company}`}
            >
              <img
                src={companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'}
                alt={company}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/30 object-cover shadow-brand-md shrink-0 bg-white dark:bg-slate-800 group-hover/logo:scale-105 group-hover/logo:border-white/60 transition-all cursor-pointer"
              />
            </Link>
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Link
                  to={`/empresa/${encodeURIComponent(job.companyUid || job.createdBy || company)}`}
                  onClick={onClose}
                  className="text-xs font-bold uppercase tracking-wider text-accent-sky bg-white/10 hover:bg-white/20 hover:text-white px-2.5 py-0.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={`Ver perfil da empresa ${company}`}
                >
                  <Building2 size={13} />
                  <span>{company}</span>
                  <ExternalLink size={11} className="opacity-75" />
                </Link>
                {currentStatus === 'Encerrada' ? (
                  <span className="bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle size={12} /> Vaga Encerrada
                  </span>
                ) : (
                  <span className="bg-green-500/20 text-green-300 border border-green-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} /> Vaga Ativa
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white leading-tight mb-2">
                {title}
              </h2>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-200 flex-wrap">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-accent-sky" />{city}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-accent-sky" />{type}</span>
              </div>
            </div>
          </div>

          {/* Banner de Contexto de Perfil */}
          {isJobOwner ? (
            <div className="mt-6 pt-3 border-t border-white/15 text-xs text-green-200 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-1.5 font-semibold">
                <Building2 size={15} /> Sua empresa é a criadora desta vaga ({currentStatus === 'Encerrada' ? 'Encerrada' : 'Ativa'}).
              </span>
              <Link to="/minhas-vagas" onClick={onClose} className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition-colors">
                Gerenciar Candidatos →
              </Link>
            </div>
          ) : isCompany ? (
            <div className="mt-6 pt-3 border-t border-white/15 text-xs text-sky-200 flex items-center gap-1.5">
              <Building2 size={14} /> Você está visualizando esta vaga como Empresa Recrutadora.
            </div>
          ) : isProfessor ? (
            <div className="mt-6 pt-3 border-t border-white/15 text-xs text-amber-200 flex items-center gap-1.5">
              <span>👨‍🏫</span> Visualização de oportunidade acadêmica para orientação de alunos.
            </div>
          ) : isFreelancer ? (
            isPj ? (
              <div className="mt-6 pt-3 border-t border-white/15 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-emerald-200 flex items-center gap-1.5 font-semibold">
                  <Briefcase size={15} className="text-emerald-300 shrink-0" />
                  <span>Oportunidade para Prestador PJ / Freelancer compatível com seu perfil.</span>
                </div>
                {canSeeMatch && typeof calculatedScore === 'number' && (
                  <div className="flex items-center gap-2">
                    <div className="w-28 bg-white/20 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-400 to-green-400 h-full rounded-full" style={{ width: `${calculatedScore}%` }} />
                    </div>
                    <span className="text-xs font-extrabold text-green-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/20">
                      {calculatedScore}% Match PJ
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 pt-3 border-t border-white/15 text-xs text-amber-200 flex items-start gap-2.5">
                <Wrench size={16} className="text-amber-300 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white">Perfil Freelancer / Prestador: </span>
                  Esta vaga é para <strong>Emprego Formal ({type})</strong>. Perfis de Freelancer atuam em contratos PJ, demandas autônomas e serviços no Marketplace.
                </div>
              </div>
            )
          ) : isStandardCandidate && isInternship ? (
            <div className="mt-6 pt-3 border-t border-white/15 text-xs text-amber-200 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-300 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-white">Aviso de Elegibilidade: </span>
                Vagas de estágio são exclusivas para estudantes com matrícula ativa (perfil Aluno), conforme Lei nº 11.788/2008.
              </div>
            </div>
          ) : isStudent && isInternship && !currentUser?.isVerifiedStudent ? (
            <div className="mt-6 pt-3 border-t border-white/15 text-xs text-amber-200 flex items-start gap-2">
              <ShieldAlert size={15} className="text-amber-300 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-white">Comprovação Necessária: </span>
                Para candidatar-se a este estágio, envie sua Declaração de Matrícula nas Configurações da Conta.
              </div>
            </div>
          ) : canSeeMatch && typeof calculatedScore === 'number' ? (
            <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400 shrink-0" size={18} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Compatibilidade com seu Perfil:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-400 to-green-400 h-full rounded-full" style={{ width: `${calculatedScore}%` }} />
                </div>
                <span className="text-sm font-extrabold text-green-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {calculatedScore}% Match
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-3 border-t border-white/15 text-xs text-gray-300 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-300 shrink-0" />
              <span>Entre como Aluno, Candidato ou Freelancer para visualizar a compatibilidade com a vaga.</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Informações Rápidas (Horário, Salário) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Horário de Trabalho</div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">{job.schedule || job.workingHours || '08:00 às 18:00 (Segunda a Sexta)'}</div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Faixa Salarial / Remuneração</div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">{job.salary || 'A combinar'}</div>
              </div>
            </div>
          </div>

          {/* Descrição Completa */}
          <div>
            <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2 flex items-center gap-2">
              <Briefcase size={17} className="text-primary-blue dark:text-blue-400" /> Descrição da Oportunidade
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description || 'Esta vaga tem como objetivo integrar novos talentos à equipe da empresa, proporcionando desenvolvimento profissional contínuo.'}
            </p>
          </div>

          {/* Responsabilidades */}
          {responsibilities.length > 0 && (
            <div>
              <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2.5">Principais Atividades &amp; Responsabilidades</h3>
              <ul className="space-y-2">
                {responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                    <span className="text-primary-blue dark:text-blue-400 font-bold shrink-0">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefícios */}
          {benefits.length > 0 && (
            <div>
              <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2.5 flex items-center gap-2">
                <Gift size={17} className="text-green-600 dark:text-green-400" /> Vales e Benefícios Oferecidos
              </h3>
              <div className="flex flex-wrap gap-2">
                {benefits.map((b, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-200/80 dark:border-green-800/60 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-600 dark:text-green-400" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requisitos vs Habilidades */}
          {requiredSkills.length > 0 && (
            <div>
              <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2.5">Habilidades Exigidas</h3>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map(skill => {
                  const isMatched = userSkills.some(us => isSkillMatch(us, skill));
                  return (
                    <span key={skill} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                      isMatched
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-400 border-blue-200 dark:border-blue-800 font-bold'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                    }`}>
                      {isMatched && <CheckCircle2 size={13} className="text-primary-blue dark:text-blue-400" />}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={onClose} className="btn btn-outline btn-sm font-semibold text-gray-600 dark:text-slate-300 cursor-pointer">
              Fechar
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {currentUser && !isJobOwner && !isCompany && (
              <button
                type="button"
                onClick={handleOpenChat}
                className="btn btn-outline btn-sm text-xs font-bold text-primary-blue dark:text-blue-400 border-primary-blue/40 hover:bg-primary-blue hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={14} /> Conversar no Chat
              </button>
            )}

            {/* Botão de Salvar Vaga nos Favoritos */}
            <button
              onClick={handleFavoriteToggle}
              className={`btn btn-sm text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer rounded-xl ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
              title={isFavorite ? 'Remover dos Favoritos' : 'Salvar Vaga nos Favoritos'}
            >
              <Bookmark size={14} className={isFavorite ? 'fill-amber-500 text-amber-500' : ''} />
              <span>{isFavorite ? 'Salva nos Favoritos' : 'Salvar Vaga'}</span>
            </button>

            {/* Link para o perfil completo da empresa */}
            <Link
              to={`/empresa/${encodeURIComponent(job.companyUid || job.createdBy || company)}`}
              onClick={onClose}
              className="btn btn-outline btn-sm text-xs font-bold text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:border-primary-blue hover:text-primary-blue dark:hover:text-blue-400 bg-white dark:bg-slate-800 transition-all flex items-center gap-1.5 rounded-xl cursor-pointer"
              title={`Ver perfil completo da empresa ${company}`}
            >
              <Building2 size={14} className="text-primary-blue dark:text-blue-400" />
              <span className="hidden sm:inline">Ver Empresa</span>
            </Link>

            {isJobOwner ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTogglingStatus}
                  onClick={handleToggleJobStatus}
                  className={`btn btn-sm text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentStatus === 'Encerrada'
                      ? 'border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 hover:bg-green-100'
                      : 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                  }`}
                >
                  {isTogglingStatus ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{currentStatus === 'Encerrada' ? 'Reabrindo...' : 'Encerrando...'}</span>
                    </>
                  ) : currentStatus === 'Encerrada' ? (
                    <><RotateCcw size={14} /> Reabrir Vaga</>
                  ) : (
                    <><XCircle size={14} /> Encerrar Vaga</>
                  )}
                </button>
                <Link
                  to="/minhas-vagas"
                  onClick={onClose}
                  className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Building2 size={14} /> Gerenciar Candidatos
                </Link>
              </div>
            ) : isCompany ? (
              <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3.5 py-2 rounded-xl font-medium border border-amber-200 dark:border-amber-800/70 flex items-center gap-1.5">
                <Building2 size={14} /> Empresas não se candidatam a vagas
              </span>
            ) : isProfessor ? (
              <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-3.5 py-2 rounded-xl font-medium border border-blue-200 dark:border-blue-800/70 flex items-center gap-1.5">
                <Users size={14} /> Docentes não realizam candidaturas
              </span>
            ) : !currentUser ? (
              <Link
                to="/login"
                onClick={onClose}
                className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Send size={14} /> Entrar para Candidatar-se
              </Link>
            ) : applied ? (
              <button disabled className="btn bg-green-600 text-white btn-sm text-xs font-bold cursor-default flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 size={15} /> {isFreelancer ? 'Proposta PJ Enviada!' : 'Candidatura Enviada!'}
              </button>
            ) : eligibility.status === 'freelancer_clt_blocked' ? (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <span className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-2 rounded-xl font-medium border border-amber-200 dark:border-amber-800/70 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  Vaga CLT / Formal (Não aplicável a Freelancer)
                </span>
                <Link
                  to="/servicos"
                  onClick={onClose}
                  className="btn btn-outline btn-sm text-xs font-bold text-teal-600 dark:text-teal-400 border-teal-500/40 hover:bg-teal-500 hover:text-white transition-all flex items-center gap-1"
                >
                  Ver Demandas PJ →
                </Link>
              </div>
            ) : eligibility.status === 'candidate_stage_blocked' ? (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <span className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-2 rounded-xl font-medium border border-amber-200 dark:border-amber-800/70 flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  Exclusivo para Alunos / Estudantes (Estágio)
                </span>
                <Link
                  to="/configuracoes"
                  onClick={onClose}
                  className="btn btn-outline btn-sm text-xs font-bold text-primary-blue dark:text-blue-400 border-primary-blue/40 hover:bg-primary-blue hover:text-white transition-all flex items-center gap-1"
                >
                  Alterar Perfil →
                </Link>
              </div>
            ) : eligibility.status === 'student_stage_unverified' ? (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <span className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-2 rounded-xl font-medium border border-amber-200 dark:border-amber-800/70 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  Requer Comprovação de Matrícula
                </span>
                <Link
                  to="/configuracoes?tab=verification"
                  onClick={onClose}
                  className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} /> Enviar Matrícula
                </Link>
              </div>
            ) : eligibility.canApply ? (
              <button 
                onClick={handleApply} 
                disabled={isSubmitting}
                className={`btn btn-sm text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                  isFreelancer ? 'btn-teal' : 'btn-primary'
                }`}
              >
                <Send size={14} /> {isSubmitting ? (eligibility.buttonSubmittingLabel || 'Enviando...') : eligibility.buttonLabel}
              </button>
            ) : (
              <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/60 px-3.5 py-2 rounded-xl font-medium border border-gray-200 dark:border-slate-700">
                {eligibility.buttonLabel}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
