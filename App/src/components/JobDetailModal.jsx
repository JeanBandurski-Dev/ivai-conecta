import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X, MapPin, Building2, Clock, DollarSign, CheckCircle2,
  Sparkles, Briefcase, Gift, Send, ShieldCheck, MessageSquare, XCircle, RotateCcw, Lightbulb, Users
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  applyToJob, calculateMatchScore, isSkillMatch, getUsersDB,
  updateJobStatus, safeSkillsArray, getUserApplications, subscribeToApplications
} from '../lib/ivaiConecta';

export default function JobDetailModal({ job, onClose, matchScore }) {
  const { currentUser, showToast, startChatWith } = useAppStore();
  const [applied, setApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const isCandidate = Boolean(currentUser && (userRole === 'aluno' || userRole === 'candidato' || userRole === 'estudante' || userRole === 'student'));
  const isCompany = Boolean(userRole === 'empresa' || userRole === 'company' || userRole === 'recrutador');
  const isProfessor = Boolean(userRole === 'professor' || userRole === 'docente' || userRole === 'teacher');

  const isJobOwner = isCompany && currentUser && (
    (job.createdBy && currentUser.uid && String(job.createdBy) === String(currentUser.uid)) ||
    (job.createdBy && currentUser.id && String(job.createdBy) === String(currentUser.id)) ||
    (job.createdBy && currentUser.email && String(job.createdBy).toLowerCase() === String(currentUser.email).toLowerCase()) ||
    (job.recruiterEmail && currentUser.email && job.recruiterEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser.name && company && company.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
    (currentUser.razaoSocial && company && company.toLowerCase().trim() === currentUser.razaoSocial.toLowerCase().trim()) ||
    (currentUser.nomeFantasia && company && company.toLowerCase().trim() === currentUser.nomeFantasia.toLowerCase().trim())
  );

  const canSeeMatch = isCandidate;
  const userSkills = safeSkillsArray(currentUser?.skills);
  const calculatedScore = matchScore ?? (canSeeMatch ? calculateMatchScore(userSkills, requiredSkills, {
    userCity: currentUser?.city,
    jobCity: city,
    isVerifiedStudent: currentUser?.isVerifiedStudent,
    endorsementsCount: (currentUser?.endorsements?.length || currentUser?.endorsementCount || 0)
  }) : null);

  useEffect(() => {
    if (!currentUser || !isCandidate) return;
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
    const unsub = subscribeToApplications(userUid, (apps) => {
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
  }, [job, jobId, currentUser, isCandidate]);

  const handleToggleJobStatus = async () => {
    const action = currentStatus === 'Ativa' ? 'close' : 'reopen';
    await updateJobStatus(jobId, action);
    const newStatus = action === 'close' ? 'Encerrada' : 'Ativa';
    setCurrentStatus(newStatus);
    showToast(action === 'close' ? 'Vaga encerrada com sucesso!' : 'Vaga reaberta com sucesso!');
  };

  const handleApply = async () => {
    if (!currentUser) {
      showToast('Faça login como Aluno ou Candidato para se candidatar!');
      return;
    }
    if (!isCandidate) {
      if (isCompany) {
        showToast('Perfis de empresa não realizam candidaturas a vagas.');
      } else if (isProfessor) {
        showToast('Perfis de professor/docente não realizam candidaturas a vagas.');
      } else {
        showToast('Apenas estudantes e candidatos podem se candidatar a vagas.');
      }
      return;
    }
    if (applied) {
      showToast('Você já se candidatou a esta vaga!');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await applyToJob(jobId, currentUser);
      if (res?.success) {
        setApplied(true);
        showToast('Candidatura realizada com sucesso!');
      } else {
        showToast(res?.message || 'Não foi possível concluir a candidatura.');
        if (res?.message?.includes('já se candidatou')) {
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
      showToast('Faça login como Aluno ou Candidato para conversar com a empresa!');
      return;
    }

    if (isJobOwner) {
      showToast('⚠️ Você é o autor desta vaga e não pode iniciar uma conversa com sua própria empresa.');
      return;
    }

    // Busca o email real da empresa no banco de usuários
    const allUsers = getUsersDB() || [];
    const companyUser = allUsers.find(u => 
      u?.name?.toLowerCase().trim() === company?.toLowerCase().trim() ||
      (job.createdBy && u?.email?.toLowerCase().trim() === String(job.createdBy).toLowerCase().trim())
    );

    const targetEmail = companyUser?.email || 
      (job.recruiterEmail && String(job.recruiterEmail).includes('@') ? job.recruiterEmail : null) || 
      (job.createdBy && String(job.createdBy).includes('@') ? job.createdBy : null) || 
      (company ? `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br` : 'empresa@ivaiconecta.com.br');

    const companyTarget = {
      name: company,
      email: targetEmail,
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
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 sm:gap-5">
            <img
              src={companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'}
              alt={company}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/30 object-cover shadow-brand-md shrink-0 bg-white dark:bg-slate-800"
            />
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-sky bg-white/10 px-2.5 py-0.5 rounded-md">
                  {company}
                </span>
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
              <span>Entre como Aluno ou Candidato para ver seu cálculo de compatibilidade com esta vaga.</span>
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
          <button onClick={onClose} className="btn btn-outline btn-sm font-semibold text-gray-600 dark:text-slate-300">
            Fechar
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            {isCandidate && !isJobOwner && (
              <button
                type="button"
                onClick={handleOpenChat}
                className="btn btn-outline btn-sm text-xs font-bold text-primary-blue dark:text-blue-400 border-primary-blue/40 hover:bg-primary-blue hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={14} /> Conversar no Chat
              </button>
            )}

            {isJobOwner ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleJobStatus}
                  className={`btn btn-sm text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    currentStatus === 'Encerrada'
                      ? 'border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 hover:bg-green-100'
                      : 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                  }`}
                >
                  {currentStatus === 'Encerrada' ? (
                    <><RotateCcw size={14} /> Reabrir Vaga</>
                  ) : (
                    <><XCircle size={14} /> Encerrar Vaga</>
                  )}
                </button>
                <Link
                  to="/minhas-vagas"
                  onClick={onClose}
                  className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md"
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
                <Users size={14} /> Apenas estudantes e candidatos se candidatam
              </span>
            ) : !currentUser ? (
              <Link
                to="/login"
                onClick={onClose}
                className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Send size={14} /> Entrar para Candidatar-se
              </Link>
            ) : isCandidate ? (
              applied ? (
                <button disabled className="btn bg-green-600 text-white btn-sm text-xs font-bold cursor-default flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={15} /> Candidatura Enviada!
                </button>
              ) : (
                <button 
                  onClick={handleApply} 
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={14} /> {isSubmitting ? 'Enviando...' : 'Candidatar-se à Vaga'}
                </button>
              )
            ) : (
              <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/60 px-3.5 py-2 rounded-xl font-medium border border-gray-200 dark:border-slate-700">
                Apenas alunos e candidatos podem se candidatar
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
