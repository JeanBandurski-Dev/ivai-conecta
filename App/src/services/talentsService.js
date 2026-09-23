// Talents & Teachers Service for Ivaí Conecta (Firestore 'users' and 'endorsement_requests' collections)
import { db } from '../lib/firebase.js';
import { collection, getDoc, getDocs, doc, setDoc, addDoc, updateDoc, arrayUnion, increment, onSnapshot } from 'firebase/firestore';
import {
  STORAGE_KEY_TALENTS,
  STORAGE_KEY_TEACHERS,
  STORAGE_KEY_ENDORSEMENT_REQUESTS,
} from '../data/seedData.js';

import { matchCity } from '../utils/searchUtils.js';
import { isInstitutionalEmail } from './authService.js';

let _memTalentsCache = null;

/**
 * Normaliza e identifica univocamente um professor em uma recomendação.
 * A chave única é o e-mail educacional (em minúsculas) ou o UID/ID do professor.
 */
export function getEndorsementProfessorKey(endorsementOrProf) {
  if (!endorsementOrProf) return '';
  if (typeof endorsementOrProf === 'string') {
    return endorsementOrProf.toLowerCase().trim();
  }
  const email = String(endorsementOrProf.profEmail || endorsementOrProf.email || '').toLowerCase().trim();
  const uid = String(endorsementOrProf.profUid || endorsementOrProf.profId || endorsementOrProf.uid || endorsementOrProf.id || '').trim();
  if (email && email.includes('@')) return email;
  return uid;
}

/**
 * Compara dois professores/recomendações e determina se pertencem ao mesmo professor.
 * Valida por e-mail educacional OU por UID/ID institucional.
 */
export function isSameProfessor(profA, profB) {
  if (!profA || !profB) return false;

  const emailA = (typeof profA === 'string' && profA.includes('@'))
    ? profA.toLowerCase().trim()
    : String(profA.profEmail || profA.email || '').toLowerCase().trim();
  const emailB = (typeof profB === 'string' && profB.includes('@'))
    ? profB.toLowerCase().trim()
    : String(profB.profEmail || profB.email || '').toLowerCase().trim();

  if (emailA && emailB && emailA === emailB) return true;

  const uidA = (typeof profA === 'string' && !profA.includes('@'))
    ? profA.trim()
    : String(profA.profUid || profA.profId || profA.uid || profA.id || '').trim();
  const uidB = (typeof profB === 'string' && !profB.includes('@'))
    ? profB.trim()
    : String(profB.profUid || profB.profId || profB.uid || profB.id || '').trim();

  if (uidA && uidB && uidA === uidB) return true;

  return false;
}

/**
 * Garante que a lista de recomendações contenha apenas UMA recomendação por professor.
 * Se houver duplicatas legadas, prioriza a mais recente ou com texto mais completo.
 */
export function sanitizeUniqueEndorsements(endorsements) {
  if (!Array.isArray(endorsements) || endorsements.length === 0) return [];
  const unique = [];

  endorsements.forEach(e => {
    if (!e || typeof e !== 'object') return;
    const existingIndex = unique.findIndex(u => isSameProfessor(u, e));
    if (existingIndex === -1) {
      unique.push(e);
    } else {
      const existing = unique[existingIndex];
      const existingLen = String(existing.quote || '').length;
      const currentLen = String(e.quote || '').length;
      const existingTime = existing.timestamp || (existing.date ? new Date(existing.date).getTime() : 0);
      const currentTime = e.timestamp || (e.date ? new Date(e.date).getTime() : 0);

      if (currentTime > existingTime || (currentTime === existingTime && currentLen > existingLen)) {
        unique[existingIndex] = e;
      }
    }
  });

  return unique;
}

/**
 * Garante que para um professor haja no máximo UMA solicitação por estudante (mantendo a mais recente).
 * Se alguma já foi aprovada, o status 'Aprovado' tem prioridade.
 */
