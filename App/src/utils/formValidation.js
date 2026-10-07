/**
 * Utilitários de Validação e Formatação de Formulários
 * Ivaí Conecta - Vale do Ivaí
 */

import { hasProfanity, detectProfanity, isTrollWord } from '../services/jobTaxonomy.js';

/**
 * Formata um valor numérico ou string para o padrão monetário brasileiro (BRL: R$ 1.500,00).
 * Se o usuário digitou apenas o número inteiro (ex: "1500"), preenche automaticamente os centavos ",00".
 * 
 * Exemplos:
 *  "1500"     -> "R$ 1.500,00"
 *  "1500,5"   -> "R$ 1.500,50"
 *  "1500.50"  -> "R$ 1.500,50"
 *  "350"      -> "R$ 350,00"
 *  "A combinar" -> "A combinar"
 */
export function formatCurrencyBRL(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';

  if (/a\s*combinar/i.test(str)) {
    return 'A combinar';
  }

  // Remove caracteres que não sejam números, vírgula ou ponto
  const cleaned = str.replace(/[^\d.,]/g, '');
  if (!cleaned) return '';

  let integerPart = '';
  let decimalPart = '00';

  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    integerPart = parts[0].replace(/\D/g, '');
    decimalPart = (parts[1] || '').replace(/\D/g, '').padEnd(2, '0').slice(0, 2);
  } else if (cleaned.includes('.')) {
    // Se o ponto separa exatamente 1 ou 2 dígitos no final (ex: 1500.50 ou 1500.5)
    const lastDotIdx = cleaned.lastIndexOf('.');
    const afterDot = cleaned.slice(lastDotIdx + 1);
    if (afterDot.length <= 2) {
      integerPart = cleaned.slice(0, lastDotIdx).replace(/\D/g, '');
      decimalPart = afterDot.replace(/\D/g, '').padEnd(2, '0').slice(0, 2);
    } else {
      // Ponto usado como separador de milhar (ex: 1.500)
      integerPart = cleaned.replace(/\D/g, '');
      decimalPart = '00';
    }
  } else {
    // Apenas números inteiros (ex: "1500") -> auto-preenche ",00"
    integerPart = cleaned.replace(/\D/g, '');
    decimalPart = '00';
  }

  if (!integerPart) return '';

  // Formata o milhar com pontos (ex: 1500 -> 1.500)
  const formattedInteger = Number(integerPart).toLocaleString('pt-BR');
  return `R$ ${formattedInteger},${decimalPart}`;
}

/**
 * Máscara em tempo real enquanto o usuário digita no campo de moeda.
 * Permite digitar números sem travar e formata o milhar.
 */
export function maskCurrencyLive(val) {
  if (!val) return '';
  const str = String(val).trim();

  if (/a\s*combinar/i.test(str)) {
    return 'A combinar';
  }

  // Remove tudo que não for dígito ou vírgula
  const cleaned = str.replace(/[^\d,]/g, '');
  if (!cleaned) return '';

  const parts = cleaned.split(',');
  const rawInt = parts[0].replace(/\D/g, '');

  if (!rawInt) return '';

  const formattedInt = Number(rawInt).toLocaleString('pt-BR');

  if (parts.length > 1) {
    // Usuário digitou a vírgula para especificar centavos
    const dec = parts[1].replace(/\D/g, '').slice(0, 2);
    return `R$ ${formattedInt},${dec}`;
  }

  return `R$ ${formattedInt}`;
}

/**
 * Converte valor formatado para número puro float
 */
