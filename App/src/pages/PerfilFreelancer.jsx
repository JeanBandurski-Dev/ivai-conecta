import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Wrench, MapPin, Phone, Star, ShieldCheck, CheckCircle2,
  Edit3, ArrowLeft, Plus, MessageSquare, Globe, ExternalLink,
  Briefcase, FileText, Camera
} from 'lucide-react';
import {
  getServices, subscribeToServices, updateAuthUser,
  uploadUserProfilePicture, generateWhatsAppLink, maskPhone,
  getServiceOrders, subscribeToServiceOrders
} from '../lib/ivaiConecta';
import { db } from '../lib/firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import useAppStore from '../store/useAppStore';
import ServiceCard from '../components/ServiceCard';
import SolicitarServicoModal from '../components/SolicitarServicoModal';
import EditFreelancerProfileModal from '../components/EditFreelancerProfileModal';
import PublishServiceModal from '../components/PublishServiceModal';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../services/chatService';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200';

export default function PerfilFreelancer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();

  const freelancerId = id || (currentUser?.role === 'freelancer' ? (currentUser?.uid || currentUser?.id) : null);

  const [liveUserDoc, setLiveUserDoc] = useState(null);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'reviews' ? 'reviews' : 'services'); // 'services' | 'about' | 'reviews'

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab === 'reviews' || requestedTab === 'about' || requestedTab === 'services') {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedServiceToOrder, setSelectedServiceToOrder] = useState(null);

  // Escuta dados em tempo real do documento do usuário no Firestore
  useEffect(() => {
    if (!freelancerId) return;
    try {
      const unsub = onSnapshot(doc(db, 'users', String(freelancerId)), (snap) => {
        if (snap.exists()) {
          setLiveUserDoc({ id: snap.id, firestoreId: snap.id, ...snap.data() });
        }
      }, () => {});
      return () => unsub();
    } catch {}
  }, [freelancerId]);

  // Monta objeto do perfil mesclando Firestore, currentUser e dados de cadastro
  const freelancer = useMemo(() => {
    if (liveUserDoc) return liveUserDoc;
    if (currentUser && (String(currentUser.uid) === String(freelancerId) || String(currentUser.id) === String(freelancerId) || !id)) {
      return currentUser;
    }
    return null;
  }, [liveUserDoc, currentUser, freelancerId, id]);

  const isOwner = Boolean(
    currentUser && freelancer && (
      (currentUser.email && freelancer?.email && currentUser.email.toLowerCase().trim() === freelancer.email.toLowerCase().trim()) ||
      (currentUser.uid != null && (String(currentUser.uid) === String(freelancer?.id) || String(currentUser.uid) === String(freelancer?.firestoreId))) ||
      (currentUser.id != null && String(currentUser.id) === String(freelancer?.id))
    )
  );

  // Escuta serviços reais criados pelo prestador
  const [allServices, setAllServices] = useState(() => getServices('Todas as Cidades'));

  useEffect(() => {
    const unsub = subscribeToServices('Todas as Cidades', (data) => {
      if (Array.isArray(data)) setAllServices(data);
    });
    return () => unsub();
  }, []);

  const providerServices = useMemo(() => {
    if (!freelancer) return [];
    const fUid = String(freelancer.firestoreId || freelancer.id || freelancer.uid || '').trim();

    return allServices.filter(s => {
      const createdBy = String(s.createdBy || '').trim();
      const providerUid = String(s.providerUid || '').trim();

      return Boolean(fUid && (createdBy === fUid || providerUid === fUid));
    });
  }, [allServices, freelancer]);

  // Escuta ordens de serviço para histórico e avaliações do prestador
  const [allOrders, setAllOrders] = useState(() => getServiceOrders());

  useEffect(() => {
    if (!freelancer) return;
    const unsub = subscribeToServiceOrders(freelancer, (relevant, all) => {
      setAllOrders(Array.isArray(relevant) ? relevant : Array.isArray(all) ? all : []);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [freelancer]);

  const completedOrders = useMemo(() => {
    return allOrders.filter(o => o.status === 'concluido' || o.status === 'avaliado');
  }, [allOrders]);

  // Avaliações consolidadas do prestador
  const reviewsList = useMemo(() => {
    const fromOrders = allOrders
      .filter(o => o.status === 'avaliado' && o.review)
      .map(o => ({
        id: `rev_ord_${o.id}`,
        client: o.review.author || o.clientName || 'Cliente Ivaí Conecta',
        stars: Number(o.review.rating) || 5,
        rating: Number(o.review.rating) || 5,
        comment: o.review.comment,
        date: o.review.date || o.createdAt,
        serviceTitle: o.serviceTitle
      }));

    const fromServices = providerServices.flatMap(s => (s.reviews || []).map(r => ({
      ...r,
      serviceTitle: s.title || s.name
    })));

    const combined = [...fromOrders, ...fromServices];
    const unique = [];
    const seen = new Set();
    for (const r of combined) {
      const key = `${r.client || r.author}_${r.comment}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }
    return unique;
  }, [allOrders, providerServices]);

  const ratingScore = useMemo(() => {
    if (reviewsList.length === 0) return freelancer?.rating || 5.0;
    const sum = reviewsList.reduce((acc, r) => acc + (Number(r.stars || r.rating) || 5), 0);
    return Number((sum / reviewsList.length).toFixed(1));
  }, [reviewsList, freelancer]);

  // Estado para edição do perfil
  const [editData, setEditData] = useState({
    name: '',
    specialty: '',
    title: '',
    bio: '',
    city: 'Ivaiporã',
    phone: '',
    cnpj: '',
    experienceYears: '',
    availability: '',
    skills: [],
    projects: [],
    avatar: '',
    banner: ''
  });

  useEffect(() => {
    if (freelancer) {
      setEditData({
        name: freelancer.name || '',
        specialty: freelancer.specialty || freelancer.title || 'Profissional Autônomo',
        title: freelancer.specialty || freelancer.title || 'Profissional Autônomo',
        bio: freelancer.bio || freelancer.description || '',
        city: freelancer.city || 'Ivaiporã',
        phone: freelancer.phone || '',
        cnpj: freelancer.cnpj || '',
        experienceYears: freelancer.experienceYears || '',
        availability: freelancer.availability || 'Disponível para orçamentos e serviços',
        skills: freelancer.skills || [],
        projects: freelancer.projects || [],
        avatar: freelancer.avatar || '',
        banner: freelancer.banner || DEFAULT_COVER
      });
    }
  }, [freelancer]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        name: editData.name,
        specialty: editData.specialty || editData.title,
        title: editData.specialty || editData.title,
        bio: editData.bio,
        city: editData.city,
        phone: editData.phone,
        cnpj: editData.cnpj,
        experienceYears: editData.experienceYears,
        availability: editData.availability,
        skills: editData.skills,
        projects: editData.projects,
        avatar: editData.avatar,
        banner: editData.banner,
        badge: editData.cnpj ? 'Prestador PJ Verificado' : 'Prestador Regional'
      };

      const updated = await updateAuthUser(payload, currentUser);
      if (updated) {
        setCurrentUser(updated);
        setLiveUserDoc(prev => ({ ...prev, ...payload }));
      }
      showToast('Perfil de Freelancer atualizado com sucesso!');
      setEditModalOpen(false);
    } catch {
      showToast('Erro ao atualizar perfil.');
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Enviando foto de perfil...');
    const res = await uploadUserProfilePicture(file, currentUser.uid || currentUser.id);
    if (res.success && res.url) {
      setEditData(prev => ({ ...prev, avatar: res.url }));
      await updateAuthUser({ avatar: res.url }, currentUser);
      showToast('Foto atualizada com sucesso!');
    }
  };

  const handleBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Enviando imagem de capa...');
    const res = await uploadUserProfilePicture(file, currentUser.uid || currentUser.id, 'cover');
    if (res.success && res.url) {
      setEditData(prev => ({ ...prev, banner: res.url }));
      await updateAuthUser({ banner: res.url }, currentUser);
      showToast('Capa atualizada com sucesso!');
    }
  };

  const handleOpenChat = async () => {
    if (!currentUser) {
      showToast('Faça login para conversar com o prestador!');
      return;
    }
    if (isOwner) {
      showToast('Você está visualizando seu próprio perfil.');
      return;
    }

    const targetUser = {
      name: freelancer?.name || 'Prestador de Serviço',
      email: freelancer?.email || '',
      uid: freelancer?.id || freelancer?.firestoreId || '',
      role: 'freelancer',
      avatar: freelancer?.avatar || ''
    };

    await startChatWith(
      targetUser,
      `Contato com Prestador: ${freelancer?.name || 'Profissional'}`,
      null,
      `Olá ${freelancer?.name || ''}! Vi seu perfil no Ivaí Conecta e gostaria de solicitar um orçamento.`
    );
  };

  const whatsappUrl = freelancer?.phone ? generateWhatsAppLink(
    freelancer.phone,
    `Olá ${freelancer.name}! Vi seu perfil profissional no Ivaí Conecta e gostaria de solicitar um orçamento para um serviço.`
  ) : null;

  if (!freelancer) {
    return (
      <div className="container py-20 text-center space-y-4">
        <Wrench size={48} className="mx-auto text-primary-blue/40 animate-pulse" />
        <h2 className="text-xl font-bold font-heading text-gray-800 dark:text-white">Perfil do Freelancer não encontrado</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          O perfil solicitado não está cadastrado ou não possui atividades públicas no momento.
        </p>
        <button onClick={() => navigate('/servicos')} className="btn btn-primary btn-sm text-xs font-bold">
          Explorar Serviços Locais
        </button>
      </div>
    );
  }

  const profileCover = freelancer.banner || DEFAULT_COVER;
  const profileAvatar = freelancer.avatar;
  const profileName = freelancer.name || 'Prestador de Serviços';
  const profileSpecialty = freelancer.specialty || freelancer.title || 'Profissional Autônomo';
  const profileCity = freelancer.city || 'Ivaiporã, PR';

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 transition-colors duration-200">
        
        {/* ── COVER BANNER ── */}
        <div className="relative h-60 sm:h-72 lg:h-80 w-full overflow-hidden bg-slate-900">
          <img
            src={profileCover}
            alt="Capa do Perfil"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Botão Voltar */}
          <div className="container absolute top-6 left-0 right-0 z-10 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft size={14} /> Voltar
            </button>

            {isOwner && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-primary-blue/90 hover:bg-primary-blue backdrop-blur-md px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Edit3 size={14} /> Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* ── HEADER CONTAINER ── */}
        <div className="container relative z-10 -mt-20 sm:-mt-24 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800 shadow-xl space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Avatar + Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gradient-to-tr from-primary-blue to-teal-400 p-1 shadow-xl shrink-0">
                  <div className="w-full h-full rounded-[22px] overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                    {profileAvatar && !isGenericPlaceholderAvatar(profileAvatar) ? (
                      <img src={profileAvatar} alt={profileName} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-tr ${getAvatarGradient(profileName)} flex items-center justify-center text-white text-3xl font-extrabold`}>
                        {profileName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isOwner && (
                    <label
                      className="absolute bottom-2 right-2 p-1.5 rounded-xl bg-primary-blue text-white shadow-md hover:bg-blue-600 transition-colors cursor-pointer"
                      title="Alterar foto de perfil"
                    >
                      <Camera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1 max-w-full">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white break-words [overflow-wrap:anywhere] max-w-full">
                      {profileName}
                    </h1>
                    {freelancer.cnpj ? (
                      <span className="badge bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-800 text-[11px] font-bold py-0.5 px-2.5 rounded-full flex items-center gap-1">
                        <ShieldCheck size={13} /> CNPJ / MEI Verificado
                      </span>
                    ) : (
                      <span className="badge bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold py-0.5 px-2.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={13} /> Prestador Regional
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-primary-blue dark:text-blue-400">
                    {profileSpecialty}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 dark:text-slate-400 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-primary-blue" /> {profileCity} • Vale do Ivaí
                    </span>
                    {freelancer.phone && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                          <Phone size={13} /> {maskPhone(freelancer.phone)}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {ratingScore.toFixed(1)} ({reviewsList.length} {reviewsList.length === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                {isOwner ? (
                  <>
                    <Link
                      to="/servicos?view=orders"
                      className="btn btn-outline btn-sm text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <FileText size={14} className="text-primary-blue" /> Minhas Demandas &amp; Pedidos
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPublishModalOpen(true)}
                      className="btn btn-teal btn-sm text-xs font-bold shadow-md rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Novo Serviço
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenChat}
                      className="btn btn-primary btn-sm text-xs font-bold shadow-md rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={14} /> Conversar no Chat
                    </button>

                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm text-xs font-bold border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-xl flex items-center gap-1.5"
                      >
                        <Phone size={14} className="text-green-600" /> WhatsApp
                      </a>
                    )}

                    {providerServices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedServiceToOrder(providerServices[0])}
                        className="btn btn-teal btn-sm text-xs font-bold shadow-md rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={14} /> Solicitar Orçamento
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>

            {/* ── BARRA DE ESTATÍSTICAS DO PRESTADOR ── */}
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center space-y-0.5 border border-gray-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Serviços no Ar</span>
                <div className="text-2xl font-extrabold text-primary-dark dark:text-white">{providerServices.length}</div>
                <span className="text-[10px] text-primary-blue font-semibold">Anúncios ativos</span>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center space-y-0.5 border border-gray-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Atendimentos</span>
                <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{completedOrders.length}</div>
                <span className="text-[10px] text-teal-600 font-semibold">Serviços concluídos</span>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center space-y-0.5 border border-gray-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nota Média</span>
                <div className="text-2xl font-extrabold text-amber-500 flex items-center justify-center gap-1">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                  {ratingScore.toFixed(1)}
                </div>
                <span className="text-[10px] text-amber-600 font-semibold">{reviewsList.length} avaliações</span>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center space-y-0.5 border border-gray-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Modalidade</span>
                <div className="text-sm font-extrabold text-gray-800 dark:text-slate-100 pt-1 truncate">
                  PJ / Autônomo
                </div>
                <span className="text-[10px] text-green-600 font-semibold">Emissão de Nota / Recibo</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── TABS NAVEGAÇÃO INTERNA ── */}
        <div className="container space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800'
              }`}
            >
              <Briefcase size={16} /> Serviços Oferecidos ({providerServices.length})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'about'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800'
              }`}
            >
              <Wrench size={16} /> Sobre &amp; Especialidades
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800'
              }`}
            >
              <Star size={16} className="text-amber-400 fill-amber-400" /> Avaliações dos Clientes ({reviewsList.length})
            </button>
          </div>

          {/* ── TAB 1: SERVIÇOS OFERECIDOS ── */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {providerServices.length === 0 ? (
                <div className="card p-12 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-3">
                  <Briefcase size={44} className="mx-auto text-gray-300 dark:text-slate-600" />
                  <h3 className="font-heading text-lg font-bold text-gray-800 dark:text-white">
                    Nenhum anúncio de serviço cadastrado no momento
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                    {isOwner
                      ? 'Você ainda não cadastrou seus serviços no marketplace. Publique suas atividades para começar a receber demandas.'
                      : 'Este prestador ainda não publicou anúncios detalhados de serviço, mas você pode entrar em contato diretamente pelo chat.'}
                  </p>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setPublishModalOpen(true)}
                      className="btn btn-teal btn-sm text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 mx-auto"
                    >
                      <Plus size={14} /> Cadastrar Meu Primeiro Serviço
                    </button>
                  ) : (
                    <button onClick={handleOpenChat} className="btn btn-primary btn-sm text-xs font-bold shadow-md">
                      <MessageSquare size={14} /> Falar com o Prestador
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {providerServices.map(service => (
                    <ServiceCard
                      key={service.id || service.firestoreId}
                      service={service}
                      onRequestService={setSelectedServiceToOrder}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: SOBRE & ESPECIALIDADES ── */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Bio & Apresentação */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-4">
                  <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-primary-blue" /> Apresentação Profissional
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {freelancer.bio || freelancer.description || 'Profissional autônomo com atuação no Vale do Ivaí, dedicado à entrega de serviços de qualidade com pontualidade, atendimento personalizado e compromisso com o cliente.'}
                  </p>
                </div>

                {/* Portfólio de Projetos */}
                <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-4">
                  <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe size={18} className="text-teal-600" /> Portfólio &amp; Trabalhos Realizados
                  </h3>

                  {(!freelancer.projects || freelancer.projects.length === 0) ? (
                    <div className="p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl text-center text-xs text-gray-400">
                      Nenhum projeto registrado no portfólio ainda.
                      {isOwner && (
                        <button
                          onClick={() => setEditModalOpen(true)}
                          className="block mx-auto mt-2 text-primary-blue font-bold hover:underline"
                        >
                          + Adicionar projetos ao portfólio
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {freelancer.projects.map((proj, idx) => (
                        <div
                          key={proj.id || idx}
                          className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700/80 space-y-2 hover:border-primary-blue/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{proj.title}</h4>
                            {proj.link && (
                              <a
                                href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-blue hover:text-blue-700 p-1"
                                title="Ver link externo"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar: Competências & Condições PJ */}
              <div className="space-y-6">
                
                {/* Habilidades */}
                <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-3.5">
                  <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wrench size={16} className="text-primary-blue" /> Competências &amp; Especialidades
                  </h3>

                  {(!freelancer.skills || freelancer.skills.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">Especialidades não preenchidas.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {freelancer.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informações de Atendimento */}
                <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-3 text-xs">
                  <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-600" /> Condições de Atendimento
                  </h3>

                  <div className="space-y-2.5 pt-1 text-gray-600 dark:text-slate-300">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                      <span>Regime:</span>
                      <strong className="text-gray-900 dark:text-white">Prestação de Serviços (PJ)</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                      <span>Cidade Polo:</span>
                      <strong className="text-gray-900 dark:text-white">{profileCity}</strong>
                    </div>

                    {freelancer.experienceYears && (
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                        <span>Experiência:</span>
                        <strong className="text-gray-900 dark:text-white">{freelancer.experienceYears}</strong>
                      </div>
                    )}

                    {freelancer.availability && (
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                        <span>Disponibilidade:</span>
                        <strong className="text-gray-900 dark:text-white">{freelancer.availability}</strong>
                      </div>
                    )}

                    {freelancer.cnpj && (
                      <div className="flex items-center justify-between">
                        <span>Registro / CNPJ:</span>
                        <strong className="text-green-600 dark:text-green-400 font-mono text-[11px]">{freelancer.cnpj}</strong>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── TAB 3: AVALIAÇÕES DOS CLIENTES ── */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Star size={20} className="fill-amber-400 text-amber-400" /> Depoimentos &amp; Avaliações de Clientes
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Feedbacks reais emitidos por clientes ao término de ordens de serviço e demandas concluídas.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-800">
                    <Star size={18} className="fill-amber-500 text-amber-500" />
                    <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                      {ratingScore.toFixed(1)} / 5.0
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      ({reviewsList.length} {reviewsList.length === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </div>
                </div>

                {reviewsList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 dark:text-slate-500 space-y-2">
                    <Star size={36} className="mx-auto text-gray-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm text-gray-600 dark:text-slate-300">Nenhuma avaliação detalhada recebida ainda.</p>
                    <p>As avaliações aparecerão aqui conforme clientes concluírem e avaliarem os atendimentos solicitados.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {reviewsList.map((rev, idx) => (
                      <div
                        key={rev.id || idx}
                        className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-xs text-gray-900 dark:text-white font-bold block">{rev.client || rev.author}</strong>
                            {rev.serviceTitle && (
                              <span className="text-[10px] text-primary-blue dark:text-blue-400 font-semibold">{rev.serviceTitle}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: Math.min(5, Math.max(1, Math.round(rev.stars || rev.rating || 5))) }).map((_, i) => (
                              <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-slate-300 italic leading-relaxed">
                          "{rev.comment}"
                        </p>

                        {rev.date && (
                          <span className="text-[10px] text-gray-400 block pt-1">{rev.date}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal: Editar Perfil Freelancer */}
      {editModalOpen && (
        <EditFreelancerProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          editData={editData}
          setEditData={setEditData}
          handleSaveProfile={handleSaveProfile}
          handleAvatarFileChange={handleAvatarFileChange}
          handleBannerFileChange={handleBannerFileChange}
        />
      )}

      {/* Modal: Solicitar Serviço */}
      {selectedServiceToOrder && (
        <SolicitarServicoModal
          service={selectedServiceToOrder}
          onClose={() => setSelectedServiceToOrder(null)}
          onSuccess={() => {
            setSelectedServiceToOrder(null);
            showToast('Demanda enviada com sucesso ao prestador!');
          }}
        />
      )}

      {/* Modal: Publicar Novo Serviço */}
      {publishModalOpen && (
        <PublishServiceModal
          onClose={() => setPublishModalOpen(false)}
          onSuccess={(created) => {
            setAllServices(prev => [created, ...prev.filter(s => s.id !== created.id && s.firestoreId !== created.id)]);
            setActiveTab('services');
            setPublishModalOpen(false);
          }}
        />
      )}
    </>
  );
}
