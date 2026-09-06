// Services Marketplace Service for Ivaí Conecta (Firestore Realtime)
import { db } from '../lib/firebase.js';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { STORAGE_KEY_SERVICES } from '../data/seedData.js';

export function maskPhone(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function sanitizeWhatsAppPhone(phone, defaultDDD = '43') {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  // Se o número for informado sem DDD local (8 ou 9 dígitos), aplica o DDD regional 43 (Vale do Ivaí)
  if (digits.length === 8 || digits.length === 9) {
    digits = `${defaultDDD}${digits}`;
  }

  // Se tiver 10 ou 11 dígitos (DDD + número), adiciona código do Brasil (55)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Se já tiver 55 no início
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  return digits;
}

export function generateWhatsAppLink(phone, message = '') {
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  if (!cleanPhone) return '#';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_MESSAGE_PRESETS = [
  {
    id: 'orcamento',
    icon: '💼',
    label: 'Solicitar Orçamento',
    description: 'Pedir valores, forma de pagamento e prazo estimado',
    getTemplate: ({ providerName, serviceTitle, city }) =>
      `Olá, ${providerName || 'tudo bem'}! Encontrei seu serviço de *${serviceTitle || 'prestação de serviços'}* no *Ivaí Conecta* (${city || 'Vale do Ivaí'}). Gostaria de solicitar um orçamento para um atendimento, você teria disponibilidade?`
  },
  {
    id: 'duvidas',
    icon: '❓',
    label: 'Tirar Dúvidas',
    description: 'Esclarecer escopo, materiais e como funciona o serviço',
    getTemplate: ({ providerName, serviceTitle, city }) =>
      `Olá, ${providerName || 'tudo bem'}! Vi seu anúncio de *${serviceTitle || 'serviço'}* no portal *Ivaí Conecta* (${city || 'região'}) e gostaria de tirar algumas dúvidas antes de contratar.`
  },
  {
    id: 'agendamento',
    icon: '📅',
    label: 'Agendar Visita / Horário',
    description: 'Combinar uma data ou visita técnica presencial no local',
    getTemplate: ({ providerName, serviceTitle, city }) =>
      `Olá, ${providerName || 'tudo bem'}! Vi seu perfil no *Ivaí Conecta* em *${city || 'Ivaiporã'}*. Gostaria de verificar a possibilidade de agendarmos uma visita técnica ou horário para *${serviceTitle || 'seu serviço'}*.`
  },
  {
    id: 'urgente',
    icon: '🚨',
    label: 'Atendimento Urgente',
    description: 'Para reparos rápidos ou demandas com início imediato',
    getTemplate: ({ providerName, serviceTitle, city }) =>
      `Olá, ${providerName || 'tudo bem'}! Localizei seu contato no *Ivaí Conecta* (${city || 'Ivaiporã'}) e tenho uma demanda urgente para *${serviceTitle || 'este serviço'}*. Você teria disponibilidade para atendimento hoje?`
  }
];

export async function incrementServiceContact(id) {
  if (!id) return;
  const services = getServices('Todas as Cidades');
  const target = services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id);
  const docId = target?.firestoreId || target?.id || id;

  const currentContacts = target?.analytics?.contacts || 0;
  const newContacts = currentContacts + 1;
  const views = target?.analytics?.views || 1;
  const newConversion = `${Math.min(100, Math.round((newContacts / Math.max(1, views)) * 100))}%`;

  const updatedAnalytics = {
    ...(target?.analytics || {}),
    contacts: newContacts,
    conversionRate: newConversion
  };

  if (docId) {
    try {
      await updateDoc(doc(db, 'services', String(docId)), { analytics: updatedAnalytics });
    } catch {}
  }

  const updated = services.map(s => (s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id ? { ...s, analytics: updatedAnalytics } : s));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }
}

/**
 * Escuta serviços em tempo real via Firestore onSnapshot
 */
export function subscribeToServices(city = 'Todas as Cidades', callback) {
  try {
    const servicesRef = collection(db, 'services');
    const q = (city && city !== 'Todas as Cidades') ? query(servicesRef, where('city', '==', city)) : servicesRef;
    
    return onSnapshot(q, (snapshot) => {
      const remoteServices = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(remoteServices));
      }

      callback(remoteServices);
    }, (error) => {
      console.warn('[Firestore Services Listener] Offline fallback:', error.message);
      callback(getServices(city));
    });
  } catch (error) {
    console.warn('[Firestore Services Listener] Falha ao assinar serviços:', error.message);
    callback(getServices(city));
    return () => {};
  }
}

/**
 * Busca serviços do cache local (sem dados fictícios)
 */
export function getServices(city = 'Todas as Cidades') {
  let services = [];
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) services = parsed;
      } catch {}
    }
  }

  // Background sync com o Firestore
  try {
    const servicesRef = collection(db, 'services');
    const q = (city && city !== 'Todas as Cidades') ? query(servicesRef, where('city', '==', city)) : servicesRef;
    getDocs(q).then(snapshot => {
      const remote = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(remote));
      }
    }).catch(err => console.warn('[Firestore] getServices offline:', err.message));
  } catch {}

  if (!city || city === 'Todas as Cidades') return services;
  return services.filter(s => s.city && s.city.toLowerCase() === city.toLowerCase());
}

export function getServiceById(id) {
  const services = getServices('Todas as Cidades');
  return services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id);
}

export async function addService(serviceData) {
  const services = getServices('Todas as Cidades');
  const newService = {
    rating: 5.0,
    reviewsCount: 0,
    badge: 'Prestador Regional',
    analytics: { views: 0, contacts: 0, closedDeals: 0, nonBuyers: 0, conversionRate: '0%' },
    reviews: [],
    forumTopics: [],
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtTimestamp: Date.now(),
    ...serviceData,
  };

  try {
    const docRef = await addDoc(collection(db, 'services'), newService);
    newService.id = docRef.id;
    newService.firestoreId = docRef.id;
  } catch (err) {
    console.warn('[Firestore] Erro ao cadastrar serviço:', err.message);
    newService.id = `serv_${Date.now()}`;
  }

  const updated = [newService, ...services];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }

  return newService;
}

export async function updateService(id, serviceData) {
  const services = getServices('Todas as Cidades');
  const target = services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id);
  const docId = target?.firestoreId || target?.id || id;

  if (docId) {
    try {
      await updateDoc(doc(db, 'services', String(docId)), serviceData);
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar serviço:', err.message);
    }
  }

  const updated = services.map(s => (s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id ? { ...s, ...serviceData } : s));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }
  return updated;
}

export async function deleteService(id) {
  const services = getServices('Todas as Cidades');
  const target = services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id);
  const docId = target?.firestoreId || target?.id || id;

  if (docId) {
    try {
      await deleteDoc(doc(db, 'services', String(docId)));
    } catch (err) {
      console.warn('[Firestore] Erro ao deletar serviço:', err.message);
    }
  }

  const updated = services.filter(s => s.id !== id && s.firestoreId !== id && String(s.id) !== String(id));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }
  return updated;
}
