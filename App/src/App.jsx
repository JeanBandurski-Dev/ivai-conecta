import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import Toast from './components/ui/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import useAppStore from './store/useAppStore';
import { seedFirestoreIfEmpty } from './services/seedFirestore';

// Lazy-loaded pages for fast initial page load & code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Vagas = lazy(() => import('./pages/Vagas'));
const Servicos = lazy(() => import('./pages/Servicos'));
const BancoDeTalentos = lazy(() => import('./pages/BancoDeTalentos'));
const PerfilAluno = lazy(() => import('./pages/PerfilAluno'));
const PerfilEmpresa = lazy(() => import('./pages/PerfilEmpresa'));
const PerfilProfessor = lazy(() => import('./pages/PerfilProfessor'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const MinhasVagas = lazy(() => import('./pages/MinhasVagas'));
const CompletarPerfil = lazy(() => import('./pages/CompletarPerfil'));

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
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <Suspense fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
              <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 dark:text-slate-400 text-xs font-medium animate-pulse">Carregando...</p>
            </div>
          }>
            <Routes>
              <Route path="/"                 element={<Dashboard />} />
              <Route path="/login"            element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/completar-perfil" element={<CompletarPerfil />} />
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
          </Suspense>
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