export function parseCurrencyToNumber(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const str = String(val);
  if (/a\s*combinar/i.test(str)) return 0;

  const cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Validação rigorosa de valor monetário
 */
export function validateCurrency(val, { min = 1, max = 500000, required = false } = {}) {
  if (!val || typeof val !== 'string' || !val.trim()) {
    if (required) {
      return { valid: false, error: 'O valor do orçamento é obrigatório.' };
    }
    return { valid: true };
  }

  const str = val.trim();
  if (/a\s*combinar/i.test(str)) {
    return { valid: true, isACombinar: true, numericValue: 0 };
  }

  const num = parseCurrencyToNumber(str);
  if (num <= 0) {
    if (required) {
      return { valid: false, error: 'Informe um valor válido maior que zero ou selecione "A combinar".' };
    }
    return { valid: true };
  }

  if (num < min) {
    return { valid: false, error: `O valor mínimo permitido é de ${formatCurrencyBRL(min)}.` };
  }

  if (num > max) {
    return { valid: false, error: `O valor máximo permitido é de ${formatCurrencyBRL(max)}.` };
  }

  return { valid: true, numericValue: num };
}

/**
 * Validação rigorosa de texto de depoimento / avaliação de serviço
 */
export function validateReviewText(comment, { minLength = 15, maxLength = 600 } = {}) {
  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    return {
      valid: false,
      error: `Por favor, escreva seu depoimento sobre o atendimento (mínimo de ${minLength} caracteres).`,
      length: 0,
      minLength
    };
  }

  const clean = comment.trim();
  const len = clean.length;

  if (len < minLength) {
    const falta = minLength - len;
    return {
      valid: false,
      error: `Seu comentário está muito curto. Escreva mais ${falta} ${falta === 1 ? 'caractere' : 'caracteres'} para publicar a avaliação.`,
      length: len,
      minLength
    };
  }

  if (len > maxLength) {
    return {
      valid: false,
      error: `O depoimento deve ter no máximo ${maxLength} caracteres (atualmente com ${len}).`,
      length: len,
      minLength
    };
  }

  // Verifica repetições abusivas de caracteres (ex: "aaaaaaa", "muuuuuuuito")
  if (/(.)\1{5,}/.test(clean)) {
    return {
      valid: false,
      error: 'Evite repetições excessivas de uma mesma letra. Escreva um comentário claro e construtivo.',
      length: len,
      minLength
    };
  }

  // Verifica se há pelo menos palavras com letras reais
  const wordCount = clean.split(/\s+/).filter(w => /[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(w)).length;
  if (wordCount < 3) {
    return {
      valid: false,
      error: 'Descreva sua experiência com pelo menos 3 palavras reais sobre o atendimento prestado.',
      length: len,
      minLength
    };
  }

  // Anti-profanidade
  if (hasProfanity(clean)) {
    return {
      valid: false,
      error: 'Identificamos palavras inadequadas no seu texto. Mantenha um tom profissional e respeitoso.',
      length: len,
      minLength
    };
  }

  return {
    valid: true,
    length: len,
    minLength
  };
}

/**
 * Validação do texto de demanda do cliente ao solicitar serviço
 */
export function validateServiceRequestDescription(text, { minLength = 20, maxLength = 800 } = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      valid: false,
      errorTitle: 'Descrição obrigatória',
      error: `Descreva o que você precisa que seja feito (mínimo de ${minLength} caracteres).`,
      length: 0,
      missingChars: minLength,
      minLength
    };
  }

  const clean = text.trim();
  const len = clean.length;

  if (len < minLength) {
    const falta = minLength - len;
    return {
      valid: false,
      errorTitle: `Faltam ${falta} ${falta === 1 ? 'letra' : 'letras'}`,
      error: `A descrição da sua demanda precisa de mais detalhes (faltam ${falta} letras para atingir o mínimo de ${minLength}). Isso ajuda o prestador a orçar com exatidão.`,
      length: len,
      missingChars: falta,
      minLength
    };
  }

  if (len > maxLength) {
    return {
      valid: false,
      errorTitle: 'Limite excedido',
      error: `A descrição atingiu o limite de ${maxLength} caracteres (atualmente com ${len}).`,
      length: len,
      missingChars: 0,
      minLength
    };
  }

  // 1. Anti-profanidade / Palavras ofensivas
  const profanityCheck = detectProfanity(clean);
  if (profanityCheck.hasProfanity) {
    return {
      valid: false,
      errorTitle: 'Linguagem imprópria',
      error: 'Identificamos termos impróprios ou ofensivos no texto. Por favor, mantenha um vocabulário respeitoso e profissional.',
      length: len,
      missingChars: 0,
      minLength
    };
  }

  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);

  // 2. Bloqueio de termos troll / comidas / brincadeiras (ex: "abacaxi", "banana", "pizza")
  for (const w of words) {
    if (isTrollWord(w)) {
      return {
        valid: false,
        errorTitle: 'Termo inadequado',
        error: `O termo "${w}" não corresponde a uma demanda profissional de serviço. Descreva o que você precisa que seja feito no seu projeto ou imóvel.`,
        length: len,
        missingChars: 0,
        minLength
      };
    }
  }

  // 3. Verifica repetições excessivas de caracteres isolados (ex: "aaaaaa", "sssssss")
  if (/(.)\1{4,}/i.test(clean)) {
    return {
      valid: false,
      errorTitle: 'Caracteres repetitivos',
      error: 'Evite repetições excessivas da mesma letra (ex: "aaaaa"). Descreva a demanda com clareza.',
      length: len,
      missingChars: 0,
      minLength
    };
  }

  // 4. Verifica repetições abusivas de sílabas ou padrões curtos (ex: "asasasasas", "deasaasasasasas")
  if (/(.{2,4})\1{3,}/i.test(clean)) {
    return {
      valid: false,
      errorTitle: 'Padrão repetitivo',
      error: 'Identificamos repetições contínuas de sílabas ou letras (ex: "asasas"). Descreva o serviço com palavras completas.',
      length: len,
      missingChars: 0,
      minLength
    };
  }

  // 5. Verifica palavras repetidas consecutivas (ex: "serviço serviço serviço")
  if (/\b(\w+)\s+\1\s+\1\b/i.test(clean)) {
    return {
      valid: false,
      errorTitle: 'Palavras repetidas',
      error: 'Evite repetir a mesma palavra várias vezes consecutivas. Descreva o escopo real do serviço.',
      length: len,
      missingChars: 0,
      minLength
    };
  }

  // 6. Quantidade de palavras reais válidas (mínimo de 3 palavras reais com letras)
  const realWords = clean.split(/\s+/).filter(w => /[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(w));
  if (realWords.length < 3) {
    return {
      valid: false,
      errorTitle: 'Mínimo de 3 palavras',
      error: 'Descreva sua demanda com pelo menos 3 palavras reais detalhando o que você precisa (ex: "Instalação de ar condicionado split em escritório").',
      length: len,
      wordCount: realWords.length,
      missingChars: 0,
      minLength
    };
  }

  // 7. Validação de Contexto / Semântica de Serviço (Evita frases e palavras aleatórias sem sentido de demanda)
  const SERVICE_DEMAND_STEMS = [
    // Ações de solicitação e contratação
    'precis', 'gostari', 'solicit', 'orcament', 'orcar', 'cotac', 'cotar', 'contrat', 'pedid',
    'demand', 'atend', 'visita', 'avali', 'ajud', 'suport', 'assist', 'fazer', 'faz', 'execut',
    // Atividades técnicas e serviços manuais
    'instal', 'reform', 'consert', 'repar', 'manutenc', 'troc', 'substitu', 'limp', 'faxin',
    'higieniz', 'pint', 'revis', 'mont', 'desmont', 'coloc', 'ajust', 'regul', 'configur',
    'format', 'desenvolv', 'program', 'criac', 'criar', 'constru', 'pedreir', 'alvenari',
    'marcen', 'serralh', 'solda', 'vidrac', 'eletric', 'encanad', 'mecanic',
    // Componentes, instalações e objetos de serviço
    'fiacao', 'tomada', 'disjuntor', 'lampada', 'iluminac', 'curto', 'ar condicionado', 'split',
    'cano', 'torneira', 'pia', 'ralo', 'esgoto', 'vazament', 'infiltrac', 'telhad', 'calha',
    'parede', 'piso', 'azulej', 'porcelanat', 'gesso', 'porta', 'portao', 'janela', 'grade',
    'computad', 'notebook', 'impressor', 'rede', 'wifi', 'internet', 'sistema', 'software',
    'site', 'aplicativ', 'app', 'design', 'logo', 'marketing', 'post', 'anuncio',
    'motor', 'veicul', 'carro', 'moto', 'freio', 'bateria', 'pneu', 'suspens', 'oleo',
    'frete', 'mudanc', 'transport', 'carreto', 'entreg', 'jardin', 'grama', 'piscina',
    'sofa', 'estofad', 'colchao', 'geladeira', 'fogao', 'lavadora', 'maquina de lavar',
    'casa', 'apartament', 'escritori', 'loja', 'sala', 'quarto', 'cozinha', 'banheiro',
    'comodo', 'imovel', 'residencia', 'predial', 'comercial', 'fachada',
    // Serviços intelectuais, aulas e documentais
    'aula', 'curso', 'ensin', 'trein', 'reforco', 'professor', 'personal', 'musica', 'idioma',
    'consultor', 'assessor', 'advogad', 'juridic', 'contab', 'contador', 'imposto', 'laudo',
    'vistori', 'traduc', 'redac', 'foto', 'fotograf', 'filmagem', 'video', 'evento', 'decorac',
    'mao de obra', 'material', 'materiais', 'nota fiscal', 'recibo', 'garantia'
  ];

  const hasServiceDemandContext = SERVICE_DEMAND_STEMS.some(stem => norm.includes(stem));
  if (!hasServiceDemandContext) {
    return {
      valid: false,
      errorTitle: 'Escopo não reconhecido',
      error: 'A descrição deve especificar uma demanda de serviço real (ex: o que você precisa que seja instalado, consertado, reformado, limpo ou orçado).',
      length: len,
      wordCount: realWords.length,
      missingChars: 0,
      minLength
    };
  }

  return {
    valid: true,
    errorTitle: '',
    error: '',
    length: len,
    wordCount: realWords.length,
    missingChars: 0,
    minLength
  };
}

