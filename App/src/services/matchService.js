// Match Score Service for Ivaí Conecta

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
    candidateSkills.some(sk => sk.toLowerCase() === req.toLowerCase())
  );
  const skillRatio = matchedSkills.length / requiredSkills.length;
  const skillScore = skillRatio * 60;

  // 2. City Proximity (Weight 20%)
  let locationScore = 10; // Default regional proximity
  if (options.userCity && options.jobCity && options.userCity.toLowerCase() === options.jobCity.toLowerCase()) {
    locationScore = 20; // Direct city match
  }

  // 3. Verification & Endorsements Bonus (Weight 20%)
  let verificationScore = 0;
  if (options.isVerifiedStudent) verificationScore += 10;
  if (options.endorsementsCount > 0) verificationScore += 10;

  const totalScore = Math.min(100, Math.round(skillScore + locationScore + verificationScore));
  return totalScore;
}
