import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, X, Plus, Star, ShieldCheck, Award, RotateCcw, Filter,
  ArrowLeft, MapPin, TrendingUp, Users, MessageSquare, Edit3, Phone,
  BarChart3, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getServices, addService, updateService, CITIES } from '../lib/ivaiConecta';
import { subscribeToServices } from '../services/servicesService.js';
import ServiceCard from '../components/ServiceCard';

const CATEGORIES = [
  'Todas',
  'Construção & Manutenção',
  'Marketing & Design',
  'Aulas & Treinamentos',
  'Tecnologia & TI',
  'Consultoria & Negócios',
  'Saúde & Bem-Estar',
  'Eventos & Fotografia',
];

const BADGE_FILTERS = [
  { label: 'Todos os Prestadores', value: 'todos' },
  { label: 'Verificados (Documento/CNPJ)', value: 'verificado' },
  { label: 'Em Destaque Regional', value: 'destaque' },
];

const RATING_FILTERS = [
  { label: 'Todas as Avaliações', value: 0 },
  { label: '⭐ 4.0 ou mais', value: 4.0 },
  { label: '⭐ 4.5 ou mais', value: 4.5 },
  { label: '⭐ 4.8 ou mais', value: 4.8 },
  { label: '⭐ 5.0 (Excelente)', value: 5.0 },
];

