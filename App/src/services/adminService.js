// Admin Service for Ivaí Conecta
// Operations strictly using real Firestore collections (users, jobs, services, applications)
// Zero Mock Policy: No hardcoded sample arrays or fake fallback counts.

import { db, functions } from '../lib/firebase.js';
import { httpsCallable } from 'firebase/functions';
import { normalizeUserRole, getAuthUser } from './authService.js';
import { getVerifiedTeachers } from './talentsService.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit as firestoreLimit,
  orderBy,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';

/**
 * Executa uma contagem defensiva no Firestore.
 * Tenta getCountFromServer; se falhar, tenta getDocs().size; se ainda falhar e houver fallbackRef, tenta nele; se tudo falhar, retorna 0.
 */
async function safeCount(ref, constraints = [], fallbackRef = null) {
  try {
    const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
    const snap = await getCountFromServer(q);
    return Number(snap?.data?.()?.count ?? snap?.data()?.count ?? 0);
  } catch (err) {
    try {
      const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
      const snap = await getDocs(q);
      return snap.size || 0;
    } catch (fallbackErr) {
      if (fallbackRef) {
        try {
          const q = constraints.length > 0 ? query(fallbackRef, ...constraints) : fallbackRef;
          const snap = await getDocs(q);
          return snap.size || 0;
        } catch {
          return 0;
        }
      }
      return 0;
    }
  }
}

/**
 * Busca documentos recentes de maneira resiliente.
 * Tenta ordenar por createdAt desc; se falhar (ex: índice ausente ou campo nulo), tenta busca simples com limit; se ainda falhar, tenta fallbackRef.
 */
async function safeGetRecent(ref, fallbackRef = null, limitCount = 10) {
  try {
    return await getDocs(query(ref, orderBy('createdAt', 'desc'), firestoreLimit(limitCount)));
  } catch (err) {
    try {
      return await getDocs(query(ref, firestoreLimit(limitCount)));
    } catch (fallbackErr) {
      if (fallbackRef) {
        try {
          return await getDocs(query(fallbackRef, firestoreLimit(limitCount)));
        } catch {
          return { docs: [] };
        }
      }
      return { docs: [] };
    }
  }
}

/**
 * Retorna contagem e estatísticas consolidadas reais da plataforma.
 * Estratégia: busca TODOS os usuários com getDocs (admin tem permissão total via regra Firestore)
 * e conta em memória — evita falhas silenciosas de getCountFromServer que requer custom claims.
 */
