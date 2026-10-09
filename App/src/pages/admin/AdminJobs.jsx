import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  fetchAllJobs,
  moderateJob,
  deleteJobDocument
} from '../../services/adminService';
import useAppStore from '../../store/useAppStore';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';

export default function AdminJobs() {
  const { showToast } = useAppStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'approve' | 'reject' | 'close' | 'reactivate' | 'delete'
  const [actionLoading, setActionLoading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllJobs({ limitCount: 150 });
      if (res.success) {
        setJobs(res.jobs || []);
      } else {
        setError(res.error || 'Erro ao carregar vagas.');
      }
    } catch (err) {
      setError(err.message || 'Falha ao buscar vagas do Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      // Status filter
      if (statusFilter !== 'all') {
        const st = String(j.status || 'Ativa').toLowerCase().trim();
        if (st !== statusFilter) return false;
      }

      // Search
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const title = String(j.title || '').toLowerCase();
        const company = String(j.company || '').toLowerCase();
        const city = String(j.city || '').toLowerCase();
        if (!title.includes(term) && !company.includes(term) && !city.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, statusFilter, search]);

  const handleOpenActionModal = (job, action) => {
    setSelectedJob(job);
    setModalAction(action);
  };

  const handleConfirmAction = async (rejectionReason) => {
    if (!selectedJob) return;
    setActionLoading(true);
    const jobId = selectedJob.id || selectedJob.firestoreId;

    try {
      if (modalAction === 'delete') {
        const res = await deleteJobDocument(jobId);
        if (res.success) {
          showToast(res.message);
          setJobs(prev => prev.filter(j => (j.id || j.firestoreId) !== jobId));
          setModalAction(null);
          setSelectedJob(null);
        } else {
          showToast(`⚠️ ${res.error}`);
        }
      } else {
        const res = await moderateJob(jobId, modalAction, rejectionReason);
        if (res.success) {
          showToast(res.message);
          setJobs(prev =>
            prev.map(j =>
              (j.id || j.firestoreId) === jobId
                ? { ...j, status: res.status, rejectionReason: modalAction === 'reject' ? rejectionReason : null }
                : j
            )
          );
          setModalAction(null);
          setSelectedJob(null);
        } else {
          showToast(`⚠️ ${res.error}`);
        }
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const st = String(status || 'Ativa').toLowerCase().trim();
    switch (st) {
      case 'encerrada':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'pendente':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      case 'rejeitada':
        return 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-200 dark:border-red-900/60';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
            Moderação de Vagas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Revisão, aprovação e controle de conformidade das vagas cadastradas pelas empresas.
          </p>
        </div>

        <button
          onClick={loadJobs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-primary-blue hover:text-primary-blue shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Carregando...' : 'Recarregar'}</span>
        </button>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cargo, título, empresa ou cidade..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-blue/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="ativa">Ativas</option>
            <option value="pendente">Pendentes</option>
            <option value="encerrada">Encerradas</option>
            <option value="rejeitada">Rejeitadas</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Erro ao listar vagas</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* ── JOBS TABLE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Oportunidade / Cargo</th>
                <th className="py-3.5 px-4">Empresa</th>
                <th className="py-3.5 px-4">Localização</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4 text-right">Ações de Moderação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Consultando coleção de vagas no Firestore...</p>
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nenhuma vaga encontrada.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Não há vagas cadastradas com os filtros selecionados.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => {
                  const jobId = j.id || j.firestoreId;
                  const currentStatus = String(j.status || 'Ativa').toLowerCase().trim();

                  return (
                    <tr
                      key={jobId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Título */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {j.title || 'Título da Vaga'}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {j.type || 'Tempo Integral'} • {j.applicantsCount || 0} inscritos
                        </div>
                        {j.rejectionReason && currentStatus === 'rejeitada' && (
                          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1 truncate max-w-xs">
                            Motivo: {j.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Empresa */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400" />
                          <span>{j.company || 'Empresa Regional'}</span>
                        </div>
                      </td>

                      {/* Localização */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{j.city || 'Ivaiporã'}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(j.status)}`}>
                          {j.status || 'Ativa'}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {j.createdAt || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Aprovar / Reativar */}
                          {(currentStatus === 'pendente' || currentStatus === 'rejeitada' || currentStatus === 'encerrada') && (
                            <button
                              onClick={() => handleOpenActionModal(j, 'approve')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Aprovar / Ativar Vaga"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}

                          {/* Encerrar / Desativar */}
                          {currentStatus === 'ativa' && (
                            <button
                              onClick={() => handleOpenActionModal(j, 'close')}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Encerrar Vaga"
                            >
                              <Clock size={16} />
                            </button>
                          )}

                          {/* Rejeitar */}
                          {currentStatus !== 'rejeitada' && (
                            <button
                              onClick={() => handleOpenActionModal(j, 'reject')}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Rejeitar Vaga com Justificativa"
                            >
                              <XCircle size={16} />
                            </button>
                          )}

                          {/* Excluir Permanente */}
                          <button
                            onClick={() => handleOpenActionModal(j, 'delete')}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Vaga Permanentemente"
                          >
                            <Trash2 size={16} />
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

      {/* ── ACTION CONFIRMATION MODAL ── */}
      <AdminConfirmModal
        isOpen={Boolean(modalAction)}
        title={
          modalAction === 'approve'
            ? 'Aprovar e Ativar Vaga'
            : modalAction === 'reject'
            ? 'Rejeitar Publicação de Vaga'
            : modalAction === 'close'
            ? 'Encerrar Vaga'
            : 'Excluir Vaga Permanentemente'
        }
        message={
          modalAction === 'approve'
            ? `Tem certeza que deseja aprovar e publicar a vaga "${selectedJob?.title}"? Ela ficará visível publicamente no mural de vagas.`
            : modalAction === 'reject'
            ? `Deseja rejeitar a vaga "${selectedJob?.title}"? Informe a justificativa que ficará gravada no registro da vaga.`
            : modalAction === 'close'
            ? `Deseja encerrar o processo seletivo da vaga "${selectedJob?.title}"? Candidatos não poderão mais se inscrever.`
            : `ATENÇÃO: Deseja excluir permanentemente a vaga "${selectedJob?.title}" do Firestore? Essa ação não pode ser desfeita.`
        }
        confirmLabel={
          modalAction === 'approve'
            ? 'Aprovar Vaga'
            : modalAction === 'reject'
            ? 'Rejeitar Vaga'
            : modalAction === 'close'
            ? 'Encerrar Vaga'
            : 'Excluir Registro'
        }
        confirmVariant={modalAction === 'approve' ? 'primary' : modalAction === 'close' ? 'warning' : 'danger'}
        requireReason={modalAction === 'reject'}
        reasonPlaceholder="Ex: Conteúdo incompleto, salário abusivo ou descrição ofensiva..."
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => {
          setModalAction(null);
          setSelectedJob(null);
        }}
      />
    </div>
  );
}
