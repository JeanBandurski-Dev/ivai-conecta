import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getTalents, getJobs, getServices, calculateMatchScore } from '../lib/ivaiConecta';
import TalentCard from '../components/TalentCard';
import JobCard from '../components/JobCard';
import ServiceCard from '../components/ServiceCard';

const METRICS = [
  { value: '480+', label: 'Talentos e Profissionais', color: 'text-green-400' },
  { value: '94%',  label: 'Taxa de Matching',          color: 'text-sky-400' },
  { value: '120+', label: 'Empresas Cadastradas',       color: 'text-amber-400' },
  { value: '350+', label: 'Serviços Locais',            color: 'text-emerald-400' },
];

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

  const talents  = getTalents(selectedCity);
  const jobs     = getJobs(selectedCity);
  const services = getServices(selectedCity);

  const demoSkills = talents[0]?.skills || ['JavaScript', 'HTML5/CSS3', 'React'];

  const handleSearch = () => {
    if (query.trim()) navigate(`/vagas?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      {/* ── HERO ── */}
      <header className="bg-gradient-to-br from-primary-dark to-primary-blue text-white py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="hero-tag">
                Conectando Pessoas, Profissionais e Oportunidades no Vale do Ivaí
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight mb-4">
                Conectando{' '}
                <span className="text-accent-sky">Talentos & Profissionais</span>{' '}
                em Ivaiporã
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                A plataforma regional que aproxima trabalhadores qualificados, autônomos, estudantes e
                empresas do Vale do Ivaí com recomendações e qualificações verificadas.
              </p>

              {/* Search */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white rounded-xl px-4 py-2.5">
                  <Search size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Busque por 'React', 'Eletricista', 'Administração'..."
                    className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none w-full"
                  />
                </div>
                <select
                  value={selectedCity}
                  onChange={e => setCity(e.target.value)}
                  className="bg-white text-gray-700 text-sm px-4 py-2.5 rounded-xl outline-none border-0 cursor-pointer"
                >
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={handleSearch} className="btn btn-teal">Buscar Agora</button>
              </div>

              {/* CTA row */}
              <div className="flex gap-3 mt-4 flex-wrap">
                {currentUser?.role === 'freelancer' && (
                  <Link to="/servicos?action=new" className="btn btn-teal btn-sm">+ Cadastrar Serviço</Link>
                )}
                {currentUser?.role === 'empresa' && (
                  <Link to="/vagas?action=new" className="btn btn-outline-white btn-sm">+ Publicar Vaga</Link>
                )}
              </div>
            </div>

            {/* Right — Metrics */}
            <div className="bg-white/8 backdrop-blur-lg border border-white/15 rounded-2xl p-8">
              <h3 className="text-white font-heading text-xl font-bold mb-6">Impacto no Vale do Ivaí</h3>
              <div className="grid grid-cols-2 gap-5">
                {METRICS.map(m => (
                  <div key={m.label} className="bg-white/6 border border-white/10 rounded-xl p-5">
                    <div className={`text-4xl font-heading font-extrabold ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-gray-300 mt-1 leading-snug">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── PILLARS BAR ── */}
      <section className="bg-primary-dark/95 py-4 overflow-hidden">
        <div className="container">
          <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center">
            {PILLARS.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium text-gray-300">
                {i > 0 && <span className="text-primary-blue hidden sm:inline">·</span>}
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TALENTS ── */}
      <section className="section bg-white">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-subtitle">Banco de Talentos</div>
              <h2 className="section-title">Talentos & Profissionais Regionais</h2>
            </div>
            <Link to="/perfil/1" className="btn btn-outline btn-sm shrink-0">Ver Perfil Demo</Link>
          </div>

          {talents.length === 0 ? (
            <EmptyState message={`Nenhum talento ou profissional cadastrado em ${selectedCity} no momento.`} />
          ) : (
            <div className="grid-4">
              {talents.slice(0, 8).map(t => <TalentCard key={t.id} talent={t} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── JOBS ── */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-subtitle">Oportunidades Regionais</div>
              <h2 className="section-title">Vagas em Destaque com Algoritmo de Matching</h2>
            </div>
            <div className="flex gap-3 flex-wrap shrink-0">
              {currentUser?.role === 'empresa' && (
                <Link to="/vagas?action=new" className="btn btn-teal btn-sm">+ Publicar Vaga</Link>
              )}
              <Link to="/vagas" className="btn btn-primary btn-sm">Explorar Todas as Vagas</Link>
            </div>
          </div>

          {jobs.length === 0 ? (
            <EmptyState message={`Nenhuma vaga encontrada em ${selectedCity}.`} />
          ) : (
            <div className="grid-3">
              {jobs.slice(0, 3).map(j => (
                <JobCard key={j.id} job={j} matchScore={calculateMatchScore(demoSkills, j.requiredSkills)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section bg-white">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-subtitle">Marketplace Vale do Ivaí</div>
              <h2 className="section-title">Serviços Locais Recomendados</h2>
            </div>
            <div className="flex gap-3 flex-wrap shrink-0">
              {currentUser?.role === 'freelancer' && (
                <Link to="/servicos?action=new" className="btn btn-teal btn-sm">+ Cadastrar Meu Serviço</Link>
              )}
              <Link to="/servicos" className="btn btn-outline btn-sm">Ver Todos os Serviços</Link>
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
    <div className="py-12 text-center text-gray-400 text-sm">{message}</div>
  );
}
