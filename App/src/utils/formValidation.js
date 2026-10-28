/**
 * Utilitários de Validação e Formatação de Formulários
 * Ivaí Conecta - Vale do Ivaí
 */

import {
  hasProfanity,
  detectProfanity,
  isTrollWord,
  validatePhoneNumber
} from '../services/jobTaxonomy.js';
import { cleanCNPJ, maskCNPJ, validateCNPJ } from '../services/cnpjService.js';

export { maskCNPJ, cleanCNPJ, validateCNPJ };

/**
 * Máscara de Telefone no padrão brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function maskPhone(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

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
  const hasDateOrNumericPattern = /\b\d{1,2}[/\-.]\d{1,2}\b/.test(clean) ||
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

/**
 * ═════════════════════════════════════════════════════════════════════
 * VALIDAÇÕES ESPECÍFICAS DE PERFIL DE EMPRESA (IVAÍ CONECTA)
 * ═════════════════════════════════════════════════════════════════════
 */

// Termos de deboche / zoeira / piada que nunca constituem atividade empresarial legítima
export const PURE_TROLL_WORDS = new Set([
  'zoeira', 'palhacada', 'palhaçada', 'piada', 'fofoca', 'besteira', 'bobagem',
  'mentira', 'fake', 'tinder', 'namoro', 'sexo', 'asdf', 'qwert', 'roncar', 'brincar',
  'preguica', 'preguiça', 'sono', 'troca', 'trouxa', 'babaca', 'troll'
]);

// Peças íntimas, underwear e termos de conotação sexual que não devem figurar como benefícios corporativos ou sem contexto formal
export const INTIMATE_UNDERWEAR_WORDS = new Set([
  'cueca', 'cuecas', 'calcinha', 'calcinhas', 'sutia', 'sutiã', 'sutias', 'sutiãs',
  'lingerie', 'lingeries', 'sunga', 'sungas', 'biquini', 'biquíni', 'biquinis', 'biquínis',
  'tanga', 'tangas', 'camisinha', 'camisinhas', 'preservativo', 'preservativos',
  'sexo', 'sexual', 'nudes', 'nude', 'pornografia', 'erotico', 'erótico', 'chifre', 'corno'
]);

// Substâncias, bebidas alcoólicas e fumo proibidos em benefícios corporativos
export const BLOCKED_BENEFIT_SUBSTANCES = new Set([
  'cerveja', 'cervejas', 'chopp', 'chope', 'pinga', 'cachaca', 'cachaça', 'vinho',
  'vinhos', 'vodka', 'whisky', 'whiskey', 'bebida', 'bebidas', 'alcolica', 'alcoólica',
  'alcool', 'álcool', 'maconha', 'drogas', 'droga', 'cigarro', 'cigarros', 'fumo',
  'tabaco', 'nargas', 'narguile'
]);

// Peças de vestuário comuns (que não são benefícios isolados a menos que sejam uniforme ou auxílio vestuário)
export const CLOTHING_ITEMS = new Set([
  'saia', 'saias', 'camiseta', 'camisetas', 'camisa', 'camisas', 'calca', 'calça',
  'calcas', 'calças', 'bermuda', 'bermudas', 'chinelo', 'chinelos', 'sapato', 'sapatos',
  'tenis', 'tênis', 'meia', 'meias', 'bone', 'boné'
]);

// Verbos comuns e predicados auxiliares em português usados em textos institucionais
export const PORTUGUESE_VERBS_AND_PREDICATES = new Set([
  'somos', 'sou', 'e', 'sao', 'era', 'eram', 'foi', 'fomos', 'estamos', 'esta', 'estao', 'estar', 'ser',
  'atua', 'atuar', 'atuamos', 'atuante', 'atuando',
  'trabalha', 'trabalhar', 'trabalhamos', 'trabalhando',
  'oferece', 'oferecer', 'oferecemos', 'oferecendo',
  'busca', 'buscar', 'buscamos', 'buscando',
  'desenvolve', 'desenvolver', 'desenvolvemos', 'desenvolvendo',
  'produz', 'produzir', 'produzimos', 'produzindo',
  'fabrica', 'fabricar', 'fabricamos', 'fabricando',
  'vende', 'vender', 'vendemos', 'vendendo',
  'comercializa', 'comercializar', 'comercializamos', 'comercializando',
  'presta', 'prestar', 'prestamos', 'prestando',
  'atende', 'atender', 'atendemos', 'atendendo',
  'cria', 'criar', 'criamos', 'criando',
  'fornece', 'fornecer', 'fornecemos', 'fornecendo',
  'garante', 'garantir', 'garantimos', 'garantindo',
  'visa', 'visar', 'visamos', 'visando',
  'tem', 'temos', 'tem', 'possuir', 'possui', 'possuimos',
  'foca', 'focar', 'focamos', 'focado', 'focada', 'focados', 'focando',
  'fundada', 'fundado', 'fundacao', 'iniciou', 'iniciada', 'iniciado', 'nasceu',
  'acredita', 'acreditamos',
  'valoriza', 'valorizamos',
  'promove', 'promover', 'promovemos',
  'ajuda', 'ajudar', 'ajudamos',
  'lidera', 'liderar', 'lideramos',
  'conecta', 'conectar', 'conectamos',
  'construir', 'construimos', 'transformar', 'transformamos',
  'gerar', 'gera', 'geramos',
  'entregar', 'entregamos',
  'fazer', 'fazemos', 'faz',
  'apresenta', 'apresentamos',
  'destaca', 'destacamos',
  'impulsionar', 'impulsiona', 'impulsionamos',
  'dedica', 'dedicamos', 'dedicada', 'dedicado',
  'comprometida', 'comprometido', 'compromisso'
]);

// Conectivos sintáticos (preposições, conjunções, artigos, pronomes)
export const PORTUGUESE_CONNECTORS = new Set([
  'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas',
  'para', 'pra', 'com', 'por', 'pelo', 'pela', 'pelos', 'pelas',
  'sob', 'sobre',
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'e', 'que', 'mas', 'ou', 'como', 'se', 'onde', 'quando',
  'nosso', 'nossa', 'nossos', 'nossas', 'seu', 'sua', 'seus', 'suas',
  'desde', 'ate', 'entre', 'sempre', 'mais', 'muito', 'muitos', 'muitas',
  'todos', 'todas', 'todo', 'toda', 'alem', 'ha', 'ja'
]);

// Vocabulário de conceitos institucionais / organizacionais
export const ORGANIZATIONAL_KEYWORDS = new Set([
  'empresa', 'organizacao', 'instituicao', 'corporacao',
  'negocio', 'comercio', 'industria', 'fabrica',
  'loja', 'mercado', 'setor', 'ramo', 'segmento', 'porte', 'marca',
  'equipe', 'time', 'colaboradores', 'profissionais', 'pessoas', 'talentos', 'trabalhador',
  'clientes', 'parceiros', 'fornecedores', 'consumidores',
  'qualidade', 'excelencia', 'solucoes', 'produtos', 'servicos',
  'missao', 'visao', 'valores', 'cultura', 'proposito',
  'objetivo', 'metas', 'historia', 'fundacao', 'tradicao',
  'inovacao', 'tecnologia', 'atendimento', 'anos', 'experiencia',
  'referencia', 'regiao', 'cidade', 'vale', 'ivai', 'parana',
  'brasil', 'etica', 'transparencia', 'respeito', 'compromisso',
  'sustentabilidade', 'crescimento', 'desenvolvimento', 'confianca', 'seguranca',
  'sociedade', 'comunidade', 'ambiente', 'colaboracao', 'bem-estar', 'foco'
]);

