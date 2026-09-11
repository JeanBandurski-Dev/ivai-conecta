import { Navigate, useLocation } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

/**
 * GuestRoute Component
 * Redireciona usuários já autenticados para a rota de origem ou dashboard.
 * Se o usuário não estiver autenticado, renderiza a página de login/cadastro imediatamente.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export default function GuestRoute({ children }) {
  const { currentUser } = useAppStore();
  const location = useLocation();

  if (currentUser) {
    const origin = location.state?.from?.pathname || '/';
    return <Navigate to={origin} replace />;
  }

  return children;
}

