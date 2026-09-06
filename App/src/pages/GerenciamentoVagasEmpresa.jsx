import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle, CheckCircle2, Clock, ArrowRight,
  ArrowLeft, Plus, Users, Eye, Edit3, XCircle, RotateCcw, Phone, ShieldCheck,
  Award, Send, Check, X, FileText, Calendar, Sparkles, Star, Copy, Share2,
  Search, Filter, ExternalLink, ChevronRight, Download, Trash2,
  SlidersHorizontal, Video, AlertCircle, GraduationCap, LayoutGrid,
  ListFilter, MessageSquare, ChevronDown, ChevronUp, ArrowUpDown, RefreshCw,
  Inbox, Settings, BarChart3, Layers, CheckSquare, Save, HelpCircle, UserCheck,
  GripVertical, ChevronLeft, UserPlus, ArrowUpRight, History
} from 'lucide-react';
import {
  getJobs, addJob, updateJob, duplicateJob, deleteJob, updateJobStatus,
  getJobCandidates, updateCandidateStage, updateCandidateData,
  scheduleCandidateInterview, SELECTION_STAGES, calculateMatchScore,
  getCompanyCustomStages, saveCompanyCustomStages, getJobCustomStages,
  saveJobCustomStages, CITIES, reorderCandidateStage, sanitizeStageItem, sanitizeMojibake
} from '../lib/ivaiConecta';
import { subscribeToJobs } from '../services/jobsService';
import useAppStore from '../store/useAppStore';
import JobFormModal from '../components/JobFormModal';
import JobActionModal from '../components/JobActionModal';

let isDraggingLock = false;