// Termos que são produtos, alimentos ou commodities agropecuárias
// Podem fazer parte de nomes compostos de empresas reais (ex: Hortifruti Abacaxi Ltda, Pizzaria Bella)
// ou de descrições de atividades comerciais ("trabalhamos com cultivo e venda de abacaxi..."),
// mas são rejeitados se digitados de forma isolada/solta como Razão Social ou Benefício.
export const FOOD_COMMODITY_WORDS = new Set([
  'abacaxi', 'banana', 'melancia', 'abacate', 'manga', 'mamao', 'mamão', 'laranja',
  'maca', 'maçã', 'uva', 'morango', 'kiwi', 'limao', 'limão', 'goiaba', 'pera', 'pêra',
  'pitanga', 'jabuticaba', 'maracuja', 'maracujá', 'melao', 'melão',
  'coxinha', 'pastel', 'pizza', 'churrasco', 'pipoca', 'hamburguer', 'hotdog',
  'cerveja', 'chopp', 'chope', 'pinga', 'cachaca', 'cachaça', 'vodka', 'vinho', 'whisky', 'energetico',
  'cigarro', 'fumo', 'sorvete', 'acai', 'açaí', 'salgado', 'biscoito', 'bolacha',
  'marmita', 'pao', 'pão', 'carne', 'peixe', 'frango', 'leite', 'queijo', 'cafe', 'café'
]);

/**
 * Detecta se o texto contém palavras puramente troll / deboche
 */
export function containsPureTrollWord(text) {
  if (!text || typeof text !== 'string') return { hasTroll: false };
  const lower = text.toLowerCase().trim();
  const norm = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (PURE_TROLL_WORDS.has(norm) || PURE_TROLL_WORDS.has(lower)) {
    return { hasTroll: true, matchedWord: lower };
  }

  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  for (const w of words) {
    if (PURE_TROLL_WORDS.has(w)) {
      return { hasTroll: true, matchedWord: w };
    }
  }

  return { hasTroll: false };
}

/**
 * Detecta se o texto contém peças íntimas ou termos inadequados
 */
export function containsIntimateWord(text) {
  if (!text || typeof text !== 'string') return { hasIntimate: false };
  const lower = text.toLowerCase().trim();
  const norm = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (INTIMATE_UNDERWEAR_WORDS.has(norm) || INTIMATE_UNDERWEAR_WORDS.has(lower)) {
    return { hasIntimate: true, matchedWord: lower };
  }

  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  for (const w of words) {
    if (INTIMATE_UNDERWEAR_WORDS.has(w)) {
      return { hasIntimate: true, matchedWord: w };
    }
  }

  return { hasIntimate: false };
}

/**
 * Detecta sequência de palavras soltas aleatórias (dump de substantivos desconexos sem verbo ou conectivo)
 */
export function detectRandomWordDump(text) {
  if (!text || typeof text !== 'string') return { isDump: false };
  const clean = text.trim();
  const lower = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = lower.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);

  if (words.length < 2) return { isDump: false };

  let verbCount = 0;
  let connectorCount = 0;
  let orgCount = 0;

  for (const w of words) {
    if (PORTUGUESE_VERBS_AND_PREDICATES.has(w)) verbCount++;
    if (PORTUGUESE_CONNECTORS.has(w)) connectorCount++;
    if (ORGANIZATIONAL_KEYWORDS.has(w)) orgCount++;
  }

  // 1. Caso sem verbo, sem conectivos sintáticos e sem vocabulário organizacional (ex: "cueca saia camiseta asas")
  if (verbCount === 0 && connectorCount === 0 && orgCount === 0) {
    return { isDump: true, reason: 'lista de palavras desconexas sem sintaxe' };
  }

  // 2. Três ou mais palavras onde não há NENHUM verbo e nem termos institucionais ancorando a frase
  if (words.length >= 3 && verbCount === 0 && orgCount === 0) {
    return { isDump: true, reason: 'ausência de verbo e propósito institucional' };
  }

  // 3. Quatro ou mais palavras onde não há verbos e o vocabulário organizacional é quase nulo
  if (words.length >= 4 && verbCount === 0 && orgCount < 2) {
    return { isDump: true, reason: 'estrutura frasal incompleta' };
  }

  return { isDump: false };
}

/**
 * Verifica se o texto é uma comida/fruta solta isolada sem contexto comercial
 */
export function isIsolatedFoodOrCommodity(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().trim();
  const norm = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);

  // Se tem apenas 1 palavra e é alimento/fruta
  if (words.length === 1 && (FOOD_COMMODITY_WORDS.has(words[0]) || isTrollWord(words[0]))) {
    return true;
  }
  return false;
}

/**
 * Detecta sequências aleatórias de teclado (keyboard mashing / gibberish)
 */
export function detectGibberish(text) {
  if (!text || typeof text !== 'string') return { isGibberish: false };
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const alphaOnly = lower.replace(/[^a-z0-9]/g, '');
  if (!alphaOnly) return { isGibberish: false };

  // Padrões de deslizar a mão no teclado
  const keyboardPatterns = [
    'asdfgh', 'qwerty', 'zxcvbn', 'poiuyt', 'lkjhgf', 'mnbvcx',
    '123456', 'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb', 'yuioph',
    'asdfg', 'qwert', 'zxcvb', 'poiuy', 'lkjhg', 'mnbvc',
    'wasdwasd', 'hjklhjkl', 'dfghjk', 'qwerqwer', 'asdfasdf'
  ];

  for (const pat of keyboardPatterns) {
    if (alphaOnly.includes(pat)) {
      return { isGibberish: true, pattern: pat };
    }
  }

  // Palavras com 4 ou mais consoantes seguidas sem nenhuma vogal
  const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    const letters = w.replace(/[^a-z]/g, '');
    if (letters.length >= 4 && !/[aeiouy]/.test(letters)) {
      return { isGibberish: true, pattern: w };
    }
    // Palavras individuais com mais de 28 caracteres sem espaçamento
    if (letters.length > 28) {
      return { isGibberish: true, pattern: 'palavra excessivamente longa' };
    }
  }

  return { isGibberish: false };
}

/**
 * Detecta repetições excessivas de uma mesma letra ou caracteres consecutivos (ex: "aaaaaa", "111111")
 */
export function detectCharRepetition(text, maxRepeat = 3) {
  if (!text || typeof text !== 'string') return false;
  const regex = new RegExp(`(.)\\1{${maxRepeat},}`, 'i');
  return regex.test(text);
}

/**
 * Detecta repetições consecutivas de palavras (ex: "empresa empresa", "teste teste")
 */
export function detectRepetitiveWords(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  // Duas ou mais repetições de palavras consecutivas
  if (/\b(\w{2,})\s+\1\b/i.test(clean)) {
    return true;
  }
  return false;
}

