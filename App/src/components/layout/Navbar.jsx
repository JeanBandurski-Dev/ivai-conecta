import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  User, ChevronDown, Settings, LogOut, Briefcase, Star,
  Building2, PlusCircle, Menu, X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import useAppStore from '../../store/useAppStore';

export default function Navbar() {
  const { currentUser, selectedCity, cities, setCity, logout, showToast } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fecha menu mobile ao navegar
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    closeMobile();
    showToast('Sessão encerrada com sucesso.');
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors duration-200 py-1 border-b-2 ${
      isActive
        ? 'text-primary-blue border-primary-blue'
        : 'text-gray-600 border-transparent hover:text-primary-blue'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${
      isActive
        ? 'bg-primary-light text-primary-blue'
        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-blue'
    }`;

  const getProfileLink = () => {
    if (!currentUser) return '/perfil/1';
    if (currentUser.role === 'empresa') return '/empresa/1';
    if (currentUser.role === 'freelancer') return '/servicos?view=my_services';
    return '/perfil/1';
  };

  return (
    <>
      <nav className="bg-white/92 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-brand-sm">
        <div className="container">
          <div className="flex items-center justify-between h-[72px] gap-6 whitespace-nowrap">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <Logo size={40} />
              <span className="text-lg font-heading font-bold">
                <span className="text-primary-dark">Ivaí</span>{' '}
                <span className="text-primary-blue">Conecta</span>
              </span>
            </Link>

            {/* Nav links — desktop */}
            <ul className="hidden md:flex items-center gap-6 list-none">
              <li><NavLink to="/" end className={navLinkClass}>Dashboard</NavLink></li>
              <li><NavLink to="/vagas" className={navLinkClass}>Vagas & Match</NavLink></li>
              <li><NavLink to="/servicos" className={navLinkClass}>Serviços Locais</NavLink></li>
              {currentUser?.role === 'empresa' && (
                <li><NavLink to="/talentos" className={navLinkClass}>Banco de Talentos</NavLink></li>
              )}
            </ul>

            {/* City selector + Auth — desktop */}
            <div className="hidden md:flex items-center gap-3 shrink-0">

              {/* City selector */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm">
                <span className="text-gray-400 text-xs">📍</span>
                <select
                  value={selectedCity}
                  onChange={e => setCity(e.target.value)}
                  className="bg-transparent text-gray-700 text-xs font-medium outline-none cursor-pointer max-w-[140px]"
                >
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Auth area */}
              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:border-primary-blue transition-colors duration-200 bg-white"
                    aria-label="Menu do usuário"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center">
                      <User size={15} className="text-primary-blue" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-brand-xl overflow-hidden z-50">
                      {/* Header */}
                      <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50">
                        <div className="font-semibold text-sm text-gray-800 truncate">{currentUser.name}</div>
                        <div className="text-xs text-primary-blue font-medium mt-0.5">{currentUser.badge}</div>
                      </div>

                      {/* Items */}
                      <div className="py-1.5">
                        <Link to={getProfileLink()} onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-blue transition-colors">
                          <User size={14} /> {currentUser.role === 'empresa' ? 'Perfil da Empresa' : 'Meu Currículo & Perfil'}
                        </Link>

                        {(currentUser.role === 'aluno' || currentUser.role === 'candidato') && (
                          <Link to="/minhas-vagas" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-blue transition-colors">
                            <Briefcase size={14} /> Minhas Candidaturas
                          </Link>
                        )}

                        {currentUser.role === 'empresa' && (
                          <>
                            <Link to="/vagas?view=my_jobs" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-blue transition-colors">
                              <Building2 size={14} /> Minhas Vagas Criadas
                            </Link>
                            <Link to="/talentos" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-blue transition-colors">
                              <Star size={14} /> Banco de Talentos
                            </Link>
                          </>
                        )}

                        {currentUser.role === 'freelancer' && (
                          <Link to="/servicos?action=new" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-blue transition-colors">
                            <PlusCircle size={14} /> Cadastrar Novo Serviço
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 py-1.5">
                        <Link to="/configuracoes" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Settings size={14} /> Configurações da Conta
                        </Link>
                        <button
                          onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} /> Sair da Conta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm">
                  Entrar / Cadastrar
                </Link>
              )}
            </div>

            {/* Mobile — right side: hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {!currentUser && (
                <Link to="/login" className="btn btn-primary btn-sm text-xs">
                  Entrar
                </Link>
              )}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-primary-blue hover:border-primary-blue transition-colors"
                aria-label="Abrir menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>

        {/* ── MOBILE DRAWER ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="container py-3 space-y-1">

              {/* City selector mobile */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl mb-3">
                <span className="text-gray-400 text-xs">📍</span>
                <select
                  value={selectedCity}
                  onChange={e => setCity(e.target.value)}
                  className="bg-transparent text-gray-700 text-xs font-medium outline-none cursor-pointer flex-1"
                >
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <NavLink to="/" end className={mobileNavLinkClass} onClick={closeMobile}>Dashboard</NavLink>
              <NavLink to="/vagas" className={mobileNavLinkClass} onClick={closeMobile}>Vagas & Match</NavLink>
              <NavLink to="/servicos" className={mobileNavLinkClass} onClick={closeMobile}>Serviços Locais</NavLink>
              <NavLink to="/talentos" className={mobileNavLinkClass} onClick={closeMobile}>Banco de Talentos</NavLink>

              {currentUser && (
                <>
                  <div className="border-t border-gray-100 my-2" />

                  {/* User info */}
                  <div className="px-4 py-2.5 bg-gray-50 rounded-xl mb-1">
                    <div className="font-semibold text-sm text-gray-800">{currentUser.name}</div>
                    <div className="text-xs text-primary-blue">{currentUser.badge}</div>
                  </div>

                  <NavLink to={getProfileLink()} className={mobileNavLinkClass} onClick={closeMobile}>
                    <span className="flex items-center gap-2"><User size={14} /> Meu Perfil</span>
                  </NavLink>

                  {(currentUser.role === 'aluno' || currentUser.role === 'candidato') && (
                    <NavLink to="/minhas-vagas" className={mobileNavLinkClass} onClick={closeMobile}>
                      <span className="flex items-center gap-2"><Briefcase size={14} /> Minhas Candidaturas</span>
                    </NavLink>
                  )}

                  <NavLink to="/configuracoes" className={mobileNavLinkClass} onClick={closeMobile}>
                    <span className="flex items-center gap-2"><Settings size={14} /> Configurações</span>
                  </NavLink>

                  <button
                    onClick={() => { closeMobile(); setShowLogoutModal(true); }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> Sair da Conta
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Logout confirm modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-2xl shadow-brand-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-bold text-primary-dark mb-2">Deseja realmente sair?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Sua sessão no <strong>Ivaí Conecta</strong> será encerrada. Você precisará entrar novamente para acessar seu perfil.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLogoutModal(false)} className="btn btn-outline btn-sm">Cancelar</button>
              <button onClick={handleLogout} className="btn btn-danger btn-sm">Sair da Conta</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
