/**
 * IVAÍ CONECTA - SCRIPT DE POPULAÇÃO (SEED) DO FIREBASE FIRESTORE
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Credenciais do Projeto ivai-conecta-4a366
const firebaseConfig = {
  apiKey: "AIzaSyD0vBDSVrmerUmsqWee1aWvFB2NdGdyaSo",
  authDomain: "ivai-conecta-4a366.firebaseapp.com",
  projectId: "ivai-conecta-4a366",
  storageBucket: "ivai-conecta-4a366.firebasestorage.app",
  messagingSenderId: "380692802322",
  appId: "1:380692802322:web:d0c01dc577883086cda1cb",
  measurementId: "G-HGGXZ0FYTR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initialTalents = [
  {
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
      }
    ]
  },
  {
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
  }
];

const initialJobs = [
  {
    title: "Desenvolvedor Front-end Junior / Estagiário",
    company: "ValeTech Soluções Digitais",
    city: "Ivaiporã",
    type: "Tempo Integral / Híbrido",
    requiredSkills: ["JavaScript", "HTML5/CSS3", "React", "Git"]
  },
  {
    title: "Assistente Administrativo & Financeiro",
    company: "Cooperativa Agropecuária do Vale",
    city: "Ivaiporã",
    type: "Tempo Integral",
    requiredSkills: ["Excel Avançado", "Gestão Financeira", "ERP", "Atendimento ao Cliente"]
  }
];

const initialServices = [
  {
    providerName: "Marcos Eletricista & Automação",
    category: "Construção & Manutenção",
    city: "Ivaiporã",
    phone: "5543999887766",
    rating: 4.9,
    reviewsCount: 38,
    badge: "Verificado Ivaí Conecta",
    description: "Serviços residenciais e comerciais, quadros de distribuição e manutenção 24h."
  },
  {
    providerName: "TechVale - Suporte em Informática",
    category: "Tecnologia & Suporte",
    city: "Ivaiporã",
    phone: "5543999445566",
    rating: 4.8,
    reviewsCount: 52,
    badge: "Verificado Ivaí Conecta",
    description: "Formatação, remoção de vírus, montagem de computadores gamer e redes Wi-Fi empresariais."
  }
];

export async function seedFirestore() {
  console.log('🌱 Populando coleções no Firestore (ivai-conecta-4a366)...');
  try {
    for (let i = 0; i < initialTalents.length; i++) {
      await setDoc(doc(db, 'students', `student_${i+1}`), initialTalents[i]);
    }
    for (let i = 0; i < initialJobs.length; i++) {
      await setDoc(doc(db, 'jobs', `job_${i+1}`), initialJobs[i]);
    }
    for (let i = 0; i < initialServices.length; i++) {
      await setDoc(doc(db, 'services', `service_${i+1}`), initialServices[i]);
    }
    console.log('✅ Firestore populado com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao popular Firestore:', err);
    return false;
  }
}
