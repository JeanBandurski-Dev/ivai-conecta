import { Navigate, useLocation } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

/**
 * GuestRoute Component
 * Redireciona usuários já autenticados para a rota de origem ou dashboard.
 * Se o usuário não estiver autenticado, renderiza a página de login/cadastro imediatamente.
 * Enquanto o estado de autenticação estiver carregando no F5, não renderiza nada para evitar flash.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export default function GuestRoute({ children }) {
  const { currentUser, isAuthReady, authLoading } = useAppStore();
  const location = useLocation();

  if (!isAuthReady || (authLoading && !currentUser)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-3"></div>
      </div>
    );
  }

  if (currentUser) {
    const origin = location.state?.from?.pathname || '/';
    return <Navigate to={origin} replace />;
  }

  return children;
}

