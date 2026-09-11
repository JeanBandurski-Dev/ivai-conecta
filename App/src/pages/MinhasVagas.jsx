import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle, Clock, ArrowRight,
  ArrowLeft, Plus, Users, Eye, Edit3, XCircle, RotateCcw, Phone, ShieldCheck, CheckCircle2,
  Award, Send, UserCheck, Check, X, FileText, Trash2, MessageSquare, Layers, Share2, Sparkles, ExternalLink, Bookmark
} from 'lucide-react';
import {
  getUserApplications, getJobs,
  updateJobStatus, deleteJob, getEndorsementRequests,
  approveEndorsementRequest, rejectEndorsementRequest, safeSkillsArray
} from '../lib/ivaiConecta';
import { subscribeToJobs, subscribeToApplications, subscribeToJobApplicants } from '../services/jobsService.js';
import useAppStore from '../store/useAppStore';
import PublishJobModal from '../components/PublishJobModal';
import JobActionModal from '../components/JobActionModal';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';

export default function MinhasVagas() {
  const { currentUser, favoriteJobs = [], showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [candidateTab, setCandidateTab] = useState('applications'); // 'applications' | 'favorites'
  const [selectedJob, setSelectedJob] = useState(null);

  const isCompany   = currentUser?.role === 'empresa';
  const isProfessor = currentUser?.role === 'professor';

  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));
  const [liveApps, setLiveApps] = useState(() => getUserApplications(currentUser?.uid));
  const [jobActionModalTarget, setJobActionModalTarget] = useState(null);

  useEffect(() => {
    const unsubJobs = subscribeToJobs('Todas as Cidades', (data) => {
      if (Array.isArray(data)) setLiveJobs(data);
    });
    const unsubApps = subscribeToApplications(currentUser?.uid, (data) => {
      if (Array.isArray(data)) setLiveApps(data);
    });
    return () => {
      unsubJobs();
      unsubApps();
    };
  }, [currentUser]);

  const apps = Array.isArray(liveApps) ? liveApps : [];
  const safeLiveJobs = Array.isArray(liveJobs) ? liveJobs : [];
  
  const savedJobsList = useMemo(() => {
    if (!Array.isArray(favoriteJobs) || favoriteJobs.length === 0) return [];
    return safeLiveJobs.filter(j => {
      const jId = String(j.id || j.firestoreId || '');
      return favoriteJobs.some(favId => String(favId) === jId || (j.firestoreId && String(favId) === String(j.firestoreId)));
    });
  }, [safeLiveJobs, favoriteJobs]);

  const companyJobs = safeLiveJobs.filter(j => 
    j && (
      (j.createdBy && currentUser?.uid && String(j.createdBy) === String(currentUser.uid)) ||
      (j.createdBy && currentUser?.id && String(j.createdBy) === String(currentUser.id)) ||
      (j.createdBy && currentUser?.email && String(j.createdBy).toLowerCase() === String(currentUser.email).toLowerCase()) ||
      (currentUser?.email && j.recruiterEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && j.company && j.company.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
      (currentUser?.razaoSocial && j.company && j.company.toLowerCase().trim() === currentUser.razaoSocial.toLowerCase().trim()) ||
      (currentUser?.nomeFantasia && j.company && j.company.toLowerCase().trim() === currentUser.nomeFantasia.toLowerCase().trim())
    )
  );
  
  // Teacher endorsement requests state
  const requests = getEndorsementRequests();
  const teacherRequests = requests.filter(r => (r.profEmail && currentUser?.email && r.profEmail.toLowerCase() === currentUser.email.toLowerCase()) || currentUser?.role === 'professor');
  const [customQuote, setCustomQuote] = useState({});

  // Selected job to view applicants (for company view)
  const [selectedJobApplicants, setSelectedJobApplicants] = useState(null);
  const [jobApplicants, setJobApplicants] = useState([]);

  useEffect(() => {
    if (!selectedJobApplicants) {
      setJobApplicants([]);
      return;
    }
    const targetId = selectedJobApplicants.firestoreId || selectedJobApplicants.id;
    const unsub = subscribeToJobApplicants(targetId, (data) => {
      setJobApplicants(data);
    });
    return () => unsub();
  }, [selectedJobApplicants]);

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
    try {
      const updated = await updateJobStatus(jobId, action);
      if (Array.isArray(updated)) setLiveJobs(updated);
      showToast(action === 'close' ? '🔒 Vaga encerrada com sucesso.' : '🔓 Vaga reaberta com sucesso!');
      forceUpdate(n => n + 1);
    } catch (err) {
      console.error('Erro ao atualizar status da vaga:', err);
      showToast('Erro ao atualizar status da vaga.');
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

  const handleApproveTeacherRequest = (reqId) => {
    const quoteText = customQuote[reqId] || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio lógico em disciplinas práticas.';
    const res = approveEndorsementRequest(reqId, quoteText);
    if (res.success) {
      showToast('Parecer pedagógico concedido e selo verificado atribuído ao perfil do aluno!');
      forceUpdate(n => n + 1);
    } else {
      showToast(res.error);
    }
  };

  const handleRejectTeacherRequest = (reqId) => {
    rejectEndorsementRequest(reqId);
    showToast('Solicitação recusada.');
    forceUpdate(n => n + 1);
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
                  ? 'Minhas Vagas Criadas & Candidatos'
                  : candidateTab === 'favorites'
                  ? 'Minhas Vagas Salvas & Favoritas'
                  : 'Minhas Candidaturas & Processos'}
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {isProfessor
                  ? 'Gerencie pedidos de parecer pedagógico dos seus alunos do IFPR, Univale e UENP e atribua selos verificados.'
                  : isCompany
                  ? 'Gerencie os processos seletivos da sua empresa, acompanhe os estudantes inscritos e altere os status das vagas.'
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
                <Award className="text-amber-400 fill-amber-400" size={24} /> Solicitações de Recomendação Pendentes ({teacherRequests.filter(r => r.status === 'Pendente').length})
              </h2>
            </div>

            {teacherRequests.filter(r => r.status === 'Pendente').length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
                <Award size={48} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma solicitação pendente no momento.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400">Quando seus alunos enviarem pedidos de parecer, eles aparecerão aqui para você avaliar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teacherRequests.filter(r => r.status === 'Pendente').map(req => (
                  <div key={req.id} className="card p-6 space-y-4 border-l-4 border-l-amber-400">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                          {req.studentName}
                          <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                            Solicitação em {req.requestedAt}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 mt-0.5">{req.studentCourse}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Disciplina: <strong>{req.discipline}</strong></div>
                      </div>

                      <button
                        onClick={() => navigate(`/perfil/${req.studentId}`)}
                        className="btn btn-outline btn-sm text-xs font-bold"
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
                        value={customQuote[req.id] || ''}
                        onChange={e => setCustomQuote({ ...customQuote, [req.id]: e.target.value })}
                        className="form-control text-xs"
                        rows={2}
                        placeholder="Ex: Estudante com excelente raciocínio prático, boa assiduidade e ótimo trabalho em equipe."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleRejectTeacherRequest(req.id)}
                        className="btn btn-outline border-red-200 text-red-600 dark:text-red-400 hover:bg-red-50 btn-sm text-xs font-bold"
                      >
                        <X size={14} /> Recusar
                      </button>
                      <button
                        onClick={() => handleApproveTeacherRequest(req.id)}
                        className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md"
                      >
                        <ShieldCheck size={15} /> Aprovar &amp; Conceder Selo Verificado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recomendações Já Concedidas pelo Professor */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-4">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} /> Histórico de Pareceres Emitidos
              </h3>

              {teacherRequests.filter(r => r.status === 'Aprovado').length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma recomendação finalizada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {teacherRequests.filter(r => r.status === 'Aprovado').map(req => (
                    <div key={req.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-bold text-gray-800 dark:text-white text-sm">{req.studentName}</div>
                        <div className="text-xs text-primary-blue dark:text-blue-400 font-medium">{req.discipline} · Parecer Verificado</div>
                      </div>
                      <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Aprovado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : isCompany ? (
          /* ── VISÃO DA EMPRESA: GERENCIAMENTO DE VAGAS ── */
          <div className="space-y-6 max-w-5xl mx-auto">
            
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
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-5">
                {companyJobs.map(job => (
                  <div key={job.id} className="card p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-slate-800 hover:border-primary-blue/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between h-full bg-white dark:bg-slate-900 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
                          job.status === 'Encerrada'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'Encerrada' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                          {job.status === 'Encerrada' ? 'Vaga Encerrada' : 'Vaga Ativa'}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-400">
                          {job.createdAt ? (typeof job.createdAt === 'string' && job.createdAt.includes('/') ? job.createdAt : new Date(job.createdAt).toLocaleDateString('pt-BR')) : 'Recente'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white leading-snug line-clamp-2">{job.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-primary-blue"><MapPin size={13} /> {job.city}</span>
                          <span>·</span>
                          <span>{job.type}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl px-3 py-2 text-xs font-semibold text-primary-blue dark:text-blue-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users size={14} /> Candidatos Inscritos
                        </span>
                        <span className="font-extrabold bg-primary-blue text-white px-2 py-0.5 rounded-full text-[11px]">
                          {job.applicantsCount || 0}
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
                        <Link
                          to={`/gerenciamento-vagas`}
                          className="btn btn-primary btn-sm font-bold text-xs flex items-center gap-1.5 rounded-xl shadow-xs flex-1 justify-center"
                        >
                          <Layers size={13} /> Funil Kanban
                        </Link>

                        {job.status === 'Encerrada' ? (
                          <button
                            onClick={() => handleJobAction(job.id, 'reopen')}
                            className="btn btn-outline border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 btn-sm text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Reabrir Vaga"
                          >
                            <RotateCcw size={13} />
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
          </div>
        ) : (
          /* ── VISÃO DO ALUNO / CANDIDATO: MINHAS CANDIDATURAS & FAVORITAS ── */
          <div className="space-y-6 w-full">
            
            {/* Seletor de Abas do Candidato */}
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 w-fit shadow-2xs">
              <button
                type="button"
                onClick={() => setCandidateTab('applications')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  candidateTab === 'applications'
                    ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs border border-gray-200/80 dark:border-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Send size={15} className={candidateTab === 'applications' ? 'text-primary-blue dark:text-blue-400' : 'text-gray-400'} />
                <span>Vagas Candidatadas</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  candidateTab === 'applications'
                    ? 'bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                }`}>
                  {apps.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCandidateTab('favorites')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  candidateTab === 'favorites'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-gray-200/80 dark:border-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Bookmark size={15} className={candidateTab === 'favorites' ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} />
                <span>Vagas Favoritas</span>
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
              <div className="space-y-4 animate-in fade-in duration-200">
                {apps.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center mx-auto">
                      <Briefcase size={32} />
                    </div>
                    <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Você ainda não se candidatou a nenhuma vaga.</p>
                    <p className="text-sm text-gray-400 dark:text-slate-400 mb-5 max-w-md mx-auto">
                      Explore o mural de oportunidades abertas e envie seu currículo para as melhores empresas da nossa região.
                    </p>
                    <Link to="/vagas" className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-xs inline-flex items-center gap-2">
                      <ExternalLink size={15} /> Explorar Vagas Disponíveis
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-5">
                    {apps.map(app => (
                      <div key={app.id} className="card p-6 rounded-3xl border border-gray-200 dark:border-slate-800 hover:border-primary-blue/30 transition-all shadow-xs hover:shadow-md flex flex-col justify-between h-full bg-white dark:bg-slate-900 gap-4">
                        {/* Top */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                (Number(app.matchScore) || 0) >= 85
                                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              }`}>
                                {app.matchScore || 0}% Match
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                String(app.status || '').includes('Entrevista')
                                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                              }`}>
                                {app.status || 'Candidatura Enviada'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white leading-snug line-clamp-2">{app.title}</h3>
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
                                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                  stage?.completed
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
                              const targetEmail = app.recruiterEmail || (app.company ? `${app.company.toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br` : 'empresa@ivaiconecta.com.br');

                              startChatWith({
                                name: app.company,
                                email: targetEmail,
                                role: 'empresa',
                                avatar: app.companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'
                              }, `Candidatura: ${app.title}`);
                            }}
                            className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <MessageSquare size={13} /> Chat
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
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-5">
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

            {jobApplicants.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <Users size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-gray-700 dark:text-white text-sm">Nenhum candidato se inscreveu nesta vaga ainda.</p>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Assim que um estudante ou profissional clicar em "Candidatar-se", ele aparecerá aqui instantaneamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobApplicants.map(cand => (
                  <div key={cand.id || cand.firestoreId} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                        {cand.candidateName || cand.name || 'Candidato'}
                        <span className="text-xs font-extrabold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 rounded-full">
                          {cand.matchScore || 90}% Match
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                        {cand.candidateCourse || 'Estudante / Profissional'} · Inscrito em {cand.appliedAt || 'Hoje'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          startChatWith({
                            name: cand.candidateName || cand.name || 'Candidato',
                            email: cand.candidateEmail || cand.email,
                            role: 'aluno',
                            avatar: cand.candidateAvatar || cand.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                          }, `Processo Seletivo: ${selectedJobApplicants.title}`);
                          setSelectedJobApplicants(null);
                        }}
                        className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare size={13} /> Chat com o Candidato
                      </button>
                      <button
                        onClick={() => navigate(`/perfil/${cand.candidateUid || cand.candidateId || cand.id}`)}
                        className="btn btn-outline btn-sm text-xs font-bold"
                      >
                        <Eye size={13} /> Ver Currículo
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
        onJobCreated={() => {
          setLiveJobs(getJobs('Todas as Cidades'));
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
