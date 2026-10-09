import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, X, Sparkles, MapPin, Briefcase, Users, Wrench,
  Building2, ArrowRight, RotateCcw
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  getTalents, getJobs, getServices, getCompanies,
  subscribeToTalents, subscribeToJobs, subscribeToServices,
  subscribeToCompanies, subscribeToPlatformMetrics,
  tokenizeQuery, scoreTalentMatch, scoreJobMatch, scoreServiceMatch,
  isJobActive
} from '../lib/ivaiConecta';
import TalentsCarousel from '../components/TalentsCarousel';
import EmpresasCarousel from '../components/EmpresasCarousel';
import JobCard from '../components/JobCard';
import ServiceCard from '../components/ServiceCard';
import TalentCard from '../components/TalentCard';
import SolicitarServicoModal from '../components/SolicitarServicoModal';

const PILLARS = [
  'Conexão entre pessoas e empresas',
  'Crescimento profissional',
  'Foco em Ivaiporã e Região',
  'Mais oportunidades no Vale do Ivaí',
  'Desenvolvimento socioeconômico',
];

const POPULAR_SEARCH_SUGGESTIONS = [
  'Tecnologia', 'Pedreiro', 'React', 'Eletricista', 'Estágio', 'Administração', 'Vendas', 'Enfermagem'
];

