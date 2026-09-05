import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  User, ChevronDown, Settings, LogOut, Briefcase, Star,
  Building2, PlusCircle, Menu, X, Sun, Moon, MessageSquare
} from 'lucide-react';
import Logo from '../ui/Logo';
import useAppStore from '../../store/useAppStore';

export default function Navbar() {
  const { currentUser, theme, toggleTheme, logout, showToast, openChat } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    closeMobile();
    showToast('Sessão encerrada com sucesso.');
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm lg:text-base font-semibold transition-all duration-200 py-6 border-b-[3px] relative ${isActive
      ? 'text-primary-blue dark:text-blue-400 border-primary-blue dark:border-blue-400 font-bold'
      : 'text-gray-600 dark:text-gray-300 border-transparent hover:text-primary-blue dark:hover:text-blue-400'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl text-base font-semibold transition-colors duration-200 ${isActive
      ? 'bg-primary-light dark:bg-blue-950/60 text-primary-blue dark:text-blue-400'
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-blue'
    }`;

  const getProfileLink = () => {
    if (!currentUser) return '/login';
    const userIdentifier = currentUser.uid || currentUser.id;
    if (currentUser.role === 'empresa') return userIdentifier ? `/empresa/${userIdentifier}` : '/empresa';
    if (currentUser.role === 'professor') return userIdentifier ? `/professor/${userIdentifier}` : '/professor';
    if (currentUser.role === 'freelancer') return '/servicos?view=dashboard';
    return userIdentifier ? `/perfil/${userIdentifier}` : '/perfil';
  };

  return (
    <>
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-slate-800 shadow-xs transition-colors duration-300">
        <div className="container">
          <div className="flex items-center justify-between h-[74px] gap-6 whitespace-nowrap">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <Logo size={40} />
              <span className="text-xl font-heading font-extrabold tracking-tight">
                <span className="text-primary-dark dark:text-white">Ivaí</span>{' '}
                <span className="text-primary-blue dark:text-blue-400">Conecta</span>
              </span>
            </Link>

            {/* Nav links — desktop centered */}
            <ul className="hidden md:flex items-center gap-8 list-none mx-auto">
              <li><NavLink to="/" end className={navLinkClass}>Início</NavLink></li>
              <li><NavLink to="/vagas" className={navLinkClass}>Vagas &amp; Match</NavLink></li>
              <li><NavLink to="/servicos" className={navLinkClass}>Serviços Locais</NavLink></li>
              <li><NavLink to="/talentos" className={navLinkClass}>Banco de Talentos</NavLink></li>
            </ul>

            {/* Right actions: Theme Switcher & User / Auth */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0 ml-auto md:ml-0">

              {/* Chat Button com indicador */}
              {currentUser && (
                <button
                  onClick={() => openChat()}
                  className="p-2.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-primary-blue dark:hover:border-blue-400 transition-all duration-200 shadow-xs cursor-pointer relative"
                  title="Mensagens & Chat"
                  aria-label="Abrir chat"
                >
                  <MessageSquare size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-blue rounded-full ring-2 ring-white dark:ring-slate-800"></span>
                </button>
              )}

              {/* Theme Switcher Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-amber-400 hover:border-primary-blue dark:hover:border-amber-400 transition-all duration-200 shadow-xs cursor-pointer"
                title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} className="text-gray-600" />}
              </button>

              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 hover:border-primary-blue dark:hover:border-blue-400 transition-colors duration-200 bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
                    aria-label="Menu do usuário"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-light dark:bg-blue-900/50 flex items-center justify-center border border-primary-blue/20 shrink-0">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={15} className="text-primary-blue dark:text-blue-400" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 max-w-[120px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-brand-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-light dark:bg-blue-950 border border-primary-blue/30 shrink-0">
                          {currentUser.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-blue font-bold">
                              {currentUser.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-semibold text-sm text-gray-800 dark:text-white truncate">{currentUser.name}</div>
                          <div className="text-xs text-primary-blue dark:text-blue-400 font-medium mt-0.5 truncate">{currentUser.badge}</div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link to={getProfileLink()} onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-blue dark:hover:text-blue-400 transition-colors">
                          <User size={15} /> {currentUser.role === 'empresa' ? 'Perfil da Empresa' : currentUser.role === 'freelancer' ? 'Meu Painel Freelancer' : 'Meu Perfil'}
                        </Link>

                        {(currentUser.role === 'aluno' || currentUser.role === 'candidato') && (
                          <Link to="/minhas-vagas" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-blue dark:hover:text-blue-400 transition-colors">
                            <Briefcase size={15} /> Minhas Candidaturas
                          </Link>
                        )}

                        {currentUser.role === 'professor' && (
                          <Link to="/minhas-vagas" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-blue dark:hover:text-blue-400 transition-colors">
                            <Star size={15} /> Pareceres e Recomendações
                          </Link>
                        )}

                        {currentUser.role === 'empresa' && (
                          <>
                            <Link to="/gerenciamento-vagas" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-blue dark:hover:text-blue-400 transition-colors">
                              <Building2 size={15} /> Gestão de Vagas &amp; Funil ATS
                            </Link>
                            <Link to="/talentos" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-blue dark:hover:text-blue-400 transition-colors">
                              <Star size={15} /> Banco de Talentos
                            </Link>
                          </>
                        )}

                        {currentUser.role === 'freelancer' && (
                          <Link to="/servicos?action=new" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-blue dark:hover:text-blue-400 transition-colors">
                            <PlusCircle size={15} /> Cadastrar Novo Serviço
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 dark:border-slate-700 py-1.5">
                        <Link to="/configuracoes" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                          <Settings size={15} /> Configurações
                        </Link>
                        <button
                          onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut size={15} /> Sair da Conta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary px-5 py-2.5 font-bold rounded-xl text-sm shadow-md">
                  Entrar / Cadastrar
                </Link>
              )}
            </div>

            {/* Mobile — right theme toggle + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-amber-400 bg-white dark:bg-slate-800"
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {!currentUser && (
                <Link to="/login" className="btn btn-primary btn-sm text-xs px-3.5 py-2 rounded-xl">
                  Entrar
                </Link>
              )}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-primary-blue hover:border-primary-blue transition-colors"
                aria-label="Abrir menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>
        </div>

        {/* ── MOBILE DRAWER ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
            <div className="container py-4 space-y-1">
              <NavLink to="/" end className={mobileNavLinkClass} onClick={closeMobile}>Início</NavLink>
              <NavLink to="/vagas" className={mobileNavLinkClass} onClick={closeMobile}>Vagas &amp; Match</NavLink>
              <NavLink to="/servicos" className={mobileNavLinkClass} onClick={closeMobile}>Serviços Locais</NavLink>
              <NavLink to="/talentos" className={mobileNavLinkClass} onClick={closeMobile}>Banco de Talentos</NavLink>

              {currentUser && (
                <>
                  <div className="border-t border-gray-100 dark:border-slate-800 my-2.5" />
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-light dark:bg-blue-950 border border-primary-blue/30 shrink-0">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-blue font-bold">
                          {currentUser.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-base text-gray-800 dark:text-white truncate">{currentUser.name}</div>
                      <div className="text-xs text-primary-blue dark:text-blue-400 font-medium truncate">{currentUser.badge}</div>
                    </div>
                  </div>

                  <NavLink to={getProfileLink()} className={mobileNavLinkClass} onClick={closeMobile}>
                    <span className="flex items-center gap-2.5"><User size={16} /> Meu Perfil</span>
                  </NavLink>

                  <button
                    onClick={() => { closeMobile(); openChat(); }}
                    className={mobileNavLinkClass}
                    >
                      <span className='flex items-center gap-2.5'>
                        <MessageSquare size={16} /> Mensagens &amp; Chat
                      </span>
                    </button>

                  {(currentUser.role === 'aluno' || currentUser.role === 'candidato') && (
                    <NavLink to="/minhas-vagas" className={mobileNavLinkClass} onClick={closeMobile}>
                      <span className="flex items-center gap-2.5"><Briefcase size={16} /> Minhas Candidaturas</span>
                    </NavLink>
                  )}

                  {currentUser.role === 'professor' && (
                    <NavLink to="/minhas-vagas" className={mobileNavLinkClass} onClick={closeMobile}>
                      <span className="flex items-center gap-2.5"><Star size={16} /> Pareceres e Recomendações</span>
                    </NavLink>
                  )}

                  {currentUser.role === 'empresa' && (
                    <NavLink to="/gerenciamento-vagas" className={mobileNavLinkClass} onClick={closeMobile}>
                      <span className="flex items-center gap-2.5"><Building2 size={16} /> Gestão de Vagas &amp; Funil ATS</span>
                    </NavLink>
                  )}

                  <NavLink to="/configuracoes" className={mobileNavLinkClass} onClick={closeMobile}>
                    <span className="flex items-center gap-2.5"><Settings size={16} /> Configurações</span>
                  </NavLink>

                  <button
                    onClick={() => { closeMobile(); setShowLogoutModal(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut size={16} /> Sair da Conta
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-brand-xl w-full max-w-sm p-7 border border-gray-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white mb-2">Deseja realmente sair?</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
              Sua sessão no <strong className="text-primary-dark dark:text-white">Ivaí Conecta</strong> será encerrada. Você precisará entrar novamente para acessar seu perfil.
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
