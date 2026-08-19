/**
 * IVAÍ CONECTA - CONTROLADOR UNIFICADO E INTEGRADO (SUPORTE FILE:// E HTTP://)
 * Funciona nativamente via duplo clique no Windows Explorer e via Servidor Web.
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

import { watchAuthState, getUserProfile, logoutUser } from '../../src/database/auth-service.js';

(function () {
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
  const STORAGE_KEY_USER_ROLE = 'ivai_conecta_current_user_role';
  const STORAGE_KEY_AUTH_USER = 'ivai_conecta_auth_user';
  const STORAGE_KEY_USERS_DB = 'ivai_conecta_users_db';

  // Configuração dos Perfis de Usuários Suportados
  const USER_ROLES = {
    aluno: {
      id: 'aluno',
      name: 'Aluno / Estudante',
      badge: 'Estudante (IFPR/UENP/Univale)',
      desc: 'Foco em estágios, qualificações acadêmicas e endossos docentes.'
    },
    freelancer: {
      id: 'freelancer',
      name: 'Freelancer / Autônomo',
      badge: 'Prestador de Serviço Autônomo',
      desc: 'Foco em divulgar serviços locais, orçamentos e trabalhos sob demanda.'
    },
    candidato: {
      id: 'candidato',
      name: 'Candidato / Profissional',
      badge: 'Candidato / Profissional',
      desc: 'Foco em vagas de emprego CLT/PJ e oportunidades na região.'
    },
    empresa: {
      id: 'empresa',
      name: 'Empresa / Recrutador',
      badge: 'Empresa / Recrutador',
      desc: 'Foco em publicar vagas, encontrar talentos e contratar.'
    }
  };

  // Base de Contas Cadastradas (Inicialização Seed + LocalStorage)
  function getUsersDB() {
    let users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB));
    if (!users || users.length === 0) {
      users = [
        {
          email: 'aluno@ivaiconecta.com.br',
          password: '123456',
          name: 'Lucas Eduardo Silva',
          city: 'Ivaiporã',
          role: 'aluno',
          badge: 'Estudante (IFPR Campus Ivaiporã)',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
        },
        {
          email: 'freelancer@ivaiconecta.com.br',
          password: '123456',
          name: 'Marcos Eletricista & Automação',
          city: 'Ivaiporã',
          role: 'freelancer',
          badge: 'Prestador de Serviço Autônomo',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
        },
        {
          email: 'candidato@ivaiconecta.com.br',
          password: '123456',
          name: 'Beatriz Santos',
          city: 'Jardim Alegre',
          role: 'candidato',
          badge: 'Candidato / Profissional',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
        },
        {
          email: 'empresa@ivaiconecta.com.br',
          password: '123456',
          name: 'ValeTech Soluções Digitais',
          city: 'Ivaiporã',
          role: 'empresa',
          badge: 'Empresa / Recrutador',
          avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'
        }
      ];
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    }
    return users;
  }

  function getUserRole() {
    return localStorage.getItem(STORAGE_KEY_USER_ROLE) || 'aluno';
  }

  function setUserRole(roleId) {
    if (USER_ROLES[roleId]) {
      localStorage.setItem(STORAGE_KEY_USER_ROLE, roleId);
      updateDOMRoleVisibility(roleId);
      window.dispatchEvent(new CustomEvent('userRoleChanged', { detail: { role: roleId } }));
    }
  }

  function getUserRoles() {
    return Object.values(USER_ROLES);
  }

  function updateDOMRoleVisibility(currentRole = getUserRole()) {
    document.querySelectorAll('[data-show-role]').forEach(el => {
      const allowedRoles = el.getAttribute('data-show-role').split(',').map(r => r.trim());
      if (allowedRoles.includes(currentRole) || allowedRoles.includes('all')) {
        el.style.display = el.getAttribute('data-display-type') || 'block';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // Camada de Autenticação & Sessão
  function getAuthUser() {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Login com Verificação Real de Credenciais
  function login(email, password, fallbackRole = 'aluno') {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      return { success: false, error: 'Por favor, informe seu e-mail de acesso.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Por favor, informe sua senha.' };
    }

    const usersDB = getUsersDB();
    const account = usersDB.find(u => u.email.toLowerCase() === cleanEmail);

    if (!account) {
      return {
        success: false,
        error: 'Nenhuma conta encontrada com este e-mail. Crie uma conta na aba "Criar Nova Conta".'
      };
    }

    if (account.password !== cleanPassword) {
      return {
        success: false,
        error: 'Senha incorreta. Verifique suas credenciais e tente novamente.'
      };
    }

    const userRoleConfig = USER_ROLES[account.role] || USER_ROLES[fallbackRole] || USER_ROLES.aluno;
    const authUser = {
      email: account.email,
      name: account.name,
      city: account.city || 'Ivaiporã',
      role: account.role,
      roleName: userRoleConfig.name,
      badge: account.badge || userRoleConfig.badge,
      avatar: account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      loggedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
    setUserRole(account.role);
    if (account.city) setSelectedCity(account.city);
    renderNavbarAuthStatus();

    return { success: true, user: authUser };
  }

  // Cadastro de Novo Usuário com Verificação de E-mail Único
  function register(userData) {
    const { name, email, city, role, password } = userData;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim() || '123456';
    const cleanName = (name || '').trim();
    const roleId = role || 'aluno';

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Informe seu nome completo ou razão social.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Informe um e-mail válido.' };
    }
    if (cleanPassword.length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    const usersDB = getUsersDB();
    const existing = usersDB.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      return {
        success: false,
        error: 'Este e-mail já está cadastrado na plataforma. Faça login na aba "Entrar na Conta".'
      };
    }

    const userRoleConfig = USER_ROLES[roleId] || USER_ROLES.aluno;
    const defaultAvatars = {
      aluno: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      freelancer: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      candidato: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      empresa: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'
    };

    const newUser = {
      email: cleanEmail,
      password: cleanPassword,
      name: cleanName,
      city: city || 'Ivaiporã',
      role: roleId,
      badge: userRoleConfig.badge,
      avatar: defaultAvatars[roleId] || defaultAvatars.aluno,
      createdAt: new Date().toISOString()
    };

    usersDB.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDB));

    // Logar automaticamente o novo usuário
    const authUser = {
      email: newUser.email,
      name: newUser.name,
      city: newUser.city,
      role: newUser.role,
      roleName: userRoleConfig.name,
      badge: newUser.badge,
      avatar: newUser.avatar,
      loggedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
    if (city) setSelectedCity(city);
    setUserRole(newUser.role);
    renderNavbarAuthStatus();

    return { success: true, user: authUser };
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    renderNavbarAuthStatus();
    showToast('Sessão encerrada com sucesso.');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 300);
  }

  // ==========================================
  // CONTROLE DE SESSÃO E PERFIL (INTEGRADO COM O FRONT)
  // ==========================================

  function renderNavbarAuthStatus() {
    const container = document.getElementById('navbarAuthContainer');
    if (!container) return;

    const user = getAuthUser();
    if (user) {
      const avatarUrl = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
      container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <a href="perfil-aluno.html" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none;" title="Ver Perfil">
            <img src="${avatarUrl}" alt="${user.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-blue); box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.85rem; text-align: left; line-height: 1.2;">
              <div style="font-weight: 700; color: var(--primary-dark);">${user.name}</div>
              <div style="font-size: 0.725rem; color: var(--primary-blue); font-weight: 600; text-transform: capitalize;">${user.role || 'Usuário'}</div>
            </div>
          </a>
          <button class="btn btn-outline btn-sm" id="btnNavLogout" title="Sair da Conta" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">Sair</button>
        </div>
      `;

      document.getElementById('btnNavLogout')?.addEventListener('click', async () => {
        await logoutUser();
        logout();
      });
    } else {
      container.innerHTML = `
        <a href="login.html" class="btn btn-primary btn-sm">Entrar / Cadastrar</a>
      `;
    }
  }

  // Vigia alterações de sessão no Firebase
  watchAuthState(async (user) => {
    if (user) {
      let profileName = user.displayName || user.email || 'Usuário';
      let profileRole = 'Usuário';
      let avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';

      if (user.uid) {
        const response = await getUserProfile(user.uid);
        if (response && response.success && response.profile) {
          profileName = response.profile.name || profileName;
          profileRole = response.profile.role || profileRole;
          avatarUrl = response.profile.avatar || avatarUrl;
        }
      }

      const container = document.getElementById('navbarAuthContainer');
      if (container) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <a href="perfil-aluno.html" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none;" title="Ver Perfil">
              <img src="${avatarUrl}" alt="${profileName}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-blue); box-shadow: var(--shadow-sm);">
              <div style="font-size: 0.85rem; text-align: left; line-height: 1.2;">
                <div style="font-weight: 700; color: var(--primary-dark);">${profileName}</div>
                <div style="font-size: 0.725rem; color: var(--primary-blue); font-weight: 600; text-transform: capitalize;">${profileRole}</div>
              </div>
            </a>
            <button class="btn btn-outline btn-sm" id="btnNavLogout" title="Sair da Conta" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">Sair</button>
          </div>
        `;

        document.getElementById('btnNavLogout')?.addEventListener('click', async () => {
          await logoutUser();
          logout();
        });
      }
    } else {
      renderNavbarAuthStatus();
    }
  });

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
            quote: "Profissional exemplar, com ótimo raciocínio lógico e liderança em projetos práticos.",
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

  // Validação de Endosso / Recomendação
  function validateEndorsement(data) {
    const { profName, profEmail, institution, discipline, quote } = data || {};
    if (!profName || profName.trim().length < 3) return { isValid: false, error: 'Informe o nome do recomendador.' };
    if (!profEmail || !profEmail.includes('@')) return { isValid: false, error: 'Informe um e-mail de contato válido.' };
    if (!discipline || discipline.trim().length < 3) return { isValid: false, error: 'Informe o cargo, disciplina ou área recomendada.' };
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

  function updateTalentProfile(id, updatedData) {
    const talents = getTalents('Todas as Cidades');
    const idx = talents.findIndex(t => t.id == id);
    if (idx !== -1) {
      talents[idx] = { ...talents[idx], ...updatedData };
      localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(talents));

      const authUser = getAuthUser();
      if (authUser) {
        if (updatedData.name) authUser.name = updatedData.name;
        if (updatedData.city) authUser.city = updatedData.city;
        if (updatedData.avatar) authUser.avatar = updatedData.avatar;
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(authUser));
        renderNavbarAuthStatus();
      }

      return talents[idx];
    }
    return null;
  }

  function addEducationToTalent(id, payload) {
    const talents = getTalents('Todas as Cidades');
    const talent = talents.find(t => t.id == id);
    if (talent) {
      if (!talent.education) talent.education = [];
      talent.education.unshift(payload);
      localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(talents));
    }
    return true;
  }

  function addExperienceToTalent(id, payload) {
    const talents = getTalents('Todas as Cidades');
    const talent = talents.find(t => t.id == id);
    if (talent) {
      if (!talent.experiences) talent.experiences = [];
      talent.experiences.unshift(payload);
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
    toast.innerHTML = `<span>${message}</span>`;
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
        option.textContent = city === 'Todas as Cidades' ? 'Vale do Ivaí (Todas)' : `${city}`;
        if (city === currentCity) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener('change', (e) => {
        setSelectedCity(e.target.value);
      });
    });
  }

  function addJob(payload) {
    let local = JSON.parse(localStorage.getItem(STORAGE_KEY_JOBS));
    if (!local || local.length === 0) {
      local = seedData.jobs;
    }
    local.unshift(payload);
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(local));
    return payload;
  }

  function initRoleSelectors() {
    const roleSelects = document.querySelectorAll('.role-select-global');
    const currentRole = getUserRole();
    const roles = getUserRoles();

    roleSelects.forEach(select => {
      select.innerHTML = '';
      roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        if (role.id === currentRole) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener('change', (e) => {
        setUserRole(e.target.value);
      });
    });

    updateDOMRoleVisibility(currentRole);
  }

  // Exportação Global window.IvaiConecta
  window.IvaiConecta = {
    firebaseConfig,
    getCities,
    getSelectedCity,
    setSelectedCity,
    getUserRole,
    setUserRole,
    getUserRoles,
    getAuthUser,
    login,
    register,
    logout,
    renderNavbarAuthStatus,
    getTalents,
    getTalentById,
    addEndorsementToTalent,
    updateTalentProfile,
    addEducationToTalent,
    addExperienceToTalent,
    getJobs,
    addJob,
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
    initCitySelectors,
    initRoleSelectors
  };

  // Init DOM
  document.addEventListener('DOMContentLoaded', () => {
    initCitySelectors();
    initRoleSelectors();
    renderNavbarAuthStatus();
    setupModalListeners();
  });

})();
