// Services Marketplace Service for Ivaí Conecta (Firestore + Local Storage Sync)
import { db } from '../lib/firebase.js';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { STORAGE_KEY_SERVICES, SEED_SERVICES } from '../data/seedData.js';

export const STORAGE_KEY_DELETED_SERVICES = 'ivai_conecta_deleted_service_ids';

function getDeletedServiceIds() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_SERVICES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function deduplicateServices(servicesList) {
  const seenSignatures = new Set();
  const deletedIds = getDeletedServiceIds();
  const result = [];

  for (const item of servicesList) {
    if (!item) continue;
    const idStr = String(item.id || item.firestoreId || '');
    const fIdStr = item.firestoreId ? String(item.firestoreId) : null;

    if (deletedIds.includes(idStr) || (fIdStr && deletedIds.includes(fIdStr))) {
      continue;
    }

    // Identificador único para evitar duplicatas do mesmo serviço
    const sig = `${(item.providerName || '').trim().toLowerCase()}_${(item.title || item.category || '').trim().toLowerCase()}_${(item.city || '').trim().toLowerCase()}`;
    const idSig = idStr ? `id_${idStr}` : sig;

    if (seenSignatures.has(idSig) || seenSignatures.has(sig)) {
      continue;
    }
    seenSignatures.add(idSig);
    seenSignatures.add(sig);

    result.push({
      ...item,
      phone: sanitizeWhatsAppPhone(item.phone)
    });
  }
  return result;
}

/**
 * Escuta serviços em tempo real via Firestore onSnapshot
 */
export function subscribeToServices(city = 'Todas as Cidades', callback) {
  try {
    const servicesRef = collection(db, 'services');
    const q = (city && city !== 'Todas as Cidades') ? query(servicesRef, where('city', '==', city)) : servicesRef;
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remoteServices = snapshot.docs.map(d => ({ ...d.data(), id: d.data().id || d.id, firestoreId: d.id }));
        const localServices = getServices(city);
        const merged = deduplicateServices([...remoteServices, ...localServices]);
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
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          services = parsed;
        }
      } catch {}
    } else {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(SEED_SERVICES));
    }
  }

  // Deduplica e higieniza lista
  services = deduplicateServices(services);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
  }

  // Background sync com o Firestore
  try {
    const servicesRef = collection(db, 'services');
    const q = (city && city !== 'Todas as Cidades') ? query(servicesRef, where('city', '==', city)) : servicesRef;
    getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        const remote = snapshot.docs.map(d => ({ ...d.data(), id: d.data().id || d.id, firestoreId: d.id }));
        const merged = deduplicateServices([...remote, ...services]);
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
  return services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id) || (s.firestoreId && String(s.firestoreId) === String(id)));
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
    phone: sanitizeWhatsAppPhone(serviceData?.phone)
  };
  const updated = deduplicateServices([newService, ...services]);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }

  // Sync no Firestore
  try {
    addDoc(collection(db, 'services'), newService)
      .then(docRef => {
        newService.firestoreId = docRef.id;
        const currentLocal = getServices('Todas as Cidades');
        const syncLocal = currentLocal.map(s => String(s.id) === String(newService.id) ? { ...s, firestoreId: docRef.id } : s);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(syncLocal));
        }
      })
      .catch(err => console.warn('Sync Firestore cadastro serviço:', err.message));
  } catch {}

  return newService;
}

export function updateService(id, serviceData) {
  const services = getServices('Todas as Cidades');
  let targetFirestoreId = null;
  const updated = services.map(s => {
    if (s.id === Number(id) || s.id === id || String(s.id) === String(id) || (s.firestoreId && String(s.firestoreId) === String(id))) {
      if (s.firestoreId) targetFirestoreId = s.firestoreId;
      return { ...s, ...serviceData, phone: sanitizeWhatsAppPhone(serviceData?.phone || s.phone) };
    }
    return s;
  });

  const cleaned = deduplicateServices(updated);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(cleaned));
  }

  try {
    if (targetFirestoreId) {
      updateDoc(doc(db, 'services', targetFirestoreId), serviceData).catch(() => {});
    }
    const qNum = query(collection(db, 'services'), where('id', '==', Number(id)));
    getDocs(qNum).then(snap => {
      snap.forEach(d => updateDoc(doc(db, 'services', d.id), serviceData).catch(() => {}));
    }).catch(() => {});
  } catch {}

  return cleaned;
}

