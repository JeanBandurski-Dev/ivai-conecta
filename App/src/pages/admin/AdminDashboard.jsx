import { useEffect, useState, useMemo } from 'react';
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
  AlertCircle,
  ShieldCheck,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { fetchPlatformStats, syncPublicCompanyProfiles } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'user' | 'job' | 'service'
  const [syncingCompanies, setSyncingCompanies] = useState(false);

  const synchronizeCompanies = async () => {
    setSyncingCompanies(true);
    try {
      const res = await syncPublicCompanyProfiles();
      if (res.success) {
        await loadData();
      }
    } finally {
      setSyncingCompanies(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await syncPublicCompanyProfiles();
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

  // Filtro em tempo real para o feed de atividades
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return recentActivities;
    return recentActivities.filter(a => a.type === activityFilter);
  }, [recentActivities, activityFilter]);

  // Cálculos percentuais da comunidade
  const communityPercentages = useMemo(() => {
    if (!stats || !stats.totalUsers || stats.totalUsers === 0) {
      return { students: 0, companies: 0, teachers: 0, admins: 0, freelancers: 0, candidates: 0 };
    }
    const t = stats.totalUsers;
    return {
      students: Math.round(((stats.studentsCount || 0) / t) * 100),
      companies: Math.round(((stats.companiesCount || 0) / t) * 100),
      teachers: Math.round(((stats.teachersCount || 0) / t) * 100),
      admins: Math.round(((stats.adminsCount || 0) / t) * 100),
      freelancers: Math.round(((stats.freelancersCount || 0) / t) * 100),
      candidates: Math.round(((stats.candidatesCount || 0) / t) * 100),
    };
  }, [stats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400 border border-red-200 dark:border-red-900/60 mb-2">
            <ShieldCheck size={12} /> Painel Administrativo Regional
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
            Painel de Controle
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visão consolidada e sincronizada em tempo real da base de dados do Ivaí Conecta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={synchronizeCompanies}
            disabled={syncingCompanies}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:border-purple-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncingCompanies ? 'animate-spin' : ''} />
            <span>{syncingCompanies ? 'Sincronizando...' : 'Sincronizar empresas'}</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-primary-blue hover:text-primary-blue dark:hover:text-blue-400 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
          </button>
        </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Users */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:border-primary-blue/30 transition-all">
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
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/30 transition-all">
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
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:border-purple-500/30 transition-all">
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
                Recrutadores parceiros
              </p>
            </div>
          </div>

          {/* Teachers & Admins */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500/30 transition-all">
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
                <span className="font-semibold text-amber-600 dark:text-amber-400">{stats ? stats.teachersCount : 0} docentes</span>
                <span>•</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {stats ? stats.adminsCount : 0} admins
                </span>
              </div>
            </div>
          </div>

          {/* Freelancers & Candidates */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Freelancers &amp; Candidatos</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats ? stats.freelancersCount + stats.candidatesCount : 0}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{stats ? stats.freelancersCount : 0} freelancers</span>
                <span>•</span>
                <span>{stats ? stats.candidatesCount : 0} candidatos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISTRIBUIÇÃO VISUAL DA COMUNIDADE ── */}
      {stats && stats.totalUsers > 0 && (
        <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-primary-blue dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Composição dos Membros da Plataforma
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Total: <strong>{stats.totalUsers}</strong> cadastros
            </span>
          </div>

          {/* Barra de distribuição proporcional */}
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {communityPercentages.students > 0 && (
              <div
                style={{ width: `${communityPercentages.students}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Estudantes: ${communityPercentages.students}%`}
              />
            )}
            {communityPercentages.companies > 0 && (
              <div
                style={{ width: `${communityPercentages.companies}%` }}
                className="bg-purple-500 transition-all duration-500"
                title={`Empresas: ${communityPercentages.companies}%`}
              />
            )}
            {communityPercentages.teachers > 0 && (
              <div
                style={{ width: `${communityPercentages.teachers}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Docentes: ${communityPercentages.teachers}%`}
              />
            )}
            {communityPercentages.admins > 0 && (
              <div
                style={{ width: `${communityPercentages.admins}%` }}
                className="bg-red-500 transition-all duration-500"
                title={`Admins: ${communityPercentages.admins}%`}
              />
            )}
            {communityPercentages.freelancers > 0 && (
              <div
                style={{ width: `${communityPercentages.freelancers}%` }}
                className="bg-teal-500 transition-all duration-500"
                title={`Freelancers: ${communityPercentages.freelancers}%`}
              />
            )}
            {communityPercentages.candidates > 0 && (
              <div
                style={{ width: `${communityPercentages.candidates}%` }}
                className="bg-blue-400 transition-all duration-500"
                title={`Candidatos: ${communityPercentages.candidates}%`}
              />
            )}
          </div>

          {/* Legenda com percentuais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Estudantes: <strong>{communityPercentages.students}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span>Empresas: <strong>{communityPercentages.companies}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Docentes: <strong>{communityPercentages.teachers}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span>Admins: <strong>{communityPercentages.admins}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
              <span>Freelancers: <strong>{communityPercentages.freelancers}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <span>Candidatos: <strong>{communityPercentages.candidates}%</strong></span>
            </div>
          </div>
        </section>
      )}

      {/* ── ATALHOS RÁPIDOS DE ADMINISTRAÇÃO ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          to="/admin/users"
          className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-blue hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-blue transition-colors">
                Gerenciar Usuários
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Alterar papéis e bloqueios
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/jobs"
          className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-blue hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                Gerenciar Vagas
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Aprovar, rejeitar ou encerrar
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/services"
          className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-blue hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Wrench size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                Marketplace
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Serviços e autônomos
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/moderation"
          className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-blue hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Fila de Moderação
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Pendências prioritárias
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass size={17} className="text-primary-blue dark:text-blue-400" /> Atividades Recentes na Base
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registros dinâmicos adicionados às coleções reais do Firestore.
            </p>
          </div>

          {/* Filtro por tipo de atividade */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-gray-100 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActivityFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                activityFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todas ({recentActivities.length})
            </button>
            <button
              onClick={() => setActivityFilter('user')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                activityFilter === 'user'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Usuários
            </button>
            <button
              onClick={() => setActivityFilter('job')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                activityFilter === 'job'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Vagas
            </button>
            <button
              onClick={() => setActivityFilter('service')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                activityFilter === 'service'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Serviços
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
          {loading ? (
            <div className="py-8 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Nenhuma atividade recente registrada para este filtro.</p>
              <p className="text-xs text-slate-400 mt-1">Conforme novos usuários ou vagas forem cadastrados, eles aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            filteredActivities.map(act => (
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
