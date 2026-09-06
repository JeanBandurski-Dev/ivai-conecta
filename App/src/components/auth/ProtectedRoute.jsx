import { Navigate, useLocation, Link } from 'react-router-dom';
import { Shield, ShieldAlert } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

/**
 * ProtectedRoute Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - Roles permitidas (ex: ['empresa', 'admin'])
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, authLoading } = useAppStore();
  const location = useLocation();

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
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Se houver restrição por role e o usuário atual não tiver permissão
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    const roleLabels = {
      empresa: 'Empresas e Recrutadores',
      aluno: 'Estudantes',
      professor: 'Professores e Docentes',
      freelancer: 'Freelancers e Autônomos',
      candidato: 'Candidatos Gerais',
    };

    const targetRolesText = allowedRoles.map(r => roleLabels[r] || r).join(' ou ');

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
            Sua conta atual está configurada como <strong className="text-primary-blue dark:text-sky-400 capitalize">{roleLabels[currentUser.role] || currentUser.role}</strong>. Para acessar este recurso, é necessário um perfil compatível.
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

  return children;
}
