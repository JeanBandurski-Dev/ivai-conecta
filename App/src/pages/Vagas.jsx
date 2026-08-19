import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Filter, Plus, ChevronDown, X } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getJobs, getTalents, calculateMatchScore, CITIES } from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';

const TYPES = ['Todos', 'Tempo Integral', 'Meio Período', 'Estágio / Trainee', 'Prestador de Serviço (PJ)', 'Remoto'];

export default function Vagas() {
  const { selectedCity, currentUser, showToast } = useAppStore();
  const [params] = useSearchParams();

  const [query,       setQuery]       = useState(params.get('q') || '');
  const [filterCity,  setFilterCity]  = useState(selectedCity);
  const [filterType,  setFilterType]  = useState('Todos');
  const [showNewModal, setShowModal]  = useState(params.get('action') === 'new');

  const allJobs = getJobs('Todas as Cidades');
  const demoSkills = getTalents('Todas as Cidades')[0]?.skills || ['JavaScript', 'HTML5/CSS3', 'React'];

  const filtered = allJobs.filter(j => {
    const matchCity  = !filterCity || filterCity === 'Todas as Cidades' || j.city === filterCity;
    const matchType  = filterType === 'Todos' || j.type.includes(filterType);
    const matchQuery = !query || j.title.toLowerCase().includes(query.toLowerCase()) || j.company.toLowerCase().includes(query.toLowerCase()) || j.requiredSkills.some(s => s.toLowerCase().includes(query.toLowerCase()));
    return matchCity && matchType && matchQuery;
  });

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-dark to-primary-blue text-white py-14">
        <div className="container flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="hero-tag">Oportunidades Regionais com Matching Inteligente</span>
            <h1 className="text-4xl font-heading font-bold text-white mt-2 mb-2">Vagas & Matching</h1>
            <p className="text-gray-300 max-w-xl">
              Encontre vagas em Ivaiporã e na região com compatibilidade calculada com seu perfil de habilidades.
            </p>
          </div>
          {currentUser?.role === 'empresa' && (
            <button onClick={() => setShowModal(true)} className="btn btn-teal btn-lg shrink-0">
              <Plus size={18} /> Publicar Nova Vaga
            </button>
          )}
        </div>
      </header>

      <main className="container section">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 flex flex-wrap gap-4 items-center shadow-brand-sm">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por cargo, empresa ou habilidade..."
              className="text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent w-full"
            />
            {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>}
          </div>

          <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer">
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer">
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="text-sm text-gray-500 ml-auto">
            <strong className="text-gray-800">{filtered.length}</strong> vaga{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-semibold">Nenhuma vaga encontrada com os filtros selecionados.</p>
            <p className="text-sm mt-1">Tente alterar os filtros ou a cidade.</p>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(j => (
              <JobCard key={j.id} job={j} matchScore={calculateMatchScore(demoSkills, j.requiredSkills)} />
            ))}
          </div>
        )}
      </main>

      {/* New Job Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-brand-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
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
                  {TYPES.slice(1).map(t => <option key={t}>{t}</option>)}
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
