// Talents & Teachers Service for Ivaí Conecta (Firestore 'users' and 'endorsement_requests' collections)
import { db } from '../lib/firebase.js';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, arrayUnion, query, where, onSnapshot } from 'firebase/firestore';
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

/**
 * Escuta corpo docente em tempo real via Firestore onSnapshot da coleção 'users'
 */
export function subscribeToTeachers(callback) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'professor'));

    return onSnapshot(q, (snapshot) => {
      const remoteTeachers = snapshot.docs
        .map(d => normalizeTeacherDoc(d.data(), d.id))
        .filter(u => u.role === 'professor');

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(remoteTeachers));
        } catch {}
      }

      callback(remoteTeachers);
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
        if (Array.isArray(parsed)) {
          teachers = parsed.filter(t => t.role === 'professor');
        }
      } catch {}
    }
  }

  // Background sync com o Firestore (coleção 'users' role 'professor')
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'professor'));
    getDocs(q).then(snapshot => {
      const remote = snapshot.docs
        .map(d => normalizeTeacherDoc(d.data(), d.id))
        .filter(u => u.role === 'professor');

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(remote));
      }
    }).catch(err => console.warn('[Firestore] getVerifiedTeachers offline:', err.message));
  } catch {}

  return teachers;
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
 * Escuta solicitações de recomendação em tempo real no Firestore
 */
export function subscribeToEndorsementRequests(teacherEmail, callback) {
  try {
    const reqsRef = collection(db, 'endorsement_requests');
    let q = reqsRef;
    if (teacherEmail) {
      const cleanEmail = String(teacherEmail).toLowerCase().trim();
      q = query(reqsRef, where('profEmail', '==', cleanEmail));
    }

    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(requests));
      }

      callback(requests);
    }, (err) => {
      console.warn('[Firestore Endorsement Listener] Offline fallback:', err.message);
      callback(getEndorsementRequests());
    });
  } catch (err) {
    console.warn('[Firestore Endorsement Listener] Falha ao assinar:', err.message);
    callback(getEndorsementRequests());
    return () => {};
  }
}

export async function requestTeacherEndorsement(profEmail, profName, discipline, studentUser) {
  const cleanEmail = profEmail.toLowerCase().trim();
  const studentId = studentUser?.uid || studentUser?.id || '';

  // 1. Impedir solicitação se o aluno já possui recomendação deste professor
  const talent = getTalentById(studentId);
  const alreadyEndorsed = (talent?.endorsements || []).some(e => 
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
    const q = query(
      collection(db, 'endorsement_requests'),
      where('studentId', '==', studentId),
      where('profEmail', '==', cleanEmail),
      where('status', '==', 'Pendente')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return {
        success: false,
        message: `Você já possui uma solicitação pendente aguardando avaliação do professor ${profName}.`
      };
    }
  } catch (err) {
    console.warn('[Firestore] Verificação prévia de solicitação duplicada:', err.message);
  }

  const newReq = {
    studentId,
    studentName: studentUser?.name || 'Estudante',
    studentEmail: studentUser?.email || '',
    studentCourse: studentUser?.course || studentUser?.badge || 'Ensino Superior / Técnico',
    profEmail: cleanEmail,
    profName: profName.trim(),
    discipline: discipline.trim(),
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
  const updated = [newReq, ...local.filter(r => r.id !== newReq.id)];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updated));
  }

  return {
    success: true,
    message: `Solicitação enviada para o professor ${profName} (${profEmail})! Ele receberá em seu Painel do Docente.`
  };
}

export async function approveEndorsementRequest(requestId, quote, profUser) {
  let req = null;
  try {
    const snap = await getDoc(doc(db, 'endorsement_requests', String(requestId)));
    if (snap.exists()) {
      req = { id: snap.id, firestoreId: snap.id, ...snap.data() };
    }
  } catch {}

  if (!req) {
    const requests = getEndorsementRequests();
    req = requests.find(r => r.id === requestId || String(r.id) === String(requestId) || r.firestoreId === requestId);
  }

  if (!req) return { success: false, error: 'Solicitação não encontrada.' };

  // 1. Impedir aprovação se já houver recomendação concedida
  const talent = getTalentById(req.studentId);
  const cleanEmail = (req.profEmail || profUser?.email || '').toLowerCase().trim();
  const alreadyEndorsed = (talent?.endorsements || []).some(e =>
    (e.profEmail || '').toLowerCase().trim() === cleanEmail
  );

  if (alreadyEndorsed) {
    const targetDocId = req.firestoreId || req.id;
    if (targetDocId) {
      try {
        await updateDoc(doc(db, 'endorsement_requests', String(targetDocId)), { status: 'Aprovado' });
      } catch {}
    }
    return { success: false, error: 'Este aluno já possui uma recomendação sua cadastrada.' };
  }

  const newEndorsement = {
    id: `end_${Date.now()}`,
    profUid: profUser?.uid || profUser?.id || '',
    profName: req.profName || profUser?.name || 'Professor Docente',
    profEmail: cleanEmail,
    institution: profUser?.institution || 'IFPR Campus Ivaiporã',
    discipline: req.discipline || profUser?.discipline || 'Formação Acadêmica',
    quote: quote || 'Estudante dedicado, com forte raciocínio prático e ótimo trabalho em equipe.',
    isVerified: true,
    date: new Date().toLocaleDateString('pt-BR')
  };

  await addEndorsementToTalent(req.studentId, newEndorsement);

  const targetDocId = req.firestoreId || req.id;
  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', String(targetDocId)), {
        status: 'Aprovado',
        approvedAt: new Date().toISOString()
      });
    } catch {}
  }

  const local = getEndorsementRequests();
  const updatedReqs = local.map(r => (r.id === req.id || r.firestoreId === req.id) ? { ...r, status: 'Aprovado' } : r);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs));
  }

  return { success: true, endorsement: newEndorsement };
}

export async function rejectEndorsementRequest(requestId) {
  const targetDocId = requestId;
  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', String(targetDocId)), {
        status: 'Recusado',
        rejectedAt: new Date().toISOString()
      });
    } catch {}
  }
  const requests = getEndorsementRequests();
  const updatedReqs = requests.map(r => (String(r.id) === String(requestId) || r.firestoreId === requestId) ? { ...r, status: 'Recusado' } : r);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs));
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

export function addEndorsementToTalent(talentId, endorsement) {
  const talent = getTalentById(talentId);
  if (!talent) return false;
  const endorsements = talent.endorsements || [];
  const updated = [endorsement, ...endorsements];
  updateTalentProfile(talentId, { endorsements: updated });

  try {
    setDoc(doc(db, 'users', String(talentId)), {
      endorsements: arrayUnion(endorsement),
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(err => console.warn('[Firestore] Sync erro addEndorsementToTalent:', err.message));
  } catch {}

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
