import { Settings, Bell, Lock, Eye, Shield, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function Configuracoes() {
  const { currentUser, logout, showToast } = useAppStore();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <main className="container section text-center py-24">
        <Settings size={54} className="mx-auto mb-4 text-gray-300" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">Acesso restrito</h2>
        <Link to="/login" className="btn btn-primary px-6 py-2.5 mt-4">Entrar</Link>
      </main>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Configurações salvas com sucesso!');
  };

  const handleLogout = () => {
    logout();
    showToast('Sessão encerrada com sucesso.');
    navigate('/');
  };

  return (
    <>
      {/* ── HEADER: ALINHADO À ESQUERDA COM ESCRITA GRANDE ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mb-3 tracking-tight">
              Configurações da Conta
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Gerencie suas preferências, privacidade e segurança.
            </p>
          </div>
        </div>
      </header>

      <main className="container section">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Account Info */}
          <div className="card p-6">
            <h3 className="font-heading font-bold text-lg text-primary-dark mb-5 flex items-center gap-2">
              <Settings size={19} className="text-primary-blue" /> Informações da Conta
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="form-group">
                <label className="form-label">E-mail de Acesso</label>
                <input type="email" defaultValue={currentUser.email} readOnly className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Nome de Exibição</label>
                <input type="text" defaultValue={currentUser.name} className="form-control" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary btn-sm">Salvar Alterações</button>
              </div>
            </form>
          </div>

          {/* Password */}
          <div className="card p-6">
            <h3 className="font-heading font-bold text-lg text-primary-dark mb-5 flex items-center gap-2">
              <Lock size={19} className="text-primary-blue" /> Alterar Senha
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input type="password" className="form-control" placeholder="Mínimo de 6 caracteres" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input type="password" className="form-control" placeholder="Repita a nova senha" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary btn-sm">Atualizar Senha</button>
              </div>
            </form>
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <h3 className="font-heading font-bold text-lg text-primary-dark mb-5 flex items-center gap-2">
              <Bell size={19} className="text-primary-blue" /> Notificações
            </h3>
            <div className="form-group">
              <label className="form-label">Alertas por E-mail</label>
              <select className="form-control font-medium">
                <option value="all">Receber alertas de novas vagas e propostas</option>
                <option value="important">Apenas convites para entrevistas</option>
                <option value="none">Desativar todas as notificações</option>
              </select>
            </div>
          </div>

          {/* Privacy */}
          <div className="card p-6">
            <h3 className="font-heading font-bold text-lg text-primary-dark mb-5 flex items-center gap-2">
              <Eye size={19} className="text-primary-blue" /> Privacidade
            </h3>
            <div className="form-group">
              <label className="form-label">Visibilidade do Perfil no Banco de Talentos</label>
              <select className="form-control font-medium">
                <option value="public">Visível para todas as empresas do Vale do Ivaí</option>
                <option value="verified_only">Apenas empresas com selo verificado</option>
                <option value="private">Privado (Apenas quando me candidatar)</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} className="btn btn-primary btn-sm">Salvar Preferências</button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card p-6 border-red-200 bg-red-50/20">
            <h3 className="font-heading font-bold text-lg text-red-600 mb-3 flex items-center gap-2">
              <Shield size={19} /> Encerrar Sessão
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Ao sair da conta, sua sessão no <strong>Ivaí Conecta</strong> será encerrada e você precisará
              fazer login novamente.
            </p>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              <LogOut size={15} /> Sair da Conta
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
