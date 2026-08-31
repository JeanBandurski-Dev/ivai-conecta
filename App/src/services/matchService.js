/**
 * Normaliza string para comparação flexível de habilidades
 */
export function normalizeSkill(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[\.\-\s]/g, '')
    .trim();
}

/**
 * Verifica se uma habilidade do candidato atende a uma exigência da vaga
 */
export function isSkillMatch(candidateSkill, requiredSkill) {
  if (!candidateSkill || !requiredSkill) return false;
  const c = normalizeSkill(candidateSkill);
  const r = normalizeSkill(requiredSkill);
  return c === r || c.includes(r) || r.includes(c);
}

/**
 * Calculates weighted match score for candidate/student vs job requirements.
 * Factors:
 * - Skills Match (60%)
 * - Location Proximity in Vale do Ivaí (20%)
 * - Verified Student / Teacher Endorsement Bonus (20%)
 */
export function calculateMatchScore(candidateSkills = [], requiredSkills = [], options = {}) {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  // 1. Skill Match (Weight 60%)
  const matchedSkills = requiredSkills.filter(req =>
    candidateSkills.some(sk => isSkillMatch(sk, req))
  );
  const skillRatio = matchedSkills.length / requiredSkills.length;
  const skillScore = skillRatio * 60;

  // 2. City Proximity (Weight 20%)
  let locationScore = 10; // Default regional proximity (Vale do Ivaí)
  if (options.userCity && options.jobCity && options.userCity.toLowerCase().trim() === options.jobCity.toLowerCase().trim()) {
    locationScore = 20; // Direct city match
  }

  // 3. Verification & Endorsements Bonus (Weight 20%)
  let verificationScore = 0;
  if (options.isVerifiedStudent) verificationScore += 10;
  if (options.endorsementsCount > 0) verificationScore += 10;

  const totalScore = Math.min(100, Math.round(skillScore + locationScore + verificationScore));
  return totalScore;
}
