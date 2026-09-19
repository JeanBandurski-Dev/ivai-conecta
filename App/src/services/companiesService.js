// Companies Service for Ivaí Conecta (Realtime Firestore + Local Cache)
import { db } from '../lib/firebase.js';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { getJobs, subscribeToJobs } from './jobsService.js';
import { subscribeToTalents } from './talentsService.js';
import { subscribeToServices } from './servicesService.js';
import { getUsersDB } from './authService.js';
import { matchCity } from '../utils/searchUtils.js';

export const STORAGE_KEY_COMPANIES = 'ivai_conecta_db_companies';

export const DEFAULT_COMPANIES = [];

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
    matchCity(c.city, city) ||
    (c.activeJobs && c.activeJobs.some(j => matchCity(j.city, city)))
  );
}

export function subscribeToCompanies(city = 'Todas as Cidades', callback) {
  let unsubscribeFirestore = () => {};

  const emit = () => {
    const list = getCompanies(city);
    callback(list);
  };

  // Disparo inicial com dados do cache local
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
      // Empresas reais vindas do Firestore (pode ser lista vazia)
      const remoteCompanyUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));

      // Mantém usuários não-empresa intactos e descarta empresas que não existem no Firestore
      const local = getUsersDB();
      const nonCompanyUsers = local.filter(u => u?.role !== 'empresa');

      // Faz merge: parte dos não-empresa + empresas reais do Firestore
      const merged = [...nonCompanyUsers];
      remoteCompanyUsers.forEach(rc => {
        const idx = merged.findIndex(m => m.uid === rc.uid || m.email === rc.email);
        if (idx !== -1) merged[idx] = { ...merged[idx], ...rc };
        else merged.push(rc);
      });

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ivai_conecta_users_db', JSON.stringify(merged));
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
