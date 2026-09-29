import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2, MapPin, Users, Briefcase, ArrowLeft,
  Edit3, ShieldCheck, CheckCircle2, X, Plus, HeartHandshake,
  BarChart3, Camera, MessageSquare, Share2, Globe, Phone, Image as ImageIcon, Check, Loader2, ShieldAlert
} from 'lucide-react';
import { getJobs, getCompanies, uploadUserProfilePicture, updateAuthUser } from '../lib/ivaiConecta';
import { getUserProfile } from '../services/authService';
import JobCard from '../components/JobCard';
import useAppStore from '../store/useAppStore';
import PublishJobModal from '../components/PublishJobModal';
import EditCompanyProfileModal from '../components/EditCompanyProfileModal';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600';

const _BANNER_PRESETS = [
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
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [editCompanyData, setEditCompanyData] = useState({
    name: currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Empresa Cadastrada',
    tradingName: currentUser?.nomeFantasia || currentUser?.name || '',
    cnpj: currentUser?.cnpj || '',
    city: currentUser?.city || 'Ivaiporã',
    industry: currentUser?.sector || 'Comércio & Serviços',
    size: currentUser?.size || '1-10 funcionários',
    foundedYear: currentUser?.foundedYear || '',
    description: currentUser?.about || '',
    culture: currentUser?.history || currentUser?.culture || '',
    benefits: currentUser?.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento'],
    avatar: currentUser?.avatar || '',
    coverImage: currentUser?.banner || DEFAULT_BANNER,
    website: currentUser?.website || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || currentUser?.whatsapp || '',
    linkedin: currentUser?.linkedin || '',
    instagram: currentUser?.instagram || '',
  });

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
      (company?.uid && currentUser.uid && String(company.uid) === String(currentUser.uid)) ||
      (company?.id && currentUser.id && String(company.id) === String(currentUser.id))
    )
  );

  useEffect(() => {
    const isOwnerByAuthOrId = Boolean(
      currentUser && currentUser.role === 'empresa' && (
        !id ||
        String(id) === 'empresa' ||
        String(id) === String(currentUser.uid) ||
        String(id) === String(currentUser.id)
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
        blocked:  currentUser.blocked || currentUser.status === 'blocked',
        blockedReason: currentUser.blockedReason || null,
      });
    } else if (id) {
      // Busca dados atualizados do perfil no Firestore
      if (typeof getUserProfile === 'function') {
        getUserProfile(id).then(res => {
          if (res && res.success && res.profile) {
            setCompany(prev => ({
              ...prev,
              blocked: res.profile.blocked || res.profile.status === 'blocked',
              status: res.profile.status || (res.profile.blocked ? 'blocked' : 'active'),
              blockedReason: res.profile.blockedReason || null,
              name: res.profile.razaoSocial || res.profile.nomeFantasia || res.profile.name || prev.name,
              city: res.profile.city || prev.city,
              sector: res.profile.sector || prev.sector,
              logo: res.profile.avatar || prev.logo,
              banner: res.profile.banner || prev.banner,
              about: res.profile.about || prev.about
            }));
          }
        }).catch(() => {});
      }
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
        (currentUser?.uid && (String(j.createdBy) === String(currentUser.uid) || String(j.companyUid) === String(currentUser.uid))) ||
        (currentUser?.id && (String(j.createdBy) === String(currentUser.id) || String(j.companyUid) === String(currentUser.id)))
      );
    }
    if (id) {
      const targetId = String(id).trim();
      return (
        (j.createdBy && String(j.createdBy) === targetId) ||
        (j.companyUid && String(j.companyUid) === targetId)
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
      setEditCompanyData(d => ({ ...d, avatar: res.url }));
      if (currentUser) {
        const updated = { ...currentUser, avatar: res.url };
        setCurrentUser(updated);
        updateAuthUser({ avatar: res.url });
      }
      showToast('Logotipo atualizado e salvo no Storage com sucesso!');
    } else {
      showToast(res.error || 'Erro ao enviar logotipo.');
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
      setEditCompanyData(d => ({ ...d, coverImage: res.url }));
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

  const _handleSelectPresetBanner = (presetUrl) => {
    setCompany(c => ({ ...c, banner: presetUrl }));
    setEditCompanyData(d => ({ ...d, coverImage: presetUrl }));
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

  const handleOpenEditModal = () => {
    setEditCompanyData({
      name: company.name || currentUser?.razaoSocial || currentUser?.name || '',
      tradingName: currentUser?.nomeFantasia || company.name || '',
      cnpj: company.cnpj || currentUser?.cnpj || '',
      city: company.city || currentUser?.city || 'Ivaiporã',
      industry: company.sector || currentUser?.sector || 'Comércio & Serviços',
      size: company.size || currentUser?.size || '1-10 funcionários',
      foundedYear: currentUser?.foundedYear || '',
      description: company.about || currentUser?.about || '',
      culture: company.history || currentUser?.history || '',
      benefits: company.perks || currentUser?.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento'],
      avatar: company.logo || currentUser?.avatar || '',
      coverImage: company.banner || currentUser?.banner || DEFAULT_BANNER,
      website: company.website || currentUser?.website || '',
      email: currentUser?.email || '',
      phone: company.phone || currentUser?.phone || currentUser?.whatsapp || '',
      linkedin: currentUser?.linkedin || '',
      instagram: currentUser?.instagram || '',
    });
    setEditModal(true);
  };

  const handleSaveCompany = async (e) => {
    if (e) e.preventDefault();
    setEditModal(false);

    const payload = {
      name: editCompanyData.name,
      razaoSocial: editCompanyData.name,
      nomeFantasia: editCompanyData.tradingName,
      cnpj: editCompanyData.cnpj,
      city: editCompanyData.city,
      sector: editCompanyData.industry,
      size: editCompanyData.size,
      foundedYear: editCompanyData.foundedYear,
      about: editCompanyData.description,
      history: editCompanyData.culture,
      culture: editCompanyData.culture,
      perks: editCompanyData.benefits,
      avatar: editCompanyData.avatar,
      banner: editCompanyData.coverImage,
      website: editCompanyData.website,
      email: editCompanyData.email,
      phone: editCompanyData.phone,
      linkedin: editCompanyData.linkedin,
      instagram: editCompanyData.instagram,
    };

    setCompany(prev => ({
      ...prev,
      name: editCompanyData.name,
      tradingName: editCompanyData.tradingName,
      cnpj: editCompanyData.cnpj,
      city: editCompanyData.city,
      sector: editCompanyData.industry,
      size: editCompanyData.size,
      about: editCompanyData.description,
      history: editCompanyData.culture,
      culture: editCompanyData.culture,
      perks: editCompanyData.benefits,
      logo: editCompanyData.avatar,
      banner: editCompanyData.coverImage,
      website: editCompanyData.website,
      phone: editCompanyData.phone,
      email: editCompanyData.email,
    }));

    await updateAuthUser(payload);
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
              <div className="space-y-1.5 min-w-0 flex-1 max-w-full">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight drop-shadow-sm break-words [overflow-wrap:anywhere] max-w-full">
                    {company.name}
                  </h1>
                  {company.blocked || company.status === 'blocked' || (isCompanyOwner && (currentUser?.blocked || currentUser?.status === 'blocked')) ? (
                    <span
                      className="bg-red-500/30 text-red-300 border border-red-400/50 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-xs"
                      title="Empresa temporariamente suspensa pela moderação da plataforma"
                    >
                      <ShieldAlert size={13} /> Conta Suspensa / Bloqueada
                    </span>
                  ) : (
                    <span
                      className="bg-green-500/25 text-green-300 border border-green-400/40 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-xs"
                      title="Empresa credenciada com CNPJ validado no ecossistema Ivaí Conecta"
                    >
                      <ShieldCheck size={13} /> Recrutador Verificado
                    </span>
                  )}
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
                  onClick={handleOpenEditModal}
                  className="btn btn-outline border-white/40 text-white hover:bg-white/20 font-bold btn-sm shadow-md cursor-pointer backdrop-blur-sm"
                >
                  <Edit3 size={15} /> Editar Perfil da Empresa
                </button>
                <Link
                  to="/gerenciamento-vagas"
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
                    className="btn bg-white dark:bg-slate-800 text-primary-dark dark:text-white font-bold btn-sm shadow-md hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer border border-white/20"
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

        {/* ── ALERTA DE SUSPENSÃO ADMINISTRATIVA ── */}
        {(company.blocked || company.status === 'blocked' || (isCompanyOwner && (currentUser?.blocked || currentUser?.status === 'blocked'))) && (
          <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/60 border-2 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                Empresa Suspensa pela Moderação Administrativa
              </h2>
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                As atividades desta empresa foram temporariamente suspensas pela administração do Ivaí Conecta. A publicação de novas vagas e a gestão de processos seletivos estão inativas.
              </p>
              {(company.blockedReason || currentUser?.blockedReason) && (
                <div className="mt-2 text-xs text-red-800 dark:text-red-200 bg-red-100/60 dark:bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/60 inline-block font-medium">
                  <strong>Justificativa da Moderação:</strong> {company.blockedReason || currentUser?.blockedReason}
                </div>
              )}
            </div>
          </div>
        )}

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

              <button
                onClick={() => setShowPublishModal(true)}
                className="btn btn-teal btn-sm font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Publicar Nova Vaga
              </button>
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

      {/* Modal Padronizado: Editar Perfil da Empresa */}
      <EditCompanyProfileModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        editData={editCompanyData}
        setEditData={setEditCompanyData}
        handleSaveProfile={handleSaveCompany}
        handleLogoUpload={handleLogoUpload}
        handleBannerUpload={handleBannerUpload}
        uploadingLogo={uploadingLogo}
        uploadingBanner={uploadingBanner}
      />
      {/* Modal: Publicar Nova Vaga */}
      <PublishJobModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onJobCreated={() => setRefreshKey(k => k + 1)}
      />
    </>
  );
}
