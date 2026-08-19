import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { getTalents, CITIES } from '../lib/ivaiConecta';
import TalentCard from '../components/TalentCard';

export default function BancoDeTalentos() {
  const [query, setQuery]   = useState('');
  const [city,  setCity]    = useState('Todas as Cidades');

  const all = getTalents('Todas as Cidades');

  const filtered = all.filter(t => {
    const mCity = city === 'Todas as Cidades' || t.city === city;
    const mQ    = !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.course.toLowerCase().includes(query.toLowerCase()) ||
      t.skills.some(s => s.toLowerCase().includes(query.toLowerCase()));
    return mCity && mQ;
  });

  return (
    <>
      <header className="bg-gradient-to-r from-primary-dark to-primary-blue text-white py-14">
        <div className="container">
          <span className="hero-tag">Talentos Verificados do Vale do Ivaí</span>
          <h1 className="text-4xl font-heading font-bold text-white mt-2 mb-2">Banco de Talentos Regional</h1>
          <p className="text-gray-300 max-w-xl">
            Encontre estudantes, profissionais e freelancers com endossos verificados de docentes e empresas parceiras.
          </p>
        </div>
      </header>

      <main className="container section">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-brand-sm flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Busque por nome, curso ou habilidade..."
              className="text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent w-full" />
            {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-400" /></button>}
          </div>
          <select value={city} onChange={e => setCity(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer">
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <span className="text-sm text-gray-500 ml-auto">
            <strong className="text-gray-800">{filtered.length}</strong> talento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-4">🎓</div>
            <p className="font-semibold">Nenhum talento encontrado com os filtros selecionados.</p>
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
