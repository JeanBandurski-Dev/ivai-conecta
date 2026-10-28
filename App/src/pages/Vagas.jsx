import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Plus, X, Sparkles, SlidersHorizontal, RotateCcw, Check, Wrench, Bookmark, Briefcase } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  calculateMatchScore, CITIES, getJobById, safeSkillsArray, matchCity,
  useJobs, UserRole, WorkplaceType, isJobFavorited
} from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';
import PublishJobModal from '../components/PublishJobModal';
import CustomSelect from '../components/ui/CustomSelect';

const TYPES = [
  { label: 'Todos os Tipos', value: 'Todos' },
  { label: 'Tempo Integral (CLT)', value: 'Tempo Integral' },
  { label: 'Meio Período', value: 'Meio Período' },
  { label: 'Estágio / Trainee', value: 'Estágio' },
  { label: 'Prestador de Serviço (PJ)', value: 'Prestador de Serviço' },
];

const MODALITIES = [
  { label: 'Todas as Modalidades', value: 'Todas' },
  { label: 'Presencial', value: WorkplaceType.PRESENCIAL },
  { label: 'Híbrido', value: WorkplaceType.HIBRIDO },
  { label: '100% Remoto', value: WorkplaceType.REMOTO },
];

const MATCH_RANGES = [
  { label: 'Qualquer % de Match', value: 0 },
  { label: '70%+ Match', value: 70 },
  { label: '80%+ Match', value: 80 },
  { label: '90%+ Match (Alta Afinidade)', value: 90 },
];

// Áreas de atuação para filtro rápido. As palavras-chave (sem acento, minúsculas) são comparadas
// com o título e as habilidades exigidas da vaga (alinhadas à taxonomia em services/jobTaxonomy.js).
const JOB_AREAS = [
  { label: 'Tecnologia', keywords: ['javascript', 'typescript', 'react', 'node', 'python', 'php', 'java', 'c#', 'c++', 'sql', 'git', 'docker', 'aws', 'azure', 'linux', 'html', 'figma', 'ui/ux', 'power bi', 'tableau', 'programa', 'desenvolvedor', 'software', 'informatica', 'suporte tecnico', 'dados'] },
  { label: 'Agronegócio', keywords: ['agro', 'agric', 'pastage', 'trator', 'zootecn', 'rural', 'plantio', 'colheita', 'pecuar', 'veterin'] },
  { label: 'Indústria & Logística', keywords: ['nr-', 'empilhadeira', 'solda', 'manutencao', 'usinagem', 'cnc', 'logistica', 'estoque', 'almoxarifado', 'expedicao', 'maquinas', 'producao', 'autocad', 'cnh'] },
  { label: 'Comércio & Vendas', keywords: ['vendas', 'vendedor', 'atendimento', 'negociacao', 'pos-venda', 'prospeccao', 'marketing', 'redes sociais', 'trafego', 'google ads', 'meta ads', 'copywriting', 'seo', 'crm'] },
  { label: 'Administrativo & Financeiro', keywords: ['administrativ', 'financeir', 'contab', 'fiscal', 'contas a pagar', 'fluxo de caixa', 'departamento pessoal', 'recrutamento', 'excel', 'pacote office', 'erp', 'sap', 'totvs'] },
  { label: 'Saúde', keywords: ['enfermagem', 'socorros', 'farmac', 'saude', 'cuidador', 'hospitalar', 'clinic'] },
  { label: 'Educação', keywords: ['didatica', 'ensino', 'pedagog', 'professor', 'educa'] },
];

