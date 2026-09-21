// Services Marketplace Service for Ivaí Conecta (Firestore Realtime)
import { db } from '../lib/firebase.js';
import {
  collection,
  getDocs,
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

import { matchCity } from '../utils/searchUtils.js';

let _memServicesCache = null;

/**
 * Escuta serviços em tempo real via Firestore onSnapshot
 */
export function subscribeToServices(city = 'Todas as Cidades', callback) {
  callback(getServices(city));

  try {
    const servicesRef = collection(db, 'services');
    
    return onSnapshot(servicesRef, (snapshot) => {
      const remoteServices = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      _memServicesCache = remoteServices;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(remoteServices));
        } catch {}
      }

      const filtered = remoteServices.filter(s => matchCity(s.city, city));
      callback(filtered);
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
  if (Array.isArray(_memServicesCache) && _memServicesCache.length > 0) {
    services = _memServicesCache;
  } else if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          services = parsed;
          _memServicesCache = parsed;
        }
      } catch {}
    }
  }

  if (!city || city === 'Todas as Cidades') return services;
  return services.filter(s => matchCity(s.city, city));
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

// ─────────────────────────────────────────────────────────────
// Freelance Service Orders Lifecycle (Firestore Realtime)
// Statuses: solicitado -> aceito (ou recusado) -> em_andamento -> concluido -> avaliado
// ─────────────────────────────────────────────────────────────

export const STORAGE_KEY_SERVICE_ORDERS = 'ivai_conecta_service_orders';

export function getServiceOrders() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICE_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveServiceOrders(orders) {
  if (typeof localStorage === 'undefined' || !Array.isArray(orders)) return;
  try {
    localStorage.setItem(STORAGE_KEY_SERVICE_ORDERS, JSON.stringify(orders));
  } catch {}
}

export async function createServiceOrder(orderData) {
  const newOrder = {
    status: 'solicitado',
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtTimestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        status: 'solicitado',
        date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        note: 'Solicitação de serviço enviada pelo cliente.'
      }
    ],
    ...orderData
  };

  try {
    const docRef = await addDoc(collection(db, 'service_orders'), newOrder);
    newOrder.id = docRef.id;
    newOrder.firestoreId = docRef.id;
  } catch (err) {
    console.warn('[Firestore] Erro ao criar ordem de serviço:', err.message);
    newOrder.id = `order_${Date.now()}`;
  }

  const all = getServiceOrders();
  const updated = [newOrder, ...all.filter(o => o.id !== newOrder.id)];
  saveServiceOrders(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_service_orders_updated', { detail: updated }));
  }

  return newOrder;
}

export async function updateServiceOrderStatus(orderId, newStatus, note = '') {
  const orders = getServiceOrders();
  const order = orders.find(o => o.id === orderId || o.firestoreId === orderId);

  const statusLabels = {
    solicitado: 'Solicitado',
    aceito: 'Aceito pelo Prestador',
    recusado: 'Recusado pelo Prestador',
    em_andamento: 'Em Andamento / Execução',
    concluido: 'Concluído pelo Prestador',
    avaliado: 'Concluído e Avaliado'
  };

  const historyItem = {
    status: newStatus,
    date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    note: note || `Status alterado para: ${statusLabels[newStatus] || newStatus}`
  };

  const updatedHistory = [...(order?.history || []), historyItem];
  const patch = {
    status: newStatus,
    history: updatedHistory,
    updatedAt: new Date().toISOString()
  };

  const docId = order?.firestoreId || order?.id || orderId;
  if (docId) {
    try {
      await updateDoc(doc(db, 'service_orders', String(docId)), patch);
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar status da ordem de serviço:', err.message);
    }
  }

  const updatedList = orders.map(o => (o.id === orderId || o.firestoreId === orderId ? { ...o, ...patch } : o));
  saveServiceOrders(updatedList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_service_orders_updated', { detail: updatedList }));
  }

  return { success: true, status: newStatus };
}

export async function submitServiceReview(orderId, { rating, comment, serviceId, clientName, clientAvatar }) {
  const reviewData = {
    rating: Number(rating) || 5,
    comment: String(comment || '').trim(),
    author: clientName || 'Cliente Ivaí Conecta',
    avatar: clientAvatar || '',
    date: new Date().toLocaleDateString('pt-BR'),
    timestamp: Date.now()
  };

  // 1. Atualiza ordem de serviço para 'avaliado'
  await updateServiceOrderStatus(orderId, 'avaliado', `Cliente avaliou o atendimento com ${rating} estrelas.`);
  const docId = orderId;
  if (docId) {
    try {
      await updateDoc(doc(db, 'service_orders', String(docId)), {
        review: reviewData
      });
    } catch {}
  }

  // 2. Atualiza estatísticas e histórico do serviço correspondente
  if (serviceId) {
    try {
      const targetService = getServiceById(serviceId);
      const currentReviews = targetService?.reviews || [];
      const updatedReviews = [reviewData, ...currentReviews];
      const totalScore = updatedReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      const newAverage = Number((totalScore / updatedReviews.length).toFixed(1));

      await updateService(serviceId, {
        rating: newAverage,
        reviewsCount: updatedReviews.length,
        reviews: updatedReviews
      });
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar notas do serviço:', err.message);
    }
  }

  return { success: true };
}

export function subscribeToServiceOrders(user, callback) {
  try {
    const ordersRef = collection(db, 'service_orders');
    return onSnapshot(ordersRef, (snapshot) => {
      const allOrders = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      saveServiceOrders(allOrders);

      let relevant = allOrders;
      if (user) {
        const uid = String(user.uid || user.id || '');
        const email = String(user.email || '').toLowerCase();
        relevant = allOrders.filter(o => 
          (uid && (String(o.providerId) === uid || String(o.clientId) === uid)) ||
          (email && (String(o.providerEmail || '').toLowerCase() === email || String(o.clientEmail || '').toLowerCase() === email))
        );
      }

      callback(relevant, allOrders);
    }, (error) => {
      console.warn('[Firestore Service Orders Listener] Erro:', error.message);
      const cached = getServiceOrders();
      callback(cached, cached);
    });
  } catch (error) {
    console.warn('[Firestore Service Orders] Falha ao assinar:', error.message);
    callback([], []);
    return () => {};
  }
}

