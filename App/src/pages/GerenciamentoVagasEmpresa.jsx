import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle, CheckCircle2, Clock, ArrowRight,
  ArrowLeft, Plus, Users, Eye, Edit3, XCircle, RotateCcw, Phone, ShieldCheck,
  Award, Send, Check, X, FileText, Calendar, Sparkles, Star, Copy, Share2,
  Search, Filter, ExternalLink, ChevronRight, Download, Trash2,
  SlidersHorizontal, Video, AlertCircle, GraduationCap, LayoutGrid,
  ListFilter, MessageSquare, ChevronDown, Inbox, Settings, BarChart3,
  Layers, CheckSquare, Save, HelpCircle, UserCheck, GripVertical,
  ChevronLeft, UserPlus, ArrowUpRight, History, PhoneCall, DollarSign,
  Wand2, Zap, Lightbulb, HeartHandshake, Coffee, Tag, CheckCheck,
  Code, Rocket, Palette, Wrench, Utensils, Bus, HeartPulse, Smile,
  Laptop, Dumbbell, Shield, Coins, Gift, Globe, RefreshCw, AlertTriangle
} from 'lucide-react';
import {
  getJobs, addJob, updateJob, duplicateJob, deleteJob, updateJobStatus,
  getJobCandidates, updateCandidateStage, updateCandidateData,
  scheduleCandidateInterview, SELECTION_STAGES, calculateMatchScore,
  getCompanyCustomStages, saveCompanyCustomStages, getJobCustomStages,
  saveJobCustomStages, CITIES, reorderCandidateStage
} from '../lib/ivaiConecta';
import { subscribeToJobs } from '../services/jobsService';
import useAppStore from '../store/useAppStore';

// ── Modelos Rápidos de Vagas para Empresas da Região ──
const JOB_PRESETS = [
  {
    id: 'frontend_dev',
    label: 'Dev Front-end React Jr',
    icon: Code,
    title: 'Desenvolvedor(a) Front-end React Júnior',
    type: 'Tempo Integral',
    modality: 'Híbrido',
    level: 'Júnior',
    salary: 'R$ 2.500 - R$ 3.500 / mês',
    skills: ['React', 'JavaScript', 'HTML5/CSS3', 'Git', 'Tailwind CSS'],
    benefits: ['Vale Alimentação', 'Vale Transporte', 'Plano de Saúde', 'Horário Flexível'],
    workingHours: '08:00 às 17:30 (Segunda a Sexta)',
    description: 'Buscamos um desenvolvedor front-end talentoso e motivado para construir e manter interfaces modernas em React e Tailwind CSS para soluções corporativas da região do Vale do Ivaí.',
    responsibilities: [
      'Desenvolver e manter componentes reutilizáveis e responsivos em React',
      'Integrar APIs RESTful e serviços de dados com o backend',
      'Garantir excelente usabilidade e acessibilidade em telas mobile e desktop'
    ]
  },
  {
    id: 'admin_estagio',
    label: 'Estágio em Administração / Finanças',
    icon: BarChart3,
    title: 'Estagiário(a) em Administração & Finanças',
    type: 'Estágio',
    modality: 'Presencial',
    level: 'Estágio',
    salary: 'R$ 1.200 - R$ 1.600 / mês',
    skills: ['Excel Avançado', 'Gestão Financeira', 'ERP', 'Atendimento ao Cliente', 'Organização'],
    benefits: ['Bolsa Auxílio', 'Vale Transporte', 'Seguro de Vida', 'Auxílio Educação'],
    workingHours: '08:00 às 14:00 (Segunda a Sexta - 6h/dia)',
    description: 'Oportunidade para estudantes de Administração, Ciências Contábeis ou Gestão atuarem diretamente nas rotinas financeiras, conciliação e apoio administrativo de nossa empresa.',
    responsibilities: [
      'Auxiliar na conciliação bancária e lançamento de notas fiscais',
      'Elaborar e atualizar planilhas de controle financeiro em Excel',
      'Prestar suporte no atendimento a clientes e fornecedores'
    ]
  },
  {
    id: 'fullstack_dev',
    label: 'Dev Full Stack Node/Python',
    icon: Rocket,
    title: 'Desenvolvedor(a) Full Stack Pleno',
    type: 'Tempo Integral',
    modality: 'Remoto',
    level: 'Pleno',
    salary: 'R$ 4.500 - R$ 6.500 / mês',
    skills: ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'Git'],
    benefits: ['Vale Refeição', 'Plano de Saúde Unimed', 'Auxílio Home Office', 'TotalPass / Gympass', 'Horário Flexível'],
    workingHours: '09:00 às 18:00 (Flexível)',
    description: 'Vaga para desenvolvedor full stack experiente para arquitetar, desenvolver e escalar microsserviços e portais web com TypeScript, React e Node.js.',
    responsibilities: [
      'Desenvolver APIs REST escaláveis e microsserviços',
      'Modelar bancos de dados relacionais (PostgreSQL) e otimizar queries',
      'Participar de code reviews e decisões de arquitetura técnica'
    ]
  },
  {
    id: 'design_uiux',
    label: 'Designer UI/UX & Criativo',
    icon: Palette,
    title: 'Designer UI/UX & Criação Visual',
    type: 'Tempo Integral',
    modality: 'Híbrido',
    level: 'Júnior',
    salary: 'R$ 2.400 - R$ 3.200 / mês',
    skills: ['Figma', 'UI/UX Design', 'Photoshop', 'Branding', 'Canva', 'Social Media'],
    benefits: ['Vale Alimentação', 'Vale Transporte', 'Auxílio Cursos', 'Horário Flexível'],
    workingHours: '08:30 às 17:30 (Segunda a Sexta)',
    description: 'Responsável pela criação de fluxos de navegação, protótipos interativos no Figma e identidades visuais modernas para sistemas e campanhas.',
    responsibilities: [
      'Projetar wireframes e protótipos navegáveis de alta fidelidade no Figma',
      'Elaborar peças visuais e criativos para campanhas digitais',
      'Realizar testes rápidos de usabilidade com usuários finais'
    ]
  },
  {
    id: 'comercial_vendas',
    label: 'Consultor Comercial & Vendas',
    icon: Briefcase,
    title: 'Consultor(a) Comercial & Vendas B2B',
    type: 'Tempo Integral',
    modality: 'Presencial',
    level: 'Júnior',
    salary: 'R$ 2.200 + Comissões (R$ 3.500 - R$ 5.000)',
    skills: ['Vendas B2B', 'Negociação', 'CRM', 'Atendimento Comercial', 'Prospecção'],
    benefits: ['Comissão Atrativa', 'Vale Alimentação', 'Vale Combustível', 'Plano de Carreira'],
    workingHours: '08:00 às 18:00 (Segunda a Sexta)',
    description: 'Atuação na prospecção de novos clientes empresariais, agendamento de reuniões comerciais, apresentação de propostas e fechamento de contratos.',
    responsibilities: [
      'Realizar prospecção ativa de empresas no Vale do Ivaí',
      'Apresentar soluções e conduzir negociações de fechamento',
      'Acompanhar pipeline de vendas e pós-venda no CRM'
    ]
  },
  {
    id: 'suporte_ti',
    label: 'Suporte & Infra TI',
    icon: Wrench,
    title: 'Técnico(a) de Suporte e Infraestrutura TI',
    type: 'Tempo Integral',
    modality: 'Presencial',
    level: 'Júnior',
    salary: 'R$ 2.200 - R$ 2.900 / mês',
    skills: ['Redes de Computadores', 'Hardware', 'Windows Server', 'Linux', 'Atendimento Helpdesk'],
    benefits: ['Vale Refeição', 'Vale Transporte', 'Plano de Saúde', 'Auxílio Certificações'],
    workingHours: '08:00 às 18:00 (Segunda a Sexta)',
    description: 'Prestar atendimento a chamados de suporte a usuários, manutenção de microcomputadores, configuração de roteadores e cabeamento de rede.',
    responsibilities: [
      'Atender e resolver chamados técnicos locais e remotos',
      'Configurar estações de trabalho e equipamentos de rede',
      'Acompanhar rotinas de backup e segurança da informação'
    ]
  }
];