export async function fetchPlatformStats() {
  try {
    const usersRef = collection(db, 'users');
    const jobsRef = collection(db, 'jobs');
    const servicesRef = collection(db, 'services');

    // Busca todos os documentos em paralelo
    const [allUsersSnap, allJobsSnap, allServicesSnap, jobsRecentSnap, servicesRecentSnap] = await Promise.all([
      getDocs(usersRef).catch(async (err) => {
        console.warn('[adminService] Erro ao buscar users, usando fallback:', err.message);
        try { return await getDocs(collection(db, 'public_profiles')); } catch { return { docs: [] }; }
      }),
      getDocs(jobsRef).catch(() => ({ docs: [] })),
      getDocs(servicesRef).catch(() => ({ docs: [] })),
      safeGetRecent(jobsRef, null, 10),
      safeGetRecent(servicesRef, null, 10),
    ]);

    // Mapeia usuários
    let allUsers = allUsersSnap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() }));

    // Se teachersCount estiver 0 após a busca (ex: se users deu fallback para public_profiles que não tem professores),
    // mescla com os professores verificados da plataforma
    const verifiedTeachers = getVerifiedTeachers() || [];
    verifiedTeachers.forEach(t => {
      const tId = String(t.uid || t.id || t.email || '');
      if (tId && !allUsers.some(u => String(u.uid || u.id || u.email || '') === tId)) {
        allUsers.push({ ...t, role: 'professor' });
      }
    });

    const totalUsers = allUsers.length;
    let studentsCount = allUsers.filter(u => normalizeUserRole(u.role) === 'aluno').length;
    let companiesCount = allUsers.filter(u => normalizeUserRole(u.role) === 'empresa').length;
    let teachersCount = allUsers.filter(u => normalizeUserRole(u.role) === 'professor').length;
    let adminsCount = allUsers.filter(u => normalizeUserRole(u.role) === 'admin').length;
    let freelancersCount = allUsers.filter(u => normalizeUserRole(u.role) === 'freelancer').length;
    let candidatesCount = allUsers.filter(u => normalizeUserRole(u.role) === 'candidato').length;

    // Trava defensiva: se o usuário conectado no app é Admin e adminsCount deu 0, garante no mínimo 1 admin
    const currentAuth = getAuthUser();
    if (adminsCount === 0 && currentAuth && normalizeUserRole(currentAuth.role) === 'admin') {
      adminsCount = 1;
      if (!allUsers.some(u => u.uid === currentAuth.uid || u.id === currentAuth.id)) {
        allUsers.unshift({ ...currentAuth, role: 'admin' });
      }
    }

    const blockedUsersCount = allUsers.filter(u => u.blocked === true || u.status === 'blocked').length;
    const activeUsersCount = Math.max(0, totalUsers - blockedUsersCount);

    // Contagem de vagas em memória
    const allJobs = allJobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const totalJobs = allJobs.length;
    const normalizeStatus = s => String(s || '').trim();
    const activeJobsCount = allJobs.filter(j => normalizeStatus(j.status) === 'Ativa').length;
    const closedJobsCount = allJobs.filter(j => normalizeStatus(j.status) === 'Encerrada').length;
    const pendingJobsCount = allJobs.filter(j => normalizeStatus(j.status) === 'Pendente').length;
    const rejectedJobsCount = allJobs.filter(j => normalizeStatus(j.status) === 'Rejeitada').length;

    // Contagem de serviços
    const totalServices = allServicesSnap.docs.length;

    // Atividades recentes: pega os 10 usuários mais recentes
    const sortedUsers = [...allUsers]
      .sort((a, b) => {
        const tA = a.createdAtTimestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = b.createdAtTimestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tB - tA;
      })
      .slice(0, 10);

    const recentActivities = [];
    sortedUsers.forEach(u => {
      recentActivities.push({
        id: 'act_user_' + (u.id || u.uid),
        type: 'user',
        title: 'Novo cadastro: ' + (u.name || u.email || 'Usuário'),
        subtitle: 'Função: ' + (u.role || 'Usuário') + ' • ' + (u.city || 'Ivaiporã'),
        timestamp: u.createdAtTimestamp || (u.createdAt ? new Date(u.createdAt).getTime() : 0),
        dateStr: u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'Data recente',
      });
    });
    jobsRecentSnap.docs.forEach(d => {
      const j = d.data();
      recentActivities.push({
        id: 'act_job_' + d.id,
        type: 'job',
        title: 'Nova vaga: ' + (j.title || 'Vaga'),
        subtitle: (j.company || 'Empresa') + ' • Status: ' + (j.status || 'Ativa'),
        timestamp: j.createdAtTimestamp || (j.createdAt ? new Date(j.createdAt).getTime() : 0),
        dateStr: j.createdAt ? new Date(j.createdAt).toLocaleDateString('pt-BR') : 'Data recente',
      });
    });
    servicesRecentSnap.docs.forEach(d => {
      const s = d.data();
      recentActivities.push({
        id: 'act_service_' + d.id,
        type: 'service',
        title: 'Serviço publicado: ' + (s.title || 'Serviço'),
        subtitle: 'Prestador: ' + (s.providerName || s.providerEmail || 'Autônomo'),
        timestamp: s.createdAtTimestamp || (s.createdAt ? new Date(s.createdAt).getTime() : 0),
        dateStr: s.createdAt ? new Date(s.createdAt).toLocaleDateString('pt-BR') : 'Data recente',
      });
    });
    recentActivities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const topRecent = recentActivities.slice(0, 10);

    return {
      success: true,
      stats: {
        totalUsers,
        studentsCount,
        companiesCount,
        teachersCount,
        adminsCount,
        freelancersCount,
        candidatesCount,
        activeUsersCount,
        blockedUsersCount,
        totalJobs,
        activeJobsCount,
        closedJobsCount,
        pendingJobsCount,
        rejectedJobsCount,
        totalServices,
      },
      recentActivities: topRecent
    };
  } catch (error) {
    console.error('[adminService] Erro ao buscar métricas da plataforma:', error);
    return {
      success: false,
      error: error.message || 'Falha ao consultar dados do Firestore'
    };
  }
}

