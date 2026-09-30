import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  User, MapPin, Briefcase, Star, MessageSquare, Phone,
  Share2, Edit3, Camera, Plus, Trash2, CheckCircle2,
  AlertCircle, Globe, ExternalLink, Sparkles, ShieldCheck,
  Clock, CreditCard, Check, X, Loader2, ArrowLeft,
  Image as ImageIcon, FolderPlus, Send, Link as LinkIcon,
  ChevronDown
} from 'lucide-react';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  CITIES, maskPhone, generateWhatsAppLink,
  WHATSAPP_MESSAGE_PRESETS, getServices, deleteService, addService,
  uploadUserProfilePicture, uploadUserCoverPicture, updateAuthUser,
  DEFAULT_AVATAR, DEFAULT_COVER, DEFAULT_BANNER
} from '../lib/ivaiConecta';
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function IconGithub({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const COVER_PRESETS = [
  { id: 'tech', name: 'Tecnologia & Dev', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1600' },
  { id: 'design', name: 'Design & Criativo', url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1600' },
  { id: 'tools', name: 'Serviços & Obras', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1600' },
  { id: 'business', name: 'Consultoria & Gestão', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600' },
  { id: 'minimal', name: 'Gradiente Moderno', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1600' }
];

const FREELANCER_CATEGORIES = [
  'Desenvolvimento & Programação',
  'Design & Identidade Visual',
  'Construção & Reformas',
  'Eletricista & Instalações',
  'Manutenção & Reparos',
  'Marketing & Redes Sociais',
  'Fotografia & Vídeo',
  'Aulas & Reforço Escolar',
  'Consultoria & Finanças',
  'Eventos & Gastronomia',
  'Beleza & Bem-Estar',
  'Outros Serviços'
];

const PAYMENT_METHODS = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto Bancário',
  'Dinheiro',
  'Emissão de Nota Fiscal (MEI/PJ)'
];

export default function PerfilFreelancer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('sobre'); // 'sobre' | 'servicos' | 'portfolio' | 'avaliacoes'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newServiceModalOpen, setNewServiceModalOpen] = useState(false);
  const [newPortfolioModalOpen, setNewPortfolioModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [selectedWhatsAppPreset, setSelectedWhatsAppPreset] = useState(WHATSAPP_MESSAGE_PRESETS[0]?.id || 'orcamento');

  // Upload States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Edit Form State
  const [activeEditTab, setActiveEditTab] = useState('visual');
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // New Service Form State
  const [newService, setNewService] = useState({
    title: '',
    category: 'Desenvolvimento & Programação',
    price: '',
    priceType: 'sob_consulta',
    city: 'Ivaiporã',
    description: '',
    deliveryTime: ''
  });
  const [savingService, setSavingService] = useState(false);

  // New Portfolio Item Form State
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    link: ''
  });
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  // New Review Form State
  const [newReview, setNewReview] = useState({
    client: '',
    stars: 5,
    comment: ''
  });
  const [savingReview, setSavingReview] = useState(false);

  // User Services List (Live Firestore)
  const [freelancerServices, setFreelancerServices] = useState([]);

  // Tag Input State
  const [specialtyInput, setSpecialtyInput] = useState('');

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // ── 1. Determinação Estrita de Autorização (Dono do Perfil) ──
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    if (!id || id === 'freelancer' || id === 'me') return true;
    const targetId = String(id).toLowerCase().trim();
    const myUid = String(currentUser.uid || '').toLowerCase().trim();
    const myId = String(currentUser.id || '').toLowerCase().trim();
    const myEmail = String(currentUser.email || '').toLowerCase().trim();
    const myName = String(currentUser.name || '').toLowerCase().trim();

    return (
      (myUid && targetId === myUid) ||
      (myId && targetId === myId) ||
      (myEmail && targetId === myEmail) ||
      (myName && targetId === myName) ||
      (profile && profile.uid && myUid === String(profile.uid).toLowerCase()) ||
      (profile && profile.email && myEmail === String(profile.email).toLowerCase())
    );
  }, [currentUser, id, profile]);

  // ── 2. Carregar Dados do Perfil do Firestore ──
  useEffect(() => {
    let isMounted = true;

    async function loadFreelancerProfile() {
      setLoading(true);

      // Caso 1: Rota própria "/freelancer" ou dono logado acessando
      if (!id || id === 'freelancer' || id === 'me') {
        if (currentUser) {
          try {
            const uid = currentUser.uid || currentUser.id;
            const snap = await getDoc(doc(db, 'users', String(uid)));
            const firestoreData = snap.exists() ? snap.data() : {};
            const merged = {
              uid: currentUser.uid || currentUser.id,
              id: currentUser.uid || currentUser.id,
              name: currentUser.name || 'Prestador de Serviços',
              email: currentUser.email || '',
              role: 'freelancer',
              title: firestoreData.title || currentUser.title || 'Profissional Autônomo & Freelancer',
              category: firestoreData.category || currentUser.category || 'Desenvolvimento & Programação',
              city: firestoreData.city || currentUser.city || 'Ivaiporã',
              avatar: firestoreData.avatar || currentUser.avatar || DEFAULT_AVATAR,
              coverUrl: firestoreData.banner || firestoreData.coverUrl || currentUser.banner || DEFAULT_COVER,
              bio: firestoreData.bio || currentUser.bio || '',
              phone: firestoreData.phone || currentUser.phone || currentUser.whatsapp || '',
              whatsapp: firestoreData.whatsapp || currentUser.whatsapp || currentUser.phone || '',
              experienceYears: firestoreData.experienceYears || currentUser.experienceYears || '3+ anos',
              availability: firestoreData.availability || currentUser.availability || 'Disponível para novos projetos',
              modality: firestoreData.modality || currentUser.modality || 'Presencial e Remoto',
              specialties: Array.isArray(firestoreData.specialties) ? firestoreData.specialties : (currentUser.specialties || ['Atendimento Rápido', 'Qualidade Garantida']),
              serviceCities: Array.isArray(firestoreData.serviceCities) ? firestoreData.serviceCities : (currentUser.serviceCities || ['Ivaiporã', 'Jardim Alegre', 'São João do Ivaí']),
              paymentMethods: Array.isArray(firestoreData.paymentMethods) ? firestoreData.paymentMethods : (currentUser.paymentMethods || ['PIX', 'Cartão de Crédito', 'Dinheiro']),
              pixKey: firestoreData.pixKey || currentUser.pixKey || '',
              instagram: firestoreData.instagram || currentUser.instagram || '',
              linkedin: firestoreData.linkedin || currentUser.linkedin || '',
              github: firestoreData.github || currentUser.github || '',
              website: firestoreData.website || currentUser.website || '',
              behance: firestoreData.behance || currentUser.behance || '',
              portfolioItems: Array.isArray(firestoreData.portfolioItems) ? firestoreData.portfolioItems : [],
              reviews: Array.isArray(firestoreData.reviews) ? firestoreData.reviews : [],
              rating: firestoreData.rating || currentUser.rating || 5.0,
              reviewsCount: firestoreData.reviewsCount || (firestoreData.reviews ? firestoreData.reviews.length : 0),
              verifiedFreelancer: firestoreData.verifiedFreelancer ?? true,
              ...(firestoreData || {})
            };

            if (isMounted) {
              setProfile(merged);
              setFormData(merged);
            }
          } catch (err) {
            console.warn('[PerfilFreelancer] Erro ao buscar próprio perfil:', err);
            if (isMounted && currentUser) {
              setProfile(currentUser);
              setFormData(currentUser);
            }
          }
        } else {
          navigate('/login');
          return;
        }
        if (isMounted) setLoading(false);
        return;
      }

      // Caso 2: Visualização de perfil por ID / UID
      try {
        const targetId = decodeURIComponent(id).trim();
        let targetDoc = null;

        const directSnap = await getDoc(doc(db, 'users', targetId));
        if (directSnap.exists()) {
          targetDoc = { id: directSnap.id, uid: directSnap.id, ...directSnap.data() };
        } else {
          const q1 = query(collection(db, 'users'), where('email', '==', targetId.toLowerCase()));
          const s1 = await getDocs(q1);
          if (!s1.empty) {
            targetDoc = { id: s1.docs[0].id, uid: s1.docs[0].id, ...s1.docs[0].data() };
          }
        }

        if (targetDoc) {
          const formatted = {
            uid: targetDoc.uid || targetDoc.id,
            id: targetDoc.id,
            name: targetDoc.name || 'Prestador de Serviços',
            email: targetDoc.email || '',
            role: targetDoc.role || 'freelancer',
            title: targetDoc.title || 'Profissional Autônomo & Freelancer',
            category: targetDoc.category || 'Serviços Gerais',
            city: targetDoc.city || 'Ivaiporã',
            avatar: targetDoc.avatar || DEFAULT_AVATAR,
            coverUrl: targetDoc.banner || targetDoc.coverUrl || DEFAULT_COVER,
            bio: targetDoc.bio || '',
            phone: targetDoc.phone || targetDoc.whatsapp || '',
            whatsapp: targetDoc.whatsapp || targetDoc.phone || '',
            experienceYears: targetDoc.experienceYears || '2+ anos',
            availability: targetDoc.availability || 'Disponível para novos atendimentos',
            modality: targetDoc.modality || 'Presencial e Remoto',
            specialties: Array.isArray(targetDoc.specialties) ? targetDoc.specialties : ['Atendimento Profissional'],
            serviceCities: Array.isArray(targetDoc.serviceCities) ? targetDoc.serviceCities : [targetDoc.city || 'Ivaiporã'],
            paymentMethods: Array.isArray(targetDoc.paymentMethods) ? targetDoc.paymentMethods : ['PIX', 'Dinheiro'],
            pixKey: targetDoc.pixKey || '',
            instagram: targetDoc.instagram || '',
            linkedin: targetDoc.linkedin || '',
            github: targetDoc.github || '',
            website: targetDoc.website || '',
            behance: targetDoc.behance || '',
            portfolioItems: Array.isArray(targetDoc.portfolioItems) ? targetDoc.portfolioItems : [],
            reviews: Array.isArray(targetDoc.reviews) ? targetDoc.reviews : [],
            rating: targetDoc.rating || 5.0,
            reviewsCount: targetDoc.reviewsCount || (targetDoc.reviews ? targetDoc.reviews.length : 0),
            verifiedFreelancer: targetDoc.verifiedFreelancer ?? true,
            ...targetDoc
          };
          if (isMounted) {
            setProfile(formatted);
            setFormData(formatted);
          }
        } else {
          // Fallback buscando em services para montar perfil dinâmico
          const allServices = getServices('Todas as Cidades');
          const matchedService = allServices.find(s =>
            String(s.id) === targetId ||
            s.firestoreId === targetId ||
            (s.createdBy && String(s.createdBy).toLowerCase() === targetId.toLowerCase()) ||
            (s.providerEmail && s.providerEmail.toLowerCase() === targetId.toLowerCase())
          );

          if (matchedService) {
            const fallbackProfile = {
              uid: matchedService.createdBy || matchedService.firestoreId || matchedService.id,
              id: matchedService.id,
              name: matchedService.providerName || matchedService.name || 'Prestador de Serviços',
              email: matchedService.providerEmail || '',
              role: 'freelancer',
              title: matchedService.title || matchedService.category,
              category: matchedService.category || 'Serviços Especializados',
              city: matchedService.city || 'Ivaiporã',
              avatar: matchedService.avatar || DEFAULT_AVATAR,
              coverUrl: matchedService.banner || DEFAULT_COVER,
              bio: matchedService.description || '',
              phone: matchedService.phone || '',
              whatsapp: matchedService.phone || '',
              rating: matchedService.rating || 5.0,
              reviewsCount: matchedService.reviewsCount || (matchedService.reviews ? matchedService.reviews.length : 0),
              reviews: matchedService.reviews || [],
              specialties: [matchedService.category || 'Atendimento Regional'],
              serviceCities: [matchedService.city || 'Ivaiporã'],
              paymentMethods: ['PIX', 'Dinheiro', 'Cartão'],
              portfolioItems: [],
              verifiedFreelancer: true
            };
            if (isMounted) {
              setProfile(fallbackProfile);
              setFormData(fallbackProfile);
            }
          }
        }
      } catch (loadErr) {
        console.warn('[PerfilFreelancer] Erro ao carregar perfil:', loadErr);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFreelancerProfile();

    return () => { isMounted = false; };
  }, [id, currentUser, navigate]);

  // ── 3. Sincronizar Serviços deste Freelancer em Tempo Real ──
  useEffect(() => {
    if (!profile) return;
    const targetUid = profile.uid || profile.id;
    const targetEmail = (profile.email || '').toLowerCase().trim();
    const targetName = (profile.name || '').toLowerCase().trim();

    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
      const mine = all.filter(s =>
        (s.createdBy && targetUid && String(s.createdBy) === String(targetUid)) ||
        (s.providerEmail && targetEmail && s.providerEmail.toLowerCase().trim() === targetEmail) ||
        (s.providerName && targetName && s.providerName.toLowerCase().trim() === targetName)
      );
      setFreelancerServices(mine);
    }, () => {
      const local = getServices('Todas as Cidades').filter(s =>
        (s.createdBy && targetUid && String(s.createdBy) === String(targetUid)) ||
        (s.providerEmail && targetEmail && s.providerEmail.toLowerCase().trim() === targetEmail) ||
        (s.providerName && targetName && s.providerName.toLowerCase().trim() === targetName)
      );
      setFreelancerServices(local);
    });

    return () => unsub();
  }, [profile]);

  // ── 4. Upload de Foto de Perfil / Avatar com Validação ──
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Formato inválido. Por favor, envie uma imagem (JPG, PNG ou WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ A imagem selecionada excede o limite máximo permitido de 5MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const uid = profile?.uid || currentUser?.uid || 'current_user';
      const res = await uploadUserProfilePicture(file, uid);
      if (res.success && res.url) {
        setProfile(prev => ({ ...prev, avatar: res.url }));
        setFormData(prev => ({ ...prev, avatar: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, avatar: res.url });
        }
        showToast('🎉 Foto de perfil atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao carregar a foto.');
      }
    } catch {
      showToast('Falha no upload da foto. Tente novamente.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── 5. Upload de Imagem de Capa / Banner com Validação ──
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Formato inválido. Por favor, envie uma imagem (JPG, PNG ou WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('⚠️ A imagem de capa excede o limite máximo de 8MB.');
      return;
    }

    setUploadingCover(true);
    try {
      const uid = profile?.uid || currentUser?.uid || 'current_user';
      const res = await uploadUserCoverPicture(file, uid);
      if (res.success && res.url) {
        setProfile(prev => ({ ...prev, coverUrl: res.url, banner: res.url }));
        setFormData(prev => ({ ...prev, coverUrl: res.url, banner: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, banner: res.url, coverUrl: res.url });
        }
        showToast('🎉 Imagem de capa atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao carregar a capa.');
      }
    } catch {
      showToast('Falha no upload da capa.');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // ── 6. Salvar Alterações Gerais do Perfil com Validação ──
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!isOwner) {
      showToast('⚠️ Ação não autorizada. Você só pode editar o seu próprio perfil.');
      return;
    }

    const errors = {};
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'Informe seu nome completo ou razão comercial (mínimo 3 letras).';
    }
    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Informe seu título profissional (ex: Eletricista, Desenvolvedor Web).';
    }
    if (!formData.category) {
      errors.category = 'Selecione a categoria principal de atuação.';
    }
    if (!formData.city) {
      errors.city = 'Selecione sua cidade base.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('⚠️ Verifique os campos destacados no formulário.');
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      const uid = profile.uid || currentUser.uid || currentUser.id;
      const updatedPayload = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        category: formData.category,
        city: formData.city,
        bio: formData.bio || '',
        phone: formData.phone || '',
        whatsapp: formData.whatsapp || formData.phone || '',
        experienceYears: formData.experienceYears || '',
        availability: formData.availability || '',
        modality: formData.modality || 'Presencial e Remoto',
        specialties: formData.specialties || [],
        serviceCities: formData.serviceCities || [formData.city],
        paymentMethods: formData.paymentMethods || ['PIX'],
        pixKey: formData.pixKey || '',
        instagram: formData.instagram || '',
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        website: formData.website || '',
        behance: formData.behance || '',
        avatar: formData.avatar || profile.avatar || DEFAULT_AVATAR,
        banner: formData.coverUrl || profile.coverUrl || DEFAULT_COVER,
        coverUrl: formData.coverUrl || profile.coverUrl || DEFAULT_COVER,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', String(uid)), updatedPayload, { merge: true });

      updateAuthUser(updatedPayload);
      if (currentUser) {
        setCurrentUser({ ...currentUser, ...updatedPayload });
      }

      setProfile(prev => ({ ...prev, ...updatedPayload }));
      setEditModalOpen(false);
      showToast('🎉 Perfil profissional atualizado e salvo com sucesso!');
    } catch (err) {
      console.error('[PerfilFreelancer] Erro ao salvar perfil:', err);
      showToast('❌ Erro ao salvar dados no servidor. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 7. Cancelar Edição ──
  const handleCancelEdit = () => {
    setFormData(profile);
    setFormErrors({});
    setEditModalOpen(false);
  };

  // ── 8. Adicionar e Remover Tags de Especialidades ──
  const handleAddSpecialty = () => {
    const val = specialtyInput.trim();
    if (!val) return;
    const current = formData.specialties || [];
    if (!current.includes(val)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...current, val]
      }));
    }
    setSpecialtyInput('');
  };

  const handleRemoveSpecialty = (item) => {
    setFormData(prev => ({
      ...prev,
      specialties: (prev.specialties || []).filter(s => s !== item)
    }));
  };

  // ── 9. Toggle Cidades Atendidas ──
  const handleToggleCity = (c) => {
    if (c === 'Todas as Cidades') return;
    const current = formData.serviceCities || [];
    if (current.includes(c)) {
      setFormData(prev => ({
        ...prev,
        serviceCities: current.filter(item => item !== c)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        serviceCities: [...current, c]
      }));
    }
  };

  // ── 10. Toggle Métodos de Pagamento ──
  const handleTogglePayment = (p) => {
    const current = formData.paymentMethods || [];
    if (current.includes(p)) {
      setFormData(prev => ({
        ...prev,
        paymentMethods: current.filter(item => item !== p)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        paymentMethods: [...current, p]
      }));
    }
  };

  // ── 11. Criar Novo Serviço Anunciado ──
  const handleCreateService = async (e) => {
    if (e) e.preventDefault();
    if (!newService.title.trim()) {
      showToast('⚠️ Informe o título do serviço oferecido.');
      return;
    }

    setSavingService(true);
    try {
      await addService({
        title: newService.title.trim(),
        name: newService.title.trim(),
        category: newService.category,
        price: newService.price ? `R$ ${newService.price}` : 'A combinar / Sob consulta',
        priceType: newService.priceType,
        deliveryTime: newService.deliveryTime || 'A combinar',
        city: newService.city || profile.city || 'Ivaiporã',
        description: newService.description.trim() || 'Serviço profissional prestado com qualidade no Vale do Ivaí.',
        providerName: profile.name,
        providerEmail: profile.email,
        phone: profile.whatsapp || profile.phone,
        avatar: profile.avatar || DEFAULT_AVATAR,
        createdBy: profile.uid || currentUser?.uid,
        rating: 5.0,
        reviewsCount: 0
      });

      setNewServiceModalOpen(false);
      setNewService({
        title: '',
        category: 'Desenvolvimento & Programação',
        price: '',
        priceType: 'sob_consulta',
        city: profile.city || 'Ivaiporã',
        description: '',
        deliveryTime: ''
      });
      showToast('🎉 Novo serviço anunciado com sucesso no Marketplace regional!');
    } catch {
      showToast('Erro ao criar serviço. Tente novamente.');
    } finally {
      setSavingService(false);
    }
  };

  // ── 12. Excluir Serviço Anunciado ──
  const handleDeleteService = async (serviceId, title) => {
    if (!isOwner) return;
    if (window.confirm(`Deseja realmente remover o serviço "${title}"?`)) {
      try {
        await deleteService(serviceId);
        showToast('🗑️ Serviço removido.');
      } catch {
        showToast('Erro ao excluir serviço.');
      }
    }
  };

  // ── 13. Adicionar Item de Portfólio ──
  const handleAddPortfolioItem = async (e) => {
    if (e) e.preventDefault();
    if (!newPortfolioItem.title.trim()) {
      showToast('⚠️ Informe o título do projeto ou trabalho realizado.');
      return;
    }

    setSavingPortfolio(true);
    try {
      const uid = profile.uid || currentUser.uid;
      const newItem = {
        id: `port_${Date.now()}`,
        title: newPortfolioItem.title.trim(),
        description: newPortfolioItem.description.trim(),
        imageUrl: newPortfolioItem.imageUrl || DEFAULT_COVER,
        category: newPortfolioItem.category || profile.category || 'Trabalho Geral',
        link: newPortfolioItem.link.trim() || '',
        createdAt: new Date().toLocaleDateString('pt-BR')
      };

      const updatedPortfolio = [newItem, ...(profile.portfolioItems || [])];
      await setDoc(doc(db, 'users', String(uid)), {
        portfolioItems: updatedPortfolio,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setProfile(prev => ({ ...prev, portfolioItems: updatedPortfolio }));
      setNewPortfolioModalOpen(false);
      setNewPortfolioItem({ title: '', description: '', imageUrl: '', category: '', link: '' });
      showToast('🎉 Trabalho adicionado à sua galeria de portfólio!');
    } catch {
      showToast('Erro ao adicionar trabalho.');
    } finally {
      setSavingPortfolio(false);
    }
  };

  // ── 14. Excluir Item de Portfólio ──
  const handleDeletePortfolioItem = async (itemId) => {
    if (!isOwner) return;
    if (window.confirm('Deseja excluir este item do seu portfólio?')) {
      try {
        const uid = profile.uid || currentUser.uid;
        const updated = (profile.portfolioItems || []).filter(item => item.id !== itemId);
        await setDoc(doc(db, 'users', String(uid)), {
          portfolioItems: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setProfile(prev => ({ ...prev, portfolioItems: updated }));
        showToast('🗑️ Trabalho removido do portfólio.');
      } catch {
        showToast('Erro ao remover item.');
      }
    }
  };

  // ── 15. Enviar Avaliação de Cliente ──
  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      showToast('Faça login para avaliar este prestador de serviços.');
      return;
    }
    if (isOwner) {
      showToast('⚠️ Você não pode avaliar o seu próprio perfil.');
      return;
    }
    if (!newReview.comment.trim()) {
      showToast('⚠️ Escreva um breve comentário sobre a sua experiência.');
      return;
    }

    setSavingReview(true);
    try {
      const uid = profile.uid || profile.id;
      const reviewItem = {
        id: `rev_${Date.now()}`,
        client: currentUser.name || newReview.client || 'Cliente do Vale do Ivaí',
        clientUid: currentUser.uid || currentUser.id,
        stars: Number(newReview.stars || 5),
        comment: newReview.comment.trim(),
        date: new Date().toLocaleDateString('pt-BR')
      };

      const existingReviews = Array.isArray(profile.reviews) ? profile.reviews : [];
      const updatedReviews = [reviewItem, ...existingReviews];
      const sumStars = updatedReviews.reduce((acc, curr) => acc + (curr.stars || 5), 0);
      const newRating = Number((sumStars / updatedReviews.length).toFixed(1));

      await setDoc(doc(db, 'users', String(uid)), {
        reviews: updatedReviews,
        rating: newRating,
        reviewsCount: updatedReviews.length,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setProfile(prev => ({
        ...prev,
        reviews: updatedReviews,
        rating: newRating,
        reviewsCount: updatedReviews.length
      }));

      setNewReview({ client: '', stars: 5, comment: '' });
      showToast('🎉 Avaliação publicada com sucesso! Obrigado pelo feedback.');
    } catch {
      showToast('Erro ao publicar avaliação.');
    } finally {
      setSavingReview(false);
    }
  };

  // ── 16. Ações de Contato e Chat ──
  const handleStartChat = async () => {
    if (!currentUser) {
      showToast('Faça login para iniciar uma conversa com o prestador!');
      navigate('/login');
      return;
    }
    if (isOwner) {
      showToast('Este é o seu próprio perfil.');
      return;
    }

    const draft = `Olá ${profile.name}! Encontrei seu perfil profissional no Ivaí Conecta e gostaria de solicitar um orçamento para prestação de serviços.`;
    await startChatWith({
      name: profile.name,
      email: profile.email || `${(profile.name || 'prestador').toLowerCase().replace(/[^a-z0-9]/g, '')}@ivaiconecta.com.br`,
      role: 'freelancer',
      avatar: profile.avatar || DEFAULT_AVATAR
    }, `Orçamento de Serviços - ${profile.name}`, null, draft);
  };

  const handleShareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('🔗 Link do perfil copiado para a área de transferência!');
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-slate-400 font-medium text-sm animate-pulse">
          Carregando perfil profissional...
        </p>
      </div>
    );
  }

  // ── Not Found State ──
  if (!profile) {
    return (
      <main className="container section text-center py-24">
        <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-slate-700 shadow-sm">
          <User size={36} />
        </div>
        <h2 className="font-heading text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Perfil de Freelancer não encontrado
        </h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
          O prestador de serviços solicitado não foi localizado ou não está mais ativo na plataforma.
        </p>
        <Link to="/servicos" className="btn btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Explorar Prestadores de Serviços
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 transition-colors duration-200">
      
      {/* ── 1. HERO HEADER: CAPA E AVATAR ── */}
      <div className="relative">
        {/* Imagem de Capa / Banner */}
        <div className="h-64 sm:h-80 w-full overflow-hidden relative bg-slate-800">
          <img
            src={profile.coverUrl || DEFAULT_COVER}
            alt={`Capa do perfil de ${profile.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-black/30" />

          {/* Botão de Trocar Capa (Apenas Dono) */}
          {isOwner && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverFileChange}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-2 border border-white/20 transition-all shadow-md cursor-pointer disabled:opacity-50"
                title="Alterar imagem de capa"
              >
                {uploadingCover ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-primary-blue" />
                    <span>Salvando capa...</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>Alterar Capa</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Botão Voltar */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1 border border-white/20 transition-all shadow-md cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Informações Principais do Freelancer */}
        <div className="container relative -mt-20 sm:-mt-24 z-20">
          <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Avatar + Info Text */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                
                {/* Foto com Câmera */}
                <div className="relative group shrink-0">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-xl relative">
                    <img
                      src={profile.avatar || DEFAULT_AVATAR}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                        <Loader2 size={24} className="animate-spin text-primary-blue" />
                      </div>
                    )}
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2.5 rounded-full bg-primary-blue text-white shadow-lg hover:bg-blue-600 transition-transform active:scale-95 cursor-pointer border-2 border-white dark:border-slate-900"
                      title="Alterar foto de perfil"
                      aria-label="Trocar foto"
                    >
                      <Camera size={15} />
                    </button>
                  )}
                </div>

                {/* Título & Badges */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 dark:text-white">
                      {profile.name}
                    </h1>
                    {profile.verifiedFreelancer && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" title="Prestador de Serviço Verificado no Vale do Ivaí">
                        <ShieldCheck size={13} className="shrink-0" />
                        Prestador Verificado
                      </span>
                    )}
                  </div>

                  <p className="text-base font-semibold text-primary-blue dark:text-blue-400">
                    {profile.title || 'Profissional Autônomo & Freelancer'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-gray-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin size={14} className="text-primary-blue shrink-0" />
                      {profile.city || 'Ivaiporã'}, PR
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Briefcase size={14} className="text-primary-blue shrink-0" />
                      {profile.category || 'Serviços'}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span>{typeof profile.rating === 'number' ? profile.rating.toFixed(1) : (profile.rating || '5.0')}</span>
                      <span className="text-gray-400 font-normal text-xs">({profile.reviewsCount || profile.reviews?.length || 0})</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Botões de Ação do Perfil */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 shrink-0">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(profile);
                        setEditModalOpen(true);
                      }}
                      className="btn btn-primary btn-sm px-4 py-2.5 font-bold shadow-brand-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 size={15} />
                      Editar Meu Perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewServiceModalOpen(true)}
                      className="btn btn-secondary btn-sm px-4 py-2.5 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={15} />
                      Novo Serviço
                    </button>
                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-primary-blue transition-colors cursor-pointer"
                      title="Copiar link do perfil"
                    >
                      <Share2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    {(profile.whatsapp || profile.phone) && (
                      <button
                        type="button"
                        onClick={() => setWhatsAppModalOpen(true)}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-sm px-5 py-2.5 font-bold shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                      >
                        <Phone size={15} />
                        Contratar via WhatsApp
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartChat}
                      className="btn btn-primary btn-sm px-5 py-2.5 font-bold shadow-brand-sm flex items-center gap-2 cursor-pointer"
                    >
                      <MessageSquare size={15} />
                      Conversar no Chat
                    </button>
                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-primary-blue transition-colors cursor-pointer"
                      title="Compartilhar perfil"
                    >
                      <Share2 size={16} />
                    </button>
                  </>
                )}
              </div>

            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
              <div className="p-3 rounded-2xl bg-gray-50/60 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                <span className="text-xs text-gray-500 dark:text-slate-400 block font-medium">Experiência</span>
                <strong className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">
                  {profile.experienceYears || '3+ anos'}
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50/60 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                <span className="text-xs text-gray-500 dark:text-slate-400 block font-medium">Modalidade</span>
                <strong className="text-sm sm:text-base font-bold text-gray-800 dark:text-white truncate block">
                  {profile.modality || 'Presencial / Remoto'}
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50/60 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                <span className="text-xs text-gray-500 dark:text-slate-400 block font-medium">Serviços Ativos</span>
                <strong className="text-sm sm:text-base font-bold text-primary-blue dark:text-blue-400">
                  {freelancerServices.length} anunciado{freelancerServices.length !== 1 ? 's' : ''}
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50/60 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                <span className="text-xs text-gray-500 dark:text-slate-400 block font-medium">Disponibilidade</span>
                <strong className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                  {profile.availability || 'Imediata'}
                </strong>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. NAVEGAÇÃO DE ABAS DO PERFIL ── */}
      <div className="container mt-8">
        <div className="flex border-b border-gray-200 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('sobre')}
            className={`py-3 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sobre'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-extrabold'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Visão Geral &amp; Sobre
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`py-3 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'servicos'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-extrabold'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Serviços &amp; Preços
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 font-bold">
              {freelancerServices.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-extrabold'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Portfólio de Trabalhos
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold">
              {profile.portfolioItems?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('avaliacoes')}
            className={`py-3 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'avaliacoes'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400 font-extrabold'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Avaliações
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold">
              {profile.reviews?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. CONTEÚDO DAS ABAS ── */}
      <div className="container mt-6">
        
        {/* ── ABA 1: VISÃO GERAL & SOBRE ── */}
        {activeTab === 'sobre' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna Esquerda: Bio e Especialidades (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Sobre o Prestador */}
              <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <User size={18} className="text-primary-blue" />
                    Sobre o Profissional
                  </h3>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(profile);
                        setActiveEditTab('apresentacao');
                        setEditModalOpen(true);
                      }}
                      className="text-xs text-primary-blue dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} /> Editar Bio
                    </button>
                  )}
                </div>

                <div className="text-sm sm:text-base text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {profile.bio || (
                    <span className="text-gray-400 dark:text-slate-500 italic">
                      {isOwner
                        ? 'Nenhuma biografia adicionada. Clique em "Editar Meu Perfil" para apresentar seus serviços, garantias e diferenciais para potenciais clientes!'
                        : 'Nenhuma descrição detalhada informada por este prestador.'}
                    </span>
                  )}
                </div>
              </div>

              {/* Especialidades & Competências */}
              <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl space-y-4">
                <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-blue" />
                  Especialidades &amp; Habilidades Técnicas
                </h3>

                {(!profile.specialties || profile.specialties.length === 0) ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                    Nenhuma especialidade cadastrada.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 text-primary-blue dark:text-blue-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-2xs"
                      >
                        <Check size={13} className="text-primary-blue" />
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cidades e Região de Atendimento */}
              <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl space-y-4">
                <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin size={18} className="text-primary-blue" />
                  Cidades Atendidas no Vale do Ivaí
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(profile.serviceCities || [profile.city || 'Ivaiporã']).map((cityItem, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-xs sm:text-sm font-medium flex items-center gap-1.5"
                    >
                      <MapPin size={12} className="text-emerald-500 shrink-0" />
                      {cityItem}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Coluna Direita: Contato, Pagamento e Redes (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card de Contato Rápido */}
              <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl space-y-4">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Phone size={16} className="text-primary-blue" />
                  Contatos Oficiais
                </h3>

                <div className="space-y-3 text-xs sm:text-sm">
                  {profile.whatsapp && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Phone size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">WhatsApp Comercial</span>
                          <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200 truncate block">
                            {maskPhone(profile.whatsapp)}
                          </span>
                        </div>
                      </div>
                      <a
                        href={generateWhatsAppLink(profile.whatsapp, `Olá ${profile.name}! Gostaria de solicitar um orçamento via Ivaí Conecta.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-xs px-2.5 py-1.5 rounded-lg font-bold"
                      >
                        Abrir
                      </a>
                    </div>
                  )}

                  {profile.email && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/70 text-gray-700 dark:text-slate-300">
                      <div className="w-8 h-8 rounded-full bg-primary-blue/10 text-primary-blue flex items-center justify-center shrink-0">
                        <User size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase block">E-mail Profissional</span>
                        <span className="font-medium text-gray-800 dark:text-slate-200 truncate block text-xs">
                          {profile.email}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Formas de Pagamento Aceitas */}
              <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl space-y-3.5">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard size={16} className="text-primary-blue" />
                  Formas de Pagamento
                </h3>

                <div className="space-y-2">
                  {(profile.paymentMethods || ['PIX', 'Dinheiro']).map((pay, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{pay}</span>
                    </div>
                  ))}
                </div>

                {profile.pixKey && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-xs">
                    <span className="font-bold text-primary-blue dark:text-blue-400 block mb-0.5">Chave PIX Cadastrada:</span>
                    <span className="font-mono text-gray-800 dark:text-slate-200 select-all font-semibold break-all">
                      {profile.pixKey}
                    </span>
                  </div>
                )}
              </div>

              {/* Redes Sociais & Links */}
              <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl space-y-3.5">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe size={16} className="text-primary-blue" />
                  Redes &amp; Portfólio Online
                </h3>

                <div className="space-y-2 text-xs">
                  {profile.instagram && (
                    <a
                      href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/30 text-gray-700 dark:text-slate-300 hover:text-pink-600 transition-colors border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <IconInstagram size={15} className="text-pink-600" />
                        <span className="font-semibold">{profile.instagram.startsWith('@') ? profile.instagram : `@${profile.instagram}`}</span>
                      </div>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  {profile.linkedin && (
                    <a
                      href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-700 dark:text-slate-300 hover:text-primary-blue transition-colors border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <IconLinkedin size={15} className="text-primary-blue" />
                        <span className="font-semibold">LinkedIn</span>
                      </div>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  {profile.github && (
                    <a
                      href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <IconGithub size={15} />
                        <span className="font-semibold">GitHub</span>
                      </div>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  {profile.website && (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-700 dark:text-slate-300 hover:text-primary-blue transition-colors border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Globe size={15} className="text-primary-blue" />
                        <span className="font-semibold">Website Oficial</span>
                      </div>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  {!profile.instagram && !profile.linkedin && !profile.github && !profile.website && (
                    <p className="text-gray-400 dark:text-slate-500 italic py-2 text-center">
                      Nenhum link externo cadastrado.
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── ABA 2: SERVIÇOS & PREÇOS ── */}
        {activeTab === 'servicos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                  Serviços Oferecidos &amp; Catálogo
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Anúncios ativos no portal Ivaí Conecta
                </p>
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setNewServiceModalOpen(true)}
                  className="btn btn-primary btn-sm px-4 py-2.5 font-bold shadow-brand-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={15} /> Adicionar Novo Serviço
                </button>
              )}
            </div>

            {freelancerServices.length === 0 ? (
              <div className="card p-12 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-3">
                <Briefcase size={42} className="mx-auto text-primary-blue/50" />
                <h4 className="font-heading font-bold text-lg text-gray-800 dark:text-white">
                  Nenhum serviço anunciado no momento
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  {isOwner
                    ? 'Publique seus serviços para que empresas e clientes do Vale do Ivaí possam contratar você facilmente.'
                    : 'Este profissional ainda não possui anúncios avulsos de serviços cadastrados.'}
                </p>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setNewServiceModalOpen(true)}
                    className="btn btn-primary btn-sm px-6 py-2.5 font-bold shadow-md cursor-pointer"
                  >
                    <Plus size={15} /> Cadastrar Meu Primeiro Serviço
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {freelancerServices.map((srv) => (
                  <div
                    key={srv.id || srv.firestoreId}
                    className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl flex flex-col justify-between hover:border-primary-blue/40 transition-all shadow-sm group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {srv.category}
                        </span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv.id || srv.firestoreId, srv.title || srv.name)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Excluir este serviço"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <h4 className="font-heading font-bold text-lg text-gray-900 dark:text-white leading-snug">
                        {srv.title || srv.name}
                      </h4>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {srv.description || 'Prestação de serviço com qualidade e pontualidade na região.'}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-primary-blue" />
                          {srv.city || profile.city}
                        </span>
                        {srv.deliveryTime && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-primary-blue" />
                              {srv.deliveryTime}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Valor Estimado</span>
                        <strong className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {srv.price || 'Sob Consulta'}
                        </strong>
                      </div>

                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            if (profile.whatsapp) {
                              window.open(generateWhatsAppLink(profile.whatsapp, `Olá ${profile.name}! Vi seu serviço de *${srv.title || srv.name}* no Ivaí Conecta e gostaria de solicitar um orçamento.`), '_blank');
                            } else {
                              handleStartChat();
                            }
                          }}
                          className="btn btn-primary btn-xs px-3.5 py-2 font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Send size={12} /> Orçamento
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA 3: PORTFÓLIO DE TRABALHOS ── */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                  Galeria de Trabalhos &amp; Portfólio
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Projetos, obras e atendimentos realizados pelo profissional
                </p>
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setNewPortfolioModalOpen(true)}
                  className="btn btn-primary btn-sm px-4 py-2.5 font-bold shadow-brand-sm flex items-center gap-2 cursor-pointer"
                >
                  <FolderPlus size={15} /> Adicionar Trabalho Realizado
                </button>
              )}
            </div>

            {(!profile.portfolioItems || profile.portfolioItems.length === 0) ? (
              <div className="card p-12 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-3">
                <ImageIcon size={42} className="mx-auto text-primary-blue/50" />
                <h4 className="font-heading font-bold text-lg text-gray-800 dark:text-white">
                  Nenhum item na galeria de portfólio
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  {isOwner
                    ? 'Adicione fotos de projetos, reformas ou trabalhos anteriores para transmitir autoridade e conquistar novos clientes.'
                    : 'Este prestador ainda não fez o upload de fotos de portfólio.'}
                </p>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setNewPortfolioModalOpen(true)}
                    className="btn btn-primary btn-sm px-6 py-2.5 font-bold shadow-md cursor-pointer"
                  >
                    <FolderPlus size={15} /> Adicionar Meu Primeiro Projeto
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="card overflow-hidden bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl group shadow-sm flex flex-col justify-between"
                  >
                    <div className="h-48 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.category && (
                        <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md">
                          {item.category}
                        </span>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeletePortfolioItem(item.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-red-600/90 text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                          title="Excluir trabalho"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-base text-gray-900 dark:text-white">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-400">
                        <span>{item.createdAt || 'Registrado'}</span>
                        {item.link && (
                          <a
                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-blue font-semibold hover:underline flex items-center gap-1"
                          >
                            Ver Link <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA 4: AVALIAÇÕES DOS CLIENTES ── */}
        {activeTab === 'avaliacoes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Lista de Avaliações (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white flex items-center justify-between">
                <span>Depoimentos &amp; Avaliações de Clientes</span>
                <span className="text-xs text-gray-500 font-normal">
                  Total: {profile.reviews?.length || 0}
                </span>
              </h3>

              {(!profile.reviews || profile.reviews.length === 0) ? (
                <div className="card p-10 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-2">
                  <Star size={36} className="mx-auto text-amber-400/60" />
                  <h4 className="font-heading font-bold text-base text-gray-800 dark:text-white">
                    Nenhuma avaliação recebida ainda
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                    Assim que clientes contratarem e avaliarem os atendimentos, as avaliações com estrelas aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {profile.reviews.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      className="card p-5 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                            {rev.client ? rev.client.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-gray-800 dark:text-white block leading-tight">
                              {rev.client}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">
                              {rev.date || 'Cliente verificado'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < (rev.stars || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-700'}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 italic pt-1">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Direita: Formulário de Nova Avaliação (se não for o dono) */}
            <div className="space-y-6">
              <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl space-y-4">
                <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  Avaliar este Prestador
                </h3>

                {isOwner ? (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 text-xs text-primary-blue dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                    💡 Este é o seu próprio perfil. Clientes e empresas que contratarem seus serviços poderão deixar avaliações aqui!
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Sua Nota:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setNewReview(prev => ({ ...prev, stars: num }))}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              size={22}
                              className={num <= newReview.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-700'}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-gray-600 dark:text-slate-400 ml-2 font-mono">
                          {newReview.stars} de 5
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Seu Depoimento:
                      </label>
                      <textarea
                        rows={3}
                        value={newReview.comment}
                        onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Descreva a qualidade do atendimento, pontualidade e resultado do serviço..."
                        className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-3 text-gray-800 dark:text-white outline-hidden focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingReview || !newReview.comment.trim()}
                      className="btn btn-primary btn-sm w-full font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingReview ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Publicando...
                        </>
                      ) : (
                        <>
                          <Star size={14} /> Publicar Avaliação
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ── 4. MODAL: EDITAR MEU PERFIL FREELANCER (APENAS DONO) ── */}
      {editModalOpen && isOwner && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-freelancer-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Header do Modal */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 id="edit-freelancer-title" className="font-heading font-extrabold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-primary-blue dark:text-blue-400" /> Editar perfil profissional
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Personalize seus dados de apresentação, especialidades, regiões de atendimento e contatos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:text-white hover:bg-primary-blue dark:hover:bg-primary-blue bg-blue-50 dark:bg-blue-950/50 transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs / Section Switcher */}
            <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
              
              {/* Desktop Tabs (>= 640px) */}
              <div className="hidden sm:grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                {[
                  { id: 'visual', label: 'Identidade e foto' },
                  { id: 'apresentacao', label: 'Apresentação' },
                  { id: 'especialidades', label: 'Especialidades' },
                  { id: 'regiao', label: 'Cidades e pag.' },
                  { id: 'contato', label: 'Contatos e redes' },
                ].map(tab => {
                  const isActive = activeEditTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveEditTab(tab.id)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl transition-all text-center truncate cursor-pointer ${
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
                <label htmlFor="mobile-freelancer-tab-select" className="text-xs font-bold text-primary-blue dark:text-blue-300 shrink-0">
                  Seção:
                </label>
                <div className="relative flex-1">
                  <select
                    id="mobile-freelancer-tab-select"
                    value={activeEditTab}
                    onChange={e => setActiveEditTab(e.target.value)}
                    className="w-full appearance-none bg-blue-50/60 dark:bg-slate-800 border border-blue-300 dark:border-blue-800 rounded-xl px-3.5 py-2 text-xs font-bold text-primary-blue dark:text-blue-300 pr-8 focus:ring-2 focus:ring-primary-blue/20 outline-none"
                  >
                    <option value="visual">Identidade e foto</option>
                    <option value="apresentacao">Apresentação</option>
                    <option value="especialidades">Especialidades</option>
                    <option value="regiao">Cidades e pagamento</option>
                    <option value="contato">Contatos e redes</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Corpo do Formulário com Scroll */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              
              {/* ABA 1: VISUAL & IDENTIDADE */}
              {activeEditTab === 'visual' && (
                <div className="space-y-6">
                  
                  {/* Controle e Prévia da Foto */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-primary-blue/30 shadow-sm bg-white dark:bg-slate-900 flex items-center justify-center">
                        <img
                          src={formData.avatar || profile?.avatar || DEFAULT_AVATAR}
                          alt="Foto de Perfil"
                          className="w-full h-full object-cover"
                        />
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs rounded-2xl">
                            <Loader2 className="animate-spin text-white" size={20} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Foto de Perfil</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo recomendado: 5MB.
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1 flex-wrap">
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="btn bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                          <Camera size={14} /> {(formData.avatar || profile?.avatar) ? 'Trocar foto' : 'Adicionar foto'}
                        </button>
                        {(formData.avatar || profile?.avatar) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, avatar: '' }));
                              setProfile(prev => ({ ...prev, avatar: '' }));
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-primary-blue dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-200 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campos de Identidade */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="freelancer-field-name" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Nome Profissional / Razão Comercial <span className="text-primary-blue">*</span>
                      </label>
                      <input
                        id="freelancer-field-name"
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Carlos Silva | CS Instalações Elétricas"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none font-medium"
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="freelancer-field-title" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Título Profissional Principal <span className="text-primary-blue">*</span>
                        </label>
                        <input
                          id="freelancer-field-title"
                          type="text"
                          required
                          value={formData.title || ''}
                          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: Eletricista Residencial & Industrial"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        />
                        {formErrors.title && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="freelancer-field-category" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Categoria de Atuação <span className="text-primary-blue">*</span>
                        </label>
                        <select
                          id="freelancer-field-category"
                          value={formData.category || FREELANCER_CATEGORIES[0]}
                          onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none cursor-pointer"
                        >
                          {FREELANCER_CATEGORIES.map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                      <label className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider block mb-2">
                        Presets de Capa de Fundo
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {COVER_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, coverUrl: preset.url, banner: preset.url }))}
                            className={`relative h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                              formData.coverUrl === preset.url ? 'border-primary-blue ring-2 ring-primary-blue/30' : 'border-transparent hover:opacity-90'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                            <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[10px] text-white p-1 text-center font-bold truncate">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 2: APRESENTAÇÃO & BIO */}
              {activeEditTab === 'apresentacao' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="freelancer-field-bio" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Biografia / Sobre Você &amp; Seus Serviços
                    </label>
                    <textarea
                      id="freelancer-field-bio"
                      rows={5}
                      value={formData.bio || ''}
                      onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Conte sua trajetória, garantias que você oferece, formação técnica e diferenciais que convencem o cliente a fechar com você..."
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl p-3.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none leading-relaxed"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Dica: clientes valorizam clareza de escopo, pontualidade e prazos bem definidos.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="freelancer-field-experience" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Tempo de Experiência
                      </label>
                      <input
                        id="freelancer-field-experience"
                        type="text"
                        value={formData.experienceYears || ''}
                        onChange={e => setFormData(prev => ({ ...prev, experienceYears: e.target.value }))}
                        placeholder="Ex: 5 anos, 10+ anos"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="freelancer-field-availability" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Disponibilidade
                      </label>
                      <input
                        id="freelancer-field-availability"
                        type="text"
                        value={formData.availability || ''}
                        onChange={e => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                        placeholder="Ex: Seg a Sex (8h às 18h)"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="freelancer-field-modality" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Modalidade de Atendimento
                      </label>
                      <select
                        id="freelancer-field-modality"
                        value={formData.modality || 'Presencial e Remoto'}
                        onChange={e => setFormData(prev => ({ ...prev, modality: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none cursor-pointer"
                      >
                        <option value="Presencial e Remoto">Presencial e Remoto</option>
                        <option value="Somente Presencial">Somente Presencial (No Local)</option>
                        <option value="Somente Remoto / Online">Somente Remoto / Online</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: ESPECIALIDADES & TAGS */}
              {activeEditTab === 'especialidades' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="freelancer-field-new-spec" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Adicionar Especialidade ou Habilidade
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        id="freelancer-field-new-spec"
                        type="text"
                        value={specialtyInput}
                        onChange={e => setSpecialtyInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); } }}
                        placeholder="Ex: Projetos Elétricos, Node.js, Pintura Fina..."
                        className="flex-1 border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSpecialty}
                        className="btn bg-primary-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider block mb-2">
                      Especialidades Cadastradas ({formData.specialties?.length || 0}):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(formData.specialties || []).map((spec, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900/60 shadow-2xs"
                        >
                          {spec}
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialty(spec)}
                            className="p-0.5 text-blue-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                            title={`Remover ${spec}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                      {(!formData.specialties || formData.specialties.length === 0) && (
                        <p className="text-xs text-gray-400 italic">Nenhuma especialidade adicionada.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: CIDADES & PAGAMENTO */}
              {activeEditTab === 'regiao' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="freelancer-field-city" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Cidade Base Principal <span className="text-primary-blue">*</span>
                    </label>
                    <select
                      id="freelancer-field-city"
                      value={formData.city || 'Ivaiporã'}
                      onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none cursor-pointer"
                    >
                      {CITIES.filter(c => c !== 'Todas as Cidades').map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider block mb-2">
                      Cidades Atendidas no Vale do Ivaí:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CITIES.filter(c => c !== 'Todas as Cidades').map((cityChoice) => {
                        const isSelected = (formData.serviceCities || []).includes(cityChoice);
                        return (
                          <button
                            key={cityChoice}
                            type="button"
                            onClick={() => handleToggleCity(cityChoice)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary-blue/10 border-primary-blue text-primary-blue dark:text-blue-300 font-bold'
                                : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-400'
                            }`}
                          >
                            <span>{cityChoice}</span>
                            {isSelected && <Check size={14} className="text-primary-blue" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider block">
                      Formas de Pagamento Aceitas:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((payChoice) => {
                        const isSelected = (formData.paymentMethods || []).includes(payChoice);
                        return (
                          <button
                            key={payChoice}
                            type="button"
                            onClick={() => handleTogglePayment(payChoice)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                                : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-400'
                            }`}
                          >
                            <span>{payChoice}</span>
                            {isSelected && <Check size={14} className="text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label htmlFor="freelancer-field-pix" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 mt-3 block">
                        Chave PIX (Opcional):
                      </label>
                      <input
                        id="freelancer-field-pix"
                        type="text"
                        value={formData.pixKey || ''}
                        onChange={e => setFormData(prev => ({ ...prev, pixKey: e.target.value }))}
                        placeholder="CPF, CNPJ, E-mail ou Telefone"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 5: CONTATOS & REDES */}
              {activeEditTab === 'contato' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="freelancer-field-whatsapp" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        WhatsApp de Atendimento <span className="text-primary-blue">*</span>
                      </label>
                      <input
                        id="freelancer-field-whatsapp"
                        type="text"
                        required
                        value={formData.whatsapp || ''}
                        onChange={e => setFormData(prev => ({ ...prev, whatsapp: maskPhone(e.target.value) }))}
                        placeholder="(43) 99999-9999"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="freelancer-field-instagram" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Instagram (@usuario)
                      </label>
                      <input
                        id="freelancer-field-instagram"
                        type="text"
                        value={formData.instagram || ''}
                        onChange={e => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@seunome.prof"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="freelancer-field-linkedin" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        LinkedIn (Nome de Usuário ou URL)
                      </label>
                      <input
                        id="freelancer-field-linkedin"
                        type="text"
                        value={formData.linkedin || ''}
                        onChange={e => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="https://linkedin.com/in/seu-perfil"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="freelancer-field-github" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        GitHub (Para Desenvolvedores/TI)
                      </label>
                      <input
                        id="freelancer-field-github"
                        type="text"
                        value={formData.github || ''}
                        onChange={e => setFormData(prev => ({ ...prev, github: e.target.value }))}
                        placeholder="https://github.com/seu-usuario"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="freelancer-field-website" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Website Oficial / Portfólio Externo (URL)
                    </label>
                    <input
                      id="freelancer-field-website"
                      type="text"
                      value={formData.website || ''}
                      onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://seuportfolio.com.br"
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                    />
                  </div>
                </div>
              )}

            </form>

            {/* Footer do Modal: Salvar e Cancelar */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-blue-50/30 dark:bg-slate-900/75 shrink-0">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="btn border border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white bg-blue-50/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving || uploadingAvatar}
                className="btn bg-primary-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Salvando dados...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 5. MODAL: CADASTRAR NOVO SERVIÇO (APENAS DONO) ── */}
      {newServiceModalOpen && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="card max-w-lg w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-primary-blue" />
                Cadastrar Novo Serviço
              </h3>
              <button
                type="button"
                onClick={() => setNewServiceModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Título do Serviço *
                </label>
                <input
                  type="text"
                  value={newService.title}
                  onChange={e => setNewService(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Instalação de Ar-Condicionado Split"
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={newService.category}
                    onChange={e => setNewService(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue cursor-pointer"
                  >
                    {FREELANCER_CATEGORIES.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Preço Base (R$) ou Estimado
                  </label>
                  <input
                    type="text"
                    value={newService.price}
                    onChange={e => setNewService(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Ex: 150,00 ou Sob Consulta"
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Prazo / Tempo Estimado de Execução
                </label>
                <input
                  type="text"
                  value={newService.deliveryTime}
                  onChange={e => setNewService(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  placeholder="Ex: 2 horas, Mesmo dia, 3 a 5 dias úteis"
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Descrição Detalhada do Serviço
                </label>
                <textarea
                  rows={3}
                  value={newService.description}
                  onChange={e => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="O que está incluso no atendimento, materiais necessários, garantias de serviço..."
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewServiceModalOpen(false)}
                  className="btn btn-ghost text-xs px-4 py-2 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService || !newService.title.trim()}
                  className="btn btn-primary text-xs px-5 py-2 font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingService ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Publicando...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Publicar Serviço
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: ADICIONAR ITEM DE PORTFÓLIO (APENAS DONO) ── */}
      {newPortfolioModalOpen && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="card max-w-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <FolderPlus size={18} className="text-primary-blue" />
                Adicionar Trabalho ao Portfólio
              </h3>
              <button
                type="button"
                onClick={() => setNewPortfolioModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPortfolioItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Título do Trabalho / Projeto *
                </label>
                <input
                  type="text"
                  value={newPortfolioItem.title}
                  onChange={e => setNewPortfolioItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Reforma Elétrica Predial"
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Foto do Projeto (URL ou Imagem)
                </label>
                <input
                  type="text"
                  value={newPortfolioItem.imageUrl}
                  onChange={e => setNewPortfolioItem(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://exemplo.com/foto-do-trabalho.jpg"
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Breve Descrição do Trabalho Realizado
                </label>
                <textarea
                  rows={3}
                  value={newPortfolioItem.description}
                  onChange={e => setNewPortfolioItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes dos materiais utilizados, desafio superado e feedback do cliente..."
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Link Externo / Demonstração (Opcional)
                </label>
                <input
                  type="text"
                  value={newPortfolioItem.link}
                  onChange={e => setNewPortfolioItem(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://github.com/... ou https://behance.net/..."
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-gray-900 dark:text-white outline-hidden focus:border-primary-blue"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewPortfolioModalOpen(false)}
                  className="btn btn-ghost text-xs px-4 py-2 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPortfolio || !newPortfolioItem.title.trim()}
                  className="btn btn-primary text-xs px-5 py-2 font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPortfolio ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Salvar no Portfólio
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. MODAL: CONTRATAR VIA WHATSAPP COM PRESETS (CLIENTES) ── */}
      {whatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="card max-w-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Phone size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white">
                    Conversar com {profile.name}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    WhatsApp Verificado: {maskPhone(profile.whatsapp || profile.phone)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWhatsAppModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                Escolha o modelo de mensagem para iniciar:
              </label>

              <div className="space-y-2">
                {WHATSAPP_MESSAGE_PRESETS.map((preset) => {
                  const isSelected = selectedWhatsAppPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedWhatsAppPreset(preset.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                          : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700/80 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{preset.icon}</span>
                      <div className="flex-1 overflow-hidden">
                        <span className={`text-xs font-bold block ${isSelected ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-800 dark:text-white'}`}>
                          {preset.label}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">
                          {preset.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                {(() => {
                  const activePresetObj = WHATSAPP_MESSAGE_PRESETS.find(p => p.id === selectedWhatsAppPreset) || WHATSAPP_MESSAGE_PRESETS[0];
                  const msgText = activePresetObj.getTemplate({
                    providerName: profile.name,
                    serviceTitle: profile.title || profile.category,
                    city: profile.city || 'Ivaiporã'
                  });
                  const link = generateWhatsAppLink(profile.whatsapp || profile.phone, msgText);

                  return (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWhatsAppModalOpen(false)}
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3 font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm rounded-xl"
                    >
                      <Phone size={16} /> Abrir WhatsApp Agora
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
