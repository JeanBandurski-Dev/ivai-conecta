import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Wrench,
  Building2,
  GraduationCap,
  Award,
  UserX,
  UserCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { fetchPlatformStats } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlatformStats();
      if (res.success) {
        setStats(res.stats);
        setRecentActivities(res.recentActivities || []);
      } else {
        setError(res.error || 'Não foi possível carregar as métricas da plataforma.');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado ao consultar Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
            Painel de Controle
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visão consolidada em tempo real da plataforma regional Ivaí Conecta.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-primary-blue hover:text-primary-blue dark:hover:text-blue-400 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Falha ao sincronizar com o Cloud Firestore</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* ── STATS CARDS: USUÁRIOS ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Comunidade &amp; Usuários
          </h2>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-primary-blue dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Gerenciar Usuários <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Geral</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.totalUsers : 0}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <UserCheck size={12} /> {stats ? stats.activeUsersCount : 0} ativos
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                  <UserX size={12} /> {stats ? stats.blockedUsersCount : 0} bloqueados
                </span>
              </div>
            </div>
          </div>

          {/* Students */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estudantes</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <GraduationCap size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.studentsCount : 0}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                IFPR, UENP, Univale e região
              </p>
            </div>
          </div>

          {/* Companies */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Empresas</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Building2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.companiesCount : 0}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Recrutadores cadastrados
              </p>
            </div>
          </div>

          {/* Teachers & Admins */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Docentes &amp; Admins</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Award size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.teachersCount + stats.adminsCount : 0}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{stats ? stats.teachersCount : 0} docentes</span>
                <span>•</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {stats ? stats.adminsCount : 0} admins
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS CARDS: PLATAFORMA (VAGAS & SERVIÇOS) ── */}
      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Oportunidades &amp; Marketplace
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Jobs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total de Vagas</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.totalJobs : 0}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {stats ? stats.activeJobsCount : 0} ativas
                </span>
                <span>•</span>
                <span>{stats ? stats.closedJobsCount : 0} encerradas</span>
              </div>
            </div>
          </div>

          {/* Pending/Moderation Jobs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pendentes / Moderação</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.pendingJobsCount + stats.rejectedJobsCount : 0}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{stats ? stats.pendingJobsCount : 0} pendentes</span>
                <span>•</span>
                <span className="text-red-500 font-semibold">
                  {stats ? stats.rejectedJobsCount : 0} rejeitadas
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Serviços Locais</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Wrench size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.totalServices : 0}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Prestadores e autônomos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECENT ACTIVITIES (REAL DATA FROM FIRESTORE) ── */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Atividades Recentes na Base
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registros mais recentes adicionados às coleções do Firestore.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 size={12} /> Tempo Real
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
          {loading ? (
            <div className="py-8 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Nenhuma atividade recente registrada.</p>
              <p className="text-xs text-slate-400 mt-1">Conforme novos usuários ou vagas forem cadastrados, eles aparecerão aqui.</p>
            </div>
          ) : (
            recentActivities.map(act => (
              <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    act.type === 'user'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue'
                      : act.type === 'job'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600'
                  }`}>
                    {act.type === 'user' ? <Users size={15} /> : act.type === 'job' ? <Briefcase size={15} /> : <Wrench size={15} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {act.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {act.subtitle}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {act.dateStr}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
