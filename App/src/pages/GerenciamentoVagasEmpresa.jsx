import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle2, Clock,
  ArrowLeft, Plus, Eye, Edit3, RotateCcw, ShieldCheck,
  Award, Check, X, FileText, Calendar, Sparkles, Star, Copy,
  Search, Filter, ChevronRight, Trash2,
  SlidersHorizontal, Video, AlertCircle, GraduationCap, LayoutGrid,
  ListFilter, MessageSquare, ChevronDown, ChevronUp, ArrowUpDown, RefreshCw,
  Inbox, Settings, BarChart3, Layers, CheckSquare, Save, HelpCircle, UserCheck,
  GripVertical, ChevronLeft, UserPlus, ArrowUpRight, History,
  Users, DollarSign, Share2, Download, Phone, PhoneCall,
  ArrowUp, ArrowDown, Palette, Zap, CheckCircle, Info, Workflow, ArrowRight
} from 'lucide-react';
import {
  getJobs, addJob, updateJob, duplicateJob, deleteJob, updateJobStatus,
  getJobCandidates, updateCandidateStage, updateCandidateData,
  scheduleCandidateInterview, SELECTION_STAGES,
  getCompanyCustomStages, saveCompanyCustomStages, getJobCustomStages,
  saveJobCustomStages, CITIES, reorderCandidateStage, sanitizeStageItem,
  subscribeToCompanyApplications,
  STANDARD_WORKING_HOURS, validateJobTitle, validateProfessionalText, validatePhoneNumber
} from '../lib/ivaiConecta';
import { subscribeToJobs } from '../services/jobsService';
import useAppStore from '../store/useAppStore';
import PublishJobModal from '../components/PublishJobModal';

export const STAGE_TEMPLATES = [
  {
    id: 'padrao',
    name: 'Padrão Regional',
    badge: '6 etapas • Geral',
    description: 'Fluxo completo e equilibrado para a maioria das vagas de comércio, indústria e serviços.',
    stages: [
      { id: 'triagem', name: 'Triagem / Novos', color: 'sky', description: 'Candidaturas recebidas recentemente' },
      { id: 'analise', name: 'Em Análise', color: 'amber', description: 'Currículo em avaliação detalhada pela equipe' },
      { id: 'entrevista', name: 'Entrevista', color: 'purple', description: 'Entrevista presencial ou remota com RH' },
      { id: 'desafio', name: 'Teste Prático', color: 'indigo', description: 'Avaliação técnica ou case prático da vaga' },
      { id: 'aprovado', name: 'Aprovados', color: 'emerald', description: 'Candidatos selecionados para contratação' },
      { id: 'reprovado', name: 'Banco de Talentos', color: 'slate', description: 'Currículos mantidos para futuras oportunidades' },
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Especialistas',
    badge: '6 etapas • Técnico',
    description: 'Estruturado para programadores, analistas, engenheiros e profissionais especializados.',
    stages: [
      { id: 'triagem', name: 'Triagem Técnica', color: 'sky', description: 'Filtro por stack, experiência e portfólio' },
      { id: 'fit_cultural', name: 'Fit Cultural (RH)', color: 'blue', description: 'Alinhamento de valores, cultura e expectativas' },
      { id: 'desafio_tech', name: 'Desafio / Live Coding', color: 'indigo', description: 'Teste prático de desenvolvimento ou case' },
      { id: 'entrevista_lider', name: 'Entrevista com Gestor', color: 'purple', description: 'Avaliação aprofundada com a liderança técnica' },
      { id: 'proposta', name: 'Proposta & Oferta', color: 'emerald', description: 'Apresentação formal da proposta salarial' },
      { id: 'banco', name: 'Banco de Talentos', color: 'slate', description: 'Talentos aprovados guardados para novos projetos' },
    ],
  },
  {
    id: 'express',
    name: 'Express / Ágil',
    badge: '4 etapas • Rápido',
    description: 'Processo enxuto e ágil para contratações imediatas, operacionais ou de reposição urgente.',
    stages: [
      { id: 'triagem', name: 'Triagem Rápida', color: 'sky', description: 'Conferência de requisitos mínimos e contato inicial' },
      { id: 'entrevista_express', name: 'Entrevista Direta', color: 'purple', description: 'Entrevista com decisor da vaga' },
      { id: 'aprovado', name: 'Contratação', color: 'emerald', description: 'Coleta de documentos e admissão imediata' },
      { id: 'reprovado', name: 'Banco de Reserva', color: 'slate', description: 'Candidatos para substituições imediatas' },
    ],
  },
  {
    id: 'trainee',
    name: 'Estágio & Trainee',
    badge: '5 etapas • Jovens Talentos',
    description: 'Focado em seleção de estagiários, aprendizes e programas de desenvolvimento.',
    stages: [
      { id: 'inscricao', name: 'Inscrições & Triagem', color: 'sky', description: 'Revisão de curso, período e disponibilidade' },
      { id: 'dinamica', name: 'Dinâmica em Grupo', color: 'amber', description: 'Atividade colaborativa para avaliar soft skills' },
      { id: 'entrevista', name: 'Entrevista Individual', color: 'purple', description: 'Conversa aprofundada com a liderança' },
      { id: 'aprovado', name: 'Aprovados', color: 'emerald', description: 'Seleção final para início do programa' },
      { id: 'banco', name: 'Banco de Talentos', color: 'slate', description: 'Candidatos qualificados para os próximos ciclos' },
    ],
  },
];

export const COMMON_STAGE_SUGGESTIONS = [
  { name: 'Fit Cultural', color: 'blue', description: 'Avaliação de alinhamento com a cultura e valores da empresa' },
  { name: 'Dinâmica de Grupo', color: 'amber', description: 'Atividade prática em grupo para avaliar soft skills e liderança' },
  { name: 'Teste Prático', color: 'indigo', description: 'Avaliação de conhecimentos específicos ou estudo de caso' },
  { name: 'Entrevista com Gestor', color: 'purple', description: 'Conversa técnica com a liderança direta da vaga' },
  { name: 'Checagem de Referências', color: 'teal', description: 'Contato com empresas anteriores e validação profissional' },
  { name: 'Proposta Salarial', color: 'emerald', description: 'Envio de oferta formal e alinhamento do pacote de benefícios' },
];

export const STAGE_COLOR_OPTIONS = [
  { key: 'sky', label: 'Azul Celeste', bgClass: 'bg-sky-500' },
  { key: 'blue', label: 'Azul Real', bgClass: 'bg-blue-600' },
  { key: 'indigo', label: 'Índigo', bgClass: 'bg-indigo-500' },
  { key: 'purple', label: 'Roxo', bgClass: 'bg-purple-500' },
  { key: 'amber', label: 'Âmbar / Laranja', bgClass: 'bg-amber-500' },
  { key: 'emerald', label: 'Esmeralda / Verde', bgClass: 'bg-emerald-500' },
  { key: 'rose', label: 'Rosa / Coral', bgClass: 'bg-rose-500' },
  { key: 'teal', label: 'Verde Petróleo', bgClass: 'bg-teal-500' },
  { key: 'slate', label: 'Cinza Neutro', bgClass: 'bg-slate-500' },
];

export const STAGE_COLOR_MAP = {
  sky: {
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    headerBorder: 'border-l-sky-500',
    pill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/40',
    dropHighlight: 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600',
    previewBg: 'bg-sky-500',
  },
  blue: {
    dot: 'bg-blue-600',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    headerBorder: 'border-l-blue-600',
    pill: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40',
    dropHighlight: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600',
    previewBg: 'bg-blue-600',
  },
  indigo: {
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    headerBorder: 'border-l-indigo-500',
    pill: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300/40',
    dropHighlight: 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600',
    previewBg: 'bg-indigo-500',
  },
  purple: {
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    headerBorder: 'border-l-purple-500',
    pill: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40',
    dropHighlight: 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 dark:border-purple-600',
    previewBg: 'bg-purple-500',
  },
  amber: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    headerBorder: 'border-l-amber-500',
    pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40',
    dropHighlight: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600',
    previewBg: 'bg-amber-500',
  },
  emerald: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    headerBorder: 'border-l-emerald-500',
    pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40',
    dropHighlight: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600',
    previewBg: 'bg-emerald-500',
  },
  rose: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    headerBorder: 'border-l-rose-500',
    pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40',
    dropHighlight: 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-400 dark:border-rose-600',
    previewBg: 'bg-rose-500',
  },
  teal: {
    dot: 'bg-teal-500',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    headerBorder: 'border-l-teal-500',
    pill: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300/40',
    dropHighlight: 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-400 dark:border-teal-600',
    previewBg: 'bg-teal-500',
  },
  slate: {
    dot: 'bg-slate-400 dark:bg-slate-500',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    headerBorder: 'border-l-slate-400',
    pill: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300/40',
    dropHighlight: 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-400 dark:border-slate-600',
    previewBg: 'bg-slate-500',
  },
};

