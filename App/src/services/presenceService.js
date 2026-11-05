// Presence Service for Ivaí Conecta
// Gerencia e sincroniza o status de presença (Online / Visto por último / Offline)
// em tempo real via Cloud Firestore, eventos do navegador e BroadcastChannel.

import { useEffect, useRef } from 'react';
import { db } from '../lib/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

/** Limite de tempo em milissegundos para considerar um usuário Online (3 minutos) */
export const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

/** Canal broadcast entre abas do mesmo navegador para sincronização instantânea */
const presenceChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('ivai_conecta_presence_bus')
  : null;

/**
 * Converte qualquer representação de data (ISO string, Timestamp do Firestore, milissegundos) em ms
 * @param {any} rawDate
 * @returns {number} Timestamp em ms ou 0 se inválido
 */
export function parseDateToMs(rawDate) {
  if (!rawDate) return 0;
  if (typeof rawDate === 'number') return rawDate > 0 ? rawDate : 0;
  if (typeof rawDate === 'string') {
    const t = new Date(rawDate).getTime();
    return isNaN(t) ? 0 : t;
  }
  if (typeof rawDate === 'object') {
    if (typeof rawDate.toDate === 'function') {
      try {
        const d = rawDate.toDate();
        return d instanceof Date ? d.getTime() : 0;
      } catch {
        return 0;
      }
    }
    if (typeof rawDate.seconds === 'number') {
      return rawDate.seconds * 1000 + Math.floor((rawDate.nanoseconds || 0) / 1000000);
    }
  }
  return 0;
}

/**
 * Determina se o usuário está realmente online com base no heartbeat recente
 * @param {Object} user - Objeto de usuário do Firestore ou do chat
 * @returns {boolean} True se o usuário esteve ativo nos últimos 3 minutos e isOnline !== false
 */
export function isUserOnline(user) {
  if (!user || typeof user !== 'object') return false;
  if (user.isOnline === false) return false;

  const rawDate = user.lastActiveAt || user.lastSeenAt || user.updatedAt;
  const timeMs = parseDateToMs(rawDate);
  if (timeMs <= 0) return false;

  const diffMs = Date.now() - timeMs;
  // Considera online se a última atividade foi dentro do limite de 3 minutos
  return diffMs >= 0 && diffMs <= ONLINE_THRESHOLD_MS;
}

/**
 * Retorna o rótulo descritivo e amigável da presença do usuário (ex: 'Online', 'Visto há 5 min', 'Offline')
 * @param {Object} user - Objeto de usuário
 * @returns {{ isOnline: boolean, label: string, color: 'emerald' | 'gray' }}
 */
