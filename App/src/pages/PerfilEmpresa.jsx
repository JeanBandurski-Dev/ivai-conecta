import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2, MapPin, Users, Briefcase, Star, ArrowLeft,
  Edit3, ShieldCheck, CheckCircle2, X, Plus, HeartHandshake,
  BarChart3, TrendingUp, Eye, Target, Award, Sparkles, Camera, MessageSquare
} from 'lucide-react';
import { getJobs, getCompanies, uploadUserProfilePicture, updateAuthUser } from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';
import useAppStore from '../store/useAppStore';

export default function PerfilEmpresa() {
  const { id } = useParams();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();

  const [editModal, setEditModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const isCompanyOwner = Boolean(
    currentUser && currentUser.role === 'empresa' && (
      !id ||
      String(id) === String(currentUser.uid) ||
      String(id) === String(currentUser.id) ||
      (currentUser.name && String(id).toLowerCase() === encodeURIComponent(currentUser.name.toLowerCase())) ||
      (currentUser.razaoSocial && String(id).toLowerCase() === encodeURIComponent(currentUser.razaoSocial.toLowerCase())) ||
      (currentUser.nomeFantasia && String(id).toLowerCase() === encodeURIComponent(currentUser.nomeFantasia.toLowerCase()))
    )
  );

  const [company, setCompany] = useState({
    name:     currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Empresa Cadastrada',
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

  useEffect(() => {
    if (isCompanyOwner && currentUser) {
      setCompany({
        name:     currentUser.razaoSocial || currentUser.nomeFantasia || currentUser.name || 'Empresa Cadastrada',
        city:     currentUser.city || 'Ivaiporã',
        sector:   currentUser.sector || 'Comércio & Serviços',
        size:     currentUser.size || '1-10 funcionários',
        cnpj:     currentUser.cnpj || '',
        rating:   currentUser.rating || 5.0,
        reviews:  currentUser.reviewsCount || 0,
        logo:     currentUser.avatar || '',
        about:    currentUser.about || 'Informações institucionais da empresa cadastradas no Ivaí Conecta.',
        history:  currentUser.history || '',
        perks:    currentUser.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento'],
      });
    } else if (id) {
      const allCompanies = getCompanies('Todas as Cidades');
      const decodedId = decodeURIComponent(id).toLowerCase().trim();
      const matchCompany = allCompanies.find(c =>
        (c.id && String(c.id).toLowerCase() === decodedId) ||
        (c.uid && String(c.uid).toLowerCase() === decodedId) ||
        (c.name && c.name.toLowerCase().trim() === decodedId)
      );

      if (matchCompany) {
        setCompany(prev => ({
          ...prev,
          name: matchCompany.name || prev.name,
          city: matchCompany.city || prev.city,
          sector: matchCompany.sector || prev.sector,
          size: matchCompany.size || prev.size || '10-50 colaboradores',
          cnpj: matchCompany.cnpj || prev.cnpj,
          rating: matchCompany.rating || prev.rating,
          reviews: matchCompany.reviews || prev.reviews,
          logo: matchCompany.logo || prev.logo,
          about: matchCompany.about || prev.about,
          history: matchCompany.history || prev.history || `Empresa atuante no ecossistema do Vale do Ivaí com sede em ${matchCompany.city || 'Ivaiporã'}, promovendo empregabilidade e inovação regional.`,
          perks: matchCompany.perks && matchCompany.perks.length > 0 ? matchCompany.perks : prev.perks,
        }));
      } else {
        const allJobs = getJobs('Todas as Cidades');
        const matchJob = allJobs.find(j =>
          (j.createdBy && String(j.createdBy) === String(id)) ||
          (j.company && j.company.toLowerCase() === decodedId)
        );
        if (matchJob) {
          setCompany(prev => ({
            ...prev,
            name: matchJob.company || prev.name,
            city: matchJob.city || prev.city,
            logo: matchJob.companyLogo || prev.logo,
          }));
        }
      }
    }
  }, [currentUser, isCompanyOwner, id]);

  const allJobs = getJobs('Todas as Cidades');
  const jobs = allJobs.filter(j => {
    if (!j) return false;
    if (isCompanyOwner) {
      return (
        (currentUser?.uid && j.createdBy === currentUser.uid) ||
        (currentUser?.id && j.createdBy === currentUser.id) ||
        (currentUser?.email && j.recruiterEmail === currentUser.email) ||
        (company.name && j.company && j.company.toLowerCase().trim() === company.name.toLowerCase().trim())
      );
    }
    if (id) {
      const decoded = decodeURIComponent(id).toLowerCase().trim();
      return (
        (j.createdBy && String(j.createdBy).toLowerCase() === decoded) ||
        (company.name && j.company && j.company.toLowerCase().trim() === company.name.toLowerCase().trim()) ||
        (j.company && j.company.toLowerCase().trim() === decoded)
      );
    }
    return false;
  });

  const totalApplicants = jobs.reduce((acc, j) => acc + (j.applicantsCount || 0), 0);
  const activeJobsCount = jobs.filter(j => (j.status || 'Ativa') === 'Ativa').length;
  const closedJobsCount = jobs.filter(j => j.status === 'Encerrada').length;

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
                src={company.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250'}
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
                  <span className="flex items-center gap-1.5"><Briefcase size={14} />{jobs.length} {jobs.length === 1 ? 'vaga publicada' : 'vagas publicadas'}</span>
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
                    if (isCompanyOwner) {
                      showToast('⚠️ Você não pode iniciar uma conversa com sua própria empresa.');
                      return;
                    }
                    const companyEmail = company.email || `${(company.name || 'empresa').toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br`;
                    
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

        {/* ── PAINEL DE ANALYTICS DINÂMICO PARA EMPRESAS ── */}
        {isCompanyOwner && (
          <div className="card space-y-6 border-blue-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <BarChart3 size={22} className="text-primary-blue dark:text-blue-400" /> Painel de Analytics Empresarial
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Métricas consolidadas de alcance e inscrições de talentos para as vagas da sua empresa.</p>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                <Briefcase size={13} /> {activeJobsCount} vagas ativas
              </span>
            </div>

            {/* Grid dos Cards Métricos Reais */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total de Vagas</div>
                <div className="text-3xl font-extrabold text-primary-dark dark:text-white">{jobs.length}</div>
                <div className="text-xs text-primary-blue font-semibold">{activeJobsCount} ativas · {closedJobsCount} encerradas</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Candidaturas Recebidas</div>
                <div className="text-3xl font-extrabold text-primary-blue dark:text-blue-400">{totalApplicants}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Inscrições registradas</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Média de Candidatos / Vaga</div>
                <div className="text-3xl font-extrabold text-teal-600">
                  {jobs.length > 0 ? (totalApplicants / jobs.length).toFixed(1) : '0'}
                </div>
                <div className="text-xs text-teal-700 font-semibold">Engajamento regional</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Selo de Verificação</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck size={20} /> CNPJ Validado
                </div>
                <div className="text-xs text-green-700 font-medium">Empresa certificada</div>
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
