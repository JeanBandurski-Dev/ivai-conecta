import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap, UserCheck, Wrench, Briefcase, Building2, Lock, ShieldCheck,
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Mail, Sparkles,
  ArrowRight, MapPin
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CITIES, maskCNPJ, cleanCNPJ, validateCNPJ, fetchCNPJData, isInstitutionalEmail, inferInstitutionFromEmail } from '../lib/ivaiConecta';

const ROLES = [
  { id: 'aluno',      label: 'Aluno / Estudante',    shortLabel: 'Aluno',      desc: 'Estágios & 1º Emprego',    icon: GraduationCap, color: 'text-blue-500' },
  { id: 'empresa',    label: 'Empresa / Recrutador', shortLabel: 'Empresa',    desc: 'Publicar Vagas & Talentos', icon: Building2,     color: 'text-emerald-500' },
  { id: 'professor',  label: 'Professor / Docente',  shortLabel: 'Professor',  desc: 'Validação & Pareceres',    icon: UserCheck,     color: 'text-purple-500' },
  { id: 'freelancer', label: 'Freelancer / Autônomo',shortLabel: 'Freelancer', desc: 'Serviços & Portfólio',    icon: Wrench,        color: 'text-amber-500' },
  { id: 'candidato',  label: 'Candidato Geral',       shortLabel: 'Candidato',  desc: 'Vagas & Oportunidades',   icon: Briefcase,     color: 'text-sky-500' },
];