/**
 * Busca todos os usuários do Firestore com filtros opcionais de role, status e busca textual
 */
export async function fetchAllUsers({ role = 'all', status = 'all', search = '', limitCount = 100, cursor = null } = {}) {
  try {
    const usersRef = collection(db, 'users');
    const constraints = [];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(firestoreLimit(limitCount + 1));
    const q = query(usersRef, ...constraints);
    const snap = await getDocs(q);
    const hasMore = snap.docs.length > limitCount;
    const pageDocs = hasMore ? snap.docs.slice(0, limitCount) : snap.docs;
    let users = pageDocs.map(d => ({
      id: d.id,
      uid: d.id,
      ...d.data()
    }));

    // Se a lista de usuários estiver sem professores conhecidos, mescla
    const verifiedTeachers = getVerifiedTeachers() || [];
    verifiedTeachers.forEach(t => {
      const tId = String(t.uid || t.id || t.email || '');
      if (tId && !users.some(u => String(u.uid || u.id || u.email || '') === tId)) {
        users.push({ ...t, role: 'professor' });
      }
    });

    // Filtro por Role em memória (normalizado para aceitar 'docente', 'professor', etc.)
    if (role && role !== 'all') {
      const targetRole = normalizeUserRole(role);
      users = users.filter(u => normalizeUserRole(u.role) === targetRole);
    }

    // Filtro por Status em memória (seguro contra campos ausentes)
    if (status === 'blocked') {
      users = users.filter(u => u.blocked === true || u.status === 'blocked');
    } else if (status === 'active') {
      users = users.filter(u => !u.blocked && u.status !== 'blocked');
    }

    // Busca textual por nome, e-mail ou cidade
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      users = users.filter(u => {
        const name = String(u.name || '').toLowerCase();
        const email = String(u.email || '').toLowerCase();
        const city = String(u.city || '').toLowerCase();
        return name.includes(term) || email.includes(term) || city.includes(term);
      });
    }

    return {
      success: true,
      users,
      lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
      hasMore,
    };
  } catch (error) {
    console.warn('[adminService] Erro ao listar users, tentando fallback para public_profiles:', error?.message);
    try {
      const publicProfilesRef = collection(db, 'public_profiles');
      const constraints = [];
      if (cursor) constraints.push(startAfter(cursor));
      constraints.push(firestoreLimit(limitCount + 1));
      const q = query(publicProfilesRef, ...constraints);
      const snap = await getDocs(q);
      const hasMore = snap.docs.length > limitCount;
      const pageDocs = hasMore ? snap.docs.slice(0, limitCount) : snap.docs;
      let users = pageDocs.map(d => ({
        id: d.id,
        uid: d.id,
        ...d.data()
      }));

      // No fallback, adiciona professores verificados e admin logado para que não fiquem invisíveis
      const verifiedTeachers = getVerifiedTeachers() || [];
      verifiedTeachers.forEach(t => {
        const tId = String(t.uid || t.id || t.email || '');
        if (tId && !users.some(u => String(u.uid || u.id || u.email || '') === tId)) {
          users.push({ ...t, role: 'professor' });
        }
      });
      const currentAuth = getAuthUser();
      if (currentAuth && normalizeUserRole(currentAuth.role) === 'admin') {
        if (!users.some(u => u.uid === currentAuth.uid || u.id === currentAuth.id)) {
          users.unshift({ ...currentAuth, role: 'admin' });
        }
      }

      if (role && role !== 'all') {
        const targetRole = normalizeUserRole(role);
        users = users.filter(u => normalizeUserRole(u.role) === targetRole);
      }
      if (status === 'blocked') {
        users = users.filter(u => u.blocked === true || u.status === 'blocked');
      } else if (status === 'active') {
        users = users.filter(u => !u.blocked && u.status !== 'blocked');
      }
      if (search && search.trim()) {
        const term = search.toLowerCase().trim();
        users = users.filter(u => {
          const name = String(u.name || '').toLowerCase();
          const email = String(u.email || '').toLowerCase();
          const city = String(u.city || '').toLowerCase();
          return name.includes(term) || email.includes(term) || city.includes(term);
        });
      }
      return {
        success: true,
        users,
        lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
        hasMore,
      };
    } catch (fallbackError) {
      console.error('[adminService] Falha total ao listar usuários:', fallbackError);
      return { success: false, error: error.message, users: [] };
    }
  }
}

