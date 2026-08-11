/**
 * IVAÍ CONECTA - MOTOR DE MATCHING DE HABILIDADES
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

/**
 * Calcula a porcentagem de compatibilidade entre as habilidades do aluno e os requisitos da vaga.
 * @param {Array<string>} studentSkills - Lista de competências do aluno
 * @param {Array<string>} requiredSkills - Lista de pré-requisitos da vaga
 * @returns {number} Score arredondado de 0 a 100
 */
export function calculateMatchScore(studentSkills = [], requiredSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) return 0;
  if (!studentSkills || studentSkills.length === 0) return 0;
  
  const normalizedStudent = studentSkills.map(s => s.toLowerCase().trim());
  let matches = 0;
  
  requiredSkills.forEach(req => {
    if (normalizedStudent.includes(req.toLowerCase().trim())) {
      matches++;
    }
  });

  return Math.round((matches / requiredSkills.length) * 100);
}

/**
 * Ordena uma lista de vagas com base na compatibilidade com o perfil do estudante.
 * @param {Array<Object>} jobsList - Lista de vagas
 * @param {Array<string>} studentSkills - Habilidades do aluno
 * @returns {Array<Object>} Vagas com a propriedade matchScore injetada e ordenadas por score decrescente
 */
export function rankJobsByStudentSkills(jobsList = [], studentSkills = []) {
  return jobsList
    .map(job => ({
      ...job,
      matchScore: calculateMatchScore(studentSkills, job.requiredSkills)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