/**
 * Validação rigorosa de campos de texto de empresa (Razão Social, Nome Fantasia)
 */
export function validateCompanyText(val, {
  fieldName = 'Campo',
  min = 2,
  max = 80,
  required = true
} = {}) {
  if (!val || typeof val !== 'string' || !val.trim()) {
    if (required) {
      return { valid: false, error: `${fieldName} é obrigatório.` };
    }
    return { valid: true };
  }

  const clean = val.trim();

  if (clean.length < min) {
    return { valid: false, error: `${fieldName} deve conter no mínimo ${min} caracteres.` };
  }

  if (clean.length > max) {
    return { valid: false, error: `${fieldName} não pode exceder ${max} caracteres (atualmente ${clean.length}).` };
  }

  // 1. Palavras impróprias / ofensas (Tolerância Zero)
  const profCheck = detectProfanity(clean);
  if (profCheck.hasProfanity) {
    return {
      valid: false,
      error: `Termo impróprio ou ofensivo detectado em ${fieldName}. Mantenha a identidade corporativa profissional.`
    };
  }

  // 2. Termos puros de deboche / zoeira (Tolerância Zero)
  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return {
      valid: false,
      error: `O termo "${pureTroll.matchedWord}" não é aceito como ${fieldName}. Informe um nome corporativo legítimo.`
    };
  }

  // 3. Peças íntimas / conotação sexual ou vestuário isolado
  const intimate = containsIntimateWord(clean);
  if (intimate.hasIntimate) {
    const hasFormalTextileContext = /\b(confeccao|confecção|industria|indústria|fabrica|fábrica|loja|moda|vestuario|vestuário|textil|têxtil|comercio|comércio|ltda|s\/?a|me|epp|eireli)\b/i.test(clean);
    if (!hasFormalTextileContext || clean.split(/\s+/).length < 2) {
      return {
        valid: false,
        error: `O termo "${clean}" não é aceito como ${fieldName}. Para empresas de vestuário, informe a denominação corporativa completa (ex: Confecção de Moda Íntima Ltda).`
      };
    }
  }

  // 4. Peças de vestuário comuns isoladas (sem estrutura empresarial)
  const normClean = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanWords = normClean.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  if (cleanWords.length === 1 && CLOTHING_ITEMS.has(cleanWords[0])) {
    const cap = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    return {
      valid: false,
      error: `O termo "${clean}" isolado não é aceito como ${fieldName}. Informe a denominação comercial completa da empresa (ex: Loja de ${cap} Ltda, Confecção ${cap}).`
    };
  }

  // 5. Comidas / Frutas / Produtos ISOLADOS (sem estrutura empresarial)
  // Ex: se o usuário digitar apenas "abacaxi", "banana", "pizza" sem razão social ou nome composto
  if (isIsolatedFoodOrCommodity(clean)) {
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    return {
      valid: false,
      error: `O termo "${clean}" isolado não é aceito como ${fieldName}. Para empresas do ramo, informe a denominação comercial completa (ex: Hortifruti ${capitalized} Ltda, Comércio de ${capitalized}, ${capitalized} Express).`
    };
  }

  // 4. Nomes genéricos / fictícios
  const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (['teste', 'test', 'empresa teste', 'minha empresa', 'nome da empresa', 'fake', 'asdf', 'qualquer', 'exemplo'].includes(norm)) {
    return {
      valid: false,
      error: `Informe um nome corporativo legítimo e profissional para ${fieldName}.`
    };
  }

  // 5. Repetições abusivas de caracteres (ex: "aaaaaa")
  if (detectCharRepetition(clean, 3)) {
    return {
      valid: false,
      error: `${fieldName} contém repetições excessivas de caracteres (ex: "aaaa").`
    };
  }

  // 6. Sequências aleatórias de teclado (ex: "asdfgh")
  const gibberish = detectGibberish(clean);
  if (gibberish.isGibberish) {
    return {
      valid: false,
      error: `${fieldName} contém caracteres aleatórios ou sequência de teclado não permitida.`
    };
  }

  // 7. Repetições de palavras (ex: "empresa empresa")
  if (detectRepetitiveWords(clean)) {
    return {
      valid: false,
      error: `Evite repetir palavras consecutivas em ${fieldName}.`
    };
  }

  // 8. Deve conter pelo menos letras legíveis (evita símbolos e números puros)
  const letters = clean.replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, '');
  if (letters.length < min) {
    return {
      valid: false,
      error: `${fieldName} deve conter letras alfabéticas legíveis.`
    };
  }

  return { valid: true };
}

/**
 * Validação rigorosa de CNPJ (com máscara e cálculo dos dígitos oficiais da Receita Federal)
 */
export function validateCompanyCNPJField(cnpj, required = true) {
  if (!cnpj || typeof cnpj !== 'string' || !cnpj.trim()) {
    if (required) {
      return { valid: false, error: 'O CNPJ da empresa é obrigatório.' };
    }
    return { valid: true };
  }

  const digits = cleanCNPJ(cnpj);
  if (digits.length !== 14) {
    return {
      valid: false,
      error: `O CNPJ deve conter exatamente 14 dígitos numéricos (atualmente com ${digits.length}).`
    };
  }

  if (!validateCNPJ(digits)) {
    return {
      valid: false,
      error: 'CNPJ inválido (dígitos verificadores incorretos segundo o cálculo da Receita Federal).'
    };
  }

  return { valid: true, cleanDigits: digits, formatted: maskCNPJ(digits) };
}

/**
 * Validação de Ano de Fundação
 */
export function validateFoundedYear(year, required = false) {
  if (!year || (typeof year === 'string' && !year.trim())) {
    if (required) {
      return { valid: false, error: 'O ano de fundação é obrigatório.' };
    }
    return { valid: true };
  }

  const str = String(year).trim();
  if (!/^\d{4}$/.test(str)) {
    return { valid: false, error: 'O ano de fundação deve conter exatamente 4 dígitos numéricos (ex: 2018).' };
  }

  const num = parseInt(str, 10);
  const currentYear = new Date().getFullYear();

  if (num < 1800) {
    return { valid: false, error: 'O ano de fundação deve ser a partir de 1800.' };
  }

  if (num > currentYear) {
    return { valid: false, error: `O ano de fundação não pode ser superior ao ano atual (${currentYear}).` };
  }

  return { valid: true, year: num };
}

/**
 * Validação rigorosa de textos institucionais longos (Sobre a Organização, Missão/Cultura)
 */