const normalizeText = (value) =>
  String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Vagas() {
  const { selectedCity, currentUser, showToast, favoriteJobs = [] } = useAppStore();
  const [params, setParams] = useSearchParams();

  const tabParam = params.get('tab');
  const initialTab = tabParam === 'favorites' || tabParam === 'salvas' ? 'favorites' : 'all';
  const [activeTab,     setActiveTab]     = useState(initialTab); // 'all' | 'favorites'

  const [query,         setQuery]         = useState(params.get('q') || '');
  const [filterCity,    setFilterCity]    = useState(selectedCity);
  const [filterType,    setFilterType]    = useState('Todos');
  const [filterModality,setFilterModality]= useState('Todas');
  const [minMatch,      setMinMatch]      = useState(0);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [sortBy,        setSortBy]        = useState('match');
  const [showNewModal,  setShowModal]     = useState(params.get('action') === 'new');
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [selectedJob,   setSelectedJob]   = useState(null);

  const { jobs: allJobs, refresh: refreshJobs } = useJobs('Todas as Cidades');

  const userRole = String(currentUser?.role || '').toLowerCase().trim();
  const isCompany = Boolean(
    currentUser && (
      userRole === UserRole.EMPRESA ||
      userRole === 'empresa' ||
      userRole === 'company' ||
      userRole === 'recrutador'
    )
  );
  const canSeeMatch = Boolean(
    currentUser && (
      userRole === 'aluno' ||
      userRole === 'candidato' ||
      userRole === 'estudante' ||
      userRole === 'student'
    )
  );

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
      if (isCompany) {
        setShowModal(true);
      } else {
        showToast('⚠️ Apenas empresas cadastradas podem publicar vagas.');
        setParams({});
      }
    }
  }, [params, isCompany, showToast, setParams]);

  useEffect(() => {
    const t = params.get('tab');
    if (t === 'favorites' || t === 'salvas') {
      setActiveTab('favorites');
    } else if (t === 'all' || !t) {
      setActiveTab('all');
    }
  }, [params]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setParams(prev => {
      const p = new URLSearchParams(prev);
      if (newTab === 'all') {
        p.delete('tab');
      } else {
        p.set('tab', newTab);
      }
      return p;
    });
  };

  useEffect(() => {
    if (selectedCity) {
      setFilterCity(selectedCity);
    }
  }, [selectedCity]);

  const handleOpenPublish = () => {
    if (isCompany) {
      setShowModal(true);
    } else {
      showToast('⚠️ Apenas empresas cadastradas podem publicar vagas.');
    }
  };

  const handleJobCreated = () => {
    refreshJobs();
    setParams({});
  };

  const toggleArea = (area) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const savedJobsList = useMemo(() => {
    if (!Array.isArray(favoriteJobs) || favoriteJobs.length === 0) return [];
    return (allJobs || []).filter(j => isJobFavorited(j, favoriteJobs));
  }, [allJobs, favoriteJobs]);

  const hasActiveFilters = query || (filterCity && filterCity !== 'Todas as Cidades') || filterType !== 'Todos' || filterModality !== 'Todas' || minMatch > 0 || onlyFavorites || selectedAreas.length > 0;

  const resetFilters = () => {
    setQuery('');
    setFilterCity('Todas as Cidades');
    setFilterType('Todos');
    setFilterModality('Todas');
    setMinMatch(0);
    setOnlyFavorites(false);
    setSelectedAreas([]);
    setSortBy('match');
  };

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
        const matchCityOk = matchCity(j.city, filterCity);
        
        // Tipo
        const matchType = filterType === 'Todos' || (j.type && String(j.type).toLowerCase().includes(filterType.toLowerCase()));
        
        // Modalidade
        const matchModality = filterModality === 'Todas' || (j.modality && String(j.modality).toLowerCase().includes(filterModality.toLowerCase()));
        
        // Match Mínimo
        const matchScoreOk = !canSeeMatch || minMatch === 0 || (typeof j.calculatedScore === 'number' && j.calculatedScore >= minMatch);

        // Áreas de atuação
        const areaText = normalizeText([j.title, ...(j.requiredSkills || [])].join(' '));
        const matchSkillsOk = selectedAreas.length === 0 || JOB_AREAS
          .filter(a => selectedAreas.includes(a.label))
          .some(a => a.keywords.some(k => areaText.includes(k)));

        // Busca Textual
        const text = (
          String(j.title || '') + ' ' + 
          String(j.company || '') + ' ' + 
          String(j.description || '') + ' ' + 
          (j.requiredSkills || []).join(' ')
        ).toLowerCase();
        const matchText = !query || text.includes(query.toLowerCase());

        // Favoritas
        const matchFavoriteOk = !onlyFavorites || isJobFavorited(j, favoriteJobs);

        return matchCityOk && matchType && matchModality && matchScoreOk && matchSkillsOk && matchFavoriteOk && matchText;
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
  }, [allJobs, filterCity, filterType, filterModality, minMatch, onlyFavorites, selectedAreas, query, sortBy, canSeeMatch, userSkills, currentUser, favoriteJobs]);

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
                {activeTab === 'favorites' ? 'Minhas Vagas Salvas & Favoritas' : 'Vagas de Emprego & Estágio Regional'}
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {activeTab === 'favorites'
                  ? 'Vagas e oportunidades salvas por você para acompanhar requisitos, prazos e candidaturas no momento ideal.'
                  : 'Encontre vagas em Ivaiporã e cidades vizinhas com cálculo automático de match de habilidades e indicação direta de professores parceiros.'}
              </p>
            </div>

            {isCompany && (
              <button
                onClick={handleOpenPublish}
                className="btn btn-teal px-6 py-3.5 font-bold shadow-lg shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} /> Publicar Nova Vaga
              </button>
            )}
          </div>

          {/* Abas de Navegação (Igual em Banco de Talentos) */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6 sm:mt-8 border-b border-white/15 pt-2 overflow-x-auto scrollbar-none w-full max-w-full">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab !== 'favorites' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <Briefcase size={16} /> Todas as Vagas ({allJobs.length})
            </button>

            <button
              onClick={() => handleTabChange('favorites')}
              className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'favorites' ? 'border-amber-400 text-amber-300' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <Bookmark size={16} className={savedJobsList.length > 0 ? 'fill-amber-400 text-amber-400' : ''} />
              Vagas Salvas ({savedJobsList.length})
            </button>
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
                placeholder="Cargo, empresa ou habilidade..."
                className="text-sm text-gray-800 dark:text-white placeholder-gray-400 outline-none bg-transparent w-full"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Cidade */}
            <div className="lg:col-span-3">
              <CustomSelect
                value={filterCity}
                onChange={setFilterCity}
                options={CITIES}
                searchable={true}
                placeholder="Cidade"
              />
            </div>

            {/* Tipo */}
            <div className="lg:col-span-3">
              <CustomSelect
                value={filterType}
                onChange={setFilterType}
                options={TYPES}
                placeholder="Tipo de Contrato"
              />
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

          {/* Botão de Atalho Rápido para Vagas Salvas */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setOnlyFavorites(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-amber-300'
              }`}
            >
              <Bookmark size={13} className={onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} />
              <span>Apenas Salvas</span>
              {savedJobsList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold">
                  {savedJobsList.length}
                </span>
              )}
            </button>
          </div>

          {/* Painel de Filtros Avançados */}
          {showAdvanced && (
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Modalidade */}
                <div>
                  <label className="form-label text-xs mb-1.5 block font-bold">Modalidade de Trabalho</label>
                  <CustomSelect
                    value={filterModality}
                    onChange={setFilterModality}
                    options={MODALITIES}
                    size="sm"
                  />
                </div>

                {/* Match Mínimo (Alunos / Candidatos) */}
                {canSeeMatch && (
                  <div>
                    <label className="form-label text-xs mb-1.5 block font-bold">Nível de Match de Habilidades</label>
                    <CustomSelect
                      value={minMatch}
                      onChange={val => setMinMatch(Number(val))}
                      options={MATCH_RANGES}
                      size="sm"
                    />
                  </div>
                )}

                {/* Ordenação */}
                <div>
                  <label className="form-label text-xs mb-1.5 block font-bold">Ordenar Vagas por</label>
                  <CustomSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      ...(canSeeMatch ? [{ value: 'match', label: 'Maior Match com Meu Perfil' }] : []),
                      { value: 'recent', label: 'Mais Recentes Primeiro' }
                    ]}
                    size="sm"
                  />
                </div>

              </div>

              {/* Áreas de Atuação */}
              <div>
                <label className="form-label text-xs mb-2 block">Filtrar por Área de Atuação:</label>
                <div className="flex flex-wrap gap-1.5">
                  {JOB_AREAS.map(({ label }) => {
                    const isSelected = selectedAreas.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleArea(label)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── BANNER INFORMATIVO PARA FREELANCERS / AUTÔNOMOS ── */}
        {currentUser?.role === 'freelancer' && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-blue-500/10 border border-amber-300/40 dark:border-amber-700/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Wrench size={20} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Painel de Oportunidades para Freelancers &amp; Autônomos
                </h4>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mt-0.5">
                  Como <strong>Freelancer (PJ)</strong>, você concorre a vagas no modelo <strong>Prestador de Serviço</strong> e projetos sob demanda. Vagas CLT e Estágio são exclusivas para emprego formal com vínculo e estudantes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterType('Prestador de Serviço')}
                className={`btn btn-xs sm:btn-sm font-bold transition-all cursor-pointer ${
                  filterType === 'Prestador de Serviço'
                    ? 'btn-teal shadow-xs'
                    : 'btn-outline border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                }`}
              >
                {filterType === 'Prestador de Serviço' ? '✓ Vagas PJ Filtradas' : 'Ver Vagas PJ / Prestador'}
              </button>
              <Link to="/servicos" className="btn btn-outline btn-xs sm:btn-sm font-bold text-gray-700 dark:text-slate-300">
                Marketplace de Serviços →
              </Link>
            </div>
          </div>
        )}

        {/* ── CONTEÚDO PRINCIPAL: VAGAS SALVAS vs MURAL GERAL ── */}
        {activeTab === 'favorites' ? (
          <div className="space-y-6 w-full animate-in fade-in duration-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <Bookmark className="text-amber-500 fill-amber-500" size={24} /> Vagas Salvas &amp; Favoritas ({savedJobsList.length})
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Oportunidades favoritadas para acompanhar requisitos, prazos ou candidatar-se.
                </p>
              </div>

              {savedJobsList.length > 0 && (
                <button
                  onClick={() => handleTabChange('all')}
                  className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Search size={14} /> Explorar Todas as Vagas
                </button>
              )}
            </div>

            {savedJobsList.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-3 max-w-xl mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
                  <Bookmark size={32} className="fill-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-lg text-primary-dark dark:text-white">
                  Nenhuma vaga favoritada ainda
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  Ao navegar pelo mural de vagas, clique no ícone de marcador (bookmark) em qualquer oportunidade para salvá-la aqui e acessá-la rapidamente.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleTabChange('all')}
                    className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-xs inline-flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <Search size={14} /> Explorar Vagas no Vale do Ivaí
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid-3">
                {savedJobsList.map(j => {
                  const reqSkills = safeSkillsArray(j.requiredSkills);
                  const score = canSeeMatch
                    ? calculateMatchScore(userSkills, reqSkills, {
                        userCity: currentUser?.city,
                        jobCity: j.city,
                        isVerifiedStudent: currentUser?.isVerifiedStudent,
                        endorsementsCount: (currentUser?.endorsements?.length || currentUser?.endorsementCount || 0)
                      })
                    : null;
                  return (
                    <JobCard
                      key={j.id || j.firestoreId}
                      job={{ ...j, requiredSkills: reqSkills, calculatedScore: score }}
                      matchScore={score}
                      onSelect={(jobObj) => setSelectedJob(jobObj)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── GRID DE VAGAS ── */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
                <div className="flex justify-center mb-4">
                  <Search size={48} className="text-gray-300 dark:text-slate-600" />
                </div>
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
          </>
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

      {/* New Job Modal (Padrão Vale do Ivaí / 3 Passos Completo) */}
      {isCompany && (
        <PublishJobModal
          isOpen={showNewModal}
          onClose={() => {
            setShowModal(false);
            setParams({});
          }}
          onJobCreated={handleJobCreated}
        />
      )}
    </>
  );
}
