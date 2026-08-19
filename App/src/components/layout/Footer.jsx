import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <Logo size={36} color="#38BDF8" accentColor="#22C55E" />
              <span className="text-lg font-heading font-bold">
                <span className="text-white">Ivaí</span>{' '}
                <span className="text-accent-sky">Conecta</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Conectando talentos e oportunidades em Ivaiporã, Jardim Alegre, São João do Ivaí,
              Manoel Ribas e todo o Vale do Ivaí.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Dashboard', to: '/' },
                { label: 'Vagas Regionais', to: '/vagas' },
                { label: 'Serviços Locais', to: '/servicos' },
                { label: 'Banco de Talentos', to: '/talentos' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-accent-sky transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cidades */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Cidades Cobertas</h4>
            <ul className="space-y-2.5">
              {['Ivaiporã', 'Jardim Alegre', 'São João do Ivaí', 'Manoel Ribas'].map(city => (
                <li key={city}>
                  <span className="text-sm text-gray-400">{city}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Parceiros */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Instituições & Parceiros</h4>
            <ul className="space-y-2.5">
              {['IFPR Campus Ivaiporã', 'UENP', 'Univale', 'Associação Comercial (ACISI)'].map(inst => (
                <li key={inst}>
                  <span className="text-sm text-gray-400">{inst}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-sm text-gray-500 text-center">
            © 2026 Ivaí Conecta — Projeto de Extensão IFPR Campus Ivaiporã. Conectando talentos,
            profissionais e oportunidades em Ivaiporã e região.
          </p>
        </div>
      </div>
    </footer>
  );
}