export default function Login() {
  const { login, register, loginWithGoogle, showToast } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from?.pathname || '/';

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setRole] = useState('aluno');
  const [alert, setAlert] = useState('');
  const [alertCode, setAlertCode] = useState('');
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
    setAlertCode('');
    setLoading(true);
    const res = await login(loginEmail, loginPass);
    setLoading(false);
    if (res.success) {
      showToast('Bem-vindo(a) de volta ao Ivaí Conecta!');
      navigate(redirectTarget, { replace: true });
    } else {
      setAlert(res.error || 'E-mail ou senha incorretos.');
      setAlertCode(res.errorCode || '');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert('');
    setAlertCode('');
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

    if (selectedRole === 'professor') {
      if (!isInstitutionalEmail(regEmail.trim())) {
        setAlert('Para cadastrar uma conta de Professor/Docente, é obrigatório utilizar um e-mail institucional válido (ex: @ifpr.edu.br, @uenp.edu.br, @univale.edu.br, @uel.br, @uem.br, @seed.pr.gov.br ou qualquer outro domínio .edu.br).');
        setAlertCode('auth/invalid-institutional-email');
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
      ...(selectedRole === 'professor' && {
        institution: inferInstitutionFromEmail(regEmail.trim())
      }),
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
      setAlertCode(res.errorCode || '');
    }
  };

  const handleGoogleLogin = async () => {
    setAlert('');
    setAlertCode('');
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
      setAlertCode(res.errorCode || '');
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <div className={`w-full max-w-5xl lg:max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl border auth-card-transition overflow-hidden my-auto min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] transition-all duration-500 ease-out ${
        tab === 'login'
          ? 'border-gray-200/90 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,82,255,0.08)]'
          : 'border-blue-200/90 dark:border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(56,189,248,0.12)]'
      }`}>
        
        {/* ═════════════════════════════════════════════════════════════
            COLUNA ESQUERDA (DESKTOP): BRAND SHOWCASE & ATMOSPHERE
        ═════════════════════════════════════════════════════════════ */}
        <div className={`hidden lg:flex lg:col-span-5 relative text-white p-8 lg:p-9 flex-col justify-between overflow-hidden lg:min-h-[640px] transition-all duration-700 ease-in-out ${
          tab === 'login'
            ? 'bg-[linear-gradient(135deg,#070e24_0%,#051944_50%,#0052FF_100%)]'
            : 'bg-[linear-gradient(135deg,#051438_0%,#022b7a_50%,#0284c7_100%)]'
        }`}>
          {/* Background Elements com Animação Suave */}
          <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full blur-3xl auth-ambient-orb pointer-events-none ${
            tab === 'login'
              ? 'bg-blue-400/20 translate-x-0 translate-y-0 scale-100'
              : 'bg-cyan-400/25 -translate-x-6 translate-y-6 scale-110'
          }`} />
          <div className={`absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full blur-3xl auth-ambient-orb pointer-events-none ${
            tab === 'login'
              ? 'bg-cyan-400/15 translate-x-0 translate-y-0 scale-100'
              : 'bg-blue-400/25 translate-x-6 -translate-y-6 scale-110'
          }`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.15),transparent_60%)] pointer-events-none" />

          {/* Top Header */}
          <div className="relative z-10 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer transition-transform duration-300 hover:opacity-95">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-inner group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300">
                <Sparkles size={18} className="text-cyan-400 animate-[spin_12s_linear_infinite]" />
              </div>
              <div>
                <span className="font-heading font-extrabold text-lg tracking-tight text-white block leading-none transition-colors duration-200">
                  Ivaí Conecta
                </span>
                <span className="text-[9px] font-bold text-cyan-300 tracking-wider uppercase">
                  Ecossistema Regional
                </span>
              </div>
            </Link>

            <div className="space-y-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/20 text-cyan-300 backdrop-blur-md shadow-2xs hover:bg-white/15 transition-all duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>{tab === 'login' ? 'Área de Acesso Seguro' : 'Plataforma Oficial do Vale do Ivaí'}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug transition-all duration-500">
                {tab === 'login' ? 'Conecte-se e impulsione sua jornada hoje.' : 'Onde talentos encontram oportunidades reais.'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-normal transition-all duration-500">
                {tab === 'login'
                  ? 'Acesse vagas exclusivas, gerencie processos seletivos e interaja em tempo real.'
                  : 'Conectamos estudantes de instituições como IFPR, UENP e UNIVALE com as empresas mais inovadoras da nossa região.'}
              </p>
            </div>
          </div>

          {/* Middle Value Props com Microinterações */}
          <div className="relative z-10 space-y-2.5 my-6">
            {[
              { title: 'Vagas & Estágios Locais', desc: 'Processos seletivos em Ivaiporã e cidades vizinhas.', icon: Briefcase },
              { title: 'Candidaturas com 1 Clique', desc: 'Acompanhamento do funil de seleção em tempo real.', icon: CheckCircle2 },
              { title: 'Empresas & CNPJ Verificados', desc: 'Ambiente seguro e homologado para recrutamento.', icon: ShieldCheck }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 ease-out hover:translate-x-1.5 cursor-default group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5 group-hover:scale-110 group-hover:bg-cyan-400/20 transition-all duration-300">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white leading-snug group-hover:text-cyan-200 transition-colors duration-200">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Card Footer */}
          <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Ivaí Conecta</span>
            <span className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors duration-200">
              <MapPin size={11} className="text-cyan-400" /> Ivaiporã - PR
            </span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            COLUNA DIREITA: FORMULÁRIO DE AUTENTICAÇÃO (ZERO SCROLL + FLUID)
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 p-5 sm:p-7 lg:p-8 flex flex-col justify-center min-h-[560px] sm:min-h-[600px] lg:min-h-[640px]">
          
          <div className="w-full max-w-lg mx-auto space-y-3.5">
            
            {/* Header Mobile / Title com Animação Fluida */}
            <div key={`header-${tab}`} className="text-center lg:text-left space-y-0.5 auth-form-crossfade">
              <span className="text-[10px] font-extrabold text-primary-blue dark:text-blue-400 uppercase tracking-wider">
                {tab === 'login' ? 'Área de Acesso' : 'Novo Cadastro'}
              </span>
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
                {tab === 'login' ? 'Bem-vindo(a) de volta!' : 'Crie sua conta gratuita'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {tab === 'login'
                  ? 'Informe suas credenciais para acessar o painel.'
                  : 'Faça parte da maior rede de oportunidades do Vale do Ivaí.'}
              </p>
            </div>

            {/* Alternador de Abas Ultra Suave com Indicador Deslizante */}
            <div className="relative bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl flex items-center border border-gray-200/80 dark:border-slate-700 shadow-2xs">
              {/* Pill deslizante que se move suavemente entre as abas */}
              <div
                className={`absolute top-1 bottom-1 rounded-lg bg-white dark:bg-slate-900 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none ${
                  tab === 'login' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+0px)] w-[calc(50%-4px)]'
                }`}
              />

              <button
                type="button"
                onClick={() => { setTab('login'); setAlert(''); setAlertCode(''); }}
                className={`relative z-10 flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'login'
                    ? 'text-primary-blue dark:text-white'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Já Tenho Conta</span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setAlert(''); setAlertCode(''); }}
                className={`relative z-10 flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'register'
                    ? 'text-primary-blue dark:text-white'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Quero Me Cadastrar</span>
              </button>
            </div>

            {/* Botão de Autenticação com Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2 sm:py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md hover:border-gray-400 dark:hover:border-slate-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
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
            <div className="relative flex items-center justify-center my-0.5">
              <div className="border-t border-gray-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-2.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider absolute">
                ou com seu e-mail
              </span>
            </div>

            {/* Notice if redirected from protected route */}
            {location.state?.from && !alert && (
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
                <Lock size={13} className="shrink-0" />
                <span>Faça login para acessar a página solicitada.</span>
              </div>
            )}

            {/* Alerta de Erro com Código Real do Firebase */}
            {alert && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl space-y-1.5 animate-in fade-in duration-300">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-800 dark:text-red-200 leading-snug" dangerouslySetInnerHTML={{ __html: alert }} />
                    {alertCode && (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/80 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Firebase: {alertCode}
                        </span>
                        {alertCode === 'auth/operation-not-allowed' && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md font-medium">
                            Dica: Habilite o provedor no Firebase Console
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
                FORMULÁRIO DE LOGIN (ANIMAÇÃO SUAVE)
            ═════════════════════════════════════════════════════════════ */}
            {tab === 'login' && (
              <form key="login-form" onSubmit={handleLogin} className="space-y-3 auth-form-crossfade">
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1">
                    E-mail de Acesso
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-500/15 text-gray-900 dark:text-white transition-all duration-200 placeholder:text-gray-400 placeholder:font-normal"
                      placeholder="seu.email@exemplo.com"
                      autoComplete="email"
                      required
                    />
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue transition-colors duration-200 pointer-events-none" />
                  </div>
                  {loginEmail.trim().length > 3 && isInstitutionalEmail(loginEmail.trim()) && (
                    <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in duration-200">
                      <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                      <span className="truncate">Acesso Docente: <strong>{inferInstitutionFromEmail(loginEmail.trim())}</strong></span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      Sua Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Digite seu e-mail e solicite recuperação ao suporte se necessário.')}
                      className="text-[11px] font-semibold text-primary-blue dark:text-blue-400 hover:underline cursor-pointer transition-colors duration-200"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative group">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl pl-9 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-500/15 text-gray-900 dark:text-white transition-all duration-200 placeholder:text-gray-400"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue transition-colors duration-200 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                      title={showLoginPass ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showLoginPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-blue hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-brand-sm hover:shadow-brand-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar na Plataforma</span>
                      <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ═════════════════════════════════════════════════════════════
                FORMULÁRIO DE CADASTRO (ANIMAÇÃO SUAVE + TROCA DE PERFIL FLUIDA)
            ═════════════════════════════════════════════════════════════ */}
            {tab === 'register' && (
              <form key="register-form" onSubmit={handleRegister} className="space-y-3 auth-form-crossfade">
                
                {/* Seletor Compacto de Papel em Linha Única com Microinterações */}
                <div className="space-y-1.5 mb-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      Perfil de Atuação
                    </label>
                    <span
                      key={selectedRole}
                      className="text-[10px] font-semibold text-primary-blue dark:text-blue-400 truncate max-w-[200px] inline-block animate-in fade-in-50 slide-in-from-right-1 duration-200"
                    >
                      {ROLES.find(r => r.id === selectedRole)?.desc}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xs">
                    {ROLES.map(r => {
                      const Icon = r.icon;
                      const isSelected = selectedRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`relative py-1.5 px-1 rounded-lg text-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] font-bold active:scale-95 ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs ring-2 ring-primary-blue/30 scale-[1.03]'
                              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          title={`${r.label}: ${r.desc}`}
                        >
                          <Icon size={13} className={`transition-all duration-300 ease-out ${isSelected ? 'text-primary-blue dark:text-blue-400 scale-110' : 'text-gray-400 dark:text-slate-500'}`} />
                          <span className="truncate text-[10px] sm:text-[11px]">{r.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slot Reservado Fixo: Mantém o Formulário Estável com Espaçamento Confortável */}
                <div className="relative min-h-[82px] mt-3 mb-2.5">
                  {/* Painel CNPJ Empresa com Abertura e Fechamento Fluidos (0.75s) */}
                  <div className={`cnpj-accordion-container ${selectedRole === 'empresa' ? 'is-open' : ''}`}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Building2 size={13} className="text-primary-blue dark:text-blue-400 animate-pulse" />
                            CNPJ da Empresa (14 dígitos)
                          </label>
                          <span className="text-[9px] font-bold text-primary-blue dark:text-blue-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700 shadow-2xs">
                            Receita Federal
                          </span>
                        </div>

                        <div className="relative group">
                          <input
                            type="text"
                            value={regCnpj}
                            onChange={handleCnpjChange}
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-primary-blue rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-500/15 transition-all duration-200"
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                            required={selectedRole === 'empresa'}
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {cnpjLoading && <Loader2 size={14} className="animate-spin text-primary-blue" />}
                            {!cnpjLoading && cnpjData && <CheckCircle2 size={14} className="text-emerald-500 animate-in zoom-in-75 duration-200" />}
                          </div>
                        </div>

                        {cnpjError && (
                          <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>{cnpjError}</span>
                          </p>
                        )}

                        {cnpjData && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between pt-0.5 animate-in fade-in duration-200">
                            <span className="truncate flex items-center gap-1">
                              <ShieldCheck size={12} /> {cnpjData.razaoSocial}
                            </span>
                            <span className="shrink-0 ml-1">({cnpjData.cidade}/{cnpjData.uf})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Painel de Benefícios para Outros Perfis com Transição Suave */}
                  <div className={`role-benefit-container ${selectedRole === 'empresa' ? 'is-hidden' : ''}`}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="p-2.5 rounded-xl border border-dashed border-gray-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-2.5 text-xs text-gray-500 dark:text-slate-400">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Sparkles size={12} />
                          </div>
                          <p className="text-[11px] leading-tight truncate text-gray-600 dark:text-slate-300">
                            {selectedRole === 'aluno' && 'Acesso a estágios e vagas iniciais de empresas parceiras regionais.'}
                            {selectedRole === 'professor' && 'Validação de pareceres acadêmicos e orientação de projetos.'}
                            {selectedRole === 'freelancer' && 'Vitrine de portfólio para captação de clientes no Vale do Ivaí.'}
                            {selectedRole === 'candidato' && 'Oportunidades profissionais e conexão direta com recrutadores.'}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                          {selectedRole}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade de 2 Colunas para Campos de Entrada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Nome Completo / Razão */}
                  <div>
                    <label key={`label-name-${selectedRole === 'empresa' ? 'empresa' : 'user'}`} className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1 animate-in fade-in duration-200">
                      {selectedRole === 'empresa' ? 'Razão Social / Nome' : 'Nome Completo'}
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-500/15 text-gray-900 dark:text-white transition-all duration-200 placeholder:text-gray-400 placeholder:font-normal"
                      placeholder={selectedRole === 'empresa' ? 'Ex: ValeTech Ltda' : 'Seu nome completo'}
                      required
                    />
                  </div>

                  {/* E-mail */}
                  <div>
                    <label key={`label-email-${selectedRole === 'professor' ? 'prof' : 'user'}`} className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1 animate-in fade-in duration-200">
                      E-mail {selectedRole === 'professor' ? 'Institucional' : 'Principal'}
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/80 border rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:ring-4 transition-all duration-200 placeholder:text-gray-400 placeholder:font-normal ${
                        selectedRole === 'professor' && regEmail.trim().length > 3
                          ? isInstitutionalEmail(regEmail.trim())
                            ? 'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500 focus:ring-emerald-500/15 text-gray-900 dark:text-white'
                            : 'border-amber-400 dark:border-amber-600 focus:border-amber-500 focus:ring-amber-500/15 text-gray-900 dark:text-white'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 focus:border-primary-blue focus:ring-blue-500/15 text-gray-900 dark:text-white'
                      }`}
                      placeholder={selectedRole === 'professor' ? 'nome@ifpr.edu.br ou .edu.br' : 'seu.email@exemplo.com'}
                      required
                    />
                    {selectedRole === 'professor' && regEmail.trim().length > 0 && (
                      <div className="mt-1 text-[11px] transition-all duration-200">
                        {isInstitutionalEmail(regEmail.trim()) ? (
                          <div className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                            <span className="truncate">Instituição reconhecida: <strong>{inferInstitutionFromEmail(regEmail.trim())}</strong></span>
                          </div>
                        ) : (
                          <div className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            <AlertCircle size={13} className="shrink-0 text-amber-500" />
                            <span>Informe um e-mail institucional válido (ex: @ifpr.edu.br, @uenp.edu.br, @univale.edu.br, @seed.pr.gov.br ou .edu.br)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cidade Polo */}
                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1">
                      Cidade Polo
                    </label>
                    <div className="relative group">
                      <select
                        value={regCity}
                        onChange={e => setRegCity(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue focus:ring-4 focus:ring-blue-500/15 transition-all duration-200"
                        required
                      >
                        {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>

                  {/* Senha */}
                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1">
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        value={regPass}
                        onChange={e => setRegPass(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-500/15 text-gray-900 dark:text-white transition-all duration-200 placeholder:text-gray-400"
                        placeholder="Mínimo 6 dígitos"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                        title={showRegPass ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showRegPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botão de Cadastro em Azul Primário com Microinteração Fluida */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-blue hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-brand-sm hover:shadow-brand-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} className="animate-[spin_4s_linear_infinite]" />
                      <span>Criar Conta Gratuitamente</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Termos & Políticas */}
            <p className="text-center text-[10px] text-gray-400 dark:text-slate-500 leading-tight pt-1">
              Ao continuar, você concorda com os Termos de Uso e Política de Privacidade do ecossistema Ivaí Conecta.
            </p>

          </div>

        </div>

      </div>
    </main>
  );
}



