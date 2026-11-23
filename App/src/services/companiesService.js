// Companies Service for Ivaí Conecta (Realtime Firestore + Local Cache)
import { db } from '../lib/firebase.js';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteField
} from 'firebase/firestore';
import { getJobs, subscribeToJobs, isJobActive } from './jobsService.js';
import { getTalents, subscribeToTalents } from './talentsService.js';
import { getServices, subscribeToServices } from './servicesService.js';
import { getUsersDB, getAuthUser, normalizeUserRole } from './authService.js';
import { matchCity } from '../utils/searchUtils.js';

export const STORAGE_KEY_COMPANIES = 'ivai_conecta_db_companies';

export const DEFAULT_COMPANIES = [];

let _memCompanyUsers = null;
let _memPublicCompanyUsers = [];

export function isCompanyUser(u) {
  if (!u || typeof u !== 'object') return false;
  if (u.isActive === false || u.blocked === true || String(u.status || '').toLowerCase() === 'blocked') return false;
  const r = normalizeUserRole(
    u.activeRole ||
    u.selectedRole ||
    u.profileType ||
    u.role ||
    ''
  );
  return r === 'empresa' || Boolean(u.isVerifiedCompany && !['aluno', 'professor', 'admin'].includes(r));
}

export async function syncPublicCompanyProfile(uid, sourceData) {
  if (!uid || !sourceData || typeof sourceData !== 'object') return;
  const role = normalizeUserRole(
    sourceData.activeRole ||
    sourceData.selectedRole ||
    sourceData.profileType ||
    sourceData.role ||
    ''
  );
  if (role !== 'empresa') return;

  await setDoc(doc(db, 'public_profiles', String(uid)), {
    uid: String(uid),
    name: String(sourceData.name || sourceData.razaoSocial || sourceData.nomeFantasia || '').slice(0, 120),
    city: String(sourceData.city || 'Ivaiporã').slice(0, 100),
    avatar: String(sourceData.avatar || sourceData.photoURL || sourceData.logo || '').slice(0, 2048),
    photoURL: String(sourceData.photoURL || sourceData.avatar || sourceData.logo || '').slice(0, 2048),
    bio: String(sourceData.bio || sourceData.about || '').slice(0, 1000),
    razaoSocial: String(sourceData.razaoSocial || '').slice(0, 120),
    nomeFantasia: String(sourceData.nomeFantasia || '').slice(0, 120),
    sector: String(sourceData.sector || '').slice(0, 160),
    about: String(sourceData.about || '').slice(0, 1000),
    cnpj: deleteField(),
    isVerifiedCompany: Boolean(sourceData.isVerifiedCompany),
    companyVerificationStatus: String(sourceData.companyVerificationStatus || '').slice(0, 30),
    isActive: sourceData.blocked !== true && String(sourceData.status || '').toLowerCase() !== 'blocked' && sourceData.isDeactivated !== true,
    blocked: sourceData.blocked === true,
    status: sourceData.blocked === true || String(sourceData.status || '').toLowerCase() === 'blocked' ? 'blocked' : 'active',
    role: 'empresa',
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export function getCompanies(city = 'Todas as Cidades') {
  const companyUsersMap = new Map();

  // 1. Prioriza dados reais vindos da assinatura do Firestore em memória
  if (Array.isArray(_memCompanyUsers)) {
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
      email: u.email || u.recruiterEmail || '',
      recruiterEmail: u.recruiterEmail || u.email || '',
      city: u.city || 'Ivaiporã',
      sector: u.sector || 'Comércio & Serviços',
      logo: u.avatar || u.logo || '',
      about: u.about || 'Empresa atuante no Vale do Ivaí.',
      cnpj: u.cnpj || '',
      isVerified: u.companyVerificationStatus === 'VALIDADA' && u.isVerifiedCompany === true,
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

    if (!targetComp && compName) {
      const uidKey = createdBy || cleanCompName;
      targetComp = {
        id: uidKey,
        uid: uidKey,
        _cleanKey: cleanCompName,
        name: compName,
        email: job.recruiterEmail || '',
        recruiterEmail: job.recruiterEmail || '',
        city: job.city || 'Ivaiporã',
        sector: job.sector || 'Comércio & Serviços',
        logo: job.companyLogo || '',
        about: 'Empresa parceira cadastrada no Ivaí Conecta.',
        cnpj: '',
        isVerified: false,
        rating: 5.0,
        reviews: 0,
        perks: []
      };
      map.set(uidKey, targetComp);
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

export function getRegisteredCompaniesCount() {
  const sources = _memPublicCompanyUsers.length > 0
    ? _memPublicCompanyUsers
    : (Array.isArray(_memCompanyUsers) ? _memCompanyUsers : []);

  const ids = new Set();
  sources.filter(isCompanyUser).forEach(company => {
    const id = String(company.uid || company.id || company.email || '').trim();
    if (id) ids.add(id);
  });

  return ids.size;
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
    const publicProfilesRef = collection(db, 'public_profiles');
    unsubscribeFirestore = onSnapshot(publicProfilesRef, (snap) => {
      // Perfis públicos permitem que visitantes anônimos vejam as empresas.
      _memPublicCompanyUsers = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(isCompanyUser);
      _memCompanyUsers = _memPublicCompanyUsers;

      // Mantém usuários não-empresa intactos e descarta empresas que não existem no Firestore
      const local = getUsersDB();
      const nonCompanyUsers = local.filter(u => !isCompanyUser(u));

      // Faz merge: parte dos não-empresa + empresas reais do Firestore
      const merged = [...nonCompanyUsers];
      _memPublicCompanyUsers.forEach(rc => {
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
  // Inicializa talentsList com dados já disponíveis em cache local para evitar
  // delay no primeiro render (emitMetrics é chamado imediatamente).
  let talentsList = getTalents('Todas as Cidades') || [];
  let companiesList = getCompanies('Todas as Cidades') || [];
  let jobsList = getJobs('Todas as Cidades') || [];
  let servicesList = getServices('Todas as Cidades') || [];

  const emitMetrics = () => {
    const activeJobs = jobsList.filter(isJobActive);
    const studentsCount = talentsList.filter(t => {
      const r = String(t?.role || '').toLowerCase().trim();
      return ['aluno', 'estudante', 'student'].includes(r) || Boolean(t?.course || t?.institution || t?.isVerifiedStudent);
    }).length;
    const candidatesCount = Math.max(0, talentsList.length - studentsCount);

    callback({
      talentsCount: talentsList.length,
      studentsCount,
      candidatesCount,
      companiesCount: getRegisteredCompaniesCount(),
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
