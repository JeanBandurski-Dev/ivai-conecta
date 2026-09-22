import { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Search,
  MapPin,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Trash2,
  RefreshCw,
  AlertCircle,
  Tag
} from 'lucide-react';
import {
  fetchAllServices,
  moderateService,
  deleteServiceDocument
} from '../../services/adminService';
import useAppStore from '../../store/useAppStore';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';

export default function AdminServices() {
  const { showToast } = useAppStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Category Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal
  const [selectedService, setSelectedService] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'pause' | 'activate' | 'delete'
  const [actionLoading, setActionLoading] = useState(false);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllServices({ limitCount: 150 });
      if (res.success) {
        setServices(res.services || []);
      } else {
        setError(res.error || 'Erro ao consultar serviços.');
      }
    } catch (err) {
      setError(err.message || 'Falha ao buscar serviços do Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (categoryFilter !== 'all') {
        const cat = String(s.category || '').toLowerCase().trim();
        if (cat !== categoryFilter) return false;
      }

      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const title = String(s.title || '').toLowerCase();
        const provider = String(s.providerName || s.providerEmail || '').toLowerCase();
        const city = String(s.city || '').toLowerCase();
        if (!title.includes(term) && !provider.includes(term) && !city.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [services, categoryFilter, search]);

  const handleOpenModal = (service, action) => {
    setSelectedService(service);
    setModalAction(action);
  };

  const handleConfirmAction = async () => {
    if (!selectedService) return;
    setActionLoading(true);
    const serviceId = selectedService.id || selectedService.firestoreId;

    try {
      if (modalAction === 'delete') {
        const res = await deleteServiceDocument(serviceId);
        if (res.success) {
          showToast(res.message);
          setServices(prev => prev.filter(s => (s.id || s.firestoreId) !== serviceId));
          setModalAction(null);
          setSelectedService(null);
        } else {
          showToast(`⚠️ ${res.error}`);
        }
      } else {
        const res = await moderateService(serviceId, modalAction);
        if (res.success) {
          showToast(res.message);
          setServices(prev =>
            prev.map(s =>
              (s.id || s.firestoreId) === serviceId
                ? { ...s, status: res.status }
                : s
            )
          );
          setModalAction(null);
          setSelectedService(null);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Serviços
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle do catálogo regional de prestadores e profissionais autônomos.
          </p>
        </div>

        <button
          onClick={loadServices}
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
            placeholder="Buscar por serviço, prestador ou cidade..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-blue/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            <option value="tecnologia">Tecnologia &amp; TI</option>
            <option value="reformas">Reformas &amp; Reparos</option>
            <option value="beleza">Beleza &amp; Estética</option>
            <option value="aulas">Aulas &amp; Reforço</option>
            <option value="eventos">Eventos &amp; Festas</option>
            <option value="saude">Saúde &amp; Bem-estar</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Falha ao buscar serviços</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* ── SERVICES TABLE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Serviço</th>
                <th className="py-3.5 px-4">Prestador</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Cidade</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Consultando serviços no Firestore...</p>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Wrench size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nenhum serviço encontrado.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Não há serviços cadastrados correspondentes aos filtros selecionados.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => {
                  const sId = s.id || s.firestoreId;
                  const isPaused = s.status === 'paused';

                  return (
                    <tr
                      key={sId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Título do Serviço */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {s.title || 'Serviço Sem Título'}
                        </div>
                        {s.price && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            {s.price}
                          </div>
                        )}
                      </td>

                      {/* Prestador */}
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{s.providerName || 'Prestador Regional'}</div>
                        <div className="text-slate-400 text-[11px]">{s.providerEmail || '—'}</div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60 capitalize">
                          <Tag size={11} /> {s.category || 'Geral'}
                        </span>
                      </td>

                      {/* Cidade */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{s.city || 'Ivaiporã'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPaused ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                            <PauseCircle size={12} /> Pausado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                            <CheckCircle2 size={12} /> Ativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pausar / Ativar */}
                          <button
                            onClick={() => handleOpenModal(s, isPaused ? 'activate' : 'pause')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isPaused
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            }`}
                            title={isPaused ? 'Ativar Serviço' : 'Pausar Serviço'}
                          >
                            {isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                          </button>

                          {/* Excluir Permanente */}
                          <button
                            onClick={() => handleOpenModal(s, 'delete')}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Serviço Permanentemente"
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

      {/* ── MODAL DE CONFIRMAÇÃO ── */}
      <AdminConfirmModal
        isOpen={Boolean(modalAction)}
        title={
          modalAction === 'activate'
            ? 'Ativar Serviço'
            : modalAction === 'pause'
            ? 'Pausar Serviço'
            : 'Excluir Serviço Permanentemente'
        }
        message={
          modalAction === 'activate'
            ? `Deseja reativar a exibição do serviço "${selectedService?.title}" no catálogo regional?`
            : modalAction === 'pause'
            ? `Deseja pausar temporariamente a exibição do serviço "${selectedService?.title}"?`
            : `ATENÇÃO: Deseja excluir permanentemente o serviço "${selectedService?.title}" do Firestore? Essa ação não pode ser desfeita.`
        }
        confirmLabel={
          modalAction === 'activate'
            ? 'Ativar Serviço'
            : modalAction === 'pause'
            ? 'Pausar Serviço'
            : 'Excluir Registro'
        }
        confirmVariant={modalAction === 'delete' ? 'danger' : modalAction === 'pause' ? 'warning' : 'primary'}
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => {
          setModalAction(null);
          setSelectedService(null);
        }}
      />
    </div>
  );
}