export function validateCompanyInstitutionalText(text, {
  fieldName = 'Texto institucional',
  min = 20,
  max = 3000,
  required = false
} = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    if (required) {
      return { valid: false, error: `${fieldName} é obrigatório.` };
    }
    return { valid: true };
  }

  const clean = text.trim();

  if (clean.length < min) {
    return {
      valid: false,
      error: `${fieldName} está muito curto. Escreva pelo menos ${min} caracteres detalhando a organização.`
    };
  }

  if (clean.length > max) {
    return {
      valid: false,
      error: `${fieldName} atingiu o limite de ${max} caracteres (atualmente ${clean.length}).`
    };
  }

  // 1. Anti-profanidade rigorosa (bloqueia "cu", "merda", etc.)
  const profCheck = detectProfanity(clean);
  if (profCheck.hasProfanity) {
    return {
      valid: false,
      error: `Identificamos linguagem imprópria ou inadequada em ${fieldName}. Por favor, mantenha uma apresentação corporativa e profissional.`
    };
  }

  // 2. Termos puros de deboche / zoeira (ex: "zoeira", "fofoca", "palhaçada")
  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return {
      valid: false,
      error: `O termo "${pureTroll.matchedWord}" é inadequado para ${fieldName}. Descreva informações profissionais da empresa.`
    };
  }

  // 3. Peças íntimas / conotação sexual (ex: cueca, calcinha, sutiã, sunga)
  const intimate = containsIntimateWord(clean);
  if (intimate.hasIntimate) {
    const hasTextileContext = /\b(confeccao|confecção|textil|têxtil|moda|vestuario|vestuário|roupas|loja|fabrica|fábrica|fabricacao|fabricação|varejo|atacado|industria|indústria)\b/i.test(clean);
    if (!hasTextileContext) {
      return {
        valid: false,
        error: `Identificamos linguagem informal ou inadequada ("${intimate.matchedWord}"). Para empresas têxteis e de confecção, redija a apresentação formalmente (ex: "Confecção especializada em moda íntima e vestuário").`
      };
    }
  }

  // 4. Detecção de palavras soltas aleatórias (dump de substantivos desconexos sem verbo ou sintaxe frasal)
  const wordDump = detectRandomWordDump(clean);
  if (wordDump.isDump) {
    return {
      valid: false,
      error: `O texto em ${fieldName} parece conter apenas palavras soltas aleatórias sem estrutura de frase. Por favor, redija uma descrição completa sobre a empresa (ex: 'Somos uma organização atuante no setor de...').`
    };
  }

  // 5. Repetições excessivas de caracteres (ex: "aaaaaa")
  if (detectCharRepetition(clean, 4)) {
    return {
      valid: false,
      error: `${fieldName} contém repetições excessivas de caracteres. Descreva sua empresa com clareza.`
    };
  }

  // 6. Sequências aleatórias de teclado (ex: "asdfgh")
  const gibberish = detectGibberish(clean);
  if (gibberish.isGibberish) {
    return {
      valid: false,
      error: `${fieldName} contém sequências de caracteres aleatórios ou digitação desordenada.`
    };
  }

  // 7. Repetições consecutivas de palavras (ex: "empresa empresa empresa")
  if (detectRepetitiveWords(clean)) {
    return {
      valid: false,
      error: `Evite repetições consecutivas de palavras idênticas em ${fieldName}.`
    };
  }

  // 8. Mínimo de palavras com sentido (pelo menos 3 palavras reais)
  const realWords = clean.split(/\s+/).filter(w => /[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]{2,}/.test(w));
  if (realWords.length < 3) {
    return {
      valid: false,
      error: `${fieldName} deve conter pelo menos 3 palavras reais descrevendo as atividades da empresa.`
    };
  }

  return { valid: true };
}

/**
 * Validação de URL (Website, Portfólio, Capa, Logotipo)
 */
export function validateCompanyUrl(url, {
  fieldName = 'Website Oficial',
  required = false
} = {}) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    if (required) {
      return { valid: false, error: `${fieldName} é obrigatório.` };
    }
    return { valid: true };
  }

  const clean = url.trim();

  // Não pode ter espaços
  if (/\s/.test(clean)) {
    return { valid: false, error: `${fieldName} não pode conter espaços.` };
  }

  // Bloqueio de profanidade
  if (hasProfanity(clean)) {
    return { valid: false, error: `${fieldName} contém termos impróprios.` };
  }

  // Permite data: ou blob: caso seja imagem interna/preview
  if (/^(data:image\/|blob:)/i.test(clean)) {
    return { valid: true };
  }

  // Bloqueio de termos puros de zoeira no website
  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return {
      valid: false,
      error: `A URL de ${fieldName} contém termo inadequado ("${pureTroll.matchedWord}").`
    };
  }

  // Bloqueio de placeholders de exemplo
  const lower = clean.toLowerCase();
  if (['https://suaempresa.com.br', 'http://suaempresa.com.br', 'suaempresa.com.br', 'www.suaempresa.com.br', 'teste.com', 'exemplo.com'].some(p => lower === p || lower.startsWith(p + '/'))) {
    return {
      valid: false,
      error: 'Informe o website real da empresa, evitando endereços genéricos de exemplo.'
    };
  }

  // Validação de formato de URL ou domínio na web
  // Exige domínio estruturado com extensão de pelo menos 2 letras (ex: .com, .com.br, .ind.br, .org, .tech, .io)
  const urlPattern = /^(https?:\/\/)?((www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|localhost)(:\d{1,5})?(\/[^\s]*)?$/i;
  if (!urlPattern.test(clean)) {
    return {
      valid: false,
      error: `Informe um endereço web válido para ${fieldName} (ex: https://suaempresa.com.br ou www.suaempresa.com.br).`
    };
  }

  // Extrai hostname e verifica gibberish no domínio
  const hostMatch = clean.replace(/^(https?:\/\/)?(www\.)?/i, '').split(/[/?#:]/)[0];
  const gibberish = detectGibberish(hostMatch);
  if (gibberish.isGibberish) {
    return {
      valid: false,
      error: `O domínio do ${fieldName} parece conter caracteres aleatórios ou digitação desordenada.`
    };
  }

  return { valid: true };
}

/**
 * Validação de E-mail de Recrutamento / RH
 */
export function validateCompanyEmail(email, { required = false } = {}) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (required) {
      return { valid: false, error: 'O e-mail de recrutamento/contato é obrigatório.' };
    }
    return { valid: true };
  }

  const clean = email.trim().toLowerCase();

  if (/\s/.test(clean)) {
    return { valid: false, error: 'O e-mail não pode conter espaços.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'O e-mail informado contém termos impróprios.' };
  }

  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return {
      valid: false,
      error: `O e-mail contém termo inadequado ("${pureTroll.matchedWord}"). Informe um e-mail corporativo válido.`
    };
  }

  // Placeholders
  if (['rh@suaempresa.com.br', 'contato@suaempresa.com.br', 'teste@teste.com', 'email@email.com'].includes(clean)) {
    return {
      valid: false,
      error: 'Informe um e-mail real de contato da sua empresa, evitando e-mails de exemplo.'
    };
  }

  // Regex de e-mail corporativo válido com domínio e TLD de 2+ letras
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return {
      valid: false,
      error: 'Informe um e-mail válido (ex: rh@suaempresa.com.br).'
    };
  }

  return { valid: true };
}

/**
 * Validação de LinkedIn Corporativo
 */
