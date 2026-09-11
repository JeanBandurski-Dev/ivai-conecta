import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap, UserCheck, Wrench, Briefcase, Building2, Lock, ShieldCheck,
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Mail, Sparkles,
  ArrowRight, MapPin, Check, HelpCircle, Users, Award, Star
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CITIES, maskCNPJ, cleanCNPJ, validateCNPJ, fetchCNPJData } from '../lib/ivaiConecta';

const ROLES = [
  { id: 'aluno',      label: 'Aluno / Estudante',    desc: 'Estágios & 1º Emprego',    icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
  { id: 'empresa',    label: 'Empresa / Recrutador', desc: 'Publicar Vagas & Talentos', icon: Building2,     color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
  { id: 'professor',  label: 'Professor / Docente',  desc: 'Validação & Pareceres',    icon: UserCheck,     color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
  { id: 'freelancer', label: 'Freelancer / Autônomo',desc: 'Serviços & Portfólio',    icon: Wrench,        color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
  { id: 'candidato',  label: 'Candidato Geral',       desc: 'Vagas & Oportunidades',   icon: Briefcase,     color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60' },
];

export default function Login() {
  const { login, register, loginWithGoogle, showToast } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from?.pathname || '/';

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setRole] = useState('aluno');
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);

  // Password visibility
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');

  // Register form
  const [regName,  setRegName]  = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCity,  setRegCity]  = useState('Ivaiporã');
  const [regPass,  setRegPass]  = useState('');

  // Register CNPJ (Empresa)
  const [regCnpj, setRegCnpj] = useState('');
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState(null);
  const [cnpjError, setCnpjError] = useState('');

  const handleCnpjChange = (e) => {
    const rawValue = e.target.value;
    const masked = maskCNPJ(rawValue);
    setRegCnpj(masked);
    setCnpjError('');

    const digits = cleanCNPJ(rawValue);
    if (digits.length === 14) {
      consultarCnpj(digits);
    } else {
      setCnpjData(null);
    }
  };

  const consultarCnpj = async (digitsToConsult) => {
    const digits = digitsToConsult || cleanCNPJ(regCnpj);
    if (digits.length !== 14) {
      setCnpjError('O CNPJ deve conter 14 dígitos numéricos.');
      return;
    }

    if (!validateCNPJ(digits)) {
      setCnpjError('Dígitos verificadores do CNPJ inválidos (Módulo 11 da Receita Federal).');
      return;
    }

    setCnpjLoading(true);
    setCnpjError('');

    const res = await fetchCNPJData(digits);
    setCnpjLoading(false);

    if (res.success && res.data) {
      setCnpjData(res.data);
      if (res.data.nomeFantasia || res.data.razaoSocial) {
        setRegName(res.data.nomeFantasia || res.data.razaoSocial);
      }
      if (res.data.cidade) {
        const matchedCity = CITIES.find(c => c.toLowerCase() === res.data.cidade.toLowerCase());
        if (matchedCity) {
          setRegCity(matchedCity);
        }
      }
    } else {
      setCnpjError(res.error || 'Não foi possível validar os dados do CNPJ na Receita Federal.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert('');
    setLoading(true);
    const res = await login(loginEmail, loginPass);
    setLoading(false);
    if (res.success) {
      showToast('Bem-vindo(a) de volta ao Ivaí Conecta!');
      navigate(redirectTarget, { replace: true });
    } else {
      setAlert(res.error || 'E-mail ou senha incorretos.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert('');
    if (!regName.trim() || !regEmail.trim() || !regPass.trim()) {
      setAlert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (selectedRole === 'empresa') {
      const cleanDigits = cleanCNPJ(regCnpj);
      if (!cleanDigits || cleanDigits.length !== 14) {
        setAlert('Para cadastrar uma Empresa, é obrigatório informar um CNPJ com 14 dígitos válidos.');
        return;
      }
      if (!validateCNPJ(cleanDigits)) {
        setAlert('O CNPJ informado possui dígitos verificadores inválidos pelo cálculo oficial da Receita Federal.');
        return;
      }
    }

    setLoading(true);
    const res = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      city: regCity,
      role: selectedRole,
      password: regPass,
      ...(selectedRole === 'empresa' && {
        cnpj: maskCNPJ(regCnpj),
        razaoSocial: cnpjData?.razaoSocial || regName.trim(),
        nomeFantasia: cnpjData?.nomeFantasia || regName.trim(),
        situacaoCnpj: cnpjData?.situacaoCadastral || 'ATIVA',
        isVerifiedCompany: true
      })
    });
    setLoading(false);
    if (res.success) {
      showToast('🎉 Conta criada com sucesso! Bem-vindo(a) ao Ivaí Conecta.');
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

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
        
        {/* ═════════════════════════════════════════════════════════════
            COLUNA ESQUERDA (DESKTOP): BRAND SHOWCASE & ATMOSPHERE
        ═════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_50%,#0052FF_100%)] text-white p-10 flex-col justify-between overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.15),transparent_60%)] pointer-events-none" />

          {/* Top Header */}
          <div className="relative z-10 space-y-6">
            <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-inner group-hover:scale-105 transition-transform">
                <Sparkles size={20} className="text-cyan-400" />
              </div>
              <div>
                <span className="font-heading font-extrabold text-xl tracking-tight text-white block leading-none">
                  Ivaí Conecta
                </span>
                <span className="text-[10px] font-bold text-cyan-300 tracking-wider uppercase">
                  Ecossistema Regional
                </span>
              </div>
            </Link>

            <div className="space-y-3 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-cyan-300 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Plataforma Oficial do Vale do Ivaí</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Onde talentos encontram oportunidades reais.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Conectamos estudantes de instituições como IFPR, UENP e UNIVALE com as empresas mais inovadoras da nossa região.
              </p>
            </div>
          </div>

          {/* Middle Value Props */}
          <div className="relative z-10 space-y-3.5 my-8">
            {[
              { title: 'Vagas & Estágios Locais', desc: 'Processos seletivos em Ivaiporã e cidades vizinhas.', icon: Briefcase },
              { title: 'Candidaturas com 1 Clique', desc: 'Acompanhamento do funil de seleção em tempo real.', icon: CheckCircle2 },
              { title: 'Empresas & CNPJ Verificados', desc: 'Ambiente seguro e homologado para recrutamento.', icon: ShieldCheck }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Card Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Ivaí Conecta</span>
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin size={12} className="text-cyan-400" /> Ivaiporã - PR
            </span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            COLUNA DIREITA: FORMULÁRIO DE AUTENTICAÇÃO
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Header Mobile / Title */}
            <div className="text-center lg:text-left space-y-1">
              <span className="text-[11px] font-extrabold text-primary-blue dark:text-blue-400 uppercase tracking-wider">
                {tab === 'login' ? 'Área de Acesso' : 'Novo Cadastro'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
                {tab === 'login' ? 'Bem-vindo(a) de volta!' : 'Crie sua conta gratuita'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                {tab === 'login'
                  ? 'Informe suas credenciais para acessar o painel.'
                  : 'Faça parte da maior rede de oportunidades do Vale do Ivaí.'}
              </p>
            </div>

            {/* Alternador de Abas Moderno */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl flex items-center border border-gray-200/80 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => { setTab('login'); setAlert(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Já Tenho Conta</span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setAlert(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Quero Me Cadastrar</span>
              </button>
            </div>

            {/* Botão de Autenticação Rápida com Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
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

            {/* Separador */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider absolute">
                ou com seu e-mail
              </span>
            </div>

            {/* Notice if redirected from protected route */}
            {location.state?.from && !alert && (
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
                <Lock size={14} className="shrink-0" />
                <span>Faça login para acessar a página solicitada.</span>
              </div>
            )}

            {/* Alerta de Erro */}
            {alert && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs font-semibold rounded-2xl flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span className="leading-snug" dangerouslySetInnerHTML={{ __html: alert }} />
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
                FORMULÁRIO DE LOGIN
            ═════════════════════════════════════════════════════════════ */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                    E-mail de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                      placeholder="seu.email@exemplo.com"
                      autoComplete="email"
                      required
                    />
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      Sua Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Digite seu e-mail e solicite recuperação ao suporte se necessário.')}
                      className="text-[11px] font-semibold text-primary-blue dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                      title={showLoginPass ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-blue hover:bg-blue-600 active:scale-[0.99] text-white py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-brand-sm hover:shadow-brand-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar na Plataforma</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ═════════════════════════════════════════════════════════════
                FORMULÁRIO DE CADASTRO
            ═════════════════════════════════════════════════════════════ */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-200">
                
                {/* Seletor Visual de Papel / Perfil */}
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-2">
                    Como você deseja atuar no Ivaí Conecta?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ROLES.map(r => {
                      const Icon = r.icon;
                      const isSelected = selectedRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'border-primary-blue bg-blue-50/70 dark:bg-blue-950/60 ring-2 ring-primary-blue/30 shadow-xs'
                              : 'border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${r.color}`}>
                              <Icon size={14} />
                            </div>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-primary-blue text-white flex items-center justify-center">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white block leading-tight truncate">
                              {r.label.split('/')[0]}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate block mt-0.5">
                              {r.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bloco de Validação de CNPJ (Empresas) */}
                {selectedRole === 'empresa' && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Building2 size={15} className="text-primary-blue dark:text-blue-400" />
                        CNPJ da Empresa (14 dígitos)
                      </label>
                      <span className="text-[10px] font-bold text-primary-blue dark:text-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                        Receita Federal
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={regCnpj}
                        onChange={handleCnpjChange}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-primary-blue"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {cnpjLoading && <Loader2 size={16} className="animate-spin text-primary-blue" />}
                        {!cnpjLoading && cnpjData && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>
                    </div>

                    {cnpjError && (
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{cnpjError}</span>
                      </div>
                    )}

                    {cnpjData && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 text-[11px] space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <ShieldCheck size={13} /> Empresa Autenticada
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {cnpjData.situacaoCadastral || 'ATIVA'}
                          </span>
                        </div>
                        <div className="text-gray-800 dark:text-slate-200 truncate">
                          <strong>Razão:</strong> {cnpjData.razaoSocial}
                        </div>
                        <div className="text-gray-500 dark:text-slate-400">
                          <strong>Local:</strong> {cnpjData.cidade} / {cnpjData.uf}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Nome ou Razão Social */}
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                    {selectedRole === 'empresa' ? 'Razão Social / Nome Fantasia' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                    placeholder={selectedRole === 'empresa' ? 'Ex: ValeTech Soluções Digitais' : 'Ex: Gabriel Souza ou Prof. Dr. Ronan'}
                    required
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                    E-mail {selectedRole === 'professor' ? 'Institucional (@ifpr, @uenp, @univale)' : 'Principal'}
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                    placeholder={selectedRole === 'professor' ? 'professor@ifpr.edu.br' : 'seu.email@exemplo.com'}
                    required
                  />
                </div>

                {/* Cidade Polo */}
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                    Sua Cidade no Vale do Ivaí
                  </label>
                  <div className="relative">
                    <select
                      value={regCity}
                      onChange={e => setRegCity(e.target.value)}
                      className="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                      required
                    >
                      {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <MapPin size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                    Crie uma Senha Segura
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regPass}
                      onChange={e => setRegPass(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                      placeholder="Mínimo de 6 caracteres"
                      autoComplete="new-password"
                      required
                    />
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                      title={showRegPass ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-brand-sm hover:shadow-brand-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Criar Conta Gratuitamente</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Termos & Políticas */}
            <p className="text-center text-[11px] text-gray-400 dark:text-slate-500 leading-tight pt-2">
              Ao continuar, você concorda com os Termos de Uso e Política de Privacidade do ecossistema Ivaí Conecta.
            </p>

          </div>

        </div>

      </div>
    </main>
  );
}
