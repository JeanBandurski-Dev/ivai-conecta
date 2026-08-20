/**
 * IVAÍ CONECTA - CAMADA DE SERVIÇOS DO FIREBASE (FIRESTORE & FALLBACK LOCAL)
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

import { db } from '../../public/js/firebase-config.js';
import { isFirebaseInitialized } from '../../public/js/firebase-config.js';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { seedData } from './seed-data.js';
const STORAGE_KEY_TALENTS = 'ivai_conecta_db_talents';
const STORAGE_KEY_JOBS = 'ivai_conecta_db_jobs';
const STORAGE_KEY_SERVICES = 'ivai_conecta_db_services';

/**
 * Retorna as cidades suportadas no Vale do Ivaí.
 */
export function getCities() {
  return seedData.cities;
}

/**
 * Obtém a lista de talentos (alunos), com suporte a filtro regional.
 */
export async function getTalents(selectedCity = 'Todas as Cidades') {
  let talents = [];

  if (isFirebaseInitialized) {
    try {
      const talentsRef = collection(db, 'students');
      let q = talentsRef;
      if (selectedCity && selectedCity !== 'Todas as Cidades') {
        q = query(talentsRef, where('city', '==', selectedCity));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        talents = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      }
    } catch (err) {
      console.warn('Firestore offline ou permissão pendente, utilizando dados locais:', err.message);
    }
  }

  if (!talents || talents.length === 0) {
    let localTalents = JSON.parse(localStorage.getItem(STORAGE_KEY_TALENTS));
    if (!localTalents || localTalents.length === 0) {
      localTalents = seedData.talents;
      localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(localTalents));
    }
    talents = localTalents;
  }

  if (selectedCity && selectedCity !== 'Todas as Cidades') {
    return talents.filter(t => t.city === selectedCity);
  }
  return talents;
}

/**
 * Obtém um estudante específico pelo ID.
 */
export async function getTalentById(talentId) {
  const idNum = Number(talentId);
  const talents = await getTalents();
  return talents.find(t => t.id === idNum || t.id === talentId) || talents[0];
}

/**
 * Adiciona um endosso acadêmico a um aluno.
 */
export async function addEndorsementToTalent(talentId, endorsementPayload) {
  // Salva no Local Storage imediatamente para atualização instantânea
  const talents = await getTalents();
  const idNum = Number(talentId);
  const talent = talents.find(t => t.id === idNum || t.id === talentId);
  if (talent) {
    if (!talent.endorsements) talent.endorsements = [];
    talent.endorsements.unshift(endorsementPayload);
    localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(talents));
  }

  // Tenta sincronizar com o Firestore em segundo plano
  if (isFirebaseInitialized) {
    updateDoc(doc(db, 'students', String(talentId)), {
      endorsements: arrayUnion(endorsementPayload)
    }).catch(err => console.warn('Sync Firestore endosso:', err.message));
  }

  return true;
}

/**
 * Obtém a lista de vagas com filtro regional.
 */
export async function getJobs(selectedCity = 'Todas as Cidades') {
  let jobs = [];

  if (isFirebaseInitialized) {
    try {
      const jobsRef = collection(db, 'jobs');
      let q = jobsRef;
      if (selectedCity && selectedCity !== 'Todas as Cidades') {
        q = query(jobsRef, where('city', '==', selectedCity));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        jobs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      }
    } catch (err) {
      console.warn('Firestore offline para Vagas, usando dados locais:', err.message);
    }
  }

  if (!jobs || jobs.length === 0) {
    let localJobs = JSON.parse(localStorage.getItem(STORAGE_KEY_JOBS));
    if (!localJobs || localJobs.length === 0) {
      localJobs = seedData.jobs;
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(localJobs));
    }
    jobs = localJobs;
  }

  if (selectedCity && selectedCity !== 'Todas as Cidades') {
    return jobs.filter(j => j.city === selectedCity);
  }
  return jobs;
}

/**
 * Obtém os serviços do marketplace com filtro regional.
 */
export async function getServices(selectedCity = 'Todas as Cidades') {
  let services = [];

  if (isFirebaseInitialized) {
    try {
      const servicesRef = collection(db, 'services');
      let q = servicesRef;
      if (selectedCity && selectedCity !== 'Todas as Cidades') {
        q = query(servicesRef, where('city', '==', selectedCity));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        services = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      }
    } catch (err) {
      console.warn('Firestore offline para Serviços, usando dados locais:', err.message);
    }
  }

  if (!services || services.length === 0) {
    let localServices = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVICES));
    if (!localServices || localServices.length === 0) {
      localServices = seedData.services;
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(localServices));
    }
    services = localServices;
  }

  if (selectedCity && selectedCity !== 'Todas as Cidades') {
    return services.filter(s => s.city === selectedCity);
  }
  return services;
}

/**
 * Cadastra um novo serviço no marketplace.
 */
export async function addService(servicePayload) {
  // Salva no Local Storage para exibição e reação instantânea no front-end
  let localServices = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVICES));
  if (!localServices || localServices.length === 0) {
    localServices = seedData.services;
  }
  localServices.unshift(servicePayload);
  localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(localServices));

  // Tenta sincronizar com o Firestore em segundo plano
  if (isFirebaseInitialized) {
    addDoc(collection(db, 'services'), servicePayload)
      .then(docRef => {
        servicePayload.id = docRef.id;
      })
      .catch(err => console.warn('Sync Firestore cadastro serviço:', err.message));
  }

  return servicePayload;
}
