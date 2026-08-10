/**
 * IVAÍ CONECTA - CAMADA DE SERVIÇOS DO FIREBASE (FIRESTORE & FALLBACK LOCAL)
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

import { db, isFirebaseInitialized } from '../../public/js/firebase-config.js';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  query, 
  where 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Seed Data Fallback incorporado para compatibilidade nativa de browser ES Modules
const seedData = {
  cities: [
    "Todas as Cidades",
    "Ivaiporã",
    "Jardim Alegre",
    "São João do Ivaí",
    "Manoel Ribas",
    "Lunardelli",
    "Borrazópolis",
    "Ariranha do Ivaí",
    "Grandes Rios"
  ],
  talents: [
    {
      id: 1,
      name: "Lucas Eduardo Silva",
      course: "Análise e Desenvolvimento de Sistemas",
      institution: "IFPR Campus Ivaiporã",
      city: "Ivaiporã",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      skills: ["JavaScript", "HTML5/CSS3", "React", "Node.js", "Git", "SQL"],
      endorsements: [
        {
          id: "end_01",
          profName: "Prof. Dr. Ricardo Oliveira",
          profEmail: "ricardo.oliveira@ifpr.edu.br",
          institution: "IFPR Campus Ivaiporã",
          discipline: "Desenvolvimento Web & Banco de Dados",
          quote: "Aluno exemplar, com ótimo raciocínio lógico e liderança em projetos práticos da comunidade acadêmica.",
          isVerified: true
        },
        {
          id: "end_02",
          profName: "Profª. Ma. Amanda Costa",
          profEmail: "amanda.costa@ifpr.edu.br",
          institution: "IFPR Campus Ivaiporã",
          discipline: "Engenharia de Software",
          quote: "Demonstrou alto domínio em metodologias ágeis e capacidade técnica destacada na criação de APIs.",
          isVerified: true
        }
      ]
    },
    {
      id: 2,
      name: "Beatriz Santos",
      course: "Administração",
      institution: "Univale Ivaiporã",
      city: "Jardim Alegre",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
      skills: ["Gestão Financeira", "Excel Avançado", "Marketing Digital", "ERP", "Atendimento ao Cliente"],
      endorsements: [
        {
          id: "end_03",
          profName: "Prof. Carlos Alberto Ramos",
          profEmail: "carlos.ramos@univale.edu.br",
          institution: "Univale Ivaiporã",
          discipline: "Gestão Financeira e Orçamentária",
          quote: "Extremamente dedicada, responsável e proativa na solução de casos de gestão empresarial.",
          isVerified: true
        }
      ]
    },
    {
      id: 3,
      name: "Matheus Henrique",
      course: "Técnico em Eletrotécnica",
      institution: "IFPR Campus Ivaiporã",
      city: "São João do Ivaí",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
      skills: ["Instalações Elétricas", "Automação Industrial", "Comandos Elétricos", "AutoCAD", "NR-10"],
      endorsements: [
        {
          id: "end_04",
          profName: "Prof. Eng. Fernando Souza",
          profEmail: "fernando.souza@ifpr.edu.br",
          institution: "IFPR Campus Ivaiporã",
          discipline: "Instalações Elétricas Industriais",
          quote: "Profissional técnico com excelente visão de segurança e precisão em diagramas unifilares.",
          isVerified: true
        }
      ]
    },
    {
      id: 4,
      name: "Camila Fernandes",
      course: "Design Gráfico & Mídias",
      institution: "UENP / Unicesumar",
      city: "Manoel Ribas",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250",
      skills: ["Figma", "Photoshop", "Branding", "UI/UX Design", "Social Media"],
      endorsements: [
        {
          id: "end_05",
          profName: "Profª. Dra. Vanessa Martins",
          profEmail: "vanessa.martins@uenp.edu.br",
          institution: "UENP",
          discipline: "Identidade Visual & Experiência do Usuário",
          quote: "Camila possui um olhar estético apurado e cria identidades visuais memoráveis para o comércio regional.",
          isVerified: true
        }
      ]
    }
  ],
  jobs: [
    {
      id: 101,
      title: "Desenvolvedor Front-end Junior / Estagiário",
      company: "ValeTech Soluções Digitais",
      city: "Ivaiporã",
      type: "Tempo Integral / Híbrido",
      requiredSkills: ["JavaScript", "HTML5/CSS3", "React", "Git"]
    },
    {
      id: 102,
      title: "Assistente Administrativo & Financeiro",
      company: "Cooperativa Agropecuária do Vale",
      city: "Ivaiporã",
      type: "Tempo Integral",
      requiredSkills: ["Excel Avançado", "Gestão Financeira", "ERP", "Atendimento ao Cliente"]
    },
    {
      id: 103,
      title: "Técnico de Manutenção Elétrica Industrial",
      company: "Indústria Metalúrgica Ivaiporã",
      city: "São João do Ivaí",
      type: "Tempo Integral",
      requiredSkills: ["Instalações Elétricas", "Comandos Elétricos", "NR-10", "Automação Industrial"]
    },
    {
      id: 104,
      title: "Designer de Mídias Sociais & Marketing",
      company: "Agência Conect@ Comunicação",
      city: "Jardim Alegre",
      type: "Meio Período / Remoto",
      requiredSkills: ["Figma", "Photoshop", "Social Media", "Branding"]
    }
  ],
  services: [
    {
      id: 201,
      providerName: "Marcos Eletricista & Automação",
      category: "Construção & Manutenção",
      city: "Ivaiporã",
      phone: "5543999887766",
      rating: 4.9,
      reviewsCount: 38,
      badge: "Verificado Ivaí Conecta",
      description: "Serviços residenciais e comerciais, padrões Copel, quadros de distribuição e manutenção de emergência 24h."
    },
    {
      id: 202,
      providerName: "Ana Paula - Design & Redes Sociais",
      category: "Marketing & Design",
      city: "Jardim Alegre",
      phone: "5543999112233",
      rating: 5.0,
      reviewsCount: 24,
      badge: "Destaque da Semana",
      description: "Criação de logotipos, gestão de Instagram/Facebook, materiais impressos e identidade visual para o comércio local."
    },
    {
      id: 203,
      providerName: "TechVale - Suporte em Informática",
      category: "Tecnologia & Suporte",
      city: "Ivaiporã",
      phone: "5543999445566",
      rating: 4.8,
      reviewsCount: 52,
      badge: "Verificado Ivaí Conecta",
      description: "Formatação, remoção de vírus, montagem de computadores gamer, redes Wi-Fi empresariais e instalação de câmeras."
    },
    {
      id: 204,
      providerName: "ClimaIvaí Climatização Split",
      category: "Manutenção Doméstica",
      city: "Manoel Ribas",
      phone: "5543999778899",
      rating: 4.9,
      reviewsCount: 19,
      badge: "Certificado",
      description: "Limpeza, higienização, recarga de gás e instalação de ar condicionado split em toda a microrregião."
    }
  ]
};

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
