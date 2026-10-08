import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  UserX,
  UserCheck,
  Shield,
  Eye,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  fetchAllUsers,
  updateUserStatus,
  updateUserRole
} from '../../services/adminService';
import useAppStore from '../../store/useAppStore';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';

export default function AdminUsers() {
  const { showToast } = useAppStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'block' | 'unblock' | 'role'
  const [selectedRole, setSelectedRole] = useState('aluno');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllUsers({ limitCount: 150 });
      if (res.success) {
        setUsers(res.users || []);
      } else {
        setError(res.error || 'Erro ao carregar usuários.');
      }
    } catch (err) {
      setError(err.message || 'Falha na conexão com o Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users in memory
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Role filter
      if (roleFilter !== 'all') {
        const r = String(u.role || '').toLowerCase().trim();
        if (r !== roleFilter) return false;
      }
      // Status filter
      if (statusFilter === 'blocked') {
        if (!u.blocked && u.status !== 'blocked') return false;
      } else if (statusFilter === 'active') {
        if (u.blocked || u.status === 'blocked') return false;
      }
      // Search
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const name = String(u.name || '').toLowerCase();
        const email = String(u.email || '').toLowerCase();
        const city = String(u.city || '').toLowerCase();
        if (!name.includes(term) && !email.includes(term) && !city.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  // Actions
  const handleOpenBlockModal = (user) => {
    setSelectedUser(user);
    setModalType(user.blocked || user.status === 'blocked' ? 'unblock' : 'block');
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role || 'aluno');
    setModalType('role');
  };

  const handleConfirmStatus = async (reason) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const isBlocking = modalType === 'block';

    try {
      const res = await updateUserStatus(selectedUser.id || selectedUser.uid, isBlocking, reason);
      if (res.success) {
        const targetId = selectedUser.id || selectedUser.uid;
        showToast(res.message || (isBlocking ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.'));
        setUsers(prev => prev.map(u => ((u.id === targetId || u.uid === targetId) ? { ...u, ...res.user, blocked: isBlocking, status: isBlocking ? 'blocked' : 'active' } : u)));
        setModalType(null);
        setSelectedUser(null);
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await updateUserRole(selectedUser.id || selectedUser.uid, selectedRole);
      if (res.success) {
        showToast(res.message);
        setUsers(prev => prev.map(u => (u.id === selectedUser.id ? { ...u, ...res.user } : u)));
        setModalType(null);
        setSelectedUser(null);
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const r = String(role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-200 dark:border-red-900/60';
      case 'empresa':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
      case 'professor':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      case 'freelancer':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-900/60';
      case 'candidato':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Usuários
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle de acessos, papéis (roles) e bloqueios dos membros da plataforma.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-primary-blue hover:text-primary-blue dark:hover:text-blue-400 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Carregando...' : 'Recarregar'}</span>
        </button>
      </div>

      {/* ── FILTROS E BUSCA ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, e-mail ou cidade..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-all"
          />
        </div>

        {/* Filters dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
          >
            <option value="all">Todas as Funções</option>
            <option value="aluno">Alunos</option>
            <option value="empresa">Empresas</option>
            <option value="professor">Professores</option>
            <option value="admin">Administradores</option>
            <option value="freelancer">Freelancers</option>
            <option value="candidato">Candidatos</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="blocked">Apenas Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Erro ao consultar a coleção de usuários</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* ── TABELA DE USUÁRIOS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Função</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Cadastro</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Consultando base de usuários do Firestore...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nenhum usuário encontrado.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajuste os filtros de busca ou aguarde novos cadastros na plataforma.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isBlocked = u.blocked === true || u.status === 'blocked';
                  const userId = u.id || u.uid;

                  return (
                    <tr
                      key={userId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Avatar + Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-light dark:bg-blue-900/50 flex items-center justify-center border border-primary-blue/20 shrink-0 text-primary-blue dark:text-blue-400 font-bold text-xs">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              (u.name || 'U').charAt(0)
                            )}
                          </div>
                          <div className="leading-tight">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {u.name || 'Usuário Sem Nome'}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {u.city || 'Ivaiporã'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {u.email || 'Não informado'}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border capitalize ${getRoleBadge(u.role)}`}>
                          {u.role || 'aluno'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                            <UserX size={12} /> Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                            <CheckCircle2 size={12} /> Ativo
                          </span>
                        )}
                      </td>

                      {/* Cadastro */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {u.createdAt ? (
                          typeof u.createdAt === 'string' && u.createdAt.includes('T')
                            ? new Date(u.createdAt).toLocaleDateString('pt-BR')
                            : u.createdAt
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visualizar */}
                          <Link
                            to={`/admin/users/${userId}`}
                            className="p-1.5 text-slate-500 hover:text-primary-blue hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Visualizar Perfil Completo"
                          >
                            <Eye size={16} />
                          </Link>

                          {/* Alterar Role */}
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Alterar Função / Role"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Bloquear / Desbloquear */}
                          <button
                            onClick={() => handleOpenBlockModal(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBlocked
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                            }`}
                            title={isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                          >
                            {isBlocked ? <UserCheck size={16} /> : <UserX size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL DE BLOQUEIO / DESBLOQUEIO ── */}
      <AdminConfirmModal
        isOpen={modalType === 'block' || modalType === 'unblock'}
        title={modalType === 'block' ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
        message={
          modalType === 'block'
            ? `Tem certeza que deseja bloquear o acesso de ${selectedUser?.name || 'este usuário'} à plataforma? O usuário não conseguirá realizar login enquanto estiver bloqueado.`
            : `Tem certeza que deseja restaurar o acesso de ${selectedUser?.name || 'este usuário'} à plataforma?`
        }
        confirmLabel={modalType === 'block' ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
        confirmVariant={modalType === 'block' ? 'danger' : 'primary'}
        requireReason={modalType === 'block'}
        reasonPlaceholder="Informe o motivo administrativo do bloqueio..."
        isLoading={actionLoading}
        onConfirm={handleConfirmStatus}
        onClose={() => {
          setModalType(null);
          setSelectedUser(null);
        }}
      />

      {/* ── MODAL DE ALTERAÇÃO DE ROLE ── */}
      {modalType === 'role' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Alterar Função de Usuário
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {selectedUser.name} ({selectedUser.email})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-2">
                Selecione o novo papel:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'aluno', name: 'Aluno / Estudante', desc: 'Acesso a vagas, banco de talentos e pareceres' },
                  { id: 'empresa', name: 'Empresa / Recrutador', desc: 'Publicação e gestão de vagas e funil ATS' },
                  { id: 'professor', name: 'Professor / Docente', desc: 'Emissão de pareceres e recomendações acadêmicas' },
                  { id: 'freelancer', name: 'Freelancer / Autônomo', desc: 'Divulgação de serviços locais' },
                  { id: 'candidato', name: 'Candidato Geral', desc: 'Candidaturas para vagas da região' },
                  { id: 'admin', name: 'Administrador do Sistema', desc: 'Acesso irrestrito ao painel administrativo' },
                ].map(r => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === r.id
                        ? 'border-primary-blue bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={selectedRole === r.id}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mt-0.5 text-primary-blue"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-800 dark:text-white">{r.name}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRole}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-primary-blue hover:bg-primary-hover text-white shadow-sm transition-all"
              >
                {actionLoading ? 'Salvando...' : 'Salvar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