export function deduplicateRequestsByStudent(requests) {
  if (!Array.isArray(requests) || requests.length === 0) return [];
  const map = new Map();
  const sorted = [...requests].sort((a, b) => (b.requestedTimestamp || 0) - (a.requestedTimestamp || 0));

  for (const req of sorted) {
    if (!req) continue;
    const studentKey = String(req.studentId || req.studentUid || req.studentEmail || req.studentName || '').toLowerCase().trim();
    if (!studentKey) continue;

    if (!map.has(studentKey)) {
      map.set(studentKey, req);
    } else {
      const existing = map.get(studentKey);
      if (req.status === 'Aprovado' && existing.status !== 'Aprovado') {
        map.set(studentKey, req);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.requestedTimestamp || 0) - (a.requestedTimestamp || 0));
}

/**
 * Garante que para um estudante haja no máximo UMA solicitação por docente (mantendo a mais recente).
 * Se alguma já foi aprovada, o status 'Aprovado' tem prioridade.
 */
export function deduplicateRequestsByTeacher(requests) {
  if (!Array.isArray(requests) || requests.length === 0) return [];
  const map = new Map();
  const sorted = [...requests].sort((a, b) => (b.requestedTimestamp || 0) - (a.requestedTimestamp || 0));

  for (const req of sorted) {
    if (!req) continue;
    const profKey = (req.profEmail && req.profEmail.includes('@'))
      ? req.profEmail.toLowerCase().trim()
      : String(req.profUid || req.targetTeacherId || req.profName || '').toLowerCase().trim();
    if (!profKey) continue;

    if (!map.has(profKey)) {
      map.set(profKey, req);
    } else {
      const existing = map.get(profKey);
      if (req.status === 'Aprovado' && existing.status !== 'Aprovado') {
        map.set(profKey, req);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.requestedTimestamp || 0) - (a.requestedTimestamp || 0));
}

/**
 * Verifica se um professor já recomendou este aluno
 */
export function hasTeacherEndorsedStudent(studentEndorsements, profUserOrEmail) {
  if (!Array.isArray(studentEndorsements) || studentEndorsements.length === 0 || !profUserOrEmail) {
    return false;
  }
  return studentEndorsements.some(e => isSameProfessor(e, profUserOrEmail));
}

/**
 * Normaliza um documento de usuário para uso no Banco de Talentos / Perfis
 */
function normalizeUserDoc(docData, docId) {
  const data = docData || {};
  const cleanEndorsements = sanitizeUniqueEndorsements(data.endorsements || []);
  return {
    ...data,
    id: data.id != null ? data.id : docId,
    firestoreId: docId,
    name: data.name || 'Usuário',
    role: data.role || 'aluno',
    city: data.city || '',
    avatar: data.avatar || '',
    skills: data.skills || [],
    endorsements: cleanEndorsements,
    endorsementCount: cleanEndorsements.length,
    experiences: data.experiences || [],
    projects: data.projects || [],
    education: data.education || [],
    isVerifiedStudent: data.isVerifiedStudent ?? (cleanEndorsements.length > 0 ? true : false),
    course: data.course || '',
    institution: data.institution || '',
    period: data.period || '',
  };
}

/**
 * Normaliza um documento de professor
 */
function normalizeTeacherDoc(docData, docId) {
  const data = docData || {};
  return {
    ...data,
    id: data.id != null ? data.id : docId,
    firestoreId: docId,
    name: data.name || 'Docente',
    role: data.role || 'professor',
    email: data.email || '',
    degree: data.degree || '',
    institution: data.institution || '',
    discipline: data.discipline || '',
    endorsementCount: data.endorsementCount || 0,
    verified: data.verified ?? false,
    avatar: data.avatar || '',
    bio: data.bio || '',
    education: data.education || [],
    classes: data.classes || [],
  };
}

/**
 * Escuta banco de talentos em tempo real via Firestore onSnapshot da coleção 'users'
 */
export function subscribeToTalents(city = 'Todas as Cidades', callback) {
  callback(getTalents(city));

  try {
    const usersRef = collection(db, 'users');

    return onSnapshot(usersRef, (snapshot) => {
      // 1. Extrai pareceres concedidos por professores via endorsementResponses
      const profApprovedByStudent = new Map();
      snapshot.docs.forEach(d => {
        const u = d.data();
        if (Array.isArray(u.endorsementResponses)) {
          u.endorsementResponses.forEach(resp => {
            if (resp && resp.status === 'Aprovado' && resp.studentId) {
              const sId = String(resp.studentId);
              const list = profApprovedByStudent.get(sId) || [];
              list.push({
                id: `end_${resp.reqId || resp.timestamp || d.id}`,
                profUid: String(d.id),
                profName: u.name || 'Professor Docente',
                profEmail: u.email || '',
                institution: u.institution || 'IFPR Campus Ivaiporã',
                discipline: resp.discipline || u.discipline || 'Formação Acadêmica',
                quote: resp.quote || 'Estudante com excelente desempenho acadêmico.',
                isVerified: true,
                date: resp.date || new Date().toLocaleDateString('pt-BR'),
                timestamp: resp.timestamp || Date.now()
              });
              profApprovedByStudent.set(sId, list);
            }
          });
        }
      });

      // 2. Normaliza os talentos mesclando pareceres diretos com os emitidos por professores
      const allUsers = snapshot.docs.map(d => {
        const normalized = normalizeUserDoc(d.data(), d.id);
        const sId = String(normalized.id || normalized.firestoreId || d.id);
        const profEndorsements = profApprovedByStudent.get(sId) || [];
        if (profEndorsements.length > 0) {
          const merged = sanitizeUniqueEndorsements([...(normalized.endorsements || []), ...profEndorsements]);
          return {
            ...normalized,
            endorsements: merged,
            endorsementCount: merged.length,
            isVerifiedStudent: true
          };
        }
        return normalized;
      });

      const remoteTalents = allUsers.filter(u => !u.role || ['aluno', 'candidato', 'freelancer'].includes(u.role));

      _memTalentsCache = remoteTalents;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(remoteTalents));
        } catch {}
      }

      const filtered = remoteTalents.filter(t => matchCity(t.city, city));
      callback(filtered);
    }, (error) => {
      console.warn('[Firestore Talents Listener] Offline fallback:', error.message);
      callback(getTalents(city));
    });
  } catch (error) {
    console.warn('[Firestore Talents Listener] Falha ao assinar talentos:', error.message);
    callback(getTalents(city));
    return () => {};
  }
}

export const INSTITUTIONAL_FACULTY = [
  {
    id: 'prof_ronan_silva',
    name: 'Prof. Dr. Ronan Silva',
    email: 'ronan.silva@ifpr.edu.br',
    institution: 'IFPR Campus Ivaiporã',
    discipline: 'Programação de Computadores',
    classes: ['Programação de Computadores', 'Desenvolvimento Web', 'Estrutura de Dados', 'Algoritmos'],
    degree: 'Doutorado em Ciência da Computação',
    role: 'professor',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Docente da área de Informática e Desenvolvimento de Software no IFPR Campus Ivaiporã.'
  },
  {
    id: 'prof_mariana_santos',
    name: 'Prof.ª Dr.ª Mariana Santos',
    email: 'mariana.santos@ifpr.edu.br',
    institution: 'IFPR Campus Ivaiporã',
    discipline: 'Engenharia de Software',
    classes: ['Engenharia de Software', 'Banco de Dados', 'Gestão de Projetos de TI'],
    degree: 'Doutora em Engenharia de Software',
    role: 'professor',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    bio: 'Professora titular do IFPR Campus Ivaiporã em Engenharia de Software e Banco de Dados.'
  },
  {
    id: 'prof_carlos_lima',
    name: 'Prof. Me. Carlos Eduardo Lima',
    email: 'carlos.lima@univale.edu.br',
    institution: 'Univale Ivaiporã',
    discipline: 'Redes de Computadores',
    classes: ['Redes de Computadores', 'Sistemas Operacionais', 'Segurança da Informação'],
    degree: 'Mestre em Redes e Sistemas',
    role: 'professor',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Professor na Univale Ivaiporã em infraestrutura de redes e segurança.'
  },
  {
    id: 'prof_juliana_oliveira',
    name: 'Prof.ª Ma. Juliana Oliveira',
    email: 'juliana.oliveira@uenp.edu.br',
    institution: 'UENP Campus Luiz Meneghel',
    discipline: 'Inteligência Artificial & Ciência de Dados',
    classes: ['Inteligência Artificial', 'Ciência de Dados', 'Estatística Aplicada'],
    degree: 'Mestre em Ciência da Computação',
    role: 'professor',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Docente pesquisadora da UENP em Inteligência Artificial e Ciência de Dados.'
  }
];

export function mergeWithInstitutionalFaculty(remoteTeachers = []) {
  const map = new Map();
  // Inicia com o corpo docente institucional credenciado
  for (const f of INSTITUTIONAL_FACULTY) {
    map.set(f.email.toLowerCase().trim(), f);
  }
  // Mescla e prioriza professores cadastrados dinamicamente no Firestore
  for (const t of remoteTeachers) {
    const email = (t.email || '').toLowerCase().trim();
    if (email) {
      map.set(email, { ...map.get(email), ...t });
    } else if (t.id) {
      map.set(String(t.id), t);
    }
  }
  return Array.from(map.values());
}

