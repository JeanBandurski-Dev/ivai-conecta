// Admin Service for Ivaí Conecta
// Operations strictly using real Firestore collections (users, jobs, services, applications)
// Zero Mock Policy: No hardcoded sample arrays or fake fallback counts.

import { db } from '../lib/firebase.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  limit as firestoreLimit
} from 'firebase/firestore';

/**
 * Retorna contagem e estatísticas consolidadas reais da plataforma
 */
export async function fetchPlatformStats() {
  try {
    const [usersSnap, jobsSnap, servicesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'jobs')),
      getDocs(collection(db, 'services'))
    ]);

    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const services = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Cálculos de Usuários
    const totalUsers = users.length;
    let studentsCount = 0;
    let companiesCount = 0;
    let teachersCount = 0;
    let adminsCount = 0;
    let freelancersCount = 0;
    let candidatesCount = 0;
    let blockedUsersCount = 0;

    users.forEach(u => {
      const role = String(u.role || '').toLowerCase().trim();
      if (role === 'aluno') studentsCount++;
      else if (role === 'empresa') companiesCount++;
      else if (role === 'professor') teachersCount++;
      else if (role === 'admin') adminsCount++;
      else if (role === 'freelancer') freelancersCount++;
      else candidatesCount++;

      if (u.blocked === true || u.status === 'blocked') {
        blockedUsersCount++;
      }
    });

    const activeUsersCount = Math.max(0, totalUsers - blockedUsersCount);

    // Cálculos de Vagas
    const totalJobs = jobs.length;
    let activeJobsCount = 0;
    let closedJobsCount = 0;
    let pendingJobsCount = 0;
    let rejectedJobsCount = 0;

    jobs.forEach(j => {
      const st = String(j.status || 'Ativa').toLowerCase().trim();
      if (st === 'ativa') activeJobsCount++;
      else if (st === 'encerrada') closedJobsCount++;
      else if (st === 'pendente') pendingJobsCount++;
      else if (st === 'rejeitada') rejectedJobsCount++;
      else activeJobsCount++;
    });

    // Total de Serviços
    const totalServices = services.length;

    // Atividades recentes combinadas ordenadas por timestamp
    const recentActivities = [];

    users.forEach(u => {
      if (u.createdAt || u.createdAtTimestamp) {
        recentActivities.push({
          id: `act_user_${u.id}`,
          type: 'user',
          title: `Novo cadastro: ${u.name || u.email || 'Usuário'}`,
          subtitle: `Função: ${u.role || 'Usuário'} • ${u.city || 'Ivaiporã'}`,
          timestamp: u.createdAtTimestamp || (u.createdAt ? new Date(u.createdAt).getTime() : 0),
          dateStr: u.createdAt || 'Data recente'
        });
      }
    });

    jobs.forEach(j => {
      if (j.createdAt || j.createdAtTimestamp) {
        recentActivities.push({
          id: `act_job_${j.id}`,
          type: 'job',
          title: `Nova vaga: ${j.title || 'Vaga'}`,
          subtitle: `${j.company || 'Empresa'} • Status: ${j.status || 'Ativa'}`,
          timestamp: j.createdAtTimestamp || (j.createdAt ? new Date(j.createdAt).getTime() : 0),
          dateStr: j.createdAt || 'Data recente'
        });
      }
    });

    services.forEach(s => {
      if (s.createdAt || s.createdAtTimestamp) {
        recentActivities.push({
          id: `act_service_${s.id}`,
          type: 'service',
          title: `Serviço publicado: ${s.title || 'Serviço'}`,
          subtitle: `Prestador: ${s.providerName || s.providerEmail || 'Autônomo'}`,
          timestamp: s.createdAtTimestamp || (s.createdAt ? new Date(s.createdAt).getTime() : 0),
          dateStr: s.createdAt || 'Data recente'
        });
      }
    });

    // Ordena as atividades mais recentes primeiro (limita a 10)
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
export async function fetchAllUsers({ role = 'all', status = 'all', search = '', limitCount = 100 } = {}) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, firestoreLimit(limitCount));
    const snap = await getDocs(q);

    let users = snap.docs.map(d => ({
      id: d.id,
      uid: d.id,
      ...d.data()
    }));

    // Filtro por Role
    if (role && role !== 'all') {
      const cleanRole = role.toLowerCase().trim();
      users = users.filter(u => String(u.role || '').toLowerCase().trim() === cleanRole);
    }

    // Filtro por Status
    if (status && status !== 'all') {
      if (status === 'blocked') {
        users = users.filter(u => u.blocked === true || u.status === 'blocked');
      } else if (status === 'active') {
        users = users.filter(u => !u.blocked && u.status !== 'blocked');
      }
    }

    // Busca textual por nome ou e-mail
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      users = users.filter(u => {
        const name = String(u.name || '').toLowerCase();
        const email = String(u.email || '').toLowerCase();
        const city = String(u.city || '').toLowerCase();
        return name.includes(term) || email.includes(term) || city.includes(term);
      });
    }

    return { success: true, users };
  } catch (error) {
    console.error('[adminService] Erro ao listar usuários:', error);
    return { success: false, error: error.message, users: [] };
  }
}

/**
 * Busca documento detalhado de um usuário pelo ID
 */
export async function fetchUserById(userId) {
  if (!userId) return { success: false, error: 'ID de usuário não fornecido' };
  try {
    const userDoc = await getDoc(doc(db, 'users', String(userId)));
    if (!userDoc.exists()) {
      return { success: false, error: 'Usuário não localizado no Firestore' };
    }
    return {
      success: true,
      user: { id: userDoc.id, uid: userDoc.id, ...userDoc.data() }
    };
  } catch (error) {
    console.error('[adminService] Erro ao carregar usuário:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Conta quantos administradores ativos existem no sistema
 */
export async function countActiveAdmins() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    let count = 0;
    snap.docs.forEach(d => {
      const data = d.data();
      const role = String(data.role || '').toLowerCase().trim();
      const isBlocked = data.blocked === true || data.status === 'blocked';
      if (role === 'admin' && !isBlocked) {
        count++;
      }
    });
    return count;
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

    await updateDoc(doc(db, 'users', String(userId)), payload);

    return {
      success: true,
      message: `Função do usuário atualizada para ${newRole} com sucesso.`,
      user: { ...targetUser, ...payload }
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
    return { success: true, message: 'Documento de usuário removido do Firestore com sucesso.' };
  } catch (error) {
    console.error('[adminService] Erro ao excluir usuário:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca vagas reais do Firestore com filtros
 */
export async function fetchAllJobs({ status = 'all', search = '', limitCount = 100 } = {}) {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, firestoreLimit(limitCount));
    const snap = await getDocs(q);

    let jobs = snap.docs.map(d => ({
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

    return { success: true, jobs };
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
export async function fetchAllServices({ category = 'all', search = '', limitCount = 100 } = {}) {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, firestoreLimit(limitCount));
    const snap = await getDocs(q);

    let services = snap.docs.map(d => ({
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

    return { success: true, services };
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
    // Testa consulta leve ao Firestore para medir latência
    const usersSnap = await getDocs(query(collection(db, 'users'), firestoreLimit(1)));
    const latency = Date.now() - startTime;

    return {
      success: true,
      firebaseStatus: 'Conectado',
      projectId: 'ivai-conecta-4a366',
      latencyMs: latency,
      usersCollectionReady: !usersSnap.empty || usersSnap.size >= 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      firebaseStatus: 'Indisponível',
      projectId: 'ivai-conecta-4a366',
      error: error.message,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}