export function validateCompanyLinkedIn(linkedin, { required = false } = {}) {
  if (!linkedin || typeof linkedin !== 'string' || !linkedin.trim()) {
    if (required) {
      return { valid: false, error: 'O perfil do LinkedIn é obrigatório.' };
    }
    return { valid: true };
  }

  const clean = linkedin.trim();

  if (/\s/.test(clean)) {
    return { valid: false, error: 'O link do LinkedIn não pode conter espaços.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'O link do LinkedIn contém termos impróprios.' };
  }

  // Deve ser estritamente uma URL ou identificador do LinkedIn
  // Aceita:
  // - https://www.linkedin.com/company/sua-empresa
  // - https://linkedin.com/company/sua-empresa
  // - https://linkedin.com/in/sua-empresa
  // - linkedin.com/company/sua-empresa
  // - company/sua-empresa
  const linkedInPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(company|in|school|showcase)\/([a-zA-Z0-9-_.%]+)\/?(\?.*)?$/i;
  const shortPattern = /^(company|in|school|showcase)\/([a-zA-Z0-9-_.%]+)\/?$/i;

  const matchFull = clean.match(linkedInPattern);
  const matchShort = clean.match(shortPattern);

  if (!matchFull && !matchShort) {
    return {
      valid: false,
      error: 'Informe um link oficial do LinkedIn de empresa (ex: https://linkedin.com/company/sua-empresa). URLs de outros sites não são aceitas.'
    };
  }

  const slug = matchFull ? matchFull[4] : matchShort[2];

  if (!slug || slug.length < 2) {
    return { valid: false, error: 'Link do LinkedIn incompleto. Informe a identificação da empresa.' };
  }

  // Bloqueio de termos puros de zoeira no LinkedIn
  const pureTroll = containsPureTrollWord(slug);
  if (pureTroll.hasTroll) {
    return {
      valid: false,
      error: `O link do LinkedIn contém termo inválido ("${pureTroll.matchedWord}").`
    };
  }

  // Bloqueio de placeholders
  if (['sua-empresa', 'suaempresa', 'empresa', 'exemplo', 'teste'].includes(slug.toLowerCase())) {
    return {
      valid: false,
      error: 'Informe o link real do LinkedIn da sua empresa.'
    };
  }

  return { valid: true };
}

/**
 * Validação de Instagram Corporativo
 */
export function validateCompanyInstagram(instagram, { required = false } = {}) {
  if (!instagram || typeof instagram !== 'string' || !instagram.trim()) {
    if (required) {
      return { valid: false, error: 'O perfil do Instagram é obrigatório.' };
    }
    return { valid: true };
  }

  const clean = instagram.trim();

  if (/\s/.test(clean)) {
    return { valid: false, error: 'O Instagram não pode conter espaços.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'O perfil do Instagram contém termos impróprios.' };
  }

  let username = clean;

  // Se o usuário digitou uma URL (contém http, https, www, .com, .br ou /)
  const isUrlLike = /^(https?:\/\/|www\.)|(\.com|\.br|\/)/i.test(clean);

  if (isUrlLike) {
    // DEVE ser estritamente do domínio instagram.com!
    const instagramUrlPattern = /^(https?:\/\/)?(www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?(\?.*)?$/i;
    const match = clean.match(instagramUrlPattern);

    if (!match) {
      return {
        valid: false,
        error: 'O link informado deve ser do Instagram (ex: https://instagram.com/suaempresa). URLs de outros sites ou links aleatórios não são aceitos.'
      };
    }

    username = match[3];
  } else {
    // Se digitou como usuário
    if (username.startsWith('@')) {
      username = username.slice(1);
    }

    // Se ainda restou caractere de URL, domínio ou formato inválido
    if (/[/:.?#]/.test(username)) {
      return {
        valid: false,
        error: 'Digite apenas o usuário do Instagram (ex: @suaempresa) ou a URL completa (https://instagram.com/suaempresa).'
      };
    }
  }

  if (!username) {
    return { valid: false, error: 'Informe um nome de usuário do Instagram válido (ex: @suaempresa).' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'O nome de usuário do Instagram pode ter no máximo 30 caracteres.' };
  }

  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return { valid: false, error: 'O Instagram só pode conter letras, números, pontos e sublinhados (_).' };
  }

  if (username.includes('..') || username.startsWith('.') || username.endsWith('.')) {
    return { valid: false, error: 'Nome de usuário do Instagram não pode ter pontos consecutivos nem iniciar/terminar com ponto.' };
  }

  // Bloqueio de termos puros de zoeira no Instagram
  const pureTroll = containsPureTrollWord(username);
  if (pureTroll.hasTroll) {
    return {
      valid: false,
      error: `O perfil "@${username}" contém termo inválido ("${pureTroll.matchedWord}"). Informe o perfil oficial da sua empresa.`
    };
  }

  // Bloqueio de gibberish no Instagram
  const gibberish = detectGibberish(username);
  if (gibberish.isGibberish) {
    return {
      valid: false,
      error: 'O perfil do Instagram parece conter caracteres aleatórios ou digitação desordenada.'
    };
  }

  // Bloqueio de placeholders
  if (['suaempresa', 'minhaempresa', 'empresa', 'username', 'perfil', 'instagram', 'teste'].includes(username.toLowerCase())) {
    return {
      valid: false,
      error: 'Informe o perfil real do Instagram da empresa, evitando perfis genéricos ou de exemplo.'
    };
  }

  return { valid: true, cleanUsername: `@${username}` };
}

/**
 * Validação de item individual de Benefício
 */
export function validateCompanyBenefitItem(benefit, existingBenefits = []) {
  if (!benefit || typeof benefit !== 'string' || !benefit.trim()) {
    return { valid: false, error: 'Digite o nome do benefício para adicionar.' };
  }

  const clean = benefit.trim();

  if (clean.length < 2) {
    return { valid: false, error: 'O benefício deve conter pelo menos 2 caracteres.' };
  }

  if (clean.length > 50) {
    return { valid: false, error: 'O benefício deve ter no máximo 50 caracteres.' };
  }

  // 1. Anti-profanidade
  if (hasProfanity(clean)) {
    return { valid: false, error: 'Termo impróprio ou ofensivo não permitido como benefício.' };
  }

  // 2. Termos íntimos / roupas íntimas / sexo (ex: cueca, calcinha, sutiã, sunga)
  const intimate = containsIntimateWord(clean);
  if (intimate.hasIntimate) {
    return {
      valid: false,
      error: `O termo "${intimate.matchedWord}" não constitui um benefício corporativo para colaboradores.`
    };
  }

  // 3. Bebidas alcoólicas, drogas, fumo, substâncias
  const lower = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = lower.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (BLOCKED_BENEFIT_SUBSTANCES.has(w)) {
      return {
        valid: false,
        error: `Benefícios corporativos não podem incluir bebidas alcoólicas, fumo ou termos informais ("${w}").`
      };
    }
  }

  // 4. Termos puros de deboche / zoeira
  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return {
      valid: false,
      error: `O termo "${pureTroll.matchedWord}" não representa um benefício profissional para colaboradores.`
    };
  }

  // 5. Peças isoladas de vestuário não são benefícios (a menos que seja uniforme, auxílio vestuário ou dress code)
  for (const w of words) {
    if (CLOTHING_ITEMS.has(w)) {
      const hasFormalUniformContext = /\b(uniforme|vestuario|vestuário|dress\s*code)\b/i.test(clean);
      if (!hasFormalUniformContext) {
        return {
          valid: false,
          error: `Peças de vestuário específicas ("${w}") não são benefícios de RH. Utilize formatos como "Uniforme Gratuito", "Auxílio Vestuário" ou "Dress Code Casual".`
        };
      }
    }
  }

  // 6. Alimentos / Commodities (ex: pizza, pastel, coxinha, abacaxi, etc.)
  const isNutritionPerk = /\b(cesta\s+(basica|básica|alimentos|natal|frutas)|frutas\s+no\s+escritorio|frutas\s+no\s+escritório|cafe\s+da\s+manha|café\s+da\s+manhã|cafe\s+da\s+tarde|café\s+da\s+tarde|refeitorio|refeitório|almoco|almoço|lanche)\b/i.test(clean);
  for (const w of words) {
    if (FOOD_COMMODITY_WORDS.has(w) && !isNutritionPerk) {
      return {
        valid: false,
        error: `O item "${w}" não é aceito como benefício individual. Para alimentação, utilize formatos padronizados de RH como "Vale Alimentação", "Vale Refeição", "Cesta Básica" ou "Refeitório no Local".`
      };
    }
  }

  // 7. Validação de prefixos estruturados: "plano de ...", "seguro de ..."
  if (/^plano\s+de\s+/i.test(clean)) {
    const afterPlano = lower.replace(/^plano\s+de\s+/i, '').trim();
    const VALID_PLANO_TERMS = [
      'saude', 'saúde', 'odontologico', 'odontológico', 'medico', 'médico',
      'carreira', 'cargos', 'salarios', 'salários', 'previdencia', 'previdência',
      'beneficios', 'benefícios', 'metas', 'desenvolvimento', 'estudos', 'academia', 'vida'
    ];
    const isRecognized = VALID_PLANO_TERMS.some(t => afterPlano.includes(t));
    if (!isRecognized) {
      return {
        valid: false,
        error: `O benefício "${clean}" não é aceito. Planos corporativos devem se referir a formatos padrão (ex: "Plano de Saúde", "Plano Odontológico", "Plano de Carreira" ou "Plano de Previdência").`
      };
    }
  }

  if (/^seguro\s+de\s+/i.test(clean)) {
    const afterSeguro = lower.replace(/^seguro\s+de\s+/i, '').trim();
    const VALID_SEGURO_TERMS = ['vida', 'acidentes', 'saude', 'saúde', 'viagem'];
    const isRecognized = VALID_SEGURO_TERMS.some(t => afterSeguro.includes(t));
    if (!isRecognized) {
      return {
        valid: false,
        error: `Seguros corporativos devem se referir a "Seguro de Vida", "Seguro de Acidentes Pessoais", etc.`
      };
    }
  }

  // 8. Gibberish / Repetições
  if (detectCharRepetition(clean, 3)) {
    return { valid: false, error: 'O benefício contém repetições excessivas de caracteres.' };
  }

  const gibberish = detectGibberish(clean);
  if (gibberish.isGibberish) {
    return { valid: false, error: 'O benefício contém caracteres aleatórios.' };
  }

  // 9. Duplicatas
  const isDuplicate = existingBenefits.some(b => b.toLowerCase().trim() === clean.toLowerCase().trim());
  if (isDuplicate) {
    return { valid: false, error: 'Este benefício já foi adicionado à lista.' };
  }

  return { valid: true, benefit: clean };
}

/**
 * Validação completa do Perfil da Empresa (todos os campos)
 */
export function validateCompanyProfileForm(data) {
  const errors = {};

  // Aba 'info' (Dados da Empresa)
  const nameCheck = validateCompanyText(data.name, {
    fieldName: 'Razão Social',
    min: 3,
    max: 100,
    required: true
  });
  if (!nameCheck.valid) errors.name = nameCheck.error;

  const tradingNameCheck = validateCompanyText(data.tradingName, {
    fieldName: 'Nome Fantasia',
    min: 2,
    max: 70,
    required: true
  });
  if (!tradingNameCheck.valid) errors.tradingName = tradingNameCheck.error;

  const cnpjCheck = validateCompanyCNPJField(data.cnpj, true);
  if (!cnpjCheck.valid) errors.cnpj = cnpjCheck.error;

  if (!data.city || !data.city.trim()) {
    errors.city = 'A Cidade Polo de atuação é obrigatória.';
  }

  if (!data.industry || !data.industry.trim()) {
    errors.industry = 'O Setor de Atuação Principal é obrigatório.';
  }

  if (data.foundedYear) {
    const yearCheck = validateFoundedYear(data.foundedYear, false);
    if (!yearCheck.valid) errors.foundedYear = yearCheck.error;
  }

  // Aba 'culture' (Cultura & Benefícios)
  if (data.description) {
    const descCheck = validateCompanyInstitutionalText(data.description, {
      fieldName: 'Sobre a Organização',
      min: 30,
      max: 3000,
      required: false
    });
    if (!descCheck.valid) errors.description = descCheck.error;
  }

  if (data.culture) {
    const cultCheck = validateCompanyInstitutionalText(data.culture, {
      fieldName: 'Missão, Visão e Cultura',
      min: 20,
      max: 2000,
      required: false
    });
    if (!cultCheck.valid) errors.culture = cultCheck.error;
  }

  // Validação dos Benefícios já inseridos
  if (Array.isArray(data.benefits) && data.benefits.length > 0) {
    for (const b of data.benefits) {
      const bCheck = validateCompanyBenefitItem(b);
      if (!bCheck.valid) {
        errors.benefits = `O benefício "${b}" é inválido: ${bCheck.error}`;
        break;
      }
    }
  }

  // Aba 'contact' (Contato & Redes)
  if (data.website) {
    const webCheck = validateCompanyUrl(data.website, { fieldName: 'Website Oficial' });
    if (!webCheck.valid) errors.website = webCheck.error;
  }

  if (data.email) {
    const emailCheck = validateCompanyEmail(data.email);
    if (!emailCheck.valid) errors.email = emailCheck.error;
  }

  if (data.linkedin) {
    const linkedCheck = validateCompanyLinkedIn(data.linkedin);
    if (!linkedCheck.valid) errors.linkedin = linkedCheck.error;
  }

  if (data.instagram) {
    const instaCheck = validateCompanyInstagram(data.instagram);
    if (!instaCheck.valid) errors.instagram = instaCheck.error;
  }

  if (data.phone) {
    const phoneCheck = validatePhoneNumber(data.phone, false);
    if (!phoneCheck.valid) errors.phone = phoneCheck.error;
  }

  // Aba 'branding' (Imagens & Capa)
  if (data.coverImage && !/^(data:|blob:|https?:\/\/)/i.test(data.coverImage)) {
    const coverCheck = validateCompanyUrl(data.coverImage, { fieldName: 'Imagem de Capa' });
    if (!coverCheck.valid) errors.coverImage = coverCheck.error;
  }

  if (data.avatar && !/^(data:|blob:|https?:\/\/)/i.test(data.avatar)) {
    const avatarCheck = validateCompanyUrl(data.avatar, { fieldName: 'Logotipo' });
    if (!avatarCheck.valid) errors.avatar = avatarCheck.error;
  }

  // Determina a primeira aba com erro para direcionar o usuário
  let firstErrorTab = null;
  const errorKeys = Object.keys(errors);
  if (errorKeys.length > 0) {
    const infoFields = ['name', 'tradingName', 'cnpj', 'city', 'industry', 'foundedYear'];
    const cultureFields = ['description', 'culture', 'benefits'];
    const contactFields = ['website', 'email', 'linkedin', 'instagram', 'phone'];
    const brandingFields = ['coverImage', 'avatar'];

    if (errorKeys.some(k => infoFields.includes(k))) {
      firstErrorTab = 'info';
    } else if (errorKeys.some(k => cultureFields.includes(k))) {
      firstErrorTab = 'culture';
    } else if (errorKeys.some(k => contactFields.includes(k))) {
      firstErrorTab = 'contact';
    } else if (errorKeys.some(k => brandingFields.includes(k))) {
      firstErrorTab = 'branding';
    }
  }

  return {
    isValid: errorKeys.length === 0,
    errors,
    firstErrorTab,
    firstErrorKey: errorKeys[0] || null
  };
}

/**
 * ═════════════════════════════════════════════════════════════════════
 * VALIDAÇÕES DE CONFIGURAÇÕES DE CONTA & PERFIL (CONFIGURACOES.JSX)
 * ═════════════════════════════════════════════════════════════════════
 */

/**
 * Validação de Nome de Pessoa Física (Candidato, Aluno, Freelancer, Docente)
 */
export function validatePersonName(name, { min = 3, max = 70, required = true } = {}) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    if (required) return { valid: false, error: 'O nome completo é obrigatório.' };
    return { valid: true };
  }

  const clean = name.trim();

  if (clean.length < min) {
    return { valid: false, error: `O nome deve conter pelo menos ${min} caracteres.` };
  }

  if (clean.length > max) {
    return { valid: false, error: `O nome deve conter no máximo ${max} caracteres.` };
  }

  // 1. Termo impróprio / ofensas
  if (hasProfanity(clean)) {
    return { valid: false, error: 'Termo impróprio ou ofensivo não permitido no nome.' };
  }

  // 2. Peças íntimas / termos sexuais (ex: "cueca", "calcinha")
  const intimate = containsIntimateWord(clean);
  if (intimate.hasIntimate) {
    return { valid: false, error: `Termo inadequado detectado ("${intimate.matchedWord}"). Informe seu nome verdadeiro.` };
  }

  // 3. Termos puros de zoeira / deboche
  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return { valid: false, error: `O termo "${pureTroll.matchedWord}" não é aceito como nome.` };
  }

  // 4. Repetições excessivas
  if (detectCharRepetition(clean, 3)) {
    return { valid: false, error: 'O nome contém repetições excessivas de caracteres.' };
  }

  // 5. Gibberish / digitação desordenada
  const gib = detectGibberish(clean);
  if (gib.isGibberish) {
    return { valid: false, error: 'O nome contém caracteres aleatórios ou digitação desordenada.' };
  }

  // 6. Deve conter pelo menos duas palavras (Nome e Sobrenome)
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return { valid: false, error: 'Por favor, informe seu nome completo (nome e sobrenome).' };
  }

  // 7. Alimentos ou commodities como nomes próprios
  for (const w of words) {
    const normW = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (FOOD_COMMODITY_WORDS.has(normW)) {
      return { valid: false, error: `O termo "${w}" não é aceito como nome de pessoa.` };
    }
  }

  // 8. Deve conter apenas letras, acentos, espaços, hífens ou apóstrofos
  if (!/^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s'-]+$/.test(clean)) {
    return { valid: false, error: 'O nome deve conter apenas letras do alfabeto.' };
  }

  return { valid: true };
}

