import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import useAppStore from './store/useAppStore';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Vagas from './pages/Vagas';
import Servicos from './pages/Servicos';
import BancoDeTalentos from './pages/BancoDeTalentos';
import PerfilAluno from './pages/PerfilAluno';
import PerfilEmpresa from './pages/PerfilEmpresa';
import PerfilProfessor from './pages/PerfilProfessor';
import Configuracoes from './pages/Configuracoes';
import MinhasVagas from './pages/MinhasVagas';
import { seedFirestoreIfEmpty } from './services/seedFirestore';

export default function App() {
  const initAuthListener = useAppStore(state => state.initAuthListener);

  useEffect(() => {
    seedFirestoreIfEmpty();
    const unsubscribe = initAuthListener();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initAuthListener]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/"                 element={<Dashboard />} />
            <Route path="/login"            element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/vagas"            element={<Vagas />} />
            <Route path="/servicos"         element={<Servicos />} />
            <Route path="/talentos"         element={<BancoDeTalentos />} />
            <Route path="/perfil/:id"       element={<PerfilAluno />} />
            <Route path="/empresa/:id"      element={<PerfilEmpresa />} />
            <Route path="/professor/:id"    element={<PerfilProfessor />} />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/minhas-vagas"
              element={
                <ProtectedRoute>
                  <MinhasVagas />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        <Toast />
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="container section text-center py-24">
      <div className="text-7xl mb-6">🗺️</div>
      <h1 className="text-4xl font-heading font-bold text-primary-dark dark:text-white mb-3">
        Página não encontrada
      </h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
        A rota que você tentou acessar não existe nesta plataforma.
      </p>
      <a href="/" className="btn btn-primary">
        Voltar ao Dashboard
      </a>
    </div>
  );
}
