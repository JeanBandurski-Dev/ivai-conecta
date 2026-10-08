import { db } from '../lib/firebase.js';
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { STORAGE_KEY_SERVICES, CITIES } from '../data/seedData.js';
import { serviceRepository, serviceOrderRepository } from '../repositories/index.js';
import {
  hasProfanity,
  validateProfessionalText,
  validatePhoneNumber,
  GENERAL_TROLL_WORDS,
  STANDARD_JOB_TITLES
} from './jobTaxonomy.js';
import { matchCity } from '../utils/searchUtils.js';

export const SERVICE_CATEGORIES = [
  'Construção & Manutenção',
  'Marketing & Design',
  'Aulas & Treinamentos',
  'Tecnologia & TI',
  'Consultoria & Negócios',
  'Saúde & Bem-Estar',
  'Eventos & Fotografia',
  'Serviços Domésticos & Gerais',
  'Artesanato & Moda',
  'Jurídico & Contábil'
];

/**
 * Verifica se uma palavra é um termo troll, brincadeira, fruta/comida solta ou gíria inapropriada
 */
export function isTrollWord(word) {
  if (!word || typeof word !== 'string') return false;
  const lower = word.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!lower || lower.length < 3) return false;

  if (GENERAL_TROLL_WORDS.has(lower)) return true;

  // Trata plurais e variações comuns em português (abacaxis -> abacaxi, bananas -> banana, pasteis -> pastel)
  if (lower.endsWith('s')) {
    const s1 = lower.slice(0, -1);
    if (GENERAL_TROLL_WORDS.has(s1)) return true;
    if (lower.endsWith('es')) {
      const s2 = lower.slice(0, -2);
      if (GENERAL_TROLL_WORDS.has(s2)) return true;
    }
    if (lower.endsWith('is')) {
      const s3 = lower.slice(0, -2) + 'l';
      if (GENERAL_TROLL_WORDS.has(s3)) return true;
    }
  }

  // Raízes de palavras troll
  const trollRoots = [
    'abacaxi', 'banana', 'melancia', 'pastel', 'pizza', 'coxinha', 'cerveja', 'churrasco',
    'pipoca', 'hamburguer', 'fofoca', 'namoro', 'zoeira', 'palhacada', 'bobagem', 'besteira'
  ];
  for (const root of trollRoots) {
    if (lower.includes(root)) return true;
  }

  return false;
}

/**
 * Validação rigorosa do título do serviço freelance.
 * Bloqueia termos ofensivos, profanidades, termos troll, textos curtos,
 * caracteres repetidos e exige descrição profissional legítima.
 */
