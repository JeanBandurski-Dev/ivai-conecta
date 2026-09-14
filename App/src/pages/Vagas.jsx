import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, X, Sparkles, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  getJobs, calculateMatchScore, CITIES, getJobById, safeSkillsArray, matchCity
} from '../lib/ivaiConecta';
import { subscribeToJobs } from '../services/jobsService.js';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';
import PublishJobModal from '../components/PublishJobModal';
import CustomSelect from '../components/ui/CustomSelect';

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

  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));

  useEffect(() => {
    const unsub = subscribeToJobs('Todas as Cidades', (data) => {
      if (Array.isArray(data)) setLiveJobs(data);
    });
    return () => unsub();
  }, [refreshKey]);

  const allJobs = Array.isArray(liveJobs) ? liveJobs : [];

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
      const uRole = String(currentUser?.role || '').toLowerCase().trim();
      if (uRole === 'empresa' || uRole === 'company' || uRole === 'recrutador') {
        setShowModal(true);
      } else {
        showToast('⚠️ Apenas empresas cadastradas podem publicar vagas.');
        setParams({});
      }
    }
  }, [params, currentUser]);

  useEffect(() => {
    if (selectedCity) {
      setFilterCity(selectedCity);
    }
  }, [selectedCity]);

  const handleOpenPublish = () => {
    const uRole = String(currentUser?.role || '').toLowerCase().trim();
    if (uRole === 'empresa' || uRole === 'company' || uRole === 'recrutador') {
      setShowModal(true);
    } else {
      showToast('⚠️ Apenas empresas cadastradas podem publicar vagas.');
    }
  };

  const handleJobCreated = () => {
    setRefreshKey(k => k + 1);
    setParams({});
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

  const userRole = String(currentUser?.role || '').toLowerCase().trim();
  const canSeeMatch = Boolean(currentUser && (userRole === 'aluno' || userRole === 'candidato' || userRole === 'estudante' || userRole === 'student'));
  const userSkills = useMemo(() => safeSkillsArray(currentUser?.skills), [currentUser?.skills]);

  const filtered = useMemo(() => {
    if (!Array.isArray(allJobs)) return [];

    return allJobs
      .filter(j => j && typeof j === 'object')
      .map(job => {
        const reqSkills = safeSkillsArray(job.requiredSkills);
        const score = canSeeMatch
          ? calculateMatchScore(userSkills, reqSkills, {
              userCity: currentUser?.city,
              jobCity: job.city,
              isVerifiedStudent: currentUser?.isVerifiedStudent,
              endorsementsCount: (currentUser?.endorsements?.length || currentUser?.endorsementCount || 0)
            })
          : null;
        return { ...job, requiredSkills: reqSkills, calculatedScore: score };
      })
      .filter(j => {
        // Cidade
        const matchCityOk = matchCity(j.city, filterCity);
        
        // Tipo
        const matchType = filterType === 'Todos' || (j.type && String(j.type).toLowerCase().includes(filterType.toLowerCase()));
        
        // Modalidade
        const matchModality = filterModality === 'Todas' || (j.modality && String(j.modality).toLowerCase().includes(filterModality.toLowerCase()));
        
        // Match Mínimo
        const matchScoreOk = !canSeeMatch || minMatch === 0 || (typeof j.calculatedScore === 'number' && j.calculatedScore >= minMatch);

        // Habilidades
        const matchSkillsOk = selectedSkills.length === 0 || selectedSkills.every(sk => 
          (j.requiredSkills || []).some(r => r && String(r).toLowerCase().includes(String(sk).toLowerCase()))
        );

        // Busca Textual
        const text = (
          String(j.title || '') + ' ' + 
          String(j.company || '') + ' ' + 
          String(j.description || '') + ' ' + 
          (j.requiredSkills || []).join(' ')
        ).toLowerCase();
        const matchText = !query || text.includes(query.toLowerCase());

        return matchCityOk && matchType && matchModality && matchScoreOk && matchSkillsOk && matchText;
      })
      .sort((a, b) => {
        if (sortBy === 'match' && canSeeMatch) {
          return (Number(b.calculatedScore) || 0) - (Number(a.calculatedScore) || 0);
        }
        if (sortBy === 'recent') {
          const timeA = a.createdAtTimestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0) || 0;
          const timeB = b.createdAtTimestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0) || 0;
          return timeB - timeA;
        }
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

            <button
              onClick={handleOpenPublish}
              className="btn btn-teal px-6 py-3.5 font-bold shadow-lg shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={18} /> Publicar Nova Vaga
            </button>
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
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Cidade */}
            <div className="lg:col-span-3">
              <CustomSelect
                value={filterCity}
                onChange={setFilterCity}
                options={CITIES}
                searchable={true}
                placeholder="Cidade"
              />
            </div>

            {/* Tipo */}
            <div className="lg:col-span-3">
              <CustomSelect
                value={filterType}
                onChange={setFilterType}
                options={TYPES}
                placeholder="Tipo de Contrato"
              />
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
                  <label className="form-label text-xs mb-1.5 block font-bold">Modalidade de Trabalho</label>
                  <CustomSelect
                    value={filterModality}
                    onChange={setFilterModality}
                    options={MODALITIES}
                    size="sm"
                  />
                </div>

                {/* Match Mínimo (Alunos / Candidatos) */}
                {canSeeMatch && (
                  <div>
                    <label className="form-label text-xs mb-1.5 block font-bold">Nível de Match de Habilidades</label>
                    <CustomSelect
                      value={minMatch}
                      onChange={val => setMinMatch(Number(val))}
                      options={MATCH_RANGES}
                      size="sm"
                    />
                  </div>
                )}

                {/* Ordenação */}
                <div>
                  <label className="form-label text-xs mb-1.5 block font-bold">Ordenar Vagas por</label>
                  <CustomSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      ...(canSeeMatch ? [{ value: 'match', label: 'Maior Match com Meu Perfil' }] : []),
                      { value: 'recent', label: 'Mais Recentes Primeiro' }
                    ]}
                    size="sm"
                  />
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                        }`}
                      >
                        <span>{skill}</span>
                        {isSelected && <Check size={12} strokeWidth={3} />}
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
            <div className="flex justify-center mb-4">
              <Search size={48} className="text-gray-300 dark:text-slate-600" />
            </div>
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

      {/* New Job Modal (Padrão Vale do Ivaí / 3 Passos Completo) */}
      <PublishJobModal
        isOpen={showNewModal}
        onClose={() => {
          setShowModal(false);
          setParams({});
        }}
        onJobCreated={handleJobCreated}
      />
    </>
  );
}
