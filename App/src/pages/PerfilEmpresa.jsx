import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, MapPin, Users, Briefcase, Star, ArrowLeft,
  Edit3, ShieldCheck, CheckCircle2, X, Plus, HeartHandshake,
  BarChart3, TrendingUp, Eye, Target, Award, Sparkles, Camera, MessageSquare
} from 'lucide-react';
import { getJobs, uploadUserProfilePicture, updateAuthUser } from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';
import useAppStore from '../store/useAppStore';

export default function PerfilEmpresa() {
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();

  const [editModal, setEditModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [company, setCompany] = useState({
    name:     currentUser?.name || 'Empresa Cadastrada',
    city:     currentUser?.city || 'Ivaiporã',
    sector:   currentUser?.sector || 'Comércio & Serviços',
    size:     currentUser?.size || '1-10 funcionários',
    cnpj:     currentUser?.cnpj || '',
    rating:   currentUser?.rating || 5.0,
    reviews:  currentUser?.reviewsCount || 0,
    logo:     currentUser?.avatar || '',
    about:    currentUser?.about || 'Informações institucionais da empresa cadastradas no Ivaí Conecta.',
    history:  currentUser?.history || '',
    perks:    currentUser?.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento'],
  });

  const jobs = getJobs('Todas as Cidades').filter(j => 
    (currentUser?.uid && j.createdBy === currentUser.uid) ||
    (currentUser?.email && j.recruiterEmail === currentUser.email) ||
    (j.company && company.name && j.company.toLowerCase().includes(company.name.toLowerCase().split(' ')[0]))
  );

  const isCompanyOwner = currentUser?.role === 'empresa';

  // Analytics mock data
  const viewsPerDay = [
    { day: 'Seg', views: 42 },
    { day: 'Ter', views: 65 },
    { day: 'Qua', views: 88 },
    { day: 'Qui', views: 120 },
    { day: 'Sex', views: 95 },
    { day: 'Sáb', views: 40 },
    { day: 'Dom', views: 35 },
  ];

  const maxViews = Math.max(...viewsPerDay.map(v => v.views));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    showToast('⏳ Enviando logotipo para o Firebase Storage...');
    const res = await uploadUserProfilePicture(file, currentUser?.uid || currentUser?.id || 'empresa_1');
    setUploadingLogo(false);
    if (res.success) {
      setCompany(c => ({ ...c, logo: res.url }));
      if (currentUser) {
        setCurrentUser({ ...currentUser, avatar: res.url });
      }
      showToast('📸 Logotipo atualizado e salvo no Storage com sucesso!');
    } else {
      showToast(`⚠️ ${res.error || 'Erro ao enviar logotipo.'}`);
    }
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    setEditModal(false);
    updateAuthUser({
      name: company.name,
      sector: company.sector,
      about: company.about,
      avatar: company.logo
    });
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: company.name,
        sector: company.sector,
        about: company.about,
        avatar: company.logo
      });
    }
    showToast('Dados da empresa atualizados com sucesso!');
  };

  return (
    <>
      {/* Header */}
      <div className="bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-10 sm:py-12 relative overflow-hidden">
        <div className="container relative z-10">
          
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-6 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-5 sm:gap-6">
              <img
                src={company.logo}
                alt={company.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/30 shadow-brand-lg shrink-0 bg-white"
              />

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">{company.name}</h1>
                  <span className="bg-green-500/20 text-green-300 border border-green-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={13} /> Recrutador Verificado
                  </span>
                </div>

                <div className="text-accent-sky font-bold text-base sm:text-lg mb-1">{company.sector}</div>

                <div className="flex items-center gap-3 text-gray-300 text-xs sm:text-sm flex-wrap">
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{company.city}, PR</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Users size={14} />{company.size}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Star size={14} className="fill-amber-400 text-amber-400" />{company.rating} ({company.reviews} avaliações)</span>
                </div>
              </div>
            </div>

            {isCompanyOwner ? (
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setEditModal(true)} className="btn btn-outline border-white/40 text-white font-bold btn-sm shadow-md">
                  <Edit3 size={15} /> Editar Perfil da Empresa
                </button>
                <Link to="/minhas-vagas" className="btn btn-teal btn-sm font-bold shadow-md">
                  <Building2 size={15} /> Gerenciar Minhas Vagas
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    const companyEmail = company.email || 
                      (company.name.toLowerCase().includes('simas') ? 'turbosimas@gmail.com' : 'empresa@ivaiconecta.com.br');
                    
                    startChatWith({
                      name: company.name,
                      email: companyEmail,
                      role: 'empresa',
                      avatar: company.logo
                    }, `Contato com Empresa: ${company.name}`);
                  }}
                  className="btn bg-white text-primary-dark font-bold btn-sm shadow-md hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={15} /> 💬 Conversar com a Empresa
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <main className="container section space-y-8">

        {/* ── PAINEL DE ANALYTICS GRAFICO PARA EMPRESAS ── */}
        {isCompanyOwner && (
          <div className="card space-y-6 border-blue-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <BarChart3 size={22} className="text-primary-blue dark:text-blue-400" /> Painel de Analytics Empresarial
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Métricas visuais de alcance das vagas, interesse de candidatos e taxa de conversão.</p>
              </div>
              <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={13} /> +24% este mês
              </span>
            </div>

            {/* Grid dos Gráficos */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Gráfico 1: Visualizações nos últimos 7 dias */}
              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5"><Eye size={15} className="text-primary-blue" /> Visualizações por Dia</span>
                  <span className="text-gray-500 dark:text-slate-400 font-semibold">Total: 485</span>
                </div>

                {/* Bars */}
                <div className="flex items-end justify-between gap-2 h-36 pt-4 border-b border-gray-200 dark:border-slate-700 pb-2">
                  {viewsPerDay.map(v => {
                    const heightPercent = Math.round((v.views / maxViews) * 100);
                    return (
                      <div key={v.day} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[10px] font-bold text-primary-blue dark:text-blue-400">
                          {v.views}
                        </span>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-t-lg h-24 flex items-end overflow-hidden p-0.5">
                          <div
                            className="bg-[linear-gradient(180deg,#0052FF_0%,#22C55E_100%)] w-full rounded-t-md transition-all duration-300 shadow-xs"
                            style={{ height: `${Math.max(15, heightPercent)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">{v.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico 2: Distribuição de Match Score */}
              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5"><Target size={15} className="text-teal-600" /> Compatibilidade dos Candidatos</span>
                  <span className="text-gray-500 dark:text-slate-400 font-semibold">10 Inscritos</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 dark:text-slate-300">Match 90%+ (Excelente)</span>
                      <span className="font-bold text-green-600 dark:text-green-400">4 (40%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 dark:text-slate-300">Match 80%-89% (Alto)</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">4 (40%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-primary-blue h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 dark:text-slate-300">Match 70%-79% (Médio)</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">2 (20%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico 3: Funil de Seleção */}
              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5"><Award size={15} className="text-amber-500" /> Funil do Processo Seletivo</span>
                  <span className="text-gray-500 dark:text-slate-400 font-semibold">Taxa: 10%</span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="bg-primary-blue text-white p-2.5 rounded-xl text-xs flex justify-between font-semibold shadow-xs">
                    <span>1. Candidaturas Enviadas</span>
                    <span>10 candidatos</span>
                  </div>
                  <div className="bg-blue-600 text-white p-2.5 rounded-xl text-xs flex justify-between font-semibold shadow-xs w-[85%] mx-auto">
                    <span>2. Triados pela Empresa</span>
                    <span>7 candidatos</span>
                  </div>
                  <div className="bg-blue-700 text-white p-2.5 rounded-xl text-xs flex justify-between font-semibold shadow-xs w-[70%] mx-auto">
                    <span>3. Entrevistas Agendadas</span>
                    <span>4 candidatos</span>
                  </div>
                  <div className="bg-green-600 text-white p-2.5 rounded-xl text-xs flex justify-between font-semibold shadow-xs w-[55%] mx-auto">
                    <span>4. Propostas Concluídas</span>
                    <span>1 contratado</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column: Story, Employee Count, Perks */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-heading font-bold text-primary-dark dark:text-white mb-3 flex items-center gap-2">
                <Building2 size={18} className="text-primary-blue dark:text-blue-400" /> Sobre a Instituição
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{company.about}</p>
            </div>

            <div className="card">
              <h3 className="font-heading font-bold text-primary-dark dark:text-white mb-3 flex items-center gap-2">
                <HeartHandshake size={18} className="text-primary-blue dark:text-blue-400" /> Nossa História &amp; Propósito
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{company.history}</p>
            </div>

            <div className="card">
              <h3 className="font-heading font-bold text-primary-dark dark:text-white mb-3">Benefícios para Funcionários</h3>
              <ul className="space-y-2">
                {company.perks.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Open Job Listings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white">
                  Oportunidades em Aberto ({jobs.length})
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Vagas abertas ativas publicadas por {company.name}.</p>
              </div>

              {isCompanyOwner && (
                <Link to="/vagas?action=new" className="btn btn-teal btn-sm font-bold shadow-md">
                  <Plus size={16} /> Publicar Nova Vaga
                </Link>
              )}
            </div>

            {jobs.length === 0 ? (
              <div className="card text-center py-12 text-gray-400 dark:text-slate-500">
                <Briefcase size={40} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-gray-600 dark:text-slate-300">Nenhuma vaga em aberto no momento.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {jobs.map(j => <JobCard key={j.id} job={j} />)}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Modal: Editar Perfil da Empresa */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">Editar Dados da Empresa</h3>
              <button onClick={() => setEditModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              {/* Logotipo da Empresa */}
              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue shadow-sm bg-white"
                  />
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-[10px] font-bold">
                      ...
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-xs text-gray-900 dark:text-white">Logotipo da Empresa</div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">Envie a imagem oficial da empresa (JPG/PNG).</p>
                  <label className="btn btn-outline btn-sm text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 mt-1">
                    <Camera size={13} /> {uploadingLogo ? 'Enviando...' : 'Alterar Logotipo'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Razão Social / Nome Fantasia</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={e => setCompany(c => ({ ...c, name: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Setor de Atuação</label>
                <input
                  type="text"
                  value={company.sector}
                  onChange={e => setCompany(c => ({ ...c, sector: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sobre a Instituição</label>
                <textarea
                  value={company.about}
                  onChange={e => setCompany(c => ({ ...c, about: e.target.value }))}
                  className="form-control"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-outline btn-sm font-semibold">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