/**
 * Escuta corpo docente em tempo real via Firestore onSnapshot da coleção 'users'
 */
export function subscribeToTeachers(callback) {
  // Callback imediato com dados disponíveis
  callback(getVerifiedTeachers());

  try {
    const usersRef = collection(db, 'users');

    return onSnapshot(usersRef, (snapshot) => {
      const remoteTeachers = snapshot.docs
        .map(d => normalizeTeacherDoc(d.data(), d.id))
        .filter(u => {
          const r = String(u.role || '').toLowerCase().trim();
          return r === 'professor' || r === 'docente';
        });

      const merged = mergeWithInstitutionalFaculty(remoteTeachers);

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(merged));
        } catch {}
      }

      callback(merged);
    }, (error) => {
      console.warn('[Firestore Teachers Listener] Offline fallback:', error.message);
      callback(getVerifiedTeachers());
    });
  } catch (error) {
    console.warn('[Firestore Teachers Listener] Falha ao assinar professores:', error.message);
    callback(getVerifiedTeachers());
    return () => {};
  }
}

export function getTalents(city = 'Todas as Cidades') {
  let talents = [];
  if (Array.isArray(_memTalentsCache) && _memTalentsCache.length > 0) {
    talents = _memTalentsCache;
  } else if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_TALENTS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          talents = parsed;
          _memTalentsCache = parsed;
        }
      } catch {}
    }
  }

  if (!city || city === 'Todas as Cidades') return talents;
  return talents.filter(t => matchCity(t.city, city));
}

export function getTalentById(id) {
  if (!id) return null;
  const talents = getTalents('Todas as Cidades');
  const found = talents.find(t => t.id === Number(id) || t.id === id || String(t.id) === String(id) || t.firestoreId === id);
  if (found) return found;

  if (typeof localStorage !== 'undefined') {
    const rawAuth = localStorage.getItem('ivai_conecta_auth_user');
    if (rawAuth) {
      try {
        const auth = JSON.parse(rawAuth);
        if (auth && (String(auth.id) === String(id) || String(auth.uid) === String(id) || auth.email === id || id === 'me')) {
          return normalizeUserDoc(auth, auth.uid || auth.id);
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Escuta dados de um perfil de talento em tempo real no Firestore
 */
export function subscribeToTalentById(talentId, callback) {
  if (!talentId) return () => {};
  const idStr = String(talentId);

  // Retorno imediato do cache local
  const local = getTalentById(idStr);
  if (local) callback(local);

  try {
    const userDocRef = doc(db, 'users', idStr);
    return onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const normalized = normalizeUserDoc(snap.data(), snap.id);
        updateTalentProfile(idStr, normalized);
        callback(normalized);
      } else {
        const talentDocRef = doc(db, 'talents', idStr);
        getDoc(talentDocRef).then(tSnap => {
          if (tSnap.exists()) {
            const normalized = normalizeUserDoc(tSnap.data(), tSnap.id);
            callback(normalized);
          }
        }).catch(() => {});
      }
    }, (err) => {
      console.warn('[Firestore] subscribeToTalentById offline fallback:', err.message);
      callback(getTalentById(idStr));
    });
  } catch (err) {
    console.warn('[Firestore] subscribeToTalentById falha:', err.message);
    callback(getTalentById(idStr));
    return () => {};
  }
}

export function submitStudentVerification(raNumber, fileData) {
  const filename = typeof fileData === 'object' && fileData?.name ? fileData.name : String(fileData || 'Declaracao_Matricula.pdf');
  const filesizeMB = typeof fileData === 'object' && fileData?.size ? (fileData.size / (1024 * 1024)).toFixed(2) : '1.20';
  
  const verificationRecord = {
    raNumber,
    fileName: filename,
    fileSizeMB: filesizeMB,
    submittedAt: new Date().toLocaleDateString('pt-BR'),
    status: 'Aprovado'
  };

  return {
    success: true,
    message: `Comprovante "${filename}" (${filesizeMB}MB) enviado com sucesso! Matrícula autenticada.`,
    verificationRecord
  };
}

export function getVerifiedTeachers() {
  let teachers = [];
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          teachers = parsed.filter(t => (t.role || '').toLowerCase() === 'professor');
        }
      } catch {}
    }

    // Se o usuário autenticado atual for professor, garante presença imediata na lista
    const rawAuth = localStorage.getItem('ivai_conecta_auth_user');
    if (rawAuth) {
      try {
        const auth = JSON.parse(rawAuth);
        if (auth && (auth.role === 'professor' || auth.role === 'docente')) {
          teachers.push(normalizeTeacherDoc(auth, auth.uid || auth.id));
        }
      } catch {}
    }
  }

  const merged = mergeWithInstitutionalFaculty(teachers);

  // Background sync com o Firestore (coleção 'users' role 'professor')
  try {
    const usersRef = collection(db, 'users');
    getDocs(usersRef).then(snapshot => {
      const remote = snapshot.docs
        .map(d => normalizeTeacherDoc(d.data(), d.id))
        .filter(u => {
          const r = String(u.role || '').toLowerCase().trim();
          return r === 'professor' || r === 'docente';
        });

      const finalMerged = mergeWithInstitutionalFaculty([...teachers, ...remote]);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(finalMerged));
      }
    }).catch(err => console.warn('[Firestore] getVerifiedTeachers offline:', err.message));
  } catch {}

  return merged;
}

export function getTeacherById(id) {
  if (!id) return null;
  const teachers = getVerifiedTeachers();
  const found = teachers.find(t => t.id === id || String(t.id) === String(id) || t.firestoreId === id || t.email === id);
  if (found) return found;

  if (typeof localStorage !== 'undefined') {
    const rawAuth = localStorage.getItem('ivai_conecta_auth_user');
    if (rawAuth) {
      try {
        const auth = JSON.parse(rawAuth);
        if (auth && auth.role === 'professor' && (String(auth.id) === String(id) || String(auth.uid) === String(id) || auth.email === id || id === 'me')) {
          return normalizeTeacherDoc(auth, auth.uid || auth.id);
        }
      } catch {}
    }
  }

  return null;
}

