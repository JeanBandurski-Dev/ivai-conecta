/**
 * Ivaí Conecta - Schema Validator Engine
 * 
 * Mecanismo utilitário de validação estrutural de DTOs,
 * evitando bibliotecas pesadas e mantendo execução ultra-rápida no frontend e services.
 */

export class ValidationError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Cria um objeto de resultado de validação padronizado
 * @template T
 * @param {boolean} isValid 
 * @param {T} data 
 * @param {Record<string, string>} errors 
 * @returns {{ isValid: boolean, data: T, errors: Record<string, string>, errorMessages: string[] }}
 */
export function validationResult(isValid, data, errors = {}) {
  return {
    isValid,
    data,
    errors,
    errorMessages: Object.values(errors)
  };
}

/**
 * Sanitiza e valida texto básico
 * @param {any} val 
 * @param {object} opts
 * @returns {{ valid: boolean, value: string, error?: string }}
 */
export function validateString(val, { min = 0, max = Infinity, required = false, fieldName = 'Campo' } = {}) {
  if (val === null || val === undefined) {
    if (required) return { valid: false, value: '', error: `${fieldName} é obrigatório.` };
    return { valid: true, value: '' };
  }
  const str = String(val).trim();
  if (required && str.length === 0) {
    return { valid: false, value: '', error: `${fieldName} é obrigatório.` };
  }
  if (str.length < min) {
    return { valid: false, value: str, error: `${fieldName} deve conter no mínimo ${min} caracteres.` };
  }
  if (str.length > max) {
    return { valid: false, value: str, error: `${fieldName} não pode exceder ${max} caracteres.` };
  }
  return { valid: true, value: str };
}

/**
 * Valida formato de e-mail
 * @param {any} val 
 * @param {string} fieldName 
 * @returns {{ valid: boolean, value: string, error?: string }}
 */
export function validateEmail(val, fieldName = 'E-mail') {
  const str = String(val || '').trim().toLowerCase();
  if (!str) return { valid: false, value: '', error: `${fieldName} é obrigatório.` };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    return { valid: false, value: str, error: `${fieldName} possui um formato inválido.` };
  }
  return { valid: true, value: str };
}

/**
 * Sanitiza e valida um array de strings (ex: habilidades, benefícios, tags)
 * @param {any} arr 
 * @param {object} opts 
 * @returns {string[]}
 */
export function sanitizeStringArray(arr, { maxItems = 50, itemMaxLen = 80 } = {}) {
  if (!arr) return [];
  let list = [];
  if (Array.isArray(arr)) {
    list = arr;
  } else if (typeof arr === 'string') {
    list = arr.split(/[,;\n]/);
  }
  return list
    .map(item => String(item || '').trim())
    .filter(item => item.length > 0 && item.length <= itemMaxLen)
    .slice(0, maxItems);
}

/**
 * Valida número dentro de um intervalo
 * @param {any} val 
 * @param {object} opts 
 * @returns {{ valid: boolean, value: number, error?: string }}
 */
export function validateNumber(val, { min = -Infinity, max = Infinity, fieldName = 'Número' } = {}) {
  const num = Number(val);
  if (isNaN(num)) {
    return { valid: false, value: 0, error: `${fieldName} deve ser um número válido.` };
  }
  if (num < min || num > max) {
    return { valid: false, value: num, error: `${fieldName} deve estar entre ${min} e ${max}.` };
  }
  return { valid: true, value: num };
}
