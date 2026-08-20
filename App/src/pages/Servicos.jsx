import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Plus, Star, ShieldCheck, Award, RotateCcw, Filter } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getServices, CITIES } from '../lib/ivaiConecta';
import ServiceCard from '../components/ServiceCard';

const CATEGORIES = [
  'Todas',
  'Construção & Manutenção',
  'Marketing & Design',
  'Tecnologia & Suporte',
  'Manutenção Doméstica',
  'Finanças & Contabilidade',
  'Educação & Cursos',
];

const BADGE_FILTERS = [
  { label: 'Todos os Selos', value: 'todos' },
  { label: 'Verificados Ivaí Conecta', value: 'verificado' },
  { label: 'Destaques da Semana', value: 'destaque' },
];

const RATING_FILTERS = [
  { label: 'Qualquer Avaliação', value: 0 },
  { label: '⭐ 4.8 ou mais', value: 4.8 },
  { label: '⭐ 5.0 (Excelente)', value: 5.0 },
];

export default function Servicos() {
  const { currentUser, showToast } = useAppStore();
  const [params] = useSearchParams();

  const [query,       setQuery]       = useState('');
  const [city,        setCity]        = useState('Todas as Cidades');
  const [category,    setCategory]    = useState('Todas');
  const [badgeFilter, setBadgeFilter] = useState('todos');
  const [minRating,   setMinRating]   = useState(0);
  const [sortBy,      setSortBy]      = useState('rating'); // 'rating', 'reviews', 'name'
  const [showModal,   setModal]       = useState(params.get('action') === 'new');

  const all = getServices('Todas as Cidades');

  const hasActiveFilters = query || city !== 'Todas as Cidades' || category !== 'Todas' || badgeFilter !== 'todos' || minRating > 0;

  const resetFilters = () => {
    setQuery('');
    setCity('Todas as Cidades');
    setCategory('Todas');
    setBadgeFilter('todos');
    setMinRating(0);
    setSortBy('rating');
  };

  const filtered = useMemo(() => {
    return all
      .filter(s => {
        const mCity = city === 'Todas as Cidades' || s.city === city;
        const mCat  = category === 'Todas' || s.category === category;
        
        // Badge filter
        let mBadge = true;
        if (badgeFilter === 'verificado') mBadge = s.badge?.includes('Verificado');
        if (badgeFilter === 'destaque')   mBadge = s.badge?.includes('Destaque');

        // Rating filter
        const mRating = s.rating >= minRating;

        // Text query
        const q = query.toLowerCase().trim();
        const mQ = !q ||
          s.providerName.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q);

        return mCity && mCat && mBadge && mRating && mQ;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
        if (sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
        if (sortBy === 'name') return a.providerName.localeCompare(b.providerName);
        return 0;
      });
  }, [all, city, category, badgeFilter, minRating, query, sortBy]);

  return (
    <>
      {/* ── HEADER ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="hero-tag mb-3">
                <span>Autônomos e Empreendedores do Vale do Ivaí</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mt-1 mb-3 tracking-tight">
                Marketplace de Serviços Locais
              </h1>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Encontre profissionais qualificados com avaliações de clientes e contato imediato por WhatsApp.
              </p>
            </div>

            {currentUser?.role === 'freelancer' && (
              <button onClick={() => setModal(true)} className="btn btn-teal px-6 py-3 font-bold shadow-md shrink-0">
                <Plus size={18} /> Cadastrar Meu Serviço
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container section">
        {/* ── FILTROS APRIMORADOS ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-brand-sm space-y-4">
          
          {/* Linha Principal de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
            
            {/* Busca textual (5 cols) */}
            <div className="lg:col-span-5 flex items-center gap-2.5 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50/50 focus-within:bg-white focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/15 transition-all">
              <Search size={17} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Busque por eletricista, técnico, aulas, designer..."
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

            {/* Selos / Verificação (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={badgeFilter}
                onChange={e => setBadgeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                {BADGE_FILTERS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>

            {/* Ordenação (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
              >
                <option value="rating">⭐ Melhor Avaliados</option>
                <option value="reviews">💬 Mais Avaliações</option>
                <option value="name">🔤 Nome (A-Z)</option>
              </select>
            </div>

          </div>

          {/* Segunda Linha: Chips de Categoria */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    category === cat
                      ? 'bg-primary-blue text-white border-primary-blue shadow-xs font-bold'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-blue hover:text-primary-blue'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Direita: Avaliação Mínima + Reset */}
            <div className="flex items-center gap-3">
              <select
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
                className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-semibold outline-none cursor-pointer hover:bg-white"
              >
                {RATING_FILTERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors p-1"
                >
                  <RotateCcw size={12} /> Limpar
                </button>
              )}

              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                <strong className="text-gray-900 font-bold">{filtered.length}</strong> prestador{filtered.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>

        </div>

        {/* ── GRID DE SERVIÇOS ── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-bold text-lg text-gray-700 mb-1">Nenhum prestador encontrado com os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mb-5">Tente remover alguns filtros ou buscar por outra categoria.</p>
            <button onClick={resetFilters} className="btn btn-outline btn-sm">
              <RotateCcw size={14} /> Restaurar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </main>

      {/* New Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModal(false)}>
          <div className="bg-white rounded-3xl shadow-brand-xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-bold text-primary-dark">Cadastrar Meu Serviço</h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setModal(false); showToast('Serviço cadastrado com sucesso!'); }} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Categoria do Serviço</label>
                <select className="form-control">
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cidade onde Atua</label>
                <select className="form-control">
                  {CITIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp para Contato</label>
                <input type="tel" className="form-control" placeholder="Ex: (43) 99999-0000" required />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição dos Serviços</label>
                <textarea className="form-control" rows={3} placeholder="Descreva seus serviços, especialidades e diferenciais..." required />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn btn-outline btn-sm">Cancelar</button>
                <button type="submit" className="btn btn-teal btn-sm">Cadastrar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
