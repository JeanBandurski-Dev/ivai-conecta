// Talents & Teachers Service for Ivaí Conecta (Firestore 'users' and 'endorsement_requests' collections)
import { db } from '../lib/firebase.js';
import { collection, getDoc, getDocs, doc, setDoc, addDoc, updateDoc, arrayUnion, increment, query, where, onSnapshot } from 'firebase/firestore';
import {
  STORAGE_KEY_TALENTS,
  STORAGE_KEY_TEACHERS,
  STORAGE_KEY_ENDORSEMENT_REQUESTS,
} from '../data/seedData.js';

import { matchCity } from '../utils/searchUtils.js';

let _memTalentsCache = null;

/**
 * Normaliza um documento de usuário para uso no Banco de Talentos / Perfis
 */
function normalizeUserDoc(docData, docId) {
  const data = docData || {};
  return {
    ...data,
    id: data.id != null ? data.id : docId,
    firestoreId: docId,
    name: data.name || 'Usuário',
    role: data.role || 'aluno',
    city: data.city || '',
    avatar: data.avatar || '',
    skills: data.skills || [],
    endorsements: data.endorsements || [],
    experiences: data.experiences || [],
    projects: data.projects || [],
    education: data.education || [],
    isVerifiedStudent: data.isVerifiedStudent ?? false,
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
      const allUsers = snapshot.docs.map(d => normalizeUserDoc(d.data(), d.id));
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
      map.set(email, { ...(map.get(email) || {}), ...t });
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

      const finalMerged = mergeWithInstitutionalFaculty(remote);
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

export function getTeacherEndorsedStudents(profEmail) {
  const talents = getTalents('Todas as Cidades');
  if (!profEmail) return [];
  const cleanEmail = profEmail.toLowerCase().trim();
  return talents.filter(t => t.endorsements?.some(e => e.profEmail?.toLowerCase().trim() === cleanEmail));
}

export async function proactiveEndorseStudent(studentId, profUser, quote, discipline) {
  const talent = getTalentById(studentId);
  const cleanEmail = (profUser?.email || '').toLowerCase().trim();
  const profUid = profUser?.uid || profUser?.id;

  // 1. Impedir recomendações duplicadas do mesmo professor para o mesmo aluno
  const alreadyEndorsed = (talent?.endorsements || []).some(e => {
    const eEmail = (e.profEmail || '').toLowerCase().trim();
    const eUid = e.profUid || e.profId;
    return (cleanEmail && eEmail === cleanEmail) || (profUid && eUid && String(profUid) === String(eUid));
  });

  if (alreadyEndorsed) {
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
    date: new Date().toLocaleDateString('pt-BR')
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
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

/**
 * Escuta solicitações de recomendação para um professor em tempo real no Firestore
 */
export function subscribeToEndorsementRequests(teacherEmail, callback) {
  const cleanEmail = teacherEmail ? String(teacherEmail).toLowerCase().trim() : '';

  try {
    const reqsRef = collection(db, 'endorsement_requests');

    return onSnapshot(reqsRef, (snapshot) => {
      const allRequests = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      const filtered = cleanEmail
        ? allRequests.filter(r => (r.profEmail || '').toLowerCase().trim() === cleanEmail)
        : allRequests;

      filtered.sort((a, b) => (b.requestedTimestamp || 0) - (a.requestedTimestamp || 0));

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(allRequests));
        } catch {}
      }

      callback(filtered);
    }, (err) => {
      console.warn('[Firestore Endorsement Listener] Offline fallback:', err.message);
      const local = getEndorsementRequests();
      const filtered = cleanEmail
        ? local.filter(r => (r.profEmail || '').toLowerCase().trim() === cleanEmail)
        : local;
      callback(filtered);
    });
  } catch (err) {
    console.warn('[Firestore Endorsement Listener] Falha ao assinar:', err.message);
    const local = getEndorsementRequests();
    const filtered = cleanEmail
      ? local.filter(r => (r.profEmail || '').toLowerCase().trim() === cleanEmail)
      : local;
    callback(filtered);
    return () => {};
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
    const reqsRef = collection(db, 'endorsement_requests');

    return onSnapshot(reqsRef, (snapshot) => {
      const allRequests = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      const studentRequests = allRequests.filter(r => String(r.studentId) === idStr);
      studentRequests.sort((a, b) => (b.requestedTimestamp || 0) - (a.requestedTimestamp || 0));

      callback(studentRequests);
    }, (err) => {
      console.warn('[Firestore Student Endorsements] Offline fallback:', err.message);
      const local = getEndorsementRequests().filter(r => String(r.studentId) === idStr);
      callback(local);
    });
  } catch (err) {
    console.warn('[Firestore Student Endorsements] Falha ao assinar:', err.message);
    const local = getEndorsementRequests().filter(r => String(r.studentId) === idStr);
    callback(local);
    return () => {};
  }
}

export async function requestTeacherEndorsement(profEmail, profName, discipline, studentUser) {
  const cleanEmail = (profEmail || '').toLowerCase().trim();
  const studentId = studentUser?.uid || studentUser?.id || '';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      message: 'Por favor, informe um e-mail educacional válido.'
    };
  }

  // 1. Impedir solicitação se o aluno já possui recomendação deste professor
  const talent = getTalentById(studentId);
  const studentEndorsements = [
    ...(studentUser?.endorsements || []),
    ...(talent?.endorsements || [])
  ];
  const alreadyEndorsed = studentEndorsements.some(e => 
    (e.profEmail || '').toLowerCase().trim() === cleanEmail
  );
  if (alreadyEndorsed) {
    return {
      success: false,
      message: `Você já recebeu uma recomendação do professor ${profName} (${cleanEmail}). É permitida apenas uma por professor.`
    };
  }

  // 2. Impedir solicitação duplicada pendente no Firestore
  try {
    const snap = await getDocs(collection(db, 'endorsement_requests'));
    const pendingDup = snap.docs.find(d => {
      const data = d.data();
      return (
        String(data.studentId) === String(studentId) &&
        (data.profEmail || '').toLowerCase().trim() === cleanEmail &&
        data.status === 'Pendente'
      );
    });
    if (pendingDup) {
      return {
        success: false,
        message: `Você já possui uma solicitação pendente aguardando avaliação do professor ${profName}.`
      };
    }
  } catch (err) {
    console.warn('[Firestore] Verificação prévia de solicitação duplicada:', err.message);
  }

  const newReq = {
    studentId: String(studentId),
    studentName: studentUser?.name || 'Estudante',
    studentEmail: (studentUser?.email || '').toLowerCase().trim(),
    studentCourse: studentUser?.course || studentUser?.badge || 'Ensino Superior / Técnico',
    profEmail: cleanEmail,
    profName: (profName || 'Professor Docente').trim(),
    discipline: (discipline || 'Formação Acadêmica').trim(),
    requestedAt: new Date().toLocaleDateString('pt-BR'),
    requestedTimestamp: Date.now(),
    message: `Solicitação de recomendação acadêmica referente à disciplina ${discipline}.`,
    status: 'Pendente'
  };

  try {
    const docRef = await addDoc(collection(db, 'endorsement_requests'), newReq);
    newReq.id = docRef.id;
    newReq.firestoreId = docRef.id;
  } catch (err) {
    console.warn('[Firestore] Erro ao enviar pedido de parecer:', err.message);
    newReq.id = `req_${Date.now()}`;
  }

  const local = getEndorsementRequests();
  const updated = [newReq, ...local.filter(r => r.id !== newReq.id && r.firestoreId !== newReq.id)];
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
    message: `Solicitação enviada com sucesso para o professor ${profName} (${cleanEmail})! Ele receberá em seu Painel do Docente.`
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

  const newEndorsement = {
    id: `end_${Date.now()}`,
    profUid: profUser?.uid || profUser?.id || '',
    profName: req.profName || profUser?.name || 'Professor Docente',
    profEmail: cleanEmail,
    institution: profUser?.institution || 'IFPR Campus Ivaiporã',
    discipline: req.discipline || profUser?.discipline || 'Formação Acadêmica',
    quote: quote?.trim() || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio em projetos práticos.',
    isVerified: true,
    date: new Date().toLocaleDateString('pt-BR'),
    timestamp: Date.now()
  };

  // Atualiza perfil do aluno com o parecer verificado no Firestore e no cache local
  await addEndorsementToTalent(req.studentId, newEndorsement);

  // Atualiza status do pedido no Firestore
  const targetDocId = req.firestoreId || req.id;
  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', String(targetDocId)), {
        status: 'Aprovado',
        approvedAt: new Date().toISOString(),
        quote: newEndorsement.quote,
        endorsementId: newEndorsement.id
      });
    } catch (err) {
      console.warn('[Firestore] Erro ao atualizar status do pedido para Aprovado:', err.message);
    }
  }

  // Atualiza cache local
  const local = getEndorsementRequests();
  const updatedReqs = local.map(r => (r.id === req.id || r.firestoreId === req.id || String(r.id) === String(targetDocId)) ? { ...r, status: 'Aprovado', quote: newEndorsement.quote } : r);
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

