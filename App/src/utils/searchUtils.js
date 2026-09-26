/**
 * Utilitários de busca multi-setorial inteligente e normalização de municípios para o Ivaí Conecta
 */

/**
 * Normaliza o nome da cidade removendo acentuação, convertendo para minúsculas e removendo espaços excedentes.
 */
export function normalizeCity(cityName) {
  if (!cityName) return '';
  return String(cityName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Compara se um item pertence à cidade filtrada de forma estrita.
 * Retorna true se a cidade for "Todas as Cidades", vazia ou se corresponder exatamente.
 */
export function matchCity(itemCity, filterCity) {
  if (!filterCity || filterCity === 'Todas as Cidades' || filterCity === 'Todas' || filterCity === 'todas') {
    return true;
  }
  const normItem = normalizeCity(itemCity);
  const normFilter = normalizeCity(filterCity);
  if (!normFilter) return true;
  return normItem === normFilter;
}

/**
 * Normaliza um texto para busca (remove acentos, pontuação desnecessária e minúsculas).
 */
export function normalizeSearchText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Quebra a query em tokens de busca significativos.
 */
export function tokenizeQuery(query) {
  if (!query) return [];
  const normalized = normalizeSearchText(query);
  return normalized
    .split(/[\s,;+/-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);
}

/**
 * Calcula a pontuação de relevância de um Talento/Profissional para os tokens da busca.
 * Retorna score > 0 se houver casamento, ou 0 se não casar.
 */
export function scoreTalentMatch(talent, tokens) {
  if (!talent || typeof talent !== 'object') return 0;
  if (!tokens || tokens.length === 0) return 1; // Sem busca = válido

  const name = normalizeSearchText(talent.name);
  const course = normalizeSearchText(talent.course);
  const institution = normalizeSearchText(talent.institution);
  const role = normalizeSearchText(talent.role);
  const bio = normalizeSearchText(talent.bio);
  const city = normalizeSearchText(talent.city);
  const skills = Array.isArray(talent.skills)
    ? talent.skills.map(s => normalizeSearchText(s)).join(' ')
    : normalizeSearchText(talent.skills);

  const fullCorpus = `${name} ${course} ${institution} ${role} ${bio} ${city} ${skills}`;

  let matchedTokens = 0;
  let score = 0;

  tokens.forEach(token => {
    let tokenScore = 0;
    // Casamento no nome (peso alto)
    if (name.includes(token)) tokenScore += 5;
    // Casamento no curso/profissão (peso alto)
    if (course.includes(token)) tokenScore += 4;
    // Casamento nas habilidades (peso alto)
    if (skills.includes(token)) tokenScore += 4;
    // Casamento na bio / instituição
    if (bio.includes(token) || institution.includes(token)) tokenScore += 2;
    // Casamento em qualquer parte do texto
    if (fullCorpus.includes(token) && tokenScore === 0) tokenScore += 1;

    if (tokenScore > 0) {
      matchedTokens++;
      score += tokenScore;
    }
  });

  // Se casar pelo menos 1 token (ou todos quando múltiplos), consideramos válido
  return matchedTokens > 0 ? score : 0;
}

/**
 * Calcula a pontuação de relevância de uma Vaga para os tokens da busca.
 */
export function scoreJobMatch(job, tokens) {
  if (!job || typeof job !== 'object') return 0;
  if (!tokens || tokens.length === 0) return 1;

  const title = normalizeSearchText(job.title);
  const company = normalizeSearchText(job.company);
  const description = normalizeSearchText(job.description);
  const level = normalizeSearchText(job.level);
  const type = normalizeSearchText(job.type);
  const modality = normalizeSearchText(job.modality);
  const city = normalizeSearchText(job.city);
  const skills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.map(s => normalizeSearchText(s)).join(' ')
    : normalizeSearchText(job.requiredSkills);

  const fullCorpus = `${title} ${company} ${description} ${level} ${type} ${modality} ${city} ${skills}`;

  let matchedTokens = 0;
  let score = 0;

  tokens.forEach(token => {
    let tokenScore = 0;
    // Casamento no título da vaga
    if (title.includes(token)) tokenScore += 5;
    // Casamento na empresa
    if (company.includes(token)) tokenScore += 3;
    // Casamento em habilidades
    if (skills.includes(token)) tokenScore += 4;
    // Casamento em nível (ex: pleno, sênior, estágio)
    if (level.includes(token)) tokenScore += 3;
    // Casamento em descrição
    if (description.includes(token)) tokenScore += 2;
    if (fullCorpus.includes(token) && tokenScore === 0) tokenScore += 1;

    if (tokenScore > 0) {
      matchedTokens++;
      score += tokenScore;
    }
  });

  return matchedTokens > 0 ? score : 0;
}

/**
 * Calcula a pontuação de relevância de um Serviço para os tokens da busca.
 */
export function scoreServiceMatch(service, tokens) {
  if (!service || typeof service !== 'object') return 0;
  if (!tokens || tokens.length === 0) return 1;

  const title = normalizeSearchText(service.title);
  const provider = normalizeSearchText(service.providerName || service.provider);
  const category = normalizeSearchText(service.category);
  const description = normalizeSearchText(service.description);
  const city = normalizeSearchText(service.city);
  const tags = Array.isArray(service.tags)
    ? service.tags.map(t => normalizeSearchText(t)).join(' ')
    : normalizeSearchText(service.tags);

  const fullCorpus = `${title} ${provider} ${category} ${description} ${city} ${tags}`;

  let matchedTokens = 0;
  let score = 0;

  tokens.forEach(token => {
    let tokenScore = 0;
    // Casamento no título do serviço
    if (title.includes(token)) tokenScore += 5;
    // Casamento no nome do prestador (ex: Lucas)
    if (provider.includes(token)) tokenScore += 5;
    // Casamento na categoria (ex: Pedreiro, Construção)
    if (category.includes(token)) tokenScore += 4;
    // Casamento nas tags
    if (tags.includes(token)) tokenScore += 3;
    // Casamento na descrição
    if (description.includes(token)) tokenScore += 2;
    if (fullCorpus.includes(token) && tokenScore === 0) tokenScore += 1;

    if (tokenScore > 0) {
      matchedTokens++;
      score += tokenScore;
    }
  });

  return matchedTokens > 0 ? score : 0;
}
