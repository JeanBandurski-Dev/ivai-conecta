// Companies Service for Ivaí Conecta (Realtime Firestore + Local Cache)
import { db } from '../lib/firebase.js';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { getJobs, subscribeToJobs, isJobActive } from './jobsService.js';
import { getTalents, subscribeToTalents } from './talentsService.js';
import { getServices, subscribeToServices } from './servicesService.js';
import { getUsersDB, getAuthUser } from './authService.js';
import { matchCity } from '../utils/searchUtils.js';

export const STORAGE_KEY_COMPANIES = 'ivai_conecta_db_companies';

export const DEFAULT_COMPANIES = [];

let _memCompanyUsers = null;

export function isCompanyUser(u) {
  if (!u || typeof u !== 'object') return false;
  const r = String(u.role || '').toLowerCase().trim();
  return r === 'empresa' || r === 'company' || r === 'recrutador' || Boolean(u.isVerifiedCompany && r !== 'aluno' && r !== 'professor' && r !== 'admin');
}

export function getCompanies(city = 'Todas as Cidades') {
  const companyUsersMap = new Map();

  // 1. Prioriza dados reais vindos da assinatura do Firestore em memória
  if (Array.isArray(_memCompanyUsers) && _memCompanyUsers.length > 0) {
    _memCompanyUsers.filter(isCompanyUser).forEach(u => companyUsersMap.set(String(u.uid || u.id || u.email), u));
  } else {
    // Fallback inicial para cache local
    const users = getUsersDB() || [];
    users.filter(isCompanyUser).forEach(u => companyUsersMap.set(String(u.uid || u.id || u.email), u));
  }

  // 2. Reconhece o usuário autenticado caso seja empresa
  const authUser = getAuthUser();
  if (authUser && isCompanyUser(authUser)) {
    companyUsersMap.set(String(authUser.uid || authUser.id || authUser.email), authUser);
  }

  const companyUsers = Array.from(companyUsersMap.values());
  const allJobs = getJobs('Todas as Cidades');

  // Mapa com deduplicação por UID e nome normalizado
  const map = new Map();

  // Adiciona empresas cadastradas oficialmente
  companyUsers.forEach(u => {
    const compName = (u.razaoSocial || u.nomeFantasia || u.name || 'Empresa').trim();
    const cleanKey = compName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uidKey = String(u.uid || u.id || cleanKey);

    map.set(uidKey, {
      id: u.uid || u.id || uidKey,
      uid: u.uid || u.id || uidKey,
      _cleanKey: cleanKey,
      name: compName,
      city: u.city || 'Ivaiporã',
      sector: u.sector || 'Comércio & Serviços',
      logo: u.avatar || u.logo || '',
      about: u.about || 'Empresa atuante no Vale do Ivaí.',
      cnpj: u.cnpj || '',
      isVerified: Boolean(u.cnpj || u.isVerifiedCompany),
      rating: u.rating || 5.0,
      reviews: u.reviewsCount || 0,
      perks: u.perks || ['Ambiente Colaborativo', 'Oportunidade de Crescimento']
    });
  });

  // Associa logos ou cidades adicionais vindos de vagas às empresas cadastradas
  allJobs.forEach(job => {
    if (!job) return;
    const compName = (job.company || '').trim();
    const cleanCompName = compName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const createdBy = job.createdBy ? String(job.createdBy) : null;

    let targetComp = null;
    for (const comp of map.values()) {
      if ((createdBy && (comp.uid === createdBy || comp.id === createdBy)) || (cleanCompName && comp._cleanKey === cleanCompName)) {
        targetComp = comp;
        break;
      }
    }

    if (targetComp) {
      if (!targetComp.logo && job.companyLogo) targetComp.logo = job.companyLogo;
      if (!targetComp.city && job.city) targetComp.city = job.city;
    }
  });

  // Calcula vagas ativas para cada empresa em tempo real
  const companiesList = Array.from(map.values()).map(comp => {
    const compNameLower = comp.name.toLowerCase();
    const cleanCompName = comp._cleanKey || compNameLower.replace(/[^a-z0-9]/g, '');
    const activeJobs = allJobs.filter(j => 
      isJobActive(j) && (
        (comp.uid && j.createdBy && String(j.createdBy) === String(comp.uid)) ||
        (comp.id && j.createdBy && String(j.createdBy) === String(comp.id)) ||
        (j.company && j.company.toLowerCase().trim() === compNameLower) ||
        (j.company && j.company.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCompName)
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
      _memCompanyUsers = remoteCompanyUsers;

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
  // Inicializa imediatamente com dados em cache para evitar emitir contadores parciais ou zerados
  let talentsList = getTalents('Todas as Cidades') || [];
  let companiesList = getCompanies('Todas as Cidades') || [];
  let jobsList = getJobs('Todas as Cidades') || [];
  let servicesList = getServices('Todas as Cidades') || [];

  const emitMetrics = () => {
    const activeJobs = jobsList.filter(isJobActive);
    callback({
      talentsCount: talentsList.length,
      companiesCount: companiesList.length,
      jobsCount: activeJobs.length,
      servicesCount: servicesList.length
    });
  };

  // Disparo inicial imediato consolidado
  emitMetrics();

  // Escuta todas as coleções consolidadas ('Todas as Cidades') para refletir o impacto regional
  const unsubTalents = subscribeToTalents('Todas as Cidades', data => {
    if (Array.isArray(data)) {
      talentsList = data;
      emitMetrics();
    }
  });

  const unsubCompanies = subscribeToCompanies('Todas as Cidades', data => {
    if (Array.isArray(data)) {
      companiesList = data;
      emitMetrics();
    }
  });

  const unsubJobs = subscribeToJobs('Todas as Cidades', data => {
    if (Array.isArray(data)) {
      jobsList = data;
      emitMetrics();
    }
  });

  const unsubServices = subscribeToServices('Todas as Cidades', data => {
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
