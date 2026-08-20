import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, Plus, ChevronDown, X, Sparkles, SlidersHorizontal, RotateCcw, Briefcase, CheckCircle2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getJobs, getTalents, calculateMatchScore, CITIES } from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';

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
  const [params] = useSearchParams();

  const [query,         setQuery]         = useState(params.get('q') || '');
  const [filterCity,    setFilterCity]    = useState(selectedCity);
  const [filterType,    setFilterType]    = useState('Todos');
  const [filterModality,setFilterModality]= useState('Todas');
  const [minMatch,      setMinMatch]      = useState(0);
  const [selectedSkills,setSelectedSkills]= useState([]);
  const [sortBy,        setSortBy]        = useState('match'); // 'match', 'recent', 'title', 'company'
  const [showNewModal,  setShowModal]     = useState(params.get('action') === 'new');
  const [showAdvanced,  setShowAdvanced]  = useState(false);

  const allJobs = getJobs('Todas as Cidades');
  const demoSkills = getTalents('Todas as Cidades')[0]?.skills || ['JavaScript', 'HTML5/CSS3', 'React'];

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

  const filtered = useMemo(() => {
    return allJobs
      .map(job => {
        const score = calculateMatchScore(demoSkills, job.requiredSkills);
        return { ...job, calculatedScore: score };
      })
      .filter(j => {
        // Cidade
        const matchCity = !filterCity || filterCity === 'Todas as Cidades' || j.city === filterCity;
        
        // Tipo
        const matchType = filterType === 'Todos' || j.type.toLowerCase().includes(filterType.toLowerCase());
        
        // Modalidade
        const matchMod = filterModality === 'Todas' || j.type.toLowerCase().includes(filterModality.toLowerCase());
        
        // Match Mínimo
        const matchScorePass = j.calculatedScore >= minMatch;
        
        // Habilidades selecionadas (deve conter ao menos uma se houver seleção)
        const matchSkills = selectedSkills.length === 0 || selectedSkills.some(sk => j.requiredSkills.includes(sk));
        
        // Busca textual
        const q = query.toLowerCase().trim();
        const matchQuery = !q ||
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.city.toLowerCase().includes(q) ||
          j.requiredSkills.some(s => s.toLowerCase().includes(q));

        return matchCity && matchType && matchMod && matchScorePass && matchSkills && matchQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.calculatedScore - a.calculatedScore;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'company') return a.company.localeCompare(b.company);
        return b.id - a.id;
      });
  }, [allJobs, filterCity, filterType, filterModality, minMatch, selectedSkills, query, sortBy, demoSkills]);

  return (
    <>
      {/* ── HEADER ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="hero-tag mb-3">
                <span>Oportunidades Regionais com Matching Inteligente</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mt-1 mb-3 tracking-tight">
                Vagas &amp; Matching
              </h1>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Encontre vagas em Ivaiporã e na região com compatibilidade calculada em tempo real com seu perfil de qualificações.
              </p>
            </div>

            {currentUser?.role === 'empresa' && (
              <button onClick={() => setShowModal(true)} className="btn btn-teal px-6 py-3 font-bold shadow-md shrink-0">
                <Plus size={18} /> Publicar Nova Vaga
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container section">
        {/* ── PAINEL DE FILTROS APRIMORADO ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-brand-sm space-y-4">
          
          {/* Linha Principal de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
            
            {/* Campo de Busca (Lg: col-span-5) */}
            <div className="lg:col-span-5 flex items-center gap-2.5 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50/50 focus-within:bg-white focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/15 transition-all">
              <Search size={17} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por cargo, empresa ou habilidade..."
                className="text-sm sm:text-base text-gray-800 placeholder-gray-400 outline-none bg-transparent w-full"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Cidade (Lg: col-span-3) */}
            <div className="lg:col-span-3">
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tipo de Contratação (Lg: col-span-2) */}
            <div className="lg:col-span-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Ordenação (Lg: col-span-2) */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                <option value="match">⚡ Maior Match</option>
                <option value="recent">🕒 Mais Recentes</option>
                <option value="title">🔤 Cargo (A-Z)</option>
                <option value="company">🏢 Empresa (A-Z)</option>
              </select>
            </div>

          </div>

          {/* Segunda Linha: Modalidade + Match Mínimo + Toggle Filtros Avançados */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Modalidade Chips */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                {MODALITIES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setFilterModality(m.value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      filterModality === m.value
                        ? 'bg-white text-primary-blue shadow-xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Match Mínimo Selector */}
              <select
                value={minMatch}
                onChange={e => setMinMatch(Number(e.target.value))}
                className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-semibold outline-none cursor-pointer hover:bg-white"
              >
                {MATCH_RANGES.map(mr => <option key={mr.value} value={mr.value}>{mr.label}</option>)}
              </select>

              {/* Botão para abrir Habilidades */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showAdvanced || selectedSkills.length > 0
                    ? 'bg-primary-light text-primary-blue border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Sparkles size={13} />
                Filtrar por Habilidades {selectedSkills.length > 0 && `(${selectedSkills.length})`}
              </button>
            </div>

            {/* Direita: Total de Vagas + Botão Limpar */}
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors p-1"
                >
                  <RotateCcw size={12} /> Limpar Filtros
                </button>
              )}
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                <strong className="text-gray-900 font-bold">{filtered.length}</strong> vaga{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Área Expansível de Habilidades / Tags */}
          {showAdvanced && (
            <div className="pt-3 border-t border-gray-100 bg-gray-50/50 p-3.5 rounded-xl space-y-2">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Selecione as habilidades desejadas na vaga:
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map(skill => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-blue hover:text-primary-blue'
                      }`}
                    >
                      {skill} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── GRID DE VAGAS ── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-bold text-lg text-gray-700 mb-1">Nenhuma vaga encontrada com os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mb-5">Tente remover alguns filtros ou buscar por outro termo.</p>
            <button onClick={resetFilters} className="btn btn-outline btn-sm">
              <RotateCcw size={14} /> Restaurar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(j => (
              <JobCard key={j.id} job={j} matchScore={j.calculatedScore} />
            ))}
          </div>
        )}
      </main>

      {/* New Job Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-brand-xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-bold text-primary-dark">Publicar Nova Vaga</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setShowModal(false); showToast('Vaga publicada com sucesso!'); }} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Título da Vaga</label>
                <input type="text" className="form-control" placeholder="Ex: Desenvolvedor Front-end Junior" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Contratação</label>
                <select className="form-control">
                  {TYPES.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <select className="form-control">
                  {CITIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Habilidades Necessárias (separadas por vírgula)</label>
                <input type="text" className="form-control" placeholder="Ex: React, JavaScript, Git" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline btn-sm">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm">Publicar Vaga</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
