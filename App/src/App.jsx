import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import Toast from './components/ui/Toast';
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
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const MinhasVagas = lazy(() => import('./pages/MinhasVagas'));
const GerenciamentoVagasEmpresa = lazy(
  () => import('./pages/GerenciamentoVagasEmpresa')
);
const CompletarPerfil = lazy(() => import('./pages/CompletarPerfil'));

// Admin Area (Lazy Loaded)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function MinhasVagasRoute() {
  const { currentUser } = useAppStore();

  if (currentUser?.role === 'empresa') {
    return <GerenciamentoVagasEmpresa />;
  }

  return <MinhasVagas />;
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { isChatOpen, closeChat } = useAppStore();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {!isAdminRoute && <Navbar />}

      <main className="flex-1">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-3"></div>

                <p className="text-gray-500 dark:text-slate-400 text-xs font-medium animate-pulse">
                  Carregando...
                </p>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />

              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />

              <Route
                path="/completar-perfil"
                element={<CompletarPerfil />}
              />

              <Route path="/vagas" element={<Vagas />} />

              <Route path="/servicos" element={<Servicos />} />

              <Route
                path="/talentos"
                element={<BancoDeTalentos />}
              />

              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <PerfilAluno />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/perfil/:id"
                element={
                  <ProtectedRoute>
                    <PerfilAluno />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/empresa"
                element={
                  <ProtectedRoute>
                    <PerfilEmpresa />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/empresa/:id"
                element={
                  <ProtectedRoute>
                    <PerfilEmpresa />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/professor"
                element={
                  <ProtectedRoute>
                    <PerfilProfessor />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/professor/:id"
                element={
                  <ProtectedRoute>
                    <PerfilProfessor />
                  </ProtectedRoute>
                }
              />

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

              {/* PAINEL ADMINISTRATIVO (RESTRITO A ROLE 'admin') */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:userId" element={<AdminUserDetail />} />
                <Route path="jobs" element={<AdminJobs />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="moderation" element={<AdminModeration />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {!isAdminRoute && <Footer />}

      <Toast />

      {isChatOpen && <ChatModal onClose={closeChat} />}
    </div>
  );
}

export default function App() {
  const initAuthListener = useAppStore(
    (state) => state.initAuthListener
  );

  useEffect(() => {
    // Verifica e limpa localStorage se estiver cheio
    try {
      const testKey = '__ivai_ls_test__';

      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch (e) {
      // localStorage cheio — limpa dados de cache pesados
      const cacheKeys = [
        'ivai_conecta_db_jobs',
        'ivai_conecta_db_talents',
        'ivai_conecta_db_services',
        'ivai_conecta_user_applications',
      ];

      for (const key of cacheKeys) {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignora erro ao remover cache
        }
      }

      console.warn(
        '[App] localStorage estava cheio. Cache de dados limpo para liberar espaço.'
      );
    }

    seedFirestoreIfEmpty();

    if (typeof initAuthListener === 'function') {
      const unsubscribe = initAuthListener();

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }

    return undefined;
  }, [initAuthListener]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="container section text-center py-24">
      <div className="flex justify-center mb-6">
        <Compass
          size={64}
          className="text-primary-blue animate-pulse"
        />
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