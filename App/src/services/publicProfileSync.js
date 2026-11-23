// Shared public_profiles synchronization helper for Ivaí Conecta
import { db } from '../lib/firebase.js';
import { doc, setDoc, deleteField } from 'firebase/firestore';

const VALID_PUBLIC_ROLES = new Set([
  'aluno',
  'candidato',
  'freelancer',
  'prestador',
  'professor',
  'empresa',
]);

function normalizePublicRole(rawRole, sourceData = {}) {
  const value = String(rawRole || '').toLowerCase().trim();
  const aliases = {
    aluno: 'aluno',
    estudante: 'aluno',
    estudantes: 'aluno',
    student: 'aluno',
    students: 'aluno',
    candidato: 'candidato',
    candidate: 'candidato',
    profissional: 'candidato',
    freelancer: 'freelancer',
    autonomo: 'freelancer',
    'autônomo': 'freelancer',
    prestador: 'prestador',
    empresa: 'empresa',
    company: 'empresa',
    recrutador: 'empresa',
    recruiter: 'empresa',
    professor: 'professor',
    docente: 'professor',
    teacher: 'professor',
  };

  if (aliases[value]) return aliases[value];
  if (sourceData.isVerifiedStudent) return 'aluno';
  if (sourceData.razaoSocial || sourceData.nomeFantasia || sourceData.cnpj) return 'empresa';
  return '';
}

function sanitizeImageField(value, maxDataUrlLen = 240000) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^data:image\//i.test(trimmed)) {
    return trimmed.length <= maxDataUrlLen ? trimmed : '';
  }
  return trimmed.slice(0, 2048);
}

/**
 * Monta o payload público sanitizado compatível com as regras de `public_profiles/{uid}`.
 */
export function buildPublicProfilePayload(uid, sourceData = {}) {
  const rawRole =
    sourceData.activeRole ||
    sourceData.selectedRole ||
    sourceData.profileType ||
    sourceData.role ||
    '';
  const role = normalizePublicRole(rawRole, sourceData);

  const avatar = sanitizeImageField(
    sourceData.avatar || sourceData.photoURL || sourceData.logo || '',
    240000
  );
  const banner = sanitizeImageField(
    sourceData.banner || sourceData.coverImage || '',
    340000
  );

  // Evita duplicar DataURLs longos em photoURL quando já salvos em avatar
  const rawPhotoUrl = sourceData.photoURL || sourceData.avatar || sourceData.logo || '';
  const photoURL = /^data:image\//i.test(rawPhotoUrl)
    ? (avatar.length <= 2048 ? avatar : '')
    : sanitizeImageField(rawPhotoUrl, 2048);

  const isBlocked =
    sourceData.blocked === true ||
    String(sourceData.status || '').toLowerCase() === 'blocked';
  const isActive = !isBlocked && sourceData.isDeactivated !== true;

  const payload = {
    uid: String(uid),
    name: String(
      sourceData.name ||
        sourceData.displayName ||
        sourceData.razaoSocial ||
        sourceData.nomeFantasia ||
        ''
    ).slice(0, 120),
    city: String(sourceData.city || 'Ivaiporã').slice(0, 100),
    institution: String(sourceData.institution || '').slice(0, 160),
    course: String(sourceData.course || sourceData.specialty || '').slice(0, 160),
    period: String(sourceData.period || '').slice(0, 80),
    avatar,
    photoURL,
    banner,
    skills: Array.isArray(sourceData.skills) ? sourceData.skills.slice(0, 100) : [],
    experiences: Array.isArray(sourceData.experiences) ? sourceData.experiences.slice(0, 100) : [],
    projects: Array.isArray(sourceData.projects) ? sourceData.projects.slice(0, 100) : [],
    education: Array.isArray(sourceData.education) ? sourceData.education.slice(0, 100) : [],
    bio: String(sourceData.bio || sourceData.about || '').slice(0, 1000),
    endorsements: Array.isArray(sourceData.endorsements)
      ? sourceData.endorsements.slice(0, 100)
      : [],
    endorsementCount: Math.max(0, Math.min(100, Number(sourceData.endorsementCount || 0) || 0)),
    isActive,
    blocked: isBlocked,
    status: isBlocked ? 'blocked' : 'active',
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(sourceData, 'isVerifiedStudent')) {
    payload.isVerifiedStudent = Boolean(sourceData.isVerifiedStudent);
  }

  if (role && VALID_PUBLIC_ROLES.has(role)) {
    payload.role = role;
  }

  if (role === 'empresa') {
    payload.razaoSocial = String(sourceData.razaoSocial || '').slice(0, 120);
    payload.nomeFantasia = String(sourceData.nomeFantasia || sourceData.tradingName || '').slice(0, 120);
    payload.sector = String(sourceData.sector || sourceData.industry || '').slice(0, 160);
    payload.about = String(sourceData.about || sourceData.description || '').slice(0, 1000);
    payload.cnpj = deleteField();
    payload.isVerifiedCompany = Boolean(sourceData.isVerifiedCompany);
    payload.companyVerificationStatus = String(sourceData.companyVerificationStatus || '').slice(0, 30);
  }

  return payload;
}

/**
 * Sincroniza `public_profiles/{uid}` com fallback seguro caso as regras antigas no servidor
 * ainda restrinjam o campo `banner` ou imagens acima de 2048 bytes.
 */
export async function syncPublicProfileSafe(uid, sourceData = {}) {
  if (!uid || !sourceData || typeof sourceData !== 'object') return false;

  const cleanUid = String(uid).trim();
  if (!cleanUid) return false;

  const payload = buildPublicProfilePayload(cleanUid, sourceData);

  try {
    await setDoc(doc(db, 'public_profiles', cleanUid), payload, { merge: true });
    return true;
  } catch (err) {
    // Fallback para compatibilidade caso firestore.rules no servidor ainda não tenha sido reimplantado
    if (err?.code === 'permission-denied' || String(err?.message || '').toLowerCase().includes('permission')) {
      try {
        const legacyPayload = { ...payload };
        delete legacyPayload.banner;
        delete legacyPayload.coverImage;
        if (typeof legacyPayload.avatar === 'string' && legacyPayload.avatar.length > 2048) {
          delete legacyPayload.avatar;
        }
        if (typeof legacyPayload.photoURL === 'string' && legacyPayload.photoURL.length > 2048) {
          delete legacyPayload.photoURL;
        }
        await setDoc(doc(db, 'public_profiles', cleanUid), legacyPayload, { merge: true });
        return true;
      } catch (fallbackErr) {
        console.warn('[publicProfileSync] Fallback de public_profiles falhou:', fallbackErr?.message);
        return false;
      }
    }
    console.warn('[publicProfileSync] Erro ao sincronizar public_profiles:', err?.message);
    return false;
  }
}
