import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, X, Sparkles, RotateCcw,
  ArrowLeft, ShieldCheck, Award, Eye, UserCheck, GraduationCap, Bookmark
} from 'lucide-react';
import {
  getTeacherEndorsedStudents, CITIES, matchCity, useTalents, isTalentFavorited
} from '../lib/ivaiConecta';
import TalentCard from '../components/TalentCard';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../services/chatService';
import useAppStore from '../store/useAppStore';

const AREAS = [
  { label: 'Todas as Áreas', value: 'Todas' },
  { label: 'Tecnologia & ADS', value: 'Sistemas' },
  { label: 'Administração & Negócios', value: 'Administração' },
  { label: 'Elétrica & Automação', value: 'Eletrotécnica' },
  { label: 'Design & Criação Digital', value: 'Design' },
  { label: 'Pedagogia & Treinamento', value: 'Pedagogia' },
  { label: 'Contabilidade & Finanças', value: 'Contábeis' },
];

export default function BancoDeTalentos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, selectedCity, favoriteTalents = [] } = useAppStore();

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'favorites' || tabParam === 'salvos' ? 'favorites' : (tabParam === 'teachers' ? 'teachers' : 'talents');
  const [activeTab,       setActiveTab]       = useState(initialTab); // 'talents' | 'teachers' | 'favorites'
  const [query,          setQuery]          = useState('');
  const [city,           setCity]           = useState(selectedCity || 'Todas as Cidades');
  const [area,           setArea]           = useState('Todas');
  const [institution,    setInstitution]    = useState('Todas as Instituições');
  const [onlyEndorsed,   setOnlyEndorsed]   = useState(false);
  const [onlyFavorites,  setOnlyFavorites]  = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy,         setSortBy]         = useState('endorsements');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'favorites' || tab === 'salvos') {
      setActiveTab('favorites');
    } else if (tab === 'teachers') {
      setActiveTab('teachers');
    } else if (tab === 'talents') {
      setActiveTab('talents');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', newTab);
      return p;
    });
  };

  useEffect(() => {
    if (selectedCity) setCity(selectedCity);
  }, [selectedCity]);

  // Modal to view students endorsed by a specific teacher
  const [selectedTeacherForEndorsements, setSelectedTeacherForEndorsements] = useState(null);

  const { talents: all, teachers } = useTalents('Todas as Cidades');

  const highlightedTalents = useMemo(() => {
    return all.filter(t => t.isVerifiedStudent && t.endorsements && t.endorsements.length >= 1).slice(0, 4);
  }, [all]);

  const savedTalents = useMemo(() => {
    if (!Array.isArray(favoriteTalents) || favoriteTalents.length === 0) return [];
    return all.filter(t => isTalentFavorited(t, favoriteTalents));
  }, [all, favoriteTalents]);

  const hasActiveFilters = query || city !== 'Todas as Cidades' || area !== 'Todas' || institution !== 'Todas as Instituições' || onlyEndorsed || onlyFavorites || selectedSkills.length > 0;

  const resetFilters = () => {
    setQuery('');
    setCity('Todas as Cidades');
    setArea('Todas');
    setInstitution('Todas as Instituições');
    setOnlyEndorsed(false);
    setOnlyFavorites(false);
    setSelectedSkills([]);
    setSortBy('endorsements');
  };

  const filtered = useMemo(() => {
    return all
      .filter(t => {
        const mCity = matchCity(t.city, city);
        const mArea = area === 'Todas' || (t.course && t.course.toLowerCase().includes(area.toLowerCase()));
        const mInst = institution === 'Todas as Instituições' || (t.institution && t.institution.toLowerCase().includes(institution.toLowerCase())) || (institution.includes('Autônomo') && t.institution && t.institution.includes('Autônomo'));
        const mEndorsed = !onlyEndorsed || (t.endorsements && t.endorsements.length > 0);
        const mFav = !onlyFavorites || isTalentFavorited(t, favoriteTalents);
        const mSkills = selectedSkills.length === 0 || selectedSkills.some(sk => t.skills?.some(s => s && s.toLowerCase().includes(sk.toLowerCase())));

        const q = query.toLowerCase().trim();
        const mQ = !q ||
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.course && t.course.toLowerCase().includes(q)) ||
          (t.city && t.city.toLowerCase().includes(q)) ||
          (t.institution && t.institution.toLowerCase().includes(q)) ||
          t.skills?.some(s => s && s.toLowerCase().includes(q));

        return mCity && mArea && mInst && mEndorsed && mFav && mSkills && mQ;
      })
      .sort((a, b) => {
        if (sortBy === 'endorsements') return (b.endorsements?.length || 0) - (a.endorsements?.length || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'city') return (a.city || '').localeCompare(b.city || '');
        return 0;
      });
  }, [all, city, area, institution, onlyEndorsed, onlyFavorites, selectedSkills, query, sortBy, favoriteTalents]);

  const userRole = String(currentUser?.role || '').toLowerCase().trim();
  const isCompany = Boolean(currentUser && (userRole === 'empresa' || userRole === 'company' || userRole === 'recrutador'));

  if (!isCompany) {
    return (
      <main className="container section text-center py-24 max-w-xl mx-auto animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <ShieldCheck size={32} />
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Acesso Exclusivo para Empresas
        </h2>
        <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
          {currentUser
            ? 'O Banco de Talentos é uma ferramenta reservada para empresas e recrutadores contratantes avaliarem perfis profissionais e acadêmicos da região.'
            : 'Faça login com uma conta corporativa de empresa ou recrutador para visualizar os perfis e habilidades do Banco de Talentos.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!currentUser ? (
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary px-6 py-2.5 font-bold shadow-md cursor-pointer"
            >
              Entrar como Empresa
            </button>
          ) : (
            <button
              onClick={() => navigate('/vagas')}
              className="btn btn-primary px-6 py-2.5 font-bold shadow-md cursor-pointer"
            >
              Ver Vagas &amp; Oportunidades
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline px-6 py-2.5 font-bold cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Hero Header */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-10 lg:py-14 overflow-hidden w-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(0,82,255,0.25),transparent_50%)] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full max-w-full">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-5 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-accent-sky text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={16} /> Banco de Talentos Regional
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white mb-2 leading-tight">
                Talentos &amp; Docentes do Vale do Ivaí
              </h1>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Encontre estudantes qualificados, profissionais técnicos e professores orientadores do IFPR, Univale e UENP.
              </p>
            </div>

            {currentUser?.role === 'professor' ? (
              <button
                onClick={() => navigate('/minhas-vagas')}
                className="btn btn-teal px-5 py-3 font-bold shadow-md shrink-0 flex items-center gap-2"
              >
                <UserCheck size={18} /> Ir para Meu Painel do Docente →
              </button>
            ) : null}
          </div>

          {/* Abas de Navegação */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6 sm:mt-8 border-b border-white/15 pt-2 overflow-x-auto scrollbar-none w-full max-w-full">
            <button
              onClick={() => handleTabChange('talents')}
              className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'talents' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <GraduationCap size={16} /> Alunos &amp; Profissionais ({filtered.length})
            </button>

            <button
              onClick={() => handleTabChange('teachers')}
              className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'teachers' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <Award size={16} /> Professores Verificados ({teachers.length})
            </button>

            <button
              onClick={() => handleTabChange('favorites')}
              className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'favorites' ? 'border-amber-400 text-amber-300' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <Bookmark size={16} className={savedTalents.length > 0 ? 'fill-amber-400 text-amber-400' : ''} />
              Talentos Salvos ({savedTalents.length})
            </button>
          </div>

        </div>
      </header>

      <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 w-full max-w-full">

        {/* ── ABA TALENTOS SALVOS / FAVORITOS ── */}
        {activeTab === 'favorites' && (
          <div className="space-y-6 w-full animate-in fade-in duration-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <Bookmark className="text-amber-500 fill-amber-500" size={24} /> Talentos Salvos &amp; Favoritos ({savedTalents.length})
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Estudantes e profissionais salvos pela sua empresa para acompanhar formação ou contatar em vagas futuras.
                </p>
              </div>

              {savedTalents.length > 0 && (
                <button
                  onClick={() => handleTabChange('talents')}
                  className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Search size={14} /> Explorar Mais Talentos
                </button>
              )}
            </div>

            {savedTalents.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-3 max-w-xl mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
                  <Bookmark size={32} className="fill-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-lg text-primary-dark dark:text-white">
                  Nenhum talento salvo ainda
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  Ao explorar o Banco de Talentos, clique no ícone de marcador (bookmark) no card de qualquer estudante ou profissional para salvá-lo aqui e montar seu banco de pré-seleção.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleTabChange('talents')}
                    className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-xs inline-flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <Search size={14} /> Explorar Alunos &amp; Profissionais
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full max-w-full">
                {savedTalents.map(t => <TalentCard key={t.id || t.uid || t.firestoreId} talent={t} />)}
              </div>
            )}
          </div>
        )}

        {/* ── ABA PROFESSORES VERIFICADOS ── */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <Award className="text-amber-400 fill-amber-400" size={24} /> Corpo Docente do Vale do Ivaí
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Professores e orientadores das universidades parceiras (IFPR, Univale, UENP) habilitados no sistema.
                </p>
              </div>
            </div>

            {teachers.length === 0 ? (
              <div className="card p-10 text-center space-y-4 max-w-md mx-auto my-8 border border-gray-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-primary-dark dark:text-white">
                    Nenhum professor cadastrado ainda
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Os docentes de universidades parceiras (IFPR, Univale, UENP) cadastrados no sistema com o perfil Professor aparecerão aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {teachers.map(t => (
                  <div key={t.id} className="card p-6 space-y-4 hover:border-primary-blue/40 transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4 min-w-0">
                        <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-primary-blue/30 shadow-xs shrink-0 bg-white dark:bg-slate-800" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-heading font-bold text-lg text-primary-dark dark:text-white leading-snug truncate">{t.name}</h3>
                          <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 mt-0.5 truncate">{t.degree || 'Docente / Orientador'}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium truncate">{t.institution}</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-slate-300 font-medium">
                        <strong>Disciplina Principal:</strong> {t.discipline}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full w-fit font-bold">
                        <ShieldCheck size={13} /> {t.endorsementCount || 0} Alunos Recomendados
                      </div>
                    </div>

                    {/* 2 Botões de Ação */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/professor/${t.id}`)}
                        className="btn btn-outline btn-sm text-xs font-bold flex-1 flex items-center justify-center gap-1"
                      >
                        <Eye size={13} /> Ver Perfil
                      </button>
                      
                      <button
                        onClick={() => setSelectedTeacherForEndorsements(t)}
                        className="btn btn-primary btn-sm text-xs font-bold flex-1 flex items-center justify-center gap-1"
                      >
                        <Award size={13} /> Ver Indicações
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA ALUNOS & TALENTOS ── */}
        {activeTab === 'talents' && (
          <div className="space-y-8 w-full">
            {/* Destaques */}
            {!hasActiveFilters && (
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-heading text-xl sm:text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                      <Sparkles className="text-amber-400 fill-amber-400 shrink-0" size={22} /> Talentos em Destaque na Região
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                      Estudantes com matrícula autenticada e pareceres docentes validados.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full shrink-0">
                    Selo de Excelência
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                  {highlightedTalents.map(t => (
                    <div key={t.id} className="card p-5 space-y-3 border-amber-200/60 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/20 dark:from-amber-950/30 to-white dark:to-slate-800 hover:border-amber-400 transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                      <div>
                        <div className="flex items-center gap-3 mb-2 min-w-0">
                          <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-xs shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-800 dark:text-white text-sm leading-tight truncate">{t.name}</div>
                            <div className="text-xs text-primary-blue dark:text-blue-400 font-semibold truncate max-w-full">{t.course}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/40 border border-green-200/70 dark:border-green-800/60 px-2.5 py-1 rounded-lg w-fit mb-2">
                          <ShieldCheck size={13} /> {t.endorsements.length} Parecer{t.endorsements.length > 1 ? 'es' : ''} Docente{t.endorsements.length > 1 ? 's' : ''}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {t.skills.slice(0, 3).map(s => (
                            <span key={s} className="tag text-[10px] truncate max-w-[120px]">{s}</span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2">
                        <button onClick={() => navigate(`/perfil/${t.id}`)} className="text-xs font-bold text-primary-blue dark:text-blue-400 hover:underline cursor-pointer">
                          Ver Perfil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PAINEL DE FILTROS ── */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-brand-sm space-y-4 transition-colors duration-300 w-full max-w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center w-full">
                <div className="sm:col-span-2 lg:col-span-5 flex items-center gap-2.5 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-gray-50/50 dark:bg-slate-800/50 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-primary-blue min-w-0">
                  <Search size={17} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Busque por nome, curso, instituição ou habilidade..."
                    className="text-sm text-gray-800 dark:text-white placeholder-gray-400 outline-none bg-transparent w-full min-w-0"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full shrink-0 cursor-pointer">
                      <X size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>

                <div className="sm:col-span-1 lg:col-span-3 min-w-0">
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer font-medium truncate"
                  >
                    {CITIES.map(c => <option key={c} value={c} className="dark:bg-slate-800 dark:text-white">{c}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-1 lg:col-span-2 min-w-0">
                  <select
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer font-medium truncate"
                  >
                    {AREAS.map(a => <option key={a.value} value={a.value} className="dark:bg-slate-800 dark:text-white">{a.label}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-2 min-w-0">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer font-medium truncate"
                  >
                    <option value="endorsements" className="dark:bg-slate-800 dark:text-white">Mais Recomendados</option>
                    <option value="name" className="dark:bg-slate-800 dark:text-white">Nome (A-Z)</option>
                    <option value="city" className="dark:bg-slate-800 dark:text-white">Cidade</option>
                  </select>
                </div>
              </div>

              {/* Botões rápidos de filtro */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOnlyEndorsed(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    onlyEndorsed
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-primary-blue dark:text-blue-300 border-primary-blue/30 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                  }`}
                >
                  <ShieldCheck size={13} className={onlyEndorsed ? 'text-primary-blue dark:text-blue-300' : 'text-gray-400'} />
                  <span>Apenas com Parecer Docente</span>
                </button>

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
                  <span>Apenas Meus Favoritos ({savedTalents.length})</span>
                </button>
              </div>
            </div>

            {/* ── GRID DE TALENTOS ── */}
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs w-full">
                <div className="flex justify-center mb-4">
                  <Search size={48} className="text-gray-300 dark:text-slate-600" />
                </div>
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhum talento encontrado com os filtros selecionados.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400 mb-5">Estudantes pendentes de verificação de matrícula ficam ocultos até realizarem a autenticação.</p>
                <button onClick={resetFilters} className="btn btn-outline btn-sm cursor-pointer">
                  <RotateCcw size={14} /> Restaurar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full max-w-full">
                {filtered.map(t => <TalentCard key={t.id} talent={t} />)}
              </div>
            )}
          </div>
        )}

      </section>

      {/* Modal: Alunos Recomendados pelo Professor Específico */}
      {selectedTeacherForEndorsements && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTeacherForEndorsements(null)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-2xl p-7 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <Award size={22} className="text-amber-500 fill-amber-500" /> Indicações de {selectedTeacherForEndorsements.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{selectedTeacherForEndorsements.institution} · {selectedTeacherForEndorsements.discipline}</p>
              </div>
              <button onClick={() => setSelectedTeacherForEndorsements(null)}><X size={22} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
            </div>

            <div className="space-y-3">
              {getTeacherEndorsedStudents(selectedTeacherForEndorsements.email).length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-slate-800 rounded-2xl text-gray-400 dark:text-slate-500 text-sm">
                  Este docente ainda não emitiu recomendações registradas no sistema.
                </div>
              ) : (
                getTeacherEndorsedStudents(selectedTeacherForEndorsements.email).map(student => (
                  <div key={student.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {student.avatar && !isGenericPlaceholderAvatar(student.avatar) ? (
                        <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0 bg-white" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(student.name)} text-white font-bold text-sm flex items-center justify-center shrink-0 border border-white/20 shadow-xs`}>
                          {(student.name || 'A').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-800 dark:text-white text-base">{student.name}</div>
                        <div className="text-xs text-primary-blue dark:text-blue-400 font-semibold">{student.course} ({student.institution})</div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedTeacherForEndorsements(null); navigate(`/perfil/${student.id}`); }}
                      className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5"
                    >
                      <Eye size={13} /> Ver Currículo Completo
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