export function validateServiceTitle(title) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { valid: false, error: 'O título ou especialidade do serviço é obrigatório.' };
  }
  const clean = title.trim();

  // Validação profissional de texto (mínimo 5, máximo 90 caracteres)
  const basic = validateProfessionalText(clean, 'Título do Serviço', 5, 90);
  if (!basic.valid) {
    return basic;
  }

  // Filtro estrito anti-palavrões / profanidades
  if (hasProfanity(clean)) {
    return {
      valid: false,
      error: 'Linguagem imprópria ou inadequada detectada no título. Descreva uma atividade profissional legítima.'
    };
  }

  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Bloqueio de termos troll / piadas no título
  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (isTrollWord(w)) {
      return {
        valid: false,
        error: `O termo "${w}" não é apropriado para o título de um serviço profissional. Informe sua ocupação ou especialidade.`
      };
    }
  }

  // Exige ao menos letras reais
  if (!/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(clean)) {
    return { valid: false, error: 'O título do serviço deve conter palavras válidas.' };
  }

  // Bloqueio de dados de contato ou links no título
  if (/\d{8,}/.test(clean.replace(/\D/g, '')) || /@/.test(clean) || /https?:\/\//i.test(clean)) {
    return {
      valid: false,
      error: 'Por segurança e organização, não inclua números de telefone, e-mails ou links no título do serviço.'
    };
  }

  // Validação de ocupação ou serviço profissional legítimo
  const SERVICE_TITLE_KEYWORDS = [
    'eletric', 'mecanic', 'encanad', 'pedreir', 'pintor', 'pintur', 'marcen', 'serralh',
    'instalad', 'instalac', 'manutenc', 'repar', 'reform', 'consert', 'montad', 'montag',
    'design', 'desenvolv', 'programad', 'software', 'site', 'aplicativ', 'web', 'computad',
    'redes', 'informat', 'tecnic', 'tecnolog', 'consultor', 'advogad', 'juridic', 'contab',
    'professor', 'professora', 'docent', 'aul', 'ensino', 'treinament', 'instrut', 'personal',
    'fotograf', 'filmagem', 'video', 'evento', 'decorac', 'buffet', 'bolo', 'confeit',
    'limpez', 'faxin', 'diarist', 'lavador', 'passador', 'costur', 'alfaiat', 'estetic',
    'cabeleireir', 'barbeir', 'manicur', 'pedicur', 'massag', 'fisioterap', 'cuidador',
    'enfermeir', 'motorist', 'frete', 'mudanc', 'transport', 'entreg', 'veterinar', 'adestrad',
    'jardin', 'piscineir', 'serralheir', 'vidraceir', 'calheiro', 'marceneir', 'marketing',
    'social media', 'gestao', 'gestor', 'tradut', 'redator', 'copywrit', 'artesanat',
    'servico', 'servicos', 'prestador', 'especialista', 'profissional', 'assistencia', 'seguranca'
  ];

  const isStandardTitle = STANDARD_JOB_TITLES.some(st => {
    const normSt = st.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return norm === normSt || norm.includes(normSt) || normSt.includes(norm);
  });

  const hasServiceStem = SERVICE_TITLE_KEYWORDS.some(kw => norm.includes(kw));

  if (!isStandardTitle && !hasServiceStem) {
    return {
      valid: false,
      error: 'O título deve especificar um serviço profissional ou especialidade legítima (ex: "Manutenção Elétrica", "Desenvolvimento Web", "Pintor Residencial", "Aulas de Inglês").'
    };
  }

  return { valid: true };
}

/**
 * Validação rigorosa da descrição detalhada do serviço
 * Exige contexto de prestação de serviços / trabalho e bloqueia piadas, alimentos avulsos e textos sem sentido.
 */
export function validateServiceDescription(description) {
  if (!description || typeof description !== 'string' || !description.trim()) {
    return { valid: false, error: 'A descrição das atividades e especialidades é obrigatória.' };
  }
  const clean = description.trim();

  // Mínimo 25 caracteres, máximo 1200 caracteres
  const basic = validateProfessionalText(clean, 'Descrição do Serviço', 25, 1200);
  if (!basic.valid) {
    return basic;
  }

  if (hasProfanity(clean)) {
    return {
      valid: false,
      error: 'Linguagem imprópria ou inadequada detectada na descrição. Mantenha um vocabulário profissional.'
    };
  }

  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Bloqueio de termos troll / piadas / alimentos avulsos
  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (isTrollWord(w)) {
      return {
        valid: false,
        error: `O termo "${w}" não é apropriado para a descrição de um serviço profissional. Descreva atividades reais e suas especialidades.`
      };
    }
  }

  // Mínimo de 4 palavras
  if (words.length < 4) {
    return {
      valid: false,
      error: 'Por favor, detalhe melhor seus serviços (ao menos 4 palavras explicando suas especialidades).'
    };
  }

  // Vocabulário e contexto de prestação de serviços e atividades profissionais
  const SERVICE_CONTEXT_KEYWORDS = [
    'servico', 'servicos', 'atendimento', 'atender', 'execucao', 'manutencao', 'instalacao',
    'reforma', 'conserto', 'reparo', 'desenvolvimento', 'projeto', 'consultoria', 'cliente',
    'clientes', 'orcamento', 'trabalho', 'trabalhos', 'experiencia', 'especialidade', 'especialidades',
    'qualidade', 'garantia', 'pontualidade', 'profissional', 'profissionais', 'equipe',
    'solucao', 'obra', 'pintura', 'eletric', 'mecanic', 'design', 'tecnologia', 'aula',
    'treinamento', 'limpeza', 'apoio', 'gestao', 'orientacao', 'horas', 'diaria', 'contrato',
    'visita', 'domicilio', 'online', 'remoto', 'presencial', 'disponibilidade', 'garanto',
    'ofereco', 'realizo', 'faco', 'prestador', 'prestacao', 'prazo', 'ferramenta', 'ferramentas',
    'padrao', 'seguranca', 'suporte', 'assistencia', 'montagem', 'costura', 'frete',
    'transporte', 'fotografia', 'foto', 'video', 'evento', 'decoracao', 'saude', 'estetica',
    'comunicacao', 'diagnostico', 'elaboracao', 'revisao', 'consultor', 'ensino', 'curso'
  ];

  const hasContext = SERVICE_CONTEXT_KEYWORDS.some(kw => norm.includes(kw));
  if (!hasContext) {
    return {
      valid: false,
      error: 'A descrição deve fornecer detalhes sobre suas atividades profissionais, serviços prestados, especialidades ou orçamentos. Utilize o botão "Usar Modelo Profissional" se preferir.'
    };
  }

  return { valid: true };
}

