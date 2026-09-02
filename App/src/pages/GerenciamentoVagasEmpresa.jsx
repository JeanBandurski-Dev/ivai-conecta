import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle, CheckCircle2, Clock, ArrowRight,
  ArrowLeft, Plus, Users, Eye, Edit3, XCircle, RotateCcw, Phone, ShieldCheck,
  Award, Send, Check, X, FileText, Calendar, Sparkles, Star, Copy, Share2,
  Search, Filter, ExternalLink, ChevronRight, Download, Trash2,
  SlidersHorizontal, Video, AlertCircle, GraduationCap, LayoutGrid,
  ListFilter, MessageSquare, ChevronDown, Inbox, Settings, BarChart3,
  Layers, CheckSquare, Save, HelpCircle, UserCheck
} from 'lucide-react';
import {
  getJobs, addJob, updateJob, duplicateJob, deleteJob, updateJobStatus,
  getJobCandidates, updateCandidateStage, updateCandidateData,
  scheduleCandidateInterview, SELECTION_STAGES, calculateMatchScore,
  getCompanyCustomStages, saveCompanyCustomStages, getJobCustomStages,
  saveJobCustomStages, CITIES
} from '../lib/ivaiConecta';
import { subscribeToJobs } from '../services/jobsService';
import useAppStore from '../store/useAppStore';