// Sugestões de Habilidades em alta no Vale do Ivaí
const POPULAR_SKILLS = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Git',
  'HTML5/CSS3', 'Tailwind CSS', 'SQL', 'PostgreSQL', 'Figma', 'UI/UX Design',
  'Excel Avançado', 'Gestão Financeira', 'ERP', 'Atendimento ao Cliente',
  'Redes de Computadores', 'Hardware', 'Vendas B2B', 'Marketing Digital',
  'AutoCAD', 'NR-10', 'Java', 'PHP', 'WordPress', 'Photoshop'
];

// Benefícios comuns oferecidos pelas empresas
const POPULAR_BENEFITS = [
  { id: 'va', name: 'Vale Alimentação / Refeição', icon: Utensils },
  { id: 'vt', name: 'Vale Transporte / Auxílio Combustível', icon: Bus },
  { id: 'saude', name: 'Plano de Saúde (Unimed/Clinipam)', icon: HeartPulse },
  { id: 'odonto', name: 'Plano Odontológico', icon: Smile },
  { id: 'flex', name: 'Horário Flexível', icon: Clock },
  { id: 'home', name: 'Auxílio Home Office', icon: Laptop },
  { id: 'gym', name: 'TotalPass / Gympass', icon: Dumbbell },
  { id: 'educacao', name: 'Bolsa de Estudos / Auxílio Cursos', icon: GraduationCap },
  { id: 'seguro', name: 'Seguro de Vida', icon: Shield },
  { id: 'carreira', name: 'Plano de Carreira Acelerado', icon: Rocket },
  { id: 'plr', name: 'Participação nos Lucros (PLR)', icon: Coins },
  { id: 'dayoff', name: 'Day Off no Aniversário', icon: Gift }
];

let isDraggingLock = false;