export async function updateTeacherProfile(teacherId, data) {
  const teachers = getVerifiedTeachers();
  const updated = teachers.map(t => (t.id === teacherId || String(t.id) === String(teacherId) || t.firestoreId === teacherId ? { ...t, ...data } : t));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updated));
  }

  // Sync imediato com a coleção 'users' do Firestore
  try {
    const docRef = doc(db, 'users', String(teacherId));
    await setDoc(docRef, {
      ...data,
      role: 'professor',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync updateTeacherProfile:', err.message);
  }

  return updated;
}

export function getTeacherEndorsedStudents(profEmailOrTeacher) {
  const talents = getTalents('Todas as Cidades');
  if (!profEmailOrTeacher) return [];

  const directMatches = talents.filter(t => hasTeacherEndorsedStudent(t.endorsements || [], profEmailOrTeacher));
  const studentMap = new Map();
  directMatches.forEach(t => studentMap.set(String(t.id), t));

  // Se for objeto de professor contendo respostas aprovadas no Firestore
  if (typeof profEmailOrTeacher === 'object' && Array.isArray(profEmailOrTeacher?.endorsementResponses)) {
    profEmailOrTeacher.endorsementResponses.forEach(resp => {
      if (resp && resp.status === 'Aprovado' && resp.studentId) {
        const sId = String(resp.studentId);
        if (!studentMap.has(sId)) {
          const found = talents.find(t => String(t.id) === sId) || getTalentById(sId);
          if (found) studentMap.set(sId, found);
        }
      }
    });
  }

  return Array.from(studentMap.values());
}

export async function proactiveEndorseStudent(studentId, profUser, quote, discipline) {
  const idStr = String(studentId);
  const cleanEmail = (profUser?.email || '').toLowerCase().trim();
  const profUid = profUser?.uid || profUser?.id;

  // 1. Busca os pareceres mais recentes do aluno (Firestore + cache local)
  let currentEndorsements = [];
  try {
    const snap = await getDoc(doc(db, 'users', idStr));
    if (snap.exists()) {
      currentEndorsements = snap.data().endorsements || [];
    }
  } catch (err) {
    console.warn('[Firestore] Busca prévia de pareceres do aluno:', err.message);
  }

  if (currentEndorsements.length === 0) {
    const talent = getTalentById(idStr);
    currentEndorsements = talent?.endorsements || [];
  }

  // 2. Impedir estritamente recomendações duplicadas do mesmo professor para o mesmo aluno
  if (hasTeacherEndorsedStudent(currentEndorsements, profUser)) {
    return {
      success: false,
      error: 'Você já recomendou este aluno. É permitida apenas uma recomendação por professor para cada aluno.'
    };
  }

  const newEndorsement = {
    id: `end_${Date.now()}`,
    profUid: profUid ? String(profUid) : '',
    profName: profUser?.name || 'Professor Avaliador',
    profEmail: cleanEmail,
    institution: profUser?.institution || 'IFPR Campus Ivaiporã',
    discipline: discipline || profUser?.discipline || 'Avaliação Pedagógica',
    quote: quote || 'Estudante com excelente desempenho acadêmico e ótimo trabalho em equipe.',
    isVerified: true,
    date: new Date().toLocaleDateString('pt-BR'),
    timestamp: Date.now()
  };

  await addEndorsementToTalent(studentId, newEndorsement);

  // Incrementar contador do professor
  const teachers = getVerifiedTeachers();
  const updatedTeachers = teachers.map(t =>
    t.email?.toLowerCase() === cleanEmail ? { ...t, endorsementCount: (t.endorsementCount || 0) + 1 } : t
  );
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updatedTeachers));
  }

  if (profUid) {
    try {
      await updateDoc(doc(db, 'users', String(profUid)), {
        endorsementCount: (profUser?.endorsementCount || 0) + 1
      });
    } catch {}
  }

  return { success: true, endorsement: newEndorsement };
}

export function getEndorsementRequests() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_ENDORSEMENT_REQUESTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const map = new Map();
        parsed.forEach(r => {
          if (!r) return;
          const sKey = String(r.studentId || r.studentEmail || '').toLowerCase().trim();
          const pKey = String(r.profEmail || r.profUid || r.profName || '').toLowerCase().trim();
          const comboKey = `${sKey}__${pKey}`;
          const existing = map.get(comboKey);
          if (!existing || (r.requestedTimestamp || 0) > (existing.requestedTimestamp || 0)) {
            map.set(comboKey, r);
          }
        });
        return Array.from(map.values()).sort((a, b) => (b.requestedTimestamp || 0) - (a.requestedTimestamp || 0));
      }
    } catch {}
  }
  return [];
}

/**
 * Escuta solicitações de recomendação para um professor em tempo real no Firestore e local
 * Suporta busca por e-mail, UID ou nome institucional do professor.
 */
