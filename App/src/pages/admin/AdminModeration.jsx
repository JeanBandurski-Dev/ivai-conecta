import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Briefcase,
  UserX,
  RefreshCw,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import {
  fetchModerationItems,
  moderateJob,
  updateUserStatus
} from '../../services/adminService';
import useAppStore from '../../store/useAppStore';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';

export default function AdminModeration() {
  const { showToast } = useAppStore();
  const [data, setData] = useState({ flaggedJobs: [], blockedUsers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab: 'all' | 'jobs' | 'users'
  const [activeTab, setActiveTab] = useState('all');

  // Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobAction, setJobAction] = useState(null); // 'approve' | 'reject'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchModerationItems();
      if (res.success) {
        setData({
          flaggedJobs: res.flaggedJobs || [],
          blockedUsers: res.blockedUsers || []
        });
      } else {
        setError(res.error || 'Erro ao carregar fila de moderação.');
      }
    } catch (err) {
      setError(err.message || 'Falha na conexão com o Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmJobAction = async (rejectionReason) => {
    if (!selectedJob) return;
    setActionLoading(true);
    const jobId = selectedJob.id || selectedJob.firestoreId;

    try {
      const res = await moderateJob(jobId, jobAction, rejectionReason);
      if (res.success) {
        showToast(res.message);
        setData(prev => ({
          ...prev,
          flaggedJobs: prev.flaggedJobs.filter(j => (j.id || j.firestoreId) !== jobId)
        }));
        setSelectedJob(null);
        setJobAction(null);
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmUnblockUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await updateUserStatus(selectedUser.id || selectedUser.uid, false);
      if (res.success) {
        showToast(res.message);
        setData(prev => ({
          ...prev,
          blockedUsers: prev.blockedUsers.filter(u => (u.id || u.uid) !== (selectedUser.id || selectedUser.uid))
        }));
        setSelectedUser(null);
        setUserModalOpen(false);
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const totalItems = data.flaggedJobs.length + data.blockedUsers.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="text-amber-500" size={28} />
            Central de Moderação
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fila unificada de conteúdos e contas que necessitam de intervenção ou revisão administrativa.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-primary-blue hover:text-primary-blue shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Atualizando...' : 'Recarregar Fila'}</span>
        </button>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'border-primary-blue text-primary-blue dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Todos os Itens ({totalItems})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'jobs'
              ? 'border-primary-blue text-primary-blue dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Vagas ({data.flaggedJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'border-primary-blue text-primary-blue dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Usuários Bloqueados ({data.blockedUsers.length})
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Erro ao consultar itens de moderação</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* ── QUEUE LIST ── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Analisando pendências no Cloud Firestore...</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-gray-200/80 dark:border-slate-800 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Nenhuma pendência na fila de moderação
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Todas as vagas publicadas estão ativas e não há contas de usuários com pendência de revisão ou bloqueio não resolvido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Seção de Vagas */}
          {(activeTab === 'all' || activeTab === 'jobs') && data.flaggedJobs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Vagas Aguardando Aprovação / Rejeitadas ({data.flaggedJobs.length})
              </h2>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 shadow-xs">
                {data.flaggedJobs.map((j) => {
                  const jobId = j.id || j.firestoreId;
                  const isRejected = String(j.status || '').toLowerCase() === 'rejeitada';

                  return (
                    <div key={jobId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isRejected
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-600'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                        }`}>
                          <Briefcase size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {j.title || 'Vaga Sem Título'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                              isRejected
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-200 dark:border-red-900/60'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                            }`}>
                              {j.status || 'Pendente'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {j.company || 'Empresa'} • {j.city || 'Ivaiporã'}
                          </p>
                          {j.rejectionReason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              <strong>Motivo:</strong> {j.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setSelectedJob(j);
                            setJobAction('approve');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          Aprovar
                        </button>
                        {!isRejected && (
                          <button
                            onClick={() => {
                              setSelectedJob(j);
                              setJobAction('reject');
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            Rejeitar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seção de Usuários Bloqueados */}
          {(activeTab === 'all' || activeTab === 'users') && data.blockedUsers.length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Usuários Bloqueados / Sob Suspensão ({data.blockedUsers.length})
              </h2>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 shadow-xs">
                {data.blockedUsers.map((u) => {
                  const uId = u.id || u.uid;

                  return (
                    <div key={uId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                          <UserX size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {u.name || 'Usuário'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                              Bloqueado
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {u.email} • Papel: {u.role}
                          </p>
                          {u.blockedReason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              <strong>Motivo:</strong> {u.blockedReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          to={`/admin/users/${uId}`}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-blue transition-colors"
                        >
                          Ver Perfil
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setUserModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          Restaurar Acesso
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DE MODERAÇÃO DE VAGA ── */}
      <AdminConfirmModal
        isOpen={Boolean(jobAction)}
        title={jobAction === 'approve' ? 'Aprovar Vaga' : 'Rejeitar Vaga'}
        message={
          jobAction === 'approve'
            ? `Deseja aprovar e publicar a vaga "${selectedJob?.title}"?`
            : `Deseja reprovar a vaga "${selectedJob?.title}"? Informe a justificativa abaixo:`
        }
        confirmLabel={jobAction === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
        confirmVariant={jobAction === 'approve' ? 'primary' : 'danger'}
        requireReason={jobAction === 'reject'}
        reasonPlaceholder="Informe a inconformidade identificada..."
        isLoading={actionLoading}
        onConfirm={handleConfirmJobAction}
        onClose={() => {
          setSelectedJob(null);
          setJobAction(null);
        }}
      />

      {/* ── MODAL DE DESBLOQUEIO DE USUÁRIO ── */}
      <AdminConfirmModal
        isOpen={userModalOpen}
        title="Restaurar Acesso de Usuário"
        message={`Deseja reativar o acesso de ${selectedUser?.name} (${selectedUser?.email}) à plataforma?`}
        confirmLabel="Desbloquear Conta"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleConfirmUnblockUser}
        onClose={() => {
          setSelectedUser(null);
          setUserModalOpen(false);
        }}
      />
    </div>
  );
}
