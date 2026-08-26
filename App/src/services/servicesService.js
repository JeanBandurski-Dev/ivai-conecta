// Services Marketplace Service for Ivaí Conecta (Firestore + Local Storage Sync)
import { db } from '../lib/firebase.js';
import { collection, getDocs, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { STORAGE_KEY_SERVICES, SEED_SERVICES } from '../data/seedData.js';

/**
 * Escuta serviços em tempo real via Firestore onSnapshot
 */
export function subscribeToServices(city = 'Todas as Cidades', callback) {
  try {
    const servicesRef = collection(db, 'services');
    const q = (city && city !== 'Todas as Cidades') ? query(servicesRef, where('city', '==', city)) : servicesRef;
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remoteServices = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
        const localServices = getServices(city);
        const merged = [...remoteServices, ...localServices.filter(s => !remoteServices.some(rs => String(rs.id) === String(s.id)))];
        callback(merged);
      } else {
        callback(getServices(city));
      }
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

export function getServices(city = 'Todas as Cidades') {
  let services = SEED_SERVICES;
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.length > 0) services = parsed;
      } catch {}
    } else {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(SEED_SERVICES));
    }
  }

  // Background sync com o Firestore
  try {
    const servicesRef = collection(db, 'services');
    const q = (city && city !== 'Todas as Cidades') ? query(servicesRef, where('city', '==', city)) : servicesRef;
    getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const merged = [...remote, ...services.filter(s => !remote.some(rs => String(rs.id) === String(s.id)))];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(merged));
        }
      }
    }).catch(err => console.warn('Firestore offline para serviços:', err.message));
  } catch {}

  if (!city || city === 'Todas as Cidades') return services;
  return services.filter(s => s.city.toLowerCase() === city.toLowerCase());
}

export function getServiceById(id) {
  const services = getServices('Todas as Cidades');
  return services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id));
}

export function addService(serviceData) {
  const services = getServices('Todas as Cidades');
  const newService = {
    id: Date.now(),
    rating: 5.0,
    reviewsCount: 1,
    badge: 'Novo Profissional',
    analytics: { views: 12, contacts: 2, closedDeals: 1, nonBuyers: 0, conversionRate: '50%' },
    reviews: [],
    forumTopics: [],
    ...serviceData,
  };
  const updated = [newService, ...services];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }

  // Sync no Firestore
  try {
    addDoc(collection(db, 'services'), newService)
      .then(docRef => { newService.firestoreId = docRef.id; })
      .catch(err => console.warn('Sync Firestore cadastro serviço:', err.message));
  } catch {}

  return newService;
}

export function updateService(id, serviceData) {
  const services = getServices('Todas as Cidades');
  const updated = services.map(s => (s.id === Number(id) || s.id === id || String(s.id) === String(id) ? { ...s, ...serviceData } : s));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }
  return updated;
}

export function generateWhatsAppLink(phone, title, company, city) {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '5543999887766';
  const text = encodeURIComponent(
    `Olá! Vi o anúncio de "${title}" (${company} - ${city}) no Ivaí Conecta e gostaria de mais informações.`
  );
  return `https://wa.me/${cleanPhone}?text=${text}`;
}