export function deleteService(serviceId) {
  const idStr = String(serviceId);
  if (typeof localStorage !== 'undefined') {
    const deleted = getDeletedServiceIds();
    if (!deleted.includes(idStr)) {
      deleted.push(idStr);
      localStorage.setItem(STORAGE_KEY_DELETED_SERVICES, JSON.stringify(deleted));
    }
  }

  const services = getServices('Todas as Cidades');
  let targetFirestoreId = null;
  const target = services.find(s => s.id === Number(serviceId) || s.id === serviceId || String(s.id) === idStr || (s.firestoreId && String(s.firestoreId) === idStr));
  if (target?.firestoreId) targetFirestoreId = target.firestoreId;

  const updated = services.filter(s => !(s.id === Number(serviceId) || s.id === serviceId || String(s.id) === idStr || (s.firestoreId && String(s.firestoreId) === idStr)));
  const cleaned = deduplicateServices(updated);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(cleaned));
  }

  try {
    if (targetFirestoreId) {
      deleteDoc(doc(db, 'services', targetFirestoreId)).catch(() => {});
    }
    const qNum = query(collection(db, 'services'), where('id', '==', Number(serviceId)));
    getDocs(qNum).then(snap => {
      snap.forEach(d => deleteDoc(doc(db, 'services', d.id)).catch(() => {}));
    }).catch(() => {});
  } catch {}

  return cleaned;
}

export const WHATSAPP_MESSAGE_TEMPLATES = [
  {
    id: 'orcamento',
    title: 'Solicitar Orçamento',
    icon: '💰',
    description: 'Pedir valores e condições para execução de serviço',
    generate: (providerName, category, city, custom) =>
      `Olá ${providerName}! Vi seu serviço de "${category}" (${city}) no portal Ivaí Conecta e gostaria de solicitar um orçamento sem compromisso.${custom ? `\n\n📌 Detalhes do serviço: ${custom}` : ''}`
  },
  {
    id: 'disponibilidade',
    title: 'Consultar Horário / Disponibilidade',
    icon: '📅',
    description: 'Saber dias e horários livres para atendimento na região',
    generate: (providerName, category, city, custom) =>
      `Olá ${providerName}! Encontrei seu contato no Ivaí Conecta. Gostaria de saber qual sua disponibilidade para atendimento em ${city}.${custom ? `\n\n🗓️ Preferência de data/horário: ${custom}` : ''}`
  },
  {
    id: 'urgente',
    title: 'Atendimento de Emergência / Urgente',
    icon: '⚡',
    description: 'Serviço prioritário para o mesmo dia ou manutenção 24h',
    generate: (providerName, category, city, custom) =>
      `Olá ${providerName}! Preciso de um atendimento urgente em ${city} para "${category}". Você teria disponibilidade imediata ou para hoje?${custom ? `\n\n⚠️ Situação: ${custom}` : ''}`
  },
  {
    id: 'duvida',
    title: 'Tirar Dúvida Rápida',
    icon: '❓',
    description: 'Perguntar sobre materiais, cobertura e suporte técnico',
    generate: (providerName, category, city, custom) =>
      `Olá ${providerName}! Vi seu perfil no Ivaí Conecta e tenho uma dúvida rápida sobre o serviço de ${category} em ${city}.${custom ? `\n\n💬 Minha dúvida: ${custom}` : ''}`
  }
];

export function maskPhone(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function validatePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

export function sanitizeWhatsAppPhone(phone) {
  if (!phone) return '5543999887766';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  // Se for maior que 13 dígitos (ex: 99999999999999999...), limita a 11 dígitos para não gerar ERR_ADDRESS_INVALID no navegador
  if (digits.length > 13) {
    digits = digits.slice(0, 11);
  }
  // Se for telefone brasileiro com DDD (10 ou 11 dígitos), adiciona o DDI 55
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  // Validação estrita: número internacional WhatsApp precisa ter 12 ou 13 dígitos para o Brasil
  if (digits.length !== 12 && digits.length !== 13) {
    return '5543999887766';
  }
  return digits;
}

export function generateWhatsAppServiceLink(phone, providerName, category, city, templateId = 'orcamento', customText = '') {
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  const tmpl = WHATSAPP_MESSAGE_TEMPLATES.find(t => t.id === templateId) || WHATSAPP_MESSAGE_TEMPLATES[0];
  const msg = tmpl.generate(providerName, category, city, customText);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

export function generateWhatsAppLink(phone, title, company, city) {
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  const text = encodeURIComponent(
    `Olá! Vi o anúncio de "${title}" (${company} - ${city}) no Ivaí Conecta e gostaria de mais informações.`
  );
  return `https://wa.me/${cleanPhone}?text=${text}`;
}
