import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter, Plus, ChevronDown, X, Sparkles, SlidersHorizontal, RotateCcw, Briefcase, CheckCircle2, ArrowLeft } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getJobs, addJob, getTalents, calculateMatchScore, CITIES, getJobById } from '../lib/ivaiConecta';
import { subscribeToJobs } from '../services/jobsService.js';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';

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
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [query,         setQuery]         = useState(params.get('q') || '');
  const [filterCity,    setFilterCity]    = useState(selectedCity);
  const [filterType,    setFilterType]    = useState('Todos');
  const [filterModality,setFilterModality]= useState('Todas');
  const [minMatch,      setMinMatch]      = useState(0);
  const [selectedSkills,setSelectedSkills]= useState([]);
  const [sortBy,        setSortBy]        = useState('match');
  const [showNewModal,  setShowModal]     = useState(params.get('action') === 'new');
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [selectedJob,   setSelectedJob]   = useState(null);

  const [refreshKey,    setRefreshKey]    = useState(0);

  // New Job Form State
  const [newTitle,      setNewTitle]      = useState('');
  const [newType,       setNewType]       = useState('Tempo Integral');
  const [newModality,   setNewModality]   = useState('Presencial');
  const [newCity,       setNewCity]       = useState('Ivaiporã');
  const [newSkills,     setNewSkills]     = useState('');
  const [newSalary,     setNewSalary]     = useState('A combinar');
  const [newDesc,       setNewDesc]       = useState('');

  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));

  useEffect(() => {
    const unsub = subscribeToJobs('Todas as Cidades', (data) => {
      setLiveJobs(data);
    });
    return () => unsub();
  }, []);

  const allJobs = liveJobs;
  const demoSkills = getTalents('Todas as Cidades')[0]?.skills || ['JavaScript', 'HTML5/CSS3', 'React'];

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
      setShowModal(true);
    }
  }, [params]);

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Por favor, informe o título da vaga.');
      return;
    }

    const jobPayload = {
      title: newTitle.trim(),
      company: currentUser?.name || 'Empresa do Vale do Ivaí',
      companyLogo: currentUser?.avatar || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=150',
      city: newCity,
      type: newType,
      modality: newModality,
      salary: newSalary || 'A combinar',
      description: newDesc.trim() || 'Vaga publicada via Ivaí Conecta.',
      requiredSkills: newSkills ? newSkills.split(',').map(s => s.trim()).filter(Boolean) : ['Comunicação', 'Trabalho em Equipe'],
      recruiterPhone: currentUser?.phone || '5543999887766',
      createdBy: currentUser?.uid || currentUser?.email || 'empresa',
    };

    addJob(jobPayload);
    showToast('🎉 Vaga publicada com sucesso! Ela já está visível para candidatos e no seu painel.');
    setShowModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewSkills('');
    setParams({});
    setRefreshKey(k => k + 1);
  };

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

  const canSeeMatch = currentUser && (currentUser.role === 'aluno' || currentUser.role === 'candidato');
  const userSkills = currentUser?.skills || [];

  const filtered = useMemo(() => {
    return allJobs
      .map(job => {
        const score = canSeeMatch
          ? calculateMatchScore(userSkills, job.requiredSkills || [], { userCity: currentUser?.city, jobCity: job.city, isVerifiedStudent: currentUser?.isVerifiedStudent })
          : null;
        return { ...job, calculatedScore: score };
      })
      .filter(j => {
        // Cidade
        const matchCity = !filterCity || filterCity === 'Todas as Cidades' || j.city === filterCity;
        
        // Tipo
        const matchType = filterType === 'Todos' || j.type.toLowerCase().includes(filterType.toLowerCase());
        
        // Modalidade
        const matchModality = filterModality === 'Todas' || (j.modality && j.modality.toLowerCase().includes(filterModality.toLowerCase()));
        
        // Match Mínimo
        const matchScoreOk = !canSeeMatch || minMatch === 0 || (j.calculatedScore && j.calculatedScore >= minMatch);

        // Habilidades
        const matchSkillsOk = selectedSkills.length === 0 || selectedSkills.every(sk => (j.requiredSkills || []).some(r => r.toLowerCase().includes(sk.toLowerCase())));

        // Busca Textual
        const text = (j.title + ' ' + j.company + ' ' + (j.description || '') + ' ' + (j.requiredSkills || []).join(' ')).toLowerCase();
        const matchText = !query || text.includes(query.toLowerCase());

        return matchCity && matchType && matchModality && matchScoreOk && matchSkillsOk && matchText;
      })
      .sort((a, b) => {
        if (sortBy === 'match' && canSeeMatch) return (b.calculatedScore || 0) - (a.calculatedScore || 0);
        if (sortBy === 'recent') return (b.id || 0) - (a.id || 0);
        return 0;
      });
  }, [allJobs, filterCity, filterType, filterModality, minMatch, selectedSkills, query, sortBy, canSeeMatch, userSkills, currentUser]);

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
                Vagas de Emprego &amp; Estágio Regional
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Encontre vagas em Ivaiporã e cidades vizinhas com cálculo automático de match de habilidades e indicação direta de professores parceiros.
              </p>
            </div>

            {currentUser?.role === 'empresa' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-teal px-6 py-3.5 font-bold shadow-lg shrink-0 flex items-center gap-2"
              >
                <Plus size={18} /> Publicar Nova Vaga
              </button>
            )}
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
                placeholder="Cargo, empresa ou tecnologia..."
                className="text-sm text-gray-800 dark:text-white placeholder-gray-400 outline-none bg-transparent w-full"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 rounded-full">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Cidade */}
            <div className="lg:col-span-3">
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="form-control text-sm py-2.5 cursor-pointer"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tipo */}
            <div className="lg:col-span-3">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="form-control text-sm py-2.5 cursor-pointer"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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

          {/* Painel de Filtros Avançados */}
          {showAdvanced && (
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Modalidade */}
                <div>
                  <label className="form-label text-xs mb-1.5 block">Modalidade de Trabalho</label>
                  <select
                    value={filterModality}
                    onChange={e => setFilterModality(e.target.value)}
                    className="form-control text-xs py-2"
                  >
                    {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                {/* Match Mínimo (Alunos / Candidatos) */}
                {canSeeMatch && (
                  <div>
                    <label className="form-label text-xs mb-1.5 block">Nível de Match de Habilidades</label>
                    <select
                      value={minMatch}
                      onChange={e => setMinMatch(Number(e.target.value))}
                      className="form-control text-xs py-2"
                    >
                      {MATCH_RANGES.map(mr => <option key={mr.value} value={mr.value}>{mr.label}</option>)}
                    </select>
                  </div>
                )}

                {/* Ordenação */}
                <div>
                  <label className="form-label text-xs mb-1.5 block">Ordenar Vagas por</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="form-control text-xs py-2"
                  >
                    {canSeeMatch && <option value="match">Maior Match com Meu Perfil</option>}
                    <option value="recent">Mais Recentes Primeiro</option>
                  </select>
                </div>

              </div>

              {/* Habilidades Populares */}
              <div>
                <label className="form-label text-xs mb-2 block">Filtrar por Tecnologias &amp; Habilidades:</label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map(skill => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                        }`}
                      >
                        {skill} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── GRID DE VAGAS ── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
            <div className="text-5xl mb-4">🔍</div>
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

      {/* New Job Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-brand-xl w-full max-w-lg p-7 border border-gray-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">Publicar Nova Vaga</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" /></button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Título da Vaga *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="form-control"
                  placeholder="Ex: Desenvolvedor Front-end Junior"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Tipo de Contratação</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} className="form-control">
                    {TYPES.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Modalidade</label>
                  <select value={newModality} onChange={e => setNewModality(e.target.value)} className="form-control">
                    {MODALITIES.slice(1).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Cidade no Vale do Ivaí</label>
                  <select value={newCity} onChange={e => setNewCity(e.target.value)} className="form-control">
                    {CITIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Faixa Salarial</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={e => setNewSalary(e.target.value)}
                    className="form-control"
                    placeholder="Ex: R$ 2.500 ou A combinar"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Habilidades Necessárias (separadas por vírgula)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={e => setNewSkills(e.target.value)}
                  className="form-control"
                  placeholder="Ex: React, JavaScript, Git, Tailwind"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição das Atividades &amp; Benefícios</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="form-control"
                  rows={3}
                  placeholder="Descreva o papel, principais responsabilidades e requisitos..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline btn-sm font-semibold">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md">Publicar Vaga</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
