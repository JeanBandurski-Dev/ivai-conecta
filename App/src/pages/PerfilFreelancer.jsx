import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Wrench, MapPin, Star, Phone, MessageSquare, Edit3, Plus, Trash2,
  ExternalLink, CheckCircle2, ShieldCheck, Share2, Camera, Clock,
  CreditCard, Briefcase, Award, Sparkles, FolderGit2, X, ChevronRight,
  Send, AlertCircle, ArrowLeft, Check, Copy, Tag, FileText, Eye
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  getTalentById,
  fetchTalentById,
  updateTalentProfile,
  uploadUserProfilePicture,
  maskPhone,
  generateWhatsAppLink,
  subscribeToServices,
  addService,
  deleteService,
  CITIES
} from '../lib/ivaiConecta';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SERVICE_CATEGORIES = [
  'Construção & Manutenção',
  'Marketing & Design',
  'Aulas & Treinamentos',
  'Tecnologia & TI',
  'Consultoria & Negócios',
  'Saúde & Bem-Estar',
  'Eventos & Fotografia',
  'Outros Serviços'
];

const PAYMENT_OPTIONS = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Boleto Bancário',
  'Transferência Bancária'
];

export default function PerfilFreelancer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();

  const freelancerId = id || currentUser?.uid || currentUser?.id;

  // Estado do freelancer carregado
  const [freelancer, setFreelancer] = useState(() => {
    const local = getTalentById(freelancerId);
    if (local) return local;
    if (currentUser && (!id || id === currentUser.uid || id === currentUser.id)) {
      return {
        id: currentUser.uid || currentUser.id,
        firestoreId: currentUser.uid || currentUser.id,
        name: currentUser.name || 'Prestador Autônomo',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
        role: 'freelancer',
        profession: currentUser.profession || 'Prestador de Serviços',
        category: currentUser.category || 'Construção & Manutenção',
        city: currentUser.city || 'Ivaiporã',
        phone: currentUser.phone || currentUser.whatsapp || '',
        whatsapp: currentUser.whatsapp || currentUser.phone || '',
        priceRange: currentUser.priceRange || 'A combinar / Orçamento gratuito',
        bio: currentUser.bio || '',
        workingHours: currentUser.workingHours || 'Segunda a Sexta, 08h às 18h',
        coverageArea: currentUser.coverageArea || 'Ivaiporã e cidades vizinhas no Vale do Ivaí',
        paymentMethods: currentUser.paymentMethods || ['PIX', 'Dinheiro'],
        skills: currentUser.skills || [],
        portfolio: currentUser.portfolio || [],
        reviews: currentUser.reviews || [],
        rating: currentUser.rating || 5.0,
        reviewsCount: currentUser.reviewsCount || 0,
        isVerified: currentUser.isVerified ?? true,
        instagram: currentUser.instagram || '',
        linkedin: currentUser.linkedin || '',
        website: currentUser.website || ''
      };
    }
    return null;
  });

  const [loadingUser, setLoadingUser] = useState(!freelancer);
  const [allServices, setAllServices] = useState([]);
  // Default tab: show 'services' for own profile, 'about' when viewing another freelancer via ID
  const [activeTab, setActiveTab] = useState('about'); // 'services' | 'portfolio' | 'skills' | 'about' | 'reviews'

  // Modais
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Formulário de Edição de Perfil
  const [editForm, setEditForm] = useState({
    name: '',
    profession: '',
    category: 'Construção & Manutenção',
    city: 'Ivaiporã',
    phone: '',
    whatsapp: '',
    priceRange: '',
    bio: '',
    workingHours: '',
    coverageArea: '',
    paymentMethods: [],
    instagram: '',
    linkedin: '',
    website: '',
    skills: [],
    newSkill: ''
  });

  // Formulário de Novo Serviço
  const [newServiceForm, setNewServiceForm] = useState({
    title: '',
    category: 'Construção & Manutenção',
    city: 'Ivaiporã',
    description: '',
    phone: ''
  });

  // Formulário de Portfólio
  const [newPortfolioForm, setNewPortfolioForm] = useState({
    title: '',
    category: '',
    description: '',
    imageUrl: '',
    link: ''
  });

  // Formulário de Avaliação
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  // Busca dados do usuário (Local + Firestore)
  useEffect(() => {
    let isMounted = true;
    setLoadingUser(true);

    const local = getTalentById(freelancerId);
    if (local) {
      setFreelancer(local);
      setLoadingUser(false);
    } else if (currentUser && (!id || id === currentUser.uid || id === currentUser.id)) {
      setFreelancer({
        id: currentUser.uid || currentUser.id,
        firestoreId: currentUser.uid || currentUser.id,
        name: currentUser.name || 'Prestador Autônomo',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
        role: 'freelancer',
        profession: currentUser.profession || 'Prestador de Serviços',
        category: currentUser.category || 'Construção & Manutenção',
        city: currentUser.city || 'Ivaiporã',
        phone: currentUser.phone || currentUser.whatsapp || '',
        whatsapp: currentUser.whatsapp || currentUser.phone || '',
        priceRange: currentUser.priceRange || 'A combinar / Orçamento gratuito',
        bio: currentUser.bio || '',
        workingHours: currentUser.workingHours || 'Segunda a Sexta, 08h às 18h',
        coverageArea: currentUser.coverageArea || 'Ivaiporã e cidades vizinhas no Vale do Ivaí',
        paymentMethods: currentUser.paymentMethods || ['PIX', 'Dinheiro'],
        skills: currentUser.skills || [],
        portfolio: currentUser.portfolio || [],
        reviews: currentUser.reviews || [],
        rating: currentUser.rating || 5.0,
        reviewsCount: currentUser.reviewsCount || 0,
        isVerified: currentUser.isVerified ?? true,
        instagram: currentUser.instagram || '',
        linkedin: currentUser.linkedin || '',
        website: currentUser.website || ''
      });
      setLoadingUser(false);
    }

    if (freelancerId) {
      fetchTalentById(freelancerId).then(remote => {
        if (isMounted) {
          if (remote) {
            setFreelancer(remote);
          }
          setLoadingUser(false);
        }
      }).catch(() => {
        if (isMounted) setLoadingUser(false);
      });
    }

    return () => { isMounted = false; };
  }, [freelancerId, id, currentUser]);

  // Escuta os serviços cadastrados em tempo real via Firestore
  useEffect(() => {
    const unsub = subscribeToServices('Todas as Cidades', (services) => {
      setAllServices(services || []);
    });
    return () => unsub();
  }, []);

  // Preenche formulário de edição com os dados atuais
  useEffect(() => {
    if (freelancer) {
      setEditForm({
        name: freelancer.name || '',
        profession: freelancer.profession || freelancer.badge || 'Prestador de Serviços',
        category: freelancer.category || 'Construção & Manutenção',
        city: freelancer.city || 'Ivaiporã',
        phone: freelancer.phone || freelancer.whatsapp || '',
        whatsapp: freelancer.whatsapp || freelancer.phone || '',
        priceRange: freelancer.priceRange || 'A combinar / Orçamento gratuito',
        bio: freelancer.bio || '',
        workingHours: freelancer.workingHours || 'Segunda a Sexta, 08h às 18h',
        coverageArea: freelancer.coverageArea || 'Ivaiporã e região',
        paymentMethods: freelancer.paymentMethods || ['PIX', 'Dinheiro'],
        instagram: freelancer.instagram || '',
        linkedin: freelancer.linkedin || '',
        website: freelancer.website || '',
        skills: Array.isArray(freelancer.skills) ? [...freelancer.skills] : [],
        newSkill: ''
      });

      setNewServiceForm(prev => ({
        ...prev,
        city: freelancer.city || 'Ivaiporã',
        phone: freelancer.phone || freelancer.whatsapp || ''
      }));
    }
  }, [freelancer]);

  // Verifica se o usuário autenticado é o dono do perfil
  const isOwner = Boolean(
    currentUser && freelancer && (
      (currentUser.uid && freelancer.uid && String(currentUser.uid) === String(freelancer.uid)) ||
      (currentUser.id && freelancer.id && String(currentUser.id) === String(freelancer.id)) ||
      (currentUser.uid && (String(currentUser.uid) === String(freelancer.id) || String(currentUser.uid) === String(freelancer.firestoreId))) ||
      (currentUser.email && freelancer.email && currentUser.email.toLowerCase().trim() === freelancer.email.toLowerCase().trim()) ||
      (!id && currentUser.role === 'freelancer')
    )
  );

  // Filtra apenas os serviços criados por este freelancer
  const myServices = useMemo(() => {
    if (!freelancer) return [];
    const fId = String(freelancer.uid || freelancer.id || freelancer.firestoreId || '');
    const fEmail = (freelancer.email || '').toLowerCase().trim();
    const fName = (freelancer.name || '').toLowerCase().trim();

    return allServices.filter(s => {
      const matchCreatedBy = s.createdBy && (String(s.createdBy) === fId || String(s.createdBy) === String(currentUser?.uid));
      const matchEmail = s.providerEmail && fEmail && s.providerEmail.toLowerCase().trim() === fEmail;
      const matchName = s.providerName && fName && s.providerName.toLowerCase().trim() === fName;
      return matchCreatedBy || matchEmail || matchName;
    });
  }, [allServices, freelancer, currentUser]);

  // Calcula rating médio e reviews
  const currentReviews = freelancer?.reviews || [];
  const averageRating = useMemo(() => {
    if (currentReviews.length > 0) {
      const sum = currentReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      return (sum / currentReviews.length).toFixed(1);
    }
    return freelancer?.rating ? Number(freelancer.rating).toFixed(1) : '5.0';
  }, [currentReviews, freelancer?.rating]);

  // Upload de Foto de Perfil
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    showToast('Enviando foto para a nuvem...');
    const res = await uploadUserProfilePicture(file, currentUser?.uid || freelancer?.id);
    setUploadingAvatar(false);

    if (res.success && res.url) {
      const updated = { ...freelancer, avatar: res.url };
      setFreelancer(updated);
      updateTalentProfile(freelancer.id || freelancer.firestoreId, { avatar: res.url });
      if (isOwner && currentUser) {
        setCurrentUser({ ...currentUser, avatar: res.url });
      }
      showToast('🎉 Foto de perfil atualizada com sucesso!');
    } else {
      showToast(res.error || 'Erro ao enviar foto.');
    }
  };

  // Salvar Edição do Perfil
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast('O nome não pode ficar em branco.');
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      profession: editForm.profession.trim(),
      category: editForm.category,
      city: editForm.city,
      phone: editForm.phone.trim(),
      whatsapp: editForm.whatsapp.trim(),
      priceRange: editForm.priceRange.trim(),
      bio: editForm.bio.trim(),
      workingHours: editForm.workingHours.trim(),
      coverageArea: editForm.coverageArea.trim(),
      paymentMethods: editForm.paymentMethods,
      instagram: editForm.instagram.trim(),
      linkedin: editForm.linkedin.trim(),
      website: editForm.website.trim(),
      skills: editForm.skills,
      role: 'freelancer'
    };

    const targetId = freelancer?.firestoreId || freelancer?.id || currentUser?.uid;
    await updateTalentProfile(targetId, payload);

    setFreelancer(prev => ({ ...prev, ...payload }));
    if (isOwner && currentUser) {
      setCurrentUser({ ...currentUser, ...payload });
    }

    showToast('Perfil profissional atualizado com sucesso!');
    setEditModalOpen(false);
  };

  // Criar Novo Serviço
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newServiceForm.title.trim()) {
      showToast('Informe o título do serviço.');
      return;
    }

    const servicePayload = {
      title: newServiceForm.title.trim(),
      name: newServiceForm.title.trim(),
      category: newServiceForm.category,
      city: newServiceForm.city || freelancer?.city || 'Ivaiporã',
      description: newServiceForm.description.trim() || 'Serviço profissional de alta qualidade prestado no Vale do Ivaí.',
      phone: newServiceForm.phone.trim() || freelancer?.phone || freelancer?.whatsapp || '',
      providerName: freelancer?.name || currentUser?.name || 'Profissional Autônomo',
      providerEmail: freelancer?.email || currentUser?.email || '',
      createdBy: currentUser?.uid || freelancer?.id,
      avatar: freelancer?.avatar || currentUser?.avatar || '',
      rating: 5.0,
      reviewsCount: 0,
      badge: 'Prestador Verificado'
    };

    await addService(servicePayload);
    showToast('✨ Anúncio de serviço cadastrado com sucesso!');
    setServiceModalOpen(false);
    setNewServiceForm({
      title: '',
      category: 'Construção & Manutenção',
      city: freelancer?.city || 'Ivaiporã',
      description: '',
      phone: freelancer?.phone || freelancer?.whatsapp || ''
    });
  };

  // Excluir Serviço
  const handleDeleteService = async (serviceId, serviceTitle) => {
    if (window.confirm(`Deseja realmente remover o serviço "${serviceTitle}"?`)) {
      await deleteService(serviceId);
      showToast('Serviço removido.');
    }
  };

  // Adicionar Trabalho ao Portfólio
  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!newPortfolioForm.title.trim()) {
      showToast('Informe o título do trabalho ou projeto.');
      return;
    }

    const newItem = {
      id: `port_${Date.now()}`,
      title: newPortfolioForm.title.trim(),
      category: newPortfolioForm.category.trim() || freelancer?.category || 'Serviço',
      description: newPortfolioForm.description.trim(),
      imageUrl: newPortfolioForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      link: newPortfolioForm.link.trim(),
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    const updatedPortfolio = [newItem, ...(freelancer?.portfolio || [])];
    const targetId = freelancer?.firestoreId || freelancer?.id || currentUser?.uid;

    await updateTalentProfile(targetId, { portfolio: updatedPortfolio });
    setFreelancer(prev => ({ ...prev, portfolio: updatedPortfolio }));
    if (isOwner && currentUser) {
      setCurrentUser({ ...currentUser, portfolio: updatedPortfolio });
    }

    showToast('🎉 Projeto adicionado ao portfólio!');
    setPortfolioModalOpen(false);
    setNewPortfolioForm({ title: '', category: '', description: '', imageUrl: '', link: '' });
  };

  // Remover Item do Portfólio
  const handleRemovePortfolio = async (portId) => {
    if (window.confirm('Deseja remover este item do seu portfólio?')) {
      const updatedPortfolio = (freelancer?.portfolio || []).filter(p => p.id !== portId);
      const targetId = freelancer?.firestoreId || freelancer?.id || currentUser?.uid;

      await updateTalentProfile(targetId, { portfolio: updatedPortfolio });
      setFreelancer(prev => ({ ...prev, portfolio: updatedPortfolio }));
      if (isOwner && currentUser) {
        setCurrentUser({ ...currentUser, portfolio: updatedPortfolio });
      }
      showToast('Item removido do portfólio.');
    }
  };

  // Enviar Avaliação do Visitante
  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Faça login para avaliar este prestador!');
      navigate('/login');
      return;
    }

    if (!reviewForm.comment.trim()) {
      showToast('Escreva um comentário sobre o atendimento recebido.');
      return;
    }

    const newRev = {
      id: `rev_${Date.now()}`,
      authorName: currentUser.name || 'Cliente Verificado',
      authorAvatar: currentUser.avatar || '',
      authorEmail: currentUser.email || '',
      rating: Number(reviewForm.rating) || 5,
      comment: reviewForm.comment.trim(),
      date: new Date().toLocaleDateString('pt-BR')
    };

    const targetId = freelancer?.firestoreId || freelancer?.id;
    const updatedReviews = [newRev, ...currentReviews];
    const newRatingVal = (
      updatedReviews.reduce((sum, r) => sum + Number(r.rating), 0) / updatedReviews.length
    ).toFixed(1);

    try {
      if (targetId) {
        const docRef = doc(db, 'users', String(targetId));
        await updateDoc(docRef, {
          reviews: arrayUnion(newRev),
          rating: Number(newRatingVal),
          reviewsCount: updatedReviews.length
        });
      }
    } catch {}

    updateTalentProfile(targetId, {
      reviews: updatedReviews,
      rating: Number(newRatingVal),
      reviewsCount: updatedReviews.length
    });

    setFreelancer(prev => ({
      ...prev,
      reviews: updatedReviews,
      rating: Number(newRatingVal),
      reviewsCount: updatedReviews.length
    }));

    showToast('⭐ Avaliação enviada com sucesso! Obrigado pelo feedback.');
    setReviewModalOpen(false);
    setReviewForm({ rating: 5, comment: '' });
  };

  // Compartilhar Perfil
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('📋 Link do perfil copiado para a área de transferência!');
    } else {
      showToast(url);
    }
  };

  // Iniciar conversa via WhatsApp
  const handleWhatsAppContact = () => {
    const targetPhone = freelancer?.whatsapp || freelancer?.phone;
    if (!targetPhone) {
      showToast('Este prestador ainda não cadastrou um número de WhatsApp.');
      return;
    }
    const msg = `Olá, ${freelancer?.name}! Encontrei seu perfil no Ivaí Conecta e gostaria de solicitar um orçamento para prestação de serviços.`;
    const waLink = generateWhatsAppLink(targetPhone, msg);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  // Iniciar conversa no Chat Interno
  const handleInternalChat = async () => {
    if (!currentUser) {
      showToast('Faça login para conversar no chat!');
      navigate('/login');
      return;
    }
    if (isOwner) {
      showToast('Você já está em sua própria conta!');
      return;
    }
    const targetEmail = freelancer?.email || `${(freelancer?.name || 'freelancer').toLowerCase().replace(/\s+/g, '')}@ivaiconecta.com.br`;
    await startChatWith({
      name: freelancer?.name || 'Prestador de Serviço',
      email: targetEmail,
      role: 'freelancer',
      avatar: freelancer?.avatar || ''
    }, `Orçamento e Contratação com ${freelancer?.name}`);
  };

  if (loadingUser && !freelancer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Carregando perfil do prestador...</p>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="container section text-center py-20">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 text-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wrench size={32} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-primary-dark dark:text-white mb-2">
          Perfil de Freelancer não encontrado
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
          O prestador solicitado não existe ou ainda não completou seu cadastro público no Ivaí Conecta.
        </p>
        <Link to="/servicos" className="btn btn-primary">
          <ArrowLeft size={16} /> Explorar Serviços Locais
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* ── HERO & HEADER BANNER ── */}
      <section className="relative bg-gradient-to-b from-blue-900 via-primary-dark to-slate-900 text-white pt-10 pb-16 px-4 border-b border-slate-800">
        <div className="container relative z-10">
          
          {/* Breadcrumb / Top actions */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Voltar para Serviços
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/15 transition-all cursor-pointer"
            >
              <Share2 size={13} /> Compartilhar Perfil
            </button>
          </div>

          {/* Profile Card Main Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            
            {/* Avatar com upload */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-white/20 shadow-brand-xl bg-slate-800 flex items-center justify-center">
                {freelancer.avatar && freelancer.avatar.trim() !== '' ? (
                  <img
                    src={freelancer.avatar}
                    alt={freelancer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-primary-blue to-accent-sky text-white font-heading font-extrabold text-4xl">
                    {freelancer.name?.charAt(0) || 'F'}
                  </div>
                )}
              </div>

              {isOwner && (
                <label className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-primary-blue text-white hover:bg-primary-hover shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer transition-transform hover:scale-105">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
            </div>

            {/* Informações centrais */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                  <ShieldCheck size={14} className="text-green-400" /> Prestador Verificado
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Wrench size={13} /> {freelancer.category || 'Serviços Especializados'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white leading-tight">
                {freelancer.name}
              </h1>

              <p className="text-lg text-blue-200 font-medium mt-1">
                {freelancer.profession || 'Especialista Autônomo'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-accent-sky" /> {freelancer.city || 'Ivaiporã'} · Vale do Ivaí
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <strong className="text-white">{averageRating}</strong> ({currentReviews.length || freelancer.reviewsCount || 0} avaliações)
                </span>
                {freelancer.priceRange && (
                  <span className="inline-flex items-center gap-1.5 text-accent-green font-semibold">
                    <Sparkles size={14} /> {freelancer.priceRange}
                  </span>
                )}
              </div>

              {/* Bio curta no hero */}
              {freelancer.bio && (
                <p className="mt-4 text-sm text-slate-300 line-clamp-2 max-w-2xl">
                  {freelancer.bio}
                </p>
              )}
            </div>

            {/* Ações primárias no topo */}
            <div className="flex flex-row md:flex-col items-center gap-3 shrink-0 w-full md:w-auto justify-center">
              {isOwner ? (
                <>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="btn btn-primary w-full sm:w-auto px-5 py-3 rounded-2xl shadow-lg gap-2 text-sm font-bold cursor-pointer"
                  >
                    <Edit3 size={16} /> Editar Perfil
                  </button>
                  <button
                    onClick={() => setServiceModalOpen(true)}
                    className="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 w-full sm:w-auto px-5 py-3 rounded-2xl shadow-lg gap-2 text-sm font-bold cursor-pointer"
                  >
                    <Plus size={16} /> Anunciar Serviço
                  </button>
                </>
              ) : (
                <>
                  {(freelancer.whatsapp || freelancer.phone) && (
                    <button
                      onClick={handleWhatsAppContact}
                      className="btn bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto px-5 py-3 rounded-2xl shadow-lg gap-2 text-sm font-bold cursor-pointer"
                    >
                      <Phone size={16} /> Chamar no WhatsApp
                    </button>
                  )}
                  <button
                    onClick={handleInternalChat}
                    className="btn btn-primary w-full sm:w-auto px-5 py-3 rounded-2xl shadow-lg gap-2 text-sm font-bold cursor-pointer"
                  >
                    <MessageSquare size={16} /> Conversar no Chat
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-10 pt-8 border-t border-slate-800">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-heading font-extrabold text-white">
                {myServices.length}
              </span>
              <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Serviços Ativos
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-heading font-extrabold text-amber-400">
                {averageRating} ★
              </span>
              <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Avaliação Média
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-heading font-extrabold text-accent-sky">
                {(freelancer.portfolio || []).length}
              </span>
              <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Projetos no Portfólio
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="block text-lg font-heading font-bold text-white truncate">
                {freelancer.city || 'Ivaiporã'}
              </span>
              <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Base Regional
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── TABS NAVIGATION ── */}
      <div className="sticky top-[74px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="container">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-3.5 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'services'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-bold'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Wrench size={16} /> Serviços Anunciados
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300 font-bold">
                {myServices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-3.5 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-bold'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FolderGit2 size={16} /> Portfólio &amp; Galeria
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold">
                {(freelancer.portfolio || []).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`py-3.5 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'skills'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-bold'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Award size={16} /> Especialidades &amp; Habilidades
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`py-3.5 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'about'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-bold'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Briefcase size={16} /> Sobre &amp; Atendimento
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3.5 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-bold'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Star size={16} /> Avaliações
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                {currentReviews.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT AREA ── */}
      <main className="container py-10">
        
        {/* ── TAB 1: SERVIÇOS ANUNCIADOS ── */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-primary-dark dark:text-white">
                  Catálogo de Serviços Ativos
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Serviços prestados por {freelancer.name} com orçamentos e solicitação direta.
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setServiceModalOpen(true)}
                  className="btn btn-primary rounded-xl text-sm font-bold gap-2 cursor-pointer shrink-0"
                >
                  <Plus size={16} /> Publicar Novo Serviço
                </button>
              )}
            </div>

            {myServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myServices.map((service) => (
                  <div
                    key={service.id || service.firestoreId}
                    className="card hover:border-primary-blue/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="badge-endorsement">
                          {service.category || 'Serviço'}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
                          <MapPin size={13} /> {service.city || freelancer.city}
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteService(service.id || service.firestoreId, service.title || service.name)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1 cursor-pointer"
                              title="Excluir anúncio de serviço"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                        {service.title || service.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-sm my-2">
                        <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
                        <span className="font-bold text-gray-800 dark:text-slate-200">
                          {service.rating ? Number(service.rating).toFixed(1) : '5.0'}
                        </span>
                        <span className="text-gray-400 dark:text-slate-500 text-xs">
                          ({service.reviewsCount || 0} avaliações)
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {isOwner ? (
                        <div className="w-full text-center text-xs py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary-blue dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60">
                          ✨ Seu anúncio ativo no Marketplace
                        </div>
                      ) : (
                        <>
                          {(freelancer.whatsapp || freelancer.phone || service.phone) && (
                            <button
                              onClick={() => {
                                const phoneNum = service.phone || freelancer.whatsapp || freelancer.phone;
                                const msg = `Olá! Vi seu anúncio do serviço "${service.title || service.name}" no Ivaí Conecta e gostaria de solicitar um orçamento.`;
                                window.open(generateWhatsAppLink(phoneNum, msg), '_blank');
                              }}
                              className="btn btn-outline btn-sm flex-1 text-xs gap-1.5 font-bold cursor-pointer"
                            >
                              <Phone size={13} /> Orçamento
                            </button>
                          )}
                          <button
                            onClick={handleInternalChat}
                            className="btn btn-primary btn-sm flex-1 text-xs gap-1.5 font-bold cursor-pointer"
                          >
                            <MessageSquare size={13} /> Conversar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wrench size={28} />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-800 dark:text-white mb-2">
                  Nenhum serviço anunciado ainda
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  {isOwner
                    ? 'Cadastre agora mesmo os serviços e especialidades que você oferece para começar a receber pedidos de orçamento da região.'
                    : 'Este profissional ainda não possui anúncios específicos publicados nesta categoria.'}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setServiceModalOpen(true)}
                    className="btn btn-primary rounded-xl font-bold cursor-pointer"
                  >
                    <Plus size={16} /> Cadastrar Primeiro Serviço
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PORTFÓLIO & GALERIA ── */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-primary-dark dark:text-white">
                  Portfólio de Trabalhos &amp; Projetos
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Exemplos reais de projetos executados, reformas, soluções e criações.
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setPortfolioModalOpen(true)}
                  className="btn btn-primary rounded-xl text-sm font-bold gap-2 cursor-pointer shrink-0"
                >
                  <Plus size={16} /> Adicionar Trabalho
                </button>
              )}
            </div>

            {(freelancer.portfolio || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(freelancer.portfolio || []).map((item) => (
                  <div
                    key={item.id}
                    className="card p-0 overflow-hidden hover:shadow-brand-lg transition-all flex flex-col group border border-gray-200 dark:border-slate-800"
                  >
                    {item.imageUrl ? (
                      <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isOwner && (
                          <button
                            onClick={() => handleRemovePortfolio(item.id)}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer"
                            title="Remover projeto"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-slate-500 relative">
                        <FolderGit2 size={36} />
                        {isOwner && (
                          <button
                            onClick={() => handleRemovePortfolio(item.id)}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {item.category && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-blue dark:text-blue-400 block mb-1">
                            {item.category}
                          </span>
                        )}
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {item.link && (
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                          <a
                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-blue dark:text-blue-400 hover:underline"
                          >
                            <ExternalLink size={13} /> Acessar Link do Trabalho
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderGit2 size={28} />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-800 dark:text-white mb-2">
                  Portfólio em Construção
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  {isOwner
                    ? 'Adicione fotos de serviços realizados, antes e depois, ou links para comprovar a qualidade do seu trabalho.'
                    : 'Este prestador ainda não publicou amostras em seu portfólio digital.'}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setPortfolioModalOpen(true)}
                    className="btn btn-primary rounded-xl font-bold cursor-pointer"
                  >
                    <Plus size={16} /> Adicionar Primeiro Trabalho
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ESPECIALIDADES & HABILIDADES ── */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-primary-dark dark:text-white">
                  Especialidades Técnicas &amp; Ferramentas
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Capacitações práticas e ferramentas dominadas por {freelancer.name}.
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="btn btn-outline rounded-xl text-sm font-bold gap-2 cursor-pointer shrink-0"
                >
                  <Edit3 size={15} /> Gerenciar Habilidades
                </button>
              )}
            </div>

            {(freelancer.skills || []).length > 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs">
                <div className="flex flex-wrap gap-2.5">
                  {(freelancer.skills || []).map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-300 font-semibold text-sm border border-blue-200 dark:border-blue-900/60 shadow-xs flex items-center gap-2"
                    >
                      <Sparkles size={14} className="text-primary-blue dark:text-blue-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award size={28} />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-800 dark:text-white mb-2">
                  Nenhuma habilidade cadastrada
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  {isOwner
                    ? 'Adicione suas especialidades para se destacar nas buscas e ser encontrado por clientes que procuram seu serviço específico.'
                    : 'O profissional ainda não listou suas competências específicas.'}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="btn btn-primary rounded-xl font-bold cursor-pointer"
                  >
                    <Plus size={16} /> Adicionar Habilidades
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: SOBRE & ATENDIMENTO ── */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Bio Principal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs">
                <h2 className="text-xl font-heading font-bold text-primary-dark dark:text-white mb-4">
                  Sobre o Profissional
                </h2>
                {freelancer.bio ? (
                  <p className="text-base text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {freelancer.bio}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-slate-500 italic">
                    Nenhuma descrição biográfica cadastrada ainda.
                  </p>
                )}
              </div>

              {/* Informações de Atendimento */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs space-y-6">
                <h2 className="text-xl font-heading font-bold text-primary-dark dark:text-white">
                  Condições de Atendimento &amp; Disponibilidade
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
                    <Clock size={20} className="text-primary-blue shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                        Horário de Trabalho
                      </span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5 block">
                        {freelancer.workingHours || 'Segunda a Sexta, 08h às 18h'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
                    <MapPin size={20} className="text-accent-sky shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                        Região de Atendimento
                      </span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5 block">
                        {freelancer.coverageArea || 'Ivaiporã e cidades vizinhas'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formas de Pagamento */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CreditCard size={16} className="text-accent-green" /> Formas de Pagamento Aceitas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(freelancer.paymentMethods && freelancer.paymentMethods.length > 0
                      ? freelancer.paymentMethods
                      : ['PIX', 'Dinheiro']
                    ).map((method, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Check size={13} /> {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Lateral: Canais de Contato */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <h3 className="text-lg font-heading font-bold text-primary-dark dark:text-white mb-4">
                  Canais de Contato Direto
                </h3>

                <div className="space-y-3">
                  {(freelancer.whatsapp || freelancer.phone) && (
                    <button
                      onClick={handleWhatsAppContact}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-950/70 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 transition-colors font-bold text-sm cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Phone size={17} /> WhatsApp Oficial
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  )}

                  <button
                    onClick={handleInternalChat}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800/50 text-primary-blue dark:text-blue-300 transition-colors font-bold text-sm cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquare size={17} /> Chat da Plataforma
                    </span>
                    <ChevronRight size={16} />
                  </button>

                  {freelancer.phone && (
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-xs">
                      <span className="text-gray-500 dark:text-slate-400 block font-semibold">Telefone:</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{maskPhone(freelancer.phone)}</span>
                    </div>
                  )}

                  {freelancer.email && (
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-xs truncate">
                      <span className="text-gray-500 dark:text-slate-400 block font-semibold">E-mail:</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-slate-200 truncate">{freelancer.email}</span>
                    </div>
                  )}
                </div>

                {/* Redes Sociais */}
                {(freelancer.instagram || freelancer.linkedin || freelancer.website) && (
                  <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
                      Presença Online
                    </span>
                    <div className="flex flex-col gap-2">
                      {freelancer.instagram && (
                        <a
                          href={`https://instagram.com/${freelancer.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-primary-blue dark:hover:text-blue-400"
                        >
                          <ExternalLink size={13} /> Instagram: {freelancer.instagram}
                        </a>
                      )}
                      {freelancer.website && (
                        <a
                          href={freelancer.website.startsWith('http') ? freelancer.website : `https://${freelancer.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-primary-blue dark:hover:text-blue-400 truncate"
                        >
                          <ExternalLink size={13} /> Site: {freelancer.website}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 5: AVALIAÇÕES DOS CLIENTES ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-primary-dark dark:text-white">
                  Avaliações &amp; Depoimentos de Clientes
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Opiniões verificadas de pessoas que já contrataram os serviços de {freelancer.name}.
                </p>
              </div>

              {!isOwner && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="btn btn-primary rounded-xl text-sm font-bold gap-2 cursor-pointer shrink-0"
                >
                  <Star size={16} /> Avaliar Prestador
                </button>
              )}
            </div>

            {/* Scorecard */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs flex flex-col sm:flex-row items-center justify-around gap-6 text-center sm:text-left">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-heading font-extrabold text-gray-900 dark:text-white">
                  {averageRating}
                </span>
                <div className="flex items-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={20}
                      className={s <= Math.round(Number(averageRating)) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-700'}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  Baseado em {currentReviews.length} avaliações
                </span>
              </div>

              <div className="h-px sm:h-20 w-full sm:w-px bg-gray-200 dark:bg-slate-800" />

              <div className="max-w-md text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                Todas as avaliações no <strong>Ivaí Conecta</strong> são geradas por clientes reais da região do Vale do Ivaí com transparência e autenticidade.
              </div>
            </div>

            {/* Lista de Avaliações */}
            {currentReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="card p-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-blue-950 flex items-center justify-center font-bold text-primary-blue text-sm border border-primary-blue/20">
                          {rev.authorName ? rev.authorName.charAt(0) : 'C'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {rev.authorName}
                          </h4>
                          <span className="text-[11px] text-gray-400 dark:text-slate-500">
                            {rev.date || 'Cliente Verificado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= Number(rev.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-700'}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star size={28} />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-800 dark:text-white mb-2">
                  Ainda sem avaliações registradas
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  {isOwner
                    ? 'Compartilhe seu perfil com seus clientes recentes para que eles deixem recomendações e avaliações estreladas.'
                    : 'Já contratou este prestador? Seja o primeiro a deixar sua avaliação!'}
                </p>
                {!isOwner && (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="btn btn-primary rounded-xl font-bold cursor-pointer"
                  >
                    <Star size={16} /> Deixar Primeira Avaliação
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── MODAL: EDITAR PERFIL FREELANCER ── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-brand-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-heading font-extrabold text-primary-dark dark:text-white">
                  Editar Perfil Profissional
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Atualize suas informações visíveis no catálogo e nos seus serviços
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold">Nome Completo / Comercial *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="input w-full"
                    placeholder="Seu nome ou nome fantasia"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold">Título / Especialidade Principal *</label>
                  <input
                    type="text"
                    required
                    value={editForm.profession}
                    onChange={e => setEditForm(f => ({ ...f, profession: e.target.value }))}
                    className="input w-full"
                    placeholder="Ex: Eletricista Residencial, Designer UI"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold">Categoria de Atuação</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="input w-full"
                  >
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold">Cidade Base</label>
                  <select
                    value={editForm.city}
                    onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    className="input w-full"
                  >
                    {CITIES.filter(c => c !== 'Todas as Cidades').map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold">WhatsApp para Orçamentos</label>
                  <input
                    type="text"
                    value={editForm.whatsapp}
                    onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value }))}
                    className="input w-full"
                    placeholder="(43) 99999-9999"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold">Faixa de Preço / Base</label>
                  <input
                    type="text"
                    value={editForm.priceRange}
                    onChange={e => setEditForm(f => ({ ...f, priceRange: e.target.value }))}
                    className="input w-full"
                    placeholder="Ex: A partir de R$ 80,00 ou A combinar"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold">Sobre Você e Seus Serviços (Bio)</label>
                <textarea
                  rows={4}
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  className="input w-full resize-none"
                  placeholder="Conte sua experiência, diferencial do seu serviço, anos de atuação no Vale do Ivaí..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold">Horário de Atendimento</label>
                  <input
                    type="text"
                    value={editForm.workingHours}
                    onChange={e => setEditForm(f => ({ ...f, workingHours: e.target.value }))}
                    className="input w-full"
                    placeholder="Ex: Seg a Sex, 08h às 18h"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold">Região de Cobertura</label>
                  <input
                    type="text"
                    value={editForm.coverageArea}
                    onChange={e => setEditForm(f => ({ ...f, coverageArea: e.target.value }))}
                    className="input w-full"
                    placeholder="Ex: Ivaiporã e cidades vizinhas em 40km"
                  />
                </div>
              </div>

              {/* Formas de Pagamento Checkboxes */}
              <div>
                <label className="label text-xs font-bold mb-2 block">Formas de Pagamento Aceitas</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAYMENT_OPTIONS.map(opt => {
                    const isChecked = editForm.paymentMethods.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => {
                          setEditForm(f => ({
                            ...f,
                            paymentMethods: isChecked
                              ? f.paymentMethods.filter(p => p !== opt)
                              : [...f.paymentMethods, opt]
                          }));
                        }}
                        className={`text-xs p-2.5 rounded-xl border text-left font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-primary-blue text-primary-blue dark:text-blue-300'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {opt}
                        {isChecked && <Check size={14} className="text-primary-blue dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Habilidades Chips */}
              <div>
                <label className="label text-xs font-bold mb-2 block">Habilidades &amp; Competências</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editForm.newSkill}
                    onChange={e => setEditForm(f => ({ ...f, newSkill: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (editForm.newSkill.trim() && !editForm.skills.includes(editForm.newSkill.trim())) {
                          setEditForm(f => ({
                            ...f,
                            skills: [...f.skills, f.newSkill.trim()],
                            newSkill: ''
                          }));
                        }
                      }
                    }}
                    placeholder="Digite uma competência e aperte Enter ou Adicionar"
                    className="input flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editForm.newSkill.trim() && !editForm.skills.includes(editForm.newSkill.trim())) {
                        setEditForm(f => ({
                          ...f,
                          skills: [...f.skills, f.newSkill.trim()],
                          newSkill: ''
                        }));
                      }
                    }}
                    className="btn btn-outline text-xs px-3 font-bold"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {editForm.skills.map(sk => (
                    <span
                      key={sk}
                      className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-primary-blue dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-blue-900"
                    >
                      {sk}
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, skills: f.skills.filter(s => s !== sk) }))}
                        className="text-blue-400 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Salvar Alterações
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CADASTRAR NOVO SERVIÇO (PADRÃO MODAL DE PUBLICAÇÃO) ── */}
      {serviceModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setServiceModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20 shadow-xs">
                  <Wrench size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Marketplace Regional
                    </span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                      Novo Anúncio
                    </span>
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                    Anunciar Novo Serviço
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateService} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4.5 text-sm">
                
                {/* Título do Serviço */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-teal-600 dark:text-teal-400" />
                    Título ou Especialidade do Serviço <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newServiceForm.title}
                    onChange={e => setNewServiceForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    placeholder="Ex: Instalação & Manutenção Elétrica Residencial"
                  />
                  {/* Sugestões rápidas e intuitivas */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Sugestões:</span>
                    {[
                      'Manutenção Residencial',
                      'Design & Redes Sociais',
                      'Desenvolvimento Web',
                      'Aulas Particulares',
                      'Pintura & Reformas'
                    ].map(sug => (
                      <button
                        type="button"
                        key={sug}
                        onClick={() => setNewServiceForm(f => ({ ...f, title: sug }))}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-teal-50 text-gray-600 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-teal-950/50 dark:text-slate-400 dark:hover:text-teal-300 transition-colors border border-transparent hover:border-teal-200 dark:hover:border-teal-800 cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoria e Cidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Tag size={14} className="text-teal-600 dark:text-teal-400" />
                      Categoria
                    </label>
                    <select
                      value={newServiceForm.category}
                      onChange={e => setNewServiceForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                    >
                      {SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin size={14} className="text-teal-600 dark:text-teal-400" />
                      Cidade de Atuação
                    </label>
                    <select
                      value={newServiceForm.city}
                      onChange={e => setNewServiceForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                    >
                      {CITIES.filter(c => c !== 'Todas as Cidades').map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* WhatsApp / Telefone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone size={14} className="text-teal-600 dark:text-teal-400" />
                    WhatsApp / Telefone para Contato
                  </label>
                  <input
                    type="tel"
                    value={newServiceForm.phone}
                    onChange={e => setNewServiceForm(f => ({ ...f, phone: maskPhone(e.target.value) }))}
                    maxLength={15}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    placeholder="(43) 99999-9999"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">
                    Clientes poderão iniciar uma conversa direta no seu WhatsApp com 1 clique.
                  </p>
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText size={14} className="text-teal-600 dark:text-teal-400" />
                    Descrição do Serviço & Diferenciais
                  </label>
                  <textarea
                    rows={3}
                    value={newServiceForm.description}
                    onChange={e => setNewServiceForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                    placeholder="Descreva o que está incluso, prazos, orçamentos, materiais e garantias oferecidas..."
                  />
                </div>

                {/* Mini Prévia do Anúncio (Intuitiva & Visual) */}
                <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <Eye size={12} /> Prévia no Marketplace
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> Ativo no Catálogo
                    </span>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 font-bold">
                      <Wrench size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">
                          {newServiceForm.category}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
                          <MapPin size={11} className="text-teal-500" /> {newServiceForm.city}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white truncate mt-0.5">
                        {newServiceForm.title.trim() || 'Título do serviço será exibido aqui'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-teal px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-brand-sm hover:shadow-brand-md hover:scale-[1.01] active:scale-95 transition-all"
                >
                  <Sparkles size={14} />
                  <span>Publicar Serviço no Mural</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADICIONAR TRABALHO AO PORTFÓLIO ── */}
      {portfolioModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-brand-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-heading font-extrabold text-primary-dark dark:text-white">
                  Novo Item de Portfólio
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Adicione fotos ou links de serviços que você já realizou
                </p>
              </div>
              <button
                onClick={() => setPortfolioModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPortfolio} className="space-y-4">
              <div>
                <label className="label text-xs font-bold">Título do Projeto / Obra *</label>
                <input
                  type="text"
                  required
                  value={newPortfolioForm.title}
                  onChange={e => setNewPortfolioForm(f => ({ ...f, title: e.target.value }))}
                  className="input w-full"
                  placeholder="Ex: Reforma Elétrica Completa Residencial"
                />
              </div>

              <div>
                <label className="label text-xs font-bold">Categoria / Tipo</label>
                <input
                  type="text"
                  value={newPortfolioForm.category}
                  onChange={e => setNewPortfolioForm(f => ({ ...f, category: e.target.value }))}
                  className="input w-full"
                  placeholder="Ex: Instalação Elétrica, Identidade Visual"
                />
              </div>

              <div>
                <label className="label text-xs font-bold">URL da Imagem de Demonstração</label>
                <input
                  type="url"
                  value={newPortfolioForm.imageUrl}
                  onChange={e => setNewPortfolioForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="input w-full"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="label text-xs font-bold">Link Externo / Rede Social (Opcional)</label>
                <input
                  type="text"
                  value={newPortfolioForm.link}
                  onChange={e => setNewPortfolioForm(f => ({ ...f, link: e.target.value }))}
                  className="input w-full"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="label text-xs font-bold">Descrição do que foi feito</label>
                <textarea
                  rows={3}
                  value={newPortfolioForm.description}
                  onChange={e => setNewPortfolioForm(f => ({ ...f, description: e.target.value }))}
                  className="input w-full resize-none"
                  placeholder="Explique o desafio resolvido, materiais utilizados e o resultado para o cliente..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortfolioModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Adicionar ao Portfólio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AVALIAR PRESTADOR ── */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-brand-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-heading font-extrabold text-primary-dark dark:text-white">
                  Avaliar {freelancer.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Deixe seu feedback sobre a pontualidade e qualidade do atendimento
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendReview} className="space-y-5">
              <div>
                <label className="label text-xs font-bold text-center block mb-2">
                  Qual nota você dá para este atendimento?
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                      className="p-2 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-700'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold">Seu Depoimento / Comentário *</label>
                <textarea
                  rows={4}
                  required
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  className="input w-full resize-none"
                  placeholder="Conte como foi o atendimento, se o prazo foi cumprido e se você recomenda este profissional..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Publicar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
