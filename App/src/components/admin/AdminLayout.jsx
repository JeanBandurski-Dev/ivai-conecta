import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Wrench,
  ShieldCheck,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ShieldAlert,
  Radio
} from 'lucide-react';
import Logo from '../ui/Logo';
import useAppStore from '../../store/useAppStore';

export default function AdminLayout() {
  const { currentUser, theme, toggleTheme, logout, showToast } = useAppStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Sessão administrativa encerrada.');
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', end: true, label: 'Visão Geral', icon: LayoutDashboard },
    { to: '/admin/users', end: false, label: 'Usuários', icon: Users },
    { to: '/admin/jobs', end: false, label: 'Vagas', icon: Briefcase },
    { to: '/admin/services', end: false, label: 'Serviços', icon: Wrench },
    { to: '/admin/moderation', end: false, label: 'Moderação', icon: ShieldAlert },
    { to: '/admin/settings', end: false, label: 'Configurações', icon: Settings },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
      isActive
        ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/25 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* ── TOPBAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 h-16 flex items-center px-4 lg:px-8 justify-between shadow-xs">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(o => !o)}
            className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Alternar menu administrativo"
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo & Brand */}
          <Link to="/admin" className="flex items-center gap-2.5">
            <Logo size={32} />
            <div className="flex items-center gap-2">
              <span className="text-lg font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
                Ivaí <span className="text-primary-blue dark:text-blue-400">Conecta</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                <ShieldCheck size={12} /> Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Link back to public site */}
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-blue dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Voltar ao portal público"
          >
            <ArrowLeft size={14} /> Voltar ao Portal
          </Link>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-amber-400 bg-white dark:bg-slate-800 hover:border-primary-blue transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} className="text-slate-600" />}
          </button>

          {/* Current Admin User Badge */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-gray-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-light dark:bg-blue-900/50 flex items-center justify-center border border-primary-blue/30 shrink-0 text-primary-blue dark:text-blue-400 font-bold text-xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  (currentUser.name || 'A').charAt(0)
                )}
              </div>
              <div className="text-left leading-tight max-w-[130px] truncate">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser.name || 'Administrador'}
                </div>
                <div className="text-[10px] text-primary-blue dark:text-blue-400 font-medium truncate">
                  Super Admin
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
            title="Sair da Conta"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── BODY: SIDEBAR + CONTENT ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 p-4 justify-between">
          <div className="space-y-6">
            {/* Status indicator */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Radio size={14} className="text-emerald-500 animate-pulse" />
                <span>Base Firestore</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                Online
              </span>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Menu de Gestão
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={linkClass}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer info */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 px-3">
            <div>Ivaí Conecta Admin v1.0</div>
            <div className="text-[10px] text-slate-400/80">Projeto: ivai-conecta-4a366</div>
          </div>
        </aside>

        {/* Mobile Drawer (backdrop + sidebar) */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <aside className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-full p-4 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Logo size={28} />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Admin Ivaí</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={linkClass}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>

                <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                  <Link
                    to="/"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-blue rounded-xl"
                  >
                    <ArrowLeft size={14} /> Voltar ao Portal Público
                  </Link>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-gray-100 dark:border-slate-800">
                Conectado como <strong className="text-slate-700 dark:text-slate-200">{currentUser?.name || 'Admin'}</strong>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
