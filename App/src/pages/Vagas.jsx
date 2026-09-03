import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter, Plus, ChevronDown, X, Sparkles, SlidersHorizontal, RotateCcw, Briefcase, CheckCircle2, ArrowLeft, Clock, DollarSign, ShieldCheck } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  getJobs, addJob, getTalents, calculateMatchScore, CITIES, getJobById, safeSkillsArray,
  STANDARD_JOB_TITLES, STANDARD_SKILLS, SALARY_RANGES, WORK_SCHEDULES,
  STANDARD_BENEFITS, validateProfessionalText, getJobDescriptionTemplate,
  validateJobTitle, JOB_CATEGORIES
} from '../lib/ivaiConecta';
import { subscribeToJobs } from '../services/jobsService.js';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';

const TYPES = [
  { label: 'Todos os Tipos', value: 'Todos' },
  { label: 'Tempo Integral (CLT)', value: 'Tempo Integral' },
  { label: 'Meio Período', value: 'Meio Período' },
  { label: 'Estágio / Trainee', value: 'Estágio' },
  { label: 'Prestador de Serviço (PJ)', value: 'Prestador de Serviço' },
];

const MODALITIES = [
  { label: 'Todas as Modalidades', value: 'Todas' },
  { label: 'Presencial', value: 'Presencial' },
  { label: 'Híbrido', value: 'Híbrido' },
  { label: '100% Remoto', value: 'Remoto' },
];

const MATCH_RANGES = [
  { label: 'Qualquer % de Match', value: 0 },
  { label: '70%+ Match', value: 70 },
  { label: '80%+ Match', value: 80 },
  { label: '90%+ Match (Alta Afinidade)', value: 90 },
];

const POPULAR_SKILLS = [
  'React', 'JavaScript', 'Python', 'SQL', 'Excel Avançado',
  'Figma', 'Git', 'NR-10', 'Power BI', 'ERP', 'Marketing Digital'
];