/**
 * Validação da cidade
 */
export function validateServiceCity(city) {
  if (!city || city === 'Todas as Cidades') {
    return { valid: false, error: 'Por favor, selecione uma cidade polo válida do Vale do Ivaí onde você atua.' };
  }
  if (!CITIES.includes(city)) {
    return { valid: false, error: 'Por favor, selecione uma cidade válida da região do Vale do Ivaí.' };
  }
  return { valid: true };
}

/**
 * Validação da categoria
 */
export function validateServiceCategory(category) {
  if (!category || category === 'Todas') {
    return { valid: false, error: 'Por favor, selecione uma categoria válida para o serviço.' };
  }
  return { valid: true };
}

/**
 * Validador completo de payload de serviço
 */
export function validateServicePayload(data) {
  const errors = {};

  const titleVal = validateServiceTitle(data.title || data.name);
  if (!titleVal.valid) errors.title = titleVal.error;

  const descVal = validateServiceDescription(data.description);
  if (!descVal.valid) errors.description = descVal.error;

  const catVal = validateServiceCategory(data.category);
  if (!catVal.valid) errors.category = catVal.error;

  const cityVal = validateServiceCity(data.city);
  if (!cityVal.valid) errors.city = cityVal.error;

  const phoneVal = validatePhoneNumber(data.phone, true);
  if (!phoneVal.valid) errors.phone = phoneVal.error;

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

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
    ...target?.analytics,
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

let _memServicesCache = null;

/**
 * Escuta serviços em tempo real via Firestore onSnapshot e eventos locais
 */
export function subscribeToServices(city = 'Todas as Cidades', callback) {
  callback(getServices(city));

  const handleCustomEvent = (e) => {
    if (Array.isArray(e.detail)) {
      const filtered = e.detail.filter(s => matchCity(s.city, city));
      callback(filtered);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('ivai:services-updated', handleCustomEvent);
  }

  try {
    const unsub = serviceRepository.subscribeToServices((remoteServices) => {
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

    return () => {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('ivai:services-updated', handleCustomEvent);
      }
    };
  } catch (error) {
    console.warn('[Firestore Services Listener] Falha ao assinar serviços:', error.message);
    callback(getServices(city));
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ivai:services-updated', handleCustomEvent);
      }
    };
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
  // 1. Validação estrita obrigatória
  const validation = validateServicePayload(serviceData);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0] || 'Dados do serviço inválidos.';
    throw new Error(firstError);
  }

  const services = getServices('Todas as Cidades');
  const titleClean = (serviceData.title || serviceData.name || '').trim();
  const newService = {
    rating: 5.0,
    reviewsCount: 0,
    badge: serviceData.badge || 'Prestador Regional',
    analytics: { views: 0, contacts: 0, closedDeals: 0, nonBuyers: 0, conversionRate: '0%' },
    reviews: [],
    forumTopics: [],
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtTimestamp: Date.now(),
    status: 'active',
    ...serviceData,
    title: titleClean,
    name: titleClean,
    description: (serviceData.description || '').trim(),
    city: (serviceData.city || 'Ivaiporã').trim(),
    phone: (serviceData.phone || '').trim()
  };

  try {
    const created = await serviceRepository.create(newService);
    newService.id = created.id;
    newService.firestoreId = created.firestoreId;
  } catch (err) {
    console.warn('[ServiceRepository] Erro ao cadastrar serviço:', err.message);
    newService.id = `serv_${Date.now()}`;
  }

  const updated = [newService, ...services.filter(s => s.id !== newService.id && s.firestoreId !== newService.id)];
  _memServicesCache = updated;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai:services-updated', { detail: updated }));
  }

  return newService;
}