/**
 * Validação de Nome / Razão Social na página de configurações
 * Trata o papel da conta: 'empresa' (Razão Social) vs pessoa física (Nome Completo)
 */
export function validateAccountName(name, role = 'candidato') {
  if (role === 'empresa') {
    return validateCompanyText(name, {
      fieldName: 'Razão Social / Nome Oficial',
      min: 3,
      max: 100,
      required: true
    });
  }
  return validatePersonName(name, {
    min: 3,
    max: 70,
    required: true
  });
}

/**
 * Validação de E-mail de Acesso na página de configurações
 */
export function validateAccountEmail(email, { required = true } = {}) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (required) return { valid: false, error: 'O e-mail de acesso é obrigatório.' };
    return { valid: true };
  }

  const clean = email.trim().toLowerCase();

  if (/\s/.test(clean)) {
    return { valid: false, error: 'O e-mail não pode conter espaços.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'O e-mail informado contém termos impróprios.' };
  }

  const intimate = containsIntimateWord(clean);
  if (intimate.hasIntimate) {
    return { valid: false, error: `O e-mail contém termo inadequado ("${intimate.matchedWord}").` };
  }

  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return { valid: false, error: `O e-mail contém termo inválido ("${pureTroll.matchedWord}").` };
  }

  const placeholders = ['teste@teste.com', 'email@email.com', 'exemplo@exemplo.com', 'seuemail@email.com', 'admin@admin.com'];
  if (placeholders.includes(clean)) {
    return { valid: false, error: 'Informe um endereço de e-mail real e ativo.' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: 'Informe um e-mail válido (ex: seu.nome@email.com).' };
  }

  return { valid: true };
}

