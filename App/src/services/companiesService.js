// Companies Service for Ivaí Conecta (Realtime Firestore + Local Cache)
import { db } from '../lib/firebase.js';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { getJobs, subscribeToJobs } from './jobsService.js';
import { getTalents, subscribeToTalents } from './talentsService.js';
import { getServices, subscribeToServices } from './servicesService.js';
import { getUsersDB } from './authService.js';

export const STORAGE_KEY_COMPANIES = 'ivai_conecta_db_companies';

export const DEFAULT_COMPANIES = [
  {
    id: 'empresa_valetech',
    name: 'ValeTech Soluções Digitais',
    city: 'Ivaiporã',
    sector: 'Tecnologia & Inovação',
    logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=200',
    about: 'Líder em desenvolvimento de software e transformação digital no Vale do Ivaí. Foco em formação e absorção de talentos regionais.',
    cnpj: '45.123.890/0001-12',
    isVerified: true,
    rating: 4.9,
    reviews: 18,
    perks: ['Trabalho Híbrido', 'Bolsa de Estudos', 'Plano de Saúde', 'Ambiente Colaborativo']
  },
  {
    id: 'empresa_coamo',
    name: 'Coamo Agroindustrial Cooperativa',
    city: 'Ivaiporã',
    sector: 'Agronegócio & Cooperativismo',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200',
    about: 'Uma das maiores cooperativas da América Latina, gerando centenas de oportunidades industriais, administrativas e agronômicas no Vale do Ivaí.',
    cnpj: '75.890.123/0001-45',
    isVerified: true,
    rating: 4.8,
    reviews: 34,
    perks: ['Participação nos Resultados', 'Plano Odontológico', 'Vale Alimentação', 'Seguro de Vida']
  },
  {
    id: 'empresa_sicredi',
    name: 'Sicredi Vale do Ivaí',
    city: 'Ivaiporã',
    sector: 'Instituição Financeira Cooperativa',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200',
    about: 'Construindo juntos uma sociedade mais próspera. Oportunidades nas áreas financeira, de atendimento, crédito e tecnologia bancária regional.',
    cnpj: '01.234.567/0001-89',
    isVerified: true,
    rating: 4.9,
    reviews: 26,
    perks: ['Previdência Privada', 'Auxílio Educação', 'Plano de Saúde Unimed', 'Carreira Estruturada']
  },
  {
    id: 'empresa_hospital_ivaipora',
    name: 'Hospital e Maternidade Ivaiporã',
    city: 'Ivaiporã',
    sector: 'Saúde & Cuidados Hospitalares',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200',
    about: 'Referência em atendimento médico e emergencial no Vale do Ivaí. Integração constante de técnicos, enfermeiros, médicos e equipe administrativa.',
    cnpj: '12.345.678/0001-90',
    isVerified: true,
    rating: 4.7,
    reviews: 19,
    perks: ['Refeitório no Local', 'Treinamento Hospitalar', 'Adicional de Insalubridade']
  },
  {
    id: 'empresa_super_ivaipora',
    name: 'Supermercados Ivaiporã',
    city: 'Ivaiporã',
    sector: 'Varejo & Distribuição Alimentícia',
    logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=200',
    about: 'Rede varejista tradicional presente nos principais polos do Vale do Ivaí, contratando jovens aprendizes, operadores de caixa e lideranças de loja.',
    cnpj: '23.456.789/0001-01',
    isVerified: true,
    rating: 4.6,
    reviews: 15,
    perks: ['Vale Transporte', 'Desconto em Compras', 'Plano de Carreira Interno']
  },
  {
    id: 'empresa_inovavale',
    name: 'InovaVale Hub Regional',
    city: 'Jardim Alegre',
    sector: 'Inovação & Coworking',
    logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=200',
    about: 'Espaço compartilhado e aceleradora de negócios locais conectando startups, autônomos e cooperativas da região central do Paraná.',
    cnpj: '34.567.890/0001-23',
    isVerified: true,
    rating: 4.9,
    reviews: 12,
    perks: ['Ambiente Aberto', 'Café & Networking', 'Capacitação Contínua']
  }
];