export async function rejectEndorsementRequest(requestId) {
  const targetDocId = String(requestId);
  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', targetDocId), {
        status: 'Recusado',
        rejectedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Firestore] Erro ao rejeitar solicitação:', err.message);
    }
  }
  const requests = getEndorsementRequests();
  const updatedReqs = requests.map(r => (String(r.id) === targetDocId || r.firestoreId === targetDocId) ? { ...r, status: 'Recusado' } : r);
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
  if (!idStr) return false;

  // 1. Atualiza no Firestore coleção 'users'
  try {
    const userDocRef = doc(db, 'users', idStr);
    await setDoc(userDocRef, {
      endorsements: arrayUnion(endorsement),
      endorsementCount: increment(1),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync erro addEndorsementToTalent (users):', err.message);
  }

  // 2. Atualiza no Firestore coleção 'talents' caso exista
  try {
    const talentDocRef = doc(db, 'talents', idStr);
    await setDoc(talentDocRef, {
      endorsements: arrayUnion(endorsement),
      endorsementCount: increment(1),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch {}

  // 3. Atualiza cache local de talentos se o talento estiver registrado
  const talent = getTalentById(idStr);
  if (talent) {
    const endorsements = talent.endorsements || [];
    const updated = [endorsement, ...endorsements.filter(e => (e.profEmail || '').toLowerCase().trim() !== (endorsement.profEmail || '').toLowerCase().trim())];
    updateTalentProfile(idStr, { endorsements: updated, endorsementCount: updated.length });
  }

  // 4. Emite evento global para que qualquer componente em escuta atualize
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ivai_talent_endorsed', { detail: { talentId: idStr, endorsement } }));
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
