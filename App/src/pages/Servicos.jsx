import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Plus } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getServices, CITIES } from '../lib/ivaiConecta';
import ServiceCard from '../components/ServiceCard';

const CATEGORIES = ['Todas', 'Construção & Manutenção', 'Marketing & Design', 'Tecnologia & Suporte', 'Manutenção Doméstica', 'Finanças & Contabilidade', 'Educação & Cursos'];

export default function Servicos() {
  const { currentUser, showToast } = useAppStore();
  const [params] = useSearchParams();

  const [query,    setQuery]    = useState('');
  const [city,     setCity]     = useState('Todas as Cidades');
  const [category, setCategory] = useState('Todas');
  const [showModal, setModal]   = useState(params.get('action') === 'new');

  const all = getServices('Todas as Cidades');

  const filtered = all.filter(s => {
    const mCity = city === 'Todas as Cidades' || s.city === city;
    const mCat  = category === 'Todas' || s.category === category;
    const mQ    = !query || s.providerName.toLowerCase().includes(query.toLowerCase()) || s.category.toLowerCase().includes(query.toLowerCase()) || s.description.toLowerCase().includes(query.toLowerCase());
    return mCity && mCat && mQ;
  });

  return (
    <>
      <header className="bg-gradient-to-r from-primary-dark to-primary-blue text-white py-14">
        <div className="container flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="hero-tag">Autônomos e Empreendedores do Vale do Ivaí</span>
            <h1 className="text-4xl font-heading font-bold text-white mt-2 mb-2">Marketplace de Serviços Locais</h1>
            <p className="text-gray-300 max-w-xl">
              Encontre profissionais qualificados com avaliações de clientes e contato imediato por WhatsApp.
            </p>
          </div>
          {currentUser?.role === 'freelancer' && (
            <button onClick={() => setModal(true)} className="btn btn-teal btn-lg shrink-0">
              <Plus size={18} /> Cadastrar Meu Serviço
            </button>
          )}
        </div>
      </header>

      <main className="container section">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-brand-sm">
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Busque por eletricista, técnico, aulas, designer..."
                className="text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent w-full" />
              {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-400" /></button>}
            </div>
            <select value={city} onChange={e => setCity(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none bg-white cursor-pointer">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  category === cat
                    ? 'bg-primary-blue text-white border-primary-blue'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-blue hover:text-primary-blue'
                }`}>
                {cat}
              </button>
            ))}
            <span className="ml-auto text-sm text-gray-500 self-center">
              <strong className="text-gray-800">{filtered.length}</strong> prestador{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-semibold">Nenhum prestador encontrado com os filtros selecionados.</p>
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
          <div className="bg-white rounded-2xl shadow-brand-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-bold text-primary-dark">Cadastrar Meu Serviço</h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
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