export async function updateService(id, serviceData) {
  const services = getServices('Todas as Cidades');
  const target = services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id);
  const docId = target?.firestoreId || target?.id || id;

  if (docId) {
    try {
      await serviceRepository.update(String(docId), serviceData);
    } catch (err) {
      console.warn('[ServiceRepository] Erro ao atualizar serviço:', err.message);
    }
  }

  const updated = services.map(s => (s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id ? { ...s, ...serviceData } : s));
  _memServicesCache = updated;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai:services-updated', { detail: updated }));
  }
  return updated;
}

export async function deleteService(id) {
  const services = getServices('Todas as Cidades');
  const target = services.find(s => s.id === Number(id) || s.id === id || String(s.id) === String(id) || s.firestoreId === id);
  const docId = target?.firestoreId || target?.id || id;

  if (docId) {
    try {
      await serviceRepository.delete(String(docId));
    } catch (err) {
      console.warn('[ServiceRepository] Erro ao deletar serviço:', err.message);
    }
  }

  const updated = services.filter(s => s.id !== id && s.firestoreId !== id && String(s.id) !== String(id));
  _memServicesCache = updated;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai:services-updated', { detail: updated }));
  }
  return updated;
}

// ─────────────────────────────────────────────────────────────
// Freelance Service Orders Lifecycle (Firestore Realtime)
// Statuses: solicitado -> aceito (ou recusado) -> em_andamento -> concluido -> avaliado
// ─────────────────────────────────────────────────────────────

export const STORAGE_KEY_SERVICE_ORDERS = 'ivai_conecta_service_orders';

// Canal para sincronização instantânea entre abas
const ordersBroadcast = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('ivai_service_orders_channel')
  : null;

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

function notifyOrdersUpdated(orders) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_service_orders_updated', { detail: orders }));
  }
  if (ordersBroadcast) {
    try {
      ordersBroadcast.postMessage({ type: 'ORDERS_UPDATED', orders });
    } catch {}
  }
}