/**
 * Validação rigorosa do prazo informado para execução do serviço
 */
export function validateServiceDeadline(deadline, { required = true, minLength = 3, maxLength = 80 } = {}) {
  if (!deadline || typeof deadline !== 'string' || !deadline.trim()) {
    if (required) {
      return {
        valid: false,
        errorTitle: 'Prazo obrigatório',
        error: 'Informe o prazo desejado (ex: "Esta semana", "Até sexta-feira") ou selecione uma opção rápida.',
        length: 0
      };
    }
    return { valid: true, errorTitle: '', error: '', deadline: 'A combinar com o prestador', length: 0 };
  }

  const clean = deadline.trim();

  // Opções pré-definidas são sempre válidas
  if (QUICK_DEADLINE_OPTIONS.some(opt => opt.toLowerCase() === clean.toLowerCase())) {
    return { valid: true, errorTitle: '', error: '', deadline: clean, length: clean.length };
  }

  // 1. Anti-profanidade no prazo
  const profanityCheck = detectProfanity(clean);
  if (profanityCheck.hasProfanity) {
    return {
      valid: false,
      errorTitle: 'Termo impróprio',
      error: 'O prazo informado contém termo impróprio ou ofensivo. Utilize períodos como "Esta semana", "Até sexta" ou "A combinar".',
      length: clean.length
    };
  }

  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);

  // 2. Bloqueio de termos troll / comidas / piadas (ex: "abacaxi", "banana", "pizza")
  for (const w of words) {
    if (isTrollWord(w)) {
      return {
        valid: false,
        errorTitle: 'Prazo não reconhecido',
        error: `O termo "${w}" não é válido como prazo. Informe quando você precisa do atendimento (ex: "Urgente", "Esta semana", "Em até 5 dias" ou "A combinar").`,
        length: clean.length
      };
    }
  }

  // 3. Comprimento mínimo e máximo
  if (clean.length < minLength) {
    return {
      valid: false,
      errorTitle: 'Prazo muito curto',
      error: `O prazo deve conter pelo menos ${minLength} caracteres (ex: "Hoje", "Esta semana", "A combinar").`,
      length: clean.length
    };
  }

  if (clean.length > maxLength) {
    return {
      valid: false,
      errorTitle: 'Prazo muito longo',
      error: `O prazo deve conter no máximo ${maxLength} caracteres.`,
      length: clean.length
    };
  }

  // 4. Repetição abusiva de caracteres no prazo
  if (/(.)\1{3,}/i.test(clean) || /(.{2,4})\1{2,}/i.test(clean)) {
    return {
      valid: false,
      errorTitle: 'Caracteres repetitivos',
      error: 'Evite repetições de letras no prazo informado.',
      length: clean.length
    };
  }

  // 5. Verificação de semântica temporal / prazo real
  const DEADLINE_TEMPORAL_STEMS = [
    'urgente', 'urgenc', 'imediato', 'imediat', 'rapido', 'quanto antes', 'possivel',
    'sem pressa', 'quando puder', 'dia', 'semana', 'mes', 'ano', 'hora', 'quinzen',
    'fim de semana', 'final de semana', 'feriad', 'segunda', 'terca', 'quarta', 'quinta',
    'sexta', 'sabado', 'domingo', 'hoje', 'amanha', 'ontem', 'proxim', 'nesta', 'neste',
    'nessa', 'nesse', 'esta', 'este', 'essa', 'esse', 'ate', 'dentro de', 'a partir',
    'combinar', 'combinad', 'negociar', 'acordo', 'flexivel', 'prestador', 'agenda',
    'horario', 'disponibil', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro', 'data', 'prazo'
  ];

  // Regex para padrões de data (ex: 15/10, 20/11/2026) ou horas/dias com números (ex: 2 dias, 24h, 48hrs)
  const hasDateOrNumericPattern = /\b\d{1,2}[\/\-\.]\d{1,2}\b/.test(clean) ||
    /\b\d+\s*(h|hrs|hr|horas|d|dias|sem|semanas|m|mes|meses)\b/i.test(clean) ||
    /\bdia\s+\d{1,2}\b/i.test(norm);

  const hasTemporalStem = DEADLINE_TEMPORAL_STEMS.some(stem => norm.includes(stem));

  if (!hasTemporalStem && !hasDateOrNumericPattern) {
    return {
      valid: false,
      errorTitle: 'Prazo não reconhecido',
      error: 'Informe um prazo ou período compreensível para o serviço (ex: "Urgente", "Esta semana", "Em até 5 dias", "Até sexta-feira" ou "A combinar").',
      length: clean.length
    };
  }

  return {
    valid: true,
    errorTitle: '',
    error: '',
    deadline: clean,
    length: clean.length
  };
}

