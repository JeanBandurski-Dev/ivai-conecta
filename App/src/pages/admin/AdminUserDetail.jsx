import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Shield,
  CheckCircle2,
  UserX,
  UserCheck,
  Trash2,
  Edit2,
  AlertCircle,
  BadgeCheck
} from 'lucide-react';
import {
  fetchUserById,
  updateUserStatus,
  updateUserRole,
  deleteUserDocument
} from '../../services/adminService';
import useAppStore from '../../store/useAppStore';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAppStore();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [modalType, setModalType] = useState(null); // 'status' | 'role' | 'delete'
  const [selectedRole, setSelectedRole] = useState('aluno');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserById(userId);
      if (res.success) {
        setUser(res.user);
        setSelectedRole(res.user.role || 'aluno');
      } else {
        setError(res.error || 'Usuário não encontrado.');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do usuário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const handleToggleStatus = async (reason) => {
    if (!user) return;
    setActionLoading(true);
    const isCurrentlyBlocked = user.blocked === true || user.status === 'blocked';
    const nextBlocked = !isCurrentlyBlocked;

    try {
      const res = await updateUserStatus(user.id || user.uid, nextBlocked, reason);
      if (res.success) {
        showToast(res.message);
        setUser(prev => ({ ...prev, ...res.user, blocked: nextBlocked, status: nextBlocked ? 'blocked' : 'active' }));
        setModalType(null);
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await updateUserRole(user.id || user.uid, selectedRole);
      if (res.success) {
        showToast(res.message);
        setUser(prev => ({ ...prev, ...res.user }));
        setModalType(null);
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await deleteUserDocument(user.id || user.uid);
      if (res.success) {
        showToast(res.message);
        navigate('/admin/users');
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Carregando perfil do usuário...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800">
        <AlertCircle size={40} className="mx-auto mb-3 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Usuário não localizado
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {error || 'O registro do usuário não existe ou foi removido do Firestore.'}
        </p>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-primary-blue text-white"
        >
          <ArrowLeft size={16} /> Voltar para Usuários
        </Link>
      </div>
    );
  }

  const isBlocked = user.blocked === true || user.status === 'blocked';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── BREADCRUMB & BACK ── */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-blue transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para Gestão de Usuários
        </Link>
      </div>

      {/* ── USER HEADER PROFILE CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-primary-light dark:bg-blue-900/50 flex items-center justify-center border-2 border-primary-blue/30 shrink-0 text-primary-blue dark:text-blue-400 font-bold text-2xl shadow-inner">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                (user.name || 'U').charAt(0)
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                  {user.name || 'Usuário Sem Nome'}
                </h1>
                {user.isVerifiedCompany && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                    <BadgeCheck size={12} /> Empresa Verificada
                  </span>
                )}
                {user.isVerifiedStudent && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                    <BadgeCheck size={12} /> Estudante Verificado
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <Mail size={14} /> {user.email || 'Sem e-mail cadastrado'}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                  {user.role || 'aluno'}
                </span>

                {isBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                    <UserX size={12} /> Conta Bloqueada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                    <CheckCircle2 size={12} /> Conta Ativa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-800">
            {/* Alterar Role */}
            <button
              onClick={() => setModalType('role')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary-blue hover:text-primary-blue transition-colors cursor-pointer"
            >
              <Edit2 size={14} /> Alterar Função
            </button>

            {/* Bloquear / Desbloquear */}
            <button
              onClick={() => setModalType('status')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                isBlocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isBlocked ? <UserCheck size={14} /> : <UserX size={14} />}
              <span>{isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}</span>
            </button>

            {/* Excluir Documento */}
            <button
              onClick={() => setModalType('delete')}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
              title="Excluir documento do Firestore"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MOTIVO DO BLOQUEIO (SE HOUVER) ── */}
      {isBlocked && user.blockedReason && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-sm">
          <strong>Motivo do Bloqueio:</strong> {user.blockedReason}
        </div>
      )}

      {/* ── DETALHES GERAIS E DADOS REAIS DA CONTA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadados da Conta */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Informações do Cadastro
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Shield size={14} /> ID do Documento
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 select-all">
                {user.id || user.uid}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin size={14} /> Cidade
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {user.city || 'Ivaiporã'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar size={14} /> Criado em
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {user.createdAt || 'Não registrado'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar size={14} /> Última Atualização
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {user.updatedAt || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Dados Específicos da Role Real */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Dados Específicos do Perfil
          </h3>

          <div className="space-y-3 text-sm">
            {/* Aluno */}
            {user.role === 'aluno' && (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Instituição</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {user.institution || 'Não informada'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Curso</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {user.course || 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Período</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {user.period || 'Não informado'}
                  </span>
                </div>
                {user.raNumber && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Registro Acadêmico (RA)</span>
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                      {user.raNumber}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Empresa */}
            {user.role === 'empresa' && (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">CNPJ</span>
                  <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                    {user.cnpj || 'Não informado'}
                  </span>
                </div>
                {user.razaoSocial && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Razão Social</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {user.razaoSocial}
                    </span>
                  </div>
                )}
                {user.sector && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Setor de Atuação</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {user.sector}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Professor */}
            {user.role === 'professor' && (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Titulação / Formação</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {user.degree || 'Não informada'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Instituição de Ensino</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {user.institution || 'Não informada'}
                  </span>
                </div>
              </>
            )}

            {/* Biografia / Sobre */}
            {(user.bio || user.about) && (
              <div className="pt-2">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Biografia / Apresentação:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl leading-relaxed">
                  {user.bio || user.about}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: STATUS (BLOQUEIO/DESBLOQUEIO) ── */}
      <AdminConfirmModal
        isOpen={modalType === 'status'}
        title={isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
        message={
          isBlocked
            ? `Deseja reativar o acesso de ${user.name} à plataforma?`
            : `Tem certeza que deseja suspender a conta de ${user.name}? O usuário será impedido de realizar login.`
        }
        confirmLabel={isBlocked ? 'Desbloquear Conta' : 'Bloquear Conta'}
        confirmVariant={isBlocked ? 'primary' : 'danger'}
        requireReason={!isBlocked}
        reasonPlaceholder="Descreva a razão do bloqueio administrativo..."
        isLoading={actionLoading}
        onConfirm={handleToggleStatus}
        onClose={() => setModalType(null)}
      />

      {/* ── MODAL: EXCLUIR DOCUMENTO ── */}
      <AdminConfirmModal
        isOpen={modalType === 'delete'}
        title="Excluir Registro de Usuário"
        message={`ATENÇÃO: Deseja excluir permanentemente o documento de ${user.name} no Firestore? Esta ação é irreversível.`}
        confirmLabel="Sim, Excluir Registro"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={handleDeleteUser}
        onClose={() => setModalType(null)}
      />

      {/* ── MODAL: ALTERAR ROLE ── */}
      {modalType === 'role' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Alterar Função de {user.name}
            </h3>

            <div className="space-y-2">
              {['aluno', 'empresa', 'professor', 'admin', 'freelancer', 'candidato'].map(r => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer capitalize ${
                    selectedRole === r
                      ? 'border-primary-blue bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="modal_role"
                    value={r}
                    checked={selectedRole === r}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{r}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-primary-blue text-white"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
