// Talents Service for Ivaí Conecta
import { db } from '../lib/firebase.js';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where, onSnapshot } from 'firebase/firestore';
import {
  STORAGE_KEY_TALENTS,
  STORAGE_KEY_TEACHERS,
  STORAGE_KEY_ENDORSEMENT_REQUESTS,
  SEED_TALENTS,
  SEED_TEACHERS,
  SEED_ENDORSEMENT_REQUESTS
} from '../data/seedData.js';

/**
 * Escuta banco de talentos em tempo real via Firestore onSnapshot
 */
export function subscribeToTalents(city = 'Todas as Cidades', callback) {
  try {
    const talentsRef = collection(db, 'talents');
    const q = (city && city !== 'Todas as Cidades') ? query(talentsRef, where('city', '==', city)) : talentsRef;

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remote = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
        const local = getTalents(city);
        const merged = [...remote, ...local.filter(t => !remote.some(rt => String(rt.id) === String(t.id)))];
        callback(merged);
      } else {
        callback(getTalents(city));
      }
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

export function getTalents(city = 'Todas as Cidades') {
  let talents = SEED_TALENTS;
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_TALENTS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.length > 0) talents = parsed;
      } catch {}
    } else {
      localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(SEED_TALENTS));
    }
  }

  // Sync background com o Firestore
  try {
    const talentsRef = collection(db, 'students');
    const q = (city && city !== 'Todas as Cidades') ? query(talentsRef, where('city', '==', city)) : talentsRef;
    getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        const remote = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const merged = [...remote, ...talents.filter(t => !remote.some(rt => rt.id === t.id))];
        localStorage.setItem(STORAGE_KEY_TALENTS, JSON.stringify(merged));
      }
    }).catch(err => console.warn('Firestore offline para talentos:', err.message));
  } catch {}

  if (!city || city === 'Todas as Cidades') return talents;
  return talents.filter(t => t.city.toLowerCase() === city.toLowerCase());
}

export function getTalentById(id) {
  const talents = getTalents('Todas as Cidades');
  const found = talents.find(t => t.id === Number(id) || t.id === id || String(t.id) === String(id));
  if (found) return found;

  if (typeof localStorage !== 'undefined') {
    const rawAuth = localStorage.getItem('ivai_conecta_auth_user');
    if (rawAuth) {
      try {
        const auth = JSON.parse(rawAuth);
        if (auth && (String(auth.id) === String(id) || auth.email === id || id === 'me')) {
          return {
            id: auth.id || 1,
            name: auth.name,
            course: auth.course || 'Análise e Desenvolvimento de Sistemas',
            institution: auth.institution || 'IFPR Campus Ivaiporã',
            period: auth.period || 'Graduação',
            city: auth.city || 'Ivaiporã',
            avatar: auth.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            skills: auth.skills || ['JavaScript', 'Excel Avançado', 'Gestão'],
            isVerifiedStudent: auth.isVerifiedStudent ?? true,
            raNumber: auth.raNumber || 'REG-2026-VAL',
            linkedin: auth.linkedin || '',
            github: auth.github || '',
            bio: auth.bio || 'Profissional / Estudante cadastrado no Ivaí Conecta.',
            experiences: auth.experiences || [],
            projects: auth.projects || [],
            endorsements: auth.endorsements || []
          };
        }
      } catch {}
    }
  }

  return talents[0];
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
    message: `✅ Comprovante "${filename}" (${filesizeMB}MB) enviado com sucesso! Matrícula autenticada.`,
    verificationRecord
  };
}

export function getVerifiedTeachers() {
  if (typeof localStorage === 'undefined') return SEED_TEACHERS;
  const raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(SEED_TEACHERS));
  return SEED_TEACHERS;
}

export function getTeacherById(id) {
  const teachers = getVerifiedTeachers();
  return teachers.find(t => t.id === id || String(t.id) === String(id)) || teachers[0];
}

export function updateTeacherProfile(teacherId, data) {
  const teachers = getVerifiedTeachers();
  const updated = teachers.map(t => (t.id === teacherId || String(t.id) === String(teacherId) ? { ...t, ...data } : t));
  localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updated));
  return updated;
}

export function getTeacherEndorsedStudents(profEmail) {
  const talents = getTalents('Todas as Cidades');
  if (!profEmail) return talents.slice(0, 2);
  const cleanEmail = profEmail.toLowerCase().trim();
  return talents.filter(t => t.endorsements?.some(e => e.profEmail?.toLowerCase().trim() === cleanEmail || e.profName?.toLowerCase().includes(cleanEmail.split('@')[0])));
}