export function subscribeToEndorsementRequests(teacherUserOrEmail, callback) {
  const profEmail = typeof teacherUserOrEmail === 'string' && teacherUserOrEmail.includes('@')
    ? teacherUserOrEmail.toLowerCase().trim()
    : String(teacherUserOrEmail?.email || (typeof teacherUserOrEmail === 'string' ? teacherUserOrEmail : '')).toLowerCase().trim();

  const profUid = typeof teacherUserOrEmail === 'object' && teacherUserOrEmail !== null
    ? String(teacherUserOrEmail.uid || teacherUserOrEmail.id || '')
    : (typeof teacherUserOrEmail === 'string' && !teacherUserOrEmail.includes('@') ? teacherUserOrEmail.trim() : '');

  const profName = typeof teacherUserOrEmail === 'object' && teacherUserOrEmail !== null
    ? String(teacherUserOrEmail.name || '').toLowerCase().trim()
    : '';

  const filterForTeacher = (allRequests) => {
    if (!Array.isArray(allRequests)) return [];

    const matching = allRequests.filter(r => {
      if (!r) return false;
      const rEmail = String(r.profEmail || '').toLowerCase().trim();
      const rUid = String(r.profUid || r.targetTeacherId || '').trim();
      const rName = String(r.profName || '').toLowerCase().trim();

      // 1. Match por email direto
      if (profEmail && rEmail && rEmail === profEmail) return true;

      // 2. Match por UID
      if (profUid && rUid && rUid === profUid) return true;

      // 3. Match por Nome (ex: Prof. Joelson vs Joelson)
      if (profName && rName) {
        if (rName === profName || profName.includes(rName) || rName.includes(profName)) {
          return true;
        }
      }

      // 4. Comparador de professor unificado
      if (isSameProfessor(r, teacherUserOrEmail)) return true;

      // 5. Fallback permissivo se professor logado e requisição sem e-mail
      if (!rEmail && profUid) return true;

      return false;
    });

    // Se o estudante já possui parecer deste professor no banco de talentos,
    // a requisição é automaticamente promovida a 'Aprovado' (finalizada)
    const normalized = matching.map(req => {
      const student = getTalentById(req.studentId);
      const isAlreadyEndorsed = hasTeacherEndorsedStudent(student?.endorsements || [], teacherUserOrEmail);
      if (isAlreadyEndorsed) {
        const endorsement = student?.endorsements?.find(e => isSameProfessor(e, teacherUserOrEmail));
        return {
          ...req,
          status: 'Aprovado',
          discipline: endorsement?.discipline || req.discipline,
          quote: endorsement?.quote || req.quote,
          resolvedAt: endorsement?.date || req.resolvedAt || req.requestedAt
        };
      }
      return req;
    });

    // Deduplicação estrita: apenas 1 solicitação ativa por aluno para este docente
    return deduplicateRequestsByStudent(normalized);
  };

  try {
    const requestsMap = new Map();

    // Carrega cache local primeiro
    const local = getEndorsementRequests();
    local.forEach(r => { if (r.id) requestsMap.set(String(r.id), r); });

    // 1. Escuta em tempo real a coleção 'users' do Firestore (sincronização cross-window e guia anônima)
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      // Extrai solicitações salvas diretamente nos documentos dos estudantes
      snapshot.docs.forEach(d => {
        const u = d.data();
        if (Array.isArray(u.pendingEndorsementRequests)) {
          u.pendingEndorsementRequests.forEach(req => {
            const reqId = String(req.id || `${d.id}_${req.requestedTimestamp || Date.now()}`);
            requestsMap.set(reqId, {
              ...req,
              id: reqId,
              studentId: req.studentId || d.id,
              studentName: req.studentName || u.name || 'Estudante',
              studentEmail: req.studentEmail || u.email || '',
              studentCourse: req.studentCourse || u.course || u.badge || 'Ensino Superior / Técnico',
              studentInstitution: req.studentInstitution || u.institution || 'IFPR Campus Ivaiporã',
              studentAvatar: req.studentAvatar || u.avatar || ''
            });
          });
        }
      });

      const allMerged = Array.from(requestsMap.values());
      try {
        localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(allMerged));
      } catch {}

      callback(filterForTeacher(allMerged));
    }, (err) => {
      console.warn('[Firestore Users Endorsements Listener] Fallback:', err.message);
      const current = Array.from(requestsMap.values());
      callback(filterForTeacher(current.length > 0 ? current : getEndorsementRequests()));
    });

    // 2. Escuta também endorsement_requests caso habilitado no Firestore
    let unsubFs = null;
    try {
      unsubFs = onSnapshot(collection(db, 'endorsement_requests'), (snapshot) => {
        snapshot.docs.forEach(d => {
          requestsMap.set(String(d.id), { id: d.id, firestoreId: d.id, ...d.data() });
        });
        const merged = Array.from(requestsMap.values());
        try { localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(merged)); } catch {}
        callback(filterForTeacher(merged));
      }, () => {});
    } catch {}

    const handleLocalEvent = () => {
      const current = Array.from(requestsMap.values());
      callback(filterForTeacher(current.length > 0 ? current : getEndorsementRequests()));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ivai_endorsements_updated', handleLocalEvent);
    }

    return () => {
      if (typeof unsubUsers === 'function') unsubUsers();
      if (typeof unsubFs === 'function') unsubFs();
      if (typeof window !== 'undefined') {
        window.removeEventListener('ivai_endorsements_updated', handleLocalEvent);
      }
    };
  } catch (err) {
    console.warn('[Firestore Endorsement Listener] Falha ao assinar:', err.message);
    const local = getEndorsementRequests();
    callback(filterForTeacher(local));
    return () => {};
  }
}

/**
 * Se o aluno já foi recomendado pelo professor, sincroniza e atualiza o status de 'Pendente'
 * para 'Aprovado' no documento do Firestore e no armazenamento local.
 */
export async function syncFulfilledEndorsementRequests(studentId, profUserOrEmail) {
  if (!studentId || !profUserOrEmail) return;
  const sIdStr = String(studentId);

  // 1. Atualiza cache local
  if (typeof localStorage !== 'undefined') {
    const local = getEndorsementRequests();
    let localChanged = false;
    const updatedLocal = local.map(r => {
      if (String(r.studentId) === sIdStr && isSameProfessor(r, profUserOrEmail) && r.status === 'Pendente') {
        localChanged = true;
        return { ...r, status: 'Aprovado' };
      }
      return r;
    });
    if (localChanged) {
      try {
        localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedLocal));
      } catch {}
    }
  }

  // 2. Atualiza documento do estudante no Firestore
  try {
    const sDocRef = doc(db, 'users', sIdStr);
    const sSnap = await getDoc(sDocRef);
    if (sSnap.exists()) {
      const data = sSnap.data();
      const endorsements = data.endorsements || [];
      if (hasTeacherEndorsedStudent(endorsements, profUserOrEmail)) {
        const prevReqs = Array.isArray(data.pendingEndorsementRequests) ? data.pendingEndorsementRequests : [];
        let remoteChanged = false;
        const updatedReqs = prevReqs.map(r => {
          if (isSameProfessor(r, profUserOrEmail) && r.status === 'Pendente') {
            remoteChanged = true;
            return { ...r, status: 'Aprovado' };
          }
          return r;
        });
        if (remoteChanged) {
          await setDoc(sDocRef, {
            pendingEndorsementRequests: deduplicateRequestsByTeacher(updatedReqs)
          }, { merge: true });
        }
      }
    }
  } catch (err) {
    console.warn('[Firestore] syncFulfilledEndorsementRequests:', err.message);
  }
}

/**
 * Escuta solicitações de recomendação enviadas por um aluno específico em tempo real no Firestore
 */
export function subscribeToStudentEndorsementRequests(studentId, callback) {
  if (!studentId) {
    callback([]);
    return () => {};
  }
  const idStr = String(studentId);

  try {
    const usersRef = collection(db, 'users');

    return onSnapshot(usersRef, (snapshot) => {
      const map = new Map();

      // Carrega cache local
      const local = getEndorsementRequests().filter(r => String(r.studentId) === idStr);
      local.forEach(r => map.set(String(r.id), r));

      // 1. Busca requests gravadas no próprio perfil do estudante no Firestore
      const studentDoc = snapshot.docs.find(d => d.id === idStr);
      if (studentDoc && Array.isArray(studentDoc.data().pendingEndorsementRequests)) {
        studentDoc.data().pendingEndorsementRequests.forEach(r => map.set(String(r.id), r));
      }

      // 2. Verifica se algum professor emitiu parecer de aprovação ou recusa
      snapshot.docs.forEach(d => {
        const u = d.data();
        if (Array.isArray(u.endorsementResponses)) {
          u.endorsementResponses.forEach(resp => {
            if (String(resp.studentId) === idStr) {
              const existing = map.get(String(resp.reqId));
              if (existing) {
                map.set(String(resp.reqId), {
                  ...existing,
                  status: resp.status,
                  quote: resp.quote || existing.quote,
                  resolvedAt: resp.date
                });
              }
            }
          });
        }
      });

      const finalRequests = deduplicateRequestsByTeacher(Array.from(map.values()));
      callback(finalRequests);
    }, (err) => {
      console.warn('[Firestore Student Endorsements] Offline fallback:', err.message);
      const local = getEndorsementRequests().filter(r => String(r.studentId) === idStr);
      callback(deduplicateRequestsByTeacher(local));
    });
  } catch (err) {
    console.warn('[Firestore Student Endorsements] Falha ao assinar:', err.message);
    const local = getEndorsementRequests().filter(r => String(r.studentId) === idStr);
    callback(deduplicateRequestsByTeacher(local));
    return () => {};
  }
}

