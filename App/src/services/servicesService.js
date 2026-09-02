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

