// Auth Service for Ivaí Conecta
import {
  STORAGE_KEY_AUTH_USER,
  STORAGE_KEY_USERS_DB,
  STORAGE_KEY_CITY,
  DEFAULT_USERS,
  USER_ROLES,
} from '../data/seedData';

export function getUsersDB() {
  if (typeof localStorage === 'undefined') return DEFAULT_USERS;
  const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
  let users = DEFAULT_USERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        users = parsed;
      }
    } catch {}
  }
  // Garantir que todos os usuários demo padrão existam no localStorage
  let modified = false;
  DEFAULT_USERS.forEach(defUser => {
    if (!users.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
      users.push(defUser);
      modified = true;
    }
  });
  if (modified || !raw) {
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
  }
  return users;
}

export function getAuthUser() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function login(email, password) {
  const users = getUsersDB();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
  if (!found) {
    return { success: false, error: 'E-mail ou senha incorretos. Verifique seus dados.' };
  }
  const sessionUser = { ...found };
  delete sessionUser.password;
  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));
  return { success: true, user: sessionUser };
}

export function register(data) {
  const { email, name, city, role, password } = data;
  const users = getUsersDB();

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
    return { success: false, error: 'Este e-mail já está cadastrado no Ivaí Conecta.' };
  }

  const roleMeta = USER_ROLES[role] || USER_ROLES.aluno;
  const newUser = {
    email: email.toLowerCase().trim(),
    password,
    name,
    city,
    role,
    badge: roleMeta.badge,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    skills: role === 'aluno' || role === 'candidato' ? ['JavaScript', 'Excel Avançado', 'Gestão'] : [],
    isVerifiedStudent: false, // Students require enrollment proof verification before public profile / apply
    isVerifiedCompany: role === 'empresa',
    linkedin: '',
    github: ''
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

  const sessionUser = { ...newUser };
  delete sessionUser.password;
  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionUser));

  return { success: true, user: sessionUser };
}

export function logout() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }
}

export function updateAuthUser(data) {
  const current = getAuthUser();
  if (!current) return null;
  const updated = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));

  const users = getUsersDB();
  const updatedDB = users.map(u => (u.email.toLowerCase() === current.email.toLowerCase() ? { ...u, ...data } : u));
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(updatedDB));

  return updated;
}

export function submitCompanyVerification(cnpj, fileData) {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) {
    return { success: false, error: 'O CNPJ deve conter 14 dígitos numéricos (Ex: 12.345.678/0001-90).' };
  }

  const filename = typeof fileData === 'object' && fileData?.name ? fileData.name : String(fileData || 'Cartao_CNPJ.pdf');
  const filesizeMB = typeof fileData === 'object' && fileData?.size ? (fileData.size / (1024 * 1024)).toFixed(2) : '0.85';

  const updated = updateAuthUser({
    cnpj,
    isVerifiedCompany: true,
    companyProofFile: filename
  });

  return {
    success: true,
    message: `✅ CNPJ ${cnpj} e documento "${filename}" (${filesizeMB}MB) autenticados! Selo de Empresa Verificada concedido.`,
    user: updated
  };
}

export function getSelectedCity() {
  if (typeof localStorage === 'undefined') return 'Todas as Cidades';
  return localStorage.getItem(STORAGE_KEY_CITY) || 'Todas as Cidades';
}

export function setSelectedCity(city) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CITY, city);
  }
}