export function formatPresenceStatus(user) {
  if (!user || typeof user !== 'object') {
    return { isOnline: false, label: 'Offline', color: 'gray' };
  }

  if (isUserOnline(user)) {
    return { isOnline: true, label: 'Online', color: 'emerald' };
  }

  const rawDate = user.lastActiveAt || user.lastSeenAt || user.updatedAt;
  const timeMs = parseDateToMs(rawDate);

  if (timeMs <= 0) {
    return { isOnline: false, label: 'Offline', color: 'gray' };
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timeMs);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) {
    return { isOnline: false, label: 'Visto agora há pouco', color: 'gray' };
  }
  if (diffMinutes < 60) {
    return { isOnline: false, label: `Visto há ${diffMinutes} min`, color: 'gray' };
  }

  const date = new Date(timeMs);
  const nowDate = new Date();
  const isToday = date.toDateString() === nowDate.toDateString();

  const yesterday = new Date();
  yesterday.setDate(nowDate.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeFormatted = `${hours}:${minutes}`;

  if (isToday) {
    return { isOnline: false, label: `Visto hoje às ${timeFormatted}`, color: 'gray' };
  }
  if (isYesterday) {
    return { isOnline: false, label: `Visto ontem às ${timeFormatted}`, color: 'gray' };
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return { isOnline: false, label: `Visto em ${day}/${month} às ${timeFormatted}`, color: 'gray' };
}

/**
 * Atualiza a presença do usuário conectado no Firestore e notifica outras abas locais
 * @param {string} uid - Identificador do usuário no Firebase Auth
 * @param {boolean} isOnline - Se está ativo no momento
 */
export async function updateUserPresence(uid, isOnline = true) {
  if (!uid || typeof uid !== 'string') return;
  const cleanUid = uid.trim();
  if (!cleanUid) return;

  const nowIso = new Date().toISOString();
  const payload = {
    isOnline: Boolean(isOnline),
    lastActiveAt: nowIso
  };

  try {
    const userRef = doc(db, 'users', cleanUid);
    await setDoc(userRef, payload, { merge: true });
  } catch (err) {
    // Falhas de rede silenciosas não devem interromper o app
    console.debug('[presence] Atualização silenciosa de presença:', err?.message || err);
  }

  try {
    if (presenceChannel) {
      presenceChannel.postMessage({
        type: 'presence_update',
        uid: cleanUid,
        ...payload
      });
    }
  } catch { }
}

/**
 * Helper para localizar o registro completo de um contato na lista de usuários do Firestore
 * @param {Array} allUsers - Lista de usuários (geralmente remoteUsers do Firestore)
 * @param {Object} participant - Objeto do participante do chat ({ uid, email, name })
 * @returns {Object|null}
 */
export function findContactInUsers(allUsers, participant) {
  if (!participant || !Array.isArray(allUsers) || allUsers.length === 0) return null;

  const pUid = String(participant.uid || participant.id || '').trim();
  const pEmail = (participant.email || '').toLowerCase().trim();
  const pName = (participant.name || '').toLowerCase().trim();

  return allUsers.find(u => {
    if (!u) return false;
    const uUid = String(u.uid || u.id || '').trim();
    const uEmail = (u.email || u.studentEmail || '').toLowerCase().trim();
    const uName = (u.name || u.displayName || u.company || u.nomeFantasia || '').toLowerCase().trim();

    if (pUid && uUid && uUid === pUid) return true;
    if (pEmail && uEmail && uEmail === pEmail) return true;
    if (pName && uName && uName === pName) return true;
    return false;
  }) || null;
}

/**
 * Hook global de ciclo de vida de presença do usuário logado.
 * Envia heartbeats periódicos enquanto o usuário estiver ativo na aplicação,
 * pausa quando inativo ou em background e registra saída ao fechar a janela.
 * @param {Object} currentUser - Usuário atualmente logado
 */
export function useUserPresence(currentUser) {
  const lastPingRef = useRef(0);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const uid = currentUser?.uid || currentUser?.id;
    if (!uid) return;

    let isMounted = true;

    // 1. Envia sinal de presença imediato ao conectar
    updateUserPresence(uid, true);
    lastPingRef.current = Date.now();
    lastActivityRef.current = Date.now();

    // 2. Registrador de atividade do usuário com throttle para evitar writes excessivos
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      const now = Date.now();
      // Envia no máximo 1 ping a cada 45 segundos por movimentação/interação do usuário
      if (now - lastPingRef.current > 45 * 1000) {
        lastPingRef.current = now;
        updateUserPresence(uid, true);
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // 3. Heartbeat periódico a cada 60 segundos
    const heartbeatInterval = setInterval(() => {
      if (!isMounted) return;
      const now = Date.now();
      const isVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
      const wasActiveRecently = now - lastActivityRef.current < 2.5 * 60 * 1000; // ativo há menos de 2.5 min

      if (isVisible && wasActiveRecently) {
        lastPingRef.current = now;
        updateUserPresence(uid, true);
      }
    }, 60 * 1000);

    // 4. Retomada imediata quando a aba volta a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityRef.current = Date.now();
        lastPingRef.current = Date.now();
        updateUserPresence(uid, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Tentativa de desconexão graciosa ao fechar a aba
    const handleBeforeUnload = () => {
      updateUserPresence(uid, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      clearInterval(heartbeatInterval);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser?.uid, currentUser?.id]);
}

