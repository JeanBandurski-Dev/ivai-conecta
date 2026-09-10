import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  getTalents, getJobs, getServices, getCompanies,
  subscribeToTalents, subscribeToJobs, subscribeToServices,
  subscribeToCompanies, subscribeToPlatformMetrics
} from '../lib/ivaiConecta';
import TalentsCarousel from '../components/TalentsCarousel';
import EmpresasCarousel from '../components/EmpresasCarousel';
import JobCard from '../components/JobCard';
import ServiceCard from '../components/ServiceCard';

const PILLARS = [
  'Conexão entre pessoas e empresas',
  'Crescimento profissional',
  'Foco em Ivaiporã',
  'Mais oportunidades na sua região',
  'Desenvolvimento da nossa cidade',
];

export default function Dashboard() {
  const { selectedCity, cities, setCity, currentUser } = useAppStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const [talents, setTalents]     = useState(() => getTalents(selectedCity));
  const [jobs, setJobs]           = useState(() => getJobs(selectedCity));
  const [services, setServices]   = useState(() => getServices(selectedCity));
  const [companies, setCompanies] = useState(() => getCompanies(selectedCity));

  const [platformMetrics, setPlatformMetrics] = useState(() => ({
    talentsCount: getTalents(selectedCity).length,
    companiesCount: getCompanies(selectedCity).length,
    jobsCount: getJobs(selectedCity).filter(j => j.status === 'Ativa').length,
    servicesCount: getServices(selectedCity).length
  }));

  useEffect(() => {
    const unsubTalents   = subscribeToTalents(selectedCity, data => { if (Array.isArray(data)) setTalents(data); });
    const unsubJobs      = subscribeToJobs(selectedCity, data => { if (Array.isArray(data)) setJobs(data); });
    const unsubServices  = subscribeToServices(selectedCity, data => { if (Array.isArray(data)) setServices(data); });
    const unsubCompanies = subscribeToCompanies(selectedCity, data => { if (Array.isArray(data)) setCompanies(data); });

    const unsubMetrics   = subscribeToPlatformMetrics(selectedCity, metricsData => {
      if (metricsData) {
        setPlatformMetrics(metricsData);
      }
    });

    return () => {
      unsubTalents();
      unsubJobs();
      unsubServices();
      unsubCompanies();
      unsubMetrics();
    };
  }, [selectedCity]);

  const handleSearch = () => {
    if (query.trim()) navigate(`/vagas?q=${encodeURIComponent(query.trim())}`);
  };

  const metrics = [
    {
      value: platformMetrics.talentsCount > 0 ? `${platformMetrics.talentsCount}` : `${talents.length}`,
      label: 'Talentos Registrados',
      color: 'text-[#4ADE80]'
    },
    {
      value: platformMetrics.companiesCount > 0 ? `${platformMetrics.companiesCount}` : `${companies.length}`,
      label: 'Empresas Parceiras',
      color: 'text-[#A78BFA]'
    },
    {
      value: platformMetrics.jobsCount > 0 ? `${platformMetrics.jobsCount}` : `${jobs.filter(j => j.status === 'Ativa').length}`,
      label: 'Vagas Ativas',
      color: 'text-[#38BDF8]'
    },
    {
      value: platformMetrics.servicesCount > 0 ? `${platformMetrics.servicesCount}` : `${services.length}`,
      label: 'Serviços no Marketplace',
      color: 'text-[#FBBF24]'
    },
  ];

  return (
    <>
      {/* ── HERO ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-16 lg:py-22 overflow-hidden">
        {/* Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.18),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
            
            {/* Left Column */}
            <div>
              <div className="hero-tag">
                <span>Conectando Pessoas, Profissionais e Oportunidades no Vale do Ivaí</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[3.1rem] font-heading font-extrabold text-white leading-[1.15] mb-5">
                Conectando{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] to-[#4ADE80] bg-clip-text text-transparent">
                  Talentos &amp; Profissionais
                </span>{' '}
                em Ivaiporã
              </h1>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                A plataforma regional que aproxima trabalhadores qualificados, autônomos, estudantes e
                empresas do Vale do Ivaí com recomendações e qualificações verificadas.
              </p>

              {/* Hero Search Box */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl flex flex-wrap sm:flex-nowrap items-center gap-3 max-w-xl border border-white/20 dark:border-slate-700">
                <div className="flex-1 min-w-[200px] flex items-center gap-2.5 px-4 py-3 bg-gray-50/90 dark:bg-slate-800/90 rounded-xl">
                  <Search size={17} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Busque por 'React', 'Eletricista', 'Admin..."
                    className="bg-transparent text-sm sm:text-base text-gray-800 dark:text-white placeholder-gray-400 outline-none w-full"
                  />
                </div>

                <div className="border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 shrink-0">
                  <select
                    value={selectedCity}
                    onChange={e => setCity(e.target.value)}
                    className="bg-transparent text-primary-blue dark:text-blue-400 font-bold text-xs sm:text-sm outline-none cursor-pointer"
                  >
                    {cities.map(c => <option key={c} value={c} className="dark:bg-slate-800 dark:text-white">{c}</option>)}
                  </select>
                </div>

                <button onClick={handleSearch} className="btn btn-primary px-6 py-3 font-bold rounded-xl text-sm sm:text-base shadow-md shrink-0">
                  Buscar Agora
                </button>
              </div>

              {/* Quick Actions */}
              {currentUser?.role === 'freelancer' && (
                <div className="flex gap-3 mt-5 flex-wrap">
                  <Link to="/servicos?action=new" className="btn btn-teal btn-sm">+ Cadastrar Serviço</Link>
                </div>
              )}
            </div>

            {/* Right Column — Metrics Card */}
            <div className="bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-3xl p-7 lg:p-8 shadow-2xl">
              <h3 className="text-white font-heading text-xl font-bold mb-6">Impacto no Vale do Ivaí</h3>
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

      {/* ── TALENTS CAROUSEL (Fundo Azul Suave Moderno) ── */}
      <section className="section bg-gradient-to-b from-[#eaf2ff] via-[#f1f6ff] to-[#f8fbff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-blue-100/80 dark:border-slate-800 overflow-hidden transition-colors duration-300 relative">
        {/* Orbes de Iluminação Ambiente */}
        <div className="absolute -top-16 right-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-sky-300/15 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="section-header">
            <div>
              <div className="section-subtitle text-primary-blue dark:text-sky-400">Banco de Talentos</div>
              <h2 className="section-title text-primary-dark dark:text-white">Talentos &amp; Profissionais Regionais</h2>
            </div>
            <div className="flex gap-2.5 items-center">
              <Link to="/talentos" className="btn btn-outline bg-white/80 dark:bg-slate-800 border-blue-200 dark:border-slate-700 text-primary-blue dark:text-blue-300 hover:bg-primary-blue hover:text-white btn-sm shrink-0 shadow-2xs font-bold">
                Ver Banco Completo
              </Link>
            </div>
          </div>

          {talents.length === 0 ? (
            <EmptyState message={`Nenhum talento ou profissional cadastrado em ${selectedCity} no momento.`} />
          ) : (
            <TalentsCarousel talents={talents} />
          )}
        </div>
      </section>

      {/* ── EMPRESAS PARCEIRAS & CADASTRADAS ── */}
      <section className="section bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300 relative">
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="section-header">
            <div>
              <div className="section-subtitle text-primary-blue dark:text-sky-400">Ecossistema Empresarial &amp; Empregabilidade</div>
              <h2 className="section-title text-primary-dark dark:text-white">Empresas Cadastradas &amp; Parceiras no Vale do Ivaí</h2>
            </div>
            <div className="flex gap-2.5 items-center flex-wrap">
              <Link to="/vagas" className="btn btn-outline bg-white dark:bg-slate-800 btn-sm shrink-0 font-bold">
                Ver Vagas Abertas ({jobs.filter(j => j.status === 'Ativa').length})
              </Link>
            </div>
          </div>

          {companies.length === 0 ? (
            <EmptyState message={`Nenhuma empresa parceira cadastrada em ${selectedCity} no momento.`} />
          ) : (
            <EmpresasCarousel companies={companies} />
          )}
        </div>
      </section>

      {/* ── JOBS (Fundo Azul Suave Tecnológico) ── */}
      <section className="section bg-gradient-to-b from-[#eaf2ff] via-[#f3f7ff] to-[#f8fbff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-blue-100/80 dark:border-slate-800 transition-colors duration-300 relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="section-header">
            <div>
              <div className="section-subtitle text-primary-blue dark:text-sky-400">Oportunidades Regionais</div>
              <h2 className="section-title text-primary-dark dark:text-white">Vagas em Destaque com Algoritmo de Matching</h2>
            </div>
            <div className="flex gap-3 flex-wrap shrink-0">
              <Link to="/vagas" className="btn btn-primary btn-sm">Explorar Todas as Vagas</Link>
            </div>
          </div>

          {jobs.length === 0 ? (
            <EmptyState message={`Nenhuma vaga encontrada em ${selectedCity}.`} />
          ) : (
            <div className="grid-3">
              {jobs.slice(0, 3).map(j => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300 relative">
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="section-header">
            <div>
              <div className="section-subtitle text-primary-blue dark:text-sky-400">Marketplace Vale do Ivaí</div>
              <h2 className="section-title text-primary-dark dark:text-white">Serviços Locais Recomendados</h2>
            </div>
            <div className="flex gap-3 flex-wrap shrink-0">
              {currentUser?.role === 'freelancer' && (
                <Link to="/servicos?action=new" className="btn btn-teal btn-sm">+ Cadastrar Meu Serviço</Link>
              )}
              <Link to="/servicos" className="btn btn-outline bg-white dark:bg-slate-800 btn-sm font-bold">Ver Todos os Serviços</Link>
            </div>
          </div>

          {services.length === 0 ? (
            <EmptyState message={`Nenhum prestador de serviço cadastrado em ${selectedCity}.`} />
          ) : (
            <div className="grid-3">
              {services.slice(0, 3).map(s => <ServiceCard key={s.id} service={s} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-16 text-center text-gray-400 dark:text-slate-500 text-base">{message}</div>
  );
}
