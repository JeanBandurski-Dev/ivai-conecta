/**
 * Utilitários de Validação e Formatação de Formulários
 * Ivaí Conecta - Vale do Ivaí
 */

import { hasProfanity } from '../services/jobTaxonomy.js';

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
      error: `Descreva brevemente o que você precisa que seja feito (mínimo de ${minLength} caracteres).`,
      length: 0,
      minLength
    };
  }

  const clean = text.trim();
  const len = clean.length;

  if (len < minLength) {
    const falta = minLength - len;
    return {
      valid: false,
      error: `A descrição da sua demanda precisa de mais detalhes (+${falta} ${falta === 1 ? 'caractere' : 'caracteres'}). Isso ajuda o prestador a enviar um orçamento preciso.`,
      length: len,
      minLength
    };
  }

  if (len > maxLength) {
    return {
      valid: false,
      error: `A descrição atingiu o limite de ${maxLength} caracteres.`,
      length: len,
      minLength
    };
  }

  // Verifica repetições excessivas
  if (/(.)\1{5,}/.test(clean)) {
    return {
      valid: false,
      error: 'Evite repetições consecutivas de caracteres. Descreva o serviço de forma compreensível.',
      length: len,
      minLength
    };
  }

  // Anti-profanidade
  if (hasProfanity(clean)) {
    return {
      valid: false,
      error: 'Linguagem imprópria detectada. Descreva apenas a solicitação de serviço profissional.',
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
