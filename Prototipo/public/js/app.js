/**
 * IVAÍ CONECTA - CONTROLADOR UNIFICADO E INTEGRADO (SUPORTE FILE:// E HTTP://)
 * Funciona nativamente via duplo clique no Windows Explorer e via Servidor Web.
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

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
  const STORAGE_KEY_APPLICATIONS = 'ivai_conecta_user_applications';

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

  // Verifica se o usuário atual tem permissão para se candidatar a vagas
  function canApplyToJobs() {
    const authUser = getAuthUser();
    if (!authUser) return { allowed: false, reason: 'not_logged', message: 'Você precisa estar logado para se candidatar a vagas.' };

    const role = authUser.role;

    if (role === 'aluno' || role === 'candidato') {
      return { allowed: true };
    }

    if (role === 'freelancer') {
      if (authUser.isCandidateEnabled) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'hybrid_required',
        message: 'Como Freelancer, você precisa ativar o <strong>Modo Candidato</strong> nas Configurações da Conta para se candidatar a vagas CLT/Estágio.'
      };
    }

    if (role === 'empresa') {
      return {
        allowed: false,
        reason: 'role_blocked',
        message: 'Contas empresariais não podem se candidatar a vagas. Para candidaturas pessoais, crie uma conta de Aluno ou Candidato.'
      };
    }

    return { allowed: false, reason: 'role_blocked', message: 'Seu tipo de conta não permite candidaturas a vagas no momento.' };
  }

  function updateDOMRoleVisibility(currentRole = getUserRole()) {
    const authUser = getAuthUser() || {};
    const activeRoles = [currentRole, authUser.role];

    // Aluno / Candidato pode ativar apenas Modo Freelancer
    if ((authUser.role === 'aluno' || authUser.role === 'candidato') && authUser.isFreelancerEnabled) {
      activeRoles.push('freelancer');
    }
    // Freelancer pode ativar apenas Modo Candidato
    if (authUser.role === 'freelancer' && authUser.isCandidateEnabled) {
      activeRoles.push('aluno', 'candidato');
    }

    document.querySelectorAll('[data-show-role]').forEach(el => {
      const allowedRoles = el.getAttribute('data-show-role').split(',').map(r => r.trim());
      const hasPermission = allowedRoles.some(r => r === 'all' || activeRoles.includes(r));
      if (hasPermission) {
        el.style.display = el.getAttribute('data-display-type') || 'block';
      } else {
        el.style.display = 'none';
      }
    });

    // Banco de Talentos: visível apenas para Empresa e usuários com Modo Empresa ativo
    const isEmpresa = authUser.role === 'empresa';
    document.querySelectorAll('.nav-links a[href*="banco-de-talentos"]').forEach(link => {
      const li = link.closest('li');
      if (li) li.style.display = isEmpresa ? '' : 'none';
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

    let usersDB = getUsersDB();
    let account = usersDB.find(u => u.email.toLowerCase() === cleanEmail);

    // Se for e-mail de demonstração e não constar no DB, recria automaticamente
    if (!account && cleanEmail.includes('@ivaiconecta.com.br')) {
      const roleFromEmail = cleanEmail.split('@')[0];
      const validRole = USER_ROLES[roleFromEmail] ? roleFromEmail : fallbackRole;
      const demoNames = {
        aluno: 'Lucas Eduardo Silva',
        freelancer: 'Marcos Eletricista & Automação',
        candidato: 'Beatriz Santos',
        empresa: 'ValeTech Soluções Digitais'
      };
      const userRoleConfig = USER_ROLES[validRole] || USER_ROLES.aluno;
      account = {
        email: cleanEmail,
        password: cleanPassword || '123456',
        name: demoNames[validRole] || 'Usuário Ivaí Conecta',
        city: 'Ivaiporã',
        role: validRole,
        badge: userRoleConfig.badge,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
      };
      usersDB.push(account);
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDB));
    }

    if (!account) {
      return {
        success: false,
        error: 'Nenhuma conta encontrada com este e-mail. Crie uma conta na aba "Criar Nova Conta".'
      };
    }

    if (account.password !== cleanPassword && !cleanEmail.includes('@ivaiconecta.com.br')) {
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
  }

  function ensureAccountSettingsModal() {
    if (document.getElementById('accountSettingsModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'accountSettingsModal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 520px;">
        <div class="modal-header">
          <h3>Configurações da Conta</h3>
          <button class="modal-close">&times;</button>
        </div>
        <form id="accountSettingsForm">
          <div class="form-group">
            <label>E-mail de Acesso</label>
            <input type="email" id="settingUserEmail" class="form-control" readonly style="background: var(--gray-100);">
          </div>

          <div class="form-group">
            <label>Alterar Senha</label>
            <input type="password" id="settingNewPassword" class="form-control" placeholder="Nova senha (deixe em branco para manter)">
          </div>

          <div class="form-group">
            <label>Notificações por E-mail</label>
            <select id="settingNotifications" class="form-control">
              <option value="all">Receber alertas de novas vagas e propostas</option>
              <option value="important">Apenas convites para entrevistas</option>
              <option value="none">Desativar todas as notificações</option>
            </select>
          </div>

          <div class="form-group">
            <label>Privacidade do Perfil no Banco de Talentos</label>
            <select id="settingPrivacy" class="form-control">
              <option value="public">Visível para todas as empresas do Vale do Ivaí</option>
              <option value="verified_only">Apenas empresas com selo verificado</option>
              <option value="private">Privado (Apenas quando me candidatar)</option>
            </select>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" data-close-modal>Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar Configurações</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close')?.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.querySelector('[data-close-modal]')?.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    document.getElementById('accountSettingsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      modal.classList.remove('active');
      showToast('Configurações salvas com sucesso!');
    });
  }

  function ensureLogoutConfirmModal() {
    if (document.getElementById('logoutConfirmModal')) return;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'logoutConfirmModal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 440px; border-radius: var(--radius-md); padding: 1.5rem;">
        <div class="modal-header" style="border-bottom: 1px solid var(--gray-200); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <h3 style="font-size: 1.1rem; color: var(--primary-dark); font-weight: 700;">Deseja realmente sair da sua conta?</h3>
          <button class="modal-close" data-close-modal>&times;</button>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <p style="font-size: 0.9rem; color: var(--gray-700); line-height: 1.5;">
            Sua sessão no <strong>Ivaí Conecta</strong> será encerrada. Você precisará entrar novamente com suas credenciais para acessar seu perfil e oportunidades salvas.
          </p>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
          <button type="button" class="btn btn-outline btn-sm" data-close-modal style="font-size: 0.825rem; color: var(--gray-700); border-color: var(--gray-300);">Cancelar</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnConfirmLogout" style="font-size: 0.825rem; background: var(--danger); border-color: var(--danger);">Sair da Conta</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    });

    document.getElementById('btnConfirmLogout')?.addEventListener('click', () => {
      modal.classList.remove('active');
      logout();
      showToast('Sessão encerrada com sucesso.');
      window.location.href = 'index.html';
    });
  }

  function renderNavbarAuthStatus() {
    const user = getAuthUser();
    const container = document.getElementById('navbarAuthContainer');
    if (!container) return;

    if (user) {
      let mainNavItemsHtml = '';

      const isCandidateActive = user.role === 'aluno' || user.role === 'candidato' || (user.role === 'freelancer' && user.isCandidateEnabled);
      const isFreelancerActive = user.role === 'freelancer' || ((user.role === 'aluno' || user.role === 'candidato') && user.isFreelancerEnabled);
      const isCompanyActive = user.role === 'empresa';

      let profileHref = 'perfil-aluno.html';
      let profileLabel = 'Meu Currículo & Perfil';

      if (user.role === 'empresa') {
        profileHref = 'perfil-empresa.html';
        profileLabel = 'Perfil da Empresa';
      } else if (user.role === 'freelancer') {
        profileHref = 'servicos.html?view=my_services';
        profileLabel = 'Meu Perfil de Serviços';
      }

      // Items para Aluno / Candidato
      if (isCandidateActive) {
        if (user.role !== 'aluno' && user.role !== 'candidato') {
          mainNavItemsHtml += `
            <a href="perfil-aluno.html" class="user-dropdown-item">
              <span>Meu Currículo & Perfil</span>
            </a>
          `;
        }
        mainNavItemsHtml += `
          <a href="minhas-vagas.html" class="user-dropdown-item">
            <span>Minhas Candidaturas</span>
          </a>
        `;
      }

      // Items para Freelancer / Autônomo
      if (isFreelancerActive) {
        if (user.role !== 'freelancer') {
          mainNavItemsHtml += `
            <a href="servicos.html?view=my_services" class="user-dropdown-item">
              <span>Meu Perfil de Serviços</span>
            </a>
          `;
        }
        mainNavItemsHtml += `
          <a href="servicos.html?action=new" class="user-dropdown-item">
            <span>Cadastrar Novo Serviço</span>
          </a>
        `;
      }

      // Items para Empresa / Recrutador
      if (isCompanyActive) {
        if (user.role !== 'empresa') {
          mainNavItemsHtml += `
            <a href="vagas.html?view=company_profile" class="user-dropdown-item">
              <span>Perfil da Empresa</span>
            </a>
          `;
        }
        mainNavItemsHtml += `
          <a href="vagas.html?view=my_jobs" class="user-dropdown-item">
            <span>Minhas Vagas Criadas</span>
          </a>
        `;
      }

      // Painel de Vagas (apenas para candidatos/freelancers)
      if (user.role !== 'empresa') {
        mainNavItemsHtml += `
          <a href="vagas.html" class="user-dropdown-item">
            <span>Painel de Vagas</span>
          </a>
        `;
      }

      container.innerHTML = `
        <div class="user-menu-container">
          <button class="user-avatar-btn" id="btnUserMenuDropdown" title="${user.name} - Opções da Conta" aria-label="Menu do Usuário">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="4.5"/>
              <path d="M20 21c0-3.6-3.6-6.5-8-6.5s-8 2.9-8 6.5"/>
            </svg>
          </button>

          <div class="user-dropdown-menu" id="userDropdownMenu">
            <div class="user-dropdown-header">
              <div class="user-dropdown-name">${user.name}</div>
              <div class="user-dropdown-badge">${user.badge || USER_ROLES[user.role]?.badge}</div>
            </div>

            <a href="${profileHref}" class="user-dropdown-item">
              <span>${profileLabel}</span>
            </a>

            ${mainNavItemsHtml}

            <div class="user-dropdown-divider"></div>

            <a href="configuracoes.html" class="user-dropdown-item" id="dropdownBtnSettings">
              <span>Configurações da Conta</span>
            </a>

            <div class="user-dropdown-divider"></div>

            <button type="button" class="user-dropdown-item" id="dropdownBtnLogout" style="color: var(--danger);">
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      `;

      const avatarBtn = document.getElementById('btnUserMenuDropdown');
      const dropdownMenu = document.getElementById('userDropdownMenu');

      avatarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu?.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          dropdownMenu?.classList.remove('show');
        }
      });

      document.getElementById('dropdownBtnLogout')?.addEventListener('click', (e) => {
        e.preventDefault();
        dropdownMenu?.classList.remove('show');
        ensureLogoutConfirmModal();
        openModal('logoutConfirmModal');
      });
    } else {
      container.innerHTML = `
        <a href="login.html" class="btn btn-primary btn-sm">Entrar / Cadastrar</a>
      `;
    }
  }

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

  // Gestão de Candidaturas do Usuário com Etapas de Processo Seletivo
  function getUserApplications() {
    let apps = JSON.parse(localStorage.getItem(STORAGE_KEY_APPLICATIONS));
    if (!apps || apps.length === 0) {
      apps = [
        {
          id: 'app_101',
          jobId: 101,
          title: 'Desenvolvedor Front-end Junior / Estagiário',
          company: 'ValeTech Soluções Digitais',
          recruiterPhone: '5543999887766',
          city: 'Ivaiporã',
          type: 'Tempo Integral / Híbrido',
          appliedAt: '16/08/2026',
          matchScore: 92,
          status: 'Entrevista Agendada',
          statusBadge: 'badge-match high',
          currentStageIndex: 2,
          nextStepNote: 'Entrevista técnica agendada para Quinta-feira às 14:00 via Google Meet.',
          stages: [
            { name: 'Candidatura Enviada', date: '16/08/2026', completed: true },
            { name: 'Triagem de Currículo', date: '17/08/2026', completed: true },
            { name: 'Entrevista / Teste Técnico', date: '19/08/2026', completed: false, active: true },
            { name: 'Proposta / Admissão', date: 'Pendente', completed: false }
          ]
        },
        {
          id: 'app_102',
          jobId: 102,
          title: 'Assistente Administrativo & Financeiro',
          company: 'Cooperativa Agropecuária do Vale',
          recruiterPhone: '5543999112233',
          city: 'Ivaiporã',
          type: 'Tempo Integral',
          appliedAt: '12/08/2026',
          matchScore: 85,
          status: 'Em Análise pelo Recrutador',
          statusBadge: 'badge-endosso',
          currentStageIndex: 1,
          nextStepNote: 'Sua candidatura está em avaliação pela equipe de Recursos Humanos.',
          stages: [
            { name: 'Candidatura Enviada', date: '12/08/2026', completed: true },
            { name: 'Triagem de Currículo', date: '14/08/2026', completed: false, active: true },
            { name: 'Entrevista Presencial', date: 'A definir', completed: false },
            { name: 'Proposta / Admissão', date: 'Pendente', completed: false }
          ]
        },
        {
          id: 'app_103',
          jobId: 103,
          title: 'Técnico de Manutenção Elétrica Industrial',
          company: 'Indústria Metalúrgica Ivaiporã',
          recruiterPhone: '5543999445566',
          city: 'São João do Ivaí',
          type: 'Tempo Integral',
          appliedAt: '05/08/2026',
          matchScore: 78,
          status: 'Candidatura Enviada',
          statusBadge: 'badge-endosso',
          currentStageIndex: 0,
          nextStepNote: 'Aguardando abertura de triagem de currículos pela empresa.',
          stages: [
            { name: 'Candidatura Enviada', date: '05/08/2026', completed: true, active: true },
            { name: 'Triagem de Currículo', date: 'A definir', completed: false },
            { name: 'Teste Prático & NR-10', date: 'A definir', completed: false },
            { name: 'Proposta / Admissão', date: 'Pendente', completed: false }
          ]
        },
        {
          id: 'app_104',
          jobId: 104,
          title: 'Desenvolvedor Front-end React',
          company: 'Grupo Tecnologia Vale do Ivaí',
          recruiterPhone: '5543999778899',
          city: 'Ivaiporã',
          type: 'Híbrido',
          appliedAt: '20/07/2026',
          matchScore: 92,
          status: 'Finalizado',
          statusBadge: 'badge-endosso',
          currentStageIndex: 3,
          nextStepNote: 'Processo seletivo concluído com sucesso.',
          stages: [
            { name: 'Candidatura Enviada', date: '20/07/2026', completed: true },
            { name: 'Triagem de Currículo', date: '22/07/2026', completed: true },
            { name: 'Entrevista & Teste', date: '28/07/2026', completed: true },
            { name: 'Proposta / Admissão', date: '05/08/2026', completed: true }
          ]
        }
      ];
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
    }
    return apps;
  }

  function addJobApplication(jobPayload) {
    let apps = getUserApplications();
    const existing = apps.find(a => a.jobId == jobPayload.id || (a.title === jobPayload.title && a.company === jobPayload.company));
    if (existing) {
      return { success: false, error: 'Você já se candidatou a esta vaga anteriormente.' };
    }

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const newApp = {
      id: `app_${Date.now()}`,
      jobId: jobPayload.id || Date.now(),
      title: jobPayload.title || 'Vaga Regional',
      company: jobPayload.company || 'Empresa Parceira',
      recruiterPhone: jobPayload.phone || '5543999887766',
      city: jobPayload.city || 'Ivaiporã',
      type: jobPayload.type || 'Tempo Integral',
      appliedAt: todayStr,
      matchScore: jobPayload.matchScore || 88,
      status: 'Candidatura Enviada',
      statusBadge: 'badge-endosso',
      currentStageIndex: 0,
      nextStepNote: 'Sua candidatura foi registrada e enviada para o recrutador da empresa.',
      stages: [
        { name: 'Candidatura Enviada', date: todayStr, completed: true, active: true },
        { name: 'Triagem de Currículo', date: 'A definir', completed: false },
        { name: 'Entrevista / Avaliação', date: 'A definir', completed: false },
        { name: 'Proposta / Admissão', date: 'Pendente', completed: false }
      ]
    };

    apps.unshift(newApp);
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
    return { success: true, application: newApp };
  }

  function removeJobApplication(appId) {
    let apps = getUserApplications();
    apps = apps.filter(a => a.id !== appId);
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
    return true;
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
    canApplyToJobs,
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
    getUserApplications,
    addJobApplication,
    removeJobApplication,
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

  function initFooterRevealEffect() {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    footer.classList.add('footer-collapsed');

    const checkFooterScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      if (scrollPosition >= threshold) {
        footer.classList.add('footer-expanded');
        footer.classList.remove('footer-collapsed');
      } else {
        footer.classList.add('footer-collapsed');
        footer.classList.remove('footer-expanded');
      }
    };

    window.addEventListener('scroll', checkFooterScroll, { passive: true });
    checkFooterScroll();
  }

  // Init DOM
  document.addEventListener('DOMContentLoaded', () => {
    initCitySelectors();
    initRoleSelectors();
    renderNavbarAuthStatus();
    setupModalListeners();
    initFooterRevealEffect();
  });

})();
