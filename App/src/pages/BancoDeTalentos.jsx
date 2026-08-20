import { useState, useMemo } from 'react';
import { Search, X, Sparkles, CheckCircle2, RotateCcw, Building2, GraduationCap } from 'lucide-react';
import { getTalents, CITIES } from '../lib/ivaiConecta';
import TalentCard from '../components/TalentCard';

const AREAS = [
  { label: 'Todas as Áreas', value: 'Todas' },
  { label: '💻 Tecnologia & ADS', value: 'Sistemas' },
  { label: '📊 Administração & Negócios', value: 'Administração' },
  { label: '⚡ Elétrica & Automação', value: 'Eletrotécnica' },
  { label: '🎨 Design & Criação Digital', value: 'Design' },
  { label: '📚 Pedagogia & Treinamento', value: 'Pedagogia' },
  { label: '📑 Contabilidade & Finanças', value: 'Contábeis' },
];

const INSTITUTIONS = [
  'Todas as Instituições',
  'IFPR Campus Ivaiporã',
  'Univale Ivaiporã',
  'UENP',
  'Autônomo / Freelancer',
];

const POPULAR_SKILLS = [
  'React', 'JavaScript', 'Python', 'Excel Avançado', 'Figma',
  'Docker', 'SQL', 'NR-10', 'Power BI', 'Gestão Financeira', 'Git'
];

export default function BancoDeTalentos() {
  const [query,          setQuery]          = useState('');
  const [city,           setCity]           = useState('Todas as Cidades');
  const [area,           setArea]           = useState('Todas');
  const [institution,    setInstitution]    = useState('Todas as Instituições');
  const [onlyEndorsed,   setOnlyEndorsed]   = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy,         setSortBy]         = useState('endorsements'); // 'endorsements', 'name', 'city'
  const [showSkills,     setShowSkills]     = useState(false);

  const all = getTalents('Todas as Cidades');

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const hasActiveFilters = query || city !== 'Todas as Cidades' || area !== 'Todas' || institution !== 'Todas as Instituições' || onlyEndorsed || selectedSkills.length > 0;

  const resetFilters = () => {
    setQuery('');
    setCity('Todas as Cidades');
    setArea('Todas');
    setInstitution('Todas as Instituições');
    setOnlyEndorsed(false);
    setSelectedSkills([]);
    setSortBy('endorsements');
  };

  const filtered = useMemo(() => {
    return all
      .filter(t => {
        // Cidade
        const mCity = city === 'Todas as Cidades' || t.city === city;
        
        // Área
        const mArea = area === 'Todas' || t.course.toLowerCase().includes(area.toLowerCase());
        
        // Instituição
        const mInst = institution === 'Todas as Instituições' || t.institution.toLowerCase().includes(institution.toLowerCase()) || (institution.includes('Autônomo') && t.institution.includes('Autônomo'));

        // Apenas endossados
        const mEndorsed = !onlyEndorsed || (t.endorsements && t.endorsements.length > 0);

        // Habilidades selecionadas
        const mSkills = selectedSkills.length === 0 || selectedSkills.some(sk => t.skills?.includes(sk));

        // Busca textual
        const q = query.toLowerCase().trim();
        const mQ = !q ||
          t.name.toLowerCase().includes(q) ||
          t.course.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q) ||
          t.institution.toLowerCase().includes(q) ||
          t.skills?.some(s => s.toLowerCase().includes(q));

        return mCity && mArea && mInst && mEndorsed && mSkills && mQ;
      })
      .sort((a, b) => {
        if (sortBy === 'endorsements') return (b.endorsements?.length || 0) - (a.endorsements?.length || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'city') return a.city.localeCompare(b.city);
        return 0;
      });
  }, [all, city, area, institution, onlyEndorsed, selectedSkills, query, sortBy]);

  return (
    <>
      {/* ── HEADER ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div className="hero-tag mb-3">
              <span>Talentos Verificados do Vale do Ivaí</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mt-1 mb-3 tracking-tight">
              Banco de Talentos Regional
            </h1>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Encontre estudantes, profissionais e freelancers com qualificações e endossos verificados de docentes e empresas parceiras.
            </p>
          </div>
        </div>
      </header>

      <main className="container section">
        {/* ── PAINEL DE FILTROS ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-brand-sm space-y-4">
          
          {/* Linha Principal de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
            
            {/* Campo de Busca (5 cols) */}
            <div className="lg:col-span-5 flex items-center gap-2.5 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50/50 focus-within:bg-white focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/15 transition-all">
              <Search size={17} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Busque por nome, curso, instituição ou habilidade..."
                className="text-sm sm:text-base text-gray-800 placeholder-gray-400 outline-none bg-transparent w-full"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Cidade (3 cols) */}
            <div className="lg:col-span-3">
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Área de Formação (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            {/* Ordenação (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                <option value="endorsements">⭐ Mais Recomendados</option>
                <option value="name">🔤 Nome (A-Z)</option>
                <option value="city">📍 Cidade (A-Z)</option>
              </select>
            </div>

          </div>

          {/* Segunda Linha: Instituição + Checkbox Recomendados + Toggle Habilidades */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Instituição Selector */}
              <select
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-semibold outline-none cursor-pointer hover:bg-white"
              >
                {INSTITUTIONS.map(inst => <option key={inst} value={inst}>{inst}</option>)}
              </select>

              {/* Checkbox Apenas Verificados */}
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none bg-green-50/80 px-3 py-1.5 rounded-xl border border-green-200 hover:bg-green-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyEndorsed}
                  onChange={e => setOnlyEndorsed(e.target.checked)}
                  className="rounded text-accent-green focus:ring-accent-green h-3.5 w-3.5 cursor-pointer"
                />
                <CheckCircle2 size={13} className="text-accent-green shrink-0" />
                Apenas com Parecer Docente Verificado
              </label>

              {/* Botão para abrir Habilidades */}
              <button
                onClick={() => setShowSkills(!showSkills)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showSkills || selectedSkills.length > 0
                    ? 'bg-primary-light text-primary-blue border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Sparkles size={13} />
                Filtrar por Habilidades {selectedSkills.length > 0 && `(${selectedSkills.length})`}
              </button>
            </div>

            {/* Direita: Total de Talentos + Reset */}
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
                <strong className="text-gray-900 font-bold">{filtered.length}</strong> talento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Área Expansível de Habilidades Populares */}
          {showSkills && (
            <div className="pt-3 border-t border-gray-100 bg-gray-50/50 p-3.5 rounded-xl space-y-2">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Selecione habilidades para filtrar perfis:
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

        {/* ── GRID DE TALENTOS ── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="text-5xl mb-4">🎓</div>
            <p className="font-bold text-lg text-gray-700 mb-1">Nenhum talento encontrado com os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mb-5">Tente selecionar outra instituição ou remover algumas habilidades.</p>
            <button onClick={resetFilters} className="btn btn-outline btn-sm">
              <RotateCcw size={14} /> Restaurar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="grid-4">
            {filtered.map(t => <TalentCard key={t.id} talent={t} />)}
          </div>
        )}
      </main>
    </>
  );
}