export default function Servicos() {
  const { currentUser, showToast, selectedCity } = useAppStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab,    setActiveTab]    = useState(params.get('view') === 'dashboard' ? 'dashboard' : 'explore'); // 'explore' | 'dashboard'
  const [query,        setQuery]        = useState('');
  const [city,         setCity]         = useState(selectedCity || 'Todas as Cidades');
  const [category,     setCategory]     = useState('Todas');
  const [badgeFilter,  setBadgeFilter]  = useState('todos');
  const [minRating,    setMinRating]    = useState(0);
  const [sortBy,       setSortBy]       = useState('rating');
  const [showModal,    setModal]        = useState(params.get('action') === 'new');
  const [editModal,    setEditModal]    = useState(false);

  useEffect(() => {
    if (selectedCity) setCity(selectedCity);
  }, [selectedCity]);

  const [liveServices, setLiveServices] = useState(() => getServices('Todas as Cidades'));

  useEffect(() => {
    const unsub = subscribeToServices('Todas as Cidades', (data) => {
      setLiveServices(data);
    });
    return () => unsub();
  }, []);

  const all = liveServices;
  const myServices = all.filter(s => 
    s.createdBy === currentUser?.uid || 
    s.createdBy === currentUser?.email ||
    (currentUser?.email && s.providerEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.name && s.providerName?.toLowerCase() === currentUser.name.toLowerCase())
  );
  const currentService = myServices[0] || null;

  // Service Edit Form State
  const [serviceData, setServiceData] = useState({
    title: currentService?.title || currentService?.name || '',
    providerName: currentService?.providerName || currentUser?.name || '',
    category: currentService?.category || 'Construção & Manutenção',
    city: currentService?.city || currentUser?.city || 'Ivaiporã',
    address: currentService?.address || '',
    phone: currentService?.phone || currentUser?.phone || '',
    description: currentService?.description || ''
  });

  useEffect(() => {
    if (currentService) {
      setServiceData({
        title: currentService.title || currentService.name || '',
        providerName: currentService.providerName || currentUser?.name || '',
        category: currentService.category || 'Construção & Manutenção',
        city: currentService.city || 'Ivaiporã',
        address: currentService.address || '',
        phone: currentService.phone || currentUser?.phone || '',
        description: currentService.description || ''
      });
    }
  }, [currentService, currentUser]);

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
        
        let mBadge = true;
        if (badgeFilter === 'verificado') mBadge = s.badge?.includes('Verificado');
        if (badgeFilter === 'destaque')   mBadge = s.badge?.includes('Destaque');

        const mRating = s.rating >= minRating;

        const q = query.toLowerCase().trim();
        const mQ = !q ||
          (s.title || '').toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.providerName || '').toLowerCase().includes(q) ||
          (s.category || '').toLowerCase().includes(q) ||
          (s.city || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q);

        return mCity && mCat && mBadge && mRating && mQ;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0) || (b.reviewsCount || 0) - (a.reviewsCount || 0);
        if (sortBy === 'reviews') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        if (sortBy === 'name') return (a.providerName || '').localeCompare(b.providerName || '');
        return 0;
      });
  }, [all, city, category, badgeFilter, minRating, query, sortBy]);

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!currentService) return;
    await updateService(currentService.firestoreId || currentService.id, serviceData);
    setEditModal(false);
    showToast('Serviço e localização atualizados com sucesso!');
  };

  return (
    <>
      {/* ── HEADER ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-4 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="hero-tag mb-3">
                <span>Autônomos e Empreendedores do Vale do Ivaí</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mt-1 mb-3 tracking-tight">
                Serviços Locais &amp; Freelancers
              </h1>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Encontre profissionais qualificados com avaliações de clientes e contato direto pelo chat integrado.
              </p>
            </div>

            {currentUser?.role === 'freelancer' && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setActiveTab(activeTab === 'dashboard' ? 'explore' : 'dashboard')}
                  className="btn btn-outline border-white/40 text-white font-bold px-5 py-3 shadow-md"
                >
                  <BarChart3 size={18} /> {activeTab === 'dashboard' ? 'Ver Todos os Serviços' : 'Meu Painel Freelancer'}
                </button>

                <button onClick={() => setModal(true)} className="btn btn-teal px-6 py-3 font-bold shadow-md shrink-0">
                  <Plus size={18} /> Cadastrar Novo Serviço
                </button>
              </div>
            )}
          </div>

          {/* Abas para Freelancer */}
          {currentUser?.role === 'freelancer' && (
            <div className="flex items-center gap-2 mt-8 border-b border-white/15 pt-2">
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'explore' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
                }`}
              >
                Explorar Marketplace
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'dashboard' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
                }`}
              >
                📊 Minha Dashboard &amp; Avaliações
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container section">

        {/* ── ABA FREELANCER DASHBOARD DE DESEMPENHO ── */}
        {activeTab === 'dashboard' && currentUser?.role === 'freelancer' ? (
          <div className="space-y-8 max-w-5xl mx-auto">
            
            {!currentService ? (
              <div className="card p-12 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-4">
                <TrendingUp size={48} className="mx-auto text-primary-blue/60" />
                <h3 className="font-heading text-xl font-bold text-gray-800 dark:text-white">Você ainda não possui nenhum serviço publicado</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  Cadastre suas atividades profissionais para começar a receber contatos de clientes de Ivaiporã e região e acompanhar suas métricas de desempenho.
                </p>
                <button onClick={() => setModal(true)} className="btn btn-teal px-6 py-2.5 font-bold shadow-md">
                  <Plus size={16} /> Cadastrar Meu Serviço
                </button>
              </div>
            ) : (
              <>
                {/* Header do Serviço Cadastrado */}
                <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary-blue bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        {currentService.category}
                      </span>
                      <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                        {currentService.badge || 'Prestador Regional'}
                      </span>
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white">
                      {currentService.title || currentService.name || currentService.category}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Prestador: <strong className="text-gray-700 dark:text-slate-200 font-semibold">{currentService.providerName}</strong>
                    </p>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-2 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-primary-blue" />{currentService.address || `${currentService.city}, PR`}</span>
                      {currentService.phone && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Phone size={14} className="text-green-600" />{currentService.phone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button onClick={() => setEditModal(true)} className="btn btn-primary btn-sm font-bold shadow-md">
                    <Edit3 size={15} /> Editar Dados &amp; Localização
                  </button>
                </div>

                {/* CARDS DE ANALYTICS / DESEMPENHO DE VENDAS */}
                <div>
                  <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary-blue" /> Métrica &amp; Conversão de Vendas
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Visualizações */}
                    <div className="card p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <span>Acessos ao Perfil</span>
                        <Users size={18} className="text-primary-blue" />
                      </div>
                      <div className="text-3xl font-extrabold text-primary-dark dark:text-white">{currentService.analytics?.views || 0}</div>
                      <div className="text-xs text-green-600 font-semibold">Visualizações reais</div>
                    </div>

                    {/* Contatos via Chat */}
                    <div className="card p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <span>Leads / Contatos</span>
                        <MessageSquare size={18} className="text-primary-blue" />
                      </div>
                      <div className="text-3xl font-extrabold text-primary-dark dark:text-white">{currentService.analytics?.contacts || 0}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Conversas iniciadas</div>
                    </div>

                    {/* Vendas Fechadas */}
                    <div className="card p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <span>Serviços Prestados</span>
                        <CheckCircle2 size={18} className="text-teal-600" />
                      </div>
                      <div className="text-3xl font-extrabold text-teal-600">{currentService.analytics?.closedDeals || 0}</div>
                      <div className="text-xs font-bold text-teal-700">Taxa: {currentService.analytics?.conversionRate || '0%'}</div>
                    </div>

                    {/* Não Compraram */}
                    <div className="card p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <span>Desistências</span>
                        <AlertCircle size={18} className="text-amber-500" />
                      </div>
                      <div className="text-3xl font-extrabold text-gray-700 dark:text-slate-200">{currentService.analytics?.nonBuyers || 0}</div>
                      <div className="text-xs text-amber-600 font-semibold">Sem fechamento</div>
                    </div>

                  </div>
                </div>

                {/* FÓRUM DE AVALIAÇÕES E FEEDBACK DOS CLIENTES */}
                <div className="grid lg:grid-cols-2 gap-6">
                  
                  {/* Avaliações dos Clientes */}
                  <div className="card space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                        <Star size={18} className="fill-amber-400 text-amber-400" /> Avaliações ({currentService.reviewsCount || 0})
                      </h3>
                      <span className="text-sm font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                        ⭐ {currentService.rating || 5.0} / 5.0
                      </span>
                    </div>

                    {(!currentService.reviews || currentService.reviews.length === 0) ? (
                      <p className="text-sm text-gray-400">Nenhuma avaliação detalhada recebida ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {currentService.reviews.map((r, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-gray-800">{r.client}</span>
                              <span className="text-xs text-amber-500 font-bold">{'⭐'.repeat(r.stars || 5)}</span>
                            </div>
                            <p className="text-xs text-gray-600 italic">"{r.comment}"</p>
                            <span className="text-[10px] text-gray-400 block pt-1">{r.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fórum de Perguntas & Dúvidas dos Clientes */}
                  <div className="card space-y-4">
                    <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                      <MessageSquare size={18} className="text-primary-blue" /> Fórum de Dúvidas &amp; Sugestões
                    </h3>

                    {(!currentService.forumTopics || currentService.forumTopics.length === 0) ? (
                      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 text-center text-gray-400">
                        <MessageSquare size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                        <p className="text-sm font-semibold">Nenhuma pergunta aberta no momento.</p>
                        <p className="text-xs mt-1">Quando clientes tiverem dúvidas sobre seus serviços, elas aparecerão aqui.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentService.forumTopics.map((f, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                            <div className="font-bold text-sm text-gray-800">❓ {f.title}</div>
                            <div className="text-xs text-gray-600">Cliente perguntou: "{f.question}"</div>
                            <div className="text-xs font-semibold text-primary-blue bg-white p-2.5 rounded-xl border border-gray-200">
                              <strong>Sua Resposta:</strong> {f.answer}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}

          </div>
        ) : (
          /* ── VISÃO EXPLORAR MARKETPLACE (PADRÃO) ── */
          <>
            {/* ── FILTROS APRIMORADOS ── */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 mb-8 shadow-brand-sm space-y-4 transition-colors duration-300">
              
              {/* Linha Principal de Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
                
                {/* Busca textual (5 cols) */}
                <div className="lg:col-span-5 flex items-center gap-2.5 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-gray-50/50 dark:bg-slate-800/50 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-primary-blue dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-primary-blue/15 transition-all">
                  <Search size={17} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Busque por eletricista, técnico, aulas, designer..."
                    className="text-sm sm:text-base text-gray-800 dark:text-white placeholder-gray-400 outline-none bg-transparent w-full"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Cidade (3 cols) */}
                <div className="lg:col-span-3">
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none bg-white dark:bg-slate-800 cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
                  >
                    {CITIES.map(c => <option key={c} value={c} className="dark:bg-slate-800 dark:text-white">{c}</option>)}
                  </select>
                </div>

                {/* Selos / Verificação (2 cols) */}
                <div className="lg:col-span-2">
                  <select
                    value={badgeFilter}
                    onChange={e => setBadgeFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none bg-white dark:bg-slate-800 cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
                  >
                    {BADGE_FILTERS.map(b => <option key={b.value} value={b.value} className="dark:bg-slate-800 dark:text-white">{b.label}</option>)}
                  </select>
                </div>

                {/* Ordenação (2 cols) */}
                <div className="lg:col-span-2">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none bg-white dark:bg-slate-800 cursor-pointer font-medium hover:border-gray-400 focus:border-primary-blue"
                  >
                    <option value="rating" className="dark:bg-slate-800 dark:text-white">⭐ Melhor Avaliados</option>
                    <option value="reviews" className="dark:bg-slate-800 dark:text-white">💬 Mais Avaliações</option>
                    <option value="name" className="dark:bg-slate-800 dark:text-white">🔤 Nome (A-Z)</option>
                  </select>
                </div>

              </div>

              {/* Segunda Linha: Chips de Categoria */}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 items-center">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                        category === cat
                          ? 'bg-primary-blue text-white border-primary-blue shadow-xs font-bold'
                          : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue hover:text-primary-blue'
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
                    className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 font-semibold outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-700"
                  >
                    {RATING_FILTERS.map(r => <option key={r.value} value={r.value} className="dark:bg-slate-800 dark:text-white">{r.label}</option>)}
                  </select>

                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors p-1"
                    >
                      <RotateCcw size={12} /> Limpar
                    </button>
                  )}

                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">
                    <strong className="text-gray-900 dark:text-white font-bold">{filtered.length}</strong> prestador{filtered.length !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>

            </div>

            {/* ── GRID DE SERVIÇOS ── */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhum prestador encontrado com os filtros selecionados.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400 mb-5">Tente remover alguns filtros ou buscar por outra categoria.</p>
                <button onClick={resetFilters} className="btn btn-outline btn-sm">
                  <RotateCcw size={14} /> Restaurar Todos os Filtros
                </button>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map(s => <ServiceCard key={s.id} service={s} />)}
              </div>
            )}
          </>
        )}

      </main>

      {/* Modal: Editar Dados do Serviço Freelancer */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditModal(false)}>
          <div className="bg-white rounded-3xl shadow-brand-xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-primary-dark">Editar Dados &amp; Localização do Negócio</h3>
              <button onClick={() => setEditModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <form onSubmit={handleUpdateService} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Título / Nome do Serviço</label>
                <input
                  type="text"
                  value={serviceData.title}
                  onChange={e => setServiceData(d => ({ ...d, title: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: Manutenção Elétrica Residencial e Predial"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Prestador / Empresa</label>
                <input
                  type="text"
                  value={serviceData.providerName}
                  onChange={e => setServiceData(d => ({ ...d, providerName: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Completo do Estabelecimento</label>
                <input
                  type="text"
                  value={serviceData.address}
                  onChange={e => setServiceData(d => ({ ...d, address: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: Rua Paraná, 450 - Centro, Ivaiporã - PR"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone de Contato</label>
                <input
                  type="tel"
                  value={serviceData.phone}
                  onChange={e => setServiceData(d => ({ ...d, phone: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição das Atividades &amp; Especialidades</label>
                <textarea
                  value={serviceData.description}
                  onChange={e => setServiceData(d => ({ ...d, description: e.target.value }))}
                  className="form-control"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-outline btn-sm font-semibold">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-brand-xl w-full max-w-lg p-7 border border-gray-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">Cadastrar Meu Serviço</h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const category = e.target.category.value;
              const city = e.target.city.value;
              const phone = e.target.phone.value;
              const description = e.target.description.value;
              const title = e.target.title.value || category;

              const servicePayload = {
                title,
                name: title,
                category,
                providerName: currentUser?.name || 'Profissional Autônomo',
                avatar: currentUser?.avatar || '',
                providerEmail: currentUser?.email || '',
                city,
                phone: phone || currentUser?.phone || '',
                description,
                createdBy: currentUser?.uid || currentUser?.email || 'freelancer',
                rating: 5.0,
                reviewsCount: 0,
                badge: 'Prestador Regional',
                analytics: { views: 0, contacts: 0, closedDeals: 0, nonBuyers: 0, conversionRate: '0%' },
                reviews: [],
                forumTopics: []
              };
              await addService(servicePayload);
              showToast('🎉 Serviço cadastrado com sucesso no Marketplace!');
              setModal(false);
            }} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Título ou Nome do Serviço</label>
                <input name="title" type="text" className="form-control" placeholder="Ex: Manutenção Elétrica Residencial e Predial" required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoria do Serviço</label>
                <select name="category" className="form-control">
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cidade onde Atua</label>
                <select name="city" className="form-control">
                  {CITIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Telefone de Contato</label>
                <input name="phone" type="tel" className="form-control" placeholder="Ex: (43) 99999-0000" required />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição dos Serviços</label>
                <textarea name="description" className="form-control" rows={3} placeholder="Descreva seus serviços, especialidades e diferenciais..." required />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn btn-outline btn-sm">Cancelar</button>
                <button type="submit" className="btn btn-teal btn-sm font-bold shadow-md">Cadastrar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
