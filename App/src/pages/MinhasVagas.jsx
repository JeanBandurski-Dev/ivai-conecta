import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Building2, MapPin, CheckCircle, Clock, ArrowRight,
  ArrowLeft, Plus, Users, Eye, Edit3, XCircle, RotateCcw, Phone, ShieldCheck, CheckCircle2,
  Award, Send, UserCheck, Check, X, FileText, Trash2, MessageSquare
} from 'lucide-react';
import {
  getUserApplications, generateWhatsAppLink, getJobs,
  updateJobStatus, deleteJob, getTalents, getEndorsementRequests,
  approveEndorsementRequest, rejectEndorsementRequest, sanitizeWhatsAppPhone, safeSkillsArray
} from '../lib/ivaiConecta';
import { subscribeToJobs, subscribeToApplications, subscribeToJobApplicants } from '../services/jobsService.js';
import useAppStore from '../store/useAppStore';

export default function MinhasVagas() {
  const { currentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  const isCompany   = currentUser?.role === 'empresa';
  const isProfessor = currentUser?.role === 'professor';

  const [liveJobs, setLiveJobs] = useState(() => getJobs('Todas as Cidades'));
  const [liveApps, setLiveApps] = useState(() => getUserApplications(currentUser?.uid));

  useEffect(() => {
    const unsubJobs = subscribeToJobs('Todas as Cidades', (data) => setLiveJobs(data));
    const unsubApps = subscribeToApplications(currentUser?.uid, (data) => setLiveApps(data));
    return () => {
      unsubJobs();
      unsubApps();
    };
  }, [currentUser]);

  const apps = liveApps;
  const companyJobs = liveJobs.filter(j => 
    (j.createdBy && currentUser?.uid && String(j.createdBy) === String(currentUser.uid)) ||
    (j.createdBy && currentUser?.id && String(j.createdBy) === String(currentUser.id)) ||
    (j.createdBy && currentUser?.email && String(j.createdBy).toLowerCase() === String(currentUser.email).toLowerCase()) ||
    (currentUser?.email && j.recruiterEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.name && j.company && j.company.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
    (currentUser?.razaoSocial && j.company && j.company.toLowerCase().trim() === currentUser.razaoSocial.toLowerCase().trim()) ||
    (currentUser?.nomeFantasia && j.company && j.company.toLowerCase().trim() === currentUser.nomeFantasia.toLowerCase().trim())
  );
  
  // Teacher endorsement requests state
  const requests = getEndorsementRequests();
  const teacherRequests = requests.filter(r => (r.profEmail && currentUser?.email && r.profEmail.toLowerCase() === currentUser.email.toLowerCase()) || currentUser?.role === 'professor');
  const [customQuote, setCustomQuote] = useState({});

  // Selected job to view applicants (for company view)
  const [selectedJobApplicants, setSelectedJobApplicants] = useState(null);
  const [jobApplicants, setJobApplicants] = useState([]);

  useEffect(() => {
    if (!selectedJobApplicants) {
      setJobApplicants([]);
      return;
    }
    const targetId = selectedJobApplicants.firestoreId || selectedJobApplicants.id;
    const unsub = subscribeToJobApplicants(targetId, (data) => {
      setJobApplicants(data);
    });
    return () => unsub();
  }, [selectedJobApplicants]);

  if (!currentUser) {
    return (
      <main className="container section text-center py-24">
        <Briefcase size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 dark:text-white mb-2">Acesso restrito</h2>
        <p className="text-gray-500 dark:text-slate-300 mb-6">Você precisa estar logado para acessar seu painel.</p>
        <Link to="/login" className="btn btn-primary px-6 py-2.5 font-bold">Entrar / Cadastrar</Link>
      </main>
    );
  }

  const handleJobAction = (jobId, action) => {
    const updated = updateJobStatus(jobId, action);
    if (updated) setLiveJobs(updated);
    showToast(action === 'close' ? '🔒 Vaga encerrada com sucesso.' : '🔓 Vaga reaberta com sucesso!');
    forceUpdate(n => n + 1);
  };

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Tem certeza que deseja remover esta vaga permanentemente?')) {
      const updated = deleteJob(jobId);
      if (updated) setLiveJobs(updated);
      showToast('🗑️ Vaga excluída permanentemente.');
      forceUpdate(n => n + 1);
    }
  };

  const handleApproveTeacherRequest = (reqId) => {
    const quoteText = customQuote[reqId] || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio lógico em disciplinas práticas.';
    const res = approveEndorsementRequest(reqId, quoteText);
    if (res.success) {
      showToast('🎉 Parecer pedagógico concedido e selo verificado atribuído ao perfil do aluno!');
      forceUpdate(n => n + 1);
    } else {
      showToast(res.error);
    }
  };

  const handleRejectTeacherRequest = (reqId) => {
    rejectEndorsementRequest(reqId);
    showToast('Solicitação recusada.');
    forceUpdate(n => n + 1);
  };

  return (
    <>
      {/* ── HEADER ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-4 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mb-3 tracking-tight">
                {isProfessor
                  ? 'Painel do Docente &amp; Recomendações'
                  : isCompany
                  ? 'Minhas Vagas Criadas &amp; Candidatos'
                  : 'Minhas Candidaturas'}
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {isProfessor
                  ? 'Gerencie pedidos de parecer pedagógico dos seus alunos do IFPR, Univale e UENP e atribua selos verificados.'
                  : isCompany
                  ? 'Gerencie os processos seletivos da sua empresa, acompanhe os estudantes inscritos e altere os status das vagas.'
                  : 'Acompanhe o status e a evolução de todas as suas candidaturas no Vale do Ivaí.'}
              </p>
            </div>

            {isCompany && (
              <Link to="/vagas?action=new" className="btn btn-teal px-6 py-3 font-bold shadow-md shrink-0">
                <Plus size={18} /> Publicar Nova Vaga
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container section">

        {/* ── VISÃO DO PROFESSOR / DOCENTE ── */}
        {isProfessor ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Award className="text-amber-400 fill-amber-400" size={24} /> Solicitações de Recomendação Pendentes ({teacherRequests.filter(r => r.status === 'Pendente').length})
              </h2>
            </div>

            {teacherRequests.filter(r => r.status === 'Pendente').length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
                <Award size={48} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma solicitação pendente no momento.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400">Quando seus alunos enviarem pedidos de parecer, eles aparecerão aqui para você avaliar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teacherRequests.filter(r => r.status === 'Pendente').map(req => (
                  <div key={req.id} className="card p-6 space-y-4 border-l-4 border-l-amber-400">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                          {req.studentName}
                          <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                            Solicitação em {req.requestedAt}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-primary-blue dark:text-blue-400 mt-0.5">{req.studentCourse}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Disciplina: <strong>{req.discipline}</strong></div>
                      </div>

                      <button
                        onClick={() => navigate(`/perfil/${req.studentId}`)}
                        className="btn btn-outline btn-sm text-xs font-bold"
                      >
                        <Eye size={13} /> Ver Perfil do Aluno
                      </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-sm text-gray-700 dark:text-slate-300 italic border border-gray-200 dark:border-slate-700">
                      "{req.message}"
                    </div>

                    {/* Form de Parecer Personalizado */}
                    <div className="space-y-2">
                      <label className="form-label text-xs">Escreva seu Parecer / Avaliação Pedagógica:</label>
                      <textarea
                        value={customQuote[req.id] || ''}
                        onChange={e => setCustomQuote({ ...customQuote, [req.id]: e.target.value })}
                        className="form-control text-xs"
                        rows={2}
                        placeholder="Ex: Estudante com excelente raciocínio prático, boa assiduidade e ótimo trabalho em equipe."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleRejectTeacherRequest(req.id)}
                        className="btn btn-outline border-red-200 text-red-600 dark:text-red-400 hover:bg-red-50 btn-sm text-xs font-bold"
                      >
                        <X size={14} /> Recusar
                      </button>
                      <button
                        onClick={() => handleApproveTeacherRequest(req.id)}
                        className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md"
                      >
                        <ShieldCheck size={15} /> Aprovar &amp; Conceder Selo Verificado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recomendações Já Concedidas pelo Professor */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-4">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} /> Histórico de Pareceres Emitidos
              </h3>

              {teacherRequests.filter(r => r.status === 'Aprovado').length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma recomendação finalizada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {teacherRequests.filter(r => r.status === 'Aprovado').map(req => (
                    <div key={req.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-bold text-gray-800 dark:text-white text-sm">{req.studentName}</div>
                        <div className="text-xs text-primary-blue dark:text-blue-400 font-medium">{req.discipline} · Parecer Verificado</div>
                      </div>
                      <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full">
                        ✓ Aprovado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : isCompany ? (
          /* ── VISÃO DA EMPRESA: GERENCIAMENTO DE VAGAS ── */
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white">
                Vagas Ativas &amp; Encerradas ({companyJobs.length})
              </h2>
            </div>

            {companyJobs.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
                <Briefcase size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-lg text-gray-700 dark:text-white mb-1">Nenhuma vaga criada ainda.</p>
                <p className="text-sm text-gray-400 dark:text-slate-400 mb-5">Publique uma vaga para começar a receber candidaturas de alunos e talentos locais.</p>
                <Link to="/vagas?action=new" className="btn btn-primary btn-sm">Publicar Primeira Vaga</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {companyJobs.map(job => (
                  <div key={job.id} className="card p-6 space-y-4">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            job.status === 'Encerrada'
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                              : 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${job.status === 'Encerrada' ? 'bg-red-500' : 'bg-green-500'}`} />
                            {job.status === 'Encerrada' ? 'Vaga Encerrada' : 'Vaga Ativa'}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-400">
                            Criada em: {job.createdAt ? (typeof job.createdAt === 'string' && job.createdAt.includes('/') ? job.createdAt : new Date(job.createdAt).toLocaleDateString('pt-BR')) : 'Recentemente'}
                          </span>
                        </div>
                        <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">{job.title}</h3>
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span><MapPin size={13} className="inline mr-1 text-gray-400" />{job.city}</span>
                          <span>·</span>
                          <span>{job.type}</span>
                          <span>·</span>
                          <span className="font-semibold text-primary-blue dark:text-blue-400">
                            <Users size={14} className="inline mr-1" />
                            {job.applicantsCount || 0} {(job.applicantsCount || 0) === 1 ? 'Candidato Inscrito' : 'Candidatos Inscritos'}
                          </span>
                        </div>
                      </div>

                      {/* Ações da Vaga */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedJobApplicants(job)}
                          className="btn btn-primary btn-sm font-bold text-xs flex items-center gap-1.5"
                        >
                          <Users size={14} /> Ver Candidatos ({job.applicantsCount || 0})
                        </button>

                        {job.status === 'Encerrada' ? (
                          <button
                            onClick={() => handleJobAction(job.id, 'reopen')}
                            className="btn btn-outline border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 btn-sm text-xs font-bold flex items-center gap-1.5"
                          >
                            <RotateCcw size={14} /> Reabrir Vaga
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJobAction(job.id, 'close')}
                            className="btn btn-outline border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 btn-sm text-xs font-semibold flex items-center gap-1.5"
                          >
                            <XCircle size={14} /> Encerrar Vaga
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/40 transition-colors cursor-pointer"
                          title="Excluir Vaga Permanentemente"
                          aria-label="Excluir vaga"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Vales e Requisitos */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
                      <span className="font-semibold text-gray-500 dark:text-slate-400">Habilidades Exigidas:</span>
                      {safeSkillsArray(job.requiredSkills).map(s => (
                        <span key={s} className="tag tag-blue text-[11px]">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── VISÃO DO ALUNO / CANDIDATO: MINHAS CANDIDATURAS ── */
          <>
            {apps.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
                <Briefcase size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-lg text-gray-600 dark:text-slate-200">Você ainda não se candidatou a nenhuma vaga.</p>
                <Link to="/vagas" className="btn btn-primary btn-sm mt-5">Explorar Vagas Disponíveis</Link>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {apps.map(app => {
                  return (
                    <div key={app.id} className="card gap-4 p-5 sm:p-6">
                      {/* Top */}
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <h3 className="font-heading text-lg sm:text-xl font-bold text-primary-dark dark:text-white">{app.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mt-1">
                            <Building2 size={15} />{app.company}
                            <span>·</span>
                            <MapPin size={15} />{app.city}
                            <span>·</span>
                            <span className="font-medium text-gray-600 dark:text-slate-300">{app.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            (Number(app.matchScore) || 0) >= 85
                              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          }`}>
                            {app.matchScore || 0}% Match
                          </span>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            String(app.status || '').includes('Entrevista')
                              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                          }`}>
                            {app.status || 'Candidatura Enviada'}
                          </span>
                        </div>
                      </div>

                      {/* Progress stages (Linha do Tempo Gupy) */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                        {(Array.isArray(app.stages) ? app.stages : []).map((stage, i, arr) => (
                          <div key={i} className="flex items-center gap-2 shrink-0">
                            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                              stage?.completed
                                ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                                : stage?.active
                                ? 'bg-primary-blue text-white shadow-xs font-bold'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                            }`}>
                              {stage?.completed ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {stage?.name || 'Etapa'}
                            </div>
                            {i < arr.length - 1 && (
                              <ArrowRight size={13} className="text-gray-300 dark:text-slate-700 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Next step note */}
                      {app.nextStepNote && (
                        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl px-4 py-3 text-sm text-primary-blue dark:text-blue-300 font-medium">
                          📌 <strong>Recrutador:</strong> {app.nextStepNote}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800 flex-wrap gap-2">
                        <span className="text-xs text-gray-400 dark:text-slate-400">Candidatado em {app.appliedAt}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const targetEmail = app.recruiterEmail || (app.company ? `${app.company.toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br` : 'empresa@ivaiconecta.com.br');

                              startChatWith({
                                name: app.company,
                                email: targetEmail,
                                role: 'empresa',
                                avatar: app.companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'
                              }, `Candidatura: ${app.title}`);
                            }}
                            className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <MessageSquare size={13} /> Conversar no Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* Modal: Candidatos Inscritos na Vaga (Visão da Empresa) */}
      {selectedJobApplicants && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedJobApplicants(null)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-2xl p-7 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">
                  Candidatos Inscritos: {selectedJobApplicants.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Candidatos reais que se inscreveram nesta vaga no Vale do Ivaí.</p>
              </div>
              <button onClick={() => setSelectedJobApplicants(null)}><XCircle size={22} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
            </div>

            {jobApplicants.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <Users size={36} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-gray-700 dark:text-white text-sm">Nenhum candidato se inscreveu nesta vaga ainda.</p>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Assim que um estudante ou profissional clicar em "Candidatar-se", ele aparecerá aqui instantaneamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobApplicants.map(cand => (
                  <div key={cand.id || cand.firestoreId} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                        {cand.candidateName || cand.name || 'Candidato'}
                        <span className="text-xs font-extrabold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 rounded-full">
                          {cand.matchScore || 90}% Match
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                        {cand.candidateCourse || 'Estudante / Profissional'} · Inscrito em {cand.appliedAt || 'Hoje'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          startChatWith({
                            name: cand.candidateName || cand.name || 'Candidato',
                            email: cand.candidateEmail || cand.email,
                            role: 'aluno',
                            avatar: cand.candidateAvatar || cand.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                          }, `Processo Seletivo: ${selectedJobApplicants.title}`);
                          setSelectedJobApplicants(null);
                        }}
                        className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare size={13} /> Chat com o Candidato
                      </button>
                      <button
                        onClick={() => navigate(`/perfil/${cand.candidateUid || cand.candidateId || cand.id}`)}
                        className="btn btn-outline btn-sm text-xs font-bold"
                      >
                        <Eye size={13} /> Ver Currículo
                      </button>
                      {(cand.candidatePhone || cand.phone) && (
                        <a
                          href={`https://wa.me/${sanitizeWhatsAppPhone(cand.candidatePhone || cand.phone)}?text=${encodeURIComponent(`Olá ${cand.candidateName || cand.name}! Vimos sua candidatura para a vaga no Ivaí Conecta.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp btn-sm text-xs font-bold"
                        >
                          <Phone size={13} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
