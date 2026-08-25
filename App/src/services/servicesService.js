// Services Marketplace Service for Ivaí Conecta
import { STORAGE_KEY_SERVICES, SEED_SERVICES } from '../data/seedData';

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

  if (!city || city === 'Todas as Cidades') return services;
  return services.filter(s => s.city.toLowerCase() === city.toLowerCase());
}

export function getServiceById(id) {
  const services = getServices('Todas as Cidades');
  return services.find(s => s.id === Number(id) || s.id === id);
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
  localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  return newService;
}

export function updateService(id, serviceData) {
  const services = getServices('Todas as Cidades');
  const updated = services.map(s => (s.id === Number(id) || s.id === id ? { ...s, ...serviceData } : s));
  localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  return updated;
}

export function generateWhatsAppLink(phone, title, company, city) {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '5543999887766';
  const text = encodeURIComponent(
    `Olá! Vi o anúncio de "${title}" (${company} - ${city}) no Ivaí Conecta e gostaria de mais informações.`
  );
  return `https://wa.me/${cleanPhone}?text=${text}`;
}