/**
 * Sugestões Rápidas (Chips de 1 clique) para Avaliação de Atendimento
 */
export const REVIEW_SUGGESTION_CHIPS = [
  'Pontualidade britânica no horário marcado.',
  'Serviço impecável com ótimo acabamento!',
  'Preço justo e muito transparente no orçamento.',
  'Excelente comunicação e muito prestativo.',
  'Trabalho rápido, limpo e organizado.',
  'Superou minhas expectativas, recomendo a todos no Vale do Ivaí!',
  'Profissional de confiança, contratarei novamente com certeza.'
];

/**
 * Sugestões Rápidas (Chips de 1 clique) para Descrição de Solicitação de Serviço
 */
export const REQUEST_SUGGESTION_CHIPS = [
  'Preciso de uma visita no local para avaliação e orçamento detalhado.',
  'Serviço com urgência para execução ainda esta semana.',
  'Já possuo todos os materiais comprados, preciso apenas da mão de obra.',
  'Gostaria de saber se você emite nota fiscal ou recibo do serviço.',
  'Demanda residencial com horários flexíveis para atendimento.'
];

/**
 * Valores rápidos de orçamento para 1 clique
 */
export const QUICK_BUDGET_OPTIONS = [
  'A combinar',
  'R$ 150,00',
  'R$ 350,00',
  'R$ 750,00',
  'R$ 1.500,00',
  'R$ 2.500,00'
];

/**
 * Prazos rápidos de atendimento para 1 clique
 */
export const QUICK_DEADLINE_OPTIONS = [
  'Urgente (Hoje ou Amanhã)',
  'Esta semana',
  'Próximos 15 dias',
  'A combinar com o prestador'
];
