import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, UserCheck, Wrench, Briefcase, Building2, Lock } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CITIES } from '../lib/ivaiConecta';

const ROLES = [
  { id: 'aluno',      label: 'Aluno / Estudante',       icon: GraduationCap },
  { id: 'professor',  label: 'Professor / Docente',     icon: UserCheck },
  { id: 'freelancer', label: 'Freelancer / Autônomo',    icon: Wrench },
  { id: 'candidato',  label: 'Candidato Geral',          icon: Briefcase },
  { id: 'empresa',    label: 'Empresa / Recrutador',     icon: Building2 },
];

const DEMO_ROLES = [
  { role: 'aluno',      label: 'Entrar como Aluno' },
  { role: 'professor',  label: 'Entrar como Professor' },
  { role: 'freelancer', label: 'Entrar como Freelancer' },
  { role: 'candidato',  label: 'Entrar como Candidato' },
  { role: 'empresa',    label: 'Entrar como Empresa' },
];

export default function Login() {
  const { login, register, loginWithGoogle, showToast } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from?.pathname || '/';

  const [tab, setTab]               = useState('login'); // 'login' | 'register'
  const [selectedRole, setRole]     = useState('aluno');
  const [alert, setAlert]           = useState('');
  const [loading, setLoading]       = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');

  // Register form
  const [regName,  setRegName]  = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCity,  setRegCity]  = useState('Ivaiporã');
  const [regPass,  setRegPass]  = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert('');
    setLoading(true);
    const res = await login(loginEmail, loginPass);
    setLoading(false);
    if (res.success) {
      navigate(redirectTarget, { replace: true });
    } else {
      setAlert(res.error || 'Erro ao realizar login.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert('');
    if (!regName.trim() || !regEmail.trim() || !regPass.trim()) {
      setAlert('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    const res = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPass,
      city: regCity,
      role: selectedRole,
    });
    setLoading(false);
    if (res.success) {
      showToast('Conta criada com sucesso! Bem-vindo(a) ao Ivaí Conecta.');
      navigate(redirectTarget, { replace: true });
    } else {
      setAlert(res.error || 'Erro ao realizar cadastro.');
    }
  };

  const handleGoogleLogin = async () => {
    setAlert('');
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);

    if (res.success) {
      if (res.isNewUser) {
        showToast('Conta Google conectada! Complete seu cadastro para continuar.');
        navigate('/completar-perfil');
      } else {
        showToast('Login com Google realizado com sucesso!');
        navigate(redirectTarget, { replace: true });
      }
    } else {
      setAlert(res.error || 'Falha ao autenticar com o Google.');
    }
  };

  const handleDemo = async (role) => {
    setAlert('');
    setLoading(true);
    const res = await login(`${role}@ivaiconecta.com.br`, '123456');
    setLoading(false);
    if (res.success) {
      showToast(`Conectado no modo demonstração: ${res.user.name}`);
      setTimeout(() => navigate(redirectTarget, { replace: true }), 500);
    }
  };

  return (
    <main className="container section py-12">
      <div className="max-w-[480px] mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-brand-xl p-8 sm:p-10 transition-colors duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-flex px-3.5 py-1 rounded-full text-xs font-bold bg-primary-light dark:bg-blue-950/70 text-primary-blue dark:text-blue-300 mb-2 border border-primary-blue/20">
            Acesso ao Ecossistema Regional
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-primary-dark dark:text-white">
            {tab === 'login' ? 'Entrar na sua Conta' : 'Criar Nova Conta'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Conecte-se com alunos, empresas e instituições do Vale do Ivaí.
          </p>
        </div>

        {/* Botão de Autenticação Rápida com Google */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-sm shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com o Google</span>
          </button>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-gray-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-3 text-xs text-gray-400 font-medium absolute">ou acesse com e-mail</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
          {[
            { id: 'login',    label: 'Já Tenho Conta' },
            { id: 'register', label: 'Quero Me Cadastrar' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setAlert(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-700 text-primary-dark dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Notice if redirected from protected route */}
        {location.state?.from && !alert && (
          <div className="mb-5 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs md:text-sm font-medium rounded-xl flex items-center gap-2">
            <Lock size={14} className="shrink-0" />
            <span>Faça login para continuar para a página solicitada.</span>
          </div>
        )}

        {/* Alert */}
        {alert && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl leading-snug"
            dangerouslySetInnerHTML={{ __html: alert }} />
        )}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="form-label">E-mail de Acesso</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                className="form-control" placeholder="Ex: professor@ivaiconecta.com.br ou aluno@..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                className="form-control" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base">
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="form-label mb-2 block">Selecione o seu Perfil de Acesso:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROLES.map(r => {
                  const RoleIcon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all duration-200 text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedRole === r.id
                          ? 'border-primary-blue bg-primary-light text-primary-blue dark:bg-blue-950/60 dark:text-blue-300'
                          : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-primary-blue/50'
                      }`}
                    >
                      <RoleIcon size={20} className="text-primary-blue dark:text-sky-400" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nome Completo ou Razão Social</label>
              <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                className="form-control" placeholder="Ex: Prof. Dr. Ronan Silva ou Lucas Silva" required />
            </div>
              <div className="form-group">
                <label className="form-label">E-mail {selectedRole === 'professor' ? 'Educacional (@ifpr, @uenp, @univale)' : ''}</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  className="form-control" placeholder={selectedRole === 'professor' ? 'professor@ifpr.edu.br' : 'contato@exemplo.com'} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sua Cidade no Vale do Ivaí</label>
                <select value={regCity} onChange={e => setRegCity(e.target.value)} className="form-control" required>
                  {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Crie uma Senha</label>
                <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)}
                  className="form-control" placeholder="Mínimo de 6 caracteres" required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-teal w-full py-3 text-base">
                {loading ? 'Cadastrando...' : 'Criar Conta Gratuitamente'}
              </button>
            </form>
          )}

          {/* ── DEMO ── */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl">
            <div className="text-xs font-bold text-gray-600 dark:text-slate-300 mb-3">Teste Rápido (Demonstração 1-Clique):</div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ROLES.map(d => (
                <button
                  key={d.role}
                  onClick={() => handleDemo(d.role)}
                  className="btn btn-outline btn-sm text-[11px] font-bold py-1 px-2.5"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
  );
}