export async function requestTeacherEndorsement(profEmail, profName, discipline, studentUser, targetTeacher = null) {
  const cleanEmail = (profEmail || '').toLowerCase().trim();
  const studentId = studentUser?.uid || studentUser?.id || '';

  if (!cleanEmail || !cleanEmail.includes('@') || !isInstitutionalEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Por favor, informe um e-mail institucional válido do docente (ex: @ifpr.edu.br, @uenp.edu.br, @univale.edu.br, @uel.br, @uem.br, etc).'
    };
  }

  // 1. Localiza professor credenciado para obter UID/ID institucional caso não tenha sido passado
  let resolvedTeacher = targetTeacher;
  if (!resolvedTeacher && cleanEmail) {
    const verified = getVerifiedTeachers();
    resolvedTeacher = verified.find(t =>
      (t.email || '').toLowerCase().trim() === cleanEmail ||
      (profName && t.name && t.name.toLowerCase().trim() === profName.toLowerCase().trim())
    );
  }

  const profUid = resolvedTeacher?.uid || resolvedTeacher?.id || resolvedTeacher?.firestoreId || '';
  const finalProfName = (profName || resolvedTeacher?.name || 'Professor Docente').trim();

  // 2. Impedir solicitação se o aluno já possui recomendação deste professor (Firestore + Local)
  let studentEndorsements = [
    ...(studentUser?.endorsements || [])
  ];
  if (studentId) {
    try {
      const userSnap = await getDoc(doc(db, 'users', String(studentId)));
      if (userSnap.exists()) {
        studentEndorsements = [
          ...studentEndorsements,
          ...(userSnap.data().endorsements || [])
        ];
      }
    } catch {}
    const talent = getTalentById(studentId);
    if (talent?.endorsements) {
      studentEndorsements = [
        ...studentEndorsements,
        ...talent.endorsements
      ];
    }
  }

  if (hasTeacherEndorsedStudent(studentEndorsements, resolvedTeacher || cleanEmail)) {
    return {
      success: false,
      message: `Você já recebeu uma recomendação do professor ${finalProfName} (${cleanEmail}). É permitida apenas uma por professor.`
    };
  }

  // 3. Impedir solicitação duplicada pendente no Firestore e no cache local
  const localRequests = getEndorsementRequests();
  const existingDup = localRequests.find(r =>
    String(r.studentId) === String(studentId) &&
    (isSameProfessor(r, cleanEmail) ||
      (r.profEmail || '').toLowerCase().trim() === cleanEmail ||
      (profUid && String(r.profUid || '') === String(profUid))) &&
    r.status === 'Pendente'
  );
  if (existingDup) {
    return {
      success: false,
      message: `Você já possui uma solicitação pendente aguardando avaliação do professor ${finalProfName}.`
    };
  }

  if (studentId) {
    try {
      const sCheckSnap = await getDoc(doc(db, 'users', String(studentId)));
      if (sCheckSnap.exists()) {
        const remoteList = sCheckSnap.data().pendingEndorsementRequests || [];
        const existingRemoteDup = remoteList.find(r =>
          (isSameProfessor(r, cleanEmail) ||
            (r.profEmail || '').toLowerCase().trim() === cleanEmail ||
            (profUid && String(r.profUid || '') === String(profUid))) &&
          r.status === 'Pendente'
        );
        if (existingRemoteDup) {
          return {
            success: false,
            message: `Você já possui uma solicitação pendente aguardando avaliação do professor ${finalProfName}.`
          };
        }
      }
    } catch {}
  }

  const newReq = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    studentId: String(studentId),
    studentName: studentUser?.name || 'Estudante',
    studentEmail: (studentUser?.email || '').toLowerCase().trim(),
    studentCourse: studentUser?.course || studentUser?.badge || 'Ensino Superior / Técnico',
    studentInstitution: studentUser?.institution || 'IFPR Campus Ivaiporã',
    studentAvatar: studentUser?.avatar || '',
    profEmail: cleanEmail,
    profName: finalProfName,
    profUid: profUid ? String(profUid) : '',
    targetTeacherId: profUid ? String(profUid) : '',
    discipline: (discipline || resolvedTeacher?.discipline || 'Formação Acadêmica').trim(),
    requestedAt: new Date().toLocaleDateString('pt-BR'),
    requestedTimestamp: Date.now(),
    message: `Solicitação de recomendação acadêmica referente à disciplina ${discipline || 'ministrada pelo docente'}.`,
    status: 'Pendente'
  };

  // 4. Salva no documento do estudante na coleção 'users' (Permissão total e sincronização cross-window em tempo real)
  if (studentId) {
    try {
      const studentDocRef = doc(db, 'users', String(studentId));
      const sSnap = await getDoc(studentDocRef);
      const prevReqs = (sSnap.exists() && Array.isArray(sSnap.data().pendingEndorsementRequests))
        ? sSnap.data().pendingEndorsementRequests
        : [];
      
      const filteredPrev = prevReqs.filter(r => {
        if (!r) return false;
        if (r.id === newReq.id) return false;
        if (isSameProfessor(r, cleanEmail)) return false;
        if (cleanEmail && String(r.profEmail || '').toLowerCase().trim() === cleanEmail) return false;
        if (profUid && String(r.profUid || '') === String(profUid)) return false;
        return true;
      });

      const sanitizedMerged = deduplicateRequestsByTeacher([newReq, ...filteredPrev]);

      await setDoc(studentDocRef, {
        pendingEndorsementRequests: sanitizedMerged
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Sync pendingEndorsementRequests to users doc:', err.message);
    }
  }

  // 5. Tenta salvar na coleção 'endorsement_requests' se as regras permitirem
  try {
    const docRef = await addDoc(collection(db, 'endorsement_requests'), newReq);
    newReq.firestoreId = docRef.id;
  } catch {}

  // 6. Atualiza cache local garantindo unicidade
  const local = getEndorsementRequests();
  const filteredLocal = local.filter(r => {
    if (!r) return false;
    if (r.id === newReq.id) return false;
    const sameStudent = String(r.studentId) === String(studentId);
    const sameProf = isSameProfessor(r, cleanEmail) ||
      (cleanEmail && String(r.profEmail || '').toLowerCase().trim() === cleanEmail) ||
      (profUid && String(r.profUid || '') === String(profUid));
    return !(sameStudent && sameProf);
  });
  const updated = [newReq, ...filteredLocal];
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updated));
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_endorsements_updated', { detail: newReq }));
  }

  return {
    success: true,
    message: `Solicitação enviada com sucesso para o professor ${finalProfName} (${cleanEmail})! Ele receberá em seu Painel do Docente.`
  };
}