export default function GerenciamentoVagasEmpresa() {
  const { currentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, forceUpdate] = useState(0);

  // ── Tab Navigation ──
  // 'pipeline' | 'jobs_list' | 'stage_settings' | 'analytics'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'pipeline');
  
  // ── Company Jobs State ──
  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));

  useEffect(() => {
    const unsub = subscribeToJobs('Todas as Cidades', (data) => setLiveJobs(data));
    return () => unsub();
  }, []);

  const allCompanyJobs = useMemo(() => {
    const jobs = liveJobs;
    if (!currentUser) return jobs;
    const userCompanyMatch = jobs.filter(j => 
      j.createdBy === currentUser?.uid ||
      j.createdBy === currentUser?.email ||
      (currentUser?.email && j.createdBy?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && j.company?.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
      j.company?.toLowerCase().includes('valetech')
    );
    return userCompanyMatch.length > 0 ? userCompanyMatch : jobs.slice(0, 4);
  }, [liveJobs, currentUser]);

  // Selected Job for Pipeline
  const [selectedJobId, setSelectedJobId] = useState(allCompanyJobs[0]?.id || 101);
  const currentJob = allCompanyJobs.find(j => j.id === Number(selectedJobId) || j.id === selectedJobId) || allCompanyJobs[0];

  // Pipeline View Mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Pipeline Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('todos');
  const [minMatchFilter, setMinMatchFilter] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Selected Candidate Drawer
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Interview Schedule Form Modal
  const [interviewForm, setInterviewForm] = useState({
    date: '',
    time: '',
    format: 'Google Meet',
    link: '',
    notes: ''
  });

  // Custom Stages State for selected job
  const [customStages, setCustomStages] = useState(() => getJobCustomStages(currentJob?.id));

  useEffect(() => {
    if (currentJob) {
      setCustomStages(getJobCustomStages(currentJob.id));
    }
  }, [currentJob?.id, selectedJobId]);

  // Edit / New Job Modal State
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [newJobForm, setNewJobForm] = useState({
    title: '',
    type: 'Tempo Integral',
    modality: 'Presencial',
    city: currentUser?.city || 'Ivaiporã',
    salary: 'R$ 2.500 - R$ 3.800',
    requiredSkills: 'React, JavaScript, HTML5/CSS3, Git',
    benefits: 'Vale Alimentação, Vale Transporte, Plano de Saúde',
    description: ''
  });

  // Candidates for selected job
  const jobCandidates = useMemo(() => {
    if (!currentJob) return [];
    return getJobCandidates(currentJob.id);
  }, [currentJob, selectedJobId]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return jobCandidates.filter(c => {
      const matchText = !candidateSearch ||
        c.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.course?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.institution?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.skills?.some(s => s?.toLowerCase().includes(candidateSearch.toLowerCase()));

      const matchStage = selectedStageFilter === 'todos' || c.stage === selectedStageFilter;
      const matchScore = (c.matchScore || 0) >= minMatchFilter;
      const matchVerified = !onlyVerified || c.isVerifiedStudent;

      return matchText && matchStage && matchScore && matchVerified;
    });
  }, [jobCandidates, candidateSearch, selectedStageFilter, minMatchFilter, onlyVerified]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalJobs = allCompanyJobs.length;
    const activeJobs = allCompanyJobs.filter(j => j.status === 'Ativa').length;
    let totalApplicants = 0;
    let inReview = 0;
    let inInterview = 0;
    let approved = 0;
    let talentPool = 0;

    allCompanyJobs.forEach(j => {
      const cands = getJobCandidates(j.id);
      totalApplicants += cands.length;
      inReview += cands.filter(c => c.stage === 'analise' || c.stage === 'desafio').length;
      inInterview += cands.filter(c => c.stage === 'entrevista').length;
      approved += cands.filter(c => c.stage === 'aprovado').length;
      talentPool += cands.filter(c => c.stage === 'reprovado').length;
    });

    return { totalJobs, activeJobs, totalApplicants, inReview, inInterview, approved, talentPool };
  }, [allCompanyJobs]);

  // ── Candidate Actions ──
  const handleStageChange = (candidateId, newStage) => {
    if (!currentJob) return;
    updateCandidateStage(currentJob.id, candidateId, newStage);
    showToast(`Candidato movido para "${customStages.find(s => s.id === newStage)?.name || newStage}" com sucesso!`);
    forceUpdate(n => n + 1);

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, stage: newStage }));
    }
  };

  const handleRatingChange = (candidateId, rating) => {
    if (!currentJob) return;
    updateCandidateData(currentJob.id, candidateId, { rating });
    showToast(`Avaliação de ${rating} estrelas salva.`);
    forceUpdate(n => n + 1);

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, rating }));
    }
  };

  const handleScheduleInterview = (e) => {
    e.preventDefault();
    if (!selectedCandidate || !currentJob) return;
    if (!interviewForm.date || !interviewForm.time) {
      showToast('Por favor, selecione data e horário.');
      return;
    }

    scheduleCandidateInterview(currentJob.id, selectedCandidate.id, interviewForm);
    showToast(`📅 Entrevista agendada com sucesso para ${interviewForm.date} às ${interviewForm.time}!`);
    setSelectedCandidate(prev => ({
      ...prev,
      stage: 'entrevista',
      interview: { ...interviewForm }
    }));
    forceUpdate(n => n + 1);
  };

  const handleSaveNotes = (notes) => {
    if (!selectedCandidate || !currentJob) return;
    updateCandidateData(currentJob.id, selectedCandidate.id, { notes });
    showToast('Anotações internas salvas.');
    forceUpdate(n => n + 1);
  };

  // ── WhatsApp Helper ──
  const buildWhatsAppLink = (cand) => {
    const cleanPhone = (cand.phone || '5543999887766').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${cand.name}! Aqui é ${currentUser?.name || 'Recrutamento da Empresa'} do Ivaí Conecta a respeito da sua candidatura para a vaga de ${currentJob?.title || 'nossa empresa'}. Gostaria de conversar com você!`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // ── Job Actions ──
  const handleToggleJobStatus = (jobId, currentStatus) => {
    const newStatus = currentStatus === 'Ativa' ? 'close' : 'reopen';
    updateJobStatus(jobId, newStatus);
    showToast(newStatus === 'close' ? 'Vaga pausada/encerrada.' : 'Vaga reaberta e ativada com sucesso!');
    forceUpdate(n => n + 1);
  };

  const handleDuplicateJob = (jobId) => {
    duplicateJob(jobId);
    showToast('Vaga duplicada com sucesso!');
    forceUpdate(n => n + 1);
  };

  const handleDeleteJob = (jobId) => {
    if (confirm('Tem certeza que deseja excluir esta vaga e todas as suas candidaturas?')) {
      deleteJob(jobId);
      showToast('Vaga excluída com sucesso.');
      forceUpdate(n => n + 1);
    }
  };

  const handleSaveJobEdit = (e) => {
    e.preventDefault();
    if (!editingJob) return;
    updateJob(editingJob.id, editingJob);
    showToast('Vaga atualizada com sucesso!');
    setEditingJob(null);
    forceUpdate(n => n + 1);
  };

  const handleCreateNewJob = (e) => {
    e.preventDefault();
    if (!newJobForm.title.trim()) {
      showToast('Por favor, informe o título da vaga.');
      return;
    }

    const created = addJob({
      title: newJobForm.title,
      company: currentUser?.name || 'ValeTech Soluções Digitais',
      companyLogo: currentUser?.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250',
      type: newJobForm.type,
      modality: newJobForm.modality,
      city: newJobForm.city,
      salary: newJobForm.salary,
      requiredSkills: newJobForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      benefits: newJobForm.benefits.split(',').map(b => b.trim()).filter(Boolean),
      description: newJobForm.description || 'Estamos em busca de talentos para compor nossa equipe em Ivaiporã e região.',
      createdBy: currentUser?.uid || currentUser?.email || 'empresa',
      isVerifiedCompany: true
    });

    showToast('🎉 Nova vaga publicada com sucesso no Mural Regional!');
    setShowNewJobModal(false);
    setSelectedJobId(created.id);
    setActiveTab('pipeline');
    forceUpdate(n => n + 1);
  };

  const handleAddCustomStage = () => {
    const newId = `etapa_${Date.now()}`;
    const newStage = {
      id: newId,
      name: `Nova Etapa ${customStages.length + 1}`,
      color: 'blue',
      description: 'Descrição personalizada da etapa'
    };
    setCustomStages([...customStages, newStage]);
    showToast('Nova etapa adicionada. Lembre-se de salvar as alterações!');
  };

  const handleRemoveCustomStage = (index) => {
    if (customStages.length <= 2) {
      showToast('O processo seletivo precisa conter no mínimo 2 etapas.');
      return;
    }
    const updated = customStages.filter((_, idx) => idx !== index);
    setCustomStages(updated);
    showToast('Etapa removida da lista. Lembre-se de salvar as alterações!');
  };

  const handleSaveCustomStagesForJob = () => {
    if (!currentJob) return;
    saveJobCustomStages(currentJob.id, customStages);
    showToast(`✅ Etapas do funil salvas exclusivamente para a vaga: "${currentJob.title}"!`);
    forceUpdate(n => n + 1);
  };

  const handleApplyCustomStagesToAllJobs = () => {
    saveCompanyCustomStages(customStages);
    allCompanyJobs.forEach(job => {
      saveJobCustomStages(job.id, customStages);
    });
    showToast('🚀 Estas etapas foram salvas e aplicadas a TODAS as vagas da empresa!');
    forceUpdate(n => n + 1);
  };

  const handleCopyStagesFromAnotherJob = (sourceJobId) => {
    if (!sourceJobId) return;
    const stages = getJobCustomStages(sourceJobId);
    setCustomStages(stages);
    showToast('Etapas importadas da outra vaga! Revise e clique em salvar.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* ── HEADER CORPORATIVO ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-10 lg:py-14 overflow-hidden border-b border-blue-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.18),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 hover:text-white bg-white/10 px-3 py-1 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Voltar
            </button>
            <span>/</span>
            <span className="text-blue-300">Painel Corporativo</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} /> Gestão de Vagas &amp; Processos Seletivos
                </span>
                <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={13} /> Empresa Verificada (CNPJ)
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white mb-2 tracking-tight">
                {currentUser?.name || 'ValeTech Soluções Digitais'}
              </h1>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Central de recrutamento e acompanhamento de etapas: triagem de currículos, agendamento de entrevistas, testes e pareceres pedagógicos verificados.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowNewJobModal(true)}
                className="btn btn-teal px-5 py-2.5 text-sm font-bold shadow-brand-md flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Publicar Nova Vaga
              </button>
              <Link
                to="/empresa/1"
                className="btn btn-outline-white px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
              >
                <Eye size={15} /> Ver Perfil Público
              </Link>
            </div>
          </div>

          {/* ── KPI METRICS BAR ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">Vagas Ativas</div>
              <div className="text-2xl font-black font-heading text-white mt-0.5">{stats.activeJobs} <span className="text-xs text-gray-300 font-normal">/ {stats.totalJobs}</span></div>
            </div>
            <div className="bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">Total Candidaturas</div>
              <div className="text-2xl font-black font-heading text-sky-300 mt-0.5">{stats.totalApplicants}</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">Em Avaliação</div>
              <div className="text-2xl font-black font-heading text-amber-300 mt-0.5">{stats.inReview}</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">Entrevistas Agendadas</div>
              <div className="text-2xl font-black font-heading text-purple-300 mt-0.5">{stats.inInterview}</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">Aprovados / Oferta</div>
              <div className="text-2xl font-black font-heading text-emerald-400 mt-0.5">{stats.approved}</div>
            </div>
            <div className="bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">Banco de Talentos</div>
              <div className="text-2xl font-black font-heading text-slate-300 mt-0.5">{stats.talentPool}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-[74px] z-40 shadow-2xs">
        <div className="container">
          <div className="flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'pipeline'
                    ? 'bg-primary-blue text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers size={16} /> Funil &amp; Pipeline ATS
              </button>

              <button
                onClick={() => setActiveTab('jobs_list')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'jobs_list'
                    ? 'bg-primary-blue text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase size={16} /> Minhas Vagas ({allCompanyJobs.length})
              </button>

              <button
                onClick={() => setActiveTab('stage_settings')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'stage_settings'
                    ? 'bg-primary-blue text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Settings size={16} /> Configurar Etapas do Processo
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-primary-blue text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 size={16} /> Indicadores &amp; Matching
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-8">

        {/* ═════════════════════════════════════════════════════════════════
            TAB 1: FUNIL DE RECRUTAMENTO & PIPELINE (KANBAN ATS)
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            
            {/* Job Selector Bar & Filters Header */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Job Selector Dropdown */}
                <div className="flex-1 min-w-[280px]">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-primary-blue" /> Selecione a Vaga para Gerenciar:
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(Number(e.target.value) || e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    {allCompanyJobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} — {job.city} ({job.type}) [{getJobCandidates(job.id).length} candidatos inscritos]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search in Candidates */}
                <div className="flex-1 min-w-[240px]">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Search size={14} /> Buscar Candidatos:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nome, curso, tecnologia (Ex: React)..."
                      value={candidateSearch}
                      onChange={e => setCandidateSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-blue text-gray-800 dark:text-white placeholder-gray-400"
                    />
                    {candidateSearch && (
                      <button onClick={() => setCandidateSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-end gap-2 shrink-0">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-primary-blue shadow-2xs' : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
                      }`}
                      title="Visualização em Colunas Kanban"
                    >
                      <LayoutGrid size={15} /> Kanban
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary-blue shadow-2xs' : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
                      }`}
                      title="Visualização em Lista / Tabela"
                    >
                      <ListFilter size={15} /> Lista
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Filter Badges */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800 flex-wrap text-xs">
                <span className="font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <Filter size={13} /> Filtrar por:
                </span>

                <button
                  onClick={() => setOnlyVerified(!onlyVerified)}
                  className={`px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                    onlyVerified
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                  }`}
                >
                  ✓ Matrícula Verificada (IFPR/Univale/UENP)
                </button>

                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-1 rounded-lg">
                  <span className="text-gray-500 dark:text-slate-400">Match Mínimo:</span>
                  <select
                    value={minMatchFilter}
                    onChange={e => setMinMatchFilter(Number(e.target.value))}
                    className="bg-transparent font-bold text-primary-blue dark:text-blue-400 outline-none cursor-pointer"
                  >
                    <option value={0}>Todos (0%+)</option>
                    <option value={75}>75%+</option>
                    <option value={85}>85%+</option>
                    <option value={90}>90%+ (Alta Afinidade)</option>
                  </select>
                </div>

                {(candidateSearch || onlyVerified || minMatchFilter > 0) && (
                  <button
                    onClick={() => { setCandidateSearch(''); setOnlyVerified(false); setMinMatchFilter(0); }}
                    className="text-primary-blue hover:underline font-bold text-xs"
                  >
                    Limpar Filtros
                  </button>
                )}

                <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">
                  Exibindo <strong>{filteredCandidates.length}</strong> de {jobCandidates.length} candidatos inscritos
                </span>
              </div>
            </div>

            {/* ── KANBAN ATS PIPELINE VIEW ── */}
            {viewMode === 'kanban' && (
              <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-stretch min-w-full scrollbar-thin">
                {customStages.map(stage => {
                  const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id);
                  
                  const stageHeaderColors = {
                    triagem: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-t-blue-500',
                    analise: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-t-amber-500',
                    entrevista: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border-t-purple-500',
                    desafio: 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-t-indigo-500',
                    aprovado: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-t-emerald-500',
                    reprovado: 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-t-slate-500',
                  }[stage.id] || 'bg-slate-50 border-t-slate-400';

                  return (
                    <div
                      key={stage.id}
                      className="w-[310px] min-w-[310px] shrink-0 flex flex-col bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-3"
                    >
                      {/* Column Header */}
                      <div className={`p-3 rounded-xl border-t-4 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-2xs shrink-0 ${stageHeaderColors}`}>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-heading text-xs font-black uppercase tracking-wider truncate">{stage.name}</h4>
                          <p className="text-[11px] opacity-80 truncate">{stage.description}</p>
                        </div>
                        <span className="bg-white/90 dark:bg-slate-800 text-gray-900 dark:text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                          {stageCandidates.length}
                        </span>
                      </div>

                      {/* Candidates Cards in this Column */}
                      <div className="flex-1 flex flex-col gap-3 min-h-[380px] max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin">
                        {stageCandidates.length === 0 ? (
                          <div className="h-full min-h-[220px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 gap-1.5 bg-white/40 dark:bg-slate-800/20">
                            <Inbox size={28} className="text-slate-300 dark:text-slate-600 mb-1" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Nenhum candidato</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">nesta etapa</span>
                          </div>
                        ) : (
                          stageCandidates.map(cand => (
                            <div
                              key={cand.id}
                              onClick={() => setSelectedCandidate(cand)}
                              className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover:border-primary-blue/60 dark:hover:border-blue-400 rounded-xl p-4 shadow-2xs hover:shadow-brand-md transition-all duration-200 cursor-pointer flex flex-col gap-3 group relative"
                            >
                              {/* Avatar, Name, Course & Match Badge */}
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <img
                                    src={cand.avatar}
                                    alt={cand.name}
                                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 bg-white"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h5 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-blue transition-colors leading-snug truncate">
                                      {cand.name}
                                    </h5>
                                    <div className="text-[11px] text-primary-blue dark:text-blue-400 font-semibold truncate">
                                      {cand.course}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                                      {cand.institution} · {cand.city}
                                    </div>
                                  </div>
                                </div>

                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-2xs ${
                                  cand.matchScore >= 90
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                }`}>
                                  {cand.matchScore}% Match
                                </span>
                              </div>

                              {/* Academic Seals & Endorsements */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {cand.isVerifiedStudent && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-md">
                                    <ShieldCheck size={11} className="shrink-0" /> Selo IFPR/Univale
                                  </span>
                                )}
                                {cand.endorsements && cand.endorsements.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                                    <Award size={11} className="shrink-0" /> {cand.endorsements.length} Parecer Docente
                                  </span>
                                )}
                              </div>

                              {/* Skills Chips */}
                              <div className="flex flex-wrap gap-1">
                                {cand.skills?.slice(0, 3).map(skill => (
                                  <span key={skill} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                                    {skill}
                                  </span>
                                ))}
                                {cand.skills?.length > 3 && (
                                  <span className="text-[10px] text-gray-400 dark:text-slate-500 self-center">
                                    +{cand.skills.length - 3}
                                  </span>
                                )}
                              </div>

                              {/* Rating & Applied Date */}
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/80">
                                <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      onClick={() => handleRatingChange(cand.id, star)}
                                      className={`p-0.5 hover:scale-125 transition-transform ${
                                        (cand.rating || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                                      }`}
                                    >
                                      <Star size={13} className={(cand.rating || 0) >= star ? 'fill-current' : ''} />
                                    </button>
                                  ))}
                                </div>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                  {cand.appliedAt}
                                </span>
                              </div>

                              {/* Interview Scheduled Alert if present */}
                              {cand.interview && (
                                <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg p-2 text-[11px] text-purple-900 dark:text-purple-200 flex items-center justify-between gap-1">
                                  <span className="flex items-center gap-1 font-bold">
                                    <Calendar size={12} className="text-purple-600" /> {cand.interview.date} às {cand.interview.time}
                                  </span>
                                  <span className="font-semibold opacity-80">{cand.interview.format}</span>
                                </div>
                              )}

                              {/* Card Action Footer */}
                              <div className="flex items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                                <a
                                  href={buildWhatsAppLink(cand)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-1.5 transition-colors"
                                  title="Conversar no WhatsApp"
                                >
                                  <Phone size={12} /> WhatsApp
                                </a>

                                <select
                                  value={cand.stage}
                                  onChange={e => handleStageChange(cand.id, e.target.value)}
                                  className="flex-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                                  title="Mudar etapa"
                                >
                                  {customStages.map(st => (
                                    <option key={st.id} value={st.id}>{st.name}</option>
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
            )}

            {/* ── LIST / TABLE VIEW ── */}
            {viewMode === 'list' && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 uppercase font-black tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Candidato</th>
                        <th className="py-3.5 px-4">Curso / Faculdade</th>
                        <th className="py-3.5 px-4">Match %</th>
                        <th className="py-3.5 px-4">Etapa Atual</th>
                        <th className="py-3.5 px-4">Avaliação</th>
                        <th className="py-3.5 px-4">Inscrição</th>
                        <th className="py-3.5 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {filteredCandidates.map(cand => (
                        <tr key={cand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img src={cand.avatar} alt={cand.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shrink-0" />
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{cand.name}</div>
                                <div className="text-[11px] text-gray-500">{cand.city}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                            <div>{cand.course}</div>
                            <div className="text-[11px] text-primary-blue">{cand.institution}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              {cand.matchScore}% Match
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={cand.stage}
                              onChange={e => handleStageChange(cand.id, e.target.value)}
                              className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                            >
                              {customStages.map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  onClick={() => handleRatingChange(cand.id, star)}
                                  className={`p-0.5 ${cand.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600'}`}
                                >
                                  <Star size={13} className={cand.rating >= star ? 'fill-current' : ''} />
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 text-xs">
                            {cand.appliedAt}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedCandidate(cand)}
                                className="btn btn-primary btn-sm text-xs font-bold"
                              >
                                Ver Detalhes
                              </button>
                              <a
                                href={buildWhatsAppLink(cand)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300"
                                title="Abrir WhatsApp"
                              >
                                <Phone size={13} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB 2: LISTA E GESTÃO DE TODAS AS VAGAS DA EMPRESA
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'jobs_list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                  Todas as Vagas da Empresa ({allCompanyJobs.length})
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Gerencie status, edite descrições de cargos, estenda prazos ou encerre processos.
                </p>
              </div>

              <button
                onClick={() => setShowNewJobModal(true)}
                className="btn btn-primary px-4 py-2.5 text-sm font-bold flex items-center gap-2"
              >
                <Plus size={16} /> Publicar Nova Vaga
              </button>
            </div>

            <div className="grid gap-4">
              {allCompanyJobs.map(job => {
                const candidates = getJobCandidates(job.id);
                const isActive = job.status === 'Ativa';

                return (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-brand-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {job.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Publicada em {job.createdAt || '15/08/2026'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs font-semibold text-primary-blue flex items-center gap-1"><MapPin size={12} /> {job.city}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{job.type} ({job.modality || 'Presencial'})</span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{job.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">{job.description}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(job.requiredSkills || []).map(skill => (
                          <span key={skill} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xl font-black font-heading text-primary-blue dark:text-blue-400">{candidates.length}</div>
                          <div className="text-[11px] text-gray-500">Candidatos Inscritos</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setActiveTab('pipeline');
                          }}
                          className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5"
                        >
                          <Layers size={13} /> Ver Funil ATS
                        </button>

                        <button
                          onClick={() => setEditingJob(job)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
                          title="Editar Vaga"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDuplicateJob(job.id)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
                          title="Duplicar Vaga"
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          onClick={() => handleToggleJobStatus(job.id, job.status)}
                          className={`p-2 rounded-lg border transition-colors ${
                            isActive
                              ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
                          }`}
                          title={isActive ? 'Pausar / Encerrar Vaga' : 'Reabrir Vaga'}
                        >
                          {isActive ? <Clock size={14} /> : <RotateCcw size={14} />}
                        </button>

                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40"
                          title="Excluir Vaga"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB 3: CONFIGURAÇÕES DE ETAPAS DO PROCESSO SELETIVO POR VAGA
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'stage_settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-blue mb-1 block">Customização do Funil</span>
                  <h2 className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white">
                    Etapas do Processo Seletivo por Vaga
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Cada vaga pode ter seu próprio fluxo seletivo personalizado.
                  </p>
                </div>

                <button
                  onClick={handleAddCustomStage}
                  className="btn btn-primary btn-sm px-4 py-2 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs shrink-0"
                >
                  <Plus size={14} /> Adicionar Nova Etapa
                </button>
              </div>

              {/* Job Selector Box */}
              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-primary-blue" /> Configurando as Etapas da Vaga:
                  </label>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    Vaga selecionada no painel
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className={allCompanyJobs.length > 1 ? "md:col-span-7" : "md:col-span-12"}>
                    <select
                      value={selectedJobId}
                      onChange={e => setSelectedJobId(Number(e.target.value) || e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue shadow-2xs truncate"
                    >
                      {allCompanyJobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({job.city} · {job.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Copy stages from another job */}
                  {allCompanyJobs.length > 1 && (
                    <div className="md:col-span-5">
                      <select
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) {
                            handleCopyStagesFromAnotherJob(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-300 outline-none cursor-pointer hover:border-primary-blue transition-colors truncate shadow-2xs"
                      >
                        <option value="" disabled>Copiar etapas de outra vaga...</option>
                        {allCompanyJobs
                          .filter(j => j.id !== currentJob?.id)
                          .map(j => (
                            <option key={j.id} value={j.id}>
                              Copiar de: {j.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-blue-800 dark:text-blue-300 pt-1">
                  <span className="font-semibold">💡 Dica:</span> As etapas configuradas abaixo serão salvas exclusivamente para <strong>{currentJob?.title}</strong>.
                </div>
              </div>

              {/* Stages List */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Sequência das Etapas ({customStages.length} etapas no funil)</span>
                </div>

                {customStages.map((stage, idx) => (
                  <div
                    key={stage.id || idx}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5 hover:border-primary-blue/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-primary-blue text-white text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={e => {
                            const updated = [...customStages];
                            updated[idx].name = e.target.value;
                            setCustomStages(updated);
                          }}
                          placeholder="Nome da Etapa..."
                          className="font-bold text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white outline-none focus:border-primary-blue flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase hidden sm:inline">ID: {stage.id}</span>
                        {customStages.length > 2 && (
                          <button
                            onClick={() => handleRemoveCustomStage(idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Remover esta etapa"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={stage.description}
                      onChange={e => {
                        const updated = [...customStages];
                        updated[idx].description = e.target.value;
                        setCustomStages(updated);
                      }}
                      placeholder="Descrição desta etapa (ex: Avaliação de currículo e portfólio)..."
                      className="w-full text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-700 dark:text-slate-300 outline-none focus:border-primary-blue"
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-5 border-t border-gray-200 dark:border-slate-800">
                <button
                  onClick={() => setCustomStages(SELECTION_STAGES)}
                  className="btn btn-outline btn-sm font-semibold text-xs order-3 md:order-1 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} /> Restaurar Padrões Desta Vaga
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 order-1 md:order-2">
                  <button
                    onClick={handleApplyCustomStagesToAllJobs}
                    className="btn btn-outline btn-sm font-bold text-xs flex items-center justify-center gap-1.5 border-gray-300 hover:border-primary-blue text-gray-700 dark:text-slate-200"
                    title="Salvar e replicar estas etapas em todas as outras vagas da empresa"
                  >
                    <CheckSquare size={14} /> Aplicar a Todas as Vagas
                  </button>

                  <button
                    onClick={handleSaveCustomStagesForJob}
                    className="btn btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save size={15} /> Salvar Etapas Desta Vaga
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB 4: INDICADORES & ANALYTICS
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary-blue" /> Taxa de Conversão do Funil
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Triagem &rarr; Entrevista</span>
                      <span className="text-primary-blue font-bold">45%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary-blue h-full rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Entrevista &rarr; Desafio</span>
                      <span className="text-indigo-600 font-bold">60%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Desafio &rarr; Aprovado</span>
                      <span className="text-emerald-600 font-bold">75%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={18} className="text-emerald-500" /> Origem dos Talentos Inscritos
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">IFPR Campus Ivaiporã</span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 px-2 py-0.5 rounded font-black">58% dos inscritos</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">Univale Ivaiporã</span>
                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 px-2 py-0.5 rounded font-black">27% dos inscritos</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">UENP / Outras</span>
                    <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 px-2 py-0.5 rounded font-black">15% dos inscritos</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" /> Tecnologias com Mais Afinidade
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['React (95%)', 'JavaScript (92%)', 'Tailwind (90%)', 'Git (88%)', 'Python (82%)', 'SQL (80%)', 'Figma (78%)'].map(item => (
                    <span key={item} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ═════════════════════════════════════════════════════════════════
          MODAL / DRAWER: DETALHES DO CANDIDATO & AGENDAMENTO
      ═════════════════════════════════════════════════════════════════ */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCandidate.avatar}
                  alt={selectedCandidate.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue/30 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCandidate.name}
                    </h3>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 rounded-full">
                      {selectedCandidate.matchScore}% Match
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 mt-0.5">
                    {selectedCandidate.course} · {selectedCandidate.institution}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {selectedCandidate.city} · Inscrito em {selectedCandidate.appliedAt}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-2.5">
                    <button
                      onClick={() => {
                        startChatWith({
                          name: selectedCandidate.name,
                          email: selectedCandidate.email || 'aluno@ivaiconecta.com.br',
                          role: 'aluno',
                          avatar: selectedCandidate.avatar
                        }, `Processo Seletivo: ${currentJob?.title || 'Vaga'}`);
                      }}
                      className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={13} /> Chat com o Candidato
                    </button>
                    <a
                      href={buildWhatsAppLink(selectedCandidate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5"
                    >
                      <Phone size={13} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <XCircle size={26} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

              {/* 1. Stage Progression Stepper */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Avançar Etapa do Candidato:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {customStages.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => handleStageChange(selectedCandidate.id, stage.id)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedCandidate.stage === stage.id
                          ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                      }`}
                    >
                      <span>{stage.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Schedule Interview Section */}
              <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                    <Calendar size={16} className="text-purple-600" /> Agendar / Atualizar Entrevista
                  </h4>
                  {selectedCandidate.interview && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                      ✓ Entrevista Marcada
                    </span>
                  )}
                </div>

                <form onSubmit={handleScheduleInterview} className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Data:</label>
                    <input
                      type="date"
                      value={interviewForm.date || selectedCandidate.interview?.date || ''}
                      onChange={e => setInterviewForm({ ...interviewForm, date: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg p-2 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Horário:</label>
                    <input
                      type="time"
                      value={interviewForm.time || selectedCandidate.interview?.time || ''}
                      onChange={e => setInterviewForm({ ...interviewForm, time: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg p-2 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Formato / Plataforma:</label>
                    <select
                      value={interviewForm.format || selectedCandidate.interview?.format || 'Google Meet'}
                      onChange={e => setInterviewForm({ ...interviewForm, format: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg p-2 font-medium"
                    >
                      <option value="Google Meet">Google Meet (Online)</option>
                      <option value="Microsoft Teams">Microsoft Teams (Online)</option>
                      <option value="Presencial">Presencial na Empresa</option>
                      <option value="Telefone">Ligação Telefônica</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Link ou Endereço:</label>
                    <input
                      type="text"
                      placeholder="https://meet.google.com/..."
                      value={interviewForm.link || selectedCandidate.interview?.link || ''}
                      onChange={e => setInterviewForm({ ...interviewForm, link: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm px-4 py-2 font-bold text-xs"
                    >
                      Salvar e Notificar Candidato
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Internal Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Anotações Internas do Recrutador / Feedback Técnico:
                </label>
                <textarea
                  defaultValue={selectedCandidate.notes || ''}
                  onBlur={e => handleSaveNotes(e.target.value)}
                  placeholder="Registre observações sobre a entrevista, pontuação no teste prático ou feedback interno..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:border-primary-blue min-h-[90px]"
                />
              </div>

              {/* 4. Academic Endorsements */}
              {selectedCandidate.endorsements && selectedCandidate.endorsements.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <Award size={16} className="text-amber-500" /> Pareceres Pedagógicos dos Professores
                  </h4>
                  <div className="space-y-2">
                    {selectedCandidate.endorsements.map((end, i) => (
                      <div key={i} className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 rounded-xl p-3.5 text-xs">
                        <div className="font-bold text-amber-950 dark:text-amber-300 flex items-center justify-between">
                          <span>{end.profName} ({end.discipline})</span>
                          <span className="font-semibold text-gray-500 text-[10px]">{end.institution}</span>
                        </div>
                        <p className="text-gray-700 dark:text-slate-300 mt-1 italic">"{end.quote}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="btn btn-outline btn-sm font-bold text-xs"
              >
                Fechar Detalhes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL: PUBLICAR NOVA VAGA
      ═════════════════════════════════════════════════════════════════ */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="text-primary-blue" size={20} />
                <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">Publicar Nova Vaga de Emprego</h3>
              </div>
              <button onClick={() => setShowNewJobModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewJob} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Título do Cargo / Função:</label>
                <input
                  type="text"
                  placeholder="Ex: Desenvolvedor Front-end React Júnior"
                  value={newJobForm.title}
                  onChange={e => setNewJobForm({ ...newJobForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Tipo de Contrato:</label>
                  <select
                    value={newJobForm.type}
                    onChange={e => setNewJobForm({ ...newJobForm, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Tempo Integral">Tempo Integral (CLT)</option>
                    <option value="Estágio">Estágio Remunerado</option>
                    <option value="Prestador de Serviço">Prestador de Serviço (PJ)</option>
                    <option value="Meio Período">Meio Período</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Modalidade:</label>
                  <select
                    value={newJobForm.modality}
                    onChange={e => setNewJobForm({ ...newJobForm, modality: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">100% Remoto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Cidade:</label>
                  <select
                    value={newJobForm.city}
                    onChange={e => setNewJobForm({ ...newJobForm, city: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  >
                    {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Faixa Salarial / Bolsa:</label>
                  <input
                    type="text"
                    placeholder="Ex: R$ 2.500 - R$ 3.500"
                    value={newJobForm.salary}
                    onChange={e => setNewJobForm({ ...newJobForm, salary: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Habilidades Exigidas (separadas por vírgula):</label>
                <input
                  type="text"
                  placeholder="React, JavaScript, HTML5/CSS3, Git, SQL"
                  value={newJobForm.requiredSkills}
                  onChange={e => setNewJobForm({ ...newJobForm, requiredSkills: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Descrição e Responsabilidades:</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o dia a dia, requisitos da vaga e diferenciais..."
                  value={newJobForm.description}
                  onChange={e => setNewJobForm({ ...newJobForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowNewJobModal(false)} className="btn btn-outline btn-sm">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm px-5 py-2.5 font-bold">
                  Publicar Vaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL: EDITAR VAGA EXISTENTE
      ═════════════════════════════════════════════════════════════════ */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">Editar Dados da Vaga</h3>
              <button onClick={() => setEditingJob(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveJobEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Título:</label>
                <input
                  type="text"
                  value={editingJob.title}
                  onChange={e => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Status:</label>
                  <select
                    value={editingJob.status}
                    onChange={e => setEditingJob({ ...editingJob, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Ativa">Ativa (Aberta para Inscrições)</option>
                    <option value="Pausada">Pausada</option>
                    <option value="Encerrada">Encerrada</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Faixa Salarial:</label>
                  <input
                    type="text"
                    value={editingJob.salary || ''}
                    onChange={e => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Descrição:</label>
                <textarea
                  rows={4}
                  value={editingJob.description || ''}
                  onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingJob(null)} className="btn btn-outline btn-sm">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm px-5 py-2.5 font-bold">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
