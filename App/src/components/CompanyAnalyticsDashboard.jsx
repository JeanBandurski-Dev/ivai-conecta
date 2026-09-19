import { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Briefcase, Award,
  CheckCircle2, Clock, MapPin, Building2, Sparkles, GraduationCap,
  Eye, Share2, Filter, Search, ChevronRight, ArrowUpRight,
  FileText, Check, AlertCircle, HelpCircle, Layers,
  Lightbulb, Target, Activity, Calendar, Download, RefreshCw,
  PieChart, ShieldCheck, UserCheck, ArrowRight, X
} from 'lucide-react';
import { getJobCandidates, safeSkillsArray } from '../lib/ivaiConecta';

export default function CompanyAnalyticsDashboard({
  allCompanyJobs = [],
  onSelectJob,
  onNavigateTab,
  onOpenPublishModal,
  currentUser,
  updateCount = 0
}) {
  const [selectedJobIdFilter, setSelectedJobIdFilter] = useState('todos');
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | '30d' | '90d' | 'year'
  const [jobStatusFilter, setJobStatusFilter] = useState('todos'); // 'todos' | 'Ativa' | 'Encerrada'
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [tableSortBy, setTableSortBy] = useState('candidates_desc'); // 'candidates_desc' | 'match_desc' | 'views_desc' | 'title_asc'
  const [copiedReportToast, setCopiedReportToast] = useState(false);

  // 1. Filtragem das vagas da empresa segundo o escopo selecionado
  const filteredJobs = useMemo(() => {
    return allCompanyJobs.filter(job => {
      if (!job) return false;
      const matchesJob = selectedJobIdFilter === 'todos' || String(job.id) === String(selectedJobIdFilter);
      const matchesStatus = jobStatusFilter === 'todos' || (job.status || 'Ativa') === jobStatusFilter;
      return matchesJob && matchesStatus;
    });
  }, [allCompanyJobs, selectedJobIdFilter, jobStatusFilter]);

  // 2. Coleta e consolidação de todos os candidatos do escopo
  const aggregatedData = useMemo(() => {
    const jobsWithCandidates = [];
    let allCandidates = [];
    const now = new Date();

    filteredJobs.forEach(job => {
      const candidates = getJobCandidates(job.id) || [];
      
      // Filtra por período se necessário
      const periodCandidates = candidates.filter(cand => {
        if (periodFilter === 'all') return true;
        
        let candDate = null;
        if (cand.appliedDate) {
          candDate = new Date(cand.appliedDate);
        } else if (cand.appliedAt) {
          const parts = String(cand.appliedAt).split('/');
          if (parts.length === 3) {
            candDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        
        if (!candDate || isNaN(candDate.getTime())) return true; // Fallback se não conseguir parsear data
        
        const diffDays = (now - candDate) / (1000 * 60 * 60 * 24);
        if (periodFilter === '30d') return diffDays <= 30;
        if (periodFilter === '90d') return diffDays <= 90;
        if (periodFilter === 'year') return diffDays <= 365;
        return true;
      });

      const formattedCandList = periodCandidates.map(c => ({
        ...c,
        jobId: job.id,
        jobTitle: job.title,
        jobDepartment: job.department || 'Geral',
        jobCity: job.city || 'Ivaiporã',
        jobType: job.type || 'Tempo Integral'
      }));

      allCandidates.push(...formattedCandList);

      jobsWithCandidates.push({
        ...job,
        candidateList: formattedCandList,
        totalApplicants: formattedCandList.length,
        triagemCount: formattedCandList.filter(c => c.stage === 'triagem' || !c.stage).length,
        analiseCount: formattedCandList.filter(c => c.stage === 'analise').length,
        entrevistaCount: formattedCandList.filter(c => c.stage === 'entrevista' || c.interview).length,
        desafioCount: formattedCandList.filter(c => c.stage === 'desafio' || c.stage === 'desafio_tech').length,
        aprovadoCount: formattedCandList.filter(c => c.stage === 'aprovado').length,
        reprovadoCount: formattedCandList.filter(c => c.stage === 'reprovado' || c.stage === 'banco_talentos' || c.stage === 'banco').length,
        avgMatch: formattedCandList.length > 0
          ? Math.round(formattedCandList.reduce((acc, c) => acc + (Number(c.matchScore) || 0), 0) / formattedCandList.length)
          : 0
      });
    });

    const totalCandidatesCount = allCandidates.length;
    const totalJobsCount = filteredJobs.length;
    const totalActiveJobs = filteredJobs.filter(j => (j.status || 'Ativa') === 'Ativa').length;
    const totalClosedJobs = filteredJobs.filter(j => j.status === 'Encerrada' || j.status === 'Pausada').length;

    // Métricas de Match
    const avgMatchScore = totalCandidatesCount > 0
      ? Math.round(allCandidates.reduce((acc, c) => acc + (Number(c.matchScore) || 0), 0) / totalCandidatesCount)
      : 0;

    const highFitCount = allCandidates.filter(c => (Number(c.matchScore) || 0) >= 80).length;
    const mediumFitCount = allCandidates.filter(c => (Number(c.matchScore) || 0) >= 60 && (Number(c.matchScore) || 0) < 80).length;
    const lowFitCount = allCandidates.filter(c => (Number(c.matchScore) || 0) < 60).length;

    // Métricas do Funil
    const triagemTotal = allCandidates.filter(c => c.stage === 'triagem' || !c.stage).length;
    const analiseTotal = allCandidates.filter(c => c.stage === 'analise' || c.stage === 'fit_cultural' || c.stage === 'inscricao').length;
    const entrevistaTotal = allCandidates.filter(c => c.stage === 'entrevista' || c.stage === 'entrevista_express' || c.stage === 'entrevista_lider' || c.interview).length;
    const desafioTotal = allCandidates.filter(c => c.stage === 'desafio' || c.stage === 'desafio_tech' || c.stage === 'dinamica').length;
    const aprovadoTotal = allCandidates.filter(c => c.stage === 'aprovado' || c.stage === 'proposta').length;
    const bancoTotal = allCandidates.filter(c => c.stage === 'reprovado' || c.stage === 'banco_talentos' || c.stage === 'banco').length;

    // Taxas percentuais
    const interviewRate = totalCandidatesCount > 0 ? Math.round(((entrevistaTotal + desafioTotal + aprovadoTotal) / totalCandidatesCount) * 100) : 0;
    const approvalRate = totalCandidatesCount > 0 ? Math.round((aprovadoTotal / totalCandidatesCount) * 100) : 0;
    const talentPoolRate = totalCandidatesCount > 0 ? Math.round((bancoTotal / totalCandidatesCount) * 100) : 0;

    // Visualizações e Engajamento
    const totalViews = filteredJobs.reduce((acc, j) => acc + (Number(j.views) || 0), 0);
    const totalShares = filteredJobs.reduce((acc, j) => acc + (Number(j.shares) || 0), 0);
    const conversionRate = totalViews > 0 ? ((totalCandidatesCount / totalViews) * 100).toFixed(1) : '0';

    // Agrupamento por Instituição Acadêmica
    const institutionMap = {};
    allCandidates.forEach(c => {
      let inst = (c.institution || 'Não informada').trim();
      if (inst.toLowerCase().includes('ifpr')) inst = 'IFPR Campus Ivaiporã';
      else if (inst.toLowerCase().includes('univale')) inst = 'Univale Ivaiporã';
      else if (inst.toLowerCase().includes('uenp')) inst = 'UENP';
      else if (inst.toLowerCase().includes('uem')) inst = 'UEM';
      else if (inst.toLowerCase().includes('unicesumar')) inst = 'UniCesumar';
      else if (inst.toLowerCase().includes('fatec')) inst = 'Fatec';
      
      if (!institutionMap[inst]) {
        institutionMap[inst] = { name: inst, count: 0, totalScore: 0 };
      }
      institutionMap[inst].count += 1;
      institutionMap[inst].totalScore += (Number(c.matchScore) || 0);
    });

    const institutionsList = Object.values(institutionMap)
      .map(i => ({
        ...i,
        percentage: totalCandidatesCount > 0 ? Math.round((i.count / totalCandidatesCount) * 100) : 0,
        avgScore: i.count > 0 ? Math.round(i.totalScore / i.count) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Agrupamento por Cursos
    const courseMap = {};
    allCandidates.forEach(c => {
      const course = (c.course || 'Geral / Outros').trim();
      if (!courseMap[course]) {
        courseMap[course] = { name: course, count: 0, totalScore: 0 };
      }
      courseMap[course].count += 1;
      courseMap[course].totalScore += (Number(c.matchScore) || 0);
    });

    const coursesList = Object.values(courseMap)
      .map(c => ({
        ...c,
        percentage: totalCandidatesCount > 0 ? Math.round((c.count / totalCandidatesCount) * 100) : 0,
        avgScore: c.count > 0 ? Math.round(c.totalScore / c.count) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Habilidades dos Candidatos vs Demandadas
    const candidateSkillsMap = {};
    allCandidates.forEach(c => {
      const skills = safeSkillsArray(c.skills);
      skills.forEach(s => {
        const clean = s.trim();
        if (clean) {
          candidateSkillsMap[clean] = (candidateSkillsMap[clean] || 0) + 1;
        }
      });
    });

    const topCandidateSkills = Object.entries(candidateSkillsMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalCandidatesCount > 0 ? Math.round((count / totalCandidatesCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Habilidades mais exigidas nas vagas da empresa
    const requiredSkillsMap = {};
    filteredJobs.forEach(j => {
      const skills = safeSkillsArray(j.requiredSkills);
      skills.forEach(s => {
        const clean = s.trim();
        if (clean) {
          requiredSkillsMap[clean] = (requiredSkillsMap[clean] || 0) + 1;
        }
      });
    });

    const topRequiredSkills = Object.entries(requiredSkillsMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filteredJobs.length > 0 ? Math.round((count / filteredJobs.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Cidades dos Candidatos
    const cityMap = {};
    allCandidates.forEach(c => {
      const city = (c.city || 'Ivaiporã').trim();
      cityMap[city] = (cityMap[city] || 0) + 1;
    });

    const topCities = Object.entries(cityMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalCandidatesCount > 0 ? Math.round((count / totalCandidatesCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Geração dinâmica de Insights Estratégicos baseados em dados reais
    const insights = [];
    
    if (totalCandidatesCount > 0) {
      if (triagemTotal > 5) {
        insights.push({
          type: 'warning',
          title: 'Gargalo na Triagem Inicial',
          description: `Você possui ${triagemTotal} candidato(s) aguardando avaliação inicial. Avance para a fase de análise ou agende entrevistas para acelerar o processo.`,
          actionText: 'Ir para o Funil Kanban',
          actionTab: 'pipeline'
        });
      }

      if (institutionsList.length > 0) {
        const topInst = institutionsList[0];
        insights.push({
          type: 'success',
          title: `Principal Polo de Formação: ${topInst.name}`,
          description: `${topInst.percentage}% dos seus inscritos vêm de ${topInst.name} com um índice médio de match de ${topInst.avgScore}%.`,
          actionText: 'Ver Banco de Talentos',
          link: '/banco-de-talentos'
        });
      }

      if (highFitCount > 0) {
        const highFitPct = Math.round((highFitCount / totalCandidatesCount) * 100);
        insights.push({
          type: 'info',
          title: 'Alta Aderência aos Requisitos',
          description: `${highFitCount} talento(s) (${highFitPct}%) possuem mais de 80% de aderência técnica com os requisitos das suas vagas publicadas.`,
          actionText: 'Filtrar Candidatos com Alto Match',
          actionTab: 'pipeline'
        });
      }

      if (totalViews > 0 && Number(conversionRate) < 5 && totalCandidatesCount < 3) {
        insights.push({
          type: 'tip',
          title: 'Oportunidade de Otimização de Atratividade',
          description: `Sua vaga possui boa visualização (${totalViews} views), mas taxa de conversão modesta (${conversionRate}%). Considere revisar benefícios ou simplificar requisitos obrigatórios.`,
          actionText: 'Revisar Detalhes da Vaga',
          actionTab: 'jobs_list'
        });
      }
    } else if (totalJobsCount > 0) {
      insights.push({
        type: 'info',
        title: 'Divulgue suas Vagas para Receber Candidaturas',
        description: 'Suas vagas estão ativas no Ivaí Conecta! Compartilhe o link nas redes sociais e grupos acadêmicos de Ivaiporã e região para atrair os melhores estudantes.',
        actionText: 'Ver Minhas Vagas',
        actionTab: 'jobs_list'
      });
    }

    return {
      jobsWithCandidates,
      allCandidates,
      totalCandidatesCount,
      totalJobsCount,
      totalActiveJobs,
      totalClosedJobs,
      avgMatchScore,
      highFitCount,
      mediumFitCount,
      lowFitCount,
      triagemTotal,
      analiseTotal,
      entrevistaTotal,
      desafioTotal,
      aprovadoTotal,
      bancoTotal,
      interviewRate,
      approvalRate,
      talentPoolRate,
      totalViews,
      totalShares,
      conversionRate,
      institutionsList,
      coursesList,
      topCandidateSkills,
      topRequiredSkills,
      topCities,
      insights
    };
  }, [filteredJobs, periodFilter, updateCount]);

  // Ordenação e busca da Tabela de Desempenho por Vaga
  const leaderboardJobs = useMemo(() => {
    return (aggregatedData.jobsWithCandidates || [])
      .filter(job => {
        if (!searchTableQuery) return true;
        const q = searchTableQuery.toLowerCase();
        return (
          job.title?.toLowerCase().includes(q) ||
          job.department?.toLowerCase().includes(q) ||
          job.city?.toLowerCase().includes(q) ||
          job.type?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (tableSortBy === 'candidates_desc') return b.totalApplicants - a.totalApplicants;
        if (tableSortBy === 'match_desc') return b.avgMatch - a.avgMatch;
        if (tableSortBy === 'views_desc') return (b.views || 0) - (a.views || 0);
        if (tableSortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
        return 0;
      });
  }, [aggregatedData.jobsWithCandidates, searchTableQuery, tableSortBy]);

  const handleCopySummary = () => {
    const text = `📊 RELATÓRIO DE INDICADORES - IVAÍ CONECTA
Empresa: ${currentUser?.company || currentUser?.name || 'Recrutador'}
Vagas Ativas: ${aggregatedData.totalActiveJobs}
Total de Candidaturas: ${aggregatedData.totalCandidatesCount}
Média de Match dos Talentos: ${aggregatedData.avgMatchScore}%
Candidatos em Entrevista: ${aggregatedData.entrevistaTotal}
Candidatos Aprovados: ${aggregatedData.aprovadoTotal}
Visualizações Totais: ${aggregatedData.totalViews}
Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReportToast(true);
      setTimeout(() => setCopiedReportToast(false), 3000);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // ESTADO VAZIO: NENHUMA VAGA CADASTRADA
  // ═════════════════════════════════════════════════════════════════
  if (!allCompanyJobs || allCompanyJobs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-sm my-6">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto mb-5 text-primary-blue shadow-inner">
          <BarChart3 size={36} />
        </div>
        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Painel de Indicadores de Recrutamento
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
          Os indicadores analíticos consolidam em tempo real as candidaturas, taxa de conversão do funil, fit técnico e origem dos talentos regionais.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 text-left mb-8 max-w-xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-primary-blue mb-1">1. Publique Vagas</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Cadastre oportunidades de estágio, trainee ou CLT.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-emerald-600 mb-1">2. Receba Talentos</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Estudantes do IFPR, Univale e região se candidatam.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-purple-600 mb-1">3. Acompanhe Métricas</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Analise conversão, match score e evolução do funil.</p>
          </div>
        </div>

        <button
          onClick={onOpenPublishModal}
          className="btn btn-primary px-6 py-3 rounded-2xl font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          <Sparkles size={16} /> Publicar Minha Primeira Vaga
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── HEADER DA ABA DE INDICADORES COM FILTROS AVANÇADOS ── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-primary-blue border border-blue-200 dark:border-blue-800">
                <Activity size={13} className="animate-pulse" /> Inteligência de Recrutamento & Gestão
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                • Atualizado em tempo real
              </span>
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-2">
              Indicadores & Dashboard de Recrutamento
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl">
              Acompanhe a atratividade das suas oportunidades, conversão de candidatos por etapa, taxa de fit técnico e dados demográficos dos estudantes do Vale do Ivaí.
            </p>
          </div>

          {/* Ações de Exportação e Atualização */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Copiar resumo executivo para a área de transferência"
            >
              {copiedReportToast ? (
                <>
                  <Check size={14} className="text-emerald-500" /> Copiado!
                </>
              ) : (
                <>
                  <Download size={14} /> Exportar Resumo
                </>
              )}
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('pipeline')}
              className="btn btn-primary px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Layers size={14} /> Ir para Funil Kanban
            </button>
          </div>
        </div>

        {/* Barra de Filtros Rápidos de Escopo */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800/80 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <Briefcase size={12} className="text-primary-blue" /> Escopo da Vaga
            </label>
            <select
              value={selectedJobIdFilter}
              onChange={(e) => setSelectedJobIdFilter(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
            >
              <option value="todos">📊 Todas as Vagas da Empresa ({allCompanyJobs.length})</option>
              {allCompanyJobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.city || 'Ivaiporã'}) — {j.status || 'Ativa'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <Calendar size={12} className="text-emerald-500" /> Janela Temporal
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
            >
              <option value="all">Todo o Histórico</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="year">Último ano</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <Filter size={12} className="text-purple-500" /> Status da Vaga
            </label>
            <select
              value={jobStatusFilter}
              onChange={(e) => setJobStatusFilter(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
            >
              <option value="todos">Todos os Status (Ativas + Encerradas)</option>
              <option value="Ativa">Apenas Vagas Ativas</option>
              <option value="Encerrada">Apenas Vagas Encerradas / Pausadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 6 CARDS EXECUTIVOS DE KPI COM VISUAL PREMIUM ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total de Candidatos */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Total Inscritos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-primary-blue flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {aggregatedData.totalCandidatesCount}
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <span className="font-semibold text-primary-blue">
              {aggregatedData.totalJobsCount > 0 ? (aggregatedData.totalCandidatesCount / aggregatedData.totalJobsCount).toFixed(1) : 0}
            </span>
            <span>méd. por vaga</span>
          </div>
        </div>

        {/* Card 2: Média de Fit Score */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Média de Match</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Target size={16} />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-baseline gap-1">
            {aggregatedData.avgMatchScore}
            <span className="text-base font-medium text-emerald-600">%</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles size={11} />
            <span>{aggregatedData.highFitCount} com alto fit (&gt;80%)</span>
          </div>
        </div>

        {/* Card 3: Taxa de Entrevistas */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Em Entrevista</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {aggregatedData.entrevistaTotal}
          </div>
          <div className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            {aggregatedData.interviewRate}% do total do funil
          </div>
        </div>

        {/* Card 4: Aprovados / Contratados */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Aprovados</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {aggregatedData.aprovadoTotal}
          </div>
          <div className="mt-2 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            {aggregatedData.approvalRate}% taxa de conversão
          </div>
        </div>

        {/* Card 5: Visualizações das Vagas */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Visualizações</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Eye size={16} />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {aggregatedData.totalViews}
          </div>
          <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {aggregatedData.conversionRate}% taxa candidatura
          </div>
        </div>

        {/* Card 6: Banco de Talentos / Reserva */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Banco Reserva</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {aggregatedData.bancoTotal}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Qualificados p/ futuro
          </div>
        </div>
      </div>

      {/* ── SEÇÃO 1: FUNIL COMPLETO DE CONVERSÃO & RECOMENDAÇÕES DA PLATAFORMA ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Funil Visual do Processo Seletivo (2 colunas) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-primary-blue" /> Funil de Conversão do Processo Seletivo
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Volume acumulado e taxa de transição dos estudantes entre cada fase do recrutamento
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {aggregatedData.totalCandidatesCount} candidatos totais
            </span>
          </div>

          {aggregatedData.totalCandidatesCount === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-xs">
              <Filter size={32} className="mx-auto mb-2 opacity-40" />
              Nenhum candidato registrado para as opções selecionadas no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Etapa 1: Triagem */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-2 text-gray-800 dark:text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> 1. Triagem & Novos Inscritos
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-slate-400 font-normal">
                      {aggregatedData.triagemTotal} candidatos nesta etapa
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">100%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-sky-600 h-full rounded-full transition-all duration-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Etapa 2: Em Análise */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-2 text-gray-800 dark:text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 2. Em Análise Curricular
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-slate-400 font-normal">
                      {aggregatedData.analiseTotal} candidatos nesta etapa
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {aggregatedData.totalCandidatesCount > 0
                        ? Math.round(((aggregatedData.analiseTotal + aggregatedData.entrevistaTotal + aggregatedData.desafioTotal + aggregatedData.aprovadoTotal) / aggregatedData.totalCandidatesCount) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${aggregatedData.totalCandidatesCount > 0
                        ? Math.round(((aggregatedData.analiseTotal + aggregatedData.entrevistaTotal + aggregatedData.desafioTotal + aggregatedData.aprovadoTotal) / aggregatedData.totalCandidatesCount) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Etapa 3: Entrevistas */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-2 text-gray-800 dark:text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> 3. Entrevistas Realizadas / Agendadas
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-slate-400 font-normal">
                      {aggregatedData.entrevistaTotal} candidatos nesta etapa
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      {aggregatedData.interviewRate}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${aggregatedData.interviewRate}%` }}
                  />
                </div>
              </div>

              {/* Etapa 4: Teste Prático / Desafio */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-2 text-gray-800 dark:text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> 4. Desafio Técnico & Avaliação
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-slate-400 font-normal">
                      {aggregatedData.desafioTotal} candidatos nesta etapa
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {aggregatedData.totalCandidatesCount > 0
                        ? Math.round(((aggregatedData.desafioTotal + aggregatedData.aprovadoTotal) / aggregatedData.totalCandidatesCount) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${aggregatedData.totalCandidatesCount > 0
                        ? Math.round(((aggregatedData.desafioTotal + aggregatedData.aprovadoTotal) / aggregatedData.totalCandidatesCount) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Etapa 5: Aprovados / Contratados */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-2 text-gray-800 dark:text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 5. Aprovados / Oferta Aceita
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-slate-400 font-normal">
                      {aggregatedData.aprovadoTotal} contratações
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {aggregatedData.approvalRate}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${aggregatedData.approvalRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Insights Automáticos e Ações Sugeridas (1 coluna) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <Lightbulb size={20} className="text-amber-500" /> Insights & Ações Recomendadas
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">
              Diagnósticos inteligentes em tempo real calculados sobre a movimentação dos candidatos.
            </p>

            <div className="space-y-3.5">
              {aggregatedData.insights.length > 0 ? (
                aggregatedData.insights.map((ins, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs ${
                      ins.type === 'warning'
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                        : ins.type === 'success'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                        : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <div className="font-semibold mb-1 flex items-center justify-between">
                      <span>{ins.title}</span>
                      {ins.type === 'warning' && <AlertCircle size={14} className="text-amber-600 shrink-0" />}
                      {ins.type === 'success' && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                      {ins.type === 'info' && <Sparkles size={14} className="text-blue-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90 mb-2.5">
                      {ins.description}
                    </p>
                    {ins.actionText && (
                      <button
                        onClick={() => {
                          if (ins.actionTab) onNavigateTab && onNavigateTab(ins.actionTab);
                        }}
                        className="font-semibold underline text-[11px] hover:opacity-80 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {ins.actionText} &rarr;
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs text-center">
                  Publique novas vagas e avalie candidatos para receber recomendações estratégicas.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>Algoritmo de Matching Regional</span>
            <span className="font-semibold text-primary-blue">v2.4 Ativo</span>
          </div>
        </div>
      </div>

      {/* ── SEÇÃO 2: ORIGEM ACADÊMICA & MAPA DE HABILIDADES TÉCNICAS ── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Origem dos Talentos por Instituição */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={18} className="text-emerald-500" /> Origem dos Talentos (Instituição)
            </h3>
            <span className="text-[11px] font-semibold text-gray-400">Polo Regional</span>
          </div>

          {aggregatedData.institutionsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
              Nenhuma instituição registrada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {aggregatedData.institutionsList.slice(0, 5).map((inst, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-800 dark:text-slate-200 truncate pr-2">
                      {inst.name}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {inst.count} inscritos ({inst.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${inst.percentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-500 text-right">
                    Média de match: <strong className="text-gray-600 dark:text-slate-300">{inst.avgScore}%</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cursos mais Frequentes */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-primary-blue" /> Cursos mais Frequentes
            </h3>
            <span className="text-[11px] font-semibold text-gray-400">Áreas de Estudo</span>
          </div>

          {aggregatedData.coursesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
              Nenhum curso registrado ainda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {aggregatedData.coursesList.slice(0, 5).map((crs, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700/60"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {crs.name}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-400">
                      Match médio: {crs.avgScore}%
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300 shrink-0">
                    {crs.count} alunos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habilidades & Tecnologias em Destaque */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Habilidades nos Candidatos
            </h3>
            <span className="text-[11px] font-semibold text-gray-400">Stack & Soft Skills</span>
          </div>

          {aggregatedData.topCandidateSkills.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
              Nenhuma competência extraída dos currículos ainda.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {aggregatedData.topCandidateSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200/60 dark:border-slate-700/60 flex items-center gap-1.5 shadow-sm"
                >
                  <span>{sk.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-blue/10 text-primary-blue dark:text-blue-300">
                    {sk.count}
                  </span>
                </span>
              ))}
            </div>
          )}

          {aggregatedData.topCities.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-2 flex items-center gap-1">
                <MapPin size={12} /> Concentração Geográfica:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {aggregatedData.topCities.slice(0, 4).map((city, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-700"
                  >
                    {city.name}: <strong>{city.count}</strong> ({city.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SEÇÃO 3: TABELA DE DESEMPENHO E EFICIÊNCIA POR VAGA ── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase size={20} className="text-primary-blue" /> Desempenho e Indicadores por Vaga
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Comparativo detalhado de visualizações, total de inscritos, média de fit e status de cada processo
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                placeholder="Buscar vaga por título..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 w-48 sm:w-60"
              />
            </div>

            <select
              value={tableSortBy}
              onChange={(e) => setTableSortBy(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 cursor-pointer"
            >
              <option value="candidates_desc">Mais Candidatos</option>
              <option value="match_desc">Maior Match Médio</option>
              <option value="views_desc">Mais Visualizações</option>
              <option value="title_asc">Ordem Alfabética</option>
            </select>
          </div>
        </div>

        {leaderboardJobs.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 dark:text-slate-500">
            Nenhuma vaga encontrada com os filtros informados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                  <th className="py-3 px-4">Oportunidade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Inscritos</th>
                  <th className="py-3 px-4 text-center">Fit Médio</th>
                  <th className="py-3 px-4 text-center">Em Entrevista</th>
                  <th className="py-3 px-4 text-center">Aprovados</th>
                  <th className="py-3 px-4 text-center">Views</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {leaderboardJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {job.title}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{job.department || 'Geral'}</span>
                        <span>•</span>
                        <span>{job.city || 'Ivaiporã'}</span>
                        <span>•</span>
                        <span>{job.type || 'Tempo Integral'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          (job.status || 'Ativa') === 'Ativa'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {(job.status || 'Ativa') === 'Ativa' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ativa
                          </>
                        ) : (
                          'Encerrada'
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {job.totalApplicants}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded-lg text-xs ${
                          job.avgMatch >= 80
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : job.avgMatch >= 60
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {job.avgMatch}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {job.entrevistaCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {job.aprovadoCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-gray-500 dark:text-slate-400">
                      {job.views || 0}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          if (onSelectJob) onSelectJob(job.id);
                          if (onNavigateTab) onNavigateTab('pipeline');
                        }}
                        className="btn btn-secondary btn-sm text-xs py-1 px-2.5 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                        title="Abrir no Kanban"
                      >
                        <span>Gerenciar</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