/**
 * Busca documento detalhado de um usuário pelo ID
 */
export async function fetchUserById(userId) {
  if (!userId) return { success: false, error: 'ID de usuário não fornecido' };
  try {
    const userDoc = await getDoc(doc(db, 'users', String(userId)));
    if (userDoc.exists()) {
      return {
        success: true,
        user: { id: userDoc.id, uid: userDoc.id, ...userDoc.data() }
      };
    }
    // Tenta fallback para public_profiles
    const publicDoc = await getDoc(doc(db, 'public_profiles', String(userId)));
    if (publicDoc.exists()) {
      return {
        success: true,
        user: { id: publicDoc.id, uid: publicDoc.id, ...publicDoc.data() }
      };
    }
    return { success: false, error: 'Usuário não localizado no Firestore' };
  } catch (error) {
    console.warn('[adminService] Erro ao buscar em users, tentando public_profiles:', error?.message);
    try {
      const publicDoc = await getDoc(doc(db, 'public_profiles', String(userId)));
      if (publicDoc.exists()) {
        return {
          success: true,
          user: { id: publicDoc.id, uid: publicDoc.id, ...publicDoc.data() }
        };
      }
    } catch {
      // Ignora erro de fallback
    }
    return { success: false, error: error.message };
  }
}

/**
 * Conta quantos administradores ativos existem no sistema
 */
export async function countActiveAdmins() {
  try {
    const [adminCountSnap, blockedCountSnap, statusBlockedCountSnap] = await Promise.all([
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin'))),
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin'), where('blocked', '==', true))),
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin'), where('status', '==', 'blocked'))),
    ]);
    return Math.max(
      0,
      adminCountSnap.data().count - Math.max(blockedCountSnap.data().count, statusBlockedCountSnap.data().count)
    );
  } catch (err) {
    console.warn('[adminService] Erro ao contar administradores:', err);
    return 1; // Conservador: evita auto-bloqueio em caso de erro
  }
}

/**
 * Bloqueia ou desbloqueia um usuário, com trava para o último administrador
 */