export async function approveEndorsementRequest(requestId, quote, profUser) {
  let req = null;
  const reqIdStr = String(requestId);
  try {
    const snap = await getDoc(doc(db, 'endorsement_requests', reqIdStr));
    if (snap.exists()) {
      req = { id: snap.id, firestoreId: snap.id, ...snap.data() };
    }
  } catch {}

  if (!req) {
    const requests = getEndorsementRequests();
    req = requests.find(r => r.id === requestId || String(r.id) === reqIdStr || r.firestoreId === requestId);
  }

  if (!req) return { success: false, error: 'Solicitação não encontrada.' };

  const cleanEmail = (req.profEmail || profUser?.email || '').toLowerCase().trim();
  const profUid = profUser?.uid || profUser?.id;

  // 1. Regra estrita: verificar se este professor já recomendou este aluno
  let studentEndorsements = [];
  try {
    const studentSnap = await getDoc(doc(db, 'users', String(req.studentId)));
    if (studentSnap.exists()) {
      studentEndorsements = studentSnap.data().endorsements || [];
    }
  } catch {}

  if (studentEndorsements.length === 0) {
    const talent = getTalentById(req.studentId);
    studentEndorsements = talent?.endorsements || [];
  }

  if (hasTeacherEndorsedStudent(studentEndorsements, profUser || cleanEmail)) {
    const local = getEndorsementRequests();
    const updatedReqs = local.map(r => {
      const isThisStudent = String(r.studentId) === String(req.studentId);
      const isThisProf = isSameProfessor(r, profUser || cleanEmail) ||
        (cleanEmail && String(r.profEmail || '').toLowerCase().trim() === cleanEmail) ||
        (r.id === req.id || r.firestoreId === req.id || String(r.id) === String(reqIdStr));
      return (isThisStudent && isThisProf) ? { ...r, status: 'Aprovado' } : r;
    });
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs)); } catch {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ivai_endorsements_updated'));
    }

    return {
      success: false,
      alreadyEndorsed: true,
      error: `Você já concedeu uma recomendação para este aluno (${req.studentName}). A solicitação pendente foi concluída.`
    };
  }

  const newEndorsement = {
    id: `end_${Date.now()}`,
    profUid: profUid ? String(profUid) : '',
    profName: req.profName || profUser?.name || 'Professor Docente',
    profEmail: cleanEmail,
    institution: profUser?.institution || 'IFPR Campus Ivaiporã',
    discipline: req.discipline || profUser?.discipline || 'Formação Acadêmica',
    quote: quote?.trim() || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio em projetos práticos.',
    isVerified: true,
    date: new Date().toLocaleDateString('pt-BR'),
    timestamp: Date.now()
  };

  // 2. Registra aprovação no documento do próprio professor em 'users' (Permissão total e sync cross-window)
  if (profUid) {
    try {
      const profDocRef = doc(db, 'users', String(profUid));
      await setDoc(profDocRef, {
        endorsementCount: increment(1),
        endorsementResponses: arrayUnion({
          reqId: String(req.id || reqIdStr),
          studentId: String(req.studentId),
          status: 'Aprovado',
          quote: newEndorsement.quote,
          discipline: newEndorsement.discipline,
          date: newEndorsement.date,
          timestamp: Date.now()
        })
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Sync aprovação doc professor:', err.message);
    }
  }

  // 3. Atualiza perfil do aluno com o parecer verificado no Firestore e no cache local
  await addEndorsementToTalent(req.studentId, newEndorsement);

  // 4. Atualiza status no documento do estudante se permissão permitir
  try {
    const sDocRef = doc(db, 'users', String(req.studentId));
    const sSnap = await getDoc(sDocRef);
    if (sSnap.exists()) {
      const sData = sSnap.data();
      const prevReqs = Array.isArray(sData.pendingEndorsementRequests) ? sData.pendingEndorsementRequests : [];
      const updatedReqs = prevReqs.map(r => {
        const matchesProf = isSameProfessor(r, profUser || cleanEmail) ||
          (cleanEmail && String(r.profEmail || '').toLowerCase().trim() === cleanEmail) ||
          (r.id === req.id || String(r.id) === String(reqIdStr));
        return matchesProf ? { ...r, status: 'Aprovado', quote: newEndorsement.quote, resolvedAt: newEndorsement.date } : r;
      });
      await setDoc(sDocRef, {
        pendingEndorsementRequests: deduplicateRequestsByTeacher(updatedReqs),
        endorsements: arrayUnion(newEndorsement),
        isVerifiedStudent: true
      }, { merge: true });
    }
  } catch {}

  // 5. Tenta atualizar 'endorsement_requests' caso exista
  const targetDocId = req.firestoreId || req.id;
  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', String(targetDocId)), {
        status: 'Aprovado',
        approvedAt: new Date().toISOString(),
        quote: newEndorsement.quote,
        endorsementId: newEndorsement.id
      });
    } catch {}
  }

  // 6. Atualiza cache local garantindo que todas as duplicatas sejam marcadas como Aprovadas
  const local = getEndorsementRequests();
  const updatedReqs = local.map(r => {
    const isThisStudent = String(r.studentId) === String(req.studentId);
    const matchesProf = isSameProfessor(r, profUser || cleanEmail) ||
      (cleanEmail && String(r.profEmail || '').toLowerCase().trim() === cleanEmail) ||
      (r.id === req.id || r.firestoreId === req.id || String(r.id) === String(targetDocId));
    return (isThisStudent && matchesProf) ? { ...r, status: 'Aprovado', quote: newEndorsement.quote } : r;
  });
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs));
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_endorsements_updated'));
  }

  return { success: true, endorsement: newEndorsement };
}

