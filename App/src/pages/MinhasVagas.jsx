import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle, Clock, ArrowRight,
  ArrowLeft, Plus, Users, Eye, XCircle, RotateCcw, Phone, ShieldCheck, CheckCircle2,
  Award, Send, X, FileText, Trash2, MessageSquare, Layers, Sparkles, ExternalLink, Bookmark, Loader2
} from 'lucide-react';
import {
  getUserApplications, getJobs,
  updateJobStatus, deleteJob, getEndorsementRequests,
  approveEndorsementRequest, rejectEndorsementRequest, safeSkillsArray,
  isJobFavorited, subscribeToEndorsementRequests, getTalentById,
  hasTeacherEndorsedStudent, deduplicateRequestsByStudent,
  getTeacherEndorsedStudents, syncFulfilledEndorsementRequests, isSameProfessor
} from '../lib/ivaiConecta';
import { subscribeToJobs, subscribeToApplications, subscribeToJobApplicants, subscribeToCompanyApplications } from '../services/jobsService.js';
import { isGenericPlaceholderAvatar } from '../services/chatService';
import useAppStore from '../store/useAppStore';
import PublishJobModal from '../components/PublishJobModal';
import JobActionModal from '../components/JobActionModal';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';

export default function MinhasVagas() {
  const { currentUser, favoriteJobs = [], showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, forceUpdate] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const initialTab = searchParams.get('tab') === 'favorites' || searchParams.get('tab') === 'salvas' ? 'favorites' : 'applications';
  const [candidateTab, setCandidateTab] = useState(initialTab);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites' || tabParam === 'salvas') {
      setCandidateTab('favorites');
    } else if (tabParam === 'applications' || tabParam === 'candidaturas') {
      setCandidateTab('applications');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setCandidateTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const userRole = String(currentUser?.role || '').toLowerCase().trim();
  const isCompany = userRole === 'empresa' || userRole === 'company' || userRole === 'recrutador';
  const isProfessor = userRole === 'professor' || userRole === 'docente' || userRole === 'teacher';
  const isFreelancer = userRole === 'freelancer' || userRole === 'prestador';

  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));
  const [liveApps, setLiveApps] = useState(() => isCompany ? getUserApplications() : getUserApplications(currentUser?.uid));
  const [jobActionModalTarget, setJobActionModalTarget] = useState(null);

  useEffect(() => {
    const unsubJobs = subscribeToJobs('Todas as Cidades', (data) => {
      if (Array.isArray(data)) setLiveJobs(data);
    });

    let unsubApps = () => { };
    if (currentUser) {
      if (isCompany) {
        unsubApps = subscribeToCompanyApplications(currentUser, (companyApps) => {
          if (Array.isArray(companyApps)) {
            setLiveApps(companyApps);
          }
        });
      } else {
        unsubApps = subscribeToApplications(currentUser, (data) => {
          if (Array.isArray(data)) {
            setLiveApps(data);
          }
        });
      }
    }

    const handleAppsUpdate = (e) => {
      if (Array.isArray(e?.detail)) {
        if (isCompany) {
          const email = currentUser?.email ? String(currentUser.email).toLowerCase().trim() : '';
          const forCompany = email ? e.detail.filter(a => String(a.recruiterEmail || '').toLowerCase().trim() === email) : e.detail;
          setLiveApps(forCompany);
        } else {
          const uid = currentUser?.uid || currentUser?.id;
          const forCand = uid ? e.detail.filter(a => a.candidateUid === uid || a.candidateId === uid) : e.detail;
          setLiveApps(forCand);
        }
      }
      forceUpdate(n => n + 1);
    };

    window.addEventListener('ivai_applications_updated', handleAppsUpdate);

    return () => {
      unsubJobs();
      unsubApps();
      window.removeEventListener('ivai_applications_updated', handleAppsUpdate);
    };
  }, [currentUser, isCompany]);

  const apps = Array.isArray(liveApps) ? liveApps : [];
  const safeLiveJobs = Array.isArray(liveJobs) ? liveJobs : [];

  const savedJobsList = useMemo(() => {
    if (!Array.isArray(favoriteJobs) || favoriteJobs.length === 0) return [];
    const list = Array.isArray(liveJobs) ? liveJobs : [];
    return list.filter(j => isJobFavorited(j, favoriteJobs));
  }, [liveJobs, favoriteJobs]);

  const companyJobs = safeLiveJobs.filter(j =>
    j && (
      (j.companyUid && currentUser?.uid && String(j.companyUid) === String(currentUser.uid)) ||
      (j.companyUid && currentUser?.id && String(j.companyUid) === String(currentUser.id)) ||
      (j.createdBy && currentUser?.uid && String(j.createdBy) === String(currentUser.uid)) ||
      (j.createdBy && currentUser?.id && String(j.createdBy) === String(currentUser.id))
    )
  );

  // Teacher endorsement requests state
  const [liveTeacherRequests, setLiveTeacherRequests] = useState(() => deduplicateRequestsByStudent(getEndorsementRequests()));

  useEffect(() => {
    if (!currentUser || !isProfessor) return;
    const unsub = subscribeToEndorsementRequests(currentUser, (data) => {
      if (Array.isArray(data)) {
        setLiveTeacherRequests(deduplicateRequestsByStudent(data));
      }
    });
    return () => unsub();
  }, [currentUser, isProfessor]);

  const teacherRequests = useMemo(() => {
    return deduplicateRequestsByStudent(liveTeacherRequests);
  }, [liveTeacherRequests]);

  const { pendingTeacherRequests, finishedTeacherRequests } = useMemo(() => {
    const pending = [];
    const finished = [];
    const seenStudentIds = new Set();

    teacherRequests.forEach(req => {
      const student = getTalentById(req.studentId);
      const isAlreadyEndorsed = hasTeacherEndorsedStudent(student?.endorsements || [], currentUser);

      if (req.status === 'Aprovado' || isAlreadyEndorsed) {
        const endorsement = student?.endorsements?.find(e => isSameProfessor(e, currentUser));
        seenStudentIds.add(String(req.studentId));
        finished.push({
          ...req,
          status: 'Aprovado',
          studentAvatar: req.studentAvatar || student?.avatar || '',
          studentCourse: req.studentCourse || student?.course || '',
          discipline: endorsement?.discipline || req.discipline || 'Avaliação Pedagógica',
          quote: endorsement?.quote || req.quote || '',
          date: endorsement?.date || req.resolvedAt || req.requestedAt || 'Recente'
        });

        // Sincroniza em segundo plano para persistir como Aprovado no Firestore
        if (req.status === 'Pendente') {
          syncFulfilledEndorsementRequests(req.studentId, currentUser);
        }
      } else if (req.status === 'Pendente') {
        pending.push(req);
      }
    });

    // Inclui também estudantes que possuem recomendação deste professor
    const profEmail = (currentUser?.email || '').toLowerCase().trim();
    if (profEmail) {
      const endorsedTalents = getTeacherEndorsedStudents(profEmail);
      endorsedTalents.forEach(t => {
        if (!seenStudentIds.has(String(t.id))) {
          const endorsement = t.endorsements?.find(e => isSameProfessor(e, currentUser));
          finished.push({
            id: `end_${t.id}`,
            studentId: t.id,
            studentName: t.name,
            studentAvatar: t.avatar,
            studentCourse: t.course,
            studentInstitution: t.institution,
            status: 'Aprovado',
            discipline: endorsement?.discipline || 'Avaliação Pedagógica',
            quote: endorsement?.quote || '',
            date: endorsement?.date || 'Recente'
          });
          seenStudentIds.add(String(t.id));
        }
      });
    }

    return { pendingTeacherRequests: pending, finishedTeacherRequests: finished };
  }, [teacherRequests, currentUser]);

  const [customQuote, setCustomQuote] = useState({});
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [processingActionType, setProcessingActionType] = useState(null);
  const [reopeningJobId, setReopeningJobId] = useState(null);

  // Selected job to view applicants (for company view)
  const [selectedJobApplicants, setSelectedJobApplicants] = useState(null);
  const [jobApplicants, setJobApplicants] = useState([]);

  useEffect(() => {
    if (!selectedJobApplicants) {
      setJobApplicants([]);
      return;
    }
    const unsub = subscribeToJobApplicants(selectedJobApplicants, (data) => {
      setJobApplicants(data);
    });
    return () => unsub();
  }, [selectedJobApplicants]);

  const getJobApplicantsCount = (jobItem) => {
    if (!jobItem) return 0;
    const jId = String(jobItem.id || '');
    const jFId = jobItem.firestoreId ? String(jobItem.firestoreId) : '';
    const matching = apps.filter(a => {
      const aJobId = String(a.jobId || '');
      const aFsId = a.firestoreJobId ? String(a.firestoreJobId) : '';
      const aOrigId = a.originalJobId ? String(a.originalJobId) : '';
      return (jId && (aJobId === jId || aFsId === jId || aOrigId === jId)) ||
             (jFId && (aJobId === jFId || aFsId === jFId || aOrigId === jFId));
    });
    return Math.max(Number(jobItem.applicantsCount) || 0, matching.length);
  };

  const displayedJobApplicants = useMemo(() => {
    if (!selectedJobApplicants) return [];
    const jId = String(selectedJobApplicants.id || '');
    const jFId = selectedJobApplicants.firestoreId ? String(selectedJobApplicants.firestoreId) : '';
    const appsList = Array.isArray(liveApps) ? liveApps : [];
    const fromApps = appsList.filter(a => {
      const aJobId = String(a.jobId || '');
      const aFsId = a.firestoreJobId ? String(a.firestoreJobId) : '';
      const aOrigId = a.originalJobId ? String(a.originalJobId) : '';
      return (jId && (aJobId === jId || aFsId === jId || aOrigId === jId)) ||
             (jFId && (aJobId === jFId || aFsId === jFId || aOrigId === jFId));
    });
    const map = new Map();
    [...jobApplicants, ...fromApps].forEach(item => {
      const key = item.id || item.firestoreId || item.candidateUid;
      if (key && !map.has(key)) map.set(key, item);
    });
    return Array.from(map.values());
  }, [selectedJobApplicants, jobApplicants, liveApps]);

  if (!currentUser) {
    return (
      <main className="container section text-center py-24">
        <Briefcase size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 dark:text-white mb-2">Acesso restrito</h2>
        <p className="text-gray-500 dark:text-slate-300 mb-6">Você precisa estar logado para acessar seu painel.</p>
        <Link to="/login" className="btn btn-primary px-6 py-2.5 font-bold">Entrar / Cadastrar</Link>
      </main>
    );
  }

  const handleJobAction = async (jobId, action) => {
    if (reopeningJobId) return;
    setReopeningJobId(jobId);
    try {
      const updated = await updateJobStatus(jobId, action);
      if (Array.isArray(updated)) setLiveJobs(updated);
      showToast(action === 'close' ? '🔒 Vaga encerrada com sucesso.' : '🔓 Vaga reaberta com sucesso!');
      forceUpdate(n => n + 1);
    } catch (err) {
      console.error('Erro ao atualizar status da vaga:', err);
      showToast('Erro ao atualizar status da vaga.');
    } finally {
      setReopeningJobId(null);
    }
  };

  const handleCloseJob = async (jobOrId) => {
    const targetJob = typeof jobOrId === 'object' && jobOrId !== null
      ? jobOrId
      : liveJobs.find(j => String(j.id) === String(jobOrId) || String(j.firestoreId) === String(jobOrId));
    const idStr = targetJob?.id ? String(targetJob.id) : String(jobOrId);
    const firestoreIdStr = targetJob?.firestoreId ? String(targetJob.firestoreId) : null;

    setLiveJobs(prev => prev.map(j => {
      const jId = String(j.id);
      const jFId = j.firestoreId ? String(j.firestoreId) : null;
      if (jId === idStr || (firestoreIdStr && (jId === firestoreIdStr || jFId === firestoreIdStr)) || (jFId && jFId === idStr)) {
        return { ...j, status: 'Encerrada' };
      }
      return j;
    }));

    try {
      await updateJobStatus(firestoreIdStr || idStr, 'close');
      showToast('🔒 Vaga encerrada com sucesso.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao encerrar vaga.');
    }
    forceUpdate(n => n + 1);
  };

  const handleDeleteJob = async (jobOrId) => {
    const targetJob = typeof jobOrId === 'object' && jobOrId !== null
      ? jobOrId
      : liveJobs.find(j => String(j.id) === String(jobOrId) || String(j.firestoreId) === String(jobOrId));
    const idStr = targetJob?.id ? String(targetJob.id) : String(jobOrId);
    const firestoreIdStr = targetJob?.firestoreId ? String(targetJob.firestoreId) : null;

    // Atualização otimista imediata
    setLiveJobs(prev => prev.filter(j => {
      const jId = String(j.id);
      const jFId = j.firestoreId ? String(j.firestoreId) : null;
      if (jId === idStr) return false;
      if (firestoreIdStr && (jId === firestoreIdStr || jFId === firestoreIdStr)) return false;
      if (jFId && jFId === idStr) return false;
      return true;
    }));

    try {
      await deleteJob(firestoreIdStr || idStr);
      showToast('🗑️ Vaga excluída permanentemente.');
    } catch (err) {
      console.error('Erro ao excluir vaga:', err);
      showToast('Erro ao excluir vaga.');
    }
    forceUpdate(n => n + 1);
  };

  const handleApproveTeacherRequest = async (reqId) => {
    if (processingRequestId) return;
    setProcessingRequestId(reqId);
    setProcessingActionType('approve');
    try {
      const quoteText = customQuote[reqId] || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio lógico em disciplinas práticas.';
      const res = await approveEndorsementRequest(reqId, quoteText, currentUser);
      if (res.success) {
        showToast('Parecer pedagógico concedido e selo verificado atribuído ao perfil do aluno!');
        forceUpdate(n => n + 1);
      } else if (res.alreadyEndorsed) {
        showToast('Você já recomendou este aluno. A solicitação foi concluída sem duplicar pareceres.');
        forceUpdate(n => n + 1);
      } else {
        showToast(res.error || 'Erro ao conceder parecer.');
      }
    } catch (err) {
      console.error('Erro ao aprovar solicitação:', err);
      showToast('Erro ao conceder parecer.');
    } finally {
      setProcessingRequestId(null);
      setProcessingActionType(null);
    }
  };

  const handleRejectTeacherRequest = async (reqId) => {
    if (processingRequestId) return;
    setProcessingRequestId(reqId);
    setProcessingActionType('reject');
    try {
      await rejectEndorsementRequest(reqId, currentUser);
      showToast('Solicitação recusada.');
      forceUpdate(n => n + 1);
    } catch (err) {
      console.error('Erro ao recusar solicitação:', err);
      showToast('Erro ao recusar solicitação.');
    } finally {
      setProcessingRequestId(null);
      setProcessingActionType(null);
    }
  };

  return (
    <>
      {/* ── HEADER ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-4 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mb-3 tracking-tight">
                {isProfessor
                  ? 'Painel do Docente & Recomendações'
                  : isCompany
                    ? (candidateTab === 'favorites' ? 'Minhas Vagas Salvas & Favoritas' : 'Minhas Vagas Criadas & Candidatos')
                    : isFreelancer
                      ? (candidateTab === 'favorites' ? 'Minhas Oportunidades Salvas & Favoritas' : 'Minhas Propostas PJ & Candidaturas')
                      : candidateTab === 'favorites'
                        ? 'Minhas Vagas Salvas & Favoritas'
                        : 'Minhas Candidaturas & Processos'}
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {isProfessor
                  ? 'Gerencie pedidos de parecer pedagógico dos seus alunos do IFPR, Univale e UENP e atribua selos verificados.'
                  : isCompany
                    ? (candidateTab === 'favorites'
                        ? 'Vagas favoritadas pela sua empresa para acompanhar referências de mercado ou comparar requisitos.'
                        : 'Gerencie os processos seletivos da sua empresa, acompanhe os estudantes inscritos e altere os status das vagas.')
                    : isFreelancer
                      ? (candidateTab === 'favorites'
                          ? 'Demandas e oportunidades PJ favoritadas para acompanhar prazos e enviar propostas.'
                          : 'Acompanhe o status e a evolução em tempo real de todas as suas propostas de prestação de serviços PJ no Vale do Ivaí.')
                      : candidateTab === 'favorites'
                        ? 'Suas oportunidades favoritadas para acompanhar prazos, comparar requisitos e candidatar-se no momento certo.'
                        : 'Acompanhe o status e a evolução em tempo real de todas as suas candidaturas no Vale do Ivaí.'}
              </p>
            </div>

            {isCompany && (
              <button
                onClick={() => setShowPublishModal(true)}
                className="btn btn-teal px-6 py-3 font-bold shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} /> Publicar Nova Vaga
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ── VISÃO DO PROFESSOR / DOCENTE ── */}
        {isProfessor ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Award className="text-amber-400 fill-amber-400" size={24} /> Solicitações de Recomendação Pendentes ({pendingTeacherRequests.length})
              </h2>
            </div>

            {pendingTeacherRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
                <Award size={48} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma solicitação pendente no momento.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400">Todos os pedidos de parecer pedagógico foram avaliados e estão listados no histórico abaixo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTeacherRequests.map(req => {
                  const student = getTalentById(req.studentId);

                  return (
                    <div key={req.id || req.firestoreId} className="card p-6 space-y-4 border-l-4 border-l-amber-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs rounded-2xl">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-400 font-heading font-black text-lg flex items-center justify-center shrink-0 overflow-hidden border border-blue-200/50 shadow-xs">
                            {(req.studentAvatar || student?.avatar) ? (
                              <img src={req.studentAvatar || student?.avatar} alt={req.studentName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(req.studentName || 'E').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-heading text-lg sm:text-xl font-bold text-primary-dark dark:text-white flex items-center flex-wrap gap-2">
                              {req.studentName}
                              <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                                Solicitação em {req.requestedAt}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 mt-0.5">
                              {req.studentCourse || student?.course || 'Estudante'} · {req.studentInstitution || student?.institution || 'IFPR'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              Disciplina: <strong>{req.discipline}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/perfil/${req.studentId}`)}
                          className="btn btn-outline btn-sm text-xs font-bold shrink-0 flex items-center gap-1.5"
                        >
                          <Eye size={13} /> Ver Perfil do Aluno
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-sm text-gray-700 dark:text-slate-300 italic border border-gray-200 dark:border-slate-700">
                        "{req.message}"
                      </div>

                      {/* Form de Parecer Personalizado */}
                      <div className="space-y-2">
                        <label className="form-label text-xs">Escreva seu Parecer / Avaliação Pedagógica:</label>
                        <textarea
                          disabled={Boolean(processingRequestId)}
                          value={customQuote[req.id] || ''}
                          onChange={e => setCustomQuote({ ...customQuote, [req.id]: e.target.value })}
                          className="form-control text-xs disabled:opacity-60"
                          rows={2}
                          placeholder="Ex: Estudante com excelente raciocínio prático, boa assiduidade e ótimo trabalho em equipe."
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          disabled={Boolean(processingRequestId)}
                          onClick={() => handleRejectTeacherRequest(req.id)}
                          className="btn btn-outline border-red-200 text-red-600 dark:text-red-400 hover:bg-red-50 btn-sm text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                        >
                          {processingRequestId === req.id && processingActionType === 'reject' ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Recusando...</span>
                            </>
                          ) : (
                            <>
                              <X size={14} />
                              <span>Recusar</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(processingRequestId)}
                          onClick={() => handleApproveTeacherRequest(req.id)}
                          className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {processingRequestId === req.id && processingActionType === 'approve' ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>Concedendo Selo...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={15} />
                              <span>Aprovar &amp; Conceder Selo Verificado</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recomendações Já Concedidas pelo Professor */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-4">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} /> Histórico de Pareceres Emitidos ({finishedTeacherRequests.length})
              </h3>

              {finishedTeacherRequests.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma recomendação finalizada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {finishedTeacherRequests.map(req => (
                    <div key={req.id || req.studentId} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-heading font-black text-base flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200/50 shadow-xs">
                          {req.studentAvatar ? (
                            <img src={req.studentAvatar} alt={req.studentName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{(req.studentName || 'E').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-heading font-bold text-gray-900 dark:text-white text-base flex items-center gap-2 flex-wrap">
                            {req.studentName}
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 size={12} /> Parecer Concedido
                            </span>
                            {req.date && (
                              <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                                · {req.date}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-primary-blue dark:text-blue-400 font-medium mt-0.5">
                            {req.studentCourse || 'Estudante'} · {req.discipline || 'Avaliação Pedagógica'}
                          </div>
                          {req.quote && (
                            <div className="text-xs text-gray-600 dark:text-slate-300 italic mt-1.5 max-w-xl bg-gray-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                              "{req.quote}"
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/perfil/${req.studentId}`)}
                        className="btn btn-outline btn-sm text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} /> Ver Perfil do Aluno
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : isCompany ? (
          /* ── VISÃO DA EMPRESA: GERENCIAMENTO DE VAGAS & FAVORITAS ── */
          <div className="space-y-6 max-w-5xl mx-auto">

            {/* Seletor de Abas da Empresa */}
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 w-fit max-w-full overflow-x-auto scrollbar-none shadow-2xs">
              <button
                type="button"
                onClick={() => handleTabChange('applications')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${candidateTab !== 'favorites'
                    ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs border border-gray-200/80 dark:border-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Briefcase size={15} className={candidateTab !== 'favorites' ? 'text-primary-blue dark:text-blue-400' : 'text-gray-400'} />
                <span>Vagas Criadas</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${candidateTab !== 'favorites'
                    ? 'bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                  }`}>
                  {companyJobs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('favorites')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${candidateTab === 'favorites'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-gray-200/80 dark:border-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Bookmark size={15} className={candidateTab === 'favorites' ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} />
                <span>Vagas Salvas / Favoritas</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${candidateTab === 'favorites'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                  }`}>
                  {savedJobsList.length}
                </span>
              </button>
            </div>

            {candidateTab === 'favorites' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {savedJobsList.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
                      <Bookmark size={32} className="fill-amber-500" />
                    </div>
                    <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma vaga favoritada ainda.</p>
                    <p className="text-sm text-gray-400 dark:text-slate-400 mb-5 max-w-md mx-auto">
                      Ao navegar pelo mural de vagas, clique no botão de marcador para salvar vagas do seu interesse e acessá-las rapidamente aqui.
                    </p>
                    <Link to="/vagas" className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-xs inline-flex items-center gap-2">
                      <ExternalLink size={15} /> Explorar Vagas no Vale do Ivaí
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4 sm:gap-5">
                    {savedJobsList.map(job => (
                      <JobCard
                        key={job.id || job.firestoreId}
                        job={job}
                        matchScore={job.calculatedScore}
                        onSelect={setSelectedJob}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
            {/* Pro Banner leading to Full Kanban ATS */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-primary-dark text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 border border-blue-700/50 relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} /> Painel Completo ATS
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-heading">
                  Quadro Kanban &amp; Gestão de Candidatos
                </h3>
                <p className="text-xs sm:text-sm text-blue-200/90 max-w-xl">
                  Acesse o painel completo com colunas Kanban por vaga, agendamento de entrevistas, notas e movimentação de etapas em tempo real.
                </p>
              </div>

              <Link
                to="/gerenciamento-vagas"
                className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all z-10 shrink-0 border border-slate-200/20"
              >
                <Layers size={16} className="text-primary-blue" /> Abrir Painel de Recrutamento
              </Link>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Briefcase size={22} className="text-primary-blue" /> Vagas Cadastradas ({companyJobs.length})
              </h2>
            </div>

            {companyJobs.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center mx-auto">
                  <Briefcase size={32} />
                </div>
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma vaga criada ainda.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400 mb-5 max-w-md mx-auto">Publique uma vaga para começar a receber candidaturas de alunos e talentos locais da região do Vale do Ivaí.</p>
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Publicar Primeira Vaga
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4 sm:gap-5">
                {companyJobs.map(job => (
                  <div key={job.id} className="card p-5 sm:p-5.5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-slate-800 hover:border-primary-blue/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between h-full bg-white dark:bg-slate-900 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${job.status === 'Encerrada'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'Encerrada' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                          {job.status === 'Encerrada' ? 'Vaga Encerrada' : 'Vaga Ativa'}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">
                          {job.createdAt ? (typeof job.createdAt === 'string' && job.createdAt.includes('/') ? job.createdAt : new Date(job.createdAt).toLocaleDateString('pt-BR')) : 'Recente'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-heading text-base sm:text-lg font-bold text-primary-dark dark:text-white leading-snug line-clamp-2">{job.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-primary-blue"><MapPin size={13} /> {job.city}</span>
                          <span>·</span>
                          <span>{job.type}</span>
                        </div>
                      </div>

                      <div
                        onClick={() => setSelectedJobApplicants(job)}
                        className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl px-3 py-2 text-xs font-semibold text-primary-blue dark:text-blue-300 flex items-center justify-between cursor-pointer hover:bg-blue-100/80 dark:hover:bg-blue-900/60 transition-all group"
                        title="Clique para ver os candidatos inscritos nesta vaga"
                      >
                        <span className="flex items-center gap-1.5">
                          <Users size={14} className="group-hover:scale-110 transition-transform" /> Candidatos Inscritos
                        </span>
                        <span className="font-extrabold bg-primary-blue text-white px-2 py-0.5 rounded-full text-[11px] shadow-xs">
                          {getJobApplicantsCount(job)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                      {/* Vales e Requisitos */}
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-1.5 text-xs">
                        {safeSkillsArray(job.requiredSkills).slice(0, 3).map(s => (
                          <span key={s} className="tag tag-blue text-[10px]">{s}</span>
                        ))}
                        {safeSkillsArray(job.requiredSkills).length > 3 && (
                          <span className="text-[10px] text-gray-400 font-bold self-center">
                            +{safeSkillsArray(job.requiredSkills).length - 3}
                          </span>
                        )}
                      </div>

                      {/* Ações da Vaga */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedJobApplicants(job)}
                          className="btn btn-outline border-blue-200 dark:border-blue-800 text-primary-blue dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 btn-sm font-bold text-xs flex items-center gap-1 cursor-pointer"
                          title="Ver lista de candidatos desta vaga"
                        >
                          <Users size={13} /> Inscritos
                        </button>
                        <Link
                          to={`/gerenciamento-vagas?jobId=${job.firestoreId || job.id}`}
                          className="btn btn-primary btn-sm font-bold text-xs flex items-center gap-1.5 rounded-xl shadow-xs flex-1 justify-center"
                        >
                          <Layers size={13} /> Funil Kanban
                        </Link>

                        {job.status === 'Encerrada' ? (
                          <button
                            type="button"
                            disabled={reopeningJobId === job.id}
                            onClick={() => handleJobAction(job.id, 'reopen')}
                            className="btn btn-outline border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 btn-sm text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Reabrir Vaga"
                          >
                            {reopeningJobId === job.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <RotateCcw size={13} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setJobActionModalTarget(job)}
                            className="btn btn-outline border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 btn-sm text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Encerrar Vaga"
                          >
                            <XCircle size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => setJobActionModalTarget(job)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/40 transition-colors cursor-pointer"
                          title="Excluir Vaga"
                          aria-label="Excluir vaga"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        ) : (
          /* ── VISÃO DO ALUNO / CANDIDATO: MINHAS CANDIDATURAS & FAVORITAS ── */
          <div className="space-y-6 w-full">

            {/* Seletor de Abas do Candidato */}
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 w-fit max-w-full overflow-x-auto scrollbar-none shadow-2xs">
              <button
                type="button"
                onClick={() => setCandidateTab('applications')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${candidateTab === 'applications'
                    ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs border border-gray-200/80 dark:border-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Send size={15} className={candidateTab === 'applications' ? 'text-primary-blue dark:text-blue-400' : 'text-gray-400'} />
                <span>{isFreelancer ? 'Propostas Enviadas' : 'Vagas Candidatadas'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${candidateTab === 'applications'
                    ? 'bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                  }`}>
                  {apps.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('favorites')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  candidateTab === 'favorites'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-gray-200/80 dark:border-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Bookmark size={15} className={candidateTab === 'favorites' ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} />
                <span>Vagas Salvas / Favoritas</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  candidateTab === 'favorites'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                }`}>
                  {savedJobsList.length}
                </span>
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: VAGAS CANDIDATADAS */}
            {candidateTab === 'applications' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Banner de atalho para Vagas Salvas caso o candidato tenha vagas salvas */}
                {savedJobsList.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-amber-50/90 to-orange-50/80 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-center justify-between flex-wrap gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Bookmark size={20} className="fill-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>Você possui {savedJobsList.length} {savedJobsList.length === 1 ? 'vaga salva' : 'vagas salvas'} nos Favoritos</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-extrabold uppercase tracking-wide">
                            Salvas
                          </span>
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                          Acesse suas oportunidades salvas para revisar requisitos, prazos e candidatar-se.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTabChange('favorites')}
                      className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Bookmark size={14} className="fill-white" /> Ver Vagas Salvas ({savedJobsList.length}) →
                    </button>
                  </div>
                )}
                {apps.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center mx-auto">
                      <Briefcase size={32} />
                    </div>
                    <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">
                      {isFreelancer ? 'Você ainda não enviou propostas para nenhuma oportunidade.' : 'Você ainda não se candidatou a nenhuma vaga.'}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-slate-400 mb-5 max-w-md mx-auto">
                      {isFreelancer
                        ? 'Explore oportunidades de Prestador de Serviço (PJ) ou divulgue seus serviços no Marketplace local.'
                        : 'Explore o mural de oportunidades abertas e envie seu currículo para as melhores empresas da nossa região.'}
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <Link to="/vagas" className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-xs inline-flex items-center gap-2">
                        <ExternalLink size={15} /> {isFreelancer ? 'Explorar Vagas PJ' : 'Explorar Vagas Disponíveis'}
                      </Link>
                      {isFreelancer && (
                        <Link to="/servicos" className="btn btn-teal px-5 py-2.5 font-bold rounded-xl shadow-xs inline-flex items-center gap-2">
                          Marketplace de Serviços
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4 sm:gap-5">
                    {apps.map(app => (
                      <div key={app.id} className="card p-5 sm:p-5.5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-slate-800 hover:border-primary-blue/30 transition-all shadow-xs hover:shadow-md flex flex-col justify-between h-full bg-white dark:bg-slate-900 gap-4">
                        {/* Top */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${(Number(app.matchScore) || 0) >= 85
                                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                }`}>
                                {app.matchScore || 0}% Match
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${String(app.status || '').includes('Entrevista')
                                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                                }`}>
                                {app.status || 'Candidatura Enviada'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-heading text-base sm:text-lg font-bold text-primary-dark dark:text-white leading-snug line-clamp-2">{app.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-slate-300">
                                <Building2 size={13} className="text-primary-blue" /> {app.company}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <MapPin size={13} className="text-gray-400" /> {app.city}
                              </span>
                              <span>·</span>
                              <span className="font-medium text-gray-600 dark:text-slate-300">{app.type}</span>
                            </div>
                          </div>

                          {/* Progress stages (Linha do Tempo Gupy) */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                            {(Array.isArray(app.stages) ? app.stages : []).map((stage, i, arr) => (
                              <div key={i} className="flex items-center gap-1.5 shrink-0">
                                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${stage?.completed
                                    ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                                    : stage?.active
                                      ? 'bg-primary-blue text-white shadow-xs font-bold'
                                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                                  }`}>
                                  {stage?.completed ? <CheckCircle size={11} /> : <Clock size={11} />}
                                  <span>{stage?.name || 'Etapa'}</span>
                                </div>
                                {i < arr.length - 1 && (
                                  <ArrowRight size={11} className="text-gray-300 dark:text-slate-700 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Next step note */}
                          {app.nextStepNote && (
                            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl px-3 py-2 text-xs text-primary-blue dark:text-blue-300 font-medium flex items-start gap-1.5">
                              <FileText size={13} className="shrink-0 text-primary-blue mt-0.5" />
                              <span><strong>Recrutador:</strong> {app.nextStepNote}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] text-gray-400 dark:text-slate-400">Em {app.appliedAt}</span>
                          <button
                            onClick={() => {
                              const targetEmail = app.recruiterEmail || '';
                              const targetUid = app.recruiterUid || app.companyUid || '';

                              if (!targetEmail && !targetUid) {
                                showToast('Empresa da vaga não possui dados de contato de chat vinculados.');
                                return;
                              }

                              startChatWith({
                                name: app.company,
                                email: targetEmail,
                                uid: targetUid,
                                role: 'empresa',
                                avatar: (app.companyLogo && !isGenericPlaceholderAvatar(app.companyLogo)) ? app.companyLogo : ''
                              }, `Candidatura: ${app.title}`);
                            }}
                            className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs rounded-xl"
                          >
                            <MessageSquare size={13} /> Conversar no Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: VAGAS FAVORITAS / SALVAS */}
            {candidateTab === 'favorites' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {savedJobsList.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
                      <Bookmark size={32} className="fill-amber-500" />
                    </div>
                    <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma vaga favoritada ainda.</p>
                    <p className="text-sm text-gray-400 dark:text-slate-400 mb-5 max-w-md mx-auto">
                      Ao navegar pelo mural de vagas, clique no botão de marcador para salvar vagas do seu interesse e acessá-las rapidamente aqui.
                    </p>
                    <Link to="/vagas" className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-xs inline-flex items-center gap-2">
                      <ExternalLink size={15} /> Explorar Vagas no Vale do Ivaí
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4 sm:gap-5">
                    {savedJobsList.map(job => (
                      <JobCard
                        key={job.id || job.firestoreId}
                        job={job}
                        matchScore={job.calculatedScore}
                        onSelect={setSelectedJob}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Modal: Detalhes da Vaga para Candidatura Direta */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          matchScore={selectedJob.calculatedScore}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Modal: Candidatos Inscritos na Vaga (Visão da Empresa) */}
      {selectedJobApplicants && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedJobApplicants(null)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-2xl p-7 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">
                  Candidatos Inscritos: {selectedJobApplicants.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Candidatos reais que se inscreveram nesta vaga no Vale do Ivaí.</p>
              </div>
              <button onClick={() => setSelectedJobApplicants(null)}><XCircle size={22} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
            </div>

            {displayedJobApplicants.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <Users size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-gray-700 dark:text-white text-sm">Nenhum candidato se inscreveu nesta vaga ainda.</p>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Assim que um estudante ou profissional clicar em "Candidatar-se", ele aparecerá aqui instantaneamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedJobApplicants.map(cand => (
                  <div key={cand.id || cand.firestoreId} className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-primary-blue font-heading font-black text-lg flex items-center justify-center shrink-0 overflow-hidden border border-blue-200/50">
                        {cand.candidateAvatar || cand.avatar ? (
                          <img src={cand.candidateAvatar || cand.avatar} alt={cand.candidateName || cand.name} className="w-full h-full object-cover" />
                        ) : (
                          (cand.candidateName || cand.name || 'C')[0].toUpperCase()
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white text-base">
                            {cand.candidateName || cand.name || 'Candidato'}
                          </h4>
                          <span className="text-xs font-extrabold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 rounded-full">
                            {cand.matchScore || 90}% Match
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-primary-blue border border-blue-200 dark:border-blue-800">
                            {cand.stage === 'analise' ? 'Em Análise' : cand.stage === 'entrevista' ? 'Entrevista' : cand.stage === 'desafio' ? 'Desafio' : cand.stage === 'aprovado' ? 'Aprovado' : cand.stage === 'reprovado' ? 'Banco de Talentos' : 'Triagem / Novo'}
                          </span>
                        </div>

                        <div className="text-xs text-gray-600 dark:text-slate-300 font-medium">
                          {cand.candidateCourse || 'Estudante / Profissional'} {cand.candidateInstitution ? `• ${cand.candidateInstitution}` : ''}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-slate-400 flex-wrap pt-0.5">
                          {cand.candidateCity && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-primary-blue" /> {cand.candidateCity}
                            </span>
                          )}
                          {cand.candidatePhone && (
                            <a href={`tel:${cand.candidatePhone}`} className="text-primary-blue hover:underline flex items-center gap-1 font-medium">
                              <Phone size={11} /> {cand.candidatePhone}
                            </a>
                          )}
                          <span>·</span>
                          <span>Inscrito em {cand.appliedAt || 'Hoje'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          const candEmail = cand.candidateEmail || cand.email || '';
                          const candUid = cand.candidateUid || cand.candidateId || cand.id || '';

                          if (!candEmail && !candUid) {
                            showToast('Candidato não possui canal de chat configurado.');
                            return;
                          }

                          startChatWith({
                            name: cand.candidateName || cand.name || 'Candidato',
                            email: candEmail,
                            uid: candUid,
                            role: 'aluno',
                            avatar: ((cand.candidateAvatar || cand.avatar) && !isGenericPlaceholderAvatar(cand.candidateAvatar || cand.avatar)) ? (cand.candidateAvatar || cand.avatar) : ''
                          }, `Processo Seletivo: ${selectedJobApplicants.title}`);
                          setSelectedJobApplicants(null);
                        }}
                        className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MessageSquare size={13} /> Chat
                      </button>
                      <button
                        onClick={() => navigate(`/perfil/${cand.candidateUid || cand.candidateId || cand.id}`)}
                        className="btn btn-outline btn-sm text-xs font-bold"
                      >
                        <Eye size={13} /> Ver Perfil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal: Publicar Nova Vaga */}
      <PublishJobModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onJobCreated={(newJob) => {
          if (newJob) {
            setLiveJobs(prev => [newJob, ...prev.filter(j => String(j.id) !== String(newJob.id) && String(j.firestoreId) !== String(newJob.id))]);
          } else {
            setLiveJobs(getJobs('Todas as Cidades'));
          }
          forceUpdate(n => n + 1);
        }}
      />

      {/* Modal Moderno para Encerrar ou Excluir Vaga */}
      <JobActionModal
        isOpen={Boolean(jobActionModalTarget)}
        onClose={() => setJobActionModalTarget(null)}
        job={jobActionModalTarget}
        onCloseJob={handleCloseJob}
        onDeleteJob={handleDeleteJob}
      />
    </>
  );
}