export default function GerenciamentoVagasEmpresa() {
  const { currentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [updateCount, forceUpdate] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // ── Helper para normalizar o identificador da aba ──
  const normalizeTab = (t) => {
    if (!t) return null;
    const lower = String(t).toLowerCase().trim();
    if (lower === 'jobs_list' || lower === 'minhas-vagas' || lower === 'minhas_vagas' || lower === 'vagas' || lower === 'jobs') return 'jobs_list';
    if (lower === 'pipeline' || lower === 'kanban' || lower === 'funil') return 'pipeline';
    if (lower === 'stage_settings' || lower === 'etapas' || lower === 'configurar-etapas' || lower === 'configurar_etapas') return 'stage_settings';
    if (lower === 'analytics' || lower === 'indicadores' || lower === 'metricas') return 'analytics';
    return null;
  };

  // ── Tab Navigation ──
  // 'pipeline' | 'jobs_list' | 'stage_settings' | 'analytics'
  const [activeTab, setActiveTab] = useState(() => {
    // 1. Prioridade máxima: parâmetro da URL ?tab=...
    const fromUrl = normalizeTab(searchParams.get('tab'));
    if (fromUrl) return fromUrl;

    // 2. Se a rota acessada for explicitamente /minhas-vagas sem query param
    if (location.pathname.includes('/minhas-vagas')) {
      const fromStorage = normalizeTab(typeof localStorage !== 'undefined' ? localStorage.getItem('ivai_empresa_gerenciamento_active_tab') : null);
      return fromStorage || 'jobs_list';
    }

    // 3. Fallback: última aba gravada no localStorage para este dispositivo
    const fromStorage = normalizeTab(typeof localStorage !== 'undefined' ? localStorage.getItem('ivai_empresa_gerenciamento_active_tab') : null);
    if (fromStorage) return fromStorage;

    return 'pipeline';
  });

  // Função para troca explícita de aba (atualiza state, URL e localStorage de forma imediata)
  const handleTabChange = (newTab) => {
    const norm = normalizeTab(newTab) || newTab;
    setActiveTab(norm);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ivai_empresa_gerenciamento_active_tab', norm);
    }
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', norm);
      return next;
    }, { replace: true });
  };

  // Sincroniza parâmetros na URL e localStorage quando o estado mudar
  useEffect(() => {
    if (!activeTab) return;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ivai_empresa_gerenciamento_active_tab', activeTab);
    }
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      let changed = false;
      if (next.get('tab') !== activeTab) {
        next.set('tab', activeTab);
        changed = true;
      }
      return changed ? next : prev;
    }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Sincroniza se o usuário usar os botões Voltar / Avançar do navegador
  useEffect(() => {
    const urlTab = normalizeTab(searchParams.get('tab'));
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // ── Company Jobs State ──
  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));

  useEffect(() => {
    const unsub = subscribeToJobs('Todas as Cidades', (data) => setLiveJobs(data));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToCompanyApplications(currentUser, () => {
      forceUpdate(prev => prev + 1);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [currentUser]);

  useEffect(() => {
    const handleAppsChanged = () => {
      forceUpdate(prev => prev + 1);
    };
    window.addEventListener('ivai_applications_updated', handleAppsChanged);
    return () => window.removeEventListener('ivai_applications_updated', handleAppsChanged);
  }, []);

  const allCompanyJobs = useMemo(() => {
    const jobs = Array.isArray(liveJobs) ? liveJobs : [];
    if (!currentUser) return jobs;

    const currentUid = currentUser.uid ? String(currentUser.uid) : null;
    const currentId = currentUser.id ? String(currentUser.id) : null;
    const currentEmail = currentUser.email ? String(currentUser.email).toLowerCase() : null;
    const currentName = currentUser.name ? String(currentUser.name).toLowerCase().trim() : null;
    const currentCompany = currentUser.company ? String(currentUser.company).toLowerCase().trim() : null;
    const currentRazao = currentUser.razaoSocial ? String(currentUser.razaoSocial).toLowerCase().trim() : null;
    const currentNomeFantasia = currentUser.nomeFantasia ? String(currentUser.nomeFantasia).toLowerCase().trim() : null;

    const userCompanyMatch = jobs.filter(j => {
      if (!j) return false;
      const createdByStr = String(j.createdBy || '');
      const recruiterEmailStr = String(j.recruiterEmail || '').toLowerCase();
      const jobCompanyStr = String(j.company || '').toLowerCase().trim();

      const uidMatch = currentUid && (createdByStr === currentUid);
      const idMatch = currentId && (createdByStr === currentId);
      const emailMatch = currentEmail && (createdByStr.toLowerCase() === currentEmail || recruiterEmailStr === currentEmail);
      const nameMatch = currentName && (jobCompanyStr === currentName || jobCompanyStr.includes(currentName.split(' ')[0]));
      const companyMatch = currentCompany && (jobCompanyStr === currentCompany || jobCompanyStr.includes(currentCompany));
      const razaoMatch = currentRazao && (jobCompanyStr === currentRazao || jobCompanyStr.includes(currentRazao));
      const fantasiaMatch = currentNomeFantasia && (jobCompanyStr === currentNomeFantasia || jobCompanyStr.includes(currentNomeFantasia));
      const defaultDevMatch = !currentUid && !currentEmail && jobCompanyStr.includes('valetech');

      return uidMatch || idMatch || emailMatch || nameMatch || companyMatch || razaoMatch || fantasiaMatch || defaultDevMatch;
    });

    if (userCompanyMatch.length > 0) return userCompanyMatch;
    if (currentUser.role === 'empresa') return [];
    return jobs;
  }, [liveJobs, currentUser]);

  // Selected Job for Pipeline (com persistência em localStorage / query param)
  const [selectedJobId, setSelectedJobId] = useState(() => {
    const fromParam = searchParams.get('jobId') || searchParams.get('job');
    if (fromParam) return fromParam;
    const fromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('ivai_empresa_gerenciamento_selected_job') : null;
    return fromStorage || allCompanyJobs[0]?.id || 'default';
  });
  const currentJob = allCompanyJobs.find(j => j.id === Number(selectedJobId) || j.id === selectedJobId) || (allCompanyJobs.length > 0 ? allCompanyJobs[0] : null);

  useEffect(() => {
    if (allCompanyJobs && allCompanyJobs.length > 0) {
      if (selectedJobId !== 'default') {
        const exists = allCompanyJobs.some(j => String(j.id) === String(selectedJobId));
        if (!exists) {
          setSelectedJobId(allCompanyJobs[0].id);
        }
      } else {
        setSelectedJobId(allCompanyJobs[0].id);
      }
    } else {
      setSelectedJobId('default');
    }
  }, [allCompanyJobs, selectedJobId]);

  useEffect(() => {
    if (selectedJobId && selectedJobId !== 'default' && typeof localStorage !== 'undefined') {
      localStorage.setItem('ivai_empresa_gerenciamento_selected_job', String(selectedJobId));
    }
  }, [selectedJobId]);

  // Pipeline View Mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState(() => {
    const fromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('ivai_empresa_gerenciamento_view_mode') : null;
    return (fromStorage === 'kanban' || fromStorage === 'list') ? fromStorage : 'list';
  });

  useEffect(() => {
    if (viewMode && typeof localStorage !== 'undefined') {
      localStorage.setItem('ivai_empresa_gerenciamento_view_mode', viewMode);
    }
  }, [viewMode]);

  // Pipeline Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('todos');
  const [minMatchFilter, setMinMatchFilter] = useState(0);
  const [selectedCityFilter, setSelectedCityFilter] = useState('todas');
  const [selectedInstitutionFilter, setSelectedInstitutionFilter] = useState('todas');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyWithInterview, setOnlyWithInterview] = useState(false);
  const [onlyWithEndorsement, setOnlyWithEndorsement] = useState(false);
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);
  const [sortBy, setSortBy] = useState('match_desc'); // 'match_desc' | 'match_asc' | 'recent' | 'oldest' | 'rating_desc' | 'name_asc'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Jobs List Filters (Tab: Minhas Vagas)
  const [jobListViewMode, setJobListViewMode] = useState('grid'); // 'grid' | 'table'
  const [jobListSearch, setJobListSearch] = useState('');
  const [jobListStatusFilter, setJobListStatusFilter] = useState('todos'); // 'todos' | 'Ativa' | 'Encerrada'
  const [jobListModalityFilter, setJobListModalityFilter] = useState('todos'); // 'todos' | 'Presencial' | 'Remoto' | 'Híbrido'
  const [jobListTypeFilter, setJobListTypeFilter] = useState('todos');
  const [jobListSort, setJobListSort] = useState('recent'); // 'recent' | 'applicants_desc' | 'title_asc'

  // Interview History Tab Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyJobFilter, setHistoryJobFilter] = useState('todos');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('todos'); // 'todos' | 'concluida' | 'banco_talentos' | 'andamento' | 'agendada'
  const [historyFormatFilter, setHistoryFormatFilter] = useState('todos');
  const [historySort, setHistorySort] = useState('recent'); // 'recent' | 'date_asc' | 'match_desc'
  const [historyViewMode, setHistoryViewMode] = useState('grid'); // 'grid' | 'table'

  // Drag & Drop State
  const [isDraggingLock, setIsDraggingLock] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);
  const [dragOverCandidateId, setDragOverCandidateId] = useState(null);

  // Selected Candidate Drawer
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('overview'); // 'overview' | 'interview' | 'endorsements' | 'activity'

  // Quick Add Candidate Modal
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [addCandidateTargetStage, setAddCandidateTargetStage] = useState('triagem');
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    course: 'Análise e Desenvolvimento de Sistemas',
    institution: 'IFPR Campus Ivaiporã',
    city: 'Ivaiporã',
    matchScore: 90,
    skills: 'React, Tailwind, JavaScript',
    phone: '5543999001122',
    email: ''
  });

  // Interview Schedule Form Modal
  const [interviewForm, setInterviewForm] = useState({
    date: '',
    time: '',
    format: 'Google Meet',
    link: '',
    notes: ''
  });

  // Custom Stages State for selected job
  const [customStages, setCustomStages] = useState(() => (getJobCustomStages(currentJob?.id) || []).map(sanitizeStageItem));
  const [draggedStageIdx, setDraggedStageIdx] = useState(null);
  const [dragOverStageIdx, setDragOverStageIdx] = useState(null);

  useEffect(() => {
    if (selectedJobId === 'default' || !currentJob) {
      setCustomStages((getCompanyCustomStages() || []).map(sanitizeStageItem));
    } else if (currentJob) {
      setCustomStages((getJobCustomStages(currentJob.id) || []).map(sanitizeStageItem));
    }
  }, [currentJob?.id, selectedJobId]);

  // Edit / New Job Modal State
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Candidates for selected job
  const jobCandidates = useMemo(() => {
    if (!currentJob) return [];
    return getJobCandidates(currentJob.id);
  }, [currentJob, selectedJobId, updateCount]);

  const interviewsNow = useMemo(() => {
    return jobCandidates.map(c => {
      if (!c.interview || !c.interview.date || !c.interview.time) return null;
      if (c.interview.bannerDismissed) return null;

      const [year, month, day] = c.interview.date.split('-');
      const [hour, minute] = c.interview.time.split(':');
      const interviewDate = new Date(year, month - 1, day, hour, minute);
      const diffMinutes = (now - interviewDate) / 60000;

      let status = null;
      if (c.stage === 'aprovado' || c.stage === 'reprovado' || c.stage === 'banco_talentos' || c.interview.concluida) {
        status = 'concluida';
      } else if (c.interview.roomCreated) {
        status = 'andamento';
      } else {
        if (diffMinutes >= 0) status = 'atrasada';
        else if (diffMinutes >= -10 && diffMinutes < 0) status = 'prestes';
      }

      if (!status) return null;
      if (status === 'concluida' && diffMinutes > 120) return null;
      if (status === 'andamento' && diffMinutes > 120) return null;
      if (status === 'atrasada' && diffMinutes > 60) return null;

      return { ...c, interviewStatus: status };
    }).filter(Boolean);
  }, [jobCandidates, now]);

  // Available dynamic filters for current candidates
  const availableCandidateCities = useMemo(() => {
    const cities = new Set();
    jobCandidates.forEach(c => { if (c.city) cities.add(c.city); });
    return Array.from(cities);
  }, [jobCandidates]);

  const availableInstitutions = useMemo(() => {
    const insts = new Set();
    jobCandidates.forEach(c => { if (c.institution) insts.add(c.institution); });
    return Array.from(insts);
  }, [jobCandidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    const result = jobCandidates.filter(c => {
      const matchText = !candidateSearch ||
        c.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.course?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.institution?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        (Array.isArray(c.skills) ? c.skills.some(s => s?.toLowerCase().includes(candidateSearch.toLowerCase())) : String(c.skills || '').toLowerCase().includes(candidateSearch.toLowerCase()));

      const matchStage = selectedStageFilter === 'todos' || c.stage === selectedStageFilter;
      const matchScore = (c.matchScore || 0) >= minMatchFilter;
      const matchCity = selectedCityFilter === 'todas' || c.city === selectedCityFilter;
      const matchInstitution = selectedInstitutionFilter === 'todas' || c.institution === selectedInstitutionFilter;
      const matchRating = selectedRatingFilter === 0 || (c.rating || 0) >= selectedRatingFilter;
      const matchVerified = !onlyVerified || c.isVerifiedStudent;
      const matchInterview = !onlyWithInterview || !!c.interview;
      const matchEndorsement = !onlyWithEndorsement || (c.endorsements && c.endorsements.length > 0);
      const matchNotes = !onlyWithNotes || (c.notes && c.notes.length > 0);

      return matchText && matchStage && matchScore && matchCity && matchInstitution && matchRating && matchVerified && matchInterview && matchEndorsement && matchNotes;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'match_desc') return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === 'match_asc') return (a.matchScore || 0) - (b.matchScore || 0);
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'recent') return (b.id || 0) - (a.id || 0);
      if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
      return 0;
    });
  }, [
    jobCandidates, candidateSearch, selectedStageFilter, minMatchFilter,
    selectedCityFilter, selectedInstitutionFilter, selectedRatingFilter,
    onlyVerified, onlyWithInterview, onlyWithEndorsement, onlyWithNotes, sortBy
  ]);

  const activeCandidateFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStageFilter !== 'todos') count++;
    if (minMatchFilter > 0) count++;
    if (selectedCityFilter !== 'todas') count++;
    if (selectedInstitutionFilter !== 'todas') count++;
    if (selectedRatingFilter > 0) count++;
    if (onlyVerified) count++;
    if (onlyWithInterview) count++;
    if (onlyWithEndorsement) count++;
    if (onlyWithNotes) count++;
    if (candidateSearch.trim()) count++;
    if (sortBy !== 'match_desc') count++;
    return count;
  }, [
    selectedStageFilter, minMatchFilter, selectedCityFilter, selectedInstitutionFilter,
    selectedRatingFilter, onlyVerified, onlyWithInterview, onlyWithEndorsement,
    onlyWithNotes, candidateSearch, sortBy
  ]);

  const resetCandidateFilters = () => {
    setCandidateSearch('');
    setSelectedStageFilter('todos');
    setMinMatchFilter(0);
    setSelectedCityFilter('todas');
    setSelectedInstitutionFilter('todas');
    setSelectedRatingFilter(0);
    setOnlyVerified(false);
    setOnlyWithInterview(false);
    setOnlyWithEndorsement(false);
    setOnlyWithNotes(false);
    setSortBy('match_desc');
  };

  // Helper para status da entrevista
  const getInterviewStatusInfo = (cand) => {
    if (!cand || !cand.interview) return null;
    if (cand.stage === 'aprovado' || cand.interview?.concluida) {
      return { label: 'Concluída / Aprovado', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2, pulse: false };
    }
    if (cand.stage === 'reprovado' || cand.stage === 'banco_talentos') {
      return { label: 'Banco de Talentos', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: Users, pulse: false };
    }
    if (cand.interview?.roomCreated) {
      return { label: 'Em Andamento', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800', icon: Video, pulse: true };
    }
    return { label: 'Agendada', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', icon: Calendar, pulse: false };
  };

  // Coleta todos os candidatos com entrevista de todas as vagas da empresa
  const allInterviewsList = useMemo(() => {
    const list = [];
    allCompanyJobs.forEach(job => {
      const cands = getJobCandidates(job.id) || [];
      cands.forEach(cand => {
        if (cand.interview && (cand.interview.date || cand.interview.time || cand.stage === 'entrevista')) {
          list.push({
            ...cand,
            jobId: job.id,
            jobTitle: job.title,
            jobCity: job.city
          });
        }
      });
    });
    return list;
  }, [allCompanyJobs, updateCount]);

  // Estatísticas de Entrevistas
  const interviewStats = useMemo(() => {
    const total = allInterviewsList.length;
    const completed = allInterviewsList.filter(c => c.stage === 'aprovado' || c.interview?.concluida).length;
    const talentPool = allInterviewsList.filter(c => c.stage === 'reprovado' || c.stage === 'banco_talentos').length;
    const inProgress = allInterviewsList.filter(c => c.interview?.roomCreated && c.stage !== 'aprovado' && c.stage !== 'reprovado').length;
    const scheduled = total - completed - talentPool - inProgress;
    const passRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, talentPool, inProgress, scheduled: Math.max(0, scheduled), passRate };
  }, [allInterviewsList]);

  // Lista filtrada e ordenada de entrevistas
  const filteredInterviews = useMemo(() => {
    return allInterviewsList
      .filter(c => {
        const matchesSearch = !historySearch ||
          c.name?.toLowerCase().includes(historySearch.toLowerCase()) ||
          c.course?.toLowerCase().includes(historySearch.toLowerCase()) ||
          c.institution?.toLowerCase().includes(historySearch.toLowerCase()) ||
          c.jobTitle?.toLowerCase().includes(historySearch.toLowerCase()) ||
          (c.notes && c.notes.toLowerCase().includes(historySearch.toLowerCase()));

        const matchesJob = historyJobFilter === 'todos' || String(c.jobId) === String(historyJobFilter);
        const matchesFormat = historyFormatFilter === 'todos' || (c.interview?.format || '').includes(historyFormatFilter);

        let matchesStatus = true;
        if (historyStatusFilter === 'concluida') {
          matchesStatus = c.stage === 'aprovado' || !!c.interview?.concluida;
        } else if (historyStatusFilter === 'banco_talentos') {
          matchesStatus = c.stage === 'reprovado' || c.stage === 'banco_talentos';
        } else if (historyStatusFilter === 'andamento') {
          matchesStatus = !!c.interview?.roomCreated && c.stage !== 'aprovado' && c.stage !== 'reprovado';
        } else if (historyStatusFilter === 'agendada') {
          matchesStatus = !c.interview?.concluida && !c.interview?.roomCreated && c.stage !== 'aprovado' && c.stage !== 'reprovado';
        }

        return matchesSearch && matchesJob && matchesFormat && matchesStatus;
      })
      .sort((a, b) => {
        if (historySort === 'match_desc') return (b.matchScore || 0) - (a.matchScore || 0);
        if (historySort === 'date_asc') {
          const dateA = a.interview?.date ? new Date(`${a.interview.date}T${a.interview.time || '00:00'}`) : new Date(0);
          const dateB = b.interview?.date ? new Date(`${b.interview.date}T${b.interview.time || '00:00'}`) : new Date(0);
          return dateA - dateB;
        }
        // recent
        const dateA = a.interview?.date ? new Date(`${a.interview.date}T${a.interview.time || '00:00'}`) : new Date(0);
        const dateB = b.interview?.date ? new Date(`${b.interview.date}T${b.interview.time || '00:00'}`) : new Date(0);
        return dateB - dateA;
      });
  }, [allInterviewsList, historySearch, historyJobFilter, historyFormatFilter, historyStatusFilter, historySort]);

  // Estatísticas de Minhas Vagas
  const jobListStats = useMemo(() => {
    const total = allCompanyJobs.length;
    const active = allCompanyJobs.filter(j => j.status === 'Ativa').length;
    const paused = total - active;
    let totalCandidates = 0;
    let newCandidatesCount = 0;
    let interviewCandidatesCount = 0;
    let approvedCandidatesCount = 0;

    allCompanyJobs.forEach(j => {
      const cands = getJobCandidates(j.id) || [];
      totalCandidates += cands.length;
      newCandidatesCount += cands.filter(c => c.stage === 'triagem').length;
      interviewCandidatesCount += cands.filter(c => c.stage === 'entrevista').length;
      approvedCandidatesCount += cands.filter(c => c.stage === 'aprovado').length;
    });
    const avgCandidates = total > 0 ? (totalCandidates / total).toFixed(1) : '0';
    return {
      total,
      active,
      paused,
      totalCandidates,
      newCandidatesCount,
      interviewCandidatesCount,
      approvedCandidatesCount,
      avgCandidates
    };
  }, [allCompanyJobs, updateCount]);

  // Filtered & Sorted Jobs for "Minhas Vagas" Tab
  const filteredCompanyJobs = useMemo(() => {
    return allCompanyJobs
      .filter(job => {
        const matchesSearch = !jobListSearch ||
          job.title?.toLowerCase().includes(jobListSearch.toLowerCase()) ||
          job.description?.toLowerCase().includes(jobListSearch.toLowerCase()) ||
          (Array.isArray(job.requiredSkills)
            ? job.requiredSkills.some(s => s?.toLowerCase().includes(jobListSearch.toLowerCase()))
            : String(job.requiredSkills || '').toLowerCase().includes(jobListSearch.toLowerCase()));

        const matchesStatus = jobListStatusFilter === 'todos' ||
          (jobListStatusFilter === 'Ativa' ? job.status === 'Ativa' : job.status !== 'Ativa');

        const matchesModality = jobListModalityFilter === 'todos' ||
          (job.modality?.toLowerCase() === jobListModalityFilter.toLowerCase());

        const matchesType = jobListTypeFilter === 'todos' ||
          (job.type?.toLowerCase() === jobListTypeFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesModality && matchesType;
      })
      .sort((a, b) => {
        if (jobListSort === 'applicants_desc' || jobListSort === 'candidates_desc') {
          return (getJobCandidates(b.id) || []).length - (getJobCandidates(a.id) || []).length;
        }
        if (jobListSort === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return (b.id || 0) - (a.id || 0);
      });
  }, [allCompanyJobs, jobListSearch, jobListStatusFilter, jobListModalityFilter, jobListTypeFilter, jobListSort, updateCount]);

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
  }, [allCompanyJobs, updateCount]);

  // ── Stage Color Helper ──
  const getStageStyle = (stageId, stageColor) => {
    if (stageColor && STAGE_COLOR_MAP[stageColor]) {
      return STAGE_COLOR_MAP[stageColor];
    }
    const defaultByStage = {
      triagem: STAGE_COLOR_MAP.sky,
      analise: STAGE_COLOR_MAP.amber,
      entrevista: STAGE_COLOR_MAP.purple,
      desafio: STAGE_COLOR_MAP.indigo,
      desafio_tech: STAGE_COLOR_MAP.indigo,
      aprovado: STAGE_COLOR_MAP.emerald,
      proposta: STAGE_COLOR_MAP.emerald,
      reprovado: STAGE_COLOR_MAP.slate,
      banco: STAGE_COLOR_MAP.slate,
      banco_talentos: STAGE_COLOR_MAP.slate,
      fit_cultural: STAGE_COLOR_MAP.blue,
      dinamica: STAGE_COLOR_MAP.amber,
    };
    return defaultByStage[stageId] || STAGE_COLOR_MAP.blue;
  };

  // ── Candidate Actions ──
  const handleStageChange = (candidateId, newStage) => {
    if (!currentJob) return;
    updateCandidateStage(currentJob.id, candidateId, newStage);
    forceUpdate(n => n + 1);

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, stage: newStage }));
      if (newStage === 'entrevista' && !selectedCandidate.interview) {
        setActiveModalTab('interview');
      }
    } else if (newStage === 'entrevista') {
      const cand = jobCandidates.find(c => c.id === candidateId || String(c.id) === String(candidateId));
      if (cand && !cand.interview) {
        setSelectedCandidate({ ...cand, stage: newStage });
        setActiveModalTab('interview');
      }
    }
  };

  const handleReorderCandidate = (candidateId, targetCandidateId, newStage) => {
    if (!currentJob) return;
    reorderCandidateStage(currentJob.id, candidateId, targetCandidateId, newStage);
    forceUpdate(n => n + 1);

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, stage: newStage }));
      if (newStage === 'entrevista' && !selectedCandidate.interview) {
        setActiveModalTab('interview');
      }
    } else if (newStage === 'entrevista') {
      const cand = jobCandidates.find(c => String(c.id) === String(candidateId));
      if (cand && !cand.interview) {
        setSelectedCandidate({ ...cand, stage: newStage });
        setActiveModalTab('interview');
      }
    }
  };

  // Move candidate to previous / next stage
  const handleShiftStage = (cand, direction) => {
    const currentIndex = customStages.findIndex(s => s.id === cand.stage);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < customStages.length) {
      const nextStage = customStages[targetIndex];
      handleStageChange(cand.id, nextStage.id);
    }
  };

  // Helper to get next stage for a candidate in the funnel
  const getNextStageId = (currentStageId) => {
    const currentIndex = customStages.findIndex(s => s.id === currentStageId);
    if (currentIndex === -1) return 'desafio';

    // Look for next non-reprovado stage
    for (let i = currentIndex + 1; i < customStages.length; i++) {
      if (customStages[i].id !== 'reprovado' && customStages[i].id !== 'banco_talentos') {
        return customStages[i].id;
      }
    }
    // If no next non-reprovado stage found, return 'aprovado' or current
    const approvedStage = customStages.find(s => s.id === 'aprovado');
    return approvedStage ? approvedStage.id : currentStageId;
  };

  // Helper to get Banco de Talentos stage ID
  const getTalentPoolStageId = () => {
    const bancoStage = customStages.find(s => s.id === 'reprovado' || s.id === 'banco_talentos' || s.name?.toLowerCase().includes('banco'));
    return bancoStage ? bancoStage.id : 'reprovado';
  };

  // Handle interview concluded (Passar de Etapa)
  const handleInterviewConcluded = (cand) => {
    const targetJobId = cand?.jobId || currentJob?.id;
    if (!targetJobId || !cand) return;
    const nextStage = getNextStageId(cand.stage);
    const nextStageObj = customStages.find(s => s.id === nextStage);
    const nextStageName = nextStageObj ? nextStageObj.name : 'Próxima Etapa';

    updateCandidateStage(targetJobId, cand.id, nextStage);
    updateCandidateData(targetJobId, cand.id, {
      interview: { ...(cand.interview || {}), concluida: true, bannerDismissed: true, result: 'aprovado' }
    });

    showToast(`${cand.name} passou na entrevista e avançou para a etapa "${nextStageName}"!`);

    if (selectedCandidate && String(selectedCandidate.id) === String(cand.id)) {
      setSelectedCandidate(prev => ({
        ...prev,
        stage: nextStage,
        interview: { ...(prev.interview || {}), concluida: true, bannerDismissed: true, result: 'aprovado' }
      }));
    }
    forceUpdate(n => n + 1);
  };

  // Handle interview finalized (Banco de Talentos)
  const handleInterviewFinalized = (cand) => {
    const targetJobId = cand?.jobId || currentJob?.id;
    if (!targetJobId || !cand) return;
    const bancoStageId = getTalentPoolStageId();

    updateCandidateStage(targetJobId, cand.id, bancoStageId);
    updateCandidateData(targetJobId, cand.id, {
      interview: { ...(cand.interview || {}), concluida: true, bannerDismissed: true, result: 'banco_talentos' }
    });

    showToast(`${cand.name} teve a chamada finalizada e foi para o Banco de Talentos.`);

    if (selectedCandidate && String(selectedCandidate.id) === String(cand.id)) {
      setSelectedCandidate(prev => ({
        ...prev,
        stage: bancoStageId,
        interview: { ...(prev.interview || {}), concluida: true, bannerDismissed: true, result: 'banco_talentos' }
      }));
    }
    forceUpdate(n => n + 1);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, cand) => {
    setDraggedCandidate(cand);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(cand.id));
  };

  const handleDragEnd = () => {
    setDragOverStageId(null);
    setDragOverCandidateId(null);
    setDraggedCandidate(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
    if (dragOverCandidateId !== null) {
      setDragOverCandidateId(null);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverStageId === stageId) {
        setDragOverStageId(null);
      }
    }
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    setDragOverStageId(null);
    setDragOverCandidateId(null);
    const candidateIdStr = e.dataTransfer.getData('text/plain');
    const candidateId = candidateIdStr ? Number(candidateIdStr) : null;

    const activeId = candidateId || (draggedCandidate ? draggedCandidate.id : null);

    if (activeId) {
      handleReorderCandidate(activeId, null, stageId);
    }
    setDraggedCandidate(null);
  };

  const handleCardDrop = (e, targetCand) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStageId(null);
    setDragOverCandidateId(null);

    const candidateIdStr = e.dataTransfer.getData('text/plain');
    const candidateId = candidateIdStr ? Number(candidateIdStr) : null;
    const activeId = candidateId || (draggedCandidate ? draggedCandidate.id : null);

    if (activeId && String(activeId) !== String(targetCand.id)) {
      handleReorderCandidate(activeId, targetCand.id, targetCand.stage);
    }
    setDraggedCandidate(null);
  };

  const handleRatingChange = (candidateId, rating, specificJobId) => {
    const targetJobId = specificJobId || currentJob?.id;
    if (!targetJobId) return;
    updateCandidateData(targetJobId, candidateId, { rating });
    showToast(`Avaliação de ${rating} estrelas salva.`);
    forceUpdate(n => n + 1);

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, rating }));
    }
  };

  const handleScheduleInterview = (e) => {
    e.preventDefault();
    if (!selectedCandidate || !currentJob) return;

    const finalDate = interviewForm.date || selectedCandidate.interview?.date;
    const finalTime = interviewForm.time || selectedCandidate.interview?.time;
    const finalFormat = interviewForm.format || selectedCandidate.interview?.format || 'Google Meet';

    if (!finalDate || !finalTime) {
      showToast('Por favor, selecione data e horário.');
      return;
    }

    const finalForm = {
      date: finalDate,
      time: finalTime,
      format: finalFormat
    };

    const isAlteration = Boolean(selectedCandidate.interview?.date);

    scheduleCandidateInterview(currentJob.id, selectedCandidate.id, finalForm);

    // Message logic
    let msg = '';
    if (isAlteration) {
      msg = `Olá ${selectedCandidate.name}! O horário da sua entrevista para a vaga de ${currentJob.title} foi alterado para ${finalDate.split('-').reverse().join('/')} às ${finalTime}.\n\nFormato: ${finalFormat}\n\nO link oficial da sala será enviado por aqui minutos antes do nosso horário. Por favor, confirme sua presença!`;
    } else {
      msg = `Olá ${selectedCandidate.name}! Sua entrevista para a vaga de ${currentJob.title} foi agendada para ${finalDate.split('-').reverse().join('/')} às ${finalTime}.\n\nFormato: ${finalFormat}\n\nO link oficial da sala será enviado por aqui minutos antes do nosso horário. Por favor, confirme sua presença!`;
    }

    startChatWith({
      name: selectedCandidate.name,
      email: selectedCandidate.email || 'aluno@ivaiconecta.com.br',
      role: 'aluno',
      avatar: selectedCandidate.avatar
    }, `Entrevista: ${currentJob.title}`, isAlteration ? null : msg, isAlteration ? msg : null);

    if (isAlteration) {
      showToast(`Horário alterado! Revise o convite no chat antes de enviar.`);
    } else {
      showToast(`Entrevista agendada e convite enviado no chat!`);
    }
    setSelectedCandidate(null);
    forceUpdate(n => n + 1);
  };

  const handleSaveNotes = (notes) => {
    if (!selectedCandidate || !currentJob) return;
    updateCandidateData(currentJob.id, selectedCandidate.id, { notes });
    showToast('Anotações internas salvas.');
    forceUpdate(n => n + 1);
  };

  const handleQuickAddCandidate = (e) => {
    e.preventDefault();
    if (!newCandidateForm.name.trim()) {
      showToast('Por favor, informe o nome do candidato.');
      return;
    }

    const currentMap = getJobCandidates(currentJob.id);
    const newCand = {
      id: Date.now(),
      name: newCandidateForm.name,
      course: newCandidateForm.course,
      institution: newCandidateForm.institution,
      city: newCandidateForm.city,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
      matchScore: Number(newCandidateForm.matchScore) || 85,
      stage: addCandidateTargetStage,
      appliedAt: new Date().toLocaleDateString('pt-BR'),
      phone: newCandidateForm.phone,
      email: newCandidateForm.email || 'candidato@aluno.edu.br',
      isVerifiedStudent: true,
      rating: 4,
      skills: newCandidateForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      notes: 'Candidato inscrito / adicionado pela gestão da empresa.',
      interview: null,
      endorsements: [],
      activity: [
        { date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), text: 'Candidatura adicionada ao processo seletivo' }
      ]
    };

    updateCandidateData(currentJob.id, newCand.id, newCand);
    // Add to list
    const updated = [...currentMap, newCand];
    const map = JSON.parse(localStorage.getItem('ivai_conecta_job_candidates_map') || '{}');
    map[currentJob.id] = updated;
    localStorage.setItem('ivai_conecta_job_candidates_map', JSON.stringify(map));

    showToast(`Candidato ${newCand.name} adicionado com sucesso!`);
    setShowAddCandidateModal(false);
    setNewCandidateForm({
      name: '',
      course: 'Análise e Desenvolvimento de Sistemas',
      institution: 'IFPR Campus Ivaiporã',
      city: 'Ivaiporã',
      matchScore: 90,
      skills: 'React, Tailwind, JavaScript',
      phone: '5543999001122',
      email: ''
    });
    forceUpdate(n => n + 1);
  };

  // ── Job Actions ──
  const handleCloseJob = async (jobOrId) => {
    const targetJob = typeof jobOrId === 'object' && jobOrId !== null
      ? jobOrId
      : allCompanyJobs.find(j => String(j.id) === String(jobOrId) || String(j.firestoreId) === String(jobOrId));
    const idStr = targetJob?.id ? String(targetJob.id) : String(jobOrId);
    const firestoreIdStr = targetJob?.firestoreId ? String(targetJob.firestoreId) : null;

    // 1. Atualização Otimista Imediata no React (sem F5!)
    setLiveJobs(prev => prev.map(j => {
      const jId = String(j.id);
      const jFId = j.firestoreId ? String(j.firestoreId) : null;
      const isTarget = jId === idStr || (firestoreIdStr && (jId === firestoreIdStr || jFId === firestoreIdStr)) || (jFId && jFId === idStr);
      if (isTarget) {
        return { ...j, status: 'Encerrada' };
      }
      return j;
    }));

    // 2. Persiste a alteração
    try {
      await updateJobStatus(firestoreIdStr || idStr, 'close');
      showToast('Processo seletivo encerrado com sucesso!');
    } catch (err) {
      console.error('Erro ao encerrar vaga:', err);
      showToast('Erro ao sincronizar encerramento da vaga.');
    }
    forceUpdate(n => n + 1);
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'Ativa' ? 'close' : 'reopen';
    const idStr = String(jobId);

    // Atualização otimista imediata
    setLiveJobs(prev => prev.map(j => {
      if (String(j.id) === idStr || String(j.firestoreId) === idStr) {
        return { ...j, status: newStatus === 'close' ? 'Encerrada' : 'Ativa' };
      }
      return j;
    }));

    await updateJobStatus(jobId, newStatus);
    showToast(newStatus === 'close' ? 'Vaga encerrada.' : 'Vaga reaberta e ativada com sucesso!');
    forceUpdate(n => n + 1);
  };

  const handleDuplicateJob = (jobId) => {
    duplicateJob(jobId);
    showToast('Vaga duplicada com sucesso!');
    forceUpdate(n => n + 1);
  };

  const handleShareJob = (job) => {
    const url = `${window.location.origin}/vagas`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Link de divulgação da vaga "${job.title}" copiado!`);
    } else {
      showToast(`Link: ${url}`);
    }
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

    const titleClean = (editingJob.title || '').trim();
    if (!titleClean) {
      showToast('⚠️ O título da vaga é obrigatório.');
      return;
    }
    const titleVal = validateJobTitle(titleClean);
    if (!titleVal.valid) {
      showToast(`⚠️ ${titleVal.error}`);
      return;
    }

    if (editingJob.description) {
      const descClean = editingJob.description.trim();
      const descVal = validateProfessionalText(descClean, 'Descrição da Vaga', 30, 2000);
      if (!descVal.valid) {
        showToast(`⚠️ ${descVal.error}`);
        return;
      }
    }

    if (editingJob.recruiterPhone && editingJob.recruiterPhone.trim()) {
      const phoneVal = validatePhoneNumber(editingJob.recruiterPhone, false);
      if (!phoneVal.valid) {
        showToast(`⚠️ ${phoneVal.error}`);
        return;
      }
    }

    updateJob(editingJob.id, {
      ...editingJob,
      title: titleClean,
      workingHours: editingJob.workingHours || STANDARD_WORKING_HOURS[0]
    });
    showToast('Vaga atualizada com sucesso!');
    setEditingJob(null);
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

  const handleAddPredefinedStage = (predefined) => {
    const newId = `etapa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newStage = {
      id: newId,
      name: predefined.name,
      color: predefined.color || 'blue',
      description: predefined.description || '',
    };
    setCustomStages([...customStages, newStage]);
    showToast(`Etapa "${predefined.name}" adicionada! Lembre-se de salvar.`);
  };

  const handleMoveStageUp = (index) => {
    if (index <= 0) return;
    const newStages = [...customStages];
    const [moved] = newStages.splice(index, 1);
    newStages.splice(index - 1, 0, moved);
    setCustomStages(newStages);
  };

  const handleMoveStageDown = (index) => {
    if (index >= customStages.length - 1) return;
    const newStages = [...customStages];
    const [moved] = newStages.splice(index, 1);
    newStages.splice(index + 1, 0, moved);
    setCustomStages(newStages);
  };

  const handleStageCardDragStart = (e, index) => {
    setDraggedStageIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleStageCardDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageIdx !== index) {
      setDragOverStageIdx(index);
    }
  };

  const handleStageCardDragLeave = (e) => {
    e.preventDefault();
  };

  const handleStageCardDragEnd = () => {
    setDraggedStageIdx(null);
    setDragOverStageIdx(null);
  };

  const handleStageCardDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedStageIdx === null || draggedStageIdx === targetIndex) {
      setDraggedStageIdx(null);
      setDragOverStageIdx(null);
      return;
    }
    const updated = [...customStages];
    const [moved] = updated.splice(draggedStageIdx, 1);
    updated.splice(targetIndex, 0, moved);
    setCustomStages(updated);
    setDraggedStageIdx(null);
    setDragOverStageIdx(null);
    showToast(`Etapa "${moved.name}" movida para a posição ${targetIndex + 1}! Lembre-se de salvar.`);
  };

  const handleDuplicateStage = (index) => {
    const stageToCopy = customStages[index];
    if (!stageToCopy) return;
    const duplicated = {
      ...stageToCopy,
      id: `etapa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${stageToCopy.name} (Cópia)`,
    };
    const newStages = [...customStages];
    newStages.splice(index + 1, 0, duplicated);
    setCustomStages(newStages);
    showToast(`Etapa "${stageToCopy.name}" duplicada com sucesso!`);
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
    if (selectedJobId === 'default' || !currentJob) {
      saveCompanyCustomStages(customStages);
      showToast('Modelo padrão de etapas da empresa salvo com sucesso!');
      forceUpdate(n => n + 1);
      return;
    }
    saveJobCustomStages(currentJob.id, customStages);
    showToast(`Etapas do funil salvas exclusivamente para a vaga: "${currentJob.title}"!`);
    forceUpdate(n => n + 1);
  };

  const handleApplyCustomStagesToAllJobs = () => {
    saveCompanyCustomStages(customStages);
    allCompanyJobs.forEach(job => {
      saveJobCustomStages(job.id, customStages);
    });
    showToast('Estas etapas foram salvas e aplicadas a todas as vagas da empresa com sucesso!');
    forceUpdate(n => n + 1);
  };

  const handleCopyStagesFromAnotherJob = (sourceJobId) => {
    if (!sourceJobId) return;
    const stages = getJobCustomStages(sourceJobId);
    setCustomStages(stages);
    showToast('Etapas importadas da outra vaga! Revise e clique em salvar.');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-gray-800 dark:text-slate-100 transition-colors duration-300">

      {/* ── HEADER MINIMALISTA ── */}
      <header className="bg-white dark:bg-slate-900 py-6 lg:py-8 border-b border-gray-200 dark:border-slate-800">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Voltar
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Painel</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} /> Gestão de Vagas
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck size={11} /> Empresa Verificada
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {currentUser?.name || currentUser?.razaoSocial || 'Minha Empresa'}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to={currentUser?.uid ? `/empresa/${currentUser.uid}` : '/empresa'}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye size={15} /> Ver Perfil
              </Link>
              <button
                onClick={() => setShowNewJobModal(true)}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Plus size={16} /> Nova Vaga
              </button>
            </div>
          </div>

          {/* ── SUB-TABS NAVIGATION MINIMALISTA (ACIMA DAS INFORMAÇÕES) ── */}
          <div className="border-t border-gray-100 dark:border-slate-800/80 mt-6">
            <div className="flex items-center overflow-x-auto scrollbar-none gap-6 pt-1">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'pipeline'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
              >
                <Layers size={16} /> Funil Kanban
              </button>

              <button
                onClick={() => setActiveTab('jobs_list')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'jobs_list'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
              >
                <Briefcase size={16} /> Minhas Vagas ({allCompanyJobs.length})
              </button>

              <button
                onClick={() => setActiveTab('interview_history')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'interview_history'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
              >
                <History size={16} /> Histórico de Entrevistas
                {allInterviewsList.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {allInterviewsList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('stage_settings')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'stage_settings'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
              >
                <Settings size={16} /> Configurar Etapas
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'analytics'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
              >
                <BarChart3 size={16} /> Indicadores
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── INTERVIEW BANNER PREMIUM ── */}
      {interviewsNow.length > 0 && activeTab !== 'jobs_list' && (() => {
        const activeCand = interviewsNow[0];

        const bannerStyles = {
          prestes: 'from-amber-600 via-amber-500 to-orange-500 border border-amber-400/50',
          atrasada: 'from-red-700 via-red-600 to-rose-600 border border-red-500/50',
          andamento: 'from-primary-dark via-primary-blue to-blue-500 border border-primary-blue/50',
          concluida: 'from-emerald-700 via-emerald-600 to-teal-500 border border-emerald-500/50'
        };

        const bannerTitles = {
          prestes: 'ENTREVISTA PRESTES A COMEÇAR',
          atrasada: 'ENTREVISTA ATRASADA',
          andamento: 'ENTREVISTA EM ANDAMENTO',
          concluida: 'RESULTADO DA ENTREVISTA'
        };

        return (
          <div className={`fixed bottom-6 right-6 z-50 w-[360px] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] bg-gradient-to-br ${bannerStyles[activeCand.interviewStatus]} overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 transition-colors`}>
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl animate-pulse delay-700"></div>

            <button
              onClick={() => {
                updateCandidateData(currentJob.id, activeCand.id, {
                  interview: { ...activeCand.interview, bannerDismissed: true }
                });
                forceUpdate(prev => prev + 1);
              }}
              className="absolute top-3 right-3 p-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 backdrop-blur-sm"
              title="Ocultar Notificação"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            <div className="p-5 relative z-10">
              <div className="flex items-start gap-3.5 mb-4 pr-4">
                <div className="relative flex shrink-0">
                  {activeCand.avatar ? (
                    <img src={activeCand.avatar} alt={activeCand.name} className="w-12 h-12 rounded-full border-2 border-white/40 shadow-sm object-cover bg-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 shadow-sm flex items-center justify-center">
                      <Video size={18} className="text-white" />
                    </div>
                  )}
                  {(activeCand.interviewStatus === 'andamento' || activeCand.interviewStatus === 'prestes') && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white/80 rounded-full animate-ping"></span>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white/80 rounded-full"></span>
                </div>
                <div className="pt-0.5">
                  <h4 className="font-extrabold text-[13px] text-white tracking-wide drop-shadow-md leading-tight mb-1">
                    {bannerTitles[activeCand.interviewStatus]}
                  </h4>
                  <p className="text-[11px] text-white/90 font-medium drop-shadow-sm leading-snug">
                    {activeCand.interviewStatus === 'concluida'
                      ? `A entrevista terminou. Qual foi o resultado final de ${activeCand.name}?`
                      : activeCand.interviewStatus === 'andamento'
                        ? `Reunião com ${activeCand.name} em andamento. Defina o resultado:`
                        : `Sua reunião com ${activeCand.name} está agendada para as ${activeCand.interview.time}.`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                {(activeCand.interviewStatus === 'concluida' || activeCand.interviewStatus === 'andamento') ? (
                  <div className="flex w-full gap-2.5">
                    <button
                      onClick={() => handleInterviewConcluded(activeCand)}
                      className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer border border-emerald-400/40"
                      title="Aprovar candidato na entrevista e avançar para a próxima etapa"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold leading-tight">
                        <Check size={14} strokeWidth={3} />
                        <span>Concluída</span>
                      </div>
                      <span className="text-[10px] text-emerald-100 font-medium leading-tight">Avançar Etapa</span>
                    </button>

                    <button
                      onClick={() => handleInterviewFinalized(activeCand)}
                      className="flex-1 py-2 px-3 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all backdrop-blur-sm border border-white/25 shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                      title="Finalizar chamada e mover candidato para o Banco de Talentos"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold leading-tight">
                        <X size={14} strokeWidth={2.5} />
                        <span>Finalizada</span>
                      </div>
                      <span className="text-[10px] text-white/75 font-medium leading-tight">Banco de Talentos</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const platform = activeCand.interview.format || 'Google Meet';
                      if (platform.includes('Google Meet')) window.open('https://meet.google.com/new', '_blank');
                      else if (platform.includes('Teams')) window.open('https://teams.microsoft.com/', '_blank');

                      startChatWith({
                        name: activeCand.name,
                        email: activeCand.email || 'aluno@ivaiconecta.com.br',
                        role: 'aluno',
                        avatar: activeCand.avatar
                      }, `Entrevista: ${currentJob?.title}`, `Olá ${activeCand.name}! Nossa entrevista está começando. \nPor favor, acesse o link abaixo para entrar na sala oficial:\n\n[COLE O LINK DA REUNIÃO AQUI]`);

                      updateCandidateData(currentJob.id, activeCand.id, {
                        interview: { ...activeCand.interview, roomCreated: true }
                      });
                      forceUpdate(prev => prev + 1);
                    }}
                    className={`w-full py-2.5 bg-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer ${activeCand.interviewStatus === 'atrasada' ? 'text-red-700 hover:bg-red-50' : 'text-primary-blue hover:bg-blue-50'
                      }`}
                  >
                    <Video size={15} /> Abrir Sala de Vídeo
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ═════════════════════════════════════════════════════════════════
            TAB 1: FUNIL DE RECRUTAMENTO & PIPELINE (KANBAN ATS REVAMP)
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pipeline' && (
          allCompanyJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 text-primary-blue mx-auto flex items-center justify-center">
                <Briefcase size={26} />
              </div>
              <h4 className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                Nenhuma vaga ativa no momento
              </h4>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Sua empresa não possui processos seletivos em andamento. Crie uma nova vaga para acompanhar candidatos pelo funil Kanban.
              </p>
              <button
                type="button"
                onClick={() => setShowNewJobModal(true)}
                className="btn btn-primary btn-md font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-brand-sm"
              >
                <Plus size={16} /> Publicar Primeira Vaga
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Top Toolbar: Minimalist Job Selector & Filters */}
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-2">
                <div className="flex-1 max-w-2xl">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Vaga Selecionada
                  </label>
                  <div className="relative">
                    <select
                      value={selectedJobId}
                      onChange={e => setSelectedJobId(Number(e.target.value) || e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-900 dark:text-white outline-none cursor-pointer focus:border-gray-400 transition-colors"
                    >
                      {allCompanyJobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title} — {job.city} ({getJobCandidates(job.id).length} candidatos)
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar candidato..."
                      value={candidateSearch}
                      onChange={e => setCandidateSearch(e.target.value)}
                      className="w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-gray-400 text-gray-800 dark:text-white transition-colors"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => {
                      setAddCandidateTargetStage('triagem');
                      setShowAddCandidateModal(true);
                    }}
                    className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserPlus size={14} /> Candidato
                  </button>

                  <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${viewMode === 'kanban'
                          ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                        }`}
                    >
                      <LayoutGrid size={13} /> Kanban
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${viewMode === 'list'
                          ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                        }`}
                    >
                      <ListFilter size={13} /> Lista
                    </button>
                  </div>
                </div>
              </div>

              {/* ── BARRA DE ABAS DO FUNIL & ORDENAÇÃO ── */}
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs overflow-hidden">
                {/* Lado Esquerdo: Etapas (Scrollable) */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <button
                    onClick={() => setSelectedStageFilter('todos')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${selectedStageFilter === 'todos'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span>Todas as Etapas</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${selectedStageFilter === 'todos'
                        ? 'bg-white/20 dark:bg-gray-900/20 text-current'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                      }`}>
                      {jobCandidates.length}
                    </span>
                  </button>

                  {customStages.map(stage => {
                    const count = jobCandidates.filter(c => c.stage === stage.id).length;
                    const isSelected = selectedStageFilter === stage.id;
                    const style = getStageStyle(stage.id, stage.color);

                    return (
                      <button
                        key={stage.id}
                        onClick={() => setSelectedStageFilter(isSelected ? 'todos' : stage.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${isSelected
                            ? 'bg-primary-blue text-white shadow-xs'
                            : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : style.dot}`} />
                        <span>{stage.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                          }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Lado Direito: Ordenação e Contagem */}
                <div className="flex items-center gap-3 text-xs pr-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300 border-l border-gray-200 dark:border-slate-700 pl-4">
                    <ArrowUpDown size={13} className="text-gray-400" />
                    <span className="font-normal text-gray-500 dark:text-slate-400 hidden lg:inline">Ordenar:</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="bg-transparent border-none text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:ring-0"
                    >
                      <option value="match_desc">Maior Match</option>
                      <option value="match_asc">Menor Match</option>
                      <option value="rating_desc">Melhor Avaliação</option>
                      <option value="recent">Mais Recentes</option>
                      <option value="oldest">Mais Antigos</option>
                      <option value="name_asc">Nome (A-Z)</option>
                    </select>
                  </div>

                  <div className="border-l border-gray-200 dark:border-slate-700 pl-4 text-gray-500 dark:text-slate-400 font-normal whitespace-nowrap">
                    Mostrando <span className="font-semibold text-gray-900 dark:text-white">{filteredCandidates.length}</span> <span className="hidden sm:inline">de {jobCandidates.length}</span>
                  </div>
                </div>
              </div>

              {/* ── PAINEL EXPANSÍVEL DE FILTROS AVANÇADOS ── */}
              {showAdvancedFilters && (
                <div className="bg-white dark:bg-slate-900 border border-primary-blue/30 dark:border-primary-blue/30 rounded-2xl p-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={15} className="text-primary-blue" />
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                        Filtros Avançados de Candidatos
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCityFilter('todas');
                        setSelectedInstitutionFilter('todas');
                        setSelectedRatingFilter(0);
                        setMinMatchFilter(0);
                      }}
                      className="text-xs text-primary-blue hover:underline font-medium cursor-pointer"
                    >
                      Redefinir Filtros Avançados
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Cidade do Candidato */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-300 mb-1.5">
                        Cidade do Candidato
                      </label>
                      <select
                        value={selectedCityFilter}
                        onChange={e => setSelectedCityFilter(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-normal text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                      >
                        <option value="todas">Todas as Cidades</option>
                        {availableCandidateCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    {/* Instituição de Ensino */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-300 mb-1.5">
                        Instituição de Ensino
                      </label>
                      <select
                        value={selectedInstitutionFilter}
                        onChange={e => setSelectedInstitutionFilter(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-normal text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                      >
                        <option value="todas">Todas as Instituições</option>
                        {availableInstitutions.map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>

                    {/* Nota de Match Mínima */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-300 mb-1.5">
                        Match Mínimo ({minMatchFilter === 0 ? 'Qualquer' : `≥ ${minMatchFilter}%`})
                      </label>
                      <div className="flex gap-1">
                        {[0, 75, 85, 90, 95].map(val => (
                          <button
                            key={val}
                            onClick={() => setMinMatchFilter(val)}
                            className={`flex-1 py-1.5 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${minMatchFilter === val
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                              }`}
                          >
                            {val === 0 ? 'Todos' : `>${val}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Avaliação em Estrelas */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-slate-300 mb-1.5">
                        Avaliação Interna
                      </label>
                      <div className="flex gap-1">
                        {[
                          { val: 0, label: 'Todas' },
                          { val: 3, label: '3+ estrelas' },
                          { val: 4, label: '4+ estrelas' },
                          { val: 5, label: '5 estrelas' }
                        ].map(item => (
                          <button
                            key={item.val}
                            onClick={() => setSelectedRatingFilter(item.val)}
                            className={`flex-1 py-1.5 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${selectedRatingFilter === item.val
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                              }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CHIPS DE FILTROS ATIVOS ── */}
              {activeCandidateFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Filtros Ativos:</span>

                  {candidateSearch && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-primary-blue border border-blue-200 dark:border-blue-800">
                      Busca: "{candidateSearch}"
                      <button onClick={() => setCandidateSearch('')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {selectedStageFilter !== 'todos' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Etapa: {customStages.find(s => s.id === selectedStageFilter)?.name || selectedStageFilter}
                      <button onClick={() => setSelectedStageFilter('todos')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {selectedCityFilter !== 'todas' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      Cidade: {selectedCityFilter}
                      <button onClick={() => setSelectedCityFilter('todas')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {selectedInstitutionFilter !== 'todas' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      Inst.: {selectedInstitutionFilter}
                      <button onClick={() => setSelectedInstitutionFilter('todas')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {minMatchFilter > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Match: &ge; {minMatchFilter}%
                      <button onClick={() => setMinMatchFilter(0)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {selectedRatingFilter > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Avaliação: &ge; {selectedRatingFilter} estrelas
                      <button onClick={() => setSelectedRatingFilter(0)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {onlyVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Selo IFPR
                      <button onClick={() => setOnlyVerified(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {onlyWithInterview && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Com Entrevista
                      <button onClick={() => setOnlyWithInterview(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {onlyWithEndorsement && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Parecer Docente
                      <button onClick={() => setOnlyWithEndorsement(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {onlyWithNotes && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      Com Anotações
                      <button onClick={() => setOnlyWithNotes(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  {sortBy !== 'match_desc' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      Ordem: {
                        sortBy === 'match_asc' ? 'Menor Match' :
                          sortBy === 'rating_desc' ? 'Melhor Avaliação' :
                            sortBy === 'recent' ? 'Mais Recentes' :
                              sortBy === 'oldest' ? 'Mais Antigos' : 'Nome (A-Z)'
                      }
                      <button onClick={() => setSortBy('match_desc')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                    </span>
                  )}

                  <button
                    onClick={resetCandidateFilters}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1 ml-auto"
                  >
                    <RotateCcw size={12} /> Limpar todos ({activeCandidateFiltersCount})
                  </button>
                </div>
              )}



              {/* ═════════════════════════════════════════════════════════════
                MODERN KANBAN ATS BOARD (DRAG & DROP + LINEAR/ASHBY STYLE)
            ═════════════════════════════════════════════════════════════ */}
              {viewMode === 'kanban' && (
                <div className="space-y-3">
                  {selectedStageFilter !== 'todos' && (
                    <div className="flex items-center justify-between bg-primary-blue/10 dark:bg-primary-blue/20 border border-primary-blue/30 rounded-2xl px-4 py-2.5 text-xs text-primary-blue font-medium">
                      <span>
                        Filtro por etapa ativo: exibindo apenas a coluna <strong>"{customStages.find(s => s.id === selectedStageFilter)?.name || selectedStageFilter}"</strong>
                      </span>
                      <button
                        onClick={() => setSelectedStageFilter('todos')}
                        className="underline hover:opacity-80 font-semibold cursor-pointer"
                      >
                        Ver todas as etapas do funil
                      </button>
                    </div>
                  )}

                  {filteredCandidates.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center my-4 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <Filter size={20} />
                      </div>
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">Nenhum candidato encontrado</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                        Não encontramos candidatos nesta vaga que correspondam aos filtros selecionados.
                      </p>
                      <button
                        onClick={resetCandidateFilters}
                        className="btn btn-outline btn-sm font-medium text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RotateCcw size={13} /> Limpar Todos os Filtros
                      </button>
                    </div>
                  ) : (
                    <div className={`pb-6 pt-1 ${selectedStageFilter === 'todos' ? 'overflow-x-auto min-w-full' : 'w-full'}`}>
                      <div className={`flex gap-4.5 items-stretch ${selectedStageFilter === 'todos' ? 'min-w-max' : 'w-full'}`}>
                        {customStages
                          .filter(stage => selectedStageFilter === 'todos' || stage.id === selectedStageFilter)
                          .map(stage => {
                            const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id);
                            const style = getStageStyle(stage.id, stage.color);
                            const isDragOver = dragOverStageId === stage.id;
                            const isSingleColumn = selectedStageFilter !== 'todos';

                            return (
                              <div
                                key={stage.id}
                                onDragOver={e => handleDragOver(e, stage.id)}
                                onDragLeave={e => handleDragLeave(e, stage.id)}
                                onDrop={e => handleDrop(e, stage.id)}
                                className={`w-[330px] min-w-[330px] max-w-[330px] shrink-0 flex flex-col rounded-3xl p-3.5 transition-all duration-200 border shadow-sm ${isDragOver
                                    ? `${style.dropHighlight} ring-2 ring-primary-blue/60 scale-[1.01]`
                                    : 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800/90'
                                  }`}
                              >
                                {/* ── Column Header ── */}
                                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs mb-3.5 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`w-3 h-3 rounded-full shrink-0 ${style.dot} ring-4 ring-slate-100 dark:ring-slate-800`} />
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                        {stage.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                                        {stage.description || `${stageCandidates.length} candidatos nesta fase`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border shadow-2xs ${style.badge}`}>
                                      {stageCandidates.length}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setAddCandidateTargetStage(stage.id);
                                        setShowAddCandidateModal(true);
                                      }}
                                      className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                      title={`Adicionar candidato em ${stage.name}`}
                                    >
                                      <Plus size={15} />
                                    </button>
                                  </div>
                                </div>

                                {/* ── Cards Container (Scrollable) ── */}
                                <div className="flex-1 flex flex-col gap-3 min-h-[420px] max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
                                  {stageCandidates.length === 0 ? (
                                    <div className={`h-full min-h-[260px] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 transition-all ${isDragOver
                                        ? 'border-primary-blue bg-blue-500/10 text-primary-blue font-semibold'
                                        : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500'
                                      }`}>
                                      <Inbox size={32} className={`opacity-60 mb-1 ${isDragOver ? 'animate-bounce text-primary-blue' : ''}`} />
                                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                        {isDragOver ? 'Solte o candidato aqui' : 'Nenhum candidato'}
                                      </span>
                                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                        {isDragOver ? `Mover para ${stage.name}` : 'Arraste candidatos para cá'}
                                      </span>
                                    </div>
                                  ) : (
                                    stageCandidates.map(cand => {
                                      const isBeingDragged = draggedCandidate?.id === cand.id;
                                      const isDragOverTarget = dragOverCandidateId === cand.id;

                                      return (
                                        <div
                                          key={cand.id}
                                          onDragOver={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (dragOverCandidateId !== cand.id) setDragOverCandidateId(cand.id);
                                          }}
                                          onDrop={e => handleCardDrop(e, cand)}
                                          className={`transition-all duration-300 ease-out relative ${isDragOverTarget ? 'pt-32' : 'pt-0'}`}
                                        >
                                          {isDragOverTarget && (
                                            <div className="absolute top-0 left-0 right-0 h-28 rounded-2xl border-2 border-dashed border-primary-blue/60 bg-blue-50/60 dark:bg-blue-500/10 pointer-events-none" />
                                          )}
                                          <div
                                            draggable
                                            onDragStart={e => handleDragStart(e, cand)}
                                            onDragEnd={handleDragEnd}
                                            onClick={(e) => {
                                              if (isDraggingLock || draggedCandidate) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return;
                                              }
                                              setSelectedCandidate(cand);
                                              setActiveModalTab('overview');
                                            }}
                                            className={`group relative bg-white dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 hover:border-primary-blue/60 dark:hover:border-blue-400 rounded-2xl p-3.5 shadow-2xs hover:shadow-brand-md transition-all duration-300 ease-out cursor-grab active:cursor-grabbing flex flex-col gap-2.5 ${isBeingDragged
                                                ? 'opacity-40 ring-2 ring-primary-blue rotate-2 scale-95 shadow-xl'
                                                : 'hover:-translate-y-0.5'
                                              }`}
                                          >
                                            {/* ── Card Top Header: Avatar + Info + Match Pill ── */}
                                            <div className="flex items-start justify-between gap-2.5">
                                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="relative shrink-0">
                                                  <img
                                                    src={cand.avatar}
                                                    alt={cand.name}
                                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs bg-slate-50"
                                                  />
                                                  {cand.isVerifiedStudent && (
                                                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-2xs ring-2 ring-white dark:ring-slate-800" title="Matrícula Verificada">
                                                      <ShieldCheck size={9} />
                                                    </span>
                                                  )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                  <h5 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-primary-blue transition-colors leading-snug truncate">
                                                    {cand.name}
                                                  </h5>
                                                  <div className="text-[11px] font-medium text-primary-blue dark:text-blue-400 truncate mt-0.2">
                                                    {cand.course}
                                                  </div>
                                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                                    <span>{cand.institution}</span>
                                                    <span>·</span>
                                                    <span>{cand.city}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Match Badge */}
                                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 border ${cand.matchScore >= 90
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                                  : cand.matchScore >= 80
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                }`}>
                                                {cand.matchScore}%
                                              </span>
                                            </div>

                                            {/* ── Interview Scheduled Indicator ── */}
                                            {cand.interview && (() => {
                                              const hasDateAndTime = cand.interview.date && cand.interview.time;
                                              let status = null; // null | 'prestes' | 'atrasada' | 'andamento' | 'concluida'

                                              if (cand.stage === 'aprovado' || cand.stage === 'reprovado' || cand.stage === 'banco_talentos' || cand.interview.concluida) {
                                                status = 'concluida';
                                              } else if (hasDateAndTime) {
                                                const [year, month, day] = cand.interview.date.split('-');
                                                const [hour, minute] = cand.interview.time.split(':');
                                                const interviewDate = new Date(year, month - 1, day, hour, minute);
                                                const diffMinutes = (now - interviewDate) / 60000;

                                                if (cand.interview.roomCreated) {
                                                  if (diffMinutes > 120) status = 'concluida';
                                                  else status = 'andamento';
                                                } else {
                                                  if (diffMinutes >= 0) status = 'atrasada';
                                                  else if (diffMinutes >= -10 && diffMinutes < 0) status = 'prestes';
                                                }
                                              }

                                              const statusConfig = {
                                                atrasada: { label: 'Atrasada', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50', icon: AlertCircle },
                                                prestes: { label: 'Prestes a começar', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50', icon: Clock },
                                                andamento: { label: 'Em andamento', color: 'text-primary-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50', icon: Video, pulse: true },
                                                concluida: { label: 'Concluída', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50', icon: CheckCircle2 }
                                              };

                                              const currentStatus = status ? statusConfig[status] : null;
                                              const Icon = currentStatus?.icon;

                                              return (
                                                <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                                                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                                    <Calendar size={11} />
                                                    <span>
                                                      Entrevista: {cand.interview.date} às {cand.interview.time}
                                                    </span>
                                                  </div>
                                                  {currentStatus && (
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit border ${currentStatus.color}`}>
                                                      <Icon size={10} className={currentStatus.pulse ? 'animate-pulse' : ''} /> {currentStatus.label}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}

                                            {/* ── Skills Chips ── */}
                                            <div className="flex flex-wrap gap-1">
                                              {cand.skills?.slice(0, 3).map(skill => (
                                                <span key={skill} className="text-[10px] bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                                                  {skill}
                                                </span>
                                              ))}
                                              {cand.skills?.length > 3 && (
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold self-center">
                                                  +{cand.skills.length - 3}
                                                </span>
                                              )}
                                            </div>

                                            {/* ── Card Footer: Stars + Quick Actions + Stage Shift ── */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 gap-1 text-xs">

                                              {/* Star Rating */}
                                              <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                  <button
                                                    key={star}
                                                    onClick={() => handleRatingChange(cand.id, star)}
                                                    className={`p-0.5 hover:scale-125 transition-transform ${(cand.rating || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                                                      }`}
                                                    title={`Avaliar ${star} estrelas`}
                                                  >
                                                    <Star size={11} className={(cand.rating || 0) >= star ? 'fill-current' : ''} />
                                                  </button>
                                                ))}
                                              </div>

                                              {/* Actions Group */}
                                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>

                                                {/* Quick Shift Left */}
                                                <button
                                                  onClick={() => handleShiftStage(cand, 'prev')}
                                                  disabled={customStages.findIndex(s => s.id === cand.stage) === 0}
                                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                                  title="Mover para etapa anterior"
                                                >
                                                  <ChevronLeft size={13} />
                                                </button>

                                                {/* Quick Shift Right */}
                                                <button
                                                  onClick={() => handleShiftStage(cand, 'next')}
                                                  disabled={customStages.findIndex(s => s.id === cand.stage) === customStages.length - 1}
                                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                                  title="Avançar para próxima etapa"
                                                >
                                                  <ChevronRight size={13} />
                                                </button>


                                                {/* Chat Button */}
                                                <button
                                                  onClick={() => {
                                                    startChatWith({
                                                      name: cand.name,
                                                      email: cand.email || 'aluno@ivaiconecta.com.br',
                                                      role: 'aluno',
                                                      avatar: cand.avatar
                                                    }, `Processo Seletivo: ${currentJob?.title || 'Vaga'}`);
                                                  }}
                                                  className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-primary-blue dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                                  title="Abrir chat no Ivaí Conecta"
                                                >
                                                  <MessageSquare size={11} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

                  {/* ═════════════════════════════════════════════════════════════
                LIST / TABLE VIEW (ALTERNATIVE FOR TABULAR BROWSING)
            ═════════════════════════════════════════════════════════════ */}
                  {viewMode === 'list' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider text-[11px]">
                            <tr>
                              <th className="py-4 px-5">Candidato</th>
                              <th className="py-4 px-5">Curso / Instituição</th>
                              <th className="py-4 px-5">Match %</th>
                              <th className="py-4 px-5">Etapa do Funil</th>
                              <th className="py-4 px-5">Avaliação</th>
                              <th className="py-4 px-5">Inscrição</th>
                              <th className="py-4 px-5 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredCandidates.map(cand => (
                              <tr key={cand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-3">
                                    <img src={cand.avatar} alt={cand.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs" />
                                    <div>
                                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        {cand.name}
                                        {cand.isVerifiedStudent && <ShieldCheck size={13} className="text-emerald-500" />}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{cand.city} · {cand.phone}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                                  <div>{cand.course}</div>
                                  <div className="text-[11px] text-primary-blue font-medium">{cand.institution}</div>
                                </td>
                                <td className="py-4 px-5">
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs">
                                    {cand.matchScore}% Match
                                  </span>
                                </td>
                                <td className="py-4 px-5">
                                  <select
                                    value={cand.stage}
                                    onChange={e => handleStageChange(cand.id, e.target.value)}
                                    className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:border-primary-blue"
                                  >
                                    {customStages.map(st => (
                                      <option key={st.id} value={st.id}>{st.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <button
                                        key={star}
                                        onClick={() => handleRatingChange(cand.id, star)}
                                        className={`p-0.5 ${cand.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                      >
                                        <Star size={13} className={cand.rating >= star ? 'fill-current' : ''} />
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-4 px-5 text-slate-500 text-xs font-normal">
                                  {cand.appliedAt}
                                </td>
                                <td className="py-4 px-5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedCandidate(cand);
                                        setActiveModalTab('overview');
                                      }}
                                      className="btn btn-primary btn-sm text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                                    >
                                      Ver Detalhes
                                    </button>
                                    <button
                                      onClick={() => {
                                        startChatWith({
                                          name: cand.name,
                                          email: cand.email || 'aluno@ivaiconecta.com.br',
                                          role: 'aluno',
                                          avatar: cand.avatar
                                        }, `Processo Seletivo: ${currentJob?.title || 'Vaga'}`);
                                      }}
                                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary-blue border border-blue-300 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800 transition-colors cursor-pointer"
                                      title="Abrir Chat no Ivaí Conecta"
                                    >
                                      <MessageSquare size={13} />
                                    </button>
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
              )
        )}

              {/* ═════════════════════════════════════════════════════════════════
            TAB 2: LISTA E GESTÃO DE TODAS AS VAGAS DA EMPRESA (MINHAS VAGAS)
        ═════════════════════════════════════════════════════════════════ */}
              {activeTab === 'jobs_list' && (
                <div className="space-y-6 animate-in fade-in duration-200">

                  {/* Header & Quick Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-primary-blue dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase size={13} /> Painel de Recrutamento
                        </span>
                        <span className="bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                          {filteredCompanyJobs.length} de {allCompanyJobs.length} {allCompanyJobs.length === 1 ? 'vaga cadastrada' : 'vagas cadastradas'}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Minhas Vagas &amp; Processos Seletivos
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Gerencie o ciclo de vida dos processos seletivos e acompanhe a distribuição de candidatos.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* View Mode Switcher */}
                      <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl flex items-center border border-gray-200 dark:border-slate-700 shadow-2xs">
                        <button
                          onClick={() => setJobListViewMode('grid')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${jobListViewMode === 'grid'
                              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          title="Visualização em Grade / Cards"
                        >
                          <LayoutGrid size={13} /> Grade
                        </button>
                        <button
                          onClick={() => setJobListViewMode('table')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${jobListViewMode === 'table'
                              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          title="Visualização em Tabela Gerencial"
                        >
                          <ListFilter size={13} /> Tabela
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Toolbar */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar por cargo, skills, cidade..."
                          value={jobListSearch}
                          onChange={e => setJobListSearch(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-medium outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        {jobListSearch && (
                          <button onClick={() => setJobListSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Modality Filter */}
                      <div className="relative">
                        <select
                          value={jobListModalityFilter}
                          onChange={e => setJobListModalityFilter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="todos">Todas as Modalidades</option>
                          <option value="Presencial">Presencial</option>
                          <option value="Híbrido">Híbrido</option>
                          <option value="Remoto">100% Remoto</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Type Filter */}
                      <div className="relative">
                        <select
                          value={jobListTypeFilter}
                          onChange={e => setJobListTypeFilter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="todos">Todos os Tipos de Contrato</option>
                          <option value="Tempo Integral">Tempo Integral (CLT)</option>
                          <option value="Estágio">Estágio Remunerado</option>
                          <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                          <option value="Prestador de Serviço">Prestador de Serviço (PJ)</option>
                          <option value="Meio Período">Meio Período</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Sort */}
                      <div className="relative">
                        <select
                          value={jobListSort}
                          onChange={e => setJobListSort(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="recent">Mais Recentes Primeiro</option>
                          <option value="applicants_desc">Mais Candidaturas</option>
                          <option value="title_asc">Título do Cargo (A-Z)</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Status Chips with Live Counters */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-400 text-[11px] uppercase tracking-wider mr-1">Status:</span>
                        {[
                          { id: 'todos', label: 'Todas as Vagas', count: jobListStats.total },
                          { id: 'Ativa', label: 'Ativas', count: jobListStats.active, dot: 'bg-emerald-500' },
                          { id: 'Encerrada', label: 'Pausadas / Encerradas', count: jobListStats.paused, dot: 'bg-slate-400' },
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => setJobListStatusFilter(st.id)}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${jobListStatusFilter === st.id
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                              }`}
                          >
                            {st.dot && <span className={`w-2 h-2 rounded-full ${st.dot}`} />}
                            <span>{st.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${jobListStatusFilter === st.id
                                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                              }`}>
                              {st.count}
                            </span>
                          </button>
                        ))}
                      </div>

                      {(jobListSearch || jobListModalityFilter !== 'todos' || jobListTypeFilter !== 'todos' || jobListStatusFilter !== 'todos') && (
                        <button
                          onClick={() => {
                            setJobListSearch('');
                            setJobListStatusFilter('todos');
                            setJobListModalityFilter('todos');
                            setJobListTypeFilter('todos');
                            setJobListSort('recent');
                          }}
                          className="text-xs text-primary-blue hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <RotateCcw size={12} /> Limpar Filtros
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Content View (Grid vs Table) ── */}
                  {filteredCompanyJobs.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center space-y-3 shadow-xs">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center shadow-inner">
                        <Filter size={24} />
                      </div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">Nenhuma vaga encontrada</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                        Nenhum processo seletivo da sua empresa corresponde aos filtros ativos. Tente ajustar os termos de pesquisa ou publicar uma nova oportunidade.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            setJobListSearch('');
                            setJobListStatusFilter('todos');
                            setJobListModalityFilter('todos');
                            setJobListTypeFilter('todos');
                            setJobListSort('recent');
                          }}
                          className="btn btn-outline btn-sm font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <RotateCcw size={13} /> Limpar Filtros
                        </button>
                        <button
                          onClick={() => setShowNewJobModal(true)}
                          className="btn btn-primary btn-sm font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-brand-sm"
                        >
                          <Plus size={13} /> Publicar Nova Vaga
                        </button>
                      </div>
                    </div>
                  ) : jobListViewMode === 'grid' ? (
                    /* ── GRID / CARD VIEW ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                      {filteredCompanyJobs.map(job => {
                        const candidates = getJobCandidates(job.id) || [];
                        const isActive = job.status === 'Ativa';
                        const skillsArray = Array.isArray(job.requiredSkills)
                          ? job.requiredSkills
                          : (typeof job.requiredSkills === 'string' ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);
                        const visibleSkills = skillsArray.slice(0, 3);
                        const extraSkillsCount = Math.max(0, skillsArray.length - 3);

                        const triagemCount = candidates.filter(c => c.stage === 'triagem').length;
                        const desafioCount = candidates.filter(c => c.stage === 'desafio' || c.stage === 'analise').length;
                        const entrevistaCount = candidates.filter(c => c.stage === 'entrevista').length;
                        const aprovadosCount = candidates.filter(c => c.stage === 'aprovado').length;
                        const talentPoolCount = candidates.filter(c => c.stage === 'reprovado' || c.stage === 'banco_talentos').length;

                        return (
                          <div
                            key={job.id}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-primary-blue/50 dark:hover:border-blue-500/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative"
                          >
                            {/* Top Bar: Status + City + Modality */}
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border shrink-0 ${isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {job.status}
                              </span>

                              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium truncate">
                                <span className="flex items-center gap-1 text-primary-blue dark:text-blue-400 font-semibold truncate">
                                  <MapPin size={12} className="shrink-0" /> {job.city || 'Ivaiporã'}
                                </span>
                                <span>·</span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-slate-300 shrink-0 text-[11px]">
                                  {job.modality || 'Presencial'}
                                </span>
                              </div>
                            </div>

                            {/* Title, Contract & Salary */}
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h3
                                  onClick={() => {
                                    setSelectedJobId(job.id);
                                    handleTabChange('pipeline');
                                  }}
                                  className="text-base font-bold text-gray-900 dark:text-white hover:text-primary-blue dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug line-clamp-1"
                                  title={job.title}
                                >
                                  {job.title}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md shrink-0">
                                  {job.type || 'Tempo Integral'}
                                </span>
                              </div>

                              {job.salary && (
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <DollarSign size={13} /> {job.salary}
                                </div>
                              )}

                              {job.description && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {job.description}
                                </p>
                              )}
                            </div>

                            {/* Required Skills Badges */}
                            {skillsArray.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {visibleSkills.map(skill => (
                                  <span
                                    key={skill}
                                    className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {extraSkillsCount > 0 && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-medium">
                                    +{extraSkillsCount}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Mini Pipeline Funnel Tracker */}
                            <div
                              onClick={() => {
                                setSelectedJobId(job.id);
                                handleTabChange('pipeline');
                              }}
                              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-3 space-y-2 cursor-pointer hover:border-primary-blue/40 transition-colors"
                              title="Clique para abrir o quadro Kanban desta vaga"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1.5 overflow-hidden">
                                    {candidates.slice(0, 3).map((c, i) => (
                                      <img
                                        key={c.id || i}
                                        src={c.avatar}
                                        alt={c.name}
                                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover bg-white dark:bg-slate-800"
                                      />
                                    ))}
                                    {candidates.length === 0 && (
                                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                                        0
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                                    {candidates.length} {candidates.length === 1 ? 'candidato' : 'candidatos'}
                                  </span>
                                </div>

                                {triagemCount > 0 ? (
                                  <span className="text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                                    <Sparkles size={11} /> {triagemCount} novos para avaliar
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-primary-blue dark:text-blue-400 flex items-center gap-0.5">
                                    Ver Funil <ChevronRight size={12} />
                                  </span>
                                )}
                              </div>

                              {/* Multi-segment Funnel Bar */}
                              {candidates.length > 0 ? (
                                <div className="space-y-1.5">
                                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                    {triagemCount > 0 && (
                                      <div style={{ width: `${(triagemCount / candidates.length) * 100}%` }} className="bg-blue-500 h-full" title={`Triagem: ${triagemCount}`} />
                                    )}
                                    {desafioCount > 0 && (
                                      <div style={{ width: `${(desafioCount / candidates.length) * 100}%` }} className="bg-amber-500 h-full" title={`Desafio / Análise: ${desafioCount}`} />
                                    )}
                                    {entrevistaCount > 0 && (
                                      <div style={{ width: `${(entrevistaCount / candidates.length) * 100}%` }} className="bg-purple-500 h-full" title={`Entrevista: ${entrevistaCount}`} />
                                    )}
                                    {aprovadosCount > 0 && (
                                      <div style={{ width: `${(aprovadosCount / candidates.length) * 100}%` }} className="bg-emerald-500 h-full" title={`Aprovados: ${aprovadosCount}`} />
                                    )}
                                    {talentPoolCount > 0 && (
                                      <div style={{ width: `${(talentPoolCount / candidates.length) * 100}%` }} className="bg-slate-400 h-full" title={`Banco: ${talentPoolCount}`} />
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-slate-400 flex-wrap gap-1">
                                    <span>Triagem ({triagemCount})</span>
                                    <span>Desafio ({desafioCount})</span>
                                    <span>Entrevista ({entrevistaCount})</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Aprovados ({aprovadosCount})</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] text-gray-400 italic">
                                  Nenhum candidato inscrito até o momento
                                </div>
                              )}
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                              {/* Primary CTA */}
                              <button
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  handleTabChange('pipeline');
                                }}
                                className="btn btn-primary btn-sm text-xs font-bold px-3 py-2 flex items-center gap-1.5 rounded-xl cursor-pointer shadow-brand-sm hover:shadow-brand-md transition-all"
                              >
                                <Layers size={14} /> Abrir Funil ({candidates.length})
                              </button>

                              {/* Tool Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingJob(job)}
                                  className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="Editar Dados da Vaga"
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  onClick={() => handleDuplicateJob(job.id)}
                                  className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="Duplicar Processo Seletivo"
                                >
                                  <Copy size={14} />
                                </button>

                                <button
                                  onClick={() => handleShareJob(job)}
                                  className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="Copiar Link de Divulgação"
                                >
                                  <Share2 size={14} />
                                </button>

                                <button
                                  onClick={() => handleToggleJobStatus(job.id, job.status)}
                                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${isActive
                                      ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
                                    }`}
                                  title={isActive ? 'Pausar / Encerrar Vaga' : 'Reabrir Vaga'}
                                >
                                  {isActive ? <Clock size={14} /> : <RotateCcw size={14} />}
                                </button>

                                <button
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
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
                  ) : (
                    /* ── DENSE TABLE VIEW ── */
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              <th className="py-3.5 px-4">Cargo &amp; Local</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4">Contrato &amp; Salário</th>
                              <th className="py-3.5 px-4">Inscritos</th>
                              <th className="py-3.5 px-4">Distribuição no Funil</th>
                              <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs">
                            {filteredCompanyJobs.map(job => {
                              const candidates = getJobCandidates(job.id) || [];
                              const isActive = job.status === 'Ativa';
                              const triagemCount = candidates.filter(c => c.stage === 'triagem').length;
                              const entrevistaCount = candidates.filter(c => c.stage === 'entrevista').length;
                              const aprovadosCount = candidates.filter(c => c.stage === 'aprovado').length;

                              return (
                                <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                  {/* Cargo & Local */}
                                  <td className="py-3.5 px-4">
                                    <div className="space-y-0.5">
                                      <div
                                        onClick={() => {
                                          setSelectedJobId(job.id);
                                          handleTabChange('pipeline');
                                        }}
                                        className="font-bold text-gray-900 dark:text-white hover:text-primary-blue dark:hover:text-blue-400 cursor-pointer transition-colors text-sm"
                                      >
                                        {job.title}
                                      </div>
                                      <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <span className="flex items-center gap-0.5 text-primary-blue dark:text-blue-400">
                                          <MapPin size={11} /> {job.city || 'Ivaiporã'}
                                        </span>
                                        <span>·</span>
                                        <span>{job.modality || 'Presencial'}</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1.5 border ${isActive
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                      {job.status}
                                    </span>
                                  </td>

                                  {/* Contrato & Salário */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="font-semibold text-gray-800 dark:text-slate-200">{job.type || 'CLT'}</div>
                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                      {job.salary || 'A combinar'}
                                    </div>
                                  </td>

                                  {/* Inscritos */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                                        {candidates.length}
                                      </span>
                                      {triagemCount > 0 && (
                                        <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-md">
                                          +{triagemCount} novos
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Distribuição no Funil */}
                                  <td className="py-3.5 px-4 max-w-[200px]">
                                    {candidates.length > 0 ? (
                                      <div className="space-y-1">
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                          <div style={{ width: `${(triagemCount / candidates.length) * 100}%` }} className="bg-blue-500 h-full" />
                                          <div style={{ width: `${(entrevistaCount / candidates.length) * 100}%` }} className="bg-purple-500 h-full" />
                                          <div style={{ width: `${(aprovadosCount / candidates.length) * 100}%` }} className="bg-emerald-500 h-full" />
                                        </div>
                                        <div className="text-[10px] text-gray-400 flex items-center justify-between">
                                          <span>Tri: {triagemCount}</span>
                                          <span>Ent: {entrevistaCount}</span>
                                          <span className="text-emerald-500 font-bold">Apr: {aprovadosCount}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-gray-400 italic">Sem inscritos</span>
                                    )}
                                  </td>

                                  {/* Ações Rápidas */}
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => {
                                          setSelectedJobId(job.id);
                                          handleTabChange('pipeline');
                                        }}
                                        className="btn btn-primary btn-sm text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Abrir Funil Kanban"
                                      >
                                        <Layers size={13} /> Funil
                                      </button>

                                      <button
                                        onClick={() => setEditingJob(job)}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        title="Editar Vaga"
                                      >
                                        <Edit3 size={13} />
                                      </button>

                                      <button
                                        onClick={() => handleDuplicateJob(job.id)}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        title="Duplicar Vaga"
                                      >
                                        <Copy size={13} />
                                      </button>

                                      <button
                                        onClick={() => handleShareJob(job)}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        title="Copiar Link"
                                      >
                                        <Share2 size={13} />
                                      </button>

                                      <button
                                        onClick={() => handleToggleJobStatus(job.id, job.status)}
                                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isActive
                                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
                                          }`}
                                        title={isActive ? 'Encerrar Vaga' : 'Reabrir Vaga'}
                                      >
                                        {isActive ? <Clock size={13} /> : <RotateCcw size={13} />}
                                      </button>

                                      <button
                                        onClick={() => handleDeleteJob(job.id)}
                                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
                                        title="Excluir Vaga"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════════
            TAB: HISTÓRICO DE ENTREVISTAS & LIGAÇÕES
        ═════════════════════════════════════════════════════════════════ */}
              {activeTab === 'interview_history' && (
                <div className="space-y-6">

                  {/* Header & Quick Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary-blue dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <History size={13} /> Gestão de Entrevistas
                        </span>
                        <span className="bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          {filteredInterviews.length} de {allInterviewsList.length} entrevistas
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Histórico de Entrevistas &amp; Ligações
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Acompanhe todas as reuniões realizadas, em andamento e agendadas com pareceres, notas e decisões.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* View Mode Toggle */}
                      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-gray-200 dark:border-slate-700">
                        <button
                          onClick={() => setHistoryViewMode('grid')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${historyViewMode === 'grid'
                              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          title="Visualização em Grade / Cards"
                        >
                          <LayoutGrid size={13} /> Cards
                        </button>
                        <button
                          onClick={() => setHistoryViewMode('table')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${historyViewMode === 'table'
                              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          title="Visualização em Tabela Detalhada"
                        >
                          <ListFilter size={13} /> Tabela
                        </button>
                      </div>

                      {/* Export CSV */}
                      <button
                        onClick={() => {
                          const csvContent = "data:text/csv;charset=utf-8," +
                            ["Nome,Curso,Instituição,Vaga,Data,Horário,Formato,Status,Score,Notas"]
                              .concat(filteredInterviews.map(c => {
                                const status = getInterviewStatusInfo(c);
                                return `"${c.name}","${c.course}","${c.institution}","${c.jobTitle}","${c.interview?.date || ''}","${c.interview?.time || ''}","${c.interview?.format || ''}","${status?.label || ''}","${c.matchScore}%","${(c.notes || '').replace(/"/g, '""')}"`;
                              }))
                              .join("\n");
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `historico_entrevistas_${new Date().toISOString().slice(0, 10)}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          showToast('Relatório de entrevistas exportado com sucesso!');
                        }}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Download size={14} /> Exportar CSV
                      </button>
                    </div>
                  </div>

                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Total de Entrevistas</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                          <History size={16} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{interviewStats.total}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Em todas as vagas da empresa</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Concluídas / Aprovadas</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{interviewStats.completed}</div>
                      <div className="text-[11px] text-emerald-600/80 font-medium mt-0.5">{interviewStats.passRate}% taxa de aprovação</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-400 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500">Banco de Talentos</span>
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          <Users size={16} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-2">{interviewStats.talentPool}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Disponíveis para futuras oportunidades</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-primary-blue dark:text-blue-400">Agendadas / Em Aberto</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center">
                          <Calendar size={16} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-primary-blue dark:text-blue-400 mt-2">
                        {interviewStats.scheduled + interviewStats.inProgress}
                      </div>
                      <div className="text-[11px] text-blue-500/80 font-medium mt-0.5">
                        {interviewStats.inProgress > 0 ? `${interviewStats.inProgress} em andamento no momento` : 'Próximas nos calendários'}
                      </div>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar candidato, curso, notas..."
                          value={historySearch}
                          onChange={e => setHistorySearch(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-medium outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        {historySearch && (
                          <button onClick={() => setHistorySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Job Filter */}
                      <div className="relative">
                        <select
                          value={historyJobFilter}
                          onChange={e => setHistoryJobFilter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="todos">Todas as Vagas ({allCompanyJobs.length})</option>
                          {allCompanyJobs.map(j => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Format Filter */}
                      <div className="relative">
                        <select
                          value={historyFormatFilter}
                          onChange={e => setHistoryFormatFilter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="todos">Todos os Formatos</option>
                          <option value="Google Meet">Google Meet</option>
                          <option value="Teams">Microsoft Teams</option>
                          <option value="Presencial">Presencial na Empresa</option>
                          <option value="Telefone">Ligação Telefônica</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Sort */}
                      <div className="relative">
                        <select
                          value={historySort}
                          onChange={e => setHistorySort(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="recent">Mais Recentes Primeiro</option>
                          <option value="date_asc">Mais Antigas / Próximas</option>
                          <option value="match_desc">Maior Match Score</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Status Chips with Live Counters */}
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                      <span className="font-semibold text-gray-400 text-[11px] uppercase tracking-wider mr-1">Status:</span>
                      {[
                        { id: 'todos', label: 'Todas', count: interviewStats.total },
                        { id: 'concluida', label: 'Concluídas / Aprovadas', count: interviewStats.completed, dot: 'bg-emerald-500' },
                        { id: 'banco_talentos', label: 'Banco de Talentos', count: interviewStats.talentPool, dot: 'bg-slate-400' },
                        { id: 'andamento', label: 'Em Andamento', count: interviewStats.inProgress, dot: 'bg-blue-500 animate-pulse' },
                        { id: 'agendada', label: 'Agendadas', count: interviewStats.scheduled, dot: 'bg-purple-500' },
                      ].map(st => (
                        <button
                          key={st.id}
                          onClick={() => setHistoryStatusFilter(st.id)}
                          className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${historyStatusFilter === st.id
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                        >
                          {st.dot && <span className={`w-2 h-2 rounded-full ${st.dot}`} />}
                          <span>{st.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${historyStatusFilter === st.id
                              ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                            }`}>
                            {st.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interviews List / Grid / Empty State */}
                  {filteredInterviews.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
                        <History size={24} />
                      </div>
                      <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white">
                        Nenhuma entrevista encontrada
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                        Nenhum registro de entrevista corresponde aos filtros ou busca selecionados.
                      </p>
                      <button
                        onClick={() => {
                          setHistorySearch('');
                          setHistoryJobFilter('todos');
                          setHistoryStatusFilter('todos');
                          setHistoryFormatFilter('todos');
                        }}
                        className="btn btn-outline btn-sm font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  ) : historyViewMode === 'grid' ? (

                    /* ─── GRID / CARDS VIEW ─── */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                      {filteredInterviews.map((cand) => {
                        const status = getInterviewStatusInfo(cand);
                        const StatusIcon = status?.icon || Calendar;
                        const isMeet = (cand.interview?.format || 'Google Meet').includes('Meet');
                        const isTeams = (cand.interview?.format || '').includes('Teams');
                        const isPhone = (cand.interview?.format || '').includes('Telefone');

                        return (
                          <div
                            key={`${cand.jobId}-${cand.id}`}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-primary-blue/50 dark:hover:border-blue-500/50 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group space-y-4"
                          >
                            {/* Top Job Tag & Outcome Status Pill */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold truncate max-w-[190px]">
                                <Briefcase size={12} className="text-primary-blue shrink-0" />
                                <span className="truncate">{cand.jobTitle}</span>
                              </div>

                              {status && (
                                <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border shrink-0 ${status.badgeColor}`}>
                                  <StatusIcon size={12} className={status.pulse ? 'animate-pulse' : ''} />
                                  <span>{status.label}</span>
                                </span>
                              )}
                            </div>

                            {/* Candidate Profile Header */}
                            <div className="flex items-start gap-3.5">
                              <div className="relative shrink-0">
                                <img
                                  src={cand.avatar}
                                  alt={cand.name}
                                  className="w-13 h-13 rounded-2xl object-cover border-2 border-primary-blue/20 bg-white shadow-2xs"
                                />
                                {cand.isVerifiedStudent && (
                                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white dark:ring-slate-900" title="Selo de Validação IFPR">
                                    <ShieldCheck size={11} strokeWidth={3} />
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4
                                    onClick={() => {
                                      setSelectedCandidate(cand);
                                      setActiveModalTab('overview');
                                    }}
                                    className="font-bold text-sm text-gray-900 dark:text-white hover:text-primary-blue dark:hover:text-blue-400 cursor-pointer transition-colors truncate"
                                    title={cand.name}
                                  >
                                    {cand.name}
                                  </h4>
                                  <span className="font-black text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                                    {cand.matchScore}% Match
                                  </span>
                                </div>

                                <div className="text-xs text-primary-blue dark:text-blue-400 font-semibold truncate mt-0.5">
                                  {cand.course}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                                  {cand.institution} · {cand.city}
                                </div>
                              </div>
                            </div>

                            {/* Meeting Box Callout */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                                  <Calendar size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
                                  <span>{cand.interview?.date ? cand.interview.date.split('-').reverse().join('/') : 'Data a definir'}</span>
                                  <span className="text-gray-400 font-normal">às</span>
                                  <span className="text-purple-700 dark:text-purple-300 font-black">{cand.interview?.time || '--:--'}</span>
                                </div>

                                {/* Format Badge */}
                                <div className="flex items-center gap-1 text-[11px] font-bold">
                                  {isMeet ? (
                                    <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Video size={11} /> Meet
                                    </span>
                                  ) : isTeams ? (
                                    <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Video size={11} /> Teams
                                    </span>
                                  ) : isPhone ? (
                                    <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Phone size={11} /> Telefone
                                    </span>
                                  ) : (
                                    <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <MapPin size={11} /> Presencial
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Notes Preview & Star Rating */}
                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      onClick={() => handleRatingChange(cand.id, star, cand.jobId)}
                                      className={`p-0.5 ${cand.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'} hover:scale-110 transition-transform cursor-pointer`}
                                      title={`Avaliar ${star} estrelas`}
                                    >
                                      <Star size={12} className={cand.rating >= star ? 'fill-current' : ''} />
                                    </button>
                                  ))}
                                </div>

                                <div className="text-[11px] text-gray-500 dark:text-slate-400 italic truncate max-w-[170px]" title={cand.notes || cand.interview?.notes || 'Sem anotações'}>
                                  {cand.notes || cand.interview?.notes ? `"${cand.notes || cand.interview?.notes}"` : 'Sem anotações'}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons Footer */}
                            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">

                              <div className="flex items-center gap-1.5">
                                {/* Video Room or Phone Call Button */}
                                {isMeet && (
                                  <button
                                    onClick={() => {
                                      window.open(cand.interview?.link || 'https://meet.google.com/new', '_blank');
                                      updateCandidateData(cand.jobId, cand.id, {
                                        interview: { ...cand.interview, roomCreated: true }
                                      });
                                      forceUpdate(prev => prev + 1);
                                    }}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-primary-blue dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                                    title="Abrir sala oficial da reunião"
                                  >
                                    <Video size={13} /> Sala
                                  </button>
                                )}

                                {isPhone && (
                                  <button
                                    onClick={() => {
                                      window.open(`tel:${cand.phone || '5543999001122'}`, '_self');
                                    }}
                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800"
                                    title="Iniciar chamada telefônica"
                                  >
                                    <PhoneCall size={13} /> Ligar
                                  </button>
                                )}

                                {/* Chat Button */}
                                <button
                                  onClick={() => {
                                    startChatWith({
                                      name: cand.name,
                                      email: cand.email || 'aluno@ivaiconecta.com.br',
                                      role: 'aluno',
                                      avatar: cand.avatar
                                    }, `Entrevista: ${cand.jobTitle}`);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Abrir chat direto"
                                >
                                  <MessageSquare size={13} /> Chat
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Conclude (Passar de Etapa) */}
                                <button
                                  onClick={() => handleInterviewConcluded(cand)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                  title="Aprovar na entrevista e avançar no funil"
                                >
                                  <Check size={12} strokeWidth={3} /> Concluir
                                </button>

                                {/* Finalize (Banco de Talentos) */}
                                <button
                                  onClick={() => handleInterviewFinalized(cand)}
                                  className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                  title="Finalizar e mover para Banco de Talentos"
                                >
                                  <X size={12} strokeWidth={3} /> Banco
                                </button>

                                {/* Open Drawer */}
                                <button
                                  onClick={() => {
                                    setSelectedCandidate(cand);
                                    setActiveModalTab('overview');
                                  }}
                                  className="p-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl transition-colors cursor-pointer"
                                  title="Ver ficha completa do candidato"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (

                    /* ─── TABLE / LIST VIEW ─── */
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              <th className="py-3 px-4">Candidato</th>
                              <th className="py-3 px-4">Vaga &amp; Cidade</th>
                              <th className="py-3 px-4">Agendamento</th>
                              <th className="py-3 px-4">Formato</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Avaliação &amp; Notas</th>
                              <th className="py-3 px-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs">
                            {filteredInterviews.map((cand) => {
                              const status = getInterviewStatusInfo(cand);
                              const StatusIcon = status?.icon || Calendar;
                              const isMeet = (cand.interview?.format || 'Google Meet').includes('Meet');
                              const isTeams = (cand.interview?.format || '').includes('Teams');
                              const isPhone = (cand.interview?.format || '').includes('Telefone');

                              return (
                                <tr key={`${cand.jobId}-${cand.id}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">

                                  {/* Candidato */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={cand.avatar}
                                        alt={cand.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700 bg-white shrink-0"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            onClick={() => {
                                              setSelectedCandidate(cand);
                                              setActiveModalTab('overview');
                                            }}
                                            className="font-bold text-gray-900 dark:text-white hover:text-primary-blue dark:hover:text-blue-400 cursor-pointer transition-colors"
                                          >
                                            {cand.name}
                                          </span>
                                          {cand.isVerifiedStudent && (
                                            <span className="text-emerald-500" title="Selo IFPR">
                                              <ShieldCheck size={13} />
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-gray-500 dark:text-slate-400">
                                          {cand.course} · {cand.institution}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Vaga */}
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-gray-800 dark:text-slate-200">{cand.jobTitle}</div>
                                    <div className="text-[11px] text-gray-400">{cand.city}</div>
                                  </td>

                                  {/* Agendamento */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      {cand.interview?.date ? cand.interview.date.split('-').reverse().join('/') : 'A definir'}
                                    </div>
                                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                                      {cand.interview?.time || '--:--'}
                                    </div>
                                  </td>

                                  {/* Formato */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300">
                                      {isMeet ? (
                                        <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                          <Video size={12} /> Meet
                                        </span>
                                      ) : isTeams ? (
                                        <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                          <Video size={12} /> Teams
                                        </span>
                                      ) : isPhone ? (
                                        <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                          <Phone size={12} /> Telefone
                                        </span>
                                      ) : (
                                        <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                          <MapPin size={12} /> Presencial
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    {status && (
                                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border ${status.badgeColor}`}>
                                        <StatusIcon size={12} className={status.pulse ? 'animate-pulse' : ''} />
                                        <span>{status.label}</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Avaliação & Notas */}
                                  <td className="py-3 px-4 max-w-[200px]">
                                    <div className="flex items-center gap-0.5 mb-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                          key={star}
                                          onClick={() => handleRatingChange(cand.id, star, cand.jobId)}
                                          className={`p-0.5 ${cand.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                        >
                                          <Star size={11} className={cand.rating >= star ? 'fill-current' : ''} />
                                        </button>
                                      ))}
                                    </div>
                                    <div className="text-[11px] text-gray-500 dark:text-slate-400 italic truncate" title={cand.notes || 'Sem anotações'}>
                                      {cand.notes ? `"${cand.notes}"` : 'Sem anotações'}
                                    </div>
                                  </td>

                                  {/* Ações */}
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isMeet && (
                                        <button
                                          onClick={() => {
                                            window.open(cand.interview?.link || 'https://meet.google.com/new', '_blank');
                                            updateCandidateData(cand.jobId, cand.id, {
                                              interview: { ...cand.interview, roomCreated: true }
                                            });
                                            forceUpdate(prev => prev + 1);
                                          }}
                                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-primary-blue dark:bg-blue-950/60 dark:text-blue-300 rounded-lg cursor-pointer"
                                          title="Abrir sala Meet"
                                        >
                                          <Video size={13} />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          startChatWith({
                                            name: cand.name,
                                            email: cand.email || 'aluno@ivaiconecta.com.br',
                                            role: 'aluno',
                                            avatar: cand.avatar
                                          }, `Entrevista: ${cand.jobTitle}`);
                                        }}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg cursor-pointer"
                                        title="Chat"
                                      >
                                        <MessageSquare size={13} />
                                      </button>

                                      <button
                                        onClick={() => handleInterviewConcluded(cand)}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1"
                                        title="Concluir / Passar etapa"
                                      >
                                        <Check size={11} strokeWidth={3} /> Concluir
                                      </button>

                                      <button
                                        onClick={() => handleInterviewFinalized(cand)}
                                        className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1"
                                        title="Finalizar / Banco de talentos"
                                      >
                                        <X size={11} strokeWidth={3} /> Banco
                                      </button>

                                      <button
                                        onClick={() => {
                                          setSelectedCandidate(cand);
                                          setActiveModalTab('overview');
                                        }}
                                        className="p-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg cursor-pointer"
                                        title="Ver Detalhes"
                                      >
                                        <Eye size={13} />
                                      </button>
                                    </div>
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════════
            TAB 4: CONFIGURAÇÕES DE ETAPAS DO PROCESSO SELETIVO POR VAGA (STUDIO ATS FULL-WIDTH)
        ═════════════════════════════════════════════════════════════════ */}
              {activeTab === 'stage_settings' && (
                <div className="w-full space-y-6 animate-fadeIn pb-12">
                  
                  {/* ── BARRA SUPERIOR DE CONTROLE & AÇÕES (FULL WIDTH) ── */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    
                    {/* Título e Seletor de Vaga */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                          <Workflow size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                              Editor de Etapas do Processo Seletivo
                            </h2>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {customStages.length} etapas
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            Configure e ordene o funil de contratação da sua empresa
                          </p>
                        </div>
                      </div>

                      {/* Dropdown de Vaga */}
                      <div className="sm:ml-auto flex items-center gap-2 max-w-md w-full sm:w-auto">
                        <span className="text-xs font-normal text-gray-500 dark:text-slate-400 whitespace-nowrap hidden md:inline">
                          Vaga Alvo:
                        </span>
                        <div className="relative flex-1 sm:w-72">
                          <select
                            value={selectedJobId}
                            onChange={e => setSelectedJobId(e.target.value === 'default' ? 'default' : (Number(e.target.value) || e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue truncate appearance-none"
                          >
                            {allCompanyJobs.length === 0 ? (
                              <option value="default">Modelo Padrão Global da Empresa</option>
                            ) : (
                              <>
                                <optgroup label="Vagas Ativas da Empresa">
                                  {allCompanyJobs.map(job => (
                                    <option key={job.id} value={job.id}>
                                      {job.title} — {job.city || 'Ivaiporã'}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Configuração Geral">
                                  <option value="default">Modelo Padrão Global (Novas Vagas)</option>
                                </optgroup>
                              </>
                            )}
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação Topo */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 border-t xl:border-t-0 pt-3 xl:pt-0 border-gray-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStages(SELECTION_STAGES);
                          showToast('Padrões da plataforma restaurados. Lembre-se de salvar!');
                        }}
                        className="btn btn-outline btn-sm text-xs font-medium rounded-xl flex items-center gap-1.5 px-3 py-2 cursor-pointer text-gray-600 dark:text-slate-300"
                        title="Restaurar etapas padrão do sistema"
                      >
                        <RotateCcw size={13} />
                        <span className="hidden sm:inline">Restaurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApplyCustomStagesToAllJobs}
                        className="btn btn-outline btn-sm text-xs font-medium rounded-xl flex items-center gap-1.5 px-3.5 py-2 cursor-pointer border-gray-300 dark:border-slate-700 hover:border-primary-blue text-gray-700 dark:text-slate-200"
                        title="Replicar esta mesma estrutura para todas as vagas da empresa"
                      >
                        <CheckSquare size={13} />
                        <span className="hidden sm:inline">Replicar em Todas</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveCustomStagesForJob}
                        className="btn btn-primary btn-sm text-xs font-medium rounded-xl flex items-center gap-2 px-4 py-2 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
                      >
                        <Save size={14} />
                        <span>Salvar Funil</span>
                      </button>
                    </div>

                  </div>

                  {/* ── LIVE STEPPER / MAPA VISUAL DO FUNIL (FULL WIDTH) ── */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Fluxo Visual do Candidato (Quadro Kanban)
                        </h3>
                      </div>
                      <span className="text-[11px] text-gray-400 hidden sm:inline">
                        Atualizado em tempo real conforme você edita
                      </span>
                    </div>

                    <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
                      <div className="flex items-center gap-2 min-w-max">
                        {customStages.map((stage, idx) => {
                          const style = getStageStyle(stage.id, stage.color);
                          return (
                            <div key={stage.id || idx} className="flex items-center gap-2">
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs ${style.badge || 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                                <span className={`w-4.5 h-4.5 rounded-full text-[10px] font-semibold flex items-center justify-center text-white ${style.dot || 'bg-primary-blue'}`}>
                                  {idx + 1}
                                </span>
                                <span className="truncate max-w-[150px]">{stage.name || `Etapa ${idx + 1}`}</span>
                              </div>
                              {idx < customStages.length - 1 && (
                                <ArrowRight size={13} className="text-gray-300 dark:text-slate-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── GRID PRINCIPAL DE 2 COLUNAS (SPLIT VIEW FULL WIDTH) ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* ═══ COLUNA ESQUERDA (SIDEBAR): MODELOS & SUGESTÕES ═══ */}
                    <div className="lg:col-span-4 xl:col-span-4 space-y-5">
                      
                      {/* Card de Modelos Rápidos */}
                      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" />
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                              Modelos Prontos de Funil
                            </h3>
                          </div>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            1 Clique
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          Escolha um modelo padrão da indústria para preencher automaticamente as etapas:
                        </p>

                        <div className="space-y-2.5">
                          {STAGE_TEMPLATES.map(tpl => (
                            <div
                              key={tpl.id}
                              className="group p-3.5 rounded-xl border border-gray-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 hover:border-primary-blue dark:hover:border-primary-blue hover:bg-blue-50/30 dark:hover:bg-blue-950/20 stage-card-fluid"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-primary-blue transition-colors">
                                    {tpl.name}
                                  </h4>
                                  <span className="text-[10px] text-gray-500 dark:text-slate-400 block mt-0.5 leading-snug">
                                    {tpl.description}
                                  </span>
                                </div>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 border border-gray-200 dark:border-slate-600">
                                  {tpl.badge.split('•')[0].trim()}
                                </span>
                              </div>

                              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 truncate max-w-[170px]">
                                  {tpl.stages.map(s => s.name).join(' → ')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomStages(tpl.stages);
                                    showToast(`Modelo "${tpl.name}" aplicado! Revise e clique em Salvar.`);
                                  }}
                                  className="text-[11px] font-semibold text-primary-blue hover:underline cursor-pointer flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                                >
                                  <CheckCircle2 size={12} /> Aplicar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card de Adição Rápida de Etapas */}
                      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
                        <div className="flex items-center gap-2">
                          <Plus size={15} className="text-primary-blue" />
                          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                            Adicionar Etapas Comuns
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          Clique para incluir novas fases imediatamente ao seu processo:
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {COMMON_STAGE_SUGGESTIONS.map((item, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleAddPredefinedStage(item)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-gray-700 dark:text-slate-300 hover:text-primary-blue dark:hover:text-blue-300 border border-gray-200 dark:border-slate-700 hover:border-primary-blue/50 rounded-xl text-xs font-normal cursor-pointer shadow-2xs group stage-chip-fluid"
                            >
                              <Plus size={12} className="text-gray-400 group-hover:text-primary-blue group-hover:scale-110 transition-transform" />
                              <span>{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Card de Clonar de Outra Vaga */}
                      {allCompanyJobs.length > 1 && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                          <div className="flex items-center gap-2">
                            <Copy size={15} className="text-purple-600 dark:text-purple-400" />
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                              Importar de Outra Vaga
                            </h3>
                          </div>
                          <div className="relative">
                            <select
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) {
                                  handleCopyStagesFromAnotherJob(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-normal text-gray-700 dark:text-slate-300 outline-none cursor-pointer hover:border-primary-blue transition-colors truncate appearance-none"
                            >
                              <option value="" disabled>Selecione uma vaga para copiar...</option>
                              {allCompanyJobs
                                .filter(j => j.id !== currentJob?.id)
                                .map(j => (
                                  <option key={j.id} value={j.id}>
                                    Copiar de: {j.title}
                                  </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                          </div>
                        </div>
                      )}

                    </div>

                    {/* ═══ COLUNA DIREITA (EDITOR PRINCIPAL DAS ETAPAS) ═══ */}
                    <div className="lg:col-span-8 xl:col-span-8 space-y-4">
                      
                      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                        
                        {/* Header da Lista de Etapas */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Layers size={16} className="text-primary-blue" />
                              Sequência do Processo ({customStages.length} Etapas)
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                              Arraste os cards para reorganizar a ordem, ou edite nomes, objetivos e cores
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddCustomStage}
                            className="btn btn-primary btn-sm text-xs font-medium rounded-xl flex items-center gap-1.5 px-3 py-1.5 shadow-2xs cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
                          >
                            <Plus size={14} /> Adicionar Etapa
                          </button>
                        </div>

                        {/* Lista de Cards de Etapas com Suporte a Drag and Drop (Arrastar e Soltar) */}
                        <div className="space-y-3">
                          {customStages.map((stage, idx) => {
                            const currentStyle = getStageStyle(stage.id, stage.color);
                            const isBeingDragged = draggedStageIdx === idx;
                            const isDragTarget = dragOverStageIdx === idx && draggedStageIdx !== idx;

                            return (
                              <div
                                key={stage.id || idx}
                                draggable={true}
                                onDragStart={(e) => handleStageCardDragStart(e, idx)}
                                onDragOver={(e) => handleStageCardDragOver(e, idx)}
                                onDragLeave={handleStageCardDragLeave}
                                onDragEnd={handleStageCardDragEnd}
                                onDrop={(e) => handleStageCardDrop(e, idx)}
                                className={`group p-4 rounded-xl border shadow-2xs space-y-3 stage-card-fluid animate-smooth-in transition-all ${
                                  isBeingDragged
                                    ? 'stage-card-dragging border-primary-blue bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-primary-blue/50'
                                    : isDragTarget
                                      ? 'stage-card-dragover border-primary-blue ring-2 ring-primary-blue/70'
                                      : 'border-gray-200 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/40 hover:border-primary-blue/60 dark:hover:border-primary-blue/60 hover:bg-white dark:hover:bg-slate-800'
                                }`}
                              >
                                {/* Linha 1: Alça de Arraste, Posição, Reordenação, Título e Ações */}
                                <div className="flex items-center justify-between gap-3">
                                  
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    {/* Alça de Arraste (Drag Handle) */}
                                    <div
                                      className="p-1 -ml-1 text-gray-400 hover:text-primary-blue hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg cursor-grab active:cursor-grabbing transition-colors shrink-0 flex items-center justify-center select-none"
                                      title="Clique e arraste para reordenar a etapa"
                                    >
                                      <GripVertical size={16} />
                                    </div>

                                    {/* Botões Reordenação Up/Down (Alternativa por Clique) */}
                                    <div 
                                      className="flex items-center bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-0.5 shrink-0 shadow-2xs"
                                      onDragStart={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleMoveStageUp(idx)}
                                        disabled={idx === 0}
                                        title="Mover etapa para cima"
                                        className={`p-1 rounded transition-colors cursor-pointer ${
                                          idx === 0
                                            ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                                            : 'text-gray-600 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-primary-blue active:scale-90'
                                        }`}
                                      >
                                        <ArrowUp size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveStageDown(idx)}
                                        disabled={idx === customStages.length - 1}
                                        title="Mover etapa para baixo"
                                        className={`p-1 rounded transition-colors cursor-pointer ${
                                          idx === customStages.length - 1
                                            ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                                            : 'text-gray-600 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-primary-blue active:scale-90'
                                        }`}
                                      >
                                        <ArrowDown size={13} />
                                      </button>
                                    </div>

                                    {/* Número da Etapa */}
                                    <span className={`w-6.5 h-6.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${currentStyle.dot || 'bg-primary-blue'}`}>
                                      {String(idx + 1).padStart(2, '0')}
                                    </span>

                                    {/* Nome da Etapa */}
                                    <input
                                      type="text"
                                      value={stage.name}
                                      maxLength={40}
                                      draggable={false}
                                      onDragStart={(e) => e.stopPropagation()}
                                      onChange={e => {
                                        const updated = [...customStages];
                                        updated[idx].name = e.target.value;
                                        setCustomStages(updated);
                                      }}
                                      placeholder="Nome da etapa (Ex: Entrevista com Gestor)..."
                                      className="font-medium text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/30 transition-all flex-1 min-w-[120px]"
                                    />
                                  </div>

                                  {/* Botões Duplicar e Excluir */}
                                  <div 
                                    className="flex items-center gap-1 shrink-0"
                                    onDragStart={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateStage(idx)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors active:scale-90 cursor-pointer"
                                      title="Duplicar esta etapa"
                                    >
                                      <Copy size={14} />
                                    </button>

                                    {customStages.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCustomStage(idx)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors active:scale-90 cursor-pointer"
                                        title="Remover esta etapa"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>

                                </div>

                                {/* Linha 2: Descrição e Seletor de Cores na mesma linha em telas médias/largas */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 border-t border-gray-100 dark:border-slate-700/40">
                                  
                                  {/* Descrição */}
                                  <div className="md:col-span-7 lg:col-span-8">
                                    <input
                                      type="text"
                                      value={stage.description || ''}
                                      maxLength={120}
                                      draggable={false}
                                      onDragStart={(e) => e.stopPropagation()}
                                      onChange={e => {
                                        const updated = [...customStages];
                                        updated[idx].description = e.target.value;
                                        setCustomStages(updated);
                                      }}
                                      placeholder="Objetivo da etapa (Ex: Avaliar aderência técnica e testes práticos)..."
                                      className="w-full text-xs font-normal bg-white dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-slate-300 outline-none focus:border-primary-blue transition-all"
                                    />
                                  </div>

                                  {/* Cores */}
                                  <div 
                                    className="md:col-span-5 lg:col-span-4 flex items-center justify-start md:justify-end gap-1.5"
                                    onDragStart={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[10px] font-normal text-gray-400 hidden xl:inline">Cor:</span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {STAGE_COLOR_OPTIONS.map(colorOpt => {
                                        const isSelected = (stage.color || 'blue') === colorOpt.key;
                                        return (
                                          <button
                                            key={colorOpt.key}
                                            type="button"
                                            onClick={() => {
                                              const updated = [...customStages];
                                              updated[idx].color = colorOpt.key;
                                              setCustomStages(updated);
                                            }}
                                            title={colorOpt.label}
                                            className={`w-5 h-5 rounded-full cursor-pointer flex items-center justify-center ${colorOpt.bgClass} stage-color-dot-fluid ${
                                              isSelected
                                                ? 'ring-2 ring-offset-1 ring-primary-blue dark:ring-offset-slate-800 scale-110'
                                                : 'opacity-60 hover:opacity-100'
                                            }`}
                                          >
                                            {isSelected && <Check size={10} className="text-white stroke-[3]" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                </div>

                              </div>
                            );
                          })}
                        </div>

                        {/* Rodapé Interno com Ação Principal */}
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <span className="text-xs text-gray-400">
                            {selectedJobId === 'default' || !currentJob
                              ? 'Salvando como Modelo Global para novas vagas'
                              : `Salvando exclusivamente para: "${currentJob?.title}"`}
                          </span>

                          <button
                            type="button"
                            onClick={handleSaveCustomStagesForJob}
                            className="w-full sm:w-auto btn btn-primary px-6 py-2.5 text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
                          >
                            <Save size={15} />
                            <span>Salvar Configuração de Etapas</span>
                          </button>
                        </div>

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
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={18} className="text-primary-blue" /> Taxa de Conversão do Funil
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-medium mb-1">
                            <span>Triagem &rarr; Entrevista</span>
                            <span className="text-primary-blue font-semibold">45%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary-blue h-full rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-medium mb-1">
                            <span>Entrevista &rarr; Desafio</span>
                            <span className="text-indigo-600 font-semibold">60%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-medium mb-1">
                            <span>Desafio &rarr; Aprovado</span>
                            <span className="text-emerald-600 font-semibold">75%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap size={18} className="text-emerald-500" /> Origem dos Talentos Inscritos
                      </h3>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                          <span className="font-medium text-slate-800 dark:text-slate-200">IFPR Campus Ivaiporã</span>
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">58% dos inscritos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                          <span className="font-medium text-slate-800 dark:text-slate-200">Univale Ivaiporã</span>
                          <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold">27% dos inscritos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                          <span className="font-medium text-slate-800 dark:text-slate-200">UENP / Outras</span>
                          <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-semibold">15% dos inscritos</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" /> Tecnologias com Mais Afinidade
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {['React (95%)', 'JavaScript (92%)', 'Tailwind (90%)', 'Git (88%)', 'Python (82%)', 'SQL (80%)', 'Figma (78%)'].map(item => (
                          <span key={item} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
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
          MODAL / DRAWER: DETALHES COMPLETOS DO CANDIDATO
      ═════════════════════════════════════════════════════════════════ */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">

              {/* Modal Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/70 border-b border-gray-200 dark:border-slate-700 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedCandidate.avatar}
                    alt={selectedCandidate.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue/30 shadow-md bg-white shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedCandidate.name}
                      </h3>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 rounded-full">
                        {selectedCandidate.matchScore}% Match
                      </span>
                    </div>
                    <div className="text-xs font-medium text-primary-blue dark:text-blue-400 mt-0.5">
                      {selectedCandidate.course} · {selectedCandidate.institution}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-normal">
                      {selectedCandidate.city} · Inscrito em {selectedCandidate.appliedAt}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <button
                        onClick={() => {
                          startChatWith({
                            name: selectedCandidate.name,
                            email: selectedCandidate.email || 'aluno@ivaiconecta.com.br',
                            role: 'aluno',
                            avatar: selectedCandidate.avatar
                          }, `Processo Seletivo: ${currentJob?.title || 'Vaga'}`);
                        }}
                        className="btn btn-primary btn-sm text-xs font-medium flex items-center gap-1.5 cursor-pointer rounded-xl"
                      >
                        <MessageSquare size={13} /> Chat com o Candidato
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Stage Progression Stepper Bar */}
              <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800">
                <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400 block mb-3">
                  Progresso no Processo Seletivo:
                </label>
                <div className="flex items-start justify-between relative">
                  {customStages.map((stage, idx) => {
                    const currentStageIdx = customStages.findIndex(s => s.id === selectedCandidate.stage);
                    const isPast = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div key={stage.id} className="flex-1 flex flex-col items-center relative">
                        {idx !== 0 && (
                          <div className={`absolute top-3.5 right-1/2 w-full h-[3px] -translate-y-1/2 z-0 ${isPast || isCurrent ? 'bg-primary-blue dark:bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
                            }`} />
                        )}
                        <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold border-2 transition-all ${isCurrent
                            ? 'bg-primary-blue text-white border-primary-blue shadow-md ring-4 ring-blue-100 dark:ring-blue-900/40 scale-110'
                            : isPast
                              ? 'bg-primary-blue text-white border-primary-blue'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                          {isPast ? <Check size={14} strokeWidth={3} /> : idx + 1}
                        </div>
                        <span className={`text-[10px] font-medium mt-2.5 text-center leading-tight max-w-[80px] ${isCurrent ? 'text-primary-blue dark:text-blue-400' : isPast ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                          {stage.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="px-6 pt-3 border-b border-gray-200 dark:border-slate-800 flex gap-4 overflow-x-auto text-xs font-medium">
                <button
                  onClick={() => setActiveModalTab('overview')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${activeModalTab === 'overview'
                      ? 'border-primary-blue text-primary-blue font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                    }`}
                >
                  <FileText size={14} /> Visão Geral &amp; Habilidades
                </button>

                <button
                  onClick={() => setActiveModalTab('interview')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${activeModalTab === 'interview'
                      ? 'border-primary-blue text-primary-blue font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                    }`}
                >
                  <Calendar size={14} /> Agendar Entrevista {selectedCandidate.interview && <Check size={13} className="text-emerald-600 inline" />}
                </button>

                <button
                  onClick={() => setActiveModalTab('endorsements')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${activeModalTab === 'endorsements'
                      ? 'border-primary-blue text-primary-blue font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                    }`}
                >
                  <Award size={14} /> Pareceres Docentes ({selectedCandidate.endorsements?.length || 0})
                </button>

                <button
                  onClick={() => setActiveModalTab('activity')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${activeModalTab === 'activity'
                      ? 'border-primary-blue text-primary-blue font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                    }`}
                >
                  <History size={14} /> Histórico &amp; Linha do Tempo
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

                {/* 1. Overview Tab */}
                {activeModalTab === 'overview' && (
                  <div className="space-y-5 text-xs">
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-slate-300 text-xs mb-2">
                        Competências &amp; Habilidades Técnicas:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills?.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-medium border border-slate-200 dark:border-slate-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-slate-300 text-xs mb-2">
                        Anotações Internas do Recrutador / Avaliação:
                      </h4>
                      <textarea
                        defaultValue={selectedCandidate.notes || ''}
                        onBlur={e => handleSaveNotes(e.target.value)}
                        placeholder="Registre observações técnicas, impressões da entrevista ou considerações da equipe..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-gray-800 dark:text-white outline-none focus:border-primary-blue min-h-[100px]"
                      />
                      <span className="text-[10px] text-gray-400 block mt-1">Salvo automaticamente ao clicar fora da caixa.</span>
                    </div>

                    {selectedCandidate.interview && (() => {
                      const hasDateAndTime = selectedCandidate.interview.date && selectedCandidate.interview.time;
                      let status = null; // null | 'prestes' | 'atrasada' | 'andamento' | 'concluida'

                      if (selectedCandidate.stage === 'aprovado' || selectedCandidate.stage === 'reprovado' || selectedCandidate.stage === 'banco_talentos' || selectedCandidate.interview.concluida) {
                        status = 'concluida';
                      } else if (hasDateAndTime) {
                        const [year, month, day] = selectedCandidate.interview.date.split('-');
                        const [hour, minute] = selectedCandidate.interview.time.split(':');
                        const interviewDate = new Date(year, month - 1, day, hour, minute);
                        const diffMinutes = (now - interviewDate) / 60000;

                        if (selectedCandidate.interview.roomCreated) {
                          if (diffMinutes > 120) status = 'concluida';
                          else status = 'andamento';
                        } else {
                          if (diffMinutes >= 0) status = 'atrasada';
                          else if (diffMinutes >= -10 && diffMinutes < 0) status = 'prestes';
                        }
                      }

                      const statusConfig = {
                        atrasada: { label: 'Atrasada', color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/60 border-red-200 dark:border-red-800', icon: AlertCircle },
                        prestes: { label: 'Prestes a começar', color: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 border-amber-200 dark:border-amber-800', icon: Clock },
                        andamento: { label: 'Em andamento', color: 'text-primary-blue dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 border-blue-200 dark:border-blue-800', icon: Video, pulse: true },
                        concluida: { label: 'Concluída', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 }
                      };

                      const currentStatus = status ? statusConfig[status] : null;
                      const Icon = currentStatus?.icon;

                      return (
                        <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                                  <Calendar size={15} className="text-purple-600" /> Entrevista confirmada para {selectedCandidate.interview.date} às {selectedCandidate.interview.time}
                                </span>
                                {currentStatus && (
                                  <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${currentStatus.color}`}>
                                    <Icon size={10} className={currentStatus.pulse ? 'animate-pulse' : ''} /> {currentStatus.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                                Formato: {selectedCandidate.interview.format}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveModalTab('interview')}
                                className="btn btn-outline btn-sm text-xs font-medium rounded-xl border-purple-300 text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/40 cursor-pointer"
                              >
                                Alterar
                              </button>
                            </div>
                          </div>

                          {/* Action buttons inside drawer */}
                          <div className="flex items-center gap-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/60 flex-wrap">
                            <button
                              onClick={() => {
                                const platform = selectedCandidate.interview.format || 'Google Meet';
                                if (platform.includes('Google Meet')) window.open('https://meet.google.com/new', '_blank');
                                else if (platform.includes('Teams')) window.open('https://teams.microsoft.com/', '_blank');

                                startChatWith({
                                  name: selectedCandidate.name,
                                  email: selectedCandidate.email || 'aluno@ivaiconecta.com.br',
                                  role: 'aluno',
                                  avatar: selectedCandidate.avatar
                                }, `Entrevista: ${currentJob?.title}`, `Olá ${selectedCandidate.name}! Nossa entrevista está começando. \nPor favor, acesse o link abaixo para entrar na sala oficial:\n\n[COLE O LINK DA REUNIÃO AQUI]`);

                                updateCandidateData(currentJob.id, selectedCandidate.id, {
                                  interview: { ...selectedCandidate.interview, roomCreated: true }
                                });
                                forceUpdate(prev => prev + 1);
                              }}
                              className="btn btn-sm text-xs font-medium bg-primary-blue hover:bg-blue-600 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Video size={13} /> Abrir Sala
                            </button>
                            <button
                              onClick={() => handleInterviewConcluded(selectedCandidate)}
                              className="btn btn-sm text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Aprovar candidato na entrevista e avançar para a próxima etapa"
                            >
                              <Check size={13} strokeWidth={3} /> Concluída (Passar Etapa)
                            </button>
                            <button
                              onClick={() => handleInterviewFinalized(selectedCandidate)}
                              className="btn btn-sm text-xs font-medium bg-slate-600 hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Finalizar e mover candidato para o Banco de Talentos"
                            >
                              <X size={13} strokeWidth={3} /> Finalizada (Banco)
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 2. Schedule Interview Tab */}
                {activeModalTab === 'interview' && (
                  <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                        <Calendar size={16} className="text-purple-600" /> Formulário de Agendamento de Entrevista
                      </h4>
                      {selectedCandidate.interview ? (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={12} /> Já Marcada
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle size={12} /> Nenhuma entrevista marcada
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
                          className="w-full bg-white dark:bg-slate-800 border-2 border-purple-400 dark:border-purple-500 rounded-xl p-2.5 font-bold text-purple-900 dark:text-purple-100 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Horário:</label>
                        <input
                          type="time"
                          value={interviewForm.time || selectedCandidate.interview?.time || ''}
                          onChange={e => setInterviewForm({ ...interviewForm, time: e.target.value })}
                          className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl p-2.5 font-medium outline-none focus:border-primary-blue"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Formato / Plataforma:</label>
                        <select
                          value={interviewForm.format || selectedCandidate.interview?.format || 'Google Meet'}
                          onChange={e => setInterviewForm({ ...interviewForm, format: e.target.value })}
                          className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl p-2.5 font-medium outline-none"
                        >
                          <option value="Google Meet">Google Meet (Online)</option>
                          <option value="Microsoft Teams">Microsoft Teams (Online)</option>
                          <option value="Presencial">Presencial na Sede da Empresa</option>
                          <option value="Telefone">Ligação Telefônica Direta</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex justify-end pt-3">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm px-5 py-2.5 font-bold text-xs rounded-xl shadow-brand-sm cursor-pointer"
                        >
                          Salvar e Mover para Etapa "Entrevista"
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 3. Endorsements Tab */}
                {activeModalTab === 'endorsements' && (
                  <div className="space-y-4">
                    {selectedCandidate.endorsements && selectedCandidate.endorsements.length > 0 ? (
                      selectedCandidate.endorsements.map((end, i) => (
                        <div key={i} className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-xs">
                          <div className="font-bold text-amber-950 dark:text-amber-300 flex items-center justify-between">
                            <span>{end.profName} ({end.discipline})</span>
                            <span className="font-semibold text-gray-500 text-[10px]">{end.institution}</span>
                          </div>
                          <p className="text-gray-700 dark:text-slate-300 mt-2 italic text-xs leading-relaxed">"{end.quote}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                        Nenhum parecer pedagógico registrado pelos professores até o momento.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Activity History Tab */}
                {activeModalTab === 'activity' && (
                  <div className="space-y-3">
                    {(selectedCandidate.activity || [
                      { date: selectedCandidate.appliedAt, text: 'Candidatura submetida via plataforma Ivaí Conecta' }
                    ]).map((act, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                        <Clock size={14} className="text-primary-blue shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{act.text}</div>
                          <div className="text-[10px] text-gray-400">{act.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="btn btn-outline btn-sm font-bold text-xs rounded-xl"
                >
                  Fechar Detalhes
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
          MODAL: ADICIONAR CANDIDATO MANUALMENTE NO QUADRO
      ═════════════════════════════════════════════════════════════════ */}
        {showAddCandidateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="text-primary-blue" size={20} />
                  <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">Adicionar Candidato ao Quadro</h3>
                </div>
                <button onClick={() => setShowAddCandidateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleQuickAddCandidate} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Nome Completo do Candidato:</label>
                  <input
                    type="text"
                    placeholder="Ex: Matheus Oliveira"
                    value={newCandidateForm.name}
                    onChange={e => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Curso / Área:</label>
                    <input
                      type="text"
                      placeholder="Ex: ADS, Engenharia..."
                      value={newCandidateForm.course}
                      onChange={e => setNewCandidateForm({ ...newCandidateForm, course: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Instituição de Ensino:</label>
                    <select
                      value={newCandidateForm.institution}
                      onChange={e => setNewCandidateForm({ ...newCandidateForm, institution: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                    >
                      <option value="IFPR Campus Ivaiporã">IFPR Campus Ivaiporã</option>
                      <option value="Univale Ivaiporã">Univale Ivaiporã</option>
                      <option value="UENP">UENP</option>
                      <option value="Unicesumar / Outra">Unicesumar / Outra</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Etapa Inicial no Funil:</label>
                    <select
                      value={addCandidateTargetStage}
                      onChange={e => setAddCandidateTargetStage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                    >
                      {customStages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Score de Afinidade (%):</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={newCandidateForm.matchScore}
                      onChange={e => setNewCandidateForm({ ...newCandidateForm, matchScore: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Telefone / Celular de Contato:</label>
                  <input
                    type="text"
                    placeholder="5543999112233"
                    value={newCandidateForm.phone}
                    onChange={e => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Habilidades (separadas por vírgula):</label>
                  <input
                    type="text"
                    placeholder="React, JavaScript, Git..."
                    value={newCandidateForm.skills}
                    onChange={e => setNewCandidateForm({ ...newCandidateForm, skills: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowAddCandidateModal(false)} className="btn btn-outline btn-sm rounded-xl">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-5 py-2.5 font-bold rounded-xl shadow-brand-sm">
                    Adicionar ao Quadro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: PUBLICAR NOVA VAGA (SHARED COMPONENT) ── */}
        <PublishJobModal
          isOpen={showNewJobModal}
          onClose={() => setShowNewJobModal(false)}
          onJobCreated={(created) => {
            try {
              setActiveTab('jobs_list');
              if (created?.id) {
                setSelectedJobId(created.id);
              }
            } catch (err) {
              console.warn('[GerenciamentoVagasEmpresa] Erro no onJobCreated:', err);
            }
          }}
        />

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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700 dark:text-slate-300">Título do Cargo / Função:</label>
                    <span className="text-[10px] text-gray-400 font-semibold">Exige função profissional válida</span>
                  </div>
                  <input
                    type="text"
                    value={editingJob.title}
                    onChange={e => setEditingJob({ ...editingJob, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold"
                    placeholder="Ex: Assistente Administrativo, Vendedor Comercial, Desenvolvedor React..."
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
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Carga Horária & Jornada:</label>
                  <select
                    value={editingJob.workingHours || STANDARD_WORKING_HOURS[0]}
                    onChange={e => setEditingJob({ ...editingJob, workingHours: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                  >
                    {STANDARD_WORKING_HOURS.map(wh => (
                      <option key={wh} value={wh}>{wh}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700 dark:text-slate-300">Descrição Detalhada:</label>
                    <span className="text-[10px] text-gray-400">Mínimo 30 caracteres</span>
                  </div>
                  <textarea
                    rows={4}
                    value={editingJob.description || ''}
                    onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                    placeholder="Descreva as responsabilidades e detalhes da oportunidade..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button type="button" onClick={() => setEditingJob(null)} className="btn btn-outline btn-sm rounded-xl">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-5 py-2.5 font-bold rounded-xl shadow-brand-sm">
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
