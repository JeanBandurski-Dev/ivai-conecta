import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import Toast from './components/ui/Toast';
import CustomConfirmModal from './components/ui/CustomConfirmModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import ChatModal from './components/ChatModal';
import useAppStore from './store/useAppStore';
import { seedFirestoreIfEmpty } from './services/seedFirestore';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy-loaded pages for fast initial page load & code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Vagas = lazy(() => import('./pages/Vagas'));
const Servicos = lazy(() => import('./pages/Servicos'));
const BancoDeTalentos = lazy(() => import('./pages/BancoDeTalentos'));
const PerfilAluno = lazy(() => import('./pages/PerfilAluno'));
const PerfilEmpresa = lazy(() => import('./pages/PerfilEmpresa'));
const PerfilProfessor = lazy(() => import('./pages/PerfilProfessor'));
const PerfilFreelancer = lazy(() => import('./pages/PerfilFreelancer'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const MinhasVagas = lazy(() => import('./pages/MinhasVagas'));
const GerenciamentoVagasEmpresa = lazy(() => import('./pages/GerenciamentoVagasEmpresa'));
const CompletarPerfil = lazy(() => import('./pages/CompletarPerfil'));

function MinhasVagasRoute() {
  const { currentUser } = useAppStore();
  if (currentUser?.role === 'empresa') {
    return <GerenciamentoVagasEmpresa />;
  }
  return <MinhasVagas />;
}

export default function App() {
  const { isChatOpen, closeChat } = useAppStore();
  const initAuthListener = useAppStore(state => state.initAuthListener);

  useEffect(() => {
    // Verifica e limpa localStorage se estiver cheio, para garantir funcionamento
    try {
      const testKey = '__ivai_ls_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch {
      // localStorage cheio — limpa dados de cache pesados para liberar espaço
      const cacheKeys = [
        'ivai_conecta_db_jobs',
        'ivai_conecta_db_talents',
        'ivai_conecta_db_services',
        'ivai_conecta_user_applications',
      ];
      for (const key of cacheKeys) {
        try { localStorage.removeItem(key); } catch {}
      }
      console.warn('[App] localStorage estava cheio. Cache de dados limpo para liberar espaço.');
    }
    // Intercepta window.alert legado e redireciona para o modal moderno
    const originalAlert = window.alert;
    window.alert = (msg) => {
      useAppStore.getState().showAlert({
        title: 'Aviso',
        message: String(msg ?? ''),
        variant: 'info'
      });
    };

    seedFirestoreIfEmpty();
    let unsubscribe;
    if (typeof initAuthListener === 'function') {
      unsubscribe = initAuthListener();
    }
    return () => {
      window.alert = originalAlert;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initAuthListener]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Navbar />

        <main className="flex-1">
          <ErrorBoundary>
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
                <Route path="/perfil"           element={<ProtectedRoute><PerfilAluno /></ProtectedRoute>} />
                <Route path="/perfil/:id"       element={<PerfilAluno />} />
                <Route path="/empresa"          element={<ProtectedRoute><PerfilEmpresa /></ProtectedRoute>} />
                <Route path="/empresa/:id"      element={<PerfilEmpresa />} />
                <Route path="/professor"        element={<ProtectedRoute><PerfilProfessor /></ProtectedRoute>} />
                <Route path="/professor/:id"    element={<PerfilProfessor />} />
                <Route path="/freelancer"       element={<ProtectedRoute><PerfilFreelancer /></ProtectedRoute>} />
                <Route path="/freelancer/:id"   element={<PerfilFreelancer />} />
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
                      <MinhasVagasRoute />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gerenciamento-vagas"
                  element={
                    <ProtectedRoute>
                      <GerenciamentoVagasEmpresa />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-empresa"
                  element={
                    <ProtectedRoute>
                      <GerenciamentoVagasEmpresa />
                    </ProtectedRoute>
                  }
                />

                {/* 404 fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>

        <Footer />
        <Toast />
        <CustomConfirmModal />

        {isChatOpen && <ChatModal onClose={closeChat} />}
      </div>
    </BrowserRouter>
  );
}

import { Compass } from 'lucide-react';

function NotFound() {
  return (
    <div className="container section text-center py-24">
      <div className="flex justify-center mb-6">
        <Compass size={64} className="text-primary-blue animate-pulse" />
      </div>
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