const DEMO_COMPANY_JOBS = [
  {
    id: 101,
    title: 'Desenvolvedor Front-end React',
    company: 'ValeTech Soluções Digitais',
    city: 'Ivaiporã',
    type: 'Tempo Integral',
    modality: 'Híbrido',
    salary: 'R$ 3.500 - R$ 4.800',
    experienceLevel: 'Júnior',
    status: 'Ativa',
    requiredSkills: ['React', 'JavaScript', 'TailwindCSS', 'Git', 'HTML5/CSS3'],
    description: 'Desenvolvimento de interfaces modernas e responsivas para soluções corporativas da região do Vale do Ivaí.',
    createdAt: '15/08/2026',
    applicantsCount: 5
  },
  {
    id: 102,
    title: 'Assistente Administrativo & Comercial',
    company: 'ValeTech Soluções Digitais',
    city: 'Ivaiporã',
    type: 'Tempo Integral',
    modality: 'Presencial',
    salary: 'R$ 2.400 - R$ 3.000',
    experienceLevel: 'Júnior',
    status: 'Ativa',
    requiredSkills: ['Atendimento ao Cliente', 'Excel', 'Faturamento', 'Organização'],
    description: 'Suporte à rotina administrativa e comercial, atendimento aos clientes e emissão de relatórios.',
    createdAt: '18/08/2026',
    applicantsCount: 3
  },
  {
    id: 103,
    title: 'Técnico de Suporte & Infraestrutura',
    company: 'ValeTech Soluções Digitais',
    city: 'Ivaiporã',
    type: 'Tempo Integral',
    modality: 'Presencial',
    salary: 'R$ 2.200 - R$ 2.900',
    experienceLevel: 'Júnior',
    status: 'Ativa',
    requiredSkills: ['Redes de Computadores', 'Hardware', 'Suporte Técnico', 'Windows'],
    description: 'Manutenção de computadores, suporte técnico a usuários e monitoramento de redes locais.',
    createdAt: '20/08/2026',
    applicantsCount: 2
  }
];


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

  const allCompanyJobs = useMemo(() => {
    const jobs = liveJobs;
    if (!currentUser) return jobs;
    const userCompanyMatch = jobs.filter(j => 
      j.createdBy === currentUser?.uid ||
      j.createdBy === currentUser?.email ||
      (currentUser?.email && j.createdBy?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && j.company?.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
      (currentUser?.razaoSocial && j.company?.toLowerCase().includes(currentUser.razaoSocial.toLowerCase().split(' ')[0])) ||
      (currentUser?.nomeFantasia && j.company?.toLowerCase().includes(currentUser.nomeFantasia.toLowerCase().split(' ')[0]))
    );
    return userCompanyMatch;
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
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('todos'); // 'todos' | 'Ativa' | 'Encerrada'
  const [jobModalityFilter, setJobModalityFilter] = useState('todos'); // 'todos' | 'Presencial' | 'Remoto' | 'Híbrido'
  const [jobCityFilter, setJobCityFilter] = useState('todas');
  const [jobSortBy, setJobSortBy] = useState('recent'); // 'recent' | 'candidates_desc' | 'title_asc'

  // Drag & Drop State
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
  const [jobActionModalTarget, setJobActionModalTarget] = useState(null);

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
      if (c.stage === 'aprovado' || c.stage === 'banco_talentos' || c.interview.concluida) {
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

  // Dynamic lists for candidate filter selects
  const availableCandidateCities = useMemo(() => {
    const set = new Set(jobCandidates.map(c => c.city).filter(Boolean));
    CITIES.filter(c => c !== 'Todas as Cidades').forEach(c => set.add(c));
    return Array.from(set);
  }, [jobCandidates]);

  const availableInstitutions = useMemo(() => {
    const set = new Set(jobCandidates.map(c => c.institution).filter(Boolean));
    ['IFPR Campus Ivaiporã', 'Univale Ivaiporã', 'UENP'].forEach(i => set.add(i));
    return Array.from(set);
  }, [jobCandidates]);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    let result = jobCandidates.filter(c => {
      const matchText = !candidateSearch ||
        c.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.course?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.institution?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.city?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.phone?.includes(candidateSearch) ||
        c.skills?.some(s => s?.toLowerCase().includes(candidateSearch.toLowerCase()));

      const matchStage = selectedStageFilter === 'todos' || c.stage === selectedStageFilter;
      const matchScore = (c.matchScore || 0) >= minMatchFilter;
      const matchCity = selectedCityFilter === 'todas' || c.city === selectedCityFilter;
      const matchInstitution = selectedInstitutionFilter === 'todas' ||
        c.institution?.toLowerCase().includes(selectedInstitutionFilter.toLowerCase());
      const matchRating = selectedRatingFilter === 0 || (c.rating || 0) >= selectedRatingFilter;
      const matchVerified = !onlyVerified || c.isVerifiedStudent;
      const matchInterview = !onlyWithInterview || !!c.interview;
      const matchEndorsement = !onlyWithEndorsement || (c.endorsements && c.endorsements.length > 0);
      const matchNotes = !onlyWithNotes || Boolean(c.notes && c.notes.trim());

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

  // Filtered & Sorted Jobs for "Minhas Vagas" Tab
  const filteredCompanyJobs = useMemo(() => {
    return allCompanyJobs
      .filter(job => {
        const matchesSearch = !jobSearch ||
          job.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
          job.description?.toLowerCase().includes(jobSearch.toLowerCase()) ||
          job.requiredSkills?.some(s => s?.toLowerCase().includes(jobSearch.toLowerCase()));

        const matchesStatus = jobStatusFilter === 'todos' ||
          (jobStatusFilter === 'Ativa' ? job.status === 'Ativa' : job.status !== 'Ativa');

        const matchesModality = jobModalityFilter === 'todos' ||
          (job.modality?.toLowerCase() === jobModalityFilter.toLowerCase());

        const matchesCity = jobCityFilter === 'todas' || job.city === jobCityFilter;

        return matchesSearch && matchesStatus && matchesModality && matchesCity;
      })
      .sort((a, b) => {
        if (jobSortBy === 'candidates_desc') {
          return getJobCandidates(b.id).length - getJobCandidates(a.id).length;
        }
        if (jobSortBy === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return (b.id || 0) - (a.id || 0);
      });
  }, [allCompanyJobs, jobSearch, jobStatusFilter, jobModalityFilter, jobCityFilter, jobSortBy, updateCount]);

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
  const getStageStyle = (stageId, colorKey) => {
    const styles = {
      triagem: {
        dot: 'bg-sky-500',
        badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        headerBorder: 'border-l-sky-500',
        pill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/40',
        dropHighlight: 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600',
      },
      analise: {
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        headerBorder: 'border-l-amber-500',
        pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40',
        dropHighlight: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600',
      },
      entrevista: {
        dot: 'bg-purple-500',
        badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        headerBorder: 'border-l-purple-500',
        pill: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40',
        dropHighlight: 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 dark:border-purple-600',
      },
      desafio: {
        dot: 'bg-indigo-500',
        badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        headerBorder: 'border-l-indigo-500',
        pill: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300/40',
        dropHighlight: 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600',
      },
      aprovado: {
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        headerBorder: 'border-l-emerald-500',
        pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40',
        dropHighlight: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600',
      },
      reprovado: {
        dot: 'bg-slate-400 dark:bg-slate-500',
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        headerBorder: 'border-l-slate-400',
        pill: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300/40',
        dropHighlight: 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-400 dark:border-slate-600',
      },
    };

    return styles[stageId] || {
      dot: 'bg-blue-500',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      headerBorder: 'border-l-blue-500',
      pill: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40',
      dropHighlight: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600',
    };
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

  // Drag & Drop Handlers
  const handleDragStart = (e, cand) => {
    isDraggingLock = true;
    setDraggedCandidate(cand);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(cand.id));
  };

  const handleDragEnd = () => {
    setDragOverStageId(null);
    setDragOverCandidateId(null);
    setDraggedCandidate(null);
    setTimeout(() => {
      isDraggingLock = false;
    }, 500);
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
    setTimeout(() => { isDraggingLock = false; }, 500);
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
    setTimeout(() => { isDraggingLock = false; }, 500);
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
      showToast(`📅 Horário alterado! Revise o convite no chat antes de enviar.`);
    } else {
      showToast(`📅 Entrevista agendada e convite enviado no chat!`);
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

    showToast(`✅ Candidato ${newCand.name} adicionado com sucesso!`);
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
      showToast('🔒 Processo seletivo encerrado com sucesso!');
    } catch (err) {
      console.error('Erro ao encerrar vaga:', err);
      showToast('⚠️ Erro ao sincronizar encerramento da vaga.');
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

  const handleDeleteJob = async (jobOrId) => {
    const targetJob = typeof jobOrId === 'object' && jobOrId !== null
      ? jobOrId
      : allCompanyJobs.find(j => String(j.id) === String(jobOrId) || String(j.firestoreId) === String(jobOrId));
    const idStr = targetJob?.id ? String(targetJob.id) : String(jobOrId);
    const firestoreIdStr = targetJob?.firestoreId ? String(targetJob.firestoreId) : null;

    // 1. Atualização Otimista Imediata no React (some da tela instantaneamente sem F5!)
    setLiveJobs(prev => prev.filter(j => {
      const jId = String(j.id);
      const jFId = j.firestoreId ? String(j.firestoreId) : null;
      if (jId === idStr) return false;
      if (firestoreIdStr && (jId === firestoreIdStr || jFId === firestoreIdStr)) return false;
      if (jFId && jFId === idStr) return false;
      return true;
    }));

    // 2. Se a vaga excluída era a atualmente selecionada no pipeline, seleciona a próxima vaga disponível
    setSelectedJobId(prevId => {
      const prevIdStr = String(prevId);
      if (prevIdStr === idStr || (firestoreIdStr && prevIdStr === firestoreIdStr)) {
        const remaining = allCompanyJobs.filter(j => {
          const jId = String(j.id);
          const jFId = j.firestoreId ? String(j.firestoreId) : null;
          return jId !== idStr && (!firestoreIdStr || (jId !== firestoreIdStr && jFId !== firestoreIdStr));
        });
        return remaining[0]?.id || null;
      }
      return prevId;
    });

    // 3. Persiste no storage local e Firestore
    try {
      await deleteJob(firestoreIdStr || idStr);
      showToast('🗑️ Vaga excluída permanentemente.');
    } catch (err) {
      console.error('Erro ao excluir vaga:', err);
      showToast('⚠️ Erro ao processar exclusão no servidor.');
    }
    forceUpdate(n => n + 1);
  };

  const handleSaveJob = async (jobPayload, isEditing) => {
    if (isEditing && editingJob?.id) {
      await updateJob(editingJob.id, jobPayload);
      showToast('Vaga atualizada com sucesso no Firestore!');
      setEditingJob(null);
    } else {
      const created = await addJob(jobPayload);
      showToast('🎉 Nova vaga homologada e publicada com sucesso no Mural Regional!');
      setShowNewJobModal(false);
      if (created?.id) {
        setSelectedJobId(created.id);
      }
      handleTabChange('pipeline');
    }
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
    if (selectedJobId === 'default' || !currentJob) {
      saveCompanyCustomStages(customStages);
      showToast('⭐ Modelo padrão de etapas da empresa salvo com sucesso!');
      forceUpdate(n => n + 1);
      return;
    }
    saveJobCustomStages(currentJob.id, customStages);
    showToast(`✅ Etapas do funil salvas exclusivamente para a vaga: "${currentJob.title}"!`);
    forceUpdate(n => n + 1);
  };

  const handleApplyCustomStagesToAllJobs = () => {
    saveCompanyCustomStages(customStages);
    if (allCompanyJobs.length > 0) {
      allCompanyJobs.forEach(job => {
        saveJobCustomStages(job.id, customStages);
      });
      showToast('🚀 Estas etapas foram salvas e aplicadas a TODAS as vagas da empresa!');
    } else {
      showToast('⭐ Etapas salvas como modelo padrão para todas as futuras vagas!');
    }
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
                {currentUser?.name || 'ValeTech Soluções Digitais'}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/empresa/1"
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
                      : `Sua reunião com ${activeCand.name} está agendada para as ${activeCand.interview.time}.`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full">
                {activeCand.interviewStatus === 'concluida' ? (
                  <div className="flex w-full gap-2">
                    <button
                      onClick={() => {
                        updateCandidateStage(currentJob.id, activeCand.id, 'desafio');
                        updateCandidateData(currentJob.id, activeCand.id, {
                          interview: { ...activeCand.interview, bannerDismissed: true }
                        });
                        forceUpdate(prev => prev + 1);
                      }}
                      className="flex-1 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                    >
                      <Check size={14} strokeWidth={3} /> Concluída
                    </button>
                    <button
                      onClick={() => {
                        updateCandidateStage(currentJob.id, activeCand.id, 'banco_talentos');
                        updateCandidateData(currentJob.id, activeCand.id, {
                          interview: { ...activeCand.interview, bannerDismissed: true }
                        });
                        forceUpdate(prev => prev + 1);
                      }}
                      className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 text-white font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md border border-white/30 hover:scale-105 active:scale-95"
                    >
                      <X size={14} strokeWidth={3} /> Finalizada
                    </button>
                  </div>
                ) : activeCand.interviewStatus === 'andamento' ? (
                  <button
                    onClick={() => {
                      updateCandidateData(currentJob.id, activeCand.id, {
                        interview: { ...activeCand.interview, concluida: true }
                      });
                      forceUpdate(prev => prev + 1);
                    }}
                    className="w-full py-2.5 bg-white text-primary-blue hover:bg-blue-50 font-black text-xs rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={15} /> Finalizar Chamada
                  </button>
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
                    className={`w-full py-2.5 bg-white font-black text-xs rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeCand.interviewStatus === 'atrasada' ? 'text-red-700 hover:bg-red-50' : 'text-primary-blue hover:bg-blue-50'
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

      {/* ── SUB-TABS NAVIGATION MINIMALISTA ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 lg:top-[74px] z-40">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center overflow-x-auto scrollbar-none gap-6 pt-1">
            <button
              onClick={() => handleTabChange('pipeline')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Layers size={16} /> Funil Kanban
            </button>

            <button
              onClick={() => handleTabChange('jobs_list')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'jobs_list'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Briefcase size={16} /> Minhas Vagas ({allCompanyJobs.length})
            </button>

            <button
              onClick={() => handleTabChange('stage_settings')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'stage_settings'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Settings size={16} /> Configurar Etapas
            </button>
            
            <button
              onClick={() => handleTabChange('analytics')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 size={16} /> Indicadores
            </button>
          </div>
        </div>
      </div>

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
            
            {/* ── BARRA SUPERIOR: SELEÇÃO DA VAGA & VISUALIZAÇÃO ── */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-1">
              <div className="flex-1 max-w-2xl">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Vaga Selecionada
                </label>
                <div className="relative">
                  <select
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(Number(e.target.value) || e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue shadow-2xs transition-colors"
                  >
                    {allCompanyJobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} — {job.city} ({getJobCandidates(job.id).length} candidatos)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Campo de Busca Rápida com botão de limpar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar candidato, curso, skill..."
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary-blue text-gray-800 dark:text-white shadow-2xs transition-colors"
                  />
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {candidateSearch && (
                    <button
                      onClick={() => setCandidateSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                      title="Limpar busca"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                
                {/* Botão de Filtros Avançados com Badge de Contagem */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    showAdvancedFilters || (selectedCityFilter !== 'todas' || selectedInstitutionFilter !== 'todas' || selectedRatingFilter > 0 || minMatchFilter > 0)
                      ? 'bg-primary-blue text-white border-primary-blue'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  <span className="hidden sm:inline">Filtros Avançados</span>
                  {(selectedCityFilter !== 'todas' || selectedInstitutionFilter !== 'todas' || selectedRatingFilter > 0 || minMatchFilter > 0) && (
                    <span className="w-5 h-5 rounded-full bg-white text-primary-blue dark:bg-gray-900 dark:text-white text-[11px] font-black flex items-center justify-center ml-1">
                      {[selectedCityFilter !== 'todas', selectedInstitutionFilter !== 'todas', selectedRatingFilter > 0, minMatchFilter > 0].filter(Boolean).length}
                    </span>
                  )}
                  {showAdvancedFilters ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>


                {/* Alternância Kanban / Lista */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      viewMode === 'kanban'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                    }`}
                  >
                    <LayoutGrid size={13} /> Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedStageFilter === 'todos'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Todas as Etapas</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    selectedStageFilter === 'todos'
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-primary-blue text-white shadow-xs'
                          : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : style.dot}`} />
                      <span>{sanitizeStageItem(stage).name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        isSelected
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
                  <span className="font-semibold hidden lg:inline">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-gray-800 dark:text-white outline-none cursor-pointer focus:ring-0"
                  >
                    <option value="match_desc">Maior Match</option>
                    <option value="match_asc">Menor Match</option>
                    <option value="rating_desc">Melhor Avaliação (★)</option>
                    <option value="recent">Mais Recentes</option>
                    <option value="oldest">Mais Antigos</option>
                    <option value="name_asc">Nome (A-Z)</option>
                  </select>
                </div>

                <div className="border-l border-gray-200 dark:border-slate-700 pl-4 text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
                  Mostrando <strong className="text-gray-900 dark:text-white">{filteredCandidates.length}</strong> <span className="hidden sm:inline">de {jobCandidates.length}</span>
                </div>
              </div>
            </div>

            {/* ── PAINEL EXPANSÍVEL DE FILTROS AVANÇADOS ── */}
            {showAdvancedFilters && (
              <div className="bg-white dark:bg-slate-900 border border-primary-blue/30 dark:border-primary-blue/30 rounded-2xl p-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-primary-blue" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
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
                    className="text-xs text-primary-blue hover:underline font-semibold cursor-pointer"
                  >
                    Redefinir Filtros Avançados
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Cidade do Candidato */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Cidade do Candidato
                    </label>
                    <select
                      value={selectedCityFilter}
                      onChange={e => setSelectedCityFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                    >
                      <option value="todas">Todas as Cidades</option>
                      {availableCandidateCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Instituição de Ensino */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Instituição de Ensino
                    </label>
                    <select
                      value={selectedInstitutionFilter}
                      onChange={e => setSelectedInstitutionFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                    >
                      <option value="todas">Todas as Instituições</option>
                      {availableInstitutions.map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nota de Match Mínima */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Match Mínimo ({minMatchFilter === 0 ? 'Qualquer' : `≥ ${minMatchFilter}%`})
                    </label>
                    <div className="flex gap-1">
                      {[0, 75, 85, 90, 95].map(val => (
                        <button
                          key={val}
                          onClick={() => setMinMatchFilter(val)}
                          className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            minMatchFilter === val
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
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Avaliação Interna
                    </label>
                    <div className="flex gap-1">
                      {[
                        { val: 0, label: 'Todas' },
                        { val: 3, label: '3+ ★' },
                        { val: 4, label: '4+ ★' },
                        { val: 5, label: '5 ★' }
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => setSelectedRatingFilter(item.val)}
                          className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            selectedRatingFilter === item.val
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
                <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Filtros Ativos:</span>
                
                {candidateSearch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-primary-blue border border-blue-200 dark:border-blue-800">
                    Busca: "{candidateSearch}"
                    <button onClick={() => setCandidateSearch('')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {selectedStageFilter !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Etapa: {sanitizeStageItem(customStages.find(s => s.id === selectedStageFilter) || { name: selectedStageFilter }).name}
                    <button onClick={() => setSelectedStageFilter('todos')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {selectedCityFilter !== 'todas' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    Cidade: {selectedCityFilter}
                    <button onClick={() => setSelectedCityFilter('todas')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {selectedInstitutionFilter !== 'todas' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    Inst.: {selectedInstitutionFilter}
                    <button onClick={() => setSelectedInstitutionFilter('todas')} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {minMatchFilter > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Match: &ge; {minMatchFilter}%
                    <button onClick={() => setMinMatchFilter(0)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {selectedRatingFilter > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Avaliação: &ge; {selectedRatingFilter}★
                    <button onClick={() => setSelectedRatingFilter(0)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {onlyVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Selo IFPR
                    <button onClick={() => setOnlyVerified(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {onlyWithInterview && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Com Entrevista
                    <button onClick={() => setOnlyWithInterview(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {onlyWithEndorsement && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Parecer Docente
                    <button onClick={() => setOnlyWithEndorsement(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {onlyWithNotes && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    Com Anotações
                    <button onClick={() => setOnlyWithNotes(false)} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>
                  </span>
                )}

                {sortBy !== 'match_desc' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
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
                  className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1 ml-auto"
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
                      Filtro por etapa ativo: exibindo apenas a coluna <strong>"{sanitizeStageItem(customStages.find(s => s.id === selectedStageFilter) || { name: selectedStageFilter }).name}"</strong>
                    </span>
                    <button
                      onClick={() => setSelectedStageFilter('todos')}
                      className="underline hover:opacity-80 font-bold cursor-pointer"
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
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Nenhum candidato encontrado</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                      Não encontramos candidatos nesta vaga que correspondam aos filtros selecionados.
                    </p>
                    <button
                      onClick={resetCandidateFilters}
                      className="btn btn-outline btn-sm font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
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
                        className={`${isSingleColumn ? 'w-full pt-2' : 'w-[330px] min-w-[330px] max-w-[330px] shrink-0 bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-3.5 shadow-sm'} flex flex-col transition-all duration-200 ${
                          isDragOver
                            ? `${style.dropHighlight} ring-2 ring-primary-blue/60 scale-[1.01]`
                            : ''
                        }`}
                      >
                        {/* ── Column Header ── */}
                        {!isSingleColumn && (
                        <div className="bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs mb-3.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${style.dot} ring-4 ring-slate-100 dark:ring-slate-800`} />
                            <div className="min-w-0">
                              <h4 className="font-heading text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                                {stage.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                                {stage.description || `${stageCandidates.length} candidatos nesta fase`}
                              </p>
                            </div>
                          </div>
                        </div>
                        )}

                        {/* ── Cards Container (Scrollable) ── */}
                        <div className={`flex-1 ${isSingleColumn ? '' : 'min-h-[420px]'} max-h-[calc(100vh-270px)] overflow-y-auto pr-1 ${
                          isSingleColumn 
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start pb-4' 
                            : 'flex flex-col gap-3'
                        }`}>
                          {stageCandidates.length === 0 ? (
                            <div className={`h-full min-h-[260px] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 transition-all ${
                              isDragOver
                                ? 'border-primary-blue bg-blue-500/10 text-primary-blue font-bold'
                                : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500'
                            }`}>
                              <Inbox size={32} className={`opacity-60 mb-1 ${isDragOver ? 'animate-bounce text-primary-blue' : ''}`} />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
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
                                  className={`transition-all duration-300 ease-out relative ${isSingleColumn ? 'h-full flex flex-col' : ''} ${isDragOverTarget ? 'pt-32' : 'pt-0'}`}
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
                                    className={`group relative bg-white dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 hover:border-primary-blue/60 dark:hover:border-blue-400 rounded-2xl p-4 shadow-2xs hover:shadow-brand-md transition-all duration-300 ease-out cursor-grab active:cursor-grabbing flex flex-col gap-3 ${isSingleColumn ? 'flex-1' : ''} ${
                                      isBeingDragged
                                        ? 'opacity-40 ring-2 ring-primary-blue rotate-2 scale-95 shadow-xl'
                                        : 'hover:-translate-y-0.5'
                                    }`}
                                  >
                                  {/* ── Card Top Header: Avatar + Info + Match Pill ── */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="relative shrink-0">
                                        <img
                                          src={cand.avatar}
                                          alt={cand.name}
                                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs bg-slate-50"
                                        />
                                        {cand.isVerifiedStudent && (
                                          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-2xs ring-2 ring-white dark:ring-slate-800" title="Matrícula Verificada">
                                            <ShieldCheck size={10} />
                                          </span>
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <h5 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary-blue transition-colors leading-snug truncate">
                                          {cand.name}
                                        </h5>
                                        <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 truncate mt-0.5">
                                          {cand.course}
                                        </div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                          <span>{cand.institution}</span>
                                          <span>·</span>
                                          <span>{cand.city}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Match Badge */}
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                                      cand.matchScore >= 90
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
                                    
                                    if (cand.stage === 'aprovado' || cand.stage === 'banco_talentos' || cand.interview.concluida) {
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
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {cand.skills?.slice(0, 3).map(skill => (
                                      <span key={skill} className="text-[11px] bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md font-medium">
                                        {skill}
                                      </span>
                                    ))}
                                    {cand.skills?.length > 3 && (
                                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold self-center ml-1">
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
                                          className={`p-0.5 hover:scale-125 transition-transform ${
                                            (cand.rating || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
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
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[11px]">
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
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 px-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                                <Filter size={20} />
                              </div>
                              <h4 className="font-bold text-base text-gray-900 dark:text-white">Nenhum candidato encontrado</h4>
                              <p className="text-xs text-gray-500 dark:text-slate-400">
                                Não encontramos nenhum candidato nesta vaga com os filtros selecionados. Tente ajustar os parâmetros.
                              </p>
                              <button
                                onClick={resetCandidateFilters}
                                className="btn btn-outline btn-sm font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5 mt-1"
                              >
                                <RotateCcw size={13} /> Limpar Todos os Filtros
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map(cand => (
                        <tr key={cand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <img src={cand.avatar} alt={cand.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs" />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {cand.name}
                                  {cand.isVerifiedStudent && <ShieldCheck size={13} className="text-emerald-500" />}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">{cand.city} · {cand.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                            <div>{cand.course}</div>
                            <div className="text-[11px] text-primary-blue font-bold">{cand.institution}</div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs">
                              {cand.matchScore}% Match
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <select
                              value={cand.stage}
                              onChange={e => handleStageChange(cand.id, e.target.value)}
                              className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:border-primary-blue"
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
                          <td className="py-4 px-5 text-slate-500 text-xs">
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
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB 2: LISTA E GESTÃO DE TODAS AS VAGAS DA EMPRESA
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'jobs_list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Todas as Vagas da Empresa ({allCompanyJobs.length})
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                  Gerencie status, edite descrições de cargos, estenda prazos ou encerre processos.
                </p>
              </div>

              <button
                onClick={() => setShowNewJobModal(true)}
                className="btn btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl shadow-brand-sm cursor-pointer"
              >
                <Plus size={16} /> Publicar Nova Vaga
              </button>
            </div>

            {/* ── BARRA DE FILTROS E BUSCA DE VAGAS DA EMPRESA ── */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-lg">
                  <input
                    type="text"
                    placeholder="Buscar vaga por título, descrição ou tecnologia..."
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-primary-blue text-gray-800 dark:text-white transition-colors"
                  />
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {jobSearch && (
                    <button
                      onClick={() => setJobSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter Selects */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Status */}
                  <select
                    value={jobStatusFilter}
                    onChange={e => setJobStatusFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="Ativa">Apenas Ativas</option>
                    <option value="Encerrada">Pausadas / Encerradas</option>
                  </select>

                  {/* Modalidade */}
                  <select
                    value={jobModalityFilter}
                    onChange={e => setJobModalityFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    <option value="todos">Todas as Modalidades</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                  </select>

                  {/* Cidade */}
                  <select
                    value={jobCityFilter}
                    onChange={e => setJobCityFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    <option value="todas">Todas as Cidades</option>
                    {CITIES.filter(c => c !== 'Todas as Cidades').map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>

                  {/* Ordenação */}
                  <select
                    value={jobSortBy}
                    onChange={e => setJobSortBy(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    <option value="recent">Mais Recentes</option>
                    <option value="candidates_desc">Mais Candidatos</option>
                    <option value="title_asc">Título (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Counter and Active Tag Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                <div className="text-gray-500 dark:text-slate-400 font-medium">
                  Mostrando <strong className="text-gray-900 dark:text-white">{filteredCompanyJobs.length}</strong> de {allCompanyJobs.length} vagas da empresa
                </div>

                {(jobSearch || jobStatusFilter !== 'todos' || jobModalityFilter !== 'todos' || jobCityFilter !== 'todas' || jobSortBy !== 'recent') && (
                  <button
                    onClick={() => {
                      setJobSearch('');
                      setJobStatusFilter('todos');
                      setJobModalityFilter('todos');
                      setJobCityFilter('todas');
                      setJobSortBy('recent');
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Limpar Filtros de Vagas
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {filteredCompanyJobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <Filter size={20} />
                  </div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">
                    {allCompanyJobs.length === 0 ? 'Nenhuma vaga cadastrada' : 'Nenhuma vaga encontrada'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                    {allCompanyJobs.length === 0
                      ? 'Sua empresa ainda não possui nenhuma vaga publicada no momento.'
                      : 'Nenhuma vaga da sua empresa corresponde aos filtros selecionados. Tente ajustar os termos de pesquisa ou filtros.'}
                  </p>
                  {allCompanyJobs.length === 0 ? (
                    <button
                      onClick={() => setShowNewJobModal(true)}
                      className="btn btn-primary btn-sm font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={13} /> Publicar Primeira Vaga
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setJobSearch('');
                        setJobStatusFilter('todos');
                        setJobModalityFilter('todos');
                        setJobCityFilter('todas');
                        setJobSortBy('recent');
                      }}
                      className="btn btn-outline btn-sm font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} /> Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredCompanyJobs.map(job => {
                const candidates = getJobCandidates(job.id);
                const isActive = job.status === 'Ativa';

                return (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-brand-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
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
                        <div className="text-left lg:text-right">
                          <div className="text-2xl font-black font-heading text-primary-blue dark:text-blue-400">{candidates.length}</div>
                          <div className="text-[11px] text-gray-500">Candidatos Inscritos</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedJobId(job.id);
                            handleTabChange('pipeline');
                          }}
                          className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 rounded-xl cursor-pointer"
                        >
                          <Layers size={13} /> Abrir Funil Kanban
                        </button>

                        <button
                          onClick={() => setEditingJob(job)}
                          className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-pointer"
                          title="Editar Vaga"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDuplicateJob(job.id)}
                          className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-pointer"
                          title="Duplicar Vaga"
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          onClick={() => {
                            if (isActive) {
                              setJobActionModalTarget(job);
                            } else {
                              handleToggleJobStatus(job.id, job.status);
                            }
                          }}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            isActive
                              ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
                          }`}
                          title={isActive ? 'Encerrar / Gerenciar Vaga' : 'Reabrir Vaga'}
                        >
                          {isActive ? <Clock size={14} /> : <RotateCcw size={14} />}
                        </button>

                        <button
                          onClick={() => setJobActionModalTarget(job)}
                          className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Encerrar ou Excluir Vaga"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB 3: CONFIGURAÇÕES DE ETAPAS DO PROCESSO SELETIVO POR VAGA
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'stage_settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-blue mb-1 block">Customização do Funil</span>
                  <h2 className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white">
                    Etapas do Processo Seletivo por Vaga
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Defina e reordene as colunas do seu quadro Kanban especificamente para esta vaga.
                  </p>
                </div>

                <button
                  onClick={handleAddCustomStage}
                  className="btn btn-primary btn-sm px-4 py-2 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs shrink-0 rounded-xl"
                >
                  <Plus size={14} /> Adicionar Nova Etapa
                </button>
              </div>

              {/* Job Selector Box */}
              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-primary-blue" /> Configurando as Etapas de:
                  </label>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    {selectedJobId === 'default' || !currentJob
                      ? '⭐ Modelo Padrão da Empresa'
                      : 'Vaga selecionada no painel'}
                  </span>
                </div>

                {allCompanyJobs.length === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <span className="text-base">💡</span>
                      <span>Sua empresa não possui vagas abertas no momento. Você está editando o <strong>Modelo Padrão da Empresa</strong>.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewJobModal(true)}
                      className="btn btn-primary btn-sm text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Publicar Nova Vaga
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className={allCompanyJobs.length > 1 ? "md:col-span-7" : "md:col-span-12"}>
                    <select
                      value={selectedJobId}
                      onChange={e => setSelectedJobId(e.target.value === 'default' ? 'default' : (Number(e.target.value) || e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue shadow-2xs truncate"
                    >
                      {allCompanyJobs.length === 0 ? (
                        <option value="default">⭐ Modelo Padrão da Empresa (Todas as novas vagas)</option>
                      ) : (
                        <>
                          <optgroup label="Vagas da Sua Empresa">
                            {allCompanyJobs.map(job => (
                              <option key={job.id} value={job.id}>
                                {job.title} — {job.city || 'Ivaiporã'} ({job.type || 'Tempo Integral'})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Modelo Global">
                            <option value="default">⭐ Modelo Padrão da Empresa (Todas as novas vagas)</option>
                          </optgroup>
                        </>
                      )}
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
                  <span className="font-semibold">💡 Dica:</span>{' '}
                  {selectedJobId === 'default' || !currentJob ? (
                    <span>As etapas configuradas abaixo serão salvas como <strong>Modelo Padrão Global da Empresa</strong> para todas as próximas vagas.</span>
                  ) : (
                    <span>As etapas configuradas abaixo serão salvas exclusivamente para <strong>{currentJob.title}</strong>.</span>
                  )}
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
                  className="btn btn-outline btn-sm font-semibold text-xs order-3 md:order-1 flex items-center justify-center gap-1.5 rounded-xl"
                >
                  <RotateCcw size={13} /> Restaurar Padrões Desta Vaga
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 order-1 md:order-2">
                  <button
                    onClick={handleApplyCustomStagesToAllJobs}
                    className="btn btn-outline btn-sm font-bold text-xs flex items-center justify-center gap-1.5 border-gray-300 hover:border-primary-blue text-gray-700 dark:text-slate-200 rounded-xl"
                    title="Salvar e replicar estas etapas em todas as outras vagas da empresa"
                  >
                    <CheckSquare size={14} /> Aplicar a Todas as Vagas
                  </button>

                  <button
                    onClick={handleSaveCustomStagesForJob}
                    className="btn btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer rounded-xl"
                  >
                    <Save size={15} />{' '}
                    {selectedJobId === 'default' || !currentJob
                      ? 'Salvar Modelo Padrão da Empresa'
                      : 'Salvar Etapas Desta Vaga'}
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
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
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

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={18} className="text-emerald-500" /> Origem dos Talentos Inscritos
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">IFPR Campus Ivaiporã</span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-black">58% dos inscritos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">Univale Ivaiporã</span>
                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-black">27% dos inscritos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">UENP / Outras</span>
                    <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-black">15% dos inscritos</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" /> Tecnologias com Mais Afinidade
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['React (95%)', 'JavaScript (92%)', 'Tailwind (90%)', 'Git (88%)', 'Python (82%)', 'SQL (80%)', 'Figma (78%)'].map(item => (
                    <span key={item} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
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
                      className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-xl"
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
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 block mb-3">
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
                        <div className={`absolute top-3.5 right-1/2 w-full h-[3px] -translate-y-1/2 z-0 ${
                          isPast || isCurrent ? 'bg-primary-blue dark:bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
                        }`} />
                      )}
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                        isCurrent
                          ? 'bg-primary-blue text-white border-primary-blue shadow-md ring-4 ring-blue-100 dark:ring-blue-900/40 scale-110'
                          : isPast
                          ? 'bg-primary-blue text-white border-primary-blue'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {isPast ? <Check size={14} strokeWidth={4} /> : idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold mt-2.5 text-center leading-tight max-w-[80px] ${
                        isCurrent ? 'text-primary-blue dark:text-blue-400' : isPast ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {stage.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-gray-200 dark:border-slate-800 flex gap-4 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setActiveModalTab('overview')}
                className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'overview'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                }`}
              >
                <FileText size={14} /> Visão Geral &amp; Habilidades
              </button>

              <button
                onClick={() => setActiveModalTab('interview')}
                className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'interview'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                }`}
              >
                <Calendar size={14} /> Agendar Entrevista {selectedCandidate.interview && '✓'}
              </button>

              <button
                onClick={() => setActiveModalTab('endorsements')}
                className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'endorsements'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                }`}
              >
                <Award size={14} /> Pareceres Docentes ({selectedCandidate.endorsements?.length || 0})
              </button>

              <button
                onClick={() => setActiveModalTab('activity')}
                className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'activity'
                    ? 'border-primary-blue text-primary-blue'
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
                    <h4 className="font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                      Competências &amp; Habilidades Técnicas:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills?.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
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
                    
                    if (selectedCandidate.stage === 'aprovado' || selectedCandidate.stage === 'banco_talentos' || selectedCandidate.interview.concluida) {
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
                      <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                              <Calendar size={15} className="text-purple-600" /> Entrevista confirmada para {selectedCandidate.interview.date} às {selectedCandidate.interview.time}
                            </span>
                            {currentStatus && (
                              <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${currentStatus.color}`}>
                                <Icon size={10} className={currentStatus.pulse ? 'animate-pulse' : ''} /> {currentStatus.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                            Formato: {selectedCandidate.interview.format}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveModalTab('interview')}
                          className="btn btn-outline btn-sm text-xs font-bold rounded-xl border-purple-300 text-purple-700"
                        >
                          Alterar
                        </button>
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
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-0.5 rounded-full">
                        ✓ Já Marcada
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
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">WhatsApp / Telefone:</label>
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

      {/* Modal Padronizado LinkedIn / Gupy para Criação e Edição de Vagas */}
      <JobFormModal
        isOpen={showNewJobModal || Boolean(editingJob)}
        initialJob={editingJob}
        currentUser={currentUser}
        onClose={() => {
          setShowNewJobModal(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
      />

      {/* Modal Moderno para Encerrar ou Excluir Vaga (Substitui confirm nativo) */}
      <JobActionModal
        isOpen={Boolean(jobActionModalTarget)}
        onClose={() => setJobActionModalTarget(null)}
        job={jobActionModalTarget}
        onCloseJob={handleCloseJob}
        onDeleteJob={handleDeleteJob}
      />

    </div>
  );
}
