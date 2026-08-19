import { Settings, Bell, Lock, Eye, Shield, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function Configuracoes() {
  const { currentUser, logout, showToast } = useAppStore();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <main className="container section text-center py-20">
        <Settings size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">Acesso restrito</h2>
        <Link to="/login" className="btn btn-primary mt-4">Entrar</Link>
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
      <header className="bg-gradient-to-r from-primary-dark to-primary-blue text-white py-14">
        <div className="container">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Configurações da Conta</h1>
          <p className="text-gray-300">Gerencie suas preferências, privacidade e segurança.</p>
        </div>
      </header>

      <main className="container section">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Account Info */}
          <div className="card">
            <h3 className="font-heading font-bold text-primary-dark mb-5 flex items-center gap-2">
              <Settings size={18} className="text-primary-blue" /> Informações da Conta
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
          <div className="card">
            <h3 className="font-heading font-bold text-primary-dark mb-5 flex items-center gap-2">
              <Lock size={18} className="text-primary-blue" /> Alterar Senha
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
          <div className="card">
            <h3 className="font-heading font-bold text-primary-dark mb-5 flex items-center gap-2">
              <Bell size={18} className="text-primary-blue" /> Notificações
            </h3>
            <div className="form-group">
              <label className="form-label">Alertas por E-mail</label>
              <select className="form-control">
                <option value="all">Receber alertas de novas vagas e propostas</option>
                <option value="important">Apenas convites para entrevistas</option>
                <option value="none">Desativar todas as notificações</option>
              </select>
            </div>
          </div>

          {/* Privacy */}
          <div className="card">
            <h3 className="font-heading font-bold text-primary-dark mb-5 flex items-center gap-2">
              <Eye size={18} className="text-primary-blue" /> Privacidade
            </h3>
            <div className="form-group">
              <label className="form-label">Visibilidade do Perfil no Banco de Talentos</label>
              <select className="form-control">
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
          <div className="card border-red-200">
            <h3 className="font-heading font-bold text-red-600 mb-4 flex items-center gap-2">
              <Shield size={18} /> Encerrar Sessão
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Ao sair da conta, sua sessão no <strong>Ivaí Conecta</strong> será encerrada e você precisará
              fazer login novamente.
            </p>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              <LogOut size={14} /> Sair da Conta
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