export default function Dashboard() {
  const { selectedCity, cities, setCity, currentUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('todos'); // 'todos' | 'vagas' | 'talentos' | 'servicos'
  const [selectedServiceToOrder, setSelectedServiceToOrder] = useState(null);
  const resultsRef = useRef(null);

  const [talents, setTalents]     = useState(() => getTalents(selectedCity));
  const [jobs, setJobs]           = useState(() => getJobs(selectedCity));
  const [services, setServices]   = useState(() => getServices(selectedCity));
  const [companies, setCompanies] = useState(() => getCompanies(selectedCity));

  const [platformMetrics, setPlatformMetrics] = useState(() => ({
    talentsCount: getTalents('Todas as Cidades').length,
    companiesCount: getCompanies('Todas as Cidades').length,
    jobsCount: getJobs('Todas as Cidades').filter(isJobActive).length,
    servicesCount: getServices('Todas as Cidades').length
  }));

  // O card 'Impacto no Vale do Ivaí' reflete as estatísticas globais e consolidadas de toda a região
  useEffect(() => {
    const unsubMetrics = subscribeToPlatformMetrics('Todas as Cidades', metricsData => {
      if (metricsData) {
        setPlatformMetrics(metricsData);
      }
    });

    return () => {
      unsubMetrics();
    };
  }, []);

  // Dados filtrados por cidade para os módulos e carrosséis da página inicial
  useEffect(() => {
    const unsubTalents   = subscribeToTalents(selectedCity, data => { if (Array.isArray(data)) setTalents(data); });
    const unsubJobs      = subscribeToJobs(selectedCity, data => { if (Array.isArray(data)) setJobs(data); });
    const unsubServices  = subscribeToServices(selectedCity, data => { if (Array.isArray(data)) setServices(data); });
    const unsubCompanies = subscribeToCompanies(selectedCity, data => { if (Array.isArray(data)) setCompanies(data); });

    return () => {
      unsubTalents();
      unsubJobs();
      unsubServices();
      unsubCompanies();
    };
  }, [selectedCity]);

  // Tokenização e cálculo de relevância multi-setorial
  const searchTokens = useMemo(() => tokenizeQuery(activeSearch), [activeSearch]);

  const filteredTalents = useMemo(() => {
    if (searchTokens.length === 0) return talents;
    return talents
      .map(t => ({ item: t, score: scoreTalentMatch(t, searchTokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [talents, searchTokens]);

  const filteredJobs = useMemo(() => {
    const activeOnly = jobs.filter(isJobActive);
    if (searchTokens.length === 0) return activeOnly;
    return activeOnly
      .map(j => ({ item: j, score: scoreJobMatch(j, searchTokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [jobs, searchTokens]);

  const filteredServices = useMemo(() => {
    if (searchTokens.length === 0) return services;
    return services
      .map(s => ({ item: s, score: scoreServiceMatch(s, searchTokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [services, searchTokens]);

  const totalMatches = filteredTalents.length + filteredJobs.length + filteredServices.length;

  const handleExecuteSearch = (termToSearch) => {
    const cleanTerm = typeof termToSearch === 'string' ? termToSearch.trim() : searchQuery.trim();
    setActiveSearch(cleanTerm);
    setSelectedSector('todos');
    if (cleanTerm && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSelectedSector('todos');
  };

  const metrics = [
    {
      value: `${platformMetrics.talentsCount || 0}`,
      label: 'Talentos Registrados',
      color: 'text-[#4ADE80]'
    },
    {
      value: `${platformMetrics.companiesCount || 0}`,
      label: 'Empresas Parceiras',
      color: 'text-[#A78BFA]'
    },
    {
      value: `${platformMetrics.jobsCount || 0}`,
      label: 'Vagas Ativas',
      color: 'text-[#38BDF8]'
    },
    {
      value: `${platformMetrics.servicesCount || 0}`,
      label: 'Serviços no Marketplace',
      color: 'text-[#FBBF24]'
    },
  ];

  return (
    <>
      {/* ── HERO ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-14 lg:py-20 overflow-hidden">
        {/* Radial Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.18),transparent_50%)] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
            
            {/* Left Column */}
            <div>
              <div className="hero-tag inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-accent-sky mb-4 backdrop-blur-md">
                <Sparkles size={14} />
                <span>Conectando Pessoas, Profissionais e Oportunidades no Vale do Ivaí</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.9rem] font-heading font-extrabold text-white leading-[1.15] mb-5 tracking-tight">
                Busca Geral por{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] to-[#4ADE80] bg-clip-text text-transparent">
                  Talentos, Vagas &amp; Serviços
                </span>{' '}
                no Vale do Ivaí
              </h1>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-7 max-w-xl">
                Encontre tudo em um só lugar: profissionais qualificados, vagas de emprego com matching e prestadores de serviços locais em Ivaiporã e região.
              </p>

              {/* Hero Search Box Multi-Setorial */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl flex flex-wrap sm:flex-nowrap items-center gap-3 max-w-xl border border-white/20 dark:border-slate-700">
                <div className="flex-1 min-w-[200px] flex items-center gap-2.5 px-4 py-3 bg-gray-50/90 dark:bg-slate-800/90 rounded-xl border border-gray-200/50 dark:border-slate-700/60 focus-within:border-primary-blue transition-colors">
                  <Search size={18} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      if (e.target.value === '') {
                        setActiveSearch('');
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleExecuteSearch();
                      }
                    }}
                    placeholder="Digite ex: 'Lucas', 'Pedreiro', 'React', 'Pleno'..."
                    className="bg-transparent text-sm sm:text-base text-gray-800 dark:text-white placeholder-gray-400 outline-none w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveSearch('');
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                      title="Limpar busca"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 shrink-0 flex items-center gap-1.5">
                  <MapPin size={15} className="text-primary-blue dark:text-sky-400 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={e => setCity(e.target.value)}
                    className="bg-transparent text-primary-blue dark:text-blue-400 font-bold text-xs sm:text-sm outline-none cursor-pointer"
                  >
                    {cities.map(c => <option key={c} value={c} className="dark:bg-slate-800 dark:text-white">{c}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => handleExecuteSearch()}
                  className="btn btn-primary px-6 py-3 font-bold rounded-xl text-sm sm:text-base shadow-md shrink-0 cursor-pointer flex items-center gap-2"
                >
                  <Search size={16} /> Buscar
                </button>
              </div>

              {/* Sugestões Rápidas de Pesquisa */}
              <div className="flex items-center gap-2 mt-4 flex-wrap text-xs text-gray-300">
                <span className="font-semibold text-gray-400">Sugestões:</span>
                {POPULAR_SEARCH_SUGGESTIONS.map(sug => (
                  <button
                    key={sug}
                    onClick={() => {
                      setSearchQuery(sug);
                      handleExecuteSearch(sug);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white border border-white/10 transition-colors text-xs cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              {currentUser?.role === 'freelancer' && (
                <div className="flex gap-3 mt-5 flex-wrap">
                  <Link to="/servicos?action=new" className="btn btn-teal btn-sm">+ Cadastrar Meu Serviço</Link>
                </div>
              )}
            </div>

            {/* Right Column — Metrics Card */}
            <div className="bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-3xl p-7 lg:p-8 shadow-2xl">
              <h3 className="text-white font-heading text-xl font-bold mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-[#38BDF8]" /> Impacto no Vale do Ivaí
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {metrics.map(m => (
                  <div key={m.label} className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 transition-all hover:bg-white/[0.09]">
                    <div className={`text-3xl sm:text-4xl font-heading font-extrabold ${m.color}`}>{m.value}</div>
                    <div className="text-xs sm:text-sm text-gray-300 mt-1.5 leading-snug">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── BRAND PILLARS BAR ── */}
      <section className="bg-white dark:bg-slate-900 border-b border-blue-100/60 dark:border-slate-800 py-6 transition-colors duration-300">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {PILLARS.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-center p-3.5 rounded-2xl border border-blue-100/80 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-primary-blue dark:hover:border-blue-400 hover:shadow-md transition-all text-center text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAINEL DE CONTROLE DA BUSCA MULTI-SETORIAL ATIVA ── */}
      <div ref={resultsRef}>
        {activeSearch && (
          <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-6 border-b border-blue-800/60 shadow-inner">
            <div className="container">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/20 text-sm font-bold">
                    <Search size={16} className="text-sky-300" />
                    <span>Termo: <strong className="text-sky-300">"{activeSearch}"</strong></span>
                    <button
                      onClick={handleClearSearch}
                      className="ml-1 p-0.5 hover:bg-white/20 rounded-md transition-colors"
                      title="Limpar busca"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-sm">
                    <MapPin size={15} className="text-emerald-400" />
                    <span>Município: <strong className="text-white">{selectedCity}</strong></span>
                  </div>

                  <span className="text-xs sm:text-sm text-gray-300">
                    Total: <strong className="text-white">{totalMatches}</strong> resultado{totalMatches === 1 ? '' : 's'} encontrado{totalMatches === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Abas de Setor */}
                  <div className="inline-flex rounded-xl bg-black/30 p-1 border border-white/15">
                    <button
                      onClick={() => setSelectedSector('todos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSector === 'todos'
                          ? 'bg-primary-blue text-white shadow-xs'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Todos ({totalMatches})
                    </button>
                    <button
                      onClick={() => setSelectedSector('vagas')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSector === 'vagas'
                          ? 'bg-primary-blue text-white shadow-xs'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Vagas ({filteredJobs.length})
                    </button>
                    <button
                      onClick={() => setSelectedSector('talentos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSector === 'talentos'
                          ? 'bg-primary-blue text-white shadow-xs'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Talentos ({filteredTalents.length})
                    </button>
                    <button
                      onClick={() => setSelectedSector('servicos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSector === 'servicos'
                          ? 'bg-primary-blue text-white shadow-xs'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Serviços ({filteredServices.length})
                    </button>
                  </div>

                  <button
                    onClick={handleClearSearch}
                    className="btn btn-outline btn-sm text-xs font-bold text-white border-white/30 hover:bg-white/10 flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} /> Limpar Filtro
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          MÓDULO 1: BANCO DE TALENTOS & PROFISSIONAIS (Multi-Setor)
      ═════════════════════════════════════════════════════════════════════ */}
      {(selectedSector === 'todos' || selectedSector === 'talentos') && (
        <section className="section bg-gradient-to-b from-[#eaf2ff] via-[#f1f6ff] to-[#f8fbff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-blue-100/80 dark:border-slate-800 overflow-hidden transition-colors duration-300 relative">
          <div className="absolute -top-16 right-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-sky-300/15 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container relative z-10">
            <div className="section-header">
              <div>
                <div className="section-subtitle text-primary-blue dark:text-sky-400 flex items-center gap-1.5">
                  <Users size={15} /> Banco de Talentos &amp; Profissionais
                </div>
                <h2 className="section-title text-primary-dark dark:text-white">
                  {activeSearch
                    ? `Talentos & Profissionais (${filteredTalents.length} encontrado${filteredTalents.length === 1 ? '' : 's'})`
                    : `Talentos & Profissionais em Destaque em ${selectedCity}`}
                </h2>
              </div>
              <div className="flex gap-2.5 items-center">
                <Link
                  to={activeSearch ? `/talentos?q=${encodeURIComponent(activeSearch)}` : '/talentos'}
                  className="btn btn-outline bg-white/80 dark:bg-slate-800 border-blue-200 dark:border-slate-700 text-primary-blue dark:text-blue-300 hover:bg-primary-blue hover:text-white btn-sm shrink-0 shadow-2xs font-bold flex items-center gap-1.5"
                >
                  Ver Banco Completo <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {filteredTalents.length === 0 ? (
              <EmptyState
                icon={<Users size={36} className="text-blue-400 mx-auto mb-2" />}
                message={
                  activeSearch
                    ? `Nenhum profissional ou talento encontrado para "${activeSearch}" em ${selectedCity}.`
                    : `Nenhum talento ou profissional cadastrado em ${selectedCity} no momento.`
                }
                actionLink={activeSearch ? null : '/talentos'}
                actionLabel="Explorar todos os talentos"
              />
            ) : activeSearch ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {filteredTalents.slice(0, 6).map(t => (
                  <TalentCard key={t.id || t.firestoreId} talent={t} />
                ))}
              </div>
            ) : (
              <TalentsCarousel talents={filteredTalents} />
            )}
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MÓDULO 2: EMPRESAS PARCEIRAS & CADASTRADAS
      ═════════════════════════════════════════════════════════════════════ */}
      {selectedSector === 'todos' && !activeSearch && (
        <section className="section bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300 relative">
          <div className="absolute top-1/2 right-10 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container relative z-10">
            <div className="section-header">
              <div>
                <div className="section-subtitle text-primary-blue dark:text-sky-400 flex items-center gap-1.5">
                  <Building2 size={15} /> Ecossistema Empresarial &amp; Empregabilidade
                </div>
                <h2 className="section-title text-primary-dark dark:text-white">Empresas Cadastradas &amp; Parceiras no Vale do Ivaí</h2>
              </div>
              <div className="flex gap-2.5 items-center flex-wrap">
                <Link to="/vagas" className="btn btn-outline bg-white dark:bg-slate-800 btn-sm shrink-0 font-bold flex items-center gap-1.5">
                  Ver Vagas Abertas ({selectedCity === 'Todas as Cidades' ? platformMetrics.jobsCount : jobs.filter(isJobActive).length}) <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {companies.length === 0 ? (
              <EmptyState
                icon={<Building2 size={36} className="text-indigo-400 mx-auto mb-2" />}
                message={`Nenhuma empresa parceira cadastrada em ${selectedCity} no momento.`}
              />
            ) : (
              <EmpresasCarousel companies={companies} />
            )}
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MÓDULO 3: VAGAS DE EMPREGO REGIONAIS (Multi-Setor)
      ═════════════════════════════════════════════════════════════════════ */}
      {(selectedSector === 'todos' || selectedSector === 'vagas') && (
        <section className="section bg-gradient-to-b from-[#eaf2ff] via-[#f3f7ff] to-[#f8fbff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-blue-100/80 dark:border-slate-800 transition-colors duration-300 relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container relative z-10">
            <div className="section-header">
              <div>
                <div className="section-subtitle text-primary-blue dark:text-sky-400 flex items-center gap-1.5">
                  <Briefcase size={15} /> Oportunidades Regionais
                </div>
                <h2 className="section-title text-primary-dark dark:text-white">
                  {activeSearch
                    ? `Vagas de Emprego (${filteredJobs.length} encontrada${filteredJobs.length === 1 ? '' : 's'})`
                    : `Vagas em Destaque com Algoritmo de Matching em ${selectedCity}`}
                </h2>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                <Link
                  to={activeSearch ? `/vagas?q=${encodeURIComponent(activeSearch)}` : '/vagas'}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold"
                >
                  Explorar Todas as Vagas <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase size={36} className="text-sky-400 mx-auto mb-2" />}
                message={
                  activeSearch
                    ? `Nenhuma vaga de emprego encontrada para "${activeSearch}" em ${selectedCity}.`
                    : `Nenhuma vaga disponível no momento em ${selectedCity}.`
                }
                actionLink={activeSearch ? null : '/vagas'}
                actionLabel="Ver vagas em todas as cidades"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {filteredJobs.slice(0, 6).map(j => (
                  <JobCard key={j.id || j.firestoreId} job={j} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MÓDULO 4: MARKETPLACE DE SERVIÇOS & AUTÔNOMOS (Multi-Setor)
      ═════════════════════════════════════════════════════════════════════ */}
      {(selectedSector === 'todos' || selectedSector === 'servicos') && (
        <section className="section bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300 relative">
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="container relative z-10">
            <div className="section-header">
              <div>
                <div className="section-subtitle text-primary-blue dark:text-sky-400 flex items-center gap-1.5">
                  <Wrench size={15} /> Marketplace Vale do Ivaí
                </div>
                <h2 className="section-title text-primary-dark dark:text-white">
                  {activeSearch
                    ? `Serviços & Autônomos (${filteredServices.length} encontrado${filteredServices.length === 1 ? '' : 's'})`
                    : `Serviços Locais Recomendados em ${selectedCity}`}
                </h2>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                {currentUser?.role === 'freelancer' && (
                  <Link to="/servicos?action=new" className="btn btn-teal btn-sm">+ Cadastrar Meu Serviço</Link>
                )}
                <Link
                  to={activeSearch ? `/servicos?q=${encodeURIComponent(activeSearch)}` : '/servicos'}
                  className="btn btn-outline bg-white dark:bg-slate-800 btn-sm font-bold flex items-center gap-1.5"
                >
                  Ver Todos os Serviços <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <EmptyState
                icon={<Wrench size={36} className="text-amber-400 mx-auto mb-2" />}
                message={
                  activeSearch
                    ? `Nenhum prestador de serviço encontrado para "${activeSearch}" em ${selectedCity}.`
                    : `Nenhum prestador de serviço cadastrado em ${selectedCity} no momento.`
                }
                actionLink={activeSearch ? null : '/servicos'}
                actionLabel="Explorar todos os serviços"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {filteredServices.slice(0, 6).map(s => (
                  <ServiceCard
                    key={s.id || s.firestoreId}
                    service={s}
                    onRequestService={setSelectedServiceToOrder}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {selectedServiceToOrder && (
        <SolicitarServicoModal
          service={selectedServiceToOrder}
          onClose={() => setSelectedServiceToOrder(null)}
        />
      )}
    </>
  );
}

function EmptyState({ icon, message, actionLink, actionLabel }) {
  return (
    <div className="py-14 px-6 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-800/80 max-w-lg mx-auto shadow-2xs">
      {icon}
      <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base mb-4 leading-relaxed font-medium">
        {message}
      </p>
      {actionLink && actionLabel && (
        <Link to={actionLink} className="btn btn-outline btn-sm font-bold">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