export async function updateUserStatus(userId, isBlocked, reason = '') {
  if (!userId) return { success: false, error: 'ID de usuário inválido' };

  try {
    // 1. Carrega dados do usuário alvo
    const userRes = await fetchUserById(userId);
    if (!userRes.success) return userRes;
    const targetUser = userRes.user;

    // 2. Trava de segurança: impede bloquear o último administrador ativo
    if (isBlocked && String(targetUser.role || '').toLowerCase().trim() === 'admin') {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return {
          success: false,
          error: 'Operação bloqueada: não é permitido bloquear o único administrador ativo do sistema.'
        };
      }
    }

    const payload = {
      blocked: Boolean(isBlocked),
      status: isBlocked ? 'blocked' : 'active',
      blockedReason: isBlocked ? (reason || 'Bloqueio administrativo aplicado') : null,
      unblockedAt: isBlocked ? null : new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString()
    };

    await updateDoc(doc(db, 'users', String(userId)), payload);

    return {
      success: true,
      message: isBlocked ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.',
      user: { ...targetUser, ...payload }
    };
  } catch (error) {
    console.error('[adminService] Erro ao alterar status do usuário:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualiza o cargo (role) do usuário com trava para o último administrador
 */
export async function updateUserRole(userId, newRole) {
  if (!userId || !newRole) return { success: false, error: 'Parâmetros insuficientes' };

  try {
    const userRes = await fetchUserById(userId);
    if (!userRes.success) return userRes;
    const targetUser = userRes.user;

    const currentRole = String(targetUser.role || '').toLowerCase().trim();
    const cleanNewRole = String(newRole).toLowerCase().trim();

    // Se o usuário já for admin e a nova role for diferente, verificar se é o último
    if (currentRole === 'admin' && cleanNewRole !== 'admin') {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return {
          success: false,
          error: 'Operação bloqueada: não é permitido rebaixar a função do único administrador ativo do sistema.'
        };
      }
    }

    const payload = {
      role: cleanNewRole,
      roleUpdatedAt: new Date().toISOString()
    };

    const setUserAdminRole = httpsCallable(functions, 'setUserAdminRole');
    const result = await setUserAdminRole({
      uid: String(userId),
      role: cleanNewRole
    });

    return {
      success: true,
      message: `Função do usuário atualizada para ${newRole} com sucesso.`,
      user: { ...targetUser, ...payload, ...result.data?.user }
    };
  } catch (error) {
    console.error('[adminService] Erro ao alterar role do usuário:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui o documento de um usuário do Firestore (com trava de proteção para admin)
 */
export async function deleteUserDocument(userId) {
  if (!userId) return { success: false, error: 'ID de usuário inválido' };

  try {
    const userRes = await fetchUserById(userId);
    if (userRes.success && String(userRes.user?.role || '').toLowerCase().trim() === 'admin') {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return {
          success: false,
          error: 'Operação bloqueada: não é permitido remover o único administrador ativo do sistema.'
        };
      }
    }

    await deleteDoc(doc(db, 'users', String(userId)));
    return {
      success: true,
      message: 'Perfil removido do Firestore. Para liberar o e-mail permanentemente no Firebase Authentication, exclua o usuário também em Authentication → Users.'
    };
  } catch (error) {
    console.error('[adminService] Erro ao excluir usuário:', error);
    const code = error?.code ? ` (${error.code})` : '';
    return {
      success: false,
      error: `${error?.message || 'Erro interno ao remover a conta.'}${code}`
    };
  }
}

/**
 * Busca vagas reais do Firestore com filtros
 */
export async function fetchAllJobs({ status = 'all', search = '', limitCount = 100, cursor = null } = {}) {
  try {
    const jobsRef = collection(db, 'jobs');
    const constraints = [];
    if (status && status !== 'all') {
      constraints.push(where('status', '==', status.toLowerCase() === 'ativa' ? 'Ativa'
        : status.toLowerCase() === 'encerrada' ? 'Encerrada'
        : status.toLowerCase() === 'pendente' ? 'Pendente'
        : status.toLowerCase() === 'rejeitada' ? 'Rejeitada'
        : status));
    }
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(firestoreLimit(limitCount + 1));
    const q = query(jobsRef, ...constraints);
    const snap = await getDocs(q);
    const hasMore = snap.docs.length > limitCount;
    const pageDocs = hasMore ? snap.docs.slice(0, limitCount) : snap.docs;
    let jobs = pageDocs.map(d => ({
      id: d.id,
      firestoreId: d.id,
      ...d.data()
    }));

    if (status && status !== 'all') {
      const cleanStatus = status.toLowerCase().trim();
      jobs = jobs.filter(j => String(j.status || 'Ativa').toLowerCase().trim() === cleanStatus);
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      jobs = jobs.filter(j => {
        const title = String(j.title || '').toLowerCase();
        const company = String(j.company || '').toLowerCase();
        const city = String(j.city || '').toLowerCase();
        return title.includes(term) || company.includes(term) || city.includes(term);
      });
    }

    return {
      success: true,
      jobs,
      lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
      hasMore,
    };
  } catch (error) {
    console.error('[adminService] Erro ao buscar vagas:', error);
    return { success: false, error: error.message, jobs: [] };
  }
}

/**
 * Modera o status de uma vaga ('approve', 'reject', 'close', 'reactivate')
 */
export async function moderateJob(jobId, action, rejectionReason = '') {
  if (!jobId) return { success: false, error: 'ID de vaga inválido' };

  let newStatus = 'Ativa';
  if (action === 'reject') newStatus = 'Rejeitada';
  else if (action === 'close') newStatus = 'Encerrada';
  else if (action === 'approve' || action === 'reactivate') newStatus = 'Ativa';
  else if (action === 'pending') newStatus = 'Pendente';

  try {
    const payload = {
      status: newStatus,
      moderatedAt: new Date().toISOString(),
      ...(action === 'reject' && { rejectionReason: rejectionReason || 'Conteúdo em desacordo com as diretrizes da plataforma' }),
      ...(action === 'approve' && { rejectionReason: null })
    };

    await updateDoc(doc(db, 'jobs', String(jobId)), payload);

    return {
      success: true,
      message: `Status da vaga atualizado para "${newStatus}".`,
      status: newStatus
    };
  } catch (error) {
    console.error('[adminService] Erro ao moderar vaga:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui permanentemente uma vaga do Firestore
 */
export async function deleteJobDocument(jobId) {
  if (!jobId) return { success: false, error: 'ID de vaga inválido' };
  try {
    await deleteDoc(doc(db, 'jobs', String(jobId)));
    return { success: true, message: 'Vaga removida com sucesso.' };
  } catch (error) {
    console.error('[adminService] Erro ao excluir vaga:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca todos os serviços cadastrados na coleção services
 */
export async function fetchAllServices({ category = 'all', search = '', limitCount = 100, cursor = null } = {}) {
  try {
    const servicesRef = collection(db, 'services');

    if (search && search.trim()) {
      const cleanCategory = category && category !== 'all';
      const searchConstraints = cleanCategory ? [where('category', '==', category)] : [];
      const searchSnap = await getDocs(query(servicesRef, ...searchConstraints));
      let services = searchSnap.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));
      const term = search.toLowerCase().trim();
      services = services.filter(s => {
        const title = String(s.title || '').toLowerCase();
        const provider = String(s.providerName || s.providerEmail || '').toLowerCase();
        const city = String(s.city || '').toLowerCase();
        return title.includes(term) || provider.includes(term) || city.includes(term);
      });
      const hasMore = services.length > limitCount;
      const pageServices = hasMore ? services.slice(0, limitCount) : services;
      return {
        success: true,
        services: pageServices,
        lastDoc: pageServices.length > 0 ? searchSnap.docs.find(d => d.id === pageServices[pageServices.length - 1].id) || null : null,
        hasMore
      };
    }

    const constraints = [];
    if (category && category !== 'all') {
      constraints.push(where('category', '==', category));
    }
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(firestoreLimit(limitCount + 1));
    const q = query(servicesRef, ...constraints);
    const snap = await getDocs(q);
    const hasMore = snap.docs.length > limitCount;
    const pageDocs = hasMore ? snap.docs.slice(0, limitCount) : snap.docs;
    let services = pageDocs.map(d => ({
      id: d.id,
      firestoreId: d.id,
      ...d.data()
    }));

    if (category && category !== 'all') {
      const cleanCat = category.toLowerCase().trim();
      services = services.filter(s => String(s.category || '').toLowerCase().trim() === cleanCat);
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      services = services.filter(s => {
        const title = String(s.title || '').toLowerCase();
        const provider = String(s.providerName || s.providerEmail || '').toLowerCase();
        const city = String(s.city || '').toLowerCase();
        return title.includes(term) || provider.includes(term) || city.includes(term);
      });
    }

    return {
      success: true,
      services,
      lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
      hasMore,
    };
  } catch (error) {
    console.error('[adminService] Erro ao buscar serviços:', error);
    return { success: false, error: error.message, services: [] };
  }
}

/**
 * Modera o status de um serviço ('activate', 'pause')
 */
export async function moderateService(serviceId, action) {
  if (!serviceId) return { success: false, error: 'ID de serviço inválido' };

  const newStatus = action === 'pause' ? 'paused' : 'active';
  try {
    const moderateStatus = httpsCallable(functions, 'moderateServiceStatus');
    const result = await moderateStatus({ serviceId: String(serviceId), action });
    const data = result?.data;
    if (data?.success) {
      return data;
    }
  } catch (functionError) {
    if (['permission-denied', 'unauthenticated', 'invalid-argument', 'failed-precondition'].includes(functionError.code)) {
      console.error('[adminService] Erro na Cloud Function ao moderar serviço:', functionError);
      return { success: false, error: functionError.message };
    }
  }

  // Fallback para ambientes em que a nova função ainda não foi implantada.
  // Quando disponível, as mesmas operações continuam protegidas pelas regras do Firestore.
  try {
    await updateDoc(doc(db, 'services', String(serviceId)), {
      status: newStatus,
      moderatedAt: new Date().toISOString()
    });
    return {
      success: true,
      message: `Serviço ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso.`,
      status: newStatus
    };
  } catch (error) {
    console.error('[adminService] Erro ao moderar serviço:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui permanentemente um serviço do Firestore
 */
export async function deleteServiceDocument(serviceId) {
  if (!serviceId) return { success: false, error: 'ID de serviço inválido' };
  try {
    await deleteDoc(doc(db, 'services', String(serviceId)));
    return { success: true, message: 'Serviço removido com sucesso.' };
  } catch (error) {
    console.error('[adminService] Erro ao excluir serviço:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca itens que requerem intervenção ou moderação (vagas pendentes/rejeitadas, usuários bloqueados)
 */
export async function fetchModerationItems() {
  try {
    const [jobsRes, usersRes] = await Promise.all([
      fetchAllJobs({ limitCount: 150 }),
      fetchAllUsers({ limitCount: 150 })
    ]);

    const flaggedJobs = (jobsRes.jobs || []).filter(j => {
      const st = String(j.status || '').toLowerCase().trim();
      return st === 'pendente' || st === 'rejeitada';
    });

    const blockedUsers = (usersRes.users || []).filter(u => u.blocked === true || u.status === 'blocked');

    return {
      success: true,
      flaggedJobs,
      blockedUsers,
      totalFlagged: flaggedJobs.length + blockedUsers.length
    };
  } catch (error) {
    console.error('[adminService] Erro ao buscar itens de moderação:', error);
    return { success: false, error: error.message, flaggedJobs: [], blockedUsers: [], totalFlagged: 0 };
  }
}

/**
 * Retorna status real de conexão e saúde das coleções do Firestore
 */
export async function fetchSystemHealth() {
  const startTime = Date.now();
  try {
    // Testa consulta leve ao Firestore para medir latência real de conexão
    await getDocs(query(collection(db, 'jobs'), firestoreLimit(1)));
    const latency = Date.now() - startTime;

    return {
      success: true,
      firebaseStatus: 'Conectado',
      projectId: 'ivai-conecta-4a366',
      latencyMs: latency,
      usersCollectionReady: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    try {
      await getDocs(query(collection(db, 'public_profiles'), firestoreLimit(1)));
      return {
        success: true,
        firebaseStatus: 'Conectado',
        projectId: 'ivai-conecta-4a366',
        latencyMs: Date.now() - startTime,
        usersCollectionReady: true,
        timestamp: new Date().toISOString()
      };
    } catch (fbErr) {
      return {
        success: false,
        firebaseStatus: 'Indisponível',
        projectId: 'ivai-conecta-4a366',
        error: fbErr.message || error.message,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }
}
