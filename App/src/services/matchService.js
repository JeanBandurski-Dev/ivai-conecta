/**
 * Normaliza string para comparação flexível de habilidades
 */
export function normalizeSkill(str = '') {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[\.\-\s]/g, '')
    .trim();
}

/**
 * Converte qualquer entrada de habilidades (string com vírgula, array, etc.) em array de strings seguro
 */
export function safeSkillsArray(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) {
    return skills.map(s => String(s || '').trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Verifica se uma habilidade do candidato atende a uma exigência da vaga
 */
export function isSkillMatch(candidateSkill, requiredSkill) {
  if (!candidateSkill || !requiredSkill) return false;
  const c = normalizeSkill(candidateSkill);
  const r = normalizeSkill(requiredSkill);
  if (!c || !r) return false;
  return c === r || c.includes(r) || r.includes(c);
}

/**
 * Calculates weighted match score for candidate/student vs job requirements.
 * Factors:
 * - Skills Match (80%): Directly proportional to matching required technical skills
 * - Location Proximity in Vale do Ivaí (20%): 20% same city, 10% neighboring regional city
 * - Verified Student / Teacher Endorsement Bonus: Extra boost (+5% to +10%) that helps regional candidates or partial skill matches
 */
export function calculateMatchScore(candidateSkills = [], requiredSkills = [], options = {}) {
  const safeReq = safeSkillsArray(requiredSkills);
  const safeCand = safeSkillsArray(candidateSkills);

  if (safeReq.length === 0) return 100;
  if (safeCand.length === 0) return 0;

  // 1. Skill Match (Weight 80%)
  const matchedSkills = safeReq.filter(req =>
    safeCand.some(sk => isSkillMatch(sk, req))
  );
  const skillRatio = matchedSkills.length / safeReq.length;
  const skillScore = skillRatio * 80;

  // 2. City Proximity (Weight 20%)
  let locationScore = 10; // Default regional proximity (Vale do Ivaí)
  const userCity = options?.userCity ? String(options.userCity).toLowerCase().trim() : '';
  const jobCity = options?.jobCity ? String(options.jobCity).toLowerCase().trim() : '';
  if (userCity && jobCity && userCity === jobCity) {
    locationScore = 20; // Direct city match
  }

  // 3. Verification & Endorsements Bonus (Up to +10% boost)
  let bonusScore = 0;
  if (options?.isVerifiedStudent) bonusScore += 5;
  if (options?.endorsementsCount && Number(options.endorsementsCount) > 0) bonusScore += 5;

  const totalScore = Math.min(100, Math.round(skillScore + locationScore + bonusScore));
  return totalScore;
}