/**
 * Validação de LinkedIn de Usuário ou Empresa em Configurações
 */
export function validateAccountLinkedIn(linkedin, { required = false } = {}) {
  if (!linkedin || typeof linkedin !== 'string' || !linkedin.trim()) {
    if (required) return { valid: false, error: 'O perfil do LinkedIn é obrigatório.' };
    return { valid: true };
  }

  const clean = linkedin.trim();

  if (/\s/.test(clean)) {
    return { valid: false, error: 'O link do LinkedIn não pode conter espaços.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'O link do LinkedIn contém termos impróprios.' };
  }

  const intimate = containsIntimateWord(clean);
  if (intimate.hasIntimate) {
    return { valid: false, error: `O link do LinkedIn contém termo inadequado ("${intimate.matchedWord}").` };
  }

  const isUrlLike = /^(https?:\/\/|www\.)|(\.com|\.br|\/)/i.test(clean);
  let slug = clean;

  if (isUrlLike) {
    const linkedInPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company|school|showcase)\/([a-zA-Z0-9-_.%]+)\/?(\?.*)?$/i;
    const shortPattern = /^(in|company|school|showcase)\/([a-zA-Z0-9-_.%]+)\/?$/i;

    const matchFull = clean.match(linkedInPattern);
    const matchShort = clean.match(shortPattern);

    if (!matchFull && !matchShort) {
      return {
        valid: false,
        error: 'Informe uma URL oficial do LinkedIn (ex: https://linkedin.com/in/seu-nome). Links de outros sites não são aceitos.'
      };
    }
    slug = matchFull ? matchFull[4] : matchShort[2];
  } else {
    if (slug.startsWith('@')) slug = slug.slice(1);
    if (/[/:.?#]/.test(slug)) {
      return {
        valid: false,
        error: 'Digite apenas o usuário do LinkedIn ou a URL completa (https://linkedin.com/in/seu-nome).'
      };
    }
  }

  if (!slug || slug.length < 2) {
    return { valid: false, error: 'Identificador do LinkedIn incompleto.' };
  }

  const pureTroll = containsPureTrollWord(slug);
  if (pureTroll.hasTroll) {
    return { valid: false, error: `O perfil do LinkedIn contém termo inválido ("${pureTroll.matchedWord}").` };
  }

  const placeholders = ['seu-perfil', 'seuperfil', 'sua-empresa', 'suaempresa', 'usuario', 'username', 'exemplo', 'teste'];
  if (placeholders.includes(slug.toLowerCase())) {
    return { valid: false, error: 'Informe o link real do seu perfil no LinkedIn, evitando endereços de exemplo.' };
  }

  const gibberish = detectGibberish(slug);
  if (gibberish.isGibberish) {
    return { valid: false, error: 'O identificador do LinkedIn parece conter caracteres aleatórios.' };
  }

  return { valid: true };
}

/**
 * Validação de GitHub ou Portfólio em Configurações
 */
export function validateAccountGitHubOrPortfolio(val, { required = false } = {}) {
  if (!val || typeof val !== 'string' || !val.trim()) {
    if (required) return { valid: false, error: 'O link do GitHub ou portfólio é obrigatório.' };
    return { valid: true };
  }

  const clean = val.trim();

  if (/\s/.test(clean)) {
    return { valid: false, error: 'O endereço não pode conter espaços.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'O endereço contém termos impróprios.' };
  }

  const intimate = containsIntimateWord(clean);
  if (intimate.hasIntimate) {
    return { valid: false, error: `O endereço contém termo inadequado ("${intimate.matchedWord}").` };
  }

  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return { valid: false, error: `O endereço contém termo inválido ("${pureTroll.matchedWord}").` };
  }

  const placeholders = [
    'https://github.com/seu-usuario', 'http://github.com/seu-usuario', 'github.com/seu-usuario',
    'seu-usuario', 'seuusuario', 'usuario', 'username', 'exemplo', 'teste'
  ];
  if (placeholders.some(p => clean.toLowerCase() === p || clean.toLowerCase() === `${p}/`)) {
    return { valid: false, error: 'Informe o link real do seu perfil no GitHub ou portfólio, evitando endereços de exemplo.' };
  }

  const githubPattern = /^(https?:\/\/)?(www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\/?$/i;
  const matchGithub = clean.match(githubPattern);

  if (matchGithub) {
    const user = matchGithub[3];
    if (['seu-usuario', 'seuusuario', 'username', 'usuario'].includes(user.toLowerCase())) {
      return { valid: false, error: 'Informe o usuário real da sua conta no GitHub.' };
    }
    const gib = detectGibberish(user);
    if (gib.isGibberish) {
      return { valid: false, error: 'O usuário do GitHub parece conter caracteres aleatórios.' };
    }
    return { valid: true, isGithub: true };
  }

  // Formato curto de usuário @user
  if (/^@?[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){1,38}$/.test(clean)) {
    const user = clean.replace(/^@/, '');
    if (['seu-usuario', 'seuusuario', 'username', 'usuario'].includes(user.toLowerCase())) {
      return { valid: false, error: 'Informe o usuário real da sua conta no GitHub.' };
    }
    return { valid: true, isGithub: true };
  }

  // Se não for formato GitHub, aceita website ou portfólio web válido
  const webPattern = /^(https?:\/\/)?((www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|localhost)(:\d{1,5})?(\/[^\s]*)?$/i;
  if (!webPattern.test(clean)) {
    return {
      valid: false,
      error: 'Informe um perfil válido do GitHub (ex: https://github.com/seu-usuario) ou a URL do seu portfólio online.'
    };
  }

  const hostMatch = clean.replace(/^(https?:\/\/)?(www\.)?/i, '').split(/[/?#:]/)[0];
  const gib = detectGibberish(hostMatch);
  if (gib.isGibberish) {
    return { valid: false, error: 'O endereço do portfólio parece conter caracteres aleatórios.' };
  }

  return { valid: true, isPortfolio: true };
}

/**
 * Validação de RA / Matrícula Acadêmica
 */
export function validateStudentRA(ra) {
  if (!ra || typeof ra !== 'string' || !ra.trim()) {
    return { valid: true };
  }
  const clean = ra.trim();
  if (clean.length < 3) {
    return { valid: false, error: 'O RA / Matrícula deve conter pelo menos 3 caracteres.' };
  }
  if (clean.length > 30) {
    return { valid: false, error: 'O RA / Matrícula deve ter no máximo 30 caracteres.' };
  }
  if (hasProfanity(clean)) {
    return { valid: false, error: 'O RA / Matrícula contém termos impróprios.' };
  }
  const pureTroll = containsPureTrollWord(clean);
  if (pureTroll.hasTroll) {
    return { valid: false, error: 'O RA / Matrícula contém termo inválido.' };
  }
  const gib = detectGibberish(clean);
  if (gib.isGibberish) {
    return { valid: false, error: 'O RA / Matrícula contém caracteres aleatórios.' };
  }
  return { valid: true };
}

/**
 * Validação de Troca de Senha
 */
export function validatePasswordChange({ currentPassword = '', newPassword = '', confirmPassword = '', isGoogleOnly = false }) {
  const errors = {};

  if (!isGoogleOnly && (!currentPassword || !currentPassword.trim())) {
    errors.currentPassword = 'A senha atual é necessária para autorizar a modificação.';
  }

  if (!newPassword || newPassword.length < 6) {
    errors.newPassword = 'A nova senha deve ter no mínimo 6 caracteres.';
  } else if (newPassword.length > 64) {
    errors.newPassword = 'A nova senha deve ter no máximo 64 caracteres.';
  } else if (['123456', '12345678', 'abcdef', 'qwerty', 'senha123', 'password'].includes(newPassword.toLowerCase())) {
    errors.newPassword = 'Senha muito simples. Crie uma senha mais segura combinando letras e números.';
  } else if (detectCharRepetition(newPassword, 5)) {
    errors.newPassword = 'A senha não pode conter apenas caracteres repetidos.';
  } else if (!isGoogleOnly && currentPassword && newPassword === currentPassword) {
    errors.newPassword = 'A nova senha deve ser diferente da senha atual.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'A confirmação de senha é obrigatória.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'As senhas digitadas não coincidem.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstErrorKey: Object.keys(errors)[0] || null
  };
}

/**
 * Validação completa do formulário de Configurações de Conta
 */
export function validateAccountSettingsForm({ name, email, linkedin, github, raNumber, role }) {
  const errors = {};

  const nameCheck = validateAccountName(name, role);
  if (!nameCheck.valid) errors.name = nameCheck.error;

  const emailCheck = validateAccountEmail(email, { required: true });
  if (!emailCheck.valid) errors.email = emailCheck.error;

  if (linkedin) {
    const linkedCheck = validateAccountLinkedIn(linkedin, { required: false });
    if (!linkedCheck.valid) errors.linkedin = linkedCheck.error;
  }

  if (github) {
    const gitCheck = validateAccountGitHubOrPortfolio(github, { required: false });
    if (!gitCheck.valid) errors.github = gitCheck.error;
  }

  if (raNumber) {
    const raCheck = validateStudentRA(raNumber);
    if (!raCheck.valid) errors.raNumber = raCheck.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstErrorKey: Object.keys(errors)[0] || null
  };
}