export default function Vagas() {
  const { selectedCity, currentUser, showToast } = useAppStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [query,         setQuery]         = useState(params.get('q') || '');
  const [filterCity,    setFilterCity]    = useState(selectedCity);
  const [filterType,    setFilterType]    = useState('Todos');
  const [filterModality,setFilterModality]= useState('Todas');
  const [minMatch,      setMinMatch]      = useState(0);
  const [selectedSkills,setSelectedSkills]= useState([]);
  const [sortBy,        setSortBy]        = useState('match');
  const [showNewModal,  setShowModal]     = useState(params.get('action') === 'new');
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [selectedJob,   setSelectedJob]   = useState(null);

  const [refreshKey,    setRefreshKey]    = useState(0);

  // New Job Form State (Padrão LinkedIn / Gupy)
  const [newTitle,        setNewTitle]        = useState('');
  const [newType,         setNewType]         = useState('Tempo Integral');
  const [newModality,     setNewModality]     = useState('Presencial');
  const [newCity,         setNewCity]         = useState('Ivaiporã');
  const [newSalary,       setNewSalary]       = useState(SALARY_RANGES[0].value);
  const [newSchedule,     setNewSchedule]     = useState(WORK_SCHEDULES[0]);
  const [newSkillsList,   setNewSkillsList]   = useState(['Comunicação Assertiva', 'Trabalho em Equipe']);
  const [customSkillInput,setCustomSkillInput]= useState('');
  const [newDesc,         setNewDesc]         = useState('');
  const [newBenefits,     setNewBenefits]     = useState(['Vale Transporte (VT)', 'Vale Refeição / Alimentação (VR/VA)']);
  const [formError,       setFormError]       = useState('');

  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));

  useEffect(() => {
    const unsub = subscribeToJobs('Todas as Cidades', (data) => {
      if (Array.isArray(data)) setLiveJobs(data);
    });
    return () => unsub();
  }, []);

  const allJobs = Array.isArray(liveJobs) ? liveJobs : [];

  // Check jobId param in URL
  useEffect(() => {
    const jId = params.get('jobId');
    if (jId) {
      const found = getJobById(jId);
      if (found) setSelectedJob(found);
    }
  }, [params]);

  useEffect(() => {
    if (params.get('action') === 'new') {
      if (currentUser?.role === 'empresa') {
        setShowModal(true);
      } else {
        showToast('⚠️ Apenas empresas cadastradas podem publicar vagas.');
        setParams({});
      }
    }
  }, [params, currentUser]);

  useEffect(() => {
    if (selectedCity) {
      setFilterCity(selectedCity);
    }
  }, [selectedCity]);

  const toggleBenefit = (benefit) => {
    setNewBenefits(prev =>
      prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
    );
  };

  const addSkillTag = (skillToAdd) => {
    const cleanSkill = skillToAdd.trim();
    if (!cleanSkill) return;

    const val = validateProfessionalText(cleanSkill, 'Habilidade', 2, 40);
    if (!val.valid) {
      setFormError(val.error);
      return;
    }

    if (!newSkillsList.includes(cleanSkill)) {
      setNewSkillsList(prev => [...prev, cleanSkill]);
      setCustomSkillInput('');
      setFormError('');
    }
  };

  const removeSkillTag = (skillToRemove) => {
    setNewSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const fillDescriptionTemplate = () => {
    const template = getJobDescriptionTemplate(newTitle || 'Oportunidade Profissional', currentUser?.name || 'Nossa Empresa');
    setNewDesc(template);
    setFormError('');
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!currentUser || currentUser.role !== 'empresa') {
      showToast('⚠️ Apenas empresas cadastradas podem cadastrar e publicar vagas.');
      return;
    }

    // 1. Validação Profissional do Título de Trabalho (CBO / Mercado)
    const titleVal = validateJobTitle(newTitle);
    if (!titleVal.valid) {
      setFormError(titleVal.error);
      return;
    }

    // 2. Validação Profissional da Descrição
    const descVal = validateProfessionalText(newDesc, 'Descrição da Oportunidade', 30, 2500);
    if (!descVal.valid) {
      setFormError(descVal.error);
      return;
    }

    // 3. Validação de Habilidades
    if (newSkillsList.length === 0) {
      setFormError('Selecione pelo menos uma competência ou habilidade exigida para a vaga.');
      return;
    }

    const jobPayload = {
      title: newTitle.trim(),
      company: currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Empresa do Vale do Ivaí',
      companyLogo: currentUser?.avatar || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=150',
      isVerifiedCompany: currentUser?.isVerifiedCompany ?? true,
      city: newCity,
      type: newType,
      modality: newModality,
      salary: newSalary || 'A combinar',
      schedule: newSchedule,
      description: newDesc.trim() || 'Vaga publicada via Ivaí Conecta.',
      requiredSkills: newSkillsList && newSkillsList.length > 0 ? newSkillsList : ['Comunicação Assertiva', 'Trabalho em Equipe'],
      benefits: newBenefits.length > 0 ? newBenefits : ['Vale Transporte (VT)'],
      recruiterPhone: currentUser?.phone || '',
      recruiterEmail: currentUser?.email || '',
      createdBy: currentUser?.uid || currentUser?.id || currentUser?.email || 'empresa',
    };

    await addJob(jobPayload);
    showToast('🎉 Vaga homologada e publicada com sucesso! Ela já está visível para candidatos e no seu painel.');
    setShowModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewSkillsList(['Comunicação Assertiva', 'Trabalho em Equipe']);
    setNewBenefits(['Vale Transporte (VT)', 'Vale Refeição / Alimentação (VR/VA)']);
    setFormError('');
    setParams({});
    setRefreshKey(k => k + 1);
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const hasActiveFilters = query || (filterCity && filterCity !== 'Todas as Cidades') || filterType !== 'Todos' || filterModality !== 'Todas' || minMatch > 0 || selectedSkills.length > 0;

  const resetFilters = () => {
    setQuery('');
    setFilterCity('Todas as Cidades');
    setFilterType('Todos');
    setFilterModality('Todas');
    setMinMatch(0);
    setSelectedSkills([]);
    setSortBy('match');
  };

  const canSeeMatch = currentUser && (currentUser.role === 'aluno' || currentUser.role === 'candidato');
  const userSkills = useMemo(() => safeSkillsArray(currentUser?.skills), [currentUser?.skills]);

  const filtered = useMemo(() => {
    if (!Array.isArray(allJobs)) return [];

    return allJobs
      .filter(j => j && typeof j === 'object')
      .map(job => {
        const reqSkills = safeSkillsArray(job.requiredSkills);
        const score = canSeeMatch
          ? calculateMatchScore(userSkills, reqSkills, {
              userCity: currentUser?.city,
              jobCity: job.city,
              isVerifiedStudent: currentUser?.isVerifiedStudent,
              endorsementsCount: (currentUser?.endorsements?.length || currentUser?.endorsementCount || 0)
            })
          : null;
        return { ...job, requiredSkills: reqSkills, calculatedScore: score };
      })
      .filter(j => {
        // Cidade
        const filterCityClean = String(filterCity || '').trim().toLowerCase();
        const jCityClean = String(j.city || '').trim().toLowerCase();
        const matchCity = !filterCity || filterCity === 'Todas as Cidades' || jCityClean === filterCityClean;
        
        // Tipo
        const matchType = filterType === 'Todos' || (j.type && String(j.type).toLowerCase().includes(filterType.toLowerCase()));
        
        // Modalidade
        const matchModality = filterModality === 'Todas' || (j.modality && String(j.modality).toLowerCase().includes(filterModality.toLowerCase()));
        
        // Match Mínimo
        const matchScoreOk = !canSeeMatch || minMatch === 0 || (typeof j.calculatedScore === 'number' && j.calculatedScore >= minMatch);

        // Habilidades
        const matchSkillsOk = selectedSkills.length === 0 || selectedSkills.every(sk => 
          (j.requiredSkills || []).some(r => r && String(r).toLowerCase().includes(String(sk).toLowerCase()))
        );

        // Busca Textual
        const text = (
          String(j.title || '') + ' ' + 
          String(j.company || '') + ' ' + 
          String(j.description || '') + ' ' + 
          (j.requiredSkills || []).join(' ')
        ).toLowerCase();
        const matchText = !query || text.includes(query.toLowerCase());

        return matchCity && matchType && matchModality && matchScoreOk && matchSkillsOk && matchText;
      })
      .sort((a, b) => {
        if (sortBy === 'match' && canSeeMatch) {
          return (Number(b.calculatedScore) || 0) - (Number(a.calculatedScore) || 0);
        }
        if (sortBy === 'recent') {
          const timeA = a.createdAtTimestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0) || 0;
          const timeB = b.createdAtTimestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0) || 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [allJobs, filterCity, filterType, filterModality, minMatch, selectedSkills, query, sortBy, canSeeMatch, userSkills, currentUser]);

  return (
    <>
      {/* ── HEADER ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(0,82,255,0.25),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-accent-sky mb-4 backdrop-blur-md">
                <Sparkles size={14} /> Oportunidades no Vale do Ivaí
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-extrabold text-white mb-3 tracking-tight leading-tight">
                Vagas de Emprego &amp; Estágio Regional
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Encontre vagas em Ivaiporã e cidades vizinhas com cálculo automático de match de habilidades e indicação direta de professores parceiros.
              </p>
            </div>

            {currentUser?.role === 'empresa' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-teal px-6 py-3.5 font-bold shadow-lg shrink-0 flex items-center gap-2"
              >
                <Plus size={18} /> Publicar Nova Vaga
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container section">

        {/* ── BARRA DE FILTROS ── */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 mb-8 shadow-brand-sm space-y-4 transition-colors duration-300">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
            
            {/* Busca textual */}
            <div className="lg:col-span-4 flex items-center gap-2.5 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-gray-50/50 dark:bg-slate-800/50 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-primary-blue transition-all">
              <Search size={17} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cargo, empresa ou tecnologia..."
                className="text-sm text-gray-800 dark:text-white placeholder-gray-400 outline-none bg-transparent w-full"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 rounded-full">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Cidade */}
            <div className="lg:col-span-3">
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="form-control text-sm py-2.5 cursor-pointer"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tipo */}
            <div className="lg:col-span-3">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="form-control text-sm py-2.5 cursor-pointer"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Botão Filtros Avançados */}
            <div className="lg:col-span-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`btn w-full py-2.5 text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  showAdvanced || hasActiveFilters
                    ? 'border-primary-blue bg-primary-light text-primary-blue dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal size={14} /> Filtros {hasActiveFilters && '•'}
              </button>
            </div>

          </div>

          {/* Painel de Filtros Avançados */}
          {showAdvanced && (
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Modalidade */}
                <div>
                  <label className="form-label text-xs mb-1.5 block">Modalidade de Trabalho</label>
                  <select
                    value={filterModality}
                    onChange={e => setFilterModality(e.target.value)}
                    className="form-control text-xs py-2"
                  >
                    {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                {/* Match Mínimo (Alunos / Candidatos) */}
                {canSeeMatch && (
                  <div>
                    <label className="form-label text-xs mb-1.5 block">Nível de Match de Habilidades</label>
                    <select
                      value={minMatch}
                      onChange={e => setMinMatch(Number(e.target.value))}
                      className="form-control text-xs py-2"
                    >
                      {MATCH_RANGES.map(mr => <option key={mr.value} value={mr.value}>{mr.label}</option>)}
                    </select>
                  </div>
                )}

                {/* Ordenação */}
                <div>
                  <label className="form-label text-xs mb-1.5 block">Ordenar Vagas por</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="form-control text-xs py-2"
                  >
                    {canSeeMatch && <option value="match">Maior Match com Meu Perfil</option>}
                    <option value="recent">Mais Recentes Primeiro</option>
                  </select>
                </div>

              </div>

              {/* Habilidades Populares */}
              <div>
                <label className="form-label text-xs mb-2 block">Filtrar por Tecnologias &amp; Habilidades:</label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map(skill => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                        }`}
                      >
                        {skill} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── GRID DE VAGAS ── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma vaga encontrada com os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mb-5">Tente remover alguns filtros ou buscar por outro termo.</p>
            <button onClick={resetFilters} className="btn btn-outline btn-sm">
              <RotateCcw size={14} /> Restaurar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(j => (
              <JobCard
                key={j.id}
                job={j}
                matchScore={j.calculatedScore}
                onSelect={(jobObj) => setSelectedJob(jobObj)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail Job Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          matchScore={selectedJob.calculatedScore}
          onClose={() => {
            setSelectedJob(null);
            setParams({});
          }}
        />
      )}

      {/* New Job Modal */}
      {/* New Job Modal (Padrão LinkedIn / Gupy Profissional) */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-brand-xl w-full max-w-2xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <Briefcase size={22} className="text-primary-blue dark:text-blue-400" /> Publicar Oportunidade Profissional
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Formulário estruturado de vagas nos padrões de conformidade do Vale do Ivaí.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Banner da Empresa Publicadora */}
            <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-3.5">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=150'}
                alt={currentUser?.name || 'Empresa'}
                className="w-11 h-11 rounded-xl object-cover border border-primary-blue/30 shrink-0 bg-white"
              />
              <div className="min-w-0">
                <div className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Empresa Recrutadora Homologada</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                  {currentUser?.name || 'Sua Empresa'}
                  <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
                    <ShieldCheck size={11} /> CNPJ Verificado
                  </span>
                </div>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span> {formError}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              {/* Cargo / Título Padronizado */}
              <div className="form-group">
                <label className="form-label flex items-center justify-between">
                  <span className="font-bold">Cargo / Título da Oportunidade *</span>
                  {newTitle && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      validateJobTitle(newTitle).valid
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {validateJobTitle(newTitle).valid ? (
                        <>✓ Cargo Profissional Válido</>
                      ) : (
                        <>⚠️ Deve conter uma profissão / cargo real</>
                      )}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="job-titles-list"
                    value={newTitle}
                    onChange={e => { setNewTitle(e.target.value); setFormError(''); }}
                    className={`form-control text-sm font-semibold transition-all ${
                      newTitle && !validateJobTitle(newTitle).valid ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20' : ''
                    }`}
                    placeholder="Selecione ou busque um cargo (Ex: Desenvolvedor, Auxiliar Administrativo, Vendedor...)"
                    required
                  />
                  <datalist id="job-titles-list">
                    {STANDARD_JOB_TITLES.map(title => (
                      <option key={title} value={title} />
                    ))}
                  </datalist>
                </div>

                {newTitle && !validateJobTitle(newTitle).valid && newTitle.trim().length >= 3 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    💡 O título precisa especificar uma função ou ocupação de trabalho (ex.: <em>Auxiliar Administrativo</em>, <em>Vendedor(a)</em>, <em>Desenvolvedor(a)</em>, <em>Técnico(a)</em>, <em>Operador(a)</em>). Termos avulsos ou não relacionados a trabalho não são aceitos.
                  </p>
                )}

                {/* Sugestões Rápidas de Cargos */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-400 self-center font-medium">Cargos Populares:</span>
                  {[
                    'Desenvolvedor Front-end',
                    'Assistente Administrativo',
                    'Vendedor(a) Comercial',
                    'Atendente de Loja',
                    'Estagiário de TI / Software',
                    'Auxiliar Contábil',
                    'Operador(a) de Caixa',
                    'Eletricista Industrial',
                    'Técnico Agrícola'
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => { setNewTitle(sug); setFormError(''); }}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer font-medium ${
                        newTitle === sug
                          ? 'bg-primary-blue text-white border-primary-blue font-bold shadow-xs'
                          : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-primary-blue hover:text-primary-blue'
                      }`}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regime de Contratação & Modalidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label font-bold">Tipo de Contratação</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} className="form-control text-sm font-medium">
                    {TYPES.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold">Modalidade de Atuação</label>
                  <select value={newModality} onChange={e => setNewModality(e.target.value)} className="form-control text-sm font-medium">
                    {MODALITIES.slice(1).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Cidade & Faixa Salarial Padronizada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label font-bold">Município (Vale do Ivaí)</label>
                  <select value={newCity} onChange={e => setNewCity(e.target.value)} className="form-control text-sm font-medium">
                    {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold flex items-center justify-between">
                    <span>Faixa Salarial / Remuneração *</span>
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Padronizada</span>
                  </label>
                  <select
                    value={newSalary}
                    onChange={e => { setNewSalary(e.target.value); setFormError(''); }}
                    className="form-control text-sm font-semibold text-gray-800 dark:text-white"
                  >
                    {SALARY_RANGES.map(sal => (
                      <option key={sal.id} value={sal.value}>
                        {sal.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Horário de Trabalho Padronizado */}
              <div className="form-group">
                <label className="form-label font-bold">Jornada / Horário de Trabalho</label>
                <select
                  value={newSchedule}
                  onChange={e => setNewSchedule(e.target.value)}
                  className="form-control text-sm font-medium"
                >
                  {WORK_SCHEDULES.map(sch => (
                    <option key={sch} value={sch}>{sch}</option>
                  ))}
                </select>
              </div>

              {/* Habilidades e Competências Homologadas */}
              <div className="form-group">
                <label className="form-label flex items-center justify-between">
                  <span className="font-bold">Competências &amp; Habilidades Exigidas *</span>
                  <span className="text-[11px] font-normal text-gray-400">Usado no cálculo de compatibilidade Gupy</span>
                </label>

                {/* Habilidades Selecionadas */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-wrap gap-1.5 min-h-[46px] items-center mb-2">
                  {newSkillsList.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/60 text-primary-blue dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-2.5 py-1 rounded-xl text-xs font-bold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkillTag(skill)}
                        className="hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                        title="Remover"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {newSkillsList.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Nenhuma habilidade adicionada ainda. Clique nas sugestões abaixo:</span>
                  )}
                </div>

                {/* Banco de Sugestões de Habilidades */}
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1">
                  {STANDARD_SKILLS.slice(0, 16).map(s => {
                    const isSelected = newSkillsList.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => isSelected ? removeSkillTag(s) : addSkillTag(s)}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue hover:text-primary-blue'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{s}
                      </button>
                    );
                  })}
                </div>

                {/* Adicionar Habilidade Personalizada com Validação */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={e => setCustomSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkillTag(customSkillInput);
                      }
                    }}
                    placeholder="Digite outra competência profissional e pressione Adicionar..."
                    className="form-control text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => addSkillTag(customSkillInput)}
                    className="btn btn-outline btn-sm text-xs font-bold shrink-0"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Vales e Benefícios */}
              <div className="form-group">
                <label className="form-label block mb-1.5 font-bold">Vales &amp; Benefícios Oferecidos</label>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_BENEFITS.map(b => {
                    const isSelected = newBenefits.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBenefit(b)}
                        className={`text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 font-bold'
                            : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{b}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descrição Estruturada da Oportunidade */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label font-bold mb-0">Descrição da Oportunidade *</label>
                  <button
                    type="button"
                    onClick={fillDescriptionTemplate}
                    className="text-xs font-bold text-primary-blue dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={13} /> Usar Modelo Padrão LinkedIn / Gupy
                  </button>
                </div>
                <textarea
                  value={newDesc}
                  onChange={e => { setNewDesc(e.target.value); setFormError(''); }}
                  className="form-control font-sans text-xs sm:text-sm leading-relaxed"
                  rows={5}
                  placeholder="Descreva o papel, principais responsabilidades, requisitos e diferenciais..."
                  required
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>Mínimo 30 caracteres</span>
                  <span>{newDesc.length} caracteres digitados</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline btn-sm font-semibold">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Homologar &amp; Publicar Vaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
