/**
 * Motor de Matching de Habilidades & Compatibilidade
 * Ivaí Conecta - Vale do Ivaí
 * 
 * Algoritmo ponderado de recomendação inteligente baseado em:
 * 1. Coincidência Técnica de Competências (Peso: até 80%) com suporte a sinônimos (ex: React == React.js, Golang == Go)
 * 2. Proximidade Geográfica no Vale do Ivaí (Peso: até 15%)
 * 3. Diferencial Acadêmico & Recomendações de Professores (Bônus: até 10%)
 * 4. Proteção contra falsos positivos (ex: C não casa com React, Java não casa com JavaScript)
 */

// Grupos canônicos de sinônimos e equivalências no mercado de trabalho
const SYNONYM_GROUPS = [
  // Frontend / Web / JS
  ['react', 'reactjs', 'react.js', 'react js'],
  ['react native', 'reactnative', 'rn'],
  ['node', 'nodejs', 'node.js', 'node js'],
  ['vue', 'vuejs', 'vue.js', 'vue js'],
  ['next', 'nextjs', 'next.js', 'next js'],
  ['angular', 'angularjs', 'angular.js'],
  ['typescript', 'ts'],
  ['javascript', 'js'],
  ['html', 'html5', 'html5 & css3', 'html e css'],
  ['css', 'css3', 'html5 & css3', 'html e css', 'sass', 'scss'],
  ['tailwind', 'tailwindcss'],
  ['bootstrap', 'bootstrap 5'],

  // Backend, Linguagens & Paradigmas
  ['c#', 'csharp', 'c sharp'],
  ['c++', 'cpp'],
  ['golang', 'go'],
  ['python', 'python 3', 'py'],
  ['ruby', 'ruby on rails', 'rails'],
  ['php', 'php 8', 'laravel'],

  // Bancos de Dados & Cloud
  ['sql', 'bancos de dados sql', 'sql / bancos de dados', 'database sql'],
  ['postgres', 'postgresql', 'postgre'],
  ['mysql', 'my sql'],
  ['mongo', 'mongodb'],
  ['git', 'github', 'git & github', 'git e github', 'gitlab'],
  ['docker', 'containers docker', 'docker & kubernetes'],
  ['aws', 'amazon web services'],
  ['gcp', 'google cloud', 'google cloud platform'],
  ['azure', 'microsoft azure'],
  ['linux', 'sistema linux', 'ubuntu'],

  // Design, Dados & Analytics
  ['power bi', 'powerbi', 'pbi'],
  ['figma', 'ui/ux', 'ui/ux design', 'ux/ui', 'ui ux design'],
  ['excel', 'excel avancado', 'microsoft excel', 'ms excel', 'pacote office'],

  // Gestão, Administrativo, Comercial & RH
  ['rh', 'recursos humanos', 'recrutamento e selecao', 'recrutamento e selecao (rh)'],
  ['dp', 'departamento pessoal', 'departamento pessoal (dp)'],
  ['nfe', 'emissao de notas fiscais', 'emissao de notas fiscais (nfe)', 'nota fiscal'],
  ['contas a pagar', 'contas a pagar e receber', 'financeiro'],
  ['scrum', 'kanban', 'metodologias ageis', 'metodologias ageis (scrum/kanban)', 'agile'],
  ['crm', 'salesforce', 'salesforce / crm', 'gestao de clientes'],
  ['erp', 'sap', 'totvs', 'suporte a sistemas erp'],
  ['marketing digital', 'gestao de redes sociais', 'social media']
];

// Siglas e termos curtos que requerem correspondência restrita por palavra inteira
const STRICT_SHORT_SKILLS = new Set([
  'c', 'r', 'go', 'js', 'ts', 'php', 'sql', 'aws', 'gcp', 'sap', 'rh', 'dp', 'bi', 'seo', 'crm', 'erp', 'ti', 'ui', 'ux', 'ai'
]);

/**
 * Normaliza string para comparação flexível mantendo separação por palavras
 */
export function normalizeSkill(str = '') {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[\.\-\/&]/g, ' ')       // substitui pontuações por espaço
    .replace(/\s+/g, ' ')            // colapsa múltiplos espaços
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
 * Verifica se duas habilidades são sinônimas ou equivalentes no mercado
 */
