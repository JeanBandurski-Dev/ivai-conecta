/**
 * IVAÍ CONECTA - CONTROLADOR UNIFICADO E INTEGRADO (SUPORTE FILE:// E HTTP://)
 * Funciona nativamente via duplo clique no Windows Explorer e via Servidor Web.
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

(function() {
  'use strict';

  // Configuração Oficial do Firebase Console (ivai-conecta-4a366)
  const firebaseConfig = window.FIREBASE_ENV_CONFIG || {
    apiKey: "AIzaSyD0vBDSVrmerUmsqWee1aWvFB2NdGdyaSo",
    authDomain: "ivai-conecta-4a366.firebaseapp.com",
    projectId: "ivai-conecta-4a366",
    storageBucket: "ivai-conecta-4a366.firebasestorage.app",
    messagingSenderId: "380692802322",
    appId: "1:380692802322:web:d0c01dc577883086cda1cb",
    measurementId: "G-HGGXZ0FYTR"
  };

  // Keys do Local Storage
  const STORAGE_KEY_CITY = 'ivai_conecta_selected_city';
  const STORAGE_KEY_TALENTS = 'ivai_conecta_db_talents';
  const STORAGE_KEY_JOBS = 'ivai_conecta_db_jobs';
  const STORAGE_KEY_SERVICES = 'ivai_conecta_db_services';

  // Seed Data Fallback incorporado para funcionamento offline e zero-config
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

  // Motor de Matching
  function calculateMatchScore(studentSkills = [], requiredSkills = []) {
    if (!requiredSkills || requiredSkills.length === 0) return 0;
    if (!studentSkills || studentSkills.length === 0) return 0;
    
    const normalizedStudent = studentSkills.map(s => String(s).toLowerCase().trim());
    let matches = 0;
    
    requiredSkills.forEach(req => {
      if (normalizedStudent.includes(String(req).toLowerCase().trim())) {
        matches++;
      }
    });

    return Math.round((matches / requiredSkills.length) * 100);
  }

  // Gerador de WhatsApp
  function generateWhatsAppLink(phone = '', serviceName = '', providerName = '', city = '') {
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = `55${cleanPhone}`;
    }
    const message = `Olá ${providerName}! Encontrei seu serviço de "${serviceName}" em ${city} através da plataforma Ivaí Conecta. Gostaria de solicitar um orçamento.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  // Validação de Endosso
  function validateEndorsement(data) {
    const { profName, profEmail, institution, discipline, quote } = data || {};
    if (!profName || profName.trim().length < 3) return { isValid: false, error: 'Informe o nome do professor.' };
    if (!profEmail || !profEmail.includes('@')) return { isValid: false, error: 'Informe um e-mail válido.' };
    if (!discipline || discipline.trim().length < 3) return { isValid: false, error: 'Informe a disciplina recomendada.' };
    if (!quote || quote.trim().length < 10) return { isValid: false, error: 'O parecer deve ter no mínimo 10 caracteres.' };
    return { isValid: true };
  }

  function createEndorsementPayload(data) {
    return {
      id: `endosso_${Date.now()}`,
      profName: data.profName.trim(),
      profEmail: data.profEmail.trim().toLowerCase(),
      institution: data.institution.trim(),
      discipline: data.discipline.trim(),
      quote: data.quote.trim(),
      verifiedAt: new Date().toISOString(),
      isVerified: true
    };
  }

  // Camada Local Data Store
  function getSelectedCity() {
    return localStorage.getItem(STORAGE_KEY_CITY) || 'Todas as Cidades';
  }

  function setSelectedCity(cityName) {
    localStorage.setItem(STORAGE_KEY_CITY, cityName);
    document.querySelectorAll('.city-select-global').forEach(select => {
      select.value = cityName;
    });
    window.dispatchEvent(new CustomEvent('cityChanged', { detail: cityName }));
  }

  function getCities() {
    return seedData.cities;
  }

  function getTalents(selectedCity = getSelectedCity()) {
    let local = JSON.parse(localStorage.getItem(STORAGE_KEY_TALENTS));
    if (!local || local.length === 0) {
      local = seedData.talents;
      localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(local));
    }
    if (selectedCity && selectedCity !== 'Todas as Cidades') {
      return local.filter(t => t.city === selectedCity);
    }
    return local;
  }

  function getTalentById(id) {
    const talents = getTalents();
    return talents.find(t => t.id == id) || talents[0];
  }

  function addEndorsementToTalent(id, payload) {
    const talents = getTalents('Todas as Cidades');
    const talent = talents.find(t => t.id == id);
    if (talent) {
      if (!talent.endorsements) talent.endorsements = [];
      talent.endorsements.unshift(payload);
      localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(talents));
    }
    return true;
  }

  function getJobs(selectedCity = getSelectedCity()) {
    let local = JSON.parse(localStorage.getItem(STORAGE_KEY_JOBS));
    if (!local || local.length === 0) {
      local = seedData.jobs;
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(local));
    }
    if (selectedCity && selectedCity !== 'Todas as Cidades') {
      return local.filter(j => j.city === selectedCity);
    }
    return local;
  }

  function getServices(selectedCity = getSelectedCity()) {
    let local = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVICES));
    if (!local || local.length === 0) {
      local = seedData.services;
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(local));
    }
    if (selectedCity && selectedCity !== 'Todas as Cidades') {
      return local.filter(s => s.city === selectedCity);
    }
    return local;
  }

  function addService(payload) {
    let local = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVICES));
    if (!local || local.length === 0) {
      local = seedData.services;
    }
    local.unshift(payload);
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(local));
    return payload;
  }

  // Toast Visual
  function showToast(message) {
    let toast = document.getElementById('ivai-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ivai-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0A1128;
        color: #FFF;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 9999;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        border-left: 5px solid #0052FF;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✨ ${message}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 3500);
  }

  // Modais
  function setupModalListeners() {
    document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('active');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function initCitySelectors() {
    const citySelects = document.querySelectorAll('.city-select-global');
    const currentCity = getSelectedCity();
    const cities = getCities();

    citySelects.forEach(select => {
      select.innerHTML = '';
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city === 'Todas as Cidades' ? '📍 Vale do Ivaí (Todas)' : `📍 ${city}`;
        if (city === currentCity) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener('change', (e) => {
        setSelectedCity(e.target.value);
      });
    });
  }

  // Exportação Global window.IvaiConecta
  window.IvaiConecta = {
    firebaseConfig,
    getCities,
    getSelectedCity,
    setSelectedCity,
    getTalents,
    getTalentById,
    addEndorsementToTalent,
    getJobs,
    getServices,
    addService,
    calculateMatchScore,
    generateWhatsAppLink,
    validateEndorsement,
    createEndorsementPayload,
    showToast,
    openModal,
    closeModal,
    setupModalListeners,
    initCitySelectors
  };

  // Init DOM
  document.addEventListener('DOMContentLoaded', () => {
    initCitySelectors();
    setupModalListeners();
  });

})();
