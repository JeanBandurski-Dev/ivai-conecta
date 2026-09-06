import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Sparkles, CheckCircle2, RotateCcw, Building2,
  GraduationCap, ArrowLeft, Star, Send, ShieldCheck, Mail, Phone,
  UserCheck, Award, Lock, BookOpen, Check, Eye
} from 'lucide-react';
import { getTalents, getVerifiedTeachers, getTeacherEndorsedStudents, CITIES } from '../lib/ivaiConecta';
import { subscribeToTalents, subscribeToTeachers } from '../services/talentsService.js';
import TalentCard from '../components/TalentCard';
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

const INSTITUTIONS = [
  'Todas as Instituições',
  'IFPR Campus Ivaiporã',
  'Univale Ivaiporã',
  'UENP',
  'Autônomo / Freelancer',
];

export default function BancoDeTalentos() {
  const navigate = useNavigate();
  const { currentUser, showToast, selectedCity, setCity: setGlobalCity } = useAppStore();

  const [activeTab,       setActiveTab]       = useState('talents'); // 'talents' | 'teachers'
  const [query,          setQuery]          = useState('');
  const [city,           setCity]           = useState(selectedCity || 'Todas as Cidades');
  const [area,           setArea]           = useState('Todas');
  const [institution,    setInstitution]    = useState('Todas as Instituições');
  const [onlyEndorsed,   setOnlyEndorsed]   = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy,         setSortBy]         = useState('endorsements');
  const [contactTalent,  setContactTalent]  = useState(null);

  useEffect(() => {
    if (selectedCity) setCity(selectedCity);
  }, [selectedCity]);

  // Modal to view students endorsed by a specific teacher
  const [selectedTeacherForEndorsements, setSelectedTeacherForEndorsements] = useState(null);

  const [liveTalents, setLiveTalents] = useState(() => getTalents('Todas as Cidades'));
  const [liveTeachers, setLiveTeachers] = useState(() => getVerifiedTeachers());

  useEffect(() => {
    const unsubTalents = subscribeToTalents('Todas as Cidades', (data) => {
      setLiveTalents(data);
    });
    const unsubTeachers = subscribeToTeachers((data) => {
      setLiveTeachers(data);
    });
    return () => {
      unsubTalents();
      unsubTeachers();
    };
  }, []);

  const all = liveTalents;
  const teachers = liveTeachers;

  const highlightedTalents = useMemo(() => {
    return all.filter(t => t.isVerifiedStudent && t.endorsements && t.endorsements.length >= 1).slice(0, 4);
  }, [all]);

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
        const isVerifiedOrSelf = t.isVerifiedStudent || (currentUser && String(currentUser.id) === String(t.id));
        if (!isVerifiedOrSelf) return false;

        const mCity = city === 'Todas as Cidades' || t.city === city;
        const mArea = area === 'Todas' || t.course.toLowerCase().includes(area.toLowerCase());
        const mInst = institution === 'Todas as Instituições' || t.institution.toLowerCase().includes(institution.toLowerCase()) || (institution.includes('Autônomo') && t.institution.includes('Autônomo'));
        const mEndorsed = !onlyEndorsed || (t.endorsements && t.endorsements.length > 0);
        const mSkills = selectedSkills.length === 0 || selectedSkills.some(sk => t.skills?.includes(sk));

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
  }, [all, city, area, institution, onlyEndorsed, selectedSkills, query, sortBy, currentUser]);

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
                <span>Talentos &amp; Docentes Verificados no Vale do Ivaí</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mt-1 mb-3 tracking-tight">
                Banco de Talentos &amp; Corpo Docente
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Conecte-se com estudantes das instituições parceiras (IFPR, Univale, UENP) com matrícula autenticada e recomendações docentes validadas.
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
          <div className="flex items-center gap-3 mt-8 border-b border-white/15 pt-2">
            <button
              onClick={() => setActiveTab('talents')}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'talents' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <GraduationCap size={16} /> Alunos &amp; Profissionais ({filtered.length})
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'teachers' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <Award size={16} /> Professores Verificados ({teachers.length})
            </button>
          </div>

        </div>
      </header>

      <main className="container section space-y-8">

        {/* ── ABA PROFESSORES VERIFICADOS ── */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <Award className="text-amber-400 fill-amber-400" size={24} /> Corpo Docente do Vale do Ivaí
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Professores e orientadores das universidades parceiras (IFPR, Univale, UENP) habilitados no sistema.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map(t => (
                <div key={t.id} className="card p-6 space-y-4 hover:border-primary-blue/40 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-primary-blue/30 shadow-xs shrink-0 bg-white dark:bg-slate-800" />
                      <div>
                        <h3 className="font-heading font-bold text-lg text-primary-dark dark:text-white leading-snug">{t.name}</h3>
                        <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 mt-0.5">{t.degree || 'Doutor / Mestre em Ciência da Computação'}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">{t.institution}</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-slate-300 font-medium">
                      <strong>Disciplina Principal:</strong> {t.discipline}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full w-fit font-bold">
                      <ShieldCheck size={13} /> {t.endorsementCount || 18} Alunos Recomendados
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
          </div>
        )}

        {/* ── ABA ALUNOS & TALENTOS ── */}
        {activeTab === 'talents' && (
          <>
            {/* Destaques */}
            {!hasActiveFilters && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                      <Sparkles className="text-amber-400 fill-amber-400" size={22} /> Talentos em Destaque na Região
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Estudantes com matrícula autenticada e pareceres docentes validados.</p>
                  </div>
                  <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full">
                    Selo de Excelência
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {highlightedTalents.map(t => (
                    <div key={t.id} className="card p-5 space-y-3 border-amber-200/60 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/20 dark:from-amber-950/30 to-white dark:to-slate-800 hover:border-amber-400 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-xs" />
                          <div>
                            <div className="font-bold text-gray-800 dark:text-white text-sm leading-tight">{t.name}</div>
                            <div className="text-xs text-primary-blue dark:text-blue-400 font-semibold truncate max-w-[140px]">{t.course}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/40 border border-green-200/70 dark:border-green-800/60 px-2.5 py-1 rounded-lg w-fit mb-2">
                          <ShieldCheck size={13} /> {t.endorsements.length} Parecer{t.endorsements.length > 1 ? 'es' : ''} Docente{t.endorsements.length > 1 ? 's' : ''}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {t.skills.slice(0, 3).map(s => (
                            <span key={s} className="tag text-[10px]">{s}</span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2">
                        <button onClick={() => navigate(`/perfil/${t.id}`)} className="text-xs font-bold text-primary-blue dark:text-blue-400 hover:underline">
                          Ver Perfil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PAINEL DE FILTROS ── */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-brand-sm space-y-4 transition-colors duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
                <div className="lg:col-span-5 flex items-center gap-2.5 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-gray-50/50 dark:bg-slate-800/50 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-primary-blue">
                  <Search size={17} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Busque por nome, curso, instituição ou habilidade..."
                    className="text-sm sm:text-base text-gray-800 dark:text-white placeholder-gray-400 outline-none bg-transparent w-full"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                      <X size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>

                <div className="lg:col-span-3">
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer font-medium"
                  >
                    {CITIES.map(c => <option key={c} value={c} className="dark:bg-slate-800 dark:text-white">{c}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <select
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer font-medium"
                  >
                    {AREAS.map(a => <option key={a.value} value={a.value} className="dark:bg-slate-800 dark:text-white">{a.label}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer font-medium"
                  >
                    <option value="endorsements" className="dark:bg-slate-800 dark:text-white">Mais Recomendados</option>
                    <option value="name" className="dark:bg-slate-800 dark:text-white">Nome (A-Z)</option>
                    <option value="city" className="dark:bg-slate-800 dark:text-white">Cidade</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── GRID DE TALENTOS ── */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
                <div className="flex justify-center mb-4">
                  <Search size={48} className="text-gray-300 dark:text-slate-600" />
                </div>
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhum talento encontrado com os filtros selecionados.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400 mb-5">Estudantes pendentes de verificação de matrícula ficam ocultos até realizarem a autenticação.</p>
                <button onClick={resetFilters} className="btn btn-outline btn-sm">
                  <RotateCcw size={14} /> Restaurar Filtros
                </button>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map(t => <TalentCard key={t.id} talent={t} />)}
              </div>
            )}
          </>
        )}

      </main>

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
              {getTeacherEndorsedStudents(selectedTeacherForEndorsements.email).map(student => (
                <div key={student.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800" />
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
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