export function getCompanies(city = 'Todas as Cidades') {
  const users = getUsersDB() || [];
  const companyUsers = users.filter(u => u?.role === 'empresa');
  const allJobs = getJobs('Todas as Cidades');

  // Mapa com deduplicação por nome normalizado
  const map = new Map();

  // 1. Adiciona empresas padrão
  DEFAULT_COMPANIES.forEach(comp => {
    map.set(comp.name.toLowerCase().trim(), { ...comp });
  });

  // 2. Adiciona empresas cadastradas via registro de usuário
  companyUsers.forEach(u => {
    const compName = (u.razaoSocial || u.nomeFantasia || u.name || 'Empresa').trim();
    const key = compName.toLowerCase();
    const existing = map.get(key) || {};

    map.set(key, {
      ...existing,
      id: u.uid || u.id || existing.id || `comp_${Date.now()}`,
      uid: u.uid || existing.uid,
      name: compName,
      city: u.city || existing.city || 'Ivaiporã',
      sector: u.sector || existing.sector || 'Comércio & Serviços',
      logo: u.avatar || u.logo || existing.logo || '',
      about: u.about || existing.about || 'Empresa atuante no Vale do Ivaí.',
      cnpj: u.cnpj || existing.cnpj || '',
      isVerified: Boolean(u.cnpj || u.isVerifiedCompany || existing.isVerified),
      rating: u.rating || existing.rating || 5.0,
      reviews: u.reviewsCount || existing.reviews || 0,
      perks: u.perks || existing.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento']
    });
  });

  // 3. Adiciona empresas detectadas a partir de vagas publicadas
  allJobs.forEach(job => {
    if (!job?.company) return;
    const compName = job.company.trim();
    const key = compName.toLowerCase();
    const existing = map.get(key);

    if (existing) {
      if (!existing.logo && job.companyLogo) existing.logo = job.companyLogo;
      if (!existing.city && job.city) existing.city = job.city;
    } else {
      map.set(key, {
        id: job.createdBy || `comp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: compName,
        city: job.city || 'Ivaiporã',
        sector: 'Setor Corporativo',
        logo: job.companyLogo || '',
        about: `Empresa com oportunidades abertas no portal Ivaí Conecta em ${job.city || 'Ivaiporã'}.`,
        cnpj: '',
        isVerified: true,
        rating: 4.8,
        reviews: 8,
        perks: ['Oportunidades de Aprendizado', 'Desenvolvimento Regional']
      });
    }
  });

  // 4. Calcula vagas ativas para cada empresa em tempo real
  const companiesList = Array.from(map.values()).map(comp => {
    const compNameLower = comp.name.toLowerCase();
    const activeJobs = allJobs.filter(j => 
      j.status === 'Ativa' && (
        (j.company && j.company.toLowerCase().trim() === compNameLower) ||
        (comp.uid && j.createdBy && String(j.createdBy) === String(comp.uid)) ||
        (comp.id && j.createdBy && String(j.createdBy) === String(comp.id))
      )
    );
    return {
      ...comp,
      activeJobsCount: activeJobs.length,
      activeJobs
    };
  });

  // Ordena: empresas com mais vagas ativas primeiro, depois por avaliação
  companiesList.sort((a, b) => {
    if (b.activeJobsCount !== a.activeJobsCount) {
      return b.activeJobsCount - a.activeJobsCount;
    }
    return (b.rating || 0) - (a.rating || 0);
  });

  if (!city || city === 'Todas as Cidades') {
    return companiesList;
  }

  return companiesList.filter(c => 
    (c.city && c.city.toLowerCase() === city.toLowerCase()) ||
    (c.activeJobs && c.activeJobs.some(j => j.city && j.city.toLowerCase() === city.toLowerCase()))
  );
}

export function subscribeToCompanies(city = 'Todas as Cidades', callback) {
  let unsubscribeFirestore = () => {};

  const emit = () => {
    const list = getCompanies(city);
    callback(list);
  };

  // Disparo inicial imediato
  emit();

  // Escuta jobs em tempo real para recalcular contagem de vagas
  const unsubJobs = subscribeToJobs('Todas as Cidades', () => {
    emit();
  });

  // Escuta users (empresas) do Firestore em tempo real
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'empresa'));
    unsubscribeFirestore = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const remoteCompanyUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        const local = getUsersDB();
        const merged = [...local];
        remoteCompanyUsers.forEach(rc => {
          const idx = merged.findIndex(m => m.uid === rc.uid || m.email === rc.email);
          if (idx !== -1) merged[idx] = { ...merged[idx], ...rc };
          else merged.push(rc);
        });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ivai_conecta_users_db', JSON.stringify(merged));
        }
      }
      emit();
    }, () => {
      emit();
    });
  } catch {
    emit();
  }

  return () => {
    unsubJobs();
    unsubscribeFirestore();
  };
}

export function subscribeToPlatformMetrics(city = 'Todas as Cidades', callback) {
  let talentsList = [];
  let companiesList = [];
  let jobsList = [];
  let servicesList = [];

  const emitMetrics = () => {
    const activeJobs = jobsList.filter(j => j.status === 'Ativa');
    callback({
      talentsCount: talentsList.length,
      companiesCount: companiesList.length,
      jobsCount: activeJobs.length,
      servicesCount: servicesList.length
    });
  };

  const unsubTalents = subscribeToTalents(city, data => {
    if (Array.isArray(data)) {
      talentsList = data;
      emitMetrics();
    }
  });

  const unsubCompanies = subscribeToCompanies(city, data => {
    if (Array.isArray(data)) {
      companiesList = data;
      emitMetrics();
    }
  });

  const unsubJobs = subscribeToJobs(city, data => {
    if (Array.isArray(data)) {
      jobsList = data;
      emitMetrics();
    }
  });

  const unsubServices = subscribeToServices(city, data => {
    if (Array.isArray(data)) {
      servicesList = data;
      emitMetrics();
    }
  });

  return () => {
    unsubTalents();
    unsubCompanies();
    unsubJobs();
    unsubServices();
  };
}