export async function createServiceOrder(orderData) {
  const orderId = orderData.id || `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const clientEmail = (orderData.clientEmail || '').toLowerCase().trim();
  const providerEmail = (orderData.providerEmail || '').toLowerCase().trim();
  const clientId = String(orderData.clientId || orderData.clientUid || '').trim();
  const providerId = String(orderData.providerId || orderData.providerUid || '').trim();

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
    ...orderData,
    id: orderId,
    firestoreId: orderId,
    clientId,
    clientUid: clientId,
    providerId,
    providerUid: providerId,
    clientEmail,
    providerEmail
  };

  const participants = Array.from(new Set([
    clientEmail,
    providerEmail,
    clientId,
    providerId
  ].filter(Boolean)));

  // 1. Salva no Firestore sob a coleção 'chats' (garante permissões e sincronização em tempo real entre partes)
  try {
    await setDoc(doc(db, 'chats', orderId), {
      isServiceOrder: true,
      participants,
      clientEmail,
      providerEmail,
      clientId,
      clientUid: clientId,
      providerId,
      providerUid: providerId,
      serviceOrder: newOrder,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Firestore chats] Falha ao registrar ordem de serviço:', err.message);
  }

  // 2. Tenta também registrar na coleção direta 'service_orders'
  try {
    await setDoc(doc(db, 'service_orders', orderId), newOrder);
  } catch {}

  // 3. Atualiza cache local e notifica componentes
  const all = getServiceOrders();
  const updated = [newOrder, ...all.filter(o => o.id !== orderId && o.firestoreId !== orderId)];
  saveServiceOrders(updated);
  notifyOrdersUpdated(updated);

  return newOrder;
}

export async function updateServiceOrderStatus(orderId, newStatus, note = '') {
  const orders = getServiceOrders();
  const order = orders.find(o => o.id === orderId || o.firestoreId === orderId);

  const statusLabels = {
    solicitado: 'Solicitado pelo Cliente',
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

  const docId = String(order?.firestoreId || order?.id || orderId);

  // 1. Atualiza no Firestore sob a coleção 'chats'
  try {
    const chatDocRef = doc(db, 'chats', docId);
    await updateDoc(chatDocRef, {
      'serviceOrder.status': newStatus,
      'serviceOrder.history': updatedHistory,
      'serviceOrder.updatedAt': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch {
    try {
      const chatDocRef = doc(db, 'chats', docId);
      await setDoc(chatDocRef, {
        isServiceOrder: true,
        serviceOrder: { ...order, ...patch },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar status no chat:', err.message);
    }
  }

  // 2. Tenta atualizar 'service_orders'
  try {
    await updateDoc(doc(db, 'service_orders', docId), patch);
  } catch {}

  // 3. Atualiza cache local e notifica
  const updatedList = orders.map(o => (o.id === orderId || o.firestoreId === orderId ? { ...o, ...patch } : o));
  if (!orders.some(o => o.id === orderId || o.firestoreId === orderId) && order) {
    updatedList.unshift({ ...order, ...patch });
  }
  saveServiceOrders(updatedList);
  notifyOrdersUpdated(updatedList);

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
  
  const docId = String(orderId);
  try {
    await updateDoc(doc(db, 'chats', docId), {
      'serviceOrder.review': reviewData,
      'serviceOrder.status': 'avaliado',
      updatedAt: new Date().toISOString()
    });
  } catch {
    try {
      await setDoc(doc(db, 'chats', docId), {
        serviceOrder: { review: reviewData, status: 'avaliado' },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch {}
  }

  try {
    await updateDoc(doc(db, 'service_orders', docId), {
      review: reviewData,
      status: 'avaliado'
    });
  } catch {}

  // Atualiza cache local com review
  const currentOrders = getServiceOrders();
  const updatedOrders = currentOrders.map(o => (o.id === orderId || o.firestoreId === orderId ? { ...o, review: reviewData, status: 'avaliado' } : o));
  saveServiceOrders(updatedOrders);
  notifyOrdersUpdated(updatedOrders);

  // 2. Atualiza estatísticas e histórico do serviço correspondente
  if (serviceId) {
    try {
      const targetService = getServiceById(serviceId);
      if (targetService) {
        const currentReviews = targetService.reviews || [];
        const updatedReviews = [reviewData, ...currentReviews];
        const totalScore = updatedReviews.reduce((acc, r) => acc + (Number(r.rating || r.stars) || 5), 0);
        const newAverage = Number((totalScore / updatedReviews.length).toFixed(1));

        const currentClosed = targetService.analytics?.closedDeals || 0;
        const newClosed = currentClosed + 1;
        const views = targetService.analytics?.views || 1;
        const newConversion = `${Math.min(100, Math.round((newClosed / Math.max(1, views)) * 100))}%`;

        const updatedAnalytics = {
          ...targetService.analytics,
          closedDeals: newClosed,
          conversionRate: newConversion
        };

        await updateService(serviceId, {
          rating: newAverage,
          reviewsCount: updatedReviews.length,
          reviews: updatedReviews,
          analytics: updatedAnalytics
        });
      }
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar notas do serviço:', err.message);
    }
  }

  return { success: true };
}

export function subscribeToServiceOrders(user, callback) {
  const filterForUser = (orders) => {
    if (!user) return orders;
    const uid = String(user.uid || user.id || '').trim();
    const email = (user.email || '').toLowerCase().trim();

    return orders.filter(o => {
      const pId = String(o.providerId || o.providerUid || '').trim();
      const cId = String(o.clientId || o.clientUid || '').trim();
      const pEmail = String(o.providerEmail || '').toLowerCase().trim();
      const cEmail = String(o.clientEmail || '').toLowerCase().trim();

      const matchesUid = Boolean(uid && (pId === uid || cId === uid));
      const matchesEmail = Boolean(email && (pEmail === email || cEmail === email));

      return matchesUid || matchesEmail;
    });
  };

  // Inicializa imediatamente com dados locais para resposta instantânea
  const cached = getServiceOrders();
  callback(filterForUser(cached), cached);

  // Listener local de eventos
  const handleLocalUpdate = (e) => {
    const list = Array.isArray(e.detail) ? e.detail : getServiceOrders();
    callback(filterForUser(list), list);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('ivai_service_orders_updated', handleLocalUpdate);
  }

  // Listener de BroadcastChannel entre abas
  const handleBroadcast = (e) => {
    if (e.data?.type === 'ORDERS_UPDATED' && Array.isArray(e.data.orders)) {
      callback(filterForUser(e.data.orders), e.data.orders);
    }
  };
  if (ordersBroadcast) {
    ordersBroadcast.addEventListener('message', handleBroadcast);
  }

  if (!user) {
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('ivai_service_orders_updated', handleLocalUpdate);
      if (ordersBroadcast) ordersBroadcast.removeEventListener('message', handleBroadcast);
    };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const userUid = String(user.uid || user.id || '').trim();
  const queryField = userEmail || userUid;

  let unsubChats = () => {};
  let unsubDirect = () => {};

  const mergeAndNotify = (newOrders) => {
    const local = getServiceOrders();
    const map = new Map();
    local.forEach(o => map.set(o.firestoreId || o.id, o));
    newOrders.forEach(o => map.set(o.firestoreId || o.id, o));

    const merged = Array.from(map.values()).sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));
    saveServiceOrders(merged);
    callback(filterForUser(merged), merged);
  };

  // 1. Assina coleção direta 'service_orders' via ServiceOrderRepository
  try {
    unsubDirect = serviceOrderRepository.subscribe((directOrders) => {
      mergeAndNotify(directOrders);
    }, (error) => {
      console.warn('[ServiceOrderRepository realtime] Aviso:', error.message);
    });
  } catch (err) {
    console.warn('[ServiceOrderRepository realtime] Erro:', err.message);
  }

  // 2. Assina chats relacionados a ordens de serviço
  if (queryField) {
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', queryField)
      );

      unsubChats = onSnapshot(q, (snapshot) => {
        const remoteOrders = snapshot.docs
          .filter(d => d.data()?.isServiceOrder === true && d.data()?.serviceOrder)
          .map(d => ({
            id: d.id,
            firestoreId: d.id,
            ...d.data().serviceOrder
          }));

        mergeAndNotify(remoteOrders);
      }, (error) => {
        console.warn('[Firestore chats realtime] Aviso:', error.message);
      });
    } catch (err) {
      console.warn('[Firestore chats realtime] Erro ao assinar:', err.message);
    }
  }

  return () => {
    unsubDirect();
    unsubChats();
    if (typeof window !== 'undefined') {
      window.removeEventListener('ivai_service_orders_updated', handleLocalUpdate);
    }
    if (ordersBroadcast) {
      ordersBroadcast.removeEventListener('message', handleBroadcast);
    }
  };
}

