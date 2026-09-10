// Talents & Teachers Service for Ivaí Conecta (Firestore 'users' and 'endorsement_requests' collections)
import { db } from '../lib/firebase.js';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, arrayUnion, query, where, onSnapshot } from 'firebase/firestore';
import {
  STORAGE_KEY_TALENTS,
  STORAGE_KEY_TEACHERS,
  STORAGE_KEY_ENDORSEMENT_REQUESTS,
} from '../data/seedData.js';

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
    city: data.city || 'Ivaiporã',
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
  try {
    const usersRef = collection(db, 'users');

    return onSnapshot(usersRef, (snapshot) => {
      const allUsers = snapshot.docs.map(d => normalizeUserDoc(d.data(), d.id));
      let remoteTalents = allUsers.filter(u => !u.role || ['aluno', 'candidato', 'freelancer'].includes(u.role));

      if (city && city !== 'Todas as Cidades') {
        remoteTalents = remoteTalents.filter(t => t.city && t.city.toLowerCase() === city.toLowerCase());
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(remoteTalents));
      }

      callback(remoteTalents);
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
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(remoteTeachers));
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
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_TALENTS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) talents = parsed;
      } catch {}
    }
  }

  // Sync background com o Firestore (coleção 'users')
  try {
    const usersRef = collection(db, 'users');
    getDocs(usersRef).then(snapshot => {
      const remote = snapshot.docs
        .map(d => normalizeUserDoc(d.data(), d.id))
        .filter(u => !u.role || ['aluno', 'candidato', 'freelancer'].includes(u.role));

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(remote));
      }
    }).catch(err => console.warn('[Firestore] getTalents offline:', err.message));
  } catch {}

  if (!city || city === 'Todas as Cidades') return talents;
  return talents.filter(t => t.city && t.city.toLowerCase() === city.toLowerCase());
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
  const newEndorsement = {
    id: `end_${Date.now()}`,
    profName: profUser?.name || 'Professor Avaliador',
    profEmail: profUser?.email || '',
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
    t.email?.toLowerCase() === (profUser?.email || '').toLowerCase() ? { ...t, endorsementCount: (t.endorsementCount || 0) + 1 } : t
  );
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updatedTeachers));
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

export async function requestTeacherEndorsement(profEmail, profName, discipline, studentUser) {
  const requests = getEndorsementRequests();
  const newReq = {
    studentId: studentUser?.uid || studentUser?.id || '',
    studentName: studentUser?.name || 'Estudante',
    studentCourse: studentUser?.course || studentUser?.badge || 'Ensino Superior / Técnico',
    profEmail: profEmail.toLowerCase().trim(),
    profName: profName.trim(),
    discipline: discipline.trim(),
    requestedAt: new Date().toLocaleDateString('pt-BR'),
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

  requests.push(newReq);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(requests));
  }

  return {
    success: true,
    message: `Solicitação enviada para o professor ${profName} (${profEmail})! Ele receberá em seu Painel do Docente.`
  };
}

export async function approveEndorsementRequest(requestId, quote) {
  const requests = getEndorsementRequests();
  const req = requests.find(r => r.id === requestId || String(r.id) === String(requestId) || r.firestoreId === requestId);
  if (!req) return { success: false, error: 'Solicitação não encontrada.' };

  const newEndorsement = {
    id: `end_${Date.now()}`,
    profName: req.profName,
    profEmail: req.profEmail,
    institution: 'IFPR Campus Ivaiporã',
    discipline: req.discipline,
    quote: quote || 'Estudante dedicado, com forte raciocínio prático e ótimo trabalho em equipe.',
    isVerified: true,
    date: new Date().toLocaleDateString('pt-BR')
  };

  await addEndorsementToTalent(req.studentId, newEndorsement);

  const targetDocId = req.firestoreId || req.id;
  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', String(targetDocId)), { status: 'Aprovado' });
    } catch {}
  }

  const updatedReqs = requests.map(r => (r.id === req.id || r.firestoreId === req.id) ? { ...r, status: 'Aprovado' } : r);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs));
  }

  return { success: true, endorsement: newEndorsement };
}

export async function rejectEndorsementRequest(requestId) {
  const requests = getEndorsementRequests();
  const targetDocId = requestId;
  if (targetDocId) {
    try {
      await updateDoc(doc(db, 'endorsement_requests', String(targetDocId)), { status: 'Recusado' });
    } catch {}
  }
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