export async function rejectEndorsementRequest(requestId, profUser = null) {
  const targetDocId = String(requestId);
  const profUid = profUser?.uid || profUser?.id;

  let req = null;
  const requests = getEndorsementRequests();
  req = requests.find(r => String(r.id) === targetDocId || r.firestoreId === targetDocId);

  if (profUid) {
    try {
      await setDoc(doc(db, 'users', String(profUid)), {
        endorsementResponses: arrayUnion({
          reqId: targetDocId,
          studentId: req?.studentId ? String(req.studentId) : '',
          status: 'Recusado',
          date: new Date().toLocaleDateString('pt-BR'),
          timestamp: Date.now()
        })
      }, { merge: true });
    } catch {}
  }

  // Atualiza também documento do estudante no Firestore se soubermos quem é
  if (req?.studentId) {
    try {
      const sDocRef = doc(db, 'users', String(req.studentId));
      const sSnap = await getDoc(sDocRef);
      if (sSnap.exists()) {
        const prevReqs = Array.isArray(sSnap.data().pendingEndorsementRequests) ? sSnap.data().pendingEndorsementRequests : [];
        const updatedReqs = prevReqs.map(r => {
          const matchesProf = isSameProfessor(r, profUser) || (String(r.id) === targetDocId);
          return matchesProf ? { ...r, status: 'Recusado' } : r;
        });
        await setDoc(sDocRef, {
          pendingEndorsementRequests: deduplicateRequestsByTeacher(updatedReqs)
        }, { merge: true });
      }
    } catch {}
  }

  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', targetDocId), {
        status: 'Recusado',
        rejectedAt: new Date().toISOString()
      });
    } catch {}
  }

  const updatedReqs = requests.map(r => {
    const isTarget = String(r.id) === targetDocId || r.firestoreId === targetDocId ||
      (req && String(r.studentId) === String(req.studentId) && isSameProfessor(r, profUser));
    return isTarget ? { ...r, status: 'Recusado' } : r;
  });
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs));
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_endorsements_updated'));
  }
  return { success: true };
}

export function updateTalentProfile(talentId, updatedData) {
  const talents = getTalents('Todas as Cidades');
  let found = false;
  const updated = talents.map(t => {
    if (t.id === Number(talentId) || t.id === talentId || String(t.id) === String(talentId) || t.firestoreId === talentId) {
      found = true;
      return { ...t, ...updatedData };
    }
    return t;
  });

  if (!found) {
    updated.push({ id: talentId, ...updatedData });
  }

  localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(updated));

  if (typeof localStorage !== 'undefined') {
    const rawAuth = localStorage.getItem('ivai_conecta_auth_user');
    if (rawAuth) {
      try {
        const auth = JSON.parse(rawAuth);
        if (auth && (String(auth.id) === String(talentId) || String(auth.uid) === String(talentId) || auth.email === updatedData.email)) {
          const updatedAuth = { ...auth, ...updatedData };
          localStorage.setItem('ivai_conecta_auth_user', JSON.stringify(updatedAuth));
        }
      } catch {}
    }
  }

  // Sync imediato com Firestore na coleção 'users'
  try {
    const docRef = doc(db, 'users', String(talentId));
    setDoc(docRef, {
      ...updatedData,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(err => console.warn('[Firestore] Sync erro updateTalentProfile:', err.message));
  } catch {}

  return updated;
}

export async function addEndorsementToTalent(talentId, endorsement) {
  const idStr = String(talentId);
  if (!idStr || !endorsement) return false;

  // 1. Busca os pareceres atuais do aluno para deduplicação estrita (Firestore + Local)
  let existingEndorsements = [];
  try {
    const userSnap = await getDoc(doc(db, 'users', idStr));
    if (userSnap.exists()) {
      existingEndorsements = userSnap.data().endorsements || [];
    }
  } catch (err) {
    console.warn('[Firestore] Leitura prévia de endorsements:', err.message);
  }

  if (existingEndorsements.length === 0) {
    const talent = getTalentById(idStr);
    if (talent?.endorsements) {
      existingEndorsements = talent.endorsements;
    }
  }

  // Garante que o professor só tenha UMA recomendação para este aluno (substitui caso já exista)
  const filtered = existingEndorsements.filter(e => !isSameProfessor(e, endorsement));
  const updatedEndorsements = sanitizeUniqueEndorsements([endorsement, ...filtered]);

  // 2. Atualiza no Firestore coleção 'users' com a lista limpa e contagem correta
  try {
    const userDocRef = doc(db, 'users', idStr);
    await setDoc(userDocRef, {
      endorsements: updatedEndorsements,
      endorsementCount: updatedEndorsements.length,
      isVerifiedStudent: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync erro addEndorsementToTalent (users):', err.message);
  }

  // 3. Atualiza no Firestore coleção 'talents' caso exista
  try {
    const talentDocRef = doc(db, 'talents', idStr);
    await setDoc(talentDocRef, {
      endorsements: updatedEndorsements,
      endorsementCount: updatedEndorsements.length,
      isVerifiedStudent: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch {}

  // 4. Atualiza cache local de talentos com os dados limpos
  updateTalentProfile(idStr, {
    endorsements: updatedEndorsements,
    endorsementCount: updatedEndorsements.length,
    isVerifiedStudent: true
  });

  // 5. Emite evento global para que qualquer componente em escuta atualize
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_talent_endorsed', { detail: { talentId: idStr, endorsement, endorsements: updatedEndorsements } }));
  }

  return true;
}

export function validateEndorsement(profEmail, profName) {
  if (!profEmail || !profEmail.includes('@')) return { valid: false, error: 'Insira um e-mail educacional válido (@ifpr.edu.br, @uenp.edu.br, @univale.edu.br)' };
  if (!profName || profName.trim().length < 3) return { valid: false, error: 'O nome do professor deve ter no mínimo 3 caracteres.' };
  return { valid: true };
}

export function createEndorsementPayload(data) {
  return {
    id: `end_${Date.now()}`,
    profName: data.profName,
    profEmail: data.profEmail,
    institution: data.institution || 'IFPR Campus Ivaiporã',
    discipline: data.discipline || 'Desenvolvimento de Software',
    quote: data.quote || 'Excelente desempenho acadêmico e dedicação aos projetos práticos.',
    isVerified: true,
  };
}

export function requestRecommendation(profEmail, profName, discipline, studentUser) {
  return requestTeacherEndorsement(profEmail, profName, discipline, studentUser);
}
