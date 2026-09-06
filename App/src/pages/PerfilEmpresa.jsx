import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2, MapPin, Users, Briefcase, ArrowLeft,
  Edit3, ShieldCheck, CheckCircle2, X, Plus, HeartHandshake,
  BarChart3, Camera, MessageSquare, Share2, Globe, Phone, Image as ImageIcon, Check, Loader2
} from 'lucide-react';
import { getJobs, getCompanies, uploadUserProfilePicture, updateAuthUser } from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';
import useAppStore from '../store/useAppStore';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600';

const BANNER_PRESETS = [
  { id: 'office', name: 'Corporativo Moderno', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600' },
  { id: 'tech', name: 'Hub Tecnológico', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1600' },
  { id: 'team', name: 'Trabalho em Equipe', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1600' },
  { id: 'minimal', name: 'Minimalista Dark', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1600' },
];

export default function PerfilEmpresa() {
  const { id } = useParams();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();

  const [editModal, setEditModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [company, setCompany] = useState({
    name:     currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Empresa Cadastrada',
    city:     currentUser?.city || 'Ivaiporã',
    sector:   currentUser?.sector || 'Comércio & Serviços',
    size:     currentUser?.size || '1-10 funcionários',
    cnpj:     currentUser?.cnpj || '',
    rating:   currentUser?.rating || 5.0,
    reviews:  currentUser?.reviewsCount || 0,
    logo:     currentUser?.avatar || '',
    banner:   currentUser?.banner || DEFAULT_BANNER,
    website:  currentUser?.website || '',
    phone:    currentUser?.phone || currentUser?.whatsapp || '',
    about:    currentUser?.about || 'Informações institucionais da empresa cadastradas no Ivaí Conecta.',
    history:  currentUser?.history || '',
    perks:    currentUser?.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento'],
  });

  const isCompanyOwner = Boolean(
    currentUser && currentUser.role === 'empresa' && (
      !id ||
      String(id) === 'empresa' ||
      String(id) === String(currentUser.uid) ||
      String(id) === String(currentUser.id) ||
      (currentUser.name && String(id).toLowerCase() === encodeURIComponent(currentUser.name.toLowerCase())) ||
      (currentUser.razaoSocial && String(id).toLowerCase() === encodeURIComponent(currentUser.razaoSocial.toLowerCase())) ||
      (currentUser.nomeFantasia && String(id).toLowerCase() === encodeURIComponent(currentUser.nomeFantasia.toLowerCase())) ||
      (currentUser.name && decodeURIComponent(String(id)).toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
      (currentUser.razaoSocial && decodeURIComponent(String(id)).toLowerCase().trim() === currentUser.razaoSocial.toLowerCase().trim()) ||
      (currentUser.nomeFantasia && decodeURIComponent(String(id)).toLowerCase().trim() === currentUser.nomeFantasia.toLowerCase().trim()) ||
      (company?.name && currentUser?.name && company.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
      (company?.name && currentUser?.razaoSocial && company.name.toLowerCase().trim() === currentUser.razaoSocial.toLowerCase().trim()) ||
      (company?.name && currentUser?.nomeFantasia && company.name.toLowerCase().trim() === currentUser.nomeFantasia.toLowerCase().trim()) ||
      (company?.email && currentUser?.email && company.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
      (company?.cnpj && currentUser?.cnpj && company.cnpj.replace(/\D/g, '') === currentUser.cnpj.replace(/\D/g, ''))
    )
  );

  useEffect(() => {
    const isOwnerByAuthOrId = Boolean(
      currentUser && currentUser.role === 'empresa' && (
        !id ||
        String(id) === 'empresa' ||
        String(id) === String(currentUser.uid) ||
        String(id) === String(currentUser.id) ||
        (currentUser.name && String(id).toLowerCase() === encodeURIComponent(currentUser.name.toLowerCase())) ||
        (currentUser.razaoSocial && String(id).toLowerCase() === encodeURIComponent(currentUser.razaoSocial.toLowerCase())) ||
        (currentUser.nomeFantasia && String(id).toLowerCase() === encodeURIComponent(currentUser.nomeFantasia.toLowerCase())) ||
        (currentUser.name && decodeURIComponent(String(id)).toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
        (currentUser.razaoSocial && decodeURIComponent(String(id)).toLowerCase().trim() === currentUser.razaoSocial.toLowerCase().trim()) ||
        (currentUser.nomeFantasia && decodeURIComponent(String(id)).toLowerCase().trim() === currentUser.nomeFantasia.toLowerCase().trim())
      )
    );

    if (isOwnerByAuthOrId && currentUser) {
      setCompany({
        name:     currentUser.razaoSocial || currentUser.nomeFantasia || currentUser.name || 'Empresa Cadastrada',
        city:     currentUser.city || 'Ivaiporã',
        sector:   currentUser.sector || 'Comércio & Serviços',
        size:     currentUser.size || '1-10 funcionários',
        cnpj:     currentUser.cnpj || '',
        rating:   currentUser.rating || 5.0,
        reviews:  currentUser.reviewsCount || 0,
        logo:     currentUser.avatar || '',
        banner:   currentUser.banner || DEFAULT_BANNER,
        website:  currentUser.website || '',
        phone:    currentUser.phone || currentUser.whatsapp || '',
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
          banner: matchCompany.banner || prev.banner || DEFAULT_BANNER,
          website: matchCompany.website || prev.website || '',
          phone: matchCompany.phone || matchCompany.whatsapp || prev.phone || '',
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
            banner: prev.banner || DEFAULT_BANNER,
          }));
        } else if (currentUser && currentUser.role === 'empresa') {
          setCompany(prev => ({
            ...prev,
            name: currentUser.razaoSocial || currentUser.nomeFantasia || currentUser.name || prev.name,
            city: currentUser.city || prev.city,
            sector: currentUser.sector || prev.sector,
            logo: currentUser.avatar || prev.logo,
            banner: currentUser.banner || prev.banner || DEFAULT_BANNER,
            website: currentUser.website || prev.website || '',
            phone: currentUser.phone || prev.phone || '',
            about: currentUser.about || prev.about,
          }));
        }
      }
    }
  }, [currentUser, id]);

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
    const res = await uploadUserProfilePicture(file, `${currentUser?.uid || currentUser?.id || 'empresa'}_logo`);
    setUploadingLogo(false);
    if (res.success) {
      setCompany(c => ({ ...c, logo: res.url }));
      if (currentUser) {
        const updated = { ...currentUser, avatar: res.url };
        setCurrentUser(updated);
        updateAuthUser({ avatar: res.url });
      }
      showToast('📸 Logotipo atualizado e salvo no Storage com sucesso!');
    } else {
      showToast(`⚠️ ${res.error || 'Erro ao enviar logotipo.'}`);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    showToast('⏳ Atualizando imagem de capa no Storage...');
    const res = await uploadUserProfilePicture(file, `${currentUser?.uid || currentUser?.id || 'empresa'}_banner`);
    setUploadingBanner(false);
    if (res.success) {
      setCompany(c => ({ ...c, banner: res.url }));
      if (currentUser) {
        const updated = { ...currentUser, banner: res.url };
        setCurrentUser(updated);
        updateAuthUser({ banner: res.url });
      }
      showToast('🎨 Imagem de capa atualizada com sucesso!');
    } else {
      showToast(`⚠️ ${res.error || 'Erro ao enviar imagem de capa.'}`);
    }
  };

  const handleSelectPresetBanner = (presetUrl) => {
    setCompany(c => ({ ...c, banner: presetUrl }));
    if (currentUser && isCompanyOwner) {
      const updated = { ...currentUser, banner: presetUrl };
      setCurrentUser(updated);
      updateAuthUser({ banner: presetUrl });
    }
    showToast('🎨 Imagem de capa alterada com sucesso!');
  };

  const handleShareProfile = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('🔗 Link do perfil copiado para a área de transferência!');
    } else {
      showToast('🔗 Link pronto para compartilhamento!');
    }
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    setEditModal(false);
    const payload = {
      name: company.name,
      sector: company.sector,
      city: company.city,
      size: company.size,
      website: company.website,
      phone: company.phone,
      about: company.about,
      avatar: company.logo,
      banner: company.banner
    };
    updateAuthUser(payload);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        ...payload
      });
    }
    showToast('Dados da empresa atualizados com sucesso!');
  };

  return (
    <>
      {/* ── HEADER DA EMPRESA COM BANNER DE CAPA PERSONALIZADO ── */}
      <div className="relative bg-slate-950 overflow-hidden min-h-[340px] sm:min-h-[400px] flex flex-col justify-end">
        {/* Imagem de Fundo (Capa/Banner) */}
        <img
          src={company.banner || DEFAULT_BANNER}
          alt={`Capa de ${company.name}`}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
        />

        {/* Gradiente Escuro Suave para Legibilidade e Elegância */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40 backdrop-blur-[0.5px]" />

        {/* Barra Superior Flutuante: Botão Voltar + Ações Rápidas */}
        <div className="absolute top-4 sm:top-6 inset-x-0 z-20">
          <div className="container flex items-center justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-black/45 hover:bg-black/65 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={14} /> Voltar para a tela anterior
            </button>

            <div className="flex items-center gap-2.5">
              {/* Botão de Compartilhar */}
              <button
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-black/45 hover:bg-black/65 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                title="Copiar link do perfil da empresa"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>

              {/* Botão de Trocar Imagem de Capa (Apenas Dono) */}
              {isCompanyOwner && (
                <label
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary-blue/90 hover:bg-primary-blue backdrop-blur-md px-4 py-2 rounded-full border border-blue-400/40 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  title="Alterar foto de capa da empresa"
                >
                  {uploadingBanner ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : (
                    <Camera size={14} />
                  )}
                  <span>{uploadingBanner ? 'Enviando capa...' : 'Alterar Capa'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Informações Principais da Empresa */}
        <div className="container relative z-10 pt-24 pb-8 sm:pb-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-wrap items-end gap-5 sm:gap-6">
              
              {/* Foto de Perfil com Ícone de Câmera Sobreposto */}
              <div className="relative shrink-0 -mb-1 sm:-mb-2">
                {/* Moldura da Foto com Borda e Overflow Perfeitos */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white/95 shadow-2xl bg-white group/avatar">
                  <img
                    src={company.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250'}
                    alt={company.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      uploadingLogo ? 'scale-105 filter blur-[1px]' : 'group-hover/avatar:scale-105'
                    }`}
                  />

                  {/* Overlay de Upload: contido 100% dentro da moldura arredondada */}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-1.5 z-10 transition-all">
                      <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary-blue animate-spin drop-shadow" />
                      <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-100 uppercase drop-shadow">
                        Salvando...
                      </span>
                    </div>
                  )}
                </div>

                {/* Ícone de Câmera na Foto de Perfil (Apenas Dono) */}
                {isCompanyOwner && (
                  <label
                    className={`absolute -bottom-1 -right-1 p-2 sm:p-2.5 rounded-2xl bg-primary-blue text-white shadow-xl border-2 border-white dark:border-slate-900 transition-all duration-200 z-20 flex items-center justify-center ${
                      uploadingLogo
                        ? 'opacity-0 scale-50 pointer-events-none'
                        : 'hover:bg-blue-600 cursor-pointer hover:scale-110 active:scale-95 hover:ring-4 hover:ring-primary-blue/30'
                    }`}
                    title="Clique para trocar a foto de perfil diretamente"
                    aria-label="Trocar logotipo da empresa"
                  >
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Informações Textuais */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight drop-shadow-sm">
                    {company.name}
                  </h1>
                  <span
                    className="bg-green-500/25 text-green-300 border border-green-400/40 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-xs"
                    title="Empresa credenciada com CNPJ validado no ecossistema Ivaí Conecta"
                  >
                    <ShieldCheck size={13} /> Recrutador Verificado
                  </span>
                </div>

                <div className="text-accent-sky font-bold text-base sm:text-lg">
                  {company.sector}
                </div>

                <div className="flex items-center gap-3 text-slate-200 text-xs sm:text-sm flex-wrap font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-accent-sky" />
                    {company.city}, PR
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-accent-sky" />
                    {company.size}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-accent-sky" />
                    {jobs.length} {jobs.length === 1 ? 'vaga publicada' : 'vagas publicadas'}
                  </span>

                  {company.website && (
                    <>
                      <span>·</span>
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-slate-200 hover:text-white transition-colors underline decoration-white/40 hover:decoration-white"
                      >
                        <Globe size={14} className="text-accent-sky" />
                        <span>{company.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    </>
                  )}

                  {company.phone && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} className="text-accent-sky" />
                        <span>{company.phone}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Ações da Empresa */}
            {isCompanyOwner ? (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setEditModal(true)}
                  className="btn btn-outline border-white/40 text-white hover:bg-white/20 font-bold btn-sm shadow-md cursor-pointer backdrop-blur-sm"
                >
                  <Edit3 size={15} /> Editar Perfil da Empresa
                </button>
                <Link
                  to="/minhas-vagas"
                  className="btn btn-teal btn-sm font-bold shadow-md cursor-pointer"
                >
                  <Building2 size={15} /> Gerenciar Minhas Vagas
                </Link>
              </div>
            ) : (
              currentUser?.role !== 'empresa' && (
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
                    className="btn bg-white text-primary-dark font-bold btn-sm shadow-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare size={15} /> 💬 Conversar com a Empresa
                  </button>
                </div>
              )
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
                <div className="text-xs text-primary-blue dark:text-blue-400 font-semibold">{activeJobsCount} ativas · {closedJobsCount} encerradas</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Candidaturas Recebidas</div>
                <div className="text-3xl font-extrabold text-primary-blue dark:text-blue-400">{totalApplicants}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Inscrições registradas</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Média de Candidatos / Vaga</div>
                <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                  {jobs.length > 0 ? (totalApplicants / jobs.length).toFixed(1) : '0'}
                </div>
                <div className="text-xs text-teal-700 dark:text-teal-300 font-semibold">Engajamento regional</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Selo de Verificação</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck size={20} /> CNPJ Validado
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 font-medium">Empresa certificada</div>
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
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-xl p-6 sm:p-7 my-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <Building2 size={20} className="text-primary-blue" /> Editar Perfil da Empresa
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Personalize a identidade visual, capa e dados institucionais da sua organização.
                </p>
              </div>
              <button
                onClick={() => setEditModal(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-5 pt-4">
              
              {/* Seção 1: Capa / Banner da Empresa */}
              <div className="space-y-2.5">
                <label className="form-label font-bold flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                    <ImageIcon size={14} className="text-primary-blue" /> Imagem de Capa do Perfil
                  </span>
                  <label className="text-[11px] font-bold text-primary-blue hover:text-blue-700 cursor-pointer flex items-center gap-1">
                    <Camera size={12} /> {uploadingBanner ? 'Enviando capa...' : 'Fazer Upload de Capa'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="hidden"
                    />
                  </label>
                </label>

                {/* Preview da Capa Selecionada */}
                <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner group">
                  <img
                    src={company.banner || DEFAULT_BANNER}
                    alt="Prévia da Capa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[11px] font-semibold text-white/90 drop-shadow">
                      Capa atual visível aos candidatos
                    </span>
                  </div>
                </div>

                {/* Predefinições de Capas Estilizadas */}
                <div>
                  <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1.5">
                    Ou escolha uma capa predefinida:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((preset) => {
                      const isSelected = (company.banner || DEFAULT_BANNER) === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPresetBanner(preset.url)}
                          className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-primary-blue ring-2 ring-primary-blue/30 scale-[1.02]'
                              : 'border-gray-200 dark:border-slate-700 opacity-75 hover:opacity-100 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center p-1">
                            {isSelected ? (
                              <div className="bg-primary-blue text-white p-1 rounded-full shadow">
                                <Check size={12} />
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-white text-center line-clamp-1 drop-shadow">
                                {preset.name}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seção 2: Logotipo e Identidade */}
              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={company.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250'}
                    alt={company.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue shadow-sm bg-white"
                  />
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs rounded-2xl flex items-center justify-center text-white z-10">
                      <Loader2 size={18} className="animate-spin text-primary-blue" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-xs text-gray-900 dark:text-white">Foto de Perfil / Logotipo</div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Sua marca ganha destaque nas buscas e candidaturas.
                  </p>
                  <label className="btn btn-outline btn-sm text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 mt-1 bg-white dark:bg-slate-900">
                    {uploadingLogo ? (
                      <Loader2 size={13} className="animate-spin text-primary-blue" />
                    ) : (
                      <Camera size={13} />
                    )}
                    <span>{uploadingLogo ? 'Enviando...' : 'Alterar Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Seção 3: Informações Cadastrais */}
              <div className="grid sm:grid-cols-2 gap-3.5">
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
                    placeholder="Ex: Tecnologia, Varejo, Saúde"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cidade / Região</label>
                  <input
                    type="text"
                    value={company.city}
                    onChange={e => setCompany(c => ({ ...c, city: e.target.value }))}
                    className="form-control"
                    placeholder="Ex: Ivaiporã, PR"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Porte da Empresa</label>
                  <select
                    value={company.size}
                    onChange={e => setCompany(c => ({ ...c, size: e.target.value }))}
                    className="form-control"
                  >
                    <option value="1-10 funcionários">1-10 funcionários</option>
                    <option value="11-50 funcionários">11-50 funcionários</option>
                    <option value="51-200 funcionários">51-200 funcionários</option>
                    <option value="201-500 funcionários">201-500 funcionários</option>
                    <option value="500+ funcionários">500+ funcionários</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center gap-1.5">
                    <Globe size={13} className="text-primary-blue" /> Website da Empresa
                  </label>
                  <input
                    type="text"
                    value={company.website || ''}
                    onChange={e => setCompany(c => ({ ...c, website: e.target.value }))}
                    className="form-control"
                    placeholder="https://suaempresa.com.br"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center gap-1.5">
                    <Phone size={13} className="text-primary-blue" /> Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={company.phone || ''}
                    onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))}
                    className="form-control"
                    placeholder="(43) 99999-9999"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sobre a Instituição / Descrição</label>
                <textarea
                  value={company.about}
                  onChange={e => setCompany(c => ({ ...c, about: e.target.value }))}
                  className="form-control"
                  rows={3}
                  placeholder="Apresente sua empresa, cultura e oportunidades aos candidatos..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="btn btn-outline btn-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm font-bold shadow-md cursor-pointer"
                >
                  Salvar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