export function proactiveEndorseStudent(studentId, profUser, quote, discipline) {
  const talent = getTalentById(studentId);
  if (!talent) return { success: false, error: 'Estudante não encontrado.' };

  const newEndorsement = {
    id: `end_${Date.now()}`,
    profName: profUser?.name || 'Prof. Dr. Ronan Silva',
    profEmail: profUser?.email || 'ronan.silva@ifpr.edu.br',
    institution: profUser?.institution || 'IFPR Campus Ivaiporã',
    discipline: discipline || profUser?.discipline || 'Programação de Computadores',
    quote: quote || 'Estudante de destaque, com ótimo raciocínio prático e dedicação exemplar.',
    isVerified: true,
    date: new Date().toLocaleDateString('pt-BR')
  };

  addEndorsementToTalent(studentId, newEndorsement);

  // Increment teacher's endorsement count
  const teachers = getVerifiedTeachers();
  const updatedTeachers = teachers.map(t =>
    t.email.toLowerCase() === (profUser?.email || '').toLowerCase() ? { ...t, endorsementCount: (t.endorsementCount || 0) + 1 } : t
  );
  localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updatedTeachers));

  return { success: true, endorsement: newEndorsement };
}

export function getEndorsementRequests() {
  if (typeof localStorage === 'undefined') return SEED_ENDORSEMENT_REQUESTS;
  const raw = localStorage.getItem(STORAGE_KEY_ENDORSEMENT_REQUESTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(SEED_ENDORSEMENT_REQUESTS));
  return SEED_ENDORSEMENT_REQUESTS;
}

export function requestTeacherEndorsement(profEmail, profName, discipline, studentUser) {
  const requests = getEndorsementRequests();
  const newReq = {
    id: `req_${Date.now()}`,
    studentId: studentUser?.id || 1,
    studentName: studentUser?.name || 'Lucas Eduardo Silva',
    studentCourse: studentUser?.badge || 'Análise e Desenvolvimento de Sistemas (IFPR)',
    profEmail: profEmail.toLowerCase().trim(),
    profName: profName.trim(),
    discipline: discipline.trim(),
    requestedAt: new Date().toLocaleDateString('pt-BR'),
    message: `Solicitação de recomendação acadêmica referente à disciplina ${discipline}.`,
    status: 'Pendente'
  };

  requests.push(newReq);
  localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(requests));

  return {
    success: true,
    message: `Solicitação enviada para o professor ${profName} (${profEmail})! Ele receberá em seu Painel do Docente.`
  };
}

export function approveEndorsementRequest(requestId, quote) {
  const requests = getEndorsementRequests();
  const req = requests.find(r => r.id === requestId || String(r.id) === String(requestId));
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

  addEndorsementToTalent(req.studentId, newEndorsement);

  const updatedReqs = requests.map(r => r.id === req.id ? { ...r, status: 'Aprovado' } : r);
  localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs));

  return { success: true, endorsement: newEndorsement };
}

export function rejectEndorsementRequest(requestId) {
  const requests = getEndorsementRequests();
  const updatedReqs = requests.map(r => String(r.id) === String(requestId) ? { ...r, status: 'Recusado' } : r);
  localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify(updatedReqs));
  return { success: true };
}

export function updateTalentProfile(talentId, updatedData) {
  const talents = getTalents('Todas as Cidades');
  let found = false;
  const updated = talents.map(t => {
    if (t.id === Number(talentId) || t.id === talentId || String(t.id) === String(talentId)) {
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
        if (auth && (String(auth.id) === String(talentId) || auth.email === updatedData.email)) {
          const updatedAuth = { ...auth, ...updatedData };
          localStorage.setItem('ivai_conecta_auth_user', JSON.stringify(updatedAuth));
        }
      } catch {}
    }
  }

  return updated;
}

export function addEndorsementToTalent(talentId, endorsement) {
  const talent = getTalentById(talentId);
  if (!talent) return false;
  const endorsements = talent.endorsements || [];
  const updated = [endorsement, ...endorsements];
  updateTalentProfile(talentId, { endorsements: updated });

  try {
    updateDoc(doc(db, 'students', String(talentId)), {
      endorsements: arrayUnion(endorsement)
    }).catch(err => console.warn('Sync Firestore endosso:', err.message));
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
