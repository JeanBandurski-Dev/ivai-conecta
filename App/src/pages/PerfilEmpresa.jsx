import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2, MapPin, Users, Briefcase, ArrowLeft,
  Edit3, ShieldCheck, CheckCircle2, X, Plus, HeartHandshake,
  BarChart3, Camera, MessageSquare, Share2, Globe, Phone, Image as ImageIcon,
  Check, Loader2, Sparkles, Star, Award, Gift, Clock, ExternalLink,
  ChevronDown, User, Trash2
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  getCompanies, uploadUserProfilePicture, uploadUserCoverPicture,
  updateAuthUser, maskPhone, generateWhatsAppLink, CITIES,
  DEFAULT_AVATAR, DEFAULT_BANNER, DEFAULT_COMPANY_LOGO
} from '../lib/ivaiConecta';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';
import PublishJobModal from '../components/PublishJobModal';
import useAppStore from '../store/useAppStore';

// ── Ícones SVG Customizados para Redes Sociais ──
function IconInstagram({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function IconLinkedin({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
    </svg>
  );
}

function IconWhatsApp({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const BANNER_PRESETS = [
  { id: 'office', name: 'Corporativo Moderno', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600' },
  { id: 'tech', name: 'Hub Tecnológico', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1600' },
  { id: 'team', name: 'Trabalho em Equipe', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1600' },
  { id: 'minimal', name: 'Minimalista Dark', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1600' },
];

const SUGGESTED_PERKS = [
  'Vale Refeição / Alimentação', 'Plano de Saúde Completo', 'Plano Odontológico',
  'Seguro de Vida', 'Horário Flexível', 'Trabalho Híbrido / Remoto',
  'Ambiente Colaborativo', 'Plano de Carreira & Crescimento', 'Bolsa de Estudos / Auxílio Capacitação',
  'Gympass / Auxílio Academia', 'Estacionamento Próprio', 'Day Off de Aniversário'
];

export default function PerfilEmpresa() {
  const { id } = useParams();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();
  const navigate = useNavigate();

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jobs' | 'perks' | 'reviews'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('branding');
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPerkInput, setNewPerkInput] = useState('');

  const [company, setCompany] = useState({
    id: currentUser?.uid || 'empresa',
    name: currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Empresa Cadastrada',
    city: currentUser?.city || 'Ivaiporã',
    sector: currentUser?.sector || 'Comércio & Serviços',
    size: currentUser?.size || '1-10 colaboradores',
    cnpj: currentUser?.cnpj || '',
    rating: currentUser?.rating || 5.0,
    reviews: currentUser?.reviewsCount || 0,
    logo: currentUser?.avatar || '',
    banner: currentUser?.banner || DEFAULT_BANNER,
    website: currentUser?.website || '',
    phone: currentUser?.phone || currentUser?.whatsapp || '',
    whatsapp: currentUser?.whatsapp || currentUser?.phone || '',
    instagram: currentUser?.instagram || '',
    linkedin: currentUser?.linkedin || '',
    about: currentUser?.about || 'Informações institucionais da empresa cadastradas no Ivaí Conecta.',
    history: currentUser?.history || '',
    perks: currentUser?.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento', 'Vale Alimentação'],
  });

  // Vagas em tempo real do Firestore
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Verificação estrita de autorização
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

  // Carregar dados da empresa
  useEffect(() => {
    if (isCompanyOwner && currentUser) {
      setCompany({
        id: currentUser.uid || currentUser.id,
        name: currentUser.razaoSocial || currentUser.nomeFantasia || currentUser.name || 'Empresa Cadastrada',
        city: currentUser.city || 'Ivaiporã',
        sector: currentUser.sector || 'Comércio & Serviços',
        size: currentUser.size || '1-10 colaboradores',
        cnpj: currentUser.cnpj || '',
        rating: currentUser.rating || 5.0,
        reviews: currentUser.reviewsCount || 0,
        logo: currentUser.avatar || '',
        banner: currentUser.banner || DEFAULT_BANNER,
        website: currentUser.website || '',
        phone: currentUser.phone || currentUser.whatsapp || '',
        whatsapp: currentUser.whatsapp || currentUser.phone || '',
        instagram: currentUser.instagram || '',
        linkedin: currentUser.linkedin || '',
        about: currentUser.about || 'Informações institucionais da empresa cadastradas no Ivaí Conecta.',
        history: currentUser.history || '',
        perks: currentUser.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento', 'Vale Alimentação'],
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
          id: matchCompany.id || matchCompany.uid || id,
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
          whatsapp: matchCompany.whatsapp || matchCompany.phone || prev.whatsapp || '',
          instagram: matchCompany.instagram || '',
          linkedin: matchCompany.linkedin || '',
          about: matchCompany.about || prev.about,
          history: matchCompany.history || prev.history || `Empresa atuante no ecossistema do Vale do Ivaí com sede em ${matchCompany.city || 'Ivaiporã'}, promovendo empregabilidade e inovação regional.`,
          perks: matchCompany.perks && matchCompany.perks.length > 0 ? matchCompany.perks : prev.perks,
        }));
      }
    }
  }, [id, currentUser, isCompanyOwner]);

  // Escutar vagas desta empresa em tempo real no Firestore
  useEffect(() => {
    setLoadingJobs(true);
    const jobsRef = collection(db, 'jobs');
    const unsubscribe = onSnapshot(jobsRef, (snapshot) => {
      const allJobs = snapshot.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      }));

      // Filtra vagas criadas por esta empresa
      const targetId = isCompanyOwner ? (currentUser?.uid || currentUser?.id) : (company.id || id);
      const companyName = (company.name || '').toLowerCase().trim();

      const matchedJobs = allJobs.filter(job => {
        const matchesOwner = targetId && job.createdBy && String(job.createdBy) === String(targetId);
        const matchesName = job.company && job.company.toLowerCase().trim() === companyName;
        return matchesOwner || matchesName;
      });

      setCompanyJobs(matchedJobs);
      setLoadingJobs(false);
    }, (err) => {
      console.warn('[PerfilEmpresa] Erro ao carregar vagas do Firestore:', err.message);
      setLoadingJobs(false);
    });

    return () => unsubscribe();
  }, [company.name, company.id, isCompanyOwner, currentUser, id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('🔗 Link do perfil da empresa copiado com sucesso!');
  };

  // Upload Logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ O logotipo deve ter no máximo 5MB.');
      return;
    }

    setUploadingLogo(true);
    showToast('Enviando logotipo...');
    try {
      const res = await uploadUserProfilePicture(file, currentUser?.uid || company.id);
      if (res.success) {
        setCompany(prev => ({ ...prev, logo: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, avatar: res.url });
        }
        showToast('Logotipo atualizado com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar logotipo.');
      }
    } catch {
      showToast('Erro ao processar imagem.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload Capa
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('⚠️ A imagem de capa deve ter no máximo 8MB.');
      return;
    }

    setUploadingCover(true);
    showToast('Enviando imagem de capa...');
    try {
      const res = await uploadUserCoverPicture(file, currentUser?.uid || company.id);
      if (res.success) {
        setCompany(prev => ({ ...prev, banner: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, banner: res.url });
        }
        setCoverModalOpen(false);
        showToast('Capa da empresa atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar capa.');
      }
    } catch {
      showToast('Erro ao processar imagem.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSelectPresetCover = async (presetUrl) => {
    setCompany(prev => ({ ...prev, banner: presetUrl }));
    if (currentUser) {
      setCurrentUser({ ...currentUser, banner: presetUrl });
    }
    await updateAuthUser({ banner: presetUrl });
    setCoverModalOpen(false);
    showToast('Capa atualizada com sucesso!');
  };

  // Salvar Perfil
  const handleSaveCompanyProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      if (isCompanyOwner && currentUser) {
        await updateAuthUser({
          razaoSocial: company.name,
          name: company.name,
          city: company.city,
          sector: company.sector,
          size: company.size,
          cnpj: company.cnpj,
          website: company.website,
          phone: company.phone,
          whatsapp: company.whatsapp,
          instagram: company.instagram,
          linkedin: company.linkedin,
          about: company.about,
          history: company.history,
          perks: company.perks,
          banner: company.banner,
          avatar: company.logo
        });
        setCurrentUser({
          ...currentUser,
          ...company
        });
      }
      showToast('🎉 Perfil da empresa atualizado com sucesso!');
      setEditModalOpen(false);
    } catch (err) {
      showToast('Erro ao salvar dados: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPerk = (perk) => {
    const text = (perk || newPerkInput).trim();
    if (text && !company.perks.includes(text)) {
      setCompany(prev => ({ ...prev, perks: [...prev.perks, text] }));
      setNewPerkInput('');
    }
  };

  const handleRemovePerk = (perkToRemove) => {
    setCompany(prev => ({ ...prev, perks: prev.perks.filter(p => p !== perkToRemove) }));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 pb-20">

      {/* ── HERO HEADER COM BANNER DE CAPA ── */}
      <section className="relative w-full overflow-hidden bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        
        {/* Banner Area */}
        <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden group">
          <img
            src={company.banner || DEFAULT_BANNER}
            alt="Capa da Empresa"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Top Bar inside Banner */}
          <div className="absolute top-4 inset-x-4 sm:inset-x-8 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto flex items-center justify-between z-10">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} /> Voltar
            </button>

            {isCompanyOwner && (
              <button
                onClick={() => setCoverModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-sm"
              >
                <ImageIcon size={14} /> Alterar Capa
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-24 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            
            {/* Logo & Main Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left w-full md:w-auto">
              
              {/* Logo Container */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-2xl relative flex items-center justify-center p-2">
                  <img
                    src={company.logo || DEFAULT_COMPANY_LOGO}
                    alt={company.name}
                    className="w-full h-full object-contain rounded-2xl"
                  />

                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs rounded-2xl">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>

                {isCompanyOwner && (
                  <>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="absolute bottom-1 right-1 p-2 rounded-2xl bg-primary-blue hover:bg-blue-600 text-white shadow-lg border-2 border-white dark:border-slate-900 transition-all transform hover:scale-105 cursor-pointer"
                      title="Alterar Logotipo da Empresa"
                    >
                      <Camera size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Text Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
                    {company.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck size={13} /> CNPJ Verificado
                  </span>
                </div>

                <div className="text-blue-200 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <Building2 size={16} className="text-primary-blue dark:text-blue-400" />
                  <span>{company.sector || 'Comércio & Serviços'}</span>
                </div>

                {/* Chips Meta Row */}
                <div className="flex items-center justify-center sm:justify-start gap-3.5 text-xs text-slate-300 flex-wrap pt-1">
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-slate-400" /> {company.size || '1-10 colaboradores'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" /> {company.city || 'Ivaiporã'}, PR
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star size={13} className="fill-amber-400" /> {company.rating.toFixed(1)} ({company.reviews} avaliações)
                  </span>
                </div>

                {/* Social Badges */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  {company.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-800/60 text-xs font-semibold transition-all"
                    >
                      <Globe size={13} className="text-blue-400" /> Website Oficial
                    </a>
                  )}
                  {company.linkedin && (
                    <a
                      href={company.linkedin.startsWith('http') ? company.linkedin : `https://linkedin.com/company/${company.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 text-xs font-semibold transition-all"
                    >
                      <IconLinkedin size={13} className="text-blue-300" /> LinkedIn
                    </a>
                  )}
                  {company.instagram && (
                    <a
                      href={company.instagram.startsWith('http') ? company.instagram : `https://instagram.com/${company.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900/80 text-pink-200 border border-pink-800/60 text-xs font-semibold transition-all"
                    >
                      <IconInstagram size={13} className="text-pink-400" /> Instagram
                    </a>
                  )}
                  {company.whatsapp && (
                    <a
                      href={generateWhatsAppLink(company.whatsapp, `Olá, vi a página da ${company.name} no Ivaí Conecta e gostaria de falar com vocês.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/60 text-xs font-semibold transition-all"
                    >
                      <IconWhatsApp size={13} className="text-emerald-400" /> WhatsApp
                    </a>
                  )}
                </div>

              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 w-full md:w-auto flex-wrap">
              
              {/* Se Visitante: Falar no WhatsApp ou Chat */}
              {!isCompanyOwner && (
                <>
                  {company.whatsapp && (
                    <a
                      href={generateWhatsAppLink(company.whatsapp, `Olá, vi a empresa ${company.name} no Ivaí Conecta e gostaria de mais informações.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2"
                    >
                      <IconWhatsApp size={16} /> Falar no WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => {
                      startChatWith({
                        name: company.name,
                        email: company.email || 'empresa@ivaiconecta.com.br',
                        role: 'empresa',
                        avatar: company.logo || ''
                      }, `Contato Institucional: Empresa ${company.name}`);
                    }}
                    className="btn btn-primary px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-brand flex items-center gap-2"
                  >
                    <MessageSquare size={16} /> Enviar Mensagem
                  </button>
                </>
              )}

              {/* Botão de Compartilhar */}
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm"
                title="Compartilhar Perfil"
              >
                <Share2 size={16} />
              </button>

              {/* Se Proprietário: Publicar Vaga e Editar */}
              {isCompanyOwner && (
                <>
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="btn btn-primary px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-brand flex items-center gap-2"
                  >
                    <Plus size={16} /> Publicar Nova Vaga
                  </button>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="btn bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg border border-amber-300 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 size={16} /> Editar Perfil
                  </button>
                </>
              )}

            </div>

          </div>
        </div>

      </section>

      {/* ── NAVEGAÇÃO POR ABAS ── */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 size={15} /> Sobre &amp; Cultura
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase size={15} /> Vagas Abertas ({companyJobs.length})
            </button>

            <button
              onClick={() => setActiveTab('perks')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'perks'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Gift size={15} /> Benefícios &amp; Diferenciais ({company.perks?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star size={15} /> Avaliações &amp; Reputação
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO DAS ABAS ── */}
      <main className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ── ABA 1: SOBRE & CULTURA ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna Principal (8 colunas) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card Sobre */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 mb-4">
                  <Building2 size={18} className="text-primary-blue dark:text-blue-400" /> Sobre a Empresa
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {company.about || 'A empresa ainda não cadastrou uma descrição institucional.'}
                </p>
              </div>

              {/* Card História & Trajetória */}
              {company.history && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 mb-4">
                    <Sparkles size={18} className="text-primary-blue dark:text-blue-400" /> Nossa História &amp; Valores
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {company.history}
                  </p>
                </div>
              )}

              {/* Destaque de Vagas Recentes */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                    <Briefcase size={18} className="text-primary-blue dark:text-blue-400" /> Oportunidades em Destaque
                  </h2>
                  <button onClick={() => setActiveTab('jobs')} className="text-xs font-bold text-primary-blue hover:underline">
                    Ver todas ({companyJobs.length}) →
                  </button>
                </div>

                {loadingJobs ? (
                  <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary-blue" /></div>
                ) : companyJobs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 dark:text-slate-500">
                    Nenhuma vaga publicada no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyJobs.slice(0, 4).map(job => (
                      <JobCard key={job.id} job={job} onSelect={setSelectedJob} />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Coluna Lateral / Sidebar (4 colunas) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card Informações Corporativas */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 space-y-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={17} className="text-primary-blue dark:text-blue-400" /> Dados da Organização
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-gray-500">Segmento:</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{company.sector}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-gray-500">Porte:</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{company.size}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-gray-500">Localização:</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{company.city}, PR</span>
                  </div>
                  {company.cnpj && (
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                      <span className="text-gray-500">CNPJ:</span>
                      <span className="font-semibold text-gray-800 dark:text-slate-200">{company.cnpj}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-500">Status no Ivaí Conecta:</span>
                    <span className="font-bold text-emerald-500">Empresa Verificada</span>
                  </div>
                </div>
              </div>

              {/* Card Benefícios Resumidos */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gift size={17} className="text-primary-blue dark:text-blue-400" /> Benefícios Oferecidos
                  </h2>
                  <button onClick={() => setActiveTab('perks')} className="text-xs font-bold text-primary-blue hover:underline">
                    Ver todos
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {company.perks && company.perks.slice(0, 6).map((perk, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-900/60">
                      {perk}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── ABA 2: VAGAS ABERTAS ── */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={20} className="text-primary-blue dark:text-blue-400" /> Oportunidades Abertas
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Vagas de emprego e estágio ativas publicadas por {company.name}</p>
                </div>

                {isCompanyOwner && (
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="btn btn-primary btn-sm rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Publicar Nova Vaga
                  </button>
                )}
              </div>

              {loadingJobs ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary-blue" size={32} /></div>
              ) : companyJobs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <Briefcase size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Nenhuma vaga ativa no momento</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isCompanyOwner ? 'Clique no botão acima para cadastrar a primeira vaga da sua empresa.' : 'Esta empresa não possui vagas abertas no momento.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {companyJobs.map(job => (
                    <JobCard key={job.id} job={job} onSelect={setSelectedJob} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA 3: BENEFÍCIOS & DIFERENCIAIS ── */}
        {activeTab === 'perks' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Gift size={20} className="text-primary-blue dark:text-blue-400" /> Benefícios &amp; Cultura da Empresa
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">O que torna {company.name} um excelente lugar para trabalhar</p>
              </div>
              {isCompanyOwner && (
                <button
                  onClick={() => { setActiveEditTab('perks'); setEditModalOpen(true); }}
                  className="btn btn-outline btn-sm rounded-xl text-xs font-bold"
                >
                  <Edit3 size={14} /> Editar Benefícios
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {company.perks && company.perks.map((perk, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-blue text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ABA 4: AVALIAÇÕES & REPUTAÇÃO ── */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Star size={20} className="text-amber-400 fill-amber-400" /> Avaliações &amp; Clima Organizacional
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Opiniões de colaboradores e candidatos contratados</p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-extrabold text-amber-500">{company.rating.toFixed(1)}</div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={18} className="fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-slate-400 mt-1 block">Baseado em avaliações verificadas de processos seletivos</span>
                </div>
              </div>
            </div>

            <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <p className="text-xs text-gray-500">Nenhum comentário público registrado para esta empresa no momento.</p>
            </div>
          </div>
        )}

      </main>

      {/* ── MODAL ALTERAR CAPA ── */}
      {coverModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-primary-blue" /> Personalizar Capa da Empresa
              </h3>
              <button onClick={() => setCoverModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Escolher Capa Predefinida
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPresetCover(preset.url)}
                      className="group relative h-20 rounded-2xl overflow-hidden border-2 hover:border-primary-blue transition-all cursor-pointer text-left"
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-end p-2 transition-all">
                        <span className="text-[11px] font-bold text-white drop-shadow">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Ou Enviar Foto Personalizada da Empresa (Até 8MB)
                </label>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary-blue text-sm font-bold text-gray-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {uploadingCover ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                  {uploadingCover ? 'Enviando imagem...' : 'Selecionar Imagem do Computador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE EDIÇÃO COMPLETO DA EMPRESA (UX SÊNIOR E BOTÕES AZUIS) ── */}
      {editModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-company-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 id="edit-company-title" className="font-heading font-extrabold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-primary-blue dark:text-blue-400" /> Editar perfil da empresa
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Personalize identidade corporativa, apresentação institucional, benefícios e contatos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:text-white hover:bg-primary-blue dark:hover:bg-primary-blue bg-blue-50 dark:bg-blue-950/50 transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs / Section Switcher */}
            <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
              
              {/* Desktop Tabs (>= 640px) */}
              <div className="hidden sm:grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                {[
                  { id: 'branding', label: 'Identidade e logo' },
                  { id: 'about', label: 'Sobre e história' },
                  { id: 'perks', label: 'Benefícios e cultura' },
                  { id: 'contact', label: 'Contato e redes' },
                ].map(tab => {
                  const isActive = activeEditTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveEditTab(tab.id)}
                      className={`py-2 px-3 text-xs md:text-sm font-semibold rounded-xl transition-all text-center truncate cursor-pointer ${
                        isActive
                          ? 'bg-primary-blue text-white shadow-sm font-bold'
                          : 'text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 hover:text-primary-blue'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Select (< 640px) */}
              <div className="sm:hidden flex items-center gap-2">
                <label htmlFor="mobile-company-tab-select" className="text-xs font-bold text-primary-blue dark:text-blue-300 shrink-0">
                  Seção:
                </label>
                <div className="relative flex-1">
                  <select
                    id="mobile-company-tab-select"
                    value={activeEditTab}
                    onChange={e => setActiveEditTab(e.target.value)}
                    className="w-full appearance-none bg-blue-50/60 dark:bg-slate-800 border border-blue-300 dark:border-blue-800 rounded-xl px-3.5 py-2 text-xs font-bold text-primary-blue dark:text-blue-300 pr-8 focus:ring-2 focus:ring-primary-blue/20 outline-none"
                  >
                    <option value="branding">Identidade e logo</option>
                    <option value="about">Sobre e história</option>
                    <option value="perks">Benefícios e cultura</option>
                    <option value="contact">Contato e redes</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
              
              {/* ABA 1: Identidade e Logo */}
              {activeEditTab === 'branding' && (
                <div className="space-y-6">
                  
                  {/* Controle e Prévia do Logotipo */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-primary-blue/30 shadow-sm bg-white dark:bg-slate-900 flex items-center justify-center p-1">
                        <img
                          src={company.logo || DEFAULT_COMPANY_LOGO}
                          alt="Logotipo da Empresa"
                          className="w-full h-full object-contain"
                        />
                        {uploadingLogo && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs rounded-2xl">
                            <Loader2 className="animate-spin text-white" size={20} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Logotipo da Empresa</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Formatos aceitos: JPG, PNG, SVG ou WEBP. Tamanho recomendado: até 5MB.
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1 flex-wrap">
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="btn bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                          <Camera size={14} /> {company.logo ? 'Trocar logotipo' : 'Adicionar logotipo'}
                        </button>
                        {company.logo && (
                          <button
                            type="button"
                            onClick={() => setCompany(prev => ({ ...prev, logo: '' }))}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-primary-blue dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-200 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                          >
                            Remover logotipo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campos Institucionais */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="company-field-name" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Nome Fantasia / Razão Social <span className="text-primary-blue">*</span>
                      </label>
                      <input
                        id="company-field-name"
                        type="text"
                        required
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={company.name}
                        onChange={e => setCompany(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome da empresa"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company-field-sector" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Segmento de Atuação
                        </label>
                        <input
                          id="company-field-sector"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={company.sector}
                          onChange={e => setCompany(prev => ({ ...prev, sector: e.target.value }))}
                          placeholder="Ex: Tecnologia, Varejo, Indústria, Saúde"
                        />
                      </div>

                      <div>
                        <label htmlFor="company-field-size" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Porte da Empresa
                        </label>
                        <select
                          id="company-field-size"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={company.size}
                          onChange={e => setCompany(prev => ({ ...prev, size: e.target.value }))}
                        >
                          <option value="1-10 colaboradores">1-10 colaboradores</option>
                          <option value="11-50 colaboradores">11-50 colaboradores</option>
                          <option value="51-200 colaboradores">51-200 colaboradores</option>
                          <option value="200+ colaboradores">Mais de 200 colaboradores</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company-field-city" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Cidade Principal
                        </label>
                        <select
                          id="company-field-city"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={company.city}
                          onChange={e => setCompany(prev => ({ ...prev, city: e.target.value }))}
                        >
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="company-field-cnpj" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          CNPJ da Empresa
                        </label>
                        <input
                          id="company-field-cnpj"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={company.cnpj}
                          onChange={e => setCompany(prev => ({ ...prev, cnpj: e.target.value }))}
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 2: Sobre & História */}
              {activeEditTab === 'about' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="company-field-about" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Sobre a Empresa (Apresentação Institucional)
                    </label>
                    <textarea
                      id="company-field-about"
                      rows={5}
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl p-3.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none leading-relaxed"
                      value={company.about}
                      onChange={e => setCompany(prev => ({ ...prev, about: e.target.value }))}
                      placeholder="Conte sobre as atividades principais, missão, ambiente de trabalho e diferenciais da empresa..."
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Dica: perfis empresariais com apresentação completa atraem candidatos mais qualificados.
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                    <label htmlFor="company-field-history" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      História, Conquistas &amp; Valores (Opcional)
                    </label>
                    <textarea
                      id="company-field-history"
                      rows={4}
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl p-3.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none leading-relaxed"
                      value={company.history}
                      onChange={e => setCompany(prev => ({ ...prev, history: e.target.value }))}
                      placeholder="Fundação, crescimento regional, marcos importantes e cultura organizacional..."
                    />
                  </div>
                </div>
              )}

              {/* ABA 3: Benefícios & Cultura */}
              {activeEditTab === 'perks' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="company-field-new-perk" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Adicionar Benefício Personalizado
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        id="company-field-new-perk"
                        type="text"
                        className="flex-1 border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        placeholder="Ex: Gympass, Vale Refeição, Plano Odontológico"
                        value={newPerkInput}
                        onChange={e => setNewPerkInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPerk(); } }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddPerk()}
                        className="btn bg-primary-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider block mb-2">
                      Sugestões Rápidas:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_PERKS.map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleAddPerk(sug)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/50 hover:bg-primary-blue hover:text-white text-primary-blue dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2 block">
                      Benefícios Atuais no Perfil:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {company.perks && company.perks.length > 0 ? (
                        company.perks.map(perk => (
                          <span key={perk} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                            {perk}
                            <button
                              type="button"
                              onClick={() => handleRemovePerk(perk)}
                              className="p-0.5 text-blue-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                              title={`Remover ${perk}`}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Nenhum benefício cadastrado ainda.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: Contato & Redes */}
              {activeEditTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="company-field-website" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Website Oficial (URL)
                    </label>
                    <input
                      id="company-field-website"
                      type="text"
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                      value={company.website}
                      onChange={e => setCompany(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://empresa.com.br"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company-field-whatsapp" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        WhatsApp de Contato / Recrutamento
                      </label>
                      <input
                        id="company-field-whatsapp"
                        type="text"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={company.whatsapp}
                        onChange={e => setCompany(prev => ({ ...prev, whatsapp: maskPhone(e.target.value) }))}
                        placeholder="(43) 99999-9999"
                      />
                    </div>

                    <div>
                      <label htmlFor="company-field-phone" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Telefone Fixo (Opcional)
                      </label>
                      <input
                        id="company-field-phone"
                        type="text"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={company.phone}
                        onChange={e => setCompany(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                        placeholder="(43) 3472-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company-field-linkedin" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        LinkedIn da Empresa
                      </label>
                      <input
                        id="company-field-linkedin"
                        type="text"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={company.linkedin}
                        onChange={e => setCompany(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="nome-da-empresa"
                      />
                    </div>

                    <div>
                      <label htmlFor="company-field-instagram" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Instagram (@usuario)
                      </label>
                      <input
                        id="company-field-instagram"
                        type="text"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={company.instagram}
                        onChange={e => setCompany(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@empresa.oficial"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-slate-800 bg-blue-50/30 dark:bg-slate-900/75 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={saving}
                className="btn border border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white bg-blue-50/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCompanyProfile}
                disabled={saving || uploadingLogo}
                className="btn bg-primary-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL PUBLICAR VAGA ── */}
      {showPublishModal && (
        <PublishJobModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onSuccess={() => {
            setShowPublishModal(false);
            showToast('🎉 Vaga publicada e sincronizada com sucesso!');
          }}
        />
      )}

      {/* ── MODAL DETALHE DA VAGA ── */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

    </div>
  );
}