export function areSkillSynonyms(a, b) {
  const normA = normalizeSkill(a);
  const normB = normalizeSkill(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  for (const group of SYNONYM_GROUPS) {
    const hasA = group.some(item => normalizeSkill(item) === normA);
    const hasB = group.some(item => normalizeSkill(item) === normB);
    if (hasA && hasB) return true;
  }
  return false;
}

/**
 * Verifica se uma habilidade do candidato atende a uma exigência da vaga com alta precisão
 */
export function isSkillMatch(candidateSkill, requiredSkill) {
  if (!candidateSkill || !requiredSkill) return false;
  const cNorm = normalizeSkill(candidateSkill);
  const rNorm = normalizeSkill(requiredSkill);
  if (!cNorm || !rNorm) return false;

  // 1. Igualdade direta após normalização
  if (cNorm === rNorm) return true;

  // 2. Proteção estrita contra falsos cognatos (ex: Java != JavaScript, C != C++ / C#)
  if ((cNorm === 'java' && (rNorm === 'javascript' || rNorm === 'js')) ||
      (rNorm === 'java' && (cNorm === 'javascript' || cNorm === 'js'))) {
    return false;
  }
  if ((cNorm === 'c' && (rNorm === 'c++' || rNorm === 'c#' || rNorm === 'cpp' || rNorm === 'csharp')) ||
      (rNorm === 'c' && (cNorm === 'c++' || cNorm === 'c#' || cNorm === 'cpp' || cNorm === 'csharp'))) {
    return false;
  }

  // 3. Dicionário de sinônimos técnicos e corporativos
  if (areSkillSynonyms(candidateSkill, requiredSkill)) return true;

  // 4. Verificação estrita para siglas e termos curtos (palavra inteira)
  if (STRICT_SHORT_SKILLS.has(cNorm) || STRICT_SHORT_SKILLS.has(rNorm)) {
    const cWords = cNorm.split(' ');
    const rWords = rNorm.split(' ');
    return cWords.includes(rNorm) || rWords.includes(cNorm);
  }

  // 5. Comparação de termos compostos por sobreposição de palavras-chave significativas
  const cTokens = cNorm.split(' ').filter(t => t.length >= 3);
  const rTokens = rNorm.split(' ').filter(t => t.length >= 3);
  if (cTokens.length > 0 && rTokens.length > 0) {
    const matchCount = cTokens.filter(t => rTokens.includes(t)).length;
    if (matchCount >= Math.min(cTokens.length, rTokens.length)) {
      return true;
    }
  }

  return false;
}

/**
 * Calcula a porcentagem real de compatibilidade entre candidato e vaga
 * 
 * @param {Array<string>|string} candidateSkills - Habilidades cadastradas do aluno/candidato
 * @param {Array<string>|string} requiredSkills - Habilidades exigidas na descrição da vaga
 * @param {Object} options - Metadados complementares (userCity, jobCity, isVerifiedStudent, endorsementsCount, modality)
 * @returns {number} Score de 0 a 100%
 */
export function calculateMatchScore(candidateSkills = [], requiredSkills = [], options = {}) {
  const safeReq = safeSkillsArray(requiredSkills);
  const safeCand = safeSkillsArray(candidateSkills);

  // Vaga sem requisitos explícitos tem 100% de elegibilidade ampla
  if (safeReq.length === 0) return 100;
  // Candidato sem nenhuma habilidade cadastrada tem 0% de match
  if (safeCand.length === 0) return 0;

  // 1. Competências Técnicas Coincidentes (Peso: 80%)
  const matchedSkills = safeReq.filter(req =>
    safeCand.some(cand => isSkillMatch(cand, req))
  );

  // Se o candidato não atender a nenhuma habilidade exigida, não gera afinidade falsa
  if (matchedSkills.length === 0) {
    return 0;
  }

  const skillRatio = matchedSkills.length / safeReq.length;
  const skillScore = skillRatio * 80;

  // 2. Proximidade e Mobilidade Regional no Vale do Ivaí (Peso: 15%)
  let locationScore = 10; // Proximidade regional garantida no polo Vale do Ivaí
  const userCity = options?.userCity ? String(options.userCity).toLowerCase().trim() : '';
  const jobCity = options?.jobCity ? String(options.jobCity).toLowerCase().trim() : '';
  const isRemoteOrHybrid = options?.modality && (
    options.modality.toLowerCase().includes('remot') ||
    options.modality.toLowerCase().includes('hibrid')
  );

  if (isRemoteOrHybrid || (userCity && jobCity && userCity === jobCity)) {
    locationScore = 15; // Cidade direta ou trabalho remoto
  }

  // 3. Diferencial Acadêmico & Recomendações Docentes (Bônus: até +10%)
  let bonusScore = 0;
  if (options?.isVerifiedStudent) bonusScore += 5;
  if (options?.endorsementsCount && Number(options.endorsementsCount) > 0) bonusScore += 5;

  // Total consolidado (limitado a 100)
  const totalScore = Math.min(100, Math.round(skillScore + locationScore + bonusScore));
  return totalScore;
}

/**
 * Retorna o detalhamento analítico da compatibilidade para exibição visual
 */
export function getMatchDetails(candidateSkills = [], requiredSkills = [], options = {}) {
  const safeReq = safeSkillsArray(requiredSkills);
  const safeCand = safeSkillsArray(candidateSkills);

  if (safeReq.length === 0) {
    return {
      score: 100,
      matchedSkills: safeCand,
      missingSkills: [],
      matchLevel: 'Compatibilidade Total',
      matchLevelColor: 'text-green-500',
      skillRatio: 1
    };
  }

  const matchedSkills = [];
  const missingSkills = [];

  safeReq.forEach(req => {
    const isMatched = safeCand.some(cand => isSkillMatch(cand, req));
    if (isMatched) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  const score = calculateMatchScore(candidateSkills, requiredSkills, options);

  let matchLevel = 'Em Desenvolvimento';
  let matchLevelColor = 'text-amber-500';
  if (score >= 80) {
    matchLevel = 'Alta Afinidade';
    matchLevelColor = 'text-green-500';
  } else if (score >= 60) {
    matchLevel = 'Boa Compatibilidade';
    matchLevelColor = 'text-blue-500';
  }

  return {
    score,
    matchedSkills,
    missingSkills,
    matchLevel,
    matchLevelColor,
    skillRatio: safeReq.length > 0 ? matchedSkills.length / safeReq.length : 1
  };
}
