import { Navigate, useLocation } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

/**
 * GuestRoute Component
 * Redireciona usuários já autenticados para a rota de origem ou dashboard.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export default function GuestRoute({ children }) {
  const { currentUser, authLoading } = useAppStore();
  const location = useLocation();

  if (authLoading && !currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 dark:text-slate-400 text-xs font-medium">Carregando...</p>
      </div>
    );
  }

  if (currentUser) {
    const origin = location.state?.from?.pathname || '/';
    return <Navigate to={origin} replace />;
  }

  return children;
}