export default function GerenciamentoVagasEmpresa() {
  const { currentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [updateCount, forceUpdate] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

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
  const [viewMode, setViewMode] = useState('list');

  // Pipeline Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('todos');
  const [minMatchFilter, setMinMatchFilter] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyWithInterview, setOnlyWithInterview] = useState(false);
  const [onlyWithEndorsement, setOnlyWithEndorsement] = useState(false);

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
  const [customStages, setCustomStages] = useState(() => getJobCustomStages(currentJob?.id));

  useEffect(() => {
    if (currentJob) {
      setCustomStages(getJobCustomStages(currentJob.id));
    }
  }, [currentJob?.id, selectedJobId]);

  // Edit / New Job Modal State
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [newJobStep, setNewJobStep] = useState(1); // 1: Cargo & Regime | 2: Salário & Requisitos | 3: Descrição & Prévia
  const [newJobSkillInput, setNewJobSkillInput] = useState('');
  const [newJobBenefitInput, setNewJobBenefitInput] = useState('');
  const [newJobRespInput, setNewJobRespInput] = useState('');
  const [showLivePreviewToggle, setShowLivePreviewToggle] = useState(false);
  const [editingJobSkillInput, setEditingJobSkillInput] = useState('');
  const [editingJobBenefitInput, setEditingJobBenefitInput] = useState('');

  const [newJobForm, setNewJobForm] = useState({
    title: '',
    type: 'Tempo Integral',
    modality: 'Presencial',
    city: currentUser?.city || 'Ivaiporã',
    level: 'Júnior',
    salary: 'R$ 2.500 - R$ 3.500 / mês',
    workingHours: '08:00 às 18:00 (Segunda a Sexta)',
    recruiterPhone: currentUser?.phone || '5543999887766',
    requiredSkills: ['React', 'JavaScript', 'HTML5/CSS3', 'Git'],
    benefits: ['Vale Alimentação / Refeição', 'Vale Transporte / Auxílio Combustível', 'Plano de Saúde (Unimed/Clinipam)'],
    description: 'Buscamos um talento dedicado e proativo para compor nossa equipe e atuar no desenvolvimento de projetos e soluções inovadoras no Vale do Ivaí.',
    responsibilities: [
      'Desenvolver e manter soluções de software e interfaces responsivas',
      'Integrar APIs RESTful e serviços de dados com o backend',
      'Colaborar com a equipe no aprimoramento contínuo de produtos'
    ]
  });

  // Helpers for New Job Form
  const handleApplyPreset = (presetId) => {
    const preset = JOB_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setNewJobForm(prev => ({
      ...prev,
      title: preset.title,
      type: preset.type,
      modality: preset.modality,
      level: preset.level,
      salary: preset.salary,
      workingHours: preset.workingHours,
      requiredSkills: [...preset.skills],
      benefits: [...preset.benefits],
      description: preset.description,
      responsibilities: [...preset.responsibilities]
    }));
    showToast(`Modelo "${preset.label}" aplicado com sucesso!`);
  };

  const handleAddSkillToNewJob = (skill) => {
    const s = (skill || newJobSkillInput).trim();
    if (!s) return;
    const currentSkills = Array.isArray(newJobForm.requiredSkills) ? newJobForm.requiredSkills : [];
    if (!currentSkills.some(item => item.toLowerCase() === s.toLowerCase())) {
      setNewJobForm(prev => ({ ...prev, requiredSkills: [...currentSkills, s] }));
    }
    setNewJobSkillInput('');
  };

  const handleRemoveSkillFromNewJob = (skillToRemove) => {
    const currentSkills = Array.isArray(newJobForm.requiredSkills) ? newJobForm.requiredSkills : [];
    setNewJobForm(prev => ({
      ...prev,
      requiredSkills: currentSkills.filter(s => s !== skillToRemove)
    }));
  };

  const handleToggleBenefitInNewJob = (benefitName) => {
    const currentBenefits = Array.isArray(newJobForm.benefits) ? newJobForm.benefits : [];
    const exists = currentBenefits.includes(benefitName);
    if (exists) {
      setNewJobForm(prev => ({ ...prev, benefits: currentBenefits.filter(b => b !== benefitName) }));
    } else {
      setNewJobForm(prev => ({ ...prev, benefits: [...currentBenefits, benefitName] }));
    }
  };

  const handleAddCustomBenefitToNewJob = () => {
    const b = newJobBenefitInput.trim();
    if (!b) return;
    const currentBenefits = Array.isArray(newJobForm.benefits) ? newJobForm.benefits : [];
    if (!currentBenefits.includes(b)) {
      setNewJobForm(prev => ({ ...prev, benefits: [...currentBenefits, b] }));
    }
    setNewJobBenefitInput('');
  };

  const handleAddResponsibilityToNewJob = () => {
    const r = newJobRespInput.trim();
    if (!r) return;
    const currentResps = Array.isArray(newJobForm.responsibilities) ? newJobForm.responsibilities : [];
    setNewJobForm(prev => ({ ...prev, responsibilities: [...currentResps, r] }));
    setNewJobRespInput('');
  };

  const handleRemoveResponsibilityFromNewJob = (index) => {
    const currentResps = Array.isArray(newJobForm.responsibilities) ? newJobForm.responsibilities : [];
    setNewJobForm(prev => ({
      ...prev,
      responsibilities: currentResps.filter((_, i) => i !== index)
    }));
  };

  // ── Jobs List (Minhas Vagas) Tab State ──
  const [jobListSearch, setJobListSearch] = useState('');
  const [jobListStatusFilter, setJobListStatusFilter] = useState('todos'); // 'todos' | 'Ativa' | 'Encerrada'
  const [jobListModalityFilter, setJobListModalityFilter] = useState('todos'); // 'todos' | 'Presencial' | 'Híbrido' | 'Remoto'
  const [jobListTypeFilter, setJobListTypeFilter] = useState('todos'); // 'todos' | 'Tempo Integral' | 'Estágio' | 'Jovem Aprendiz'
  const [jobListSort, setJobListSort] = useState('recent'); // 'recent' | 'applicants_desc' | 'title_asc'
  const [jobListViewMode, setJobListViewMode] = useState('grid'); // 'grid' | 'table'

  // Metrics for Jobs List tab
  const jobListStats = useMemo(() => {
    const total = allCompanyJobs.length;
    const active = allCompanyJobs.filter(j => j.status === 'Ativa').length;
    const paused = total - active;
    let totalCandidates = 0;
    allCompanyJobs.forEach(j => {
      totalCandidates += getJobCandidates(j.id).length;
    });
    const avgCandidates = total > 0 ? (totalCandidates / total).toFixed(1) : 0;
    return { total, active, paused, totalCandidates, avgCandidates };
  }, [allCompanyJobs, updateCount]);

  // Filtered Company Jobs
  const filteredCompanyJobs = useMemo(() => {
    return allCompanyJobs.filter(job => {
      const search = jobListSearch.toLowerCase().trim();
      const matchSearch = !search ||
        job.title?.toLowerCase().includes(search) ||
        job.city?.toLowerCase().includes(search) ||
        job.type?.toLowerCase().includes(search) ||
        job.modality?.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search) ||
        (job.requiredSkills || []).some(s => s.toLowerCase().includes(search));

      const matchStatus = jobListStatusFilter === 'todos' ||
        (jobListStatusFilter === 'Ativa' ? job.status === 'Ativa' : job.status !== 'Ativa');

      const matchModality = jobListModalityFilter === 'todos' ||
        (job.modality || 'Presencial').toLowerCase().includes(jobListModalityFilter.toLowerCase());

      const matchType = jobListTypeFilter === 'todos' ||
        (job.type || '').toLowerCase().includes(jobListTypeFilter.toLowerCase());

      return matchSearch && matchStatus && matchModality && matchType;
    }).sort((a, b) => {
      if (jobListSort === 'applicants_desc') {
        const cA = getJobCandidates(a.id).length;
        const cB = getJobCandidates(b.id).length;
        return cB - cA;
      }
      if (jobListSort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [allCompanyJobs, jobListSearch, jobListStatusFilter, jobListModalityFilter, jobListTypeFilter, jobListSort, updateCount]);

  // ── Interview History Tab State ──
  const [historyViewMode, setHistoryViewMode] = useState('grid'); // 'grid' | 'table'
  const [historySearch, setHistorySearch] = useState('');
  const [historyJobFilter, setHistoryJobFilter] = useState('todos');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('todos'); // 'todos' | 'concluida' | 'banco_talentos' | 'agendada' | 'andamento' | 'atrasada'
  const [historyFormatFilter, setHistoryFormatFilter] = useState('todos'); // 'todos' | 'Google Meet' | 'Microsoft Teams' | 'Presencial' | 'Telefone'
  const [historySort, setHistorySort] = useState('recent'); // 'recent' | 'date_asc' | 'match_desc'

  // Helper to get interview status info for any candidate
  const getInterviewStatusInfo = (cand) => {
    if (!cand.interview) return null;
    const isCompleted = cand.stage === 'aprovado' || cand.stage === 'reprovado' || cand.stage === 'banco_talentos' || cand.interview.concluida;
    
    if (isCompleted) {
      if (cand.stage === 'reprovado' || cand.interview.result === 'banco_talentos') {
        return {
          id: 'banco_talentos',
          label: 'Finalizada (Banco de Talentos)',
          badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-700 dark:text-slate-300',
          icon: X,
        };
      }
      return {
        id: 'concluida',
        label: 'Concluída (Aprovado)',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        icon: CheckCircle2,
      };
    }

    if (cand.interview.roomCreated) {
      return {
        id: 'andamento',
        label: 'Em Andamento',
        badgeColor: 'bg-blue-50 text-primary-blue dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        dotColor: 'bg-blue-500',
        textColor: 'text-primary-blue dark:text-blue-400',
        icon: Video,
        pulse: true,
      };
    }

    if (cand.interview.date && cand.interview.time) {
      const [year, month, day] = cand.interview.date.split('-');
      const [hour, minute] = cand.interview.time.split(':');
      const interviewDate = new Date(year, month - 1, day, hour, minute);
      const diffMinutes = (now - interviewDate) / 60000;

      if (diffMinutes >= 0) {
        return {
          id: 'atrasada',
          label: 'Atrasada / Pendente',
          badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
          dotColor: 'bg-red-500',
          textColor: 'text-red-700 dark:text-red-400',
          icon: AlertCircle,
        };
      }
      return {
        id: 'agendada',
        label: 'Agendada',
        badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        dotColor: 'bg-purple-500',
        textColor: 'text-purple-700 dark:text-purple-300',
        icon: Calendar,
      };
    }

    return {
      id: 'agendada',
      label: 'Agendada',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      dotColor: 'bg-purple-500',
      textColor: 'text-purple-700 dark:text-purple-300',
      icon: Calendar,
    };
  };

  // All interviews across all company jobs
  const allInterviewsList = useMemo(() => {
    const list = [];
    allCompanyJobs.forEach(job => {
      const candidates = getJobCandidates(job.id);
      candidates.forEach(cand => {
        if (cand.interview && (cand.interview.date || cand.interview.format || cand.stage === 'entrevista' || cand.interview.concluida)) {
          list.push({
            ...cand,
            jobId: job.id,
            jobTitle: job.title,
            jobCity: job.city,
            jobType: job.type,
            jobModality: job.modality
          });
        }
      });
    });
    return list;
  }, [allCompanyJobs, updateCount]);

  // Interview stats for the tab
  const interviewStats = useMemo(() => {
    const total = allInterviewsList.length;
    let completed = 0;
    let talentPool = 0;
    let scheduled = 0;
    let inProgress = 0;

    allInterviewsList.forEach(cand => {
      const status = getInterviewStatusInfo(cand);
      if (status?.id === 'concluida') completed++;
      else if (status?.id === 'banco_talentos') talentPool++;
      else if (status?.id === 'andamento') inProgress++;
      else scheduled++;
    });

    const evaluated = completed + talentPool;
    const passRate = evaluated > 0 ? Math.round((completed / evaluated) * 100) : 0;

    return { total, completed, talentPool, scheduled, inProgress, passRate };
  }, [allInterviewsList, now]);

  // Filtered and sorted interviews
  const filteredInterviews = useMemo(() => {
    return allInterviewsList.filter(cand => {
      const search = historySearch.toLowerCase().trim();
      const matchSearch = !search ||
        cand.name?.toLowerCase().includes(search) ||
        cand.course?.toLowerCase().includes(search) ||
        cand.institution?.toLowerCase().includes(search) ||
        cand.jobTitle?.toLowerCase().includes(search) ||
        cand.city?.toLowerCase().includes(search) ||
        cand.notes?.toLowerCase().includes(search) ||
        cand.interview?.notes?.toLowerCase().includes(search);

      const matchJob = historyJobFilter === 'todos' || String(cand.jobId) === String(historyJobFilter);

      const statusInfo = getInterviewStatusInfo(cand);
      const matchStatus = historyStatusFilter === 'todos' || statusInfo?.id === historyStatusFilter;

      const matchFormat = historyFormatFilter === 'todos' || (cand.interview?.format || 'Google Meet').includes(historyFormatFilter);

      return matchSearch && matchJob && matchStatus && matchFormat;
    }).sort((a, b) => {
      if (historySort === 'match_desc') return (b.matchScore || 0) - (a.matchScore || 0);
      
      const getDateObj = (c) => {
        if (!c.interview?.date) return 0;
        const [y, m, d] = c.interview.date.split('-');
        const [h, min] = (c.interview.time || '00:00').split(':');
        return new Date(y, m - 1, d, h || 0, min || 0).getTime();
      };

      const dateA = getDateObj(a);
      const dateB = getDateObj(b);

      if (historySort === 'date_asc') return dateA - dateB;
      return dateB - dateA;
    });
  }, [allInterviewsList, historySearch, historyJobFilter, historyStatusFilter, historyFormatFilter, historySort, now]);

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
      const matchInterview = !onlyWithInterview || !!c.interview;
      const matchEndorsement = !onlyWithEndorsement || (c.endorsements && c.endorsements.length > 0);

      return matchText && matchStage && matchScore && matchVerified && matchInterview && matchEndorsement;
    });
  }, [jobCandidates, candidateSearch, selectedStageFilter, minMatchFilter, onlyVerified, onlyWithInterview, onlyWithEndorsement]);

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
    if (e) e.preventDefault();
    if (!editingJob || !editingJob.title?.trim()) {
      showToast('Por favor, informe o cargo / título da vaga.');
      return;
    }

    const skillsArray = Array.isArray(editingJob.requiredSkills) 
      ? editingJob.requiredSkills 
      : (editingJob.requiredSkills ? editingJob.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const benefitsArray = Array.isArray(editingJob.benefits)
      ? editingJob.benefits
      : (editingJob.benefits ? editingJob.benefits.split(',').map(b => b.trim()).filter(Boolean) : []);

    updateJob(editingJob.id, {
      ...editingJob,
      requiredSkills: skillsArray,
      benefits: benefitsArray
    });

    showToast('Alterações da vaga salvas com sucesso!');
    setEditingJob(null);
    forceUpdate(n => n + 1);
  };

  const handleCreateNewJob = (e) => {
    if (e) e.preventDefault();
    if (!newJobForm.title.trim()) {
      showToast('Por favor, informe o título da vaga.');
      setNewJobStep(1);
      return;
    }

    const skillsArray = Array.isArray(newJobForm.requiredSkills) 
      ? newJobForm.requiredSkills 
      : (newJobForm.requiredSkills ? newJobForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const benefitsArray = Array.isArray(newJobForm.benefits)
      ? newJobForm.benefits
      : (newJobForm.benefits ? newJobForm.benefits.split(',').map(b => b.trim()).filter(Boolean) : []);

    const responsibilitiesArray = Array.isArray(newJobForm.responsibilities)
      ? newJobForm.responsibilities.filter(r => r && r.trim())
      : (newJobForm.responsibilities ? newJobForm.responsibilities.split('\n').map(r => r.trim()).filter(Boolean) : []);

    const created = addJob({
      title: newJobForm.title.trim(),
      company: currentUser?.name || 'ValeTech Soluções Digitais',
      companyLogo: currentUser?.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250',
      type: newJobForm.type,
      modality: newJobForm.modality,
      city: newJobForm.city,
      level: newJobForm.level || 'Júnior',
      salary: newJobForm.salary || 'A Combinar',
      workingHours: newJobForm.workingHours || '08:00 às 18:00 (Segunda a Sexta)',
      recruiterPhone: newJobForm.recruiterPhone || currentUser?.phone || '5543999887766',
      requiredSkills: skillsArray.length > 0 ? skillsArray : ['Trabalho em Equipe', 'Comunicação'],
      benefits: benefitsArray.length > 0 ? benefitsArray : ['Vale Transporte'],
      description: newJobForm.description || 'Estamos em busca de talentos para compor nossa equipe em Ivaiporã e região.',
      responsibilities: responsibilitiesArray.length > 0 ? responsibilitiesArray : [
        'Atuar nas rotinas diárias do setor',
        'Contribuir com ideias e projetos da equipe'
      ],
      createdBy: currentUser?.uid || currentUser?.email || 'empresa',
      isVerifiedCompany: true
    });

    showToast('Nova vaga publicada com sucesso no Mural Regional!');
    setShowNewJobModal(false);
    setSelectedJobId(created.id);
    setActiveTab('jobs_list');
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
    showToast(`Etapas do funil salvas exclusivamente para a vaga: "${currentJob.title}"!`);
    forceUpdate(n => n + 1);
  };

  const handleApplyCustomStagesToAllJobs = () => {
    saveCompanyCustomStages(customStages);
    allCompanyJobs.forEach(job => {
      saveJobCustomStages(job.id, customStages);
    });
    showToast('Estas etapas foram salvas e aplicadas a TODAS as vagas da empresa!');
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

          {/* ── SUB-TABS NAVIGATION MINIMALISTA (ACIMA DAS INFORMAÇÕES) ── */}
          <div className="border-t border-gray-100 dark:border-slate-800/80 mt-6">
            <div className="flex items-center overflow-x-auto scrollbar-none gap-6 pt-1">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  activeTab === 'pipeline'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Layers size={16} /> Funil Kanban
              </button>

              <button
                onClick={() => setActiveTab('jobs_list')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  activeTab === 'jobs_list'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Briefcase size={16} /> Minhas Vagas ({allCompanyJobs.length})
              </button>

              <button
                onClick={() => setActiveTab('interview_history')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  activeTab === 'interview_history'
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
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  activeTab === 'stage_settings'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Settings size={16} /> Configurar Etapas
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
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
                    className={`w-full py-2.5 bg-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer ${
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

      <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ═════════════════════════════════════════════════════════════════
            TAB 1: FUNIL DE RECRUTAMENTO & PIPELINE (KANBAN ATS REVAMP)
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pipeline' && (
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
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      viewMode === 'kanban'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                    }`}
                  >
                    <LayoutGrid size={13} /> Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                    }`}
                  >
                    <ListFilter size={13} /> Lista
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Filter Badges Minimalist */}
            <div className="flex items-center gap-3 flex-wrap text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
              <span className="font-semibold text-gray-500 flex items-center gap-1 pl-1">
                <Filter size={13} /> Filtros:
              </span>

              <button
                onClick={() => setOnlyVerified(!onlyVerified)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  onlyVerified
                    ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white'
                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck size={13} className={onlyVerified ? "text-emerald-500" : ""} /> Selo IFPR
              </button>

              <button
                onClick={() => setOnlyWithInterview(!onlyWithInterview)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  onlyWithInterview
                    ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white'
                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Calendar size={13} className={onlyWithInterview ? "text-purple-500" : ""} /> Entrevista
              </button>
              
              <button
                onClick={() => setOnlyWithEndorsement(!onlyWithEndorsement)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  onlyWithEndorsement
                    ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white'
                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Award size={13} className={onlyWithEndorsement ? "text-amber-500" : ""} /> Docente
              </button>

              <div className="flex items-center gap-2 text-gray-500 ml-1 border-l border-gray-200 dark:border-slate-700 pl-4">
                <span className="font-medium">Match:</span>
                <select
                  value={minMatchFilter}
                  onChange={e => setMinMatchFilter(Number(e.target.value))}
                  className="bg-transparent font-semibold text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value={0}>Todos</option>
                  <option value={75}>&gt; 75%</option>
                  <option value={85}>&gt; 85%</option>
                  <option value={90}>&gt; 90%</option>
                </select>
              </div>

              {(candidateSearch || onlyVerified || onlyWithInterview || onlyWithEndorsement || minMatchFilter > 0) && (
                <button
                  onClick={() => {
                    setCandidateSearch('');
                    setOnlyVerified(false);
                    setOnlyWithInterview(false);
                    setOnlyWithEndorsement(false);
                    setMinMatchFilter(0);
                  }}
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium text-xs ml-auto flex items-center gap-1 cursor-pointer pr-1"
                >
                  <X size={12} /> Limpar
                </button>
              )}
            </div>

            {/* ═════════════════════════════════════════════════════════════
                MODERN KANBAN ATS BOARD (DRAG & DROP + LINEAR/ASHBY STYLE)
            ═════════════════════════════════════════════════════════════ */}
            {viewMode === 'kanban' && (
              <div className="overflow-x-auto pb-6 pt-1 min-w-full">
                <div className="flex gap-4.5 items-stretch min-w-max">
                  {customStages.map(stage => {
                    const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id);
                    const style = getStageStyle(stage.id, stage.color);
                    const isDragOver = dragOverStageId === stage.id;

                    return (
                      <div
                        key={stage.id}
                        onDragOver={e => handleDragOver(e, stage.id)}
                        onDragLeave={e => handleDragLeave(e, stage.id)}
                        onDrop={e => handleDrop(e, stage.id)}
                        className={`w-[330px] min-w-[330px] max-w-[330px] shrink-0 flex flex-col rounded-3xl p-3.5 transition-all duration-200 border shadow-sm ${
                          isDragOver
                            ? `${style.dropHighlight} ring-2 ring-primary-blue/60 scale-[1.01]`
                            : 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800/90'
                        }`}
                      >
                        {/* ── Column Header ── */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs mb-3.5 flex items-center justify-between gap-2">
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

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${style.badge}`}>
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
                                    className={`group relative bg-white dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 hover:border-primary-blue/60 dark:hover:border-blue-400 rounded-2xl p-3.5 shadow-2xs hover:shadow-brand-md transition-all duration-300 ease-out cursor-grab active:cursor-grabbing flex flex-col gap-2.5 ${
                                      isBeingDragged
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
                                        <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-primary-blue transition-colors leading-snug truncate">
                                          {cand.name}
                                        </h5>
                                        <div className="text-[11px] font-semibold text-primary-blue dark:text-blue-400 truncate mt-0.2">
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
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
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
                      {filteredCandidates.map(cand => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            TAB 2: LISTA E GESTÃO DE TODAS AS VAGAS DA EMPRESA (MINHAS VAGAS)
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'jobs_list' && (
          <div className="space-y-6">
            
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary-blue dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={13} /> Painel de Recrutamento
                  </span>
                  <span className="bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {filteredCompanyJobs.length} de {allCompanyJobs.length} vagas
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Minhas Vagas &amp; Processos Seletivos
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Gerencie o ciclo de vida dos processos seletivos, acompanhe o funil de candidatos e publique novas oportunidades.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* View Mode Toggle */}
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => setJobListViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      jobListViewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Visualização em Grade / Cards"
                  >
                    <LayoutGrid size={13} /> Cards
                  </button>
                  <button
                    onClick={() => setJobListViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      jobListViewMode === 'table'
                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Visualização em Tabela Detalhada"
                  >
                    <ListFilter size={13} /> Tabela
                  </button>
                </div>

                {/* Create New Job */}
                <button
                  onClick={() => setShowNewJobModal(true)}
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
                >
                  <Plus size={15} /> Publicar Nova Vaga
                </button>
              </div>
            </div>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Vagas Ativas</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {jobListStats.active} <span className="text-xs text-gray-400 font-normal">/ {jobListStats.total}</span>
                </div>
                <div className="text-[11px] text-emerald-600/80 font-semibold mt-0.5">Recebendo inscrições</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider">Total de Candidatos</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-primary-blue dark:text-blue-400 mt-2">{jobListStats.totalCandidates}</div>
                <div className="text-[11px] text-blue-500/80 font-semibold mt-0.5">Em todas as vagas</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Média por Vaga</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{jobListStats.avgCandidates}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Candidatos por processo</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pausadas / Encerradas</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-2">{jobListStats.paused}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Processos finalizados</div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar vaga, skills, cidade..."
                    value={jobListSearch}
                    onChange={e => setJobListSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-medium outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {jobListSearch && (
                    <button onClick={() => setJobListSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Modality Filter */}
                <div className="relative">
                  <select
                    value={jobListModalityFilter}
                    onChange={e => setJobListModalityFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    <option value="todos">Todas as Modalidades</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <select
                    value={jobListTypeFilter}
                    onChange={e => setJobListTypeFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    <option value="todos">Todos os Tipos de Contrato</option>
                    <option value="Tempo Integral">Tempo Integral (CLT)</option>
                    <option value="Estágio">Estágio</option>
                    <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                    <option value="Meio Período">Meio Período</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={jobListSort}
                    onChange={e => setJobListSort(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-gray-800 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                  >
                    <option value="recent">Mais Recentes Primeiro</option>
                    <option value="applicants_desc">Mais Candidaturas</option>
                    <option value="title_asc">Título (A-Z)</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Status Chips with Live Counters */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-gray-400 text-[11px] uppercase tracking-wider mr-1">Status:</span>
                {[
                  { id: 'todos', label: 'Todas as Vagas', count: jobListStats.total },
                  { id: 'Ativa', label: 'Ativas', count: jobListStats.active, dot: 'bg-emerald-500' },
                  { id: 'Encerrada', label: 'Pausadas / Encerradas', count: jobListStats.paused, dot: 'bg-slate-400' },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setJobListStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                      jobListStatusFilter === st.id
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st.dot && <span className={`w-2 h-2 rounded-full ${st.dot}`} />}
                    <span>{st.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      jobListStatusFilter === st.id
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs List / Grid / Empty State */}
            {filteredCompanyJobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center mx-auto">
                  <Briefcase size={24} />
                </div>
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white">
                  Nenhuma vaga encontrada
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                  Nenhuma vaga cadastrada corresponde aos filtros ou busca selecionados.
                </p>
                <button
                  onClick={() => {
                    setJobListSearch('');
                    setJobListStatusFilter('todos');
                    setJobListModalityFilter('todos');
                    setJobListTypeFilter('todos');
                  }}
                  className="btn btn-outline btn-sm font-bold text-xs rounded-xl cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : jobListViewMode === 'grid' ? (
              
              /* ─── GRID / CARDS VIEW COMPACTO ─── */
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {filteredCompanyJobs.map(job => {
                  const candidates = getJobCandidates(job.id);
                  const isActive = job.status === 'Ativa';

                  // Breakdown of stages
                  const triagemCount = candidates.filter(c => c.stage === 'triagem').length;
                  const desafioCount = candidates.filter(c => c.stage === 'desafio' || c.stage === 'teste').length;
                  const entrevistaCount = candidates.filter(c => c.stage === 'entrevista').length;
                  const aprovadosCount = candidates.filter(c => c.stage === 'aprovado').length;
                  const talentPoolCount = candidates.filter(c => c.stage === 'reprovado' || c.stage === 'banco_talentos').length;

                  const visibleSkills = (job.requiredSkills || []).slice(0, 3);
                  const extraSkillsCount = (job.requiredSkills || []).length - visibleSkills.length;

                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-primary-blue/50 dark:hover:border-blue-500/50 rounded-2xl p-4 sm:p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                    >
                      {/* Top Bar: Status + City + Modality */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border shrink-0 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {job.status}
                        </span>

                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">
                          <span className="flex items-center gap-0.5 text-primary-blue dark:text-blue-400 font-semibold truncate">
                            <MapPin size={11} className="shrink-0" /> {job.city}
                          </span>
                          <span>·</span>
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                            {job.modality || 'Presencial'}
                          </span>
                        </div>
                      </div>

                      {/* Title, Salary & Contract Type */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setActiveTab('pipeline');
                            }}
                            className="text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-primary-blue dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug truncate"
                            title={job.title}
                          >
                            {job.title}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                            {job.type}
                          </span>
                        </div>

                        {job.salary && (
                          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <DollarSign size={12} /> {job.salary}
                          </div>
                        )}

                        <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      {/* Required Skills Badges (Compact) */}
                      <div className="flex flex-wrap gap-1">
                        {visibleSkills.map(skill => (
                          <span
                            key={skill}
                            className="text-[10px] bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold"
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

                      {/* Pipeline Breakdown Box (Compact) */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {/* Candidate Avatars Stack */}
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {candidates.slice(0, 3).map((c, i) => (
                                <img
                                  key={c.id || i}
                                  src={c.avatar}
                                  alt={c.name}
                                  className="inline-block h-5 w-5 rounded-full ring-1.5 ring-white dark:ring-slate-900 object-cover bg-white dark:bg-slate-800"
                                />
                              ))}
                              {candidates.length === 0 && (
                                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] text-gray-400">
                                  0
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                              {candidates.length} {candidates.length === 1 ? 'candidato' : 'candidatos'}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-primary-blue dark:text-blue-400">
                            Funil do Processo
                          </span>
                        </div>

                        {/* Visual Stage Distribution Bar */}
                        {candidates.length > 0 ? (
                          <div className="space-y-1">
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                              {triagemCount > 0 && (
                                <div style={{ width: `${(triagemCount / candidates.length) * 100}%` }} className="bg-blue-500 h-full" title={`Triagem: ${triagemCount}`} />
                              )}
                              {desafioCount > 0 && (
                                <div style={{ width: `${(desafioCount / candidates.length) * 100}%` }} className="bg-amber-500 h-full" title={`Desafio: ${desafioCount}`} />
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

                            <div className="flex items-center justify-between text-[9px] font-medium text-gray-500 dark:text-slate-400 flex-wrap gap-1">
                              <span>Triagem ({triagemCount})</span>
                              <span>Desafio ({desafioCount})</span>
                              <span>Entrevista ({entrevistaCount})</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Aprovados ({aprovadosCount})</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 italic">
                            Sem candidaturas registradas
                          </div>
                        )}
                      </div>

                      {/* Action Footer (Compact) */}
                      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                        
                        {/* Primary CTA: Funil Kanban */}
                        <button
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setActiveTab('pipeline');
                          }}
                          className="btn btn-primary btn-sm text-[11px] font-bold px-2.5 py-1.5 flex items-center gap-1.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all"
                        >
                          <Layers size={13} /> Funil ({candidates.length})
                        </button>

                        {/* Tool Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingJob(job)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Editar Dados da Vaga"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            onClick={() => handleDuplicateJob(job.id)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Duplicar Processo Seletivo"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            onClick={() => handleShareJob(job)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Copiar Link de Divulgação"
                          >
                            <Share2 size={13} />
                          </button>

                          <button
                            onClick={() => handleToggleJobStatus(job.id, job.status)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isActive
                                ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
                            }`}
                            title={isActive ? 'Pausar Vaga' : 'Reabrir Vaga'}
                          >
                            {isActive ? <Clock size={13} /> : <RotateCcw size={13} />}
                          </button>

                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Excluir Vaga"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (

              /* ─── TABLE VIEW ─── */
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Vaga &amp; Modalidade</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Candidatos</th>
                        <th className="py-3.5 px-4">Salário &amp; Tipo</th>
                        <th className="py-3.5 px-4">Publicação</th>
                        <th className="py-3.5 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs">
                      {filteredCompanyJobs.map(job => {
                        const candidates = getJobCandidates(job.id);
                        const isActive = job.status === 'Ativa';

                        return (
                          <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            
                            {/* Vaga */}
                            <td className="py-3.5 px-4">
                              <div
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  setActiveTab('pipeline');
                                }}
                                className="font-bold text-sm text-gray-900 dark:text-white hover:text-primary-blue dark:hover:text-blue-400 cursor-pointer transition-colors"
                              >
                                {job.title}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{job.city}</span>
                                <span>·</span>
                                <span className="font-semibold text-primary-blue">{job.modality || 'Presencial'}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {job.status}
                              </span>
                            </td>

                            {/* Candidatos */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-extrabold text-sm text-primary-blue dark:text-blue-400">
                                {candidates.length} inscritos
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {candidates.filter(c => c.stage === 'aprovado').length} aprovados
                              </div>
                            </td>

                            {/* Salário & Tipo */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-semibold text-gray-900 dark:text-white">{job.salary || 'A combinar'}</div>
                              <div className="text-[11px] text-gray-400">{job.type}</div>
                            </td>

                            {/* Publicação */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 dark:text-slate-400">
                              {job.createdAt || '15/08/2026'}
                            </td>

                            {/* Ações */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedJobId(job.id);
                                    setActiveTab('pipeline');
                                  }}
                                  className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="Abrir Funil"
                                >
                                  <Layers size={13} /> Funil
                                </button>

                                <button
                                  onClick={() => setEditingJob(job)}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <button
                                  onClick={() => handleDuplicateJob(job.id)}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-pointer"
                                  title="Duplicar"
                                >
                                  <Copy size={13} />
                                </button>

                                <button
                                  onClick={() => handleShareJob(job)}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-pointer"
                                  title="Copiar Link"
                                >
                                  <Share2 size={13} />
                                </button>

                                <button
                                  onClick={() => handleToggleJobStatus(job.id, job.status)}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-pointer"
                                  title={isActive ? 'Pausar' : 'Reabrir'}
                                >
                                  {isActive ? <Clock size={13} /> : <RotateCcw size={13} />}
                                </button>

                                <button
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
                                  title="Excluir"
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      historyViewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Visualização em Grade / Cards"
                  >
                    <LayoutGrid size={13} /> Cards
                  </button>
                  <button
                    onClick={() => setHistoryViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      historyViewMode === 'table'
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
                  <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Entrevistas</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <History size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">{interviewStats.total}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Em todas as vagas da empresa</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Concluídas / Aprovadas</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{interviewStats.completed}</div>
                <div className="text-[11px] text-emerald-600/80 font-semibold mt-0.5">{interviewStats.passRate}% taxa de aprovação</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Banco de Talentos</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-2">{interviewStats.talentPool}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Disponíveis para futuras oportunidades</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider">Agendadas / Em Aberto</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-primary-blue dark:text-blue-400 mt-2">
                  {interviewStats.scheduled + interviewStats.inProgress}
                </div>
                <div className="text-[11px] text-blue-500/80 font-semibold mt-0.5">
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
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                      historyStatusFilter === st.id
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st.dot && <span className={`w-2 h-2 rounded-full ${st.dot}`} />}
                    <span>{st.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      historyStatusFilter === st.id
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
            TAB 4: CONFIGURAÇÕES DE ETAPAS DO PROCESSO SELETIVO POR VAGA
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
                  <Lightbulb size={13} className="text-amber-500 shrink-0" />
                  <span>As etapas configuradas abaixo serão salvas exclusivamente para <strong>{currentJob?.title}</strong>.</span>
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
                <Calendar size={14} /> Agendar Entrevista {selectedCandidate.interview && <Check size={13} className="text-emerald-600 inline" />}
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveModalTab('interview')}
                              className="btn btn-outline btn-sm text-xs font-bold rounded-xl border-purple-300 text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/40 cursor-pointer"
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
                            className="btn btn-sm text-xs font-bold bg-primary-blue hover:bg-blue-600 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Video size={13} /> Abrir Sala
                          </button>
                          <button
                            onClick={() => handleInterviewConcluded(selectedCandidate)}
                            className="btn btn-sm text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Aprovar candidato na entrevista e avançar para a próxima etapa"
                          >
                            <Check size={13} strokeWidth={3} /> Concluída (Passar Etapa)
                          </button>
                          <button
                            onClick={() => handleInterviewFinalized(selectedCandidate)}
                            className="btn btn-sm text-xs font-bold bg-slate-600 hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
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

      {/* ═════════════════════════════════════════════════════════════════
          MODAL: PUBLICAR NOVA VAGA (DESIGN PREMIUM & MULTI-STEP)
      ═════════════════════════════════════════════════════════════════ */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-blue to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Briefcase size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      Publicar Nova Oportunidade
                    </h3>
                    <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                      Mural do Vale do Ivaí
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Preencha os dados da vaga para atrair os melhores talentos e estudantes da região.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowNewJobModal(false);
                  setNewJobStep(1);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="px-5 sm:px-6 py-2.5 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center gap-2 overflow-x-auto shrink-0 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-300 shrink-0 flex items-center gap-1 text-[11px]">
                <Sparkles size={13} className="text-amber-500" /> Modelos Rápidos:
              </span>
              <div className="flex items-center gap-1.5 flex-nowrap">
                {JOB_PRESETS.map(preset => {
                  const PresetIcon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-primary-blue hover:text-white dark:hover:bg-primary-blue text-slate-700 dark:text-slate-300 border border-blue-200/70 dark:border-slate-700 text-[11px] font-semibold transition-all shrink-0 cursor-pointer shadow-2xs hover:shadow-xs inline-flex items-center gap-1.5"
                    >
                      <PresetIcon size={12} className="text-primary-blue" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Navigation Bar */}
            <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto w-full">
                {[
                  { step: 1, label: '1. Cargo & Regime', icon: Briefcase },
                  { step: 2, label: '2. Remuneração & Requisitos', icon: DollarSign },
                  { step: 3, label: '3. Descrição & Prévia Real', icon: FileText }
                ].map(item => {
                  const Icon = item.icon;
                  const isCurrent = newJobStep === item.step;
                  const isDone = newJobStep > item.step;

                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setNewJobStep(item.step)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                          : isDone
                          ? 'bg-blue-50 text-primary-blue dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {isDone && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              {/* Instant Preview Toggle */}
              <button
                type="button"
                onClick={() => setShowLivePreviewToggle(!showLivePreviewToggle)}
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border shrink-0 ${
                  showLivePreviewToggle
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-amber-400'
                }`}
                title="Alternar painel de prévia ao vivo"
              >
                <Eye size={14} />
                <span>{showLivePreviewToggle ? 'Ocultar Prévia' : 'Prévia ao Vivo'}</span>
              </button>
            </div>

            {/* Modal Body / Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              
              {/* ═════════════════════════════════════════════════════════
                  STEP 1: CARGO, NÍVEL E REGIME
              ═════════════════════════════════════════════════════════ */}
              {newJobStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  
                  {/* Job Title */}
                  <div>
                    <label className="font-bold text-gray-800 dark:text-slate-200 block mb-1.5 text-xs">
                      Título do Cargo / Função: <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Desenvolvedor Front-end React Júnior"
                        value={newJobForm.title}
                        onChange={e => setNewJobForm({ ...newJobForm, title: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-primary-blue text-gray-900 dark:text-white shadow-2xs"
                        required
                      />
                      <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="font-bold text-gray-800 dark:text-slate-200 block mb-1.5 text-xs">
                      Nível de Experiência:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista / Líder'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setNewJobForm({ ...newJobForm, level: lvl })}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            newJobForm.level === lvl
                              ? 'bg-primary-blue text-white border-primary-blue shadow-xs scale-[1.02]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contract Type (Cards) */}
                  <div>
                    <label className="font-bold text-gray-800 dark:text-slate-200 block mb-1.5 text-xs">
                      Tipo de Contrato / Regime:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        { id: 'Tempo Integral', title: 'Tempo Integral (CLT)', desc: '40h a 44h semanais com carteira assinada' },
                        { id: 'Estágio', title: 'Estágio Remunerado', desc: 'Até 6h diárias para estudantes IFPR/Univale/UENP' },
                        { id: 'Prestador de Serviço', title: 'Prestador de Serviço (PJ)', desc: 'Contrato PJ / Freelancer com emissão de NF' },
                        { id: 'Meio Período', title: 'Meio Período', desc: 'Jornada parcial (20h a 30h semanais)' }
                      ].map(typeItem => (
                        <div
                          key={typeItem.id}
                          onClick={() => setNewJobForm({ ...newJobForm, type: typeItem.id })}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            newJobForm.type === typeItem.id
                              ? 'bg-blue-50/80 dark:bg-blue-950/60 border-primary-blue dark:border-blue-600 shadow-xs ring-2 ring-primary-blue/20'
                              : 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-gray-900 dark:text-white">{typeItem.title}</span>
                            <input
                              type="radio"
                              name="jobType"
                              checked={newJobForm.type === typeItem.id}
                              onChange={() => {}}
                              className="accent-primary-blue pointer-events-none"
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-snug">{typeItem.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modality (Cards) */}
                  <div>
                    <label className="font-bold text-gray-800 dark:text-slate-200 block mb-1.5 text-xs">
                      Modalidade de Trabalho:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'Presencial', title: 'Presencial', icon: Building2, desc: 'Atuação física na sede ou filial da empresa' },
                        { id: 'Híbrido', title: 'Híbrido', icon: RefreshCw, desc: 'Flexibilidade entre presencial e home office' },
                        { id: 'Remoto', title: '100% Remoto', icon: Globe, desc: 'Trabalho integral à distância de qualquer lugar' }
                      ].map(modItem => {
                        const ModIcon = modItem.icon;
                        return (
                          <div
                            key={modItem.id}
                            onClick={() => setNewJobForm({ ...newJobForm, modality: modItem.id })}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              newJobForm.modality === modItem.id
                                ? 'bg-blue-50/80 dark:bg-blue-950/60 border-primary-blue dark:border-blue-600 shadow-xs ring-2 ring-primary-blue/20'
                                : 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                <ModIcon size={13} className="text-primary-blue shrink-0" />
                                {modItem.title}
                              </span>
                              <input
                                type="radio"
                                name="jobModality"
                                checked={newJobForm.modality === modItem.id}
                                onChange={() => {}}
                                className="accent-primary-blue pointer-events-none"
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-snug">{modItem.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* City & Working Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="font-bold text-gray-800 dark:text-slate-200 block mb-1 text-xs">
                        Cidade Polo no Vale do Ivaí:
                      </label>
                      <div className="relative">
                        <select
                          value={newJobForm.city}
                          onChange={e => setNewJobForm({ ...newJobForm, city: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <MapPin size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-gray-800 dark:text-slate-200 block mb-1 text-xs">
                        Carga Horária &amp; Dias:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 08:00 às 18:00 (Segunda a Sexta)"
                        value={newJobForm.workingHours}
                        onChange={e => setNewJobForm({ ...newJobForm, workingHours: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-primary-blue"
                      />
                    </div>
                  </div>

                  {/* Recruiter Phone */}
                  <div>
                    <label className="font-bold text-gray-800 dark:text-slate-200 block mb-1 text-xs">
                      WhatsApp / Telefone de Contato da Empresa:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="5543999887766"
                        value={newJobForm.recruiterPhone}
                        onChange={e => setNewJobForm({ ...newJobForm, recruiterPhone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-primary-blue"
                      />
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Utilizado para envio de mensagens automáticas de agendamento e contato direto.
                    </span>
                  </div>

                </div>
              )}

              {/* ═════════════════════════════════════════════════════════
                  STEP 2: REMUNERAÇÃO, HABILIDADES E BENEFÍCIOS
              ═════════════════════════════════════════════════════════ */}
              {newJobStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* Salary Section */}
                  <div className="space-y-2">
                    <label className="font-bold text-gray-800 dark:text-slate-200 block text-xs">
                      Faixa Salarial / Bolsa-Auxílio:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: R$ 2.500 - R$ 3.500 / mês"
                        value={newJobForm.salary}
                        onChange={e => setNewJobForm({ ...newJobForm, salary: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-primary-blue text-emerald-600 dark:text-emerald-400 shadow-2xs"
                      />
                      <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                    </div>

                    {/* Salary Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Sugestões:</span>
                      {[
                        'R$ 1.200 - R$ 1.600 / mês (Estágio)',
                        'R$ 2.200 - R$ 3.000 / mês',
                        'R$ 3.500 - R$ 5.000 / mês',
                        'R$ 5.500 - R$ 7.500 / mês',
                        'A Combinar'
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNewJobForm({ ...newJobForm, salary: sug })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 text-[10px] font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Required Skills (Interactive Chips & Adder) */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800">
                    <div>
                      <label className="font-bold text-gray-800 dark:text-slate-200 block text-xs mb-0.5">
                        Competências &amp; Habilidades Requeridas ({newJobForm.requiredSkills.length} selecionadas):
                      </label>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        O algoritmo de afinidade usará essas tags para calcular a pontuação de Match com os candidatos.
                      </p>
                    </div>

                    {/* Skill Adder Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Digite uma competência (ex: Node.js, Excel, Vendas) e tecle Enter..."
                        value={newJobSkillInput}
                        onChange={e => setNewJobSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkillToNewJob();
                          }
                        }}
                        className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-primary-blue"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillToNewJob()}
                        className="btn btn-primary btn-sm px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus size={14} /> Adicionar
                      </button>
                    </div>

                    {/* Active Skills Chips */}
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-700">
                      {newJobForm.requiredSkills.length === 0 ? (
                        <span className="text-gray-400 italic text-[11px]">Nenhuma habilidade adicionada ainda. Clique nas sugestões abaixo!</span>
                      ) : (
                        newJobForm.requiredSkills.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/70 text-primary-blue dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 shadow-2xs animate-in zoom-in-95 duration-100"
                          >
                            <Tag size={11} />
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillFromNewJob(skill)}
                              className="text-blue-400 hover:text-red-500 rounded-full cursor-pointer ml-0.5"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Popular Regional Skills Cloud */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                        <Lightbulb size={12} className="text-amber-500" /> Sugestões Rápidas de Habilidades no Vale do Ivaí (clique para incluir):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {POPULAR_SKILLS.map(skill => {
                          const isAlreadyAdded = newJobForm.requiredSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                          return (
                            <button
                              key={skill}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => handleAddSkillToNewJob(skill)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                                isAlreadyAdded
                                  ? 'bg-gray-100 text-gray-400 border-transparent dark:bg-slate-800 dark:text-slate-500 opacity-60 cursor-not-allowed'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-blue-50 hover:border-primary-blue hover:text-primary-blue'
                              }`}
                            >
                              + {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Benefits Selection Grid */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800">
                    <div>
                      <label className="font-bold text-gray-800 dark:text-slate-200 block text-xs mb-0.5">
                        Pacote de Benefícios Oferecidos:
                      </label>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Marque todos os benefícios inclusos nesta oportunidade.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {POPULAR_BENEFITS.map(b => {
                        const isChecked = newJobForm.benefits.includes(b.name);
                        const BenefitIcon = b.icon;
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleToggleBenefitInNewJob(b.name)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:border-gray-300'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 text-xs truncate">
                              <BenefitIcon size={14} className={isChecked ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"} />
                              <span className="truncate">{b.name}</span>
                            </span>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-slate-600'
                            }`}>
                              {isChecked && <Check size={11} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Benefit Adder */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                      <input
                        type="text"
                        placeholder="Outro benefício (ex: Gympass, Day-off)..."
                        value={newJobBenefitInput}
                        onChange={e => setNewJobBenefitInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomBenefitToNewJob();
                          }
                        }}
                        className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomBenefitToNewJob}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ═════════════════════════════════════════════════════════
                  STEP 3: DESCRIÇÃO, RESPONSABILIDADES E PRÉVIA
              ═════════════════════════════════════════════════════════ */}
              {newJobStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-150">
                  
                  {/* Left Column: Description & Responsibilities */}
                  <div className={showLivePreviewToggle ? "lg:col-span-6 space-y-4" : "lg:col-span-7 space-y-4"}>
                    
                    {/* Description Text */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-gray-800 dark:text-slate-200 text-xs">
                          Descrição Geral da Oportunidade:
                        </label>
                        <span className="text-[10px] text-gray-400">
                          {newJobForm.description.length} caracteres
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Descreva o contexto da vaga, ambiente de trabalho, desafios do time e o que a empresa busca..."
                        value={newJobForm.description}
                        onChange={e => setNewJobForm({ ...newJobForm, description: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-3 text-xs leading-relaxed outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Responsibilities Items */}
                    <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800">
                      <label className="font-bold text-gray-800 dark:text-slate-200 block text-xs">
                        Principais Responsabilidades &amp; Atividades:
                      </label>

                      {/* List of active responsibilities */}
                      <div className="space-y-1.5">
                        {(newJobForm.responsibilities || []).map((resp, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs">
                            <span className="w-4 h-4 rounded-full bg-primary-blue text-white text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="flex-1 font-medium text-gray-800 dark:text-slate-200">{resp}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveResponsibilityFromNewJob(idx)}
                              className="text-gray-400 hover:text-red-500 cursor-pointer"
                              title="Remover este item"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new responsibility */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Adicionar nova atividade/responsabilidade..."
                          value={newJobRespInput}
                          onChange={e => setNewJobRespInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddResponsibilityToNewJob();
                            }
                          }}
                          className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddResponsibilityToNewJob}
                          className="px-3 py-1.5 bg-primary-blue text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Live Interactive Card Preview */}
                  <div className={showLivePreviewToggle ? "lg:col-span-6 space-y-3" : "lg:col-span-5 space-y-3"}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-blue flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" /> Prévia Real do Mural de Vagas
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">Visão dos alunos &amp; candidatos</span>
                    </div>

                    {/* Job Card Replica */}
                    <div className="bg-white dark:bg-slate-900 border-2 border-primary-blue/30 dark:border-blue-500/40 rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-primary-blue text-white text-[9px] font-black uppercase tracking-wider px-3 py-0.8 rounded-bl-xl shadow-xs">
                        Ao Vivo · Mural Regional
                      </div>

                      {/* Top Company Info */}
                      <div className="flex items-start gap-3 pt-1">
                        <img
                          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'}
                          alt="Empresa"
                          className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-slate-700 shadow-2xs shrink-0 bg-white"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-gray-900 dark:text-white">
                              {currentUser?.name || 'ValeTech Soluções Digitais'}
                            </span>
                            <ShieldCheck size={13} className="text-emerald-500" />
                          </div>
                          <h4 className="font-heading font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-snug mt-0.5">
                            {newJobForm.title || 'Título da Vaga'}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-primary-blue font-semibold">
                              <MapPin size={12} /> {newJobForm.city}
                            </span>
                            <span>·</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.2 rounded font-semibold text-slate-700 dark:text-slate-300">
                              {newJobForm.modality}
                            </span>
                            <span>·</span>
                            <span className="bg-blue-50 dark:bg-blue-950 text-primary-blue px-2 py-0.2 rounded font-bold">
                              {newJobForm.level || 'Júnior'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Salary Tag */}
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Remuneração Oferecida:</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                          {newJobForm.salary || 'A Combinar'}
                        </span>
                      </div>

                      {/* Description Snippet */}
                      <p className="text-[11px] text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed italic">
                        "{newJobForm.description || 'Descrição detalhada das atividades e diferenciais...'}"
                      </p>

                      {/* Required Skills Badges */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Tecnologias &amp; Habilidades:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(newJobForm.requiredSkills || []).map(skill => (
                            <span
                              key={skill}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Benefits Badges */}
                      {newJobForm.benefits && newJobForm.benefits.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Benefícios Inclusos:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {newJobForm.benefits.slice(0, 4).map(b => (
                              <span
                                key={b}
                                className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1"
                              >
                                <Check size={10} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />
                                {b}
                              </span>
                            ))}
                            {newJobForm.benefits.length > 4 && (
                              <span className="text-[10px] text-gray-400 font-bold py-0.5">
                                +{newJobForm.benefits.length - 4} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Preview Button */}
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 rounded-xl bg-gray-900 text-white font-bold text-xs opacity-80 cursor-not-allowed text-center"
                      >
                        Candidatar-se à Vaga (Modo Candidato)
                      </button>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewJobModal(false);
                    setNewJobStep(1);
                  }}
                  className="btn btn-outline btn-sm text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  Etapa {newJobStep} de 3
                </span>
              </div>

              <div className="flex items-center gap-2">
                {newJobStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setNewJobStep(prev => prev - 1)}
                    className="btn btn-outline btn-sm text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Voltar
                  </button>
                )}

                {newJobStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (newJobStep === 1 && !newJobForm.title.trim()) {
                        showToast('Por favor, informe o cargo/título da vaga.');
                        return;
                      }
                      setNewJobStep(prev => prev + 1);
                    }}
                    className="btn btn-primary btn-sm px-5 py-2 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-brand-sm"
                  >
                    <span>Próximo Passo</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateNewJob}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Sparkles size={15} />
                    <span>Publicar Vaga no Mural Regional</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL: EDITAR VAGA EXISTENTE (UPGRADED)
      ═════════════════════════════════════════════════════════════════ */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-blue text-white flex items-center justify-center">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                    Editar Dados da Vaga
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Atualize os requisitos, salário, status e informações para os candidatos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingJob(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveJobEdit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Title */}
              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Título do Cargo / Função:</label>
                <input
                  type="text"
                  value={editingJob.title}
                  onChange={e => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-primary-blue"
                  required
                />
              </div>

              {/* Status & Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Status do Processo:</label>
                  <select
                    value={editingJob.status}
                    onChange={e => setEditingJob({ ...editingJob, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Ativa">Ativa (Recebendo Inscrições)</option>
                    <option value="Pausada">Pausada</option>
                    <option value="Encerrada">Encerrada</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Faixa Salarial / Bolsa:</label>
                  <input
                    type="text"
                    value={editingJob.salary || ''}
                    onChange={e => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                  />
                </div>
              </div>

              {/* Modality & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Modalidade:</label>
                  <select
                    value={editingJob.modality || 'Presencial'}
                    onChange={e => setEditingJob({ ...editingJob, modality: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">100% Remoto</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Cidade:</label>
                  <select
                    value={editingJob.city || 'Ivaiporã'}
                    onChange={e => setEditingJob({ ...editingJob, city: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skills Editor */}
              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">
                  Competências Requeridas (tags):
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Adicionar habilidade..."
                    value={editingJobSkillInput}
                    onChange={e => setEditingJobSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const s = editingJobSkillInput.trim();
                        if (s) {
                          const cur = Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills : [];
                          if (!cur.includes(s)) {
                            setEditingJob({ ...editingJob, requiredSkills: [...cur, s] });
                          }
                          setEditingJobSkillInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const s = editingJobSkillInput.trim();
                      if (s) {
                        const cur = Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills : [];
                        if (!cur.includes(s)) {
                          setEditingJob({ ...editingJob, requiredSkills: [...cur, s] });
                        }
                        setEditingJobSkillInput('');
                      }
                    }}
                    className="px-3 py-2 bg-primary-blue text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                  {(Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills : (editingJob.requiredSkills ? editingJob.requiredSkills.split(',') : [])).map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-0.8 bg-blue-50 text-primary-blue dark:bg-blue-950 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills : [];
                          setEditingJob({ ...editingJob, requiredSkills: cur.filter(item => item !== skill) });
                        }}
                        className="text-blue-400 hover:text-red-500 cursor-pointer ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-gray-700 dark:text-slate-300 block mb-1">Descrição e Responsabilidades:</label>
                <textarea
                  rows={4}
                  value={editingJob.description || ''}
                  onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs leading-relaxed outline-none text-gray-900 dark:text-white"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="btn btn-outline btn-sm rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-6 py-2.5 font-bold rounded-xl shadow-brand-sm text-xs"
                >
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
