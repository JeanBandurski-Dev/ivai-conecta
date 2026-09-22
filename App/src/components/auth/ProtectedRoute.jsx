import { useState, useEffect } from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  Mail,
  RefreshCw,
  Send,
  LogOut,
  Home,
  Loader2,
  Clock,
  AlertCircle
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { auth, db } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { validateStudentEmail } from '../../services/studentVerificationService';

/**
 * ProtectedRoute Component
 * Valida:
 * 1. Se o usuário está autenticado.
 * 2. Se o user.emailVerified é true.
 *    - Se for false: exibe a tela de bloqueio com a mensagem "Verifique seu e-mail para acessar a plataforma"
 *      e botão "Já verifiquei" disparando auth.currentUser.reload().
 * 3. Se a role do usuário possui permissão para acessar a rota (allowedRoles).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - Roles permitidas (ex: ['empresa', 'admin'])
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, authLoading, setCurrentUser, logout, showToast } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Estado local para controle imediato de verificação
  const [isVerified, setIsVerified] = useState(() => {
    if (auth.currentUser) return Boolean(auth.currentUser.emailVerified);
    return Boolean(currentUser?.emailVerified);
  });

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [statusWarning, setStatusWarning] = useState('');

  // Sincroniza estado de verificação com Firebase Auth e store
  useEffect(() => {
    if (auth.currentUser) {
      setIsVerified(Boolean(auth.currentUser.emailVerified));
    } else if (currentUser) {
      setIsVerified(Boolean(currentUser.emailVerified));
    }
  }, [currentUser, auth.currentUser?.emailVerified]);

  // Checagem silenciosa automática ao montar o componente
  useEffect(() => {
    let isMounted = true;
    async function checkSilently() {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        try {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified && isMounted) {
            setIsVerified(true);
            const updated = {
              ...(currentUser || {}),
              emailVerified: true,
              ...(currentUser?.role === 'aluno' ? { isVerifiedStudent: true } : {})
            };
            setCurrentUser(updated);
          }
        } catch {
          // Falhas silenciosas ignoradas; botão manual "Já verifiquei" permanece ativo
        }
      }
    }
    checkSilently();
    return () => {
      isMounted = false;
    };
  }, []);

  // Timer regressivo para o botão de reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // 1. Enquanto valida o estado da autenticação no Firebase
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin"></div>
          <div className="absolute text-primary-blue">
            <Shield size={24} />
          </div>
        </div>
        <p className="text-gray-600 dark:text-slate-300 font-medium animate-pulse text-sm">
          Autenticando sessão segura...
        </p>
      </div>
    );
  }

  // 2. Se não estiver autenticado, redireciona para login guardando a rota de origem
  if (!currentUser && !auth.currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Obter o e-mail do usuário ativo
  const targetEmail = auth.currentUser?.email || currentUser?.email || 'seu e-mail';

  /**
   * Dispara auth.currentUser.reload() para recarregar o token e checar se emailVerified virou true
   */
  const handleReloadVerification = async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        showToast('⚠️ Sessão expirada. Faça login novamente para prosseguir.');
        setIsChecking(false);
        return;
      }

      // OBRIGATÓRIO: Força o Firebase Auth a sincronizar os dados atualizados do servidor
      await user.reload();
      await user.getIdToken(true);

      if (user.emailVerified) {
        setStatusWarning('');
        setIsVerified(true);

        // Se for estudante institucional, já valida e promove o status estudantil
        let isStudentVerified = currentUser?.isVerifiedStudent || false;
        if (currentUser?.role === 'aluno') {
          const studentCheck = validateStudentEmail(user.email);
          if (studentCheck.isValid) {
            isStudentVerified = true;
          }
        }

        // 1. Persistir no Cloud Firestore
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              emailVerified: true,
              ...(isStudentVerified ? {
                isVerifiedStudent: true,
                studentEmailVerifiedAt: new Date().toISOString()
              } : {}),
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('[ProtectedRoute] Falha ao persistir emailVerified no Firestore:', dbErr);
        }

        // 2. Atualizar estado global Zustand e localStorage
        const updatedUser = {
          ...(currentUser || {}),
          emailVerified: true,
          ...(isStudentVerified ? { isVerifiedStudent: true } : {})
        };
        setCurrentUser(updatedUser);

        showToast('🎉 E-mail verificado com sucesso! Acesso liberado.');
      } else {
        setStatusWarning('O Firebase ainda não detectou o clique no link. Abra seu e-mail institucional/pessoal, clique no link de confirmação recebido e tente clicar em "Já verifiquei" novamente.');
        showToast('⚠️ Seu e-mail ainda não foi confirmado. Acesse sua caixa postal e clique no link recebido.');
      }
    } catch (err) {
      console.error('[ProtectedRoute] Erro ao executar auth.currentUser.reload():', err);
      setStatusWarning('Erro ao consultar o servidor do Firebase. Verifique sua conexão e tente novamente.');
      showToast('Erro ao consultar verificação. Tente novamente em instantes.');
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Reenvia o e-mail de verificação oficial do Firebase Auth
   */
  const handleResendEmail = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        showToast('⚠️ Sessão não encontrada. Faça login novamente.');
        setIsResending(false);
        return;
      }

      await sendEmailVerification(user);
      showToast('📩 E-mail de verificação reenviado! Verifique sua caixa de entrada.');
      setResendCooldown(60); // 60 segundos de cooldown anti-flood
    } catch (err) {
      console.error('[ProtectedRoute] Erro ao reenviar e-mail de verificação:', err);
      if (err.code === 'auth/too-many-requests') {
        showToast('⚠️ Muitas solicitações seguidas. Aguarde 1 minuto para reenviar.');
        setResendCooldown(60);
      } else {
        showToast('Não foi possível reenviar o e-mail no momento. Tente mais tarde.');
      }
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Encerra a sessão e redireciona para o login
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // 3. SE O E-MAIL NÃO ESTIVER VERIFICADO: Renderiza a Tela de Bloqueio Obrigatória
  if (!isVerified) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12 md:py-20 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl border border-gray-100 dark:border-slate-700/60 relative overflow-hidden">
          {/* Luz de fundo decorativa */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-blue/10 dark:bg-primary-blue/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Ícone de Destaque */}
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner relative">
            <Mail size={38} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          </div>

          {/* Badge informativa */}
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 mb-4">
            Confirmação Obrigatória
          </span>

          {/* Mensagem exigida no requisito */}
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Verifique seu e-mail para acessar a plataforma
          </h1>

          {/* E-mail alvo */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-slate-700 dark:text-slate-200 text-sm font-medium mb-5 border border-slate-200 dark:border-slate-600/50 max-w-full">
            <Mail size={16} className="text-primary-blue dark:text-sky-400 shrink-0" />
            <span className="font-semibold truncate">{targetEmail}</span>
          </div>

          <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
            Enviamos um link de ativação para a sua caixa de entrada. Para garantir a integridade da sua conta e desbloquear o acesso aos recursos do <strong>Ivaí Conecta</strong>, clique no link de verificação.
          </p>

          {/* Bloco de Ações Principais */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {/* BOTÃO PRINCIPAL: 'Já verifiquei' */}
            <button
              onClick={handleReloadVerification}
              disabled={isChecking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm bg-primary-blue hover:bg-primary-hover text-white shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/35 transition-all duration-200 disabled:opacity-60 cursor-pointer active:scale-95"
            >
              {isChecking ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verificando status...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Já verifiquei</span>
                </>
              )}
            </button>

            {/* BOTÃO SECUNDÁRIO: Reenviar e-mail */}
            <button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isResending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock size={16} />
                  <span>Reenviar em {resendCooldown}s</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Reenviar e-mail</span>
                </>
              )}
            </button>
          </div>

          {/* Banner de aviso caso clique em 'Já verifiquei' sem ter clicado no link */}
          {statusWarning && (
            <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-0.5">
                <strong className="block font-semibold">Confirmação ainda não detectada pelo Firebase:</strong>
                <span className="leading-relaxed">{statusWarning}</span>
              </div>
            </div>
          )}

          {/* Links e opções de fuga */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-slate-700/60 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 hover:text-primary-blue dark:hover:text-sky-400 transition-colors"
            >
              <Home size={15} />
              <span>Voltar ao Início</span>
            </Link>

            <span className="text-gray-300 dark:text-slate-600">•</span>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Entrar com outra conta</span>
            </button>
          </div>

          {/* Dica de usabilidade */}
          <div className="mt-4 p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/30 text-xs text-amber-800 dark:text-amber-300/90 text-center">
            💡 <strong>Dica:</strong> Não encontrou a mensagem? Confira sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.
          </div>
        </div>
      </div>
    );
  }

  // 4. Se houver restrição por role e o usuário atual não tiver permissão
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    const roleLabels = {
      empresa: 'Empresas e Recrutadores',
      aluno: 'Estudantes',
      professor: 'Professores e Docentes',
      freelancer: 'Freelancers e Autônomos',
      candidato: 'Candidatos Gerais',
    };

    const targetRolesText = allowedRoles.map((r) => roleLabels[r] || r).join(' ou ');

    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-slate-700/60 relative overflow-hidden">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600 dark:text-amber-400 shadow-inner">
            <ShieldAlert size={36} />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 mb-4">
            Acesso Restrito
          </span>

          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3">
            Área Exclusiva para {targetRolesText}
          </h1>

          <p className="text-gray-600 dark:text-slate-300 text-sm md:text-base mb-6 max-w-lg mx-auto">
            Sua conta atual está configurada como{' '}
            <strong className="text-primary-blue dark:text-sky-400 capitalize">
              {roleLabels[currentUser.role] || currentUser.role}
            </strong>
            . Para acessar este recurso, é necessário um perfil compatível.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 transition-colors"
            >
              Voltar ao Início
            </Link>
            <Link
              to="/configuracoes"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm bg-primary-blue hover:bg-primary-hover text-white shadow-md shadow-primary-blue/20 transition-all"
            >
              Gerenciar Minha Conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Autenticado, verificado e com perfil permitido: renderiza os filhos normalmente
  return children || null;
}

export { ProtectedRoute };
