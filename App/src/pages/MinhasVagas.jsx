import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle, CheckCircle2, Clock, ArrowRight,
  ArrowLeft, Plus, Users, Eye, Edit3, XCircle, RotateCcw, Phone, ShieldCheck,
  Award, Send, Check, X, FileText, Calendar, Sparkles, Star, Copy, Share2,
  Search, Filter, ExternalLink, ChevronRight, Download, Trash2,
  SlidersHorizontal, Video, AlertCircle, GraduationCap, LayoutGrid,
  ListFilter, MessageSquare, ChevronDown
} from 'lucide-react';
import {
  getUserApplications, generateWhatsAppLink, getJobs,
  updateJobStatus, updateJob, duplicateJob, deleteJob,
  getEndorsementRequests, approveEndorsementRequest, rejectEndorsementRequest,
  getJobCandidates, updateCandidateStage, updateCandidateData,
  scheduleCandidateInterview, SELECTION_STAGES, calculateMatchScore
} from '../lib/ivaiConecta';
import useAppStore from '../store/useAppStore';

export default function MinhasVagas() {
  const { currentUser, showToast } = useAppStore();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  const isCompany   = currentUser?.role === 'empresa';
  const isProfessor = currentUser?.role === 'professor';

  // ── Teacher state ──
  const requests = getEndorsementRequests();
  const teacherRequests = requests.filter(r => r.profEmail?.toLowerCase() === currentUser?.email?.toLowerCase() || currentUser?.role === 'professor');
  const [customQuote, setCustomQuote] = useState({});

  // ── Candidate / Student state ──
  const apps = getUserApplications();

  // ── Company state ──
  const allCompanyJobs = useMemo(() => {
    const jobs = getJobs('Todas as Cidades');
    if (!currentUser) return jobs;
    // Filter jobs for company: match company name prefix or return seed company jobs
    const userCompanyMatch = jobs.filter(j => 
      j.company?.toLowerCase().includes(currentUser.name?.toLowerCase().split(' ')[0] || 'valetech') ||
      (currentUser.name && j.company?.toLowerCase().includes(currentUser.name.toLowerCase()))
    );
    return userCompanyMatch.length > 0 ? userCompanyMatch : jobs.slice(0, 3);
  }, [currentUser]);

  // Selected job for pipeline view
  const [selectedJobId, setSelectedJobId] = useState(allCompanyJobs[0]?.id || 101);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'jobs_list'
  
  // Pipeline Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('todos');
  const [minMatchFilter, setMinMatchFilter] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Selected candidate detail drawer/modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Interview schedule form modal / inline state
  const [interviewForm, setInterviewForm] = useState({
    date: '',
    time: '',
    format: 'Google Meet',
    link: '',
    notes: ''
  });

  // Edit Job Modal State
  const [editingJob, setEditingJob] = useState(null);

  // Active current job object
  const currentJob = allCompanyJobs.find(j => j.id === Number(selectedJobId) || j.id === selectedJobId) || allCompanyJobs[0];

  // Candidates for currently selected job
  const jobCandidates = useMemo(() => {
    if (!currentJob) return [];
    return getJobCandidates(currentJob.id);
  }, [currentJob, forceUpdate]);

  // Overall candidates across all company jobs
  const allCompanyCandidates = useMemo(() => {
    return allCompanyJobs.flatMap(job => {
      const cands = getJobCandidates(job.id);
      return cands.map(c => ({ ...c, jobTitle: job.title, jobId: job.id }));
    });
  }, [allCompanyJobs, forceUpdate]);

  // Filtered candidate list for current job
  const filteredCandidates = useMemo(() => {
    return jobCandidates.filter(c => {
      const matchQuery = !candidateSearch || 
        c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.course.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.skills.some(s => s.toLowerCase().includes(candidateSearch.toLowerCase()));
      const matchStage = selectedStageFilter === 'todos' || c.stage === selectedStageFilter;
      const matchScore = c.matchScore >= minMatchFilter;
      const matchVerif = !onlyVerified || c.isVerifiedStudent;
      return matchQuery && matchStage && matchScore && matchVerif;
    });
  }, [jobCandidates, candidateSearch, selectedStageFilter, minMatchFilter, onlyVerified]);

  // KPI Metrics for Company Header
  const totalActiveJobs = allCompanyJobs.filter(j => j.status === 'Ativa').length;
  const totalApplicantsCount = allCompanyCandidates.length;
  const totalInterviewsCount = allCompanyCandidates.filter(c => c.stage === 'entrevista').length;
  const totalApprovedCount = allCompanyCandidates.filter(c => c.stage === 'aprovado').length;
  const avgMatchScore = allCompanyCandidates.length > 0 
    ? Math.round(allCompanyCandidates.reduce((acc, c) => acc + (c.matchScore || 0), 0) / allCompanyCandidates.length)
    : 90;

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

  // ── Actions: Jobs ──
  const handleJobStatusAction = (jobId, action) => {
    updateJobStatus(jobId, action);
    showToast(action === 'close' ? 'Vaga encerrada com sucesso.' : 'Vaga reaberta com sucesso!');
    forceUpdate(n => n + 1);
  };

  const handleDuplicateJob = (jobId) => {
    const cloned = duplicateJob(jobId);
    if (cloned) {
      showToast('✨ Vaga duplicada com sucesso!');
      setSelectedJobId(cloned.id);
      forceUpdate(n => n + 1);
    }
  };

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.')) {
      deleteJob(jobId);
      showToast('Vaga excluída com sucesso.');
      forceUpdate(n => n + 1);
    }
  };

  const handleSaveJobEdit = (e) => {
    e.preventDefault();
    if (!editingJob) return;
    updateJob(editingJob.id, editingJob);
    showToast('✅ Alterações da vaga salvas com sucesso!');
    setEditingJob(null);
    forceUpdate(n => n + 1);
  };

  const handleCopyJobLink = (jobId) => {
    const url = `${window.location.origin}/vagas?jobId=${jobId}`;
    navigator.clipboard.writeText(url);
    showToast('📋 Link da vaga copiado para a área de transferência!');
  };

  // ── Actions: Candidate Pipeline ──
  const handleMoveStage = (candidateId, newStage, note = '') => {
    if (!currentJob) return;
    updateCandidateStage(currentJob.id, candidateId, newStage, note);
    const stageName = SELECTION_STAGES.find(s => s.id === newStage)?.name || newStage;
    showToast(`Candidato movido para "${stageName}"`);
    
    // update current selected modal if open
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({
        ...prev,
        stage: newStage,
        activity: [
          ...(prev.activity || []),
          { date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), text: `Movido para: ${stageName}` }
        ]
      }));
    }
    forceUpdate(n => n + 1);
  };

  const handleRatingChange = (candidateId, rating) => {
    if (!currentJob) return;
    updateCandidateData(currentJob.id, candidateId, { rating });
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, rating }));
    }
    showToast(`Avaliação atualizada: ${rating} estrelas`);
    forceUpdate(n => n + 1);
  };

  const handleNotesChange = (candidateId, notes) => {
    if (!currentJob) return;
    updateCandidateData(currentJob.id, candidateId, { notes });
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, notes }));
    }
    forceUpdate(n => n + 1);
  };

  const handleScheduleInterview = (e) => {
    e.preventDefault();
    if (!currentJob || !selectedCandidate) return;
    if (!interviewForm.date || !interviewForm.time) {
      showToast('Por favor, informe a data e horário da entrevista.');
      return;
    }
    scheduleCandidateInterview(currentJob.id, selectedCandidate.id, interviewForm);
    showToast('📅 Entrevista agendada com sucesso!');
    setSelectedCandidate(prev => ({
      ...prev,
      stage: 'entrevista',
      interview: { ...interviewForm }
    }));
    forceUpdate(n => n + 1);
  };

  // ── WhatsApp Message Templates ──
  const buildWhatsAppMessage = (type, candidate, job) => {
    const candidateFirstName = candidate.name.split(' ')[0];
    const companyName = job.company || currentUser.name || 'Nossa Empresa';
    const jobTitle = job.title;

    let message = '';
    if (type === 'interview') {
      const interviewInfo = candidate.interview 
        ? `para o dia ${candidate.interview.date.split('-').reverse().join('/')} às ${candidate.interview.time} (${candidate.interview.format}${candidate.interview.link ? ` - Link/Local: ${candidate.interview.link}` : ''})`
        : 'em um horário que fique bom para você';
      message = `Olá ${candidateFirstName}, tudo bem? Aqui é do time de recrutamento da ${companyName}.\n\nVimos seu currículo para a vaga de "${jobTitle}" no Ivaí Conecta e gostaríamos de agendar uma entrevista ${interviewInfo}.\n\nVocê confirma a disponibilidade?`;
    } else if (type === 'challenge') {
      message = `Olá ${candidateFirstName}! Parabéns pelo seu progresso no processo seletivo da vaga "${jobTitle}" na ${companyName} via Ivaí Conecta.\n\nGostaríamos de convidá-lo para a etapa prática do teste técnico. Podemos te enviar os detalhes por aqui ou por e-mail?`;
    } else if (type === 'proposal') {
      message = `Olá ${candidateFirstName}! É com grande alegria que informamos que você foi APROVADO(A) no processo seletivo para a vaga de "${jobTitle}" na ${companyName}! 🎉\n\nGostaríamos de conversar sobre os próximos passos e o envio da proposta oficial de contratação.`;
    } else if (type === 'feedback') {
      message = `Olá ${candidateFirstName}, agradecemos muito sua dedicação no processo seletivo da vaga "${jobTitle}" na ${companyName}.\n\nNo momento decidimos seguir com outro perfil, mas seu currículo foi guardado com carinho em nosso Banco de Talentos para futuras oportunidades na região!`;
    } else {
      message = `Olá ${candidateFirstName}, vimos seu perfil no Ivaí Conecta para a vaga de "${jobTitle}" na ${companyName} e gostaríamos de conversar!`;
    }

    return `https://wa.me/${candidate.phone}?text=${encodeURIComponent(message)}`;
  };

  // ── Teacher Actions ──
  const handleApproveTeacherRequest = (reqId) => {
    const quoteText = customQuote[reqId] || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio lógico em disciplinas práticas.';
    const res = approveEndorsementRequest(reqId, quoteText);
    if (res.success) {
      showToast('🎉 Parecer pedagógico concedido e selo verificado atribuído ao perfil do aluno!');
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
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-10 lg:py-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-4 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} /> {isCompany ? 'Painel de Recrutamento Corporativo' : isProfessor ? 'Portal do Docente' : 'Painel do Candidato'}
                </span>
                {isCompany && (
                  <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={13} /> Empresa Verificada
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-heading font-extrabold text-white mb-2 tracking-tight">
                {isProfessor
                  ? 'Painel do Docente & Recomendações'
                  : isCompany
                  ? 'Gestão de Vagas & Processos Seletivos'
                  : 'Minhas Candidaturas'}
              </h1>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                {isProfessor
                  ? 'Avalie pedidos de parecer pedagógico dos seus alunos do IFPR, Univale e UENP e atribua selos verificados.'
                  : isCompany
                  ? 'Acompanhe todas as etapas do funil de contratação, avalie currículos, agende entrevistas e entre em contato direto via WhatsApp.'
                  : 'Acompanhe o status e a evolução de todas as suas candidaturas no Vale do Ivaí.'}
              </p>
            </div>

            {isCompany && (
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <Link to="/talentos" className="btn btn-outline border-white/30 text-white hover:bg-white/10 px-4 py-2.5 font-bold text-xs">
                  <GraduationCap size={15} /> Banco de Talentos
                </Link>
                <Link to="/vagas?action=new" className="btn btn-teal px-5 py-2.5 font-bold text-xs shadow-md shrink-0 flex items-center gap-2">
                  <Plus size={16} /> Publicar Nova Vaga
                </Link>
              </div>
            )}
          </div>

          {/* ── KPI METRICS CARDS (FOR COMPANY) ── */}
          {isCompany && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
                <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Briefcase size={14} className="text-blue-300" /> Vagas Ativas
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalActiveJobs}</div>
                <div className="text-[11px] text-blue-200 mt-0.5">{allCompanyJobs.length} no total</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
                <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Users size={14} className="text-emerald-300" /> Candidaturas
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalApplicantsCount}</div>
                <div className="text-[11px] text-emerald-200 mt-0.5">Em todas as vagas</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
                <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Calendar size={14} className="text-purple-300" /> Entrevistas
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalInterviewsCount}</div>
                <div className="text-[11px] text-purple-200 mt-0.5">Agendadas / em curso</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
                <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} className="text-teal-300" /> Aprovados
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalApprovedCount}</div>
                <div className="text-[11px] text-teal-200 mt-0.5">Proposta / Contratação</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 col-span-2 sm:col-span-1 transition-transform hover:-translate-y-0.5">
                <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-amber-300" /> Match Médio
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{avgMatchScore}%</div>
                <div className="text-[11px] text-amber-200 mt-0.5">Alta afinidade local</div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container section">

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

            {/* Recomendações Já Concedidas */}
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
                      <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full">
                        ✓ Aprovado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : isCompany ? (
          /* ── VISÃO COMPLETA DA EMPRESA: GERENCIAMENTO DE VAGAS & PROCESSO SELETIVO ── */
          <div className="space-y-8 max-w-6xl mx-auto">
            
            {/* ── SUBNAV TABS: PIPELINE vs LISTA DE VAGAS ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'pipeline'
                      ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid size={15} /> Processo Seletivo (Pipeline)
                </button>
                <button
                  onClick={() => setActiveTab('jobs_list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'jobs_list'
                      ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Briefcase size={15} /> Minhas Vagas Cadastradas ({allCompanyJobs.length})
                </button>
              </div>

              {activeTab === 'pipeline' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Modo de Exibição:</span>
                  <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                        viewMode === 'kanban'
                          ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs'
                          : 'text-gray-500 dark:text-slate-400'
                      }`}
                      title="Visão Kanban (Etapas)"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs'
                          : 'text-gray-500 dark:text-slate-400'
                      }`}
                      title="Visão em Lista"
                    >
                      <ListFilter size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── TAB 1: PIPELINE & PROCESSO SELETIVO DOS CANDIDATOS ── */}
            {activeTab === 'pipeline' && (
              <div className="space-y-6">
                
                {/* Job Selector Header */}
                <div className="card p-5 sm:p-6 bg-gradient-to-r from-white via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/60 border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={13} /> Seleção de Vaga Ativa
                      </span>
                      <div className="flex items-center gap-3 flex-wrap">
                        <select
                          value={selectedJobId}
                          onChange={(e) => setSelectedJobId(Number(e.target.value))}
                          className="font-heading text-lg sm:text-xl font-extrabold text-primary-dark dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-1.5 cursor-pointer focus:ring-2 focus:ring-primary-blue"
                        >
                          {allCompanyJobs.map(job => (
                            <option key={job.id} value={job.id}>
                              {job.title} ({job.city}) - {job.status}
                            </option>
                          ))}
                        </select>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          currentJob?.status === 'Ativa'
                            ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                        }`}>
                          {currentJob?.status || 'Ativa'}
                        </span>
                      </div>
                    </div>

                    {/* Fast actions on current vacancy */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopyJobLink(currentJob?.id)}
                        className="btn btn-outline btn-sm text-xs font-bold"
                        title="Copiar link direto para envio aos candidatos"
                      >
                        <Share2 size={13} /> Compartilhar Vaga
                      </button>
                      <button
                        onClick={() => setEditingJob(currentJob)}
                        className="btn btn-outline btn-sm text-xs font-bold"
                      >
                        <Edit3 size={13} /> Editar Detalhes
                      </button>
                    </div>
                  </div>

                  {/* Vacancy Summary Chips */}
                  {currentJob && (
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-300">
                      <span className="flex items-center gap-1 font-medium"><MapPin size={13} className="text-gray-400" /> {currentJob.city}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-medium"><Clock size={13} className="text-gray-400" /> {currentJob.type}</span>
                      <span>·</span>
                      <span className="font-semibold text-primary-blue dark:text-blue-400"><Users size={13} className="inline mr-1" /> {jobCandidates.length} Candidatos nesta vaga</span>
                      <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                        <span>Habilidades:</span>
                        {(currentJob.requiredSkills || []).map(skill => (
                          <span key={skill} className="bg-blue-100 dark:bg-blue-950/80 text-primary-blue dark:text-blue-300 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── FILTERS BAR ── */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                    <div className="relative flex-1 max-w-md">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        placeholder="Buscar candidato por nome, curso ou habilidade..."
                        className="form-control pl-9 text-xs py-2 w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Stage Filter */}
                    <select
                      value={selectedStageFilter}
                      onChange={(e) => setSelectedStageFilter(e.target.value)}
                      className="form-control text-xs py-2 pr-8"
                    >
                      <option value="todos">Todas as Etapas</option>
                      {SELECTION_STAGES.map(stg => (
                        <option key={stg.id} value={stg.id}>{stg.name}</option>
                      ))}
                    </select>

                    {/* Match filter */}
                    <select
                      value={minMatchFilter}
                      onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                      className="form-control text-xs py-2 pr-8"
                    >
                      <option value={0}>Qualquer % Match</option>
                      <option value={80}>80%+ Match</option>
                      <option value={90}>90%+ Match (Destaque)</option>
                    </select>

                    {/* Verified Student Toggle */}
                    <button
                      onClick={() => setOnlyVerified(v => !v)}
                      className={`btn btn-sm text-xs font-bold transition-colors ${
                        onlyVerified
                          ? 'bg-green-100 dark:bg-green-950/70 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
                          : 'btn-outline text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      <ShieldCheck size={14} className={onlyVerified ? 'text-green-600 dark:text-green-400' : ''} />
                      Apenas Selo Verificado
                    </button>
                  </div>
                </div>

                {/* ── KANBAN BOARD VIEW ── */}
                {viewMode === 'kanban' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
                    {SELECTION_STAGES.map(stage => {
                      const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id);
                      
                      const stageHeaderColors = {
                        blue: 'border-t-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300',
                        amber: 'border-t-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
                        purple: 'border-t-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300',
                        indigo: 'border-t-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300',
                        emerald: 'border-t-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                        slate: 'border-t-slate-400 bg-slate-100/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-400'
                      }[stage.color];

                      return (
                        <div
                          key={stage.id}
                          className="bg-gray-100/70 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl p-3 min-w-[210px] space-y-3"
                        >
                          {/* Column Header */}
                          <div className={`p-2.5 rounded-xl border-t-4 border border-gray-200/80 dark:border-slate-700/80 flex items-center justify-between ${stageHeaderColors}`}>
                            <div>
                              <h4 className="font-heading text-xs font-extrabold uppercase tracking-tight">{stage.name}</h4>
                              <p className="text-[10px] opacity-75">{stage.description}</p>
                            </div>
                            <span className="bg-white/80 dark:bg-slate-800 text-gray-800 dark:text-white text-xs font-black px-2 py-0.5 rounded-full shadow-2xs">
                              {stageCandidates.length}
                            </span>
                          </div>

                          {/* Candidates Cards in this Column */}
                          <div className="space-y-3 min-h-[140px]">
                            {stageCandidates.length === 0 ? (
                              <div className="border border-dashed border-gray-300 dark:border-slate-800 rounded-xl p-4 text-center text-gray-400 dark:text-slate-600 text-xs">
                                Nenhum candidato nesta etapa
                              </div>
                            ) : (
                              stageCandidates.map(cand => (
                                <div
                                  key={cand.id}
                                  onClick={() => setSelectedCandidate(cand)}
                                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-primary-blue dark:hover:border-blue-500 rounded-xl p-3.5 shadow-xs hover:shadow-brand-md transition-all cursor-pointer space-y-2.5 group"
                                >
                                  {/* Avatar & Match */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={cand.avatar}
                                        alt={cand.name}
                                        className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                                      />
                                      <div>
                                        <div className="font-bold text-gray-900 dark:text-white text-xs leading-snug group-hover:text-primary-blue dark:group-hover:text-blue-400 transition-colors">
                                          {cand.name}
                                        </div>
                                        <div className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1">{cand.institution}</div>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                      cand.matchScore >= 90
                                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                        : cand.matchScore >= 80
                                        ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                                    }`}>
                                      {cand.matchScore}%
                                    </span>
                                  </div>

                                  {/* Student verification and course */}
                                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                    {cand.isVerifiedStudent && (
                                      <span className="bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/80 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 text-[10px]">
                                        <ShieldCheck size={11} /> Selo IFPR/Univale
                                      </span>
                                    )}
                                    {cand.endorsements && cand.endorsements.length > 0 && (
                                      <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 text-[10px]" title="Recomendado por professor">
                                        <Award size={11} /> {cand.endorsements.length} Parecer Docente
                                      </span>
                                    )}
                                  </div>

                                  {/* Star Rating Indicator */}
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star
                                        key={star}
                                        size={12}
                                        className={star <= (cand.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600'}
                                      />
                                    ))}
                                  </div>

                                  {/* Interview Tag if scheduled */}
                                  {cand.interview && (
                                    <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 rounded-lg p-1.5 text-[10px] text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-1.5">
                                      <Calendar size={12} className="text-purple-600 shrink-0" />
                                      <span>{cand.interview.date.split('-').reverse().join('/')} às {cand.interview.time}</span>
                                    </div>
                                  )}

                                  {/* Card Quick Actions */}
                                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                                    <a
                                      href={buildWhatsAppMessage('chat', cand, currentJob)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
                                      title="Falar no WhatsApp"
                                    >
                                      <Phone size={12} /> WhatsApp
                                    </a>

                                    {/* Quick Stage Mover Dropdown */}
                                    <select
                                      value={cand.stage}
                                      onChange={(e) => handleMoveStage(cand.id, e.target.value)}
                                      className="text-[10px] font-bold bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-1.5 py-0.5 cursor-pointer text-gray-700 dark:text-slate-200"
                                    >
                                      {SELECTION_STAGES.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ── LIST VIEW ── */
                  <div className="card overflow-hidden p-0 border border-gray-200 dark:border-slate-800">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-slate-800/70 text-gray-500 dark:text-slate-400 uppercase font-semibold border-b border-gray-200 dark:border-slate-700">
                          <tr>
                            <th className="p-4">Candidato</th>
                            <th className="p-4">Curso / Cidade</th>
                            <th className="p-4">Match</th>
                            <th className="p-4">Avaliação</th>
                            <th className="p-4">Etapa Atual</th>
                            <th className="p-4">Data Inscrição</th>
                            <th className="p-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {filteredCandidates.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-gray-400">
                                Nenhum candidato corresponde aos filtros aplicados.
                              </td>
                            </tr>
                          ) : (
                            filteredCandidates.map(cand => (
                              <tr key={cand.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-4 font-bold text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-3">
                                    <img src={cand.avatar} alt={cand.name} className="w-8 h-8 rounded-full object-cover" />
                                    <div>
                                      <div>{cand.name}</div>
                                      {cand.isVerifiedStudent && (
                                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                                          <ShieldCheck size={11} /> Selo Verificado
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-slate-300">
                                  <div>{cand.course}</div>
                                  <div className="text-[11px] text-gray-400">{cand.city}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    cand.matchScore >= 90
                                      ? 'bg-green-100 text-green-800 dark:bg-green-950/80 dark:text-green-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                  }`}>
                                    {cand.matchScore}% Match
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star
                                        key={star}
                                        size={12}
                                        className={star <= (cand.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600'}
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <select
                                    value={cand.stage}
                                    onChange={(e) => handleMoveStage(cand.id, e.target.value)}
                                    className="form-control text-xs py-1 font-bold"
                                  >
                                    {SELECTION_STAGES.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-4 text-gray-400">{cand.appliedAt}</td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setSelectedCandidate(cand)}
                                      className="btn btn-outline btn-sm text-xs font-bold"
                                    >
                                      <Eye size={13} /> Detalhes
                                    </button>
                                    <a
                                      href={buildWhatsAppMessage('chat', cand, currentJob)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-whatsapp btn-sm text-xs font-bold"
                                    >
                                      <Phone size={13} />
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: LISTA DE VAGAS CRIADAS DA EMPRESA ── */}
            {activeTab === 'jobs_list' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">
                    Minhas Vagas Publicadas ({allCompanyJobs.length})
                  </h3>
                  <Link to="/vagas?action=new" className="btn btn-teal btn-sm text-xs font-bold">
                    <Plus size={14} /> Criar Nova Vaga
                  </Link>
                </div>

                {allCompanyJobs.map(job => {
                  const cands = getJobCandidates(job.id);
                  return (
                    <div key={job.id} className="card p-6 space-y-4 border border-gray-200 dark:border-slate-800">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                              job.status === 'Ativa'
                                ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                            }`}>
                              Status: {job.status || 'Ativa'}
                            </span>
                            <span className="text-xs text-gray-400">Criada em: {job.createdAt || '15/08/2026'}</span>
                          </div>
                          <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">{job.title}</h3>
                          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 dark:text-slate-400 flex-wrap">
                            <span><MapPin size={13} className="inline mr-1 text-gray-400" />{job.city}</span>
                            <span>·</span>
                            <span>{job.type}</span>
                            <span>·</span>
                            <span>{job.salary || 'Salário a combinar'}</span>
                          </div>
                        </div>

                        {/* Pipeline button & actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setActiveTab('pipeline');
                            }}
                            className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            <LayoutGrid size={14} /> Gerenciar Processo ({cands.length} Candidatos)
                          </button>

                          <button
                            onClick={() => setEditingJob(job)}
                            className="btn btn-outline btn-sm text-xs font-bold"
                            title="Editar Vaga"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => handleDuplicateJob(job.id)}
                            className="btn btn-outline btn-sm text-xs font-bold"
                            title="Duplicar Vaga"
                          >
                            <Copy size={14} />
                          </button>

                          {job.status === 'Ativa' ? (
                            <button
                              onClick={() => handleJobStatusAction(job.id, 'close')}
                              className="btn btn-outline border-red-200 text-red-600 dark:text-red-400 hover:bg-red-50 btn-sm text-xs font-bold"
                              title="Encerrar Vaga"
                            >
                              <XCircle size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJobStatusAction(job.id, 'extend')}
                              className="btn btn-outline border-green-200 text-green-700 dark:text-green-400 hover:bg-green-50 btn-sm text-xs font-bold"
                              title="Reabrir Vaga"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 btn-sm text-xs font-bold"
                            title="Excluir Vaga"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Candidates Pipeline Summary Bar */}
                      <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-semibold text-gray-700 dark:text-slate-200">Funil de Candidatos:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">📥 {cands.filter(c => c.stage === 'triagem').length} Triagem</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">🔍 {cands.filter(c => c.stage === 'analise').length} Em Análise</span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold">📅 {cands.filter(c => c.stage === 'entrevista').length} Entrevistas</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">💻 {cands.filter(c => c.stage === 'desafio').length} Desafios</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">🏆 {cands.filter(c => c.stage === 'aprovado').length} Aprovados</span>
                        </div>

                        <button
                          onClick={() => handleCopyJobLink(job.id)}
                          className="text-primary-blue dark:text-blue-400 hover:underline font-bold flex items-center gap-1 text-xs"
                        >
                          <Share2 size={13} /> Copiar Link da Vaga
                        </button>
                      </div>

                      {/* Required skills */}
                      <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                        <span className="font-semibold text-gray-500 dark:text-slate-400">Habilidades Exigidas:</span>
                        {(job.requiredSkills || []).map(s => (
                          <span key={s} className="tag tag-blue text-[11px]">{s}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── VISÃO DO ALUNO / CANDIDATO: MINHAS CANDIDATURAS ── */
          <>
            {apps.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
                <Briefcase size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-lg text-gray-600 dark:text-slate-200">Você ainda não se candidatou a nenhuma vaga.</p>
                <Link to="/vagas" className="btn btn-primary btn-sm mt-5">Explorar Vagas Disponíveis</Link>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {apps.map(app => {
                  const waLink = generateWhatsAppLink(app.recruiterPhone, app.title, app.company, app.city);
                  return (
                    <div key={app.id} className="card gap-4 p-5 sm:p-6 border border-gray-200 dark:border-slate-800">
                      {/* Top */}
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <h3 className="font-heading text-lg sm:text-xl font-bold text-primary-dark dark:text-white">{app.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mt-1">
                            <Building2 size={15} />{app.company}
                            <span>·</span>
                            <MapPin size={15} />{app.city}
                            <span>·</span>
                            <span className="font-medium text-gray-600 dark:text-slate-300">{app.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            app.matchScore >= 85
                              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          }`}>
                            {app.matchScore}% Match
                          </span>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            app.status?.includes('Entrevista')
                              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>

                      {/* Progress stages */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                        {app.stages.map((stage, i) => (
                          <div key={i} className="flex items-center gap-2 shrink-0">
                            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                              stage.completed
                                ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                                : stage.active
                                ? 'bg-primary-blue text-white shadow-xs font-bold'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                            }`}>
                              {stage.completed ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {stage.name}
                            </div>
                            {i < app.stages.length - 1 && (
                              <ArrowRight size={13} className="text-gray-300 dark:text-slate-700 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Next step note */}
                      {app.nextStepNote && (
                        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl px-4 py-3 text-sm text-primary-blue dark:text-blue-300 font-medium">
                          📌 <strong>Recrutador:</strong> {app.nextStepNote}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                        <span className="text-xs text-gray-400 dark:text-slate-400">Candidatado em {app.appliedAt}</span>
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm text-xs font-bold">
                          <Phone size={13} /> Contatar Recrutador no WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* ── MODAL: DETALHES & GESTÃO DO CANDIDATO (DEEP DIVE DO RECRUTADOR) ── */}
      {selectedCandidate && currentJob && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between flex-wrap gap-4 bg-gray-50/80 dark:bg-slate-800/40 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCandidate.avatar}
                  alt={selectedCandidate.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue/30 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">
                      {selectedCandidate.name}
                    </h3>
                    <span className="text-xs font-extrabold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 rounded-full">
                      {selectedCandidate.matchScore}% Match
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 mt-0.5">
                    {selectedCandidate.course} · {selectedCandidate.institution}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {selectedCandidate.city} · Inscrito em {selectedCandidate.appliedAt}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/perfil/${selectedCandidate.id}`)}
                  className="btn btn-outline btn-sm text-xs font-bold"
                  title="Abrir perfil completo"
                >
                  <ExternalLink size={13} /> Perfil do Aluno
                </button>
                <button onClick={() => setSelectedCandidate(null)}>
                  <XCircle size={24} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* ── 1. STAGE PROGRESSION STEPPER ── */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <LayoutGrid size={13} /> Etapa no Processo Seletivo (Clique para Mudar):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {SELECTION_STAGES.map((s, idx) => {
                    const isCurrent = selectedCandidate.stage === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleMoveStage(selectedCandidate.id, s.id)}
                        className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
                          isCurrent
                            ? 'bg-primary-blue text-white border-primary-blue shadow-md scale-102'
                            : 'bg-gray-50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-primary-blue/50'
                        }`}
                      >
                        <div className="text-[10px] opacity-75">{idx + 1}ª Etapa</div>
                        <div className="font-extrabold line-clamp-1">{s.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 2. ACADEMIC ENDORSEMENT / PARECER PEDAGÓGICO ── */}
              {selectedCandidate.endorsements && selectedCandidate.endorsements.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <Award size={16} className="text-amber-500" />
                    <span>Parecer Pedagógico Emitido por Professor (Selo Verificado)</span>
                  </div>
                  {selectedCandidate.endorsements.map((end, idx) => (
                    <div key={idx} className="text-xs text-amber-900 dark:text-amber-200 bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-1">
                      <div className="italic">"{end.quote}"</div>
                      <div className="font-bold text-[11px] text-amber-800 dark:text-amber-400 mt-1">
                        — {end.profName} ({end.institution}) · {end.discipline}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 3. SKILLS MATCH ANALYSIS ── */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Compatibilidade de Habilidades Técnicas:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map(skill => {
                    const isRequired = (currentJob.requiredSkills || []).some(
                      rs => rs.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <span
                        key={skill}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                          isRequired
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        {isRequired && '✓ '} {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* ── 4. RATING & RECRUITER PRIVATE NOTES ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Rating */}
                <div className="card p-4 space-y-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    Classificação do Recrutador (1 a 5 estrelas):
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(selectedCandidate.id, star)}
                        className="p-1 transition-transform hover:scale-120 cursor-pointer"
                      >
                        <Star
                          size={22}
                          className={star <= (selectedCandidate.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600'}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-gray-500 font-semibold ml-2">
                      {selectedCandidate.rating ? `${selectedCandidate.rating}/5 estrelas` : 'Não avaliado'}
                    </span>
                  </div>
                </div>

                {/* Interview Status Badge / Details */}
                <div className="card p-4 space-y-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center justify-between">
                    <span>Status da Entrevista</span>
                    {selectedCandidate.interview && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">Agendada</span>
                    )}
                  </label>
                  {selectedCandidate.interview ? (
                    <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
                      <div>📅 <strong>Data:</strong> {selectedCandidate.interview.date.split('-').reverse().join('/')} às {selectedCandidate.interview.time}</div>
                      <div>📍 <strong>Formato:</strong> {selectedCandidate.interview.format} ({selectedCandidate.interview.link || 'Presencial'})</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Nenhuma entrevista agendada ainda. Use a seção abaixo para marcar.</div>
                  )}
                </div>
              </div>

              {/* Private Notes Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText size={13} /> Anotações Internas do Recrutador (Salvo Automaticamente):
                </label>
                <textarea
                  value={selectedCandidate.notes || ''}
                  onChange={(e) => handleNotesChange(selectedCandidate.id, e.target.value)}
                  rows={3}
                  className="form-control text-xs"
                  placeholder="Ex: Candidato com boa comunicação, apresentou ótimo portfólio no GitHub. Pontos a desenvolver: Docker."
                />
              </div>

              {/* ── 5. AGENDAMENTO DE ENTREVISTA (FORM) ── */}
              <div className="border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-xs">
                  <Calendar size={16} className="text-purple-600" />
                  <span>Agendar ou Reagendar Entrevista com o Candidato</span>
                </div>

                <form onSubmit={handleScheduleInterview} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="form-label text-[11px]">Data:</label>
                    <input
                      type="date"
                      value={interviewForm.date}
                      onChange={e => setInterviewForm({ ...interviewForm, date: e.target.value })}
                      className="form-control text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="form-label text-[11px]">Horário:</label>
                    <input
                      type="time"
                      value={interviewForm.time}
                      onChange={e => setInterviewForm({ ...interviewForm, time: e.target.value })}
                      className="form-control text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="form-label text-[11px]">Formato:</label>
                    <select
                      value={interviewForm.format}
                      onChange={e => setInterviewForm({ ...interviewForm, format: e.target.value })}
                      className="form-control text-xs py-1.5"
                    >
                      <option value="Google Meet">Google Meet (Online)</option>
                      <option value="Presencial">Presencial na Empresa</option>
                      <option value="Ligação / WhatsApp">Ligação WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-[11px]">Link do Meet / Endereço:</label>
                    <input
                      type="text"
                      placeholder="https://meet.google.com/..."
                      value={interviewForm.link}
                      onChange={e => setInterviewForm({ ...interviewForm, link: e.target.value })}
                      className="form-control text-xs py-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
                    <button type="submit" className="btn btn-primary btn-sm text-xs font-bold">
                      <Calendar size={13} /> Confirmar Agendamento de Entrevista
                    </button>
                  </div>
                </form>
              </div>

              {/* ── 6. WHATSAPP TEMPLATES ── */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-500" /> Contato Rápido &amp; Modelos de Mensagem WhatsApp:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <a
                    href={buildWhatsAppMessage('interview', selectedCandidate, currentJob)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp btn-sm text-xs font-bold flex items-center justify-center gap-1.5 text-center"
                  >
                    <Calendar size={13} /> Convidar p/ Entrevista
                  </a>

                  <a
                    href={buildWhatsAppMessage('challenge', selectedCandidate, currentJob)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 btn-sm text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <FileText size={13} /> Enviar Teste Técnico
                  </a>

                  <a
                    href={buildWhatsAppMessage('proposal', selectedCandidate, currentJob)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-teal btn-sm text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={13} /> Enviar Proposta
                  </a>

                  <a
                    href={buildWhatsAppMessage('feedback', selectedCandidate, currentJob)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline text-gray-600 dark:text-slate-400 hover:bg-gray-100 btn-sm text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={13} /> Dar Feedback / Banco
                  </a>
                </div>
              </div>

              {/* ── 7. ACTIVITY LOG TIMELINE ── */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} /> Histórico de Ações neste Candidato:
                </label>
                <div className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3 space-y-2 max-h-36 overflow-y-auto">
                  {(selectedCandidate.activity || []).map((act, i) => (
                    <div key={i} className="text-xs flex items-center justify-between text-gray-600 dark:text-slate-300">
                      <span>• {act.text}</span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{act.date}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR VAGA DA EMPRESA ── */}
      {editingJob && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingJob(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-2xl p-7 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">
                  Editar Detalhes da Vaga
                </h3>
                <p className="text-xs text-gray-500">Atualize requisitos, salários e informações da vaga.</p>
              </div>
              <button onClick={() => setEditingJob(null)}>
                <XCircle size={22} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveJobEdit} className="space-y-4">
              <div>
                <label className="form-label text-xs">Título da Vaga:</label>
                <input
                  type="text"
                  value={editingJob.title}
                  onChange={e => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="form-control text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">Cidade do Vale do Ivaí:</label>
                  <input
                    type="text"
                    value={editingJob.city}
                    onChange={e => setEditingJob({ ...editingJob, city: e.target.value })}
                    className="form-control text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Tipo de Contrato / Modalidade:</label>
                  <input
                    type="text"
                    value={editingJob.type}
                    onChange={e => setEditingJob({ ...editingJob, type: e.target.value })}
                    className="form-control text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">Faixa Salarial / Bolsa:</label>
                  <input
                    type="text"
                    value={editingJob.salary || ''}
                    onChange={e => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="form-control text-xs"
                    placeholder="Ex: R$ 2.500 / mês"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Status da Vaga:</label>
                  <select
                    value={editingJob.status}
                    onChange={e => setEditingJob({ ...editingJob, status: e.target.value })}
                    className="form-control text-xs"
                  >
                    <option value="Ativa">Ativa (Recebendo Candidaturas)</option>
                    <option value="Encerrada">Encerrada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label text-xs">Habilidades Exigidas (separadas por vírgula):</label>
                <input
                  type="text"
                  value={(editingJob.requiredSkills || []).join(', ')}
                  onChange={e => setEditingJob({
                    ...editingJob,
                    requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="form-control text-xs"
                />
              </div>

              <div>
                <label className="form-label text-xs">Descrição das Atividades:</label>
                <textarea
                  value={editingJob.description}
                  onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                  rows={3}
                  className="form-control text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="btn btn-outline btn-sm text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-xs font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
