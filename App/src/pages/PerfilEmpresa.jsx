import { Building2, MapPin, Users, Briefcase, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getJobs } from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';
import useAppStore from '../store/useAppStore';

export default function PerfilEmpresa() {
  const { currentUser } = useAppStore();

  const company = {
    name:     'ValeTech Soluções Digitais',
    city:     'Ivaiporã',
    sector:   'Tecnologia da Informação',
    size:     '11-50 funcionários',
    rating:   4.8,
    reviews:  24,
    logo:     'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250',
    about:    'Empresa de tecnologia especializada em desenvolvimento de software, sistemas web e soluções digitais para o comércio local. Com sede em Ivaiporã, atendemos clientes em todo o Vale do Ivaí.',
    perks:    ['Plano de saúde', 'Home office híbrido', 'Participação nos lucros', 'Vale alimentação', 'Ambiente colaborativo'],
  };

  const jobs = getJobs('Ivaiporã').filter(j => j.company === company.name);

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-blue text-white py-14">
        <div className="container flex flex-wrap items-center gap-6">
          <img src={company.logo} alt={company.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-brand-lg shrink-0" />
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">{company.name}</h1>
            <div className="text-accent-sky font-semibold mb-1">{company.sector}</div>
            <div className="flex items-center gap-3 text-gray-300 text-sm flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={13} />{company.city}</span>
              <span className="flex items-center gap-1"><Users size={13} />{company.size}</span>
              <span className="flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />{company.rating} ({company.reviews} avaliações)</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container section">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-heading font-bold text-primary-dark mb-3">Sobre a Empresa</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{company.about}</p>
            </div>
            <div className="card">
              <h3 className="font-heading font-bold text-primary-dark mb-3">Benefícios</h3>
              <ul className="space-y-2">
                {company.perks.map(p => (
                  <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-500">✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-primary-dark">
                Vagas Abertas ({jobs.length})
              </h2>
              {currentUser?.role === 'empresa' && (
                <Link to="/vagas?action=new" className="btn btn-teal btn-sm">+ Publicar Vaga</Link>
              )}
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">Nenhuma vaga aberta no momento.</div>
            ) : (
              <div className="grid-3">
                {jobs.map(j => <JobCard key={j.id} job={j} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
