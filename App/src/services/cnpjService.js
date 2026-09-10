/**
 * Ivaí Conecta - CNPJ Validation & Verification Service
 * - Validação algorítmica dos 14 dígitos pelo Módulo 11 oficial da Receita Federal.
 * - Máscara em tempo real para inputs de CNPJ (00.000.000/0000-00).
 * - Consulta em tempo real na Receita Federal via BrasilAPI com fallback resiliente.
 */

/**
 * Remove qualquer caractere não numérico
 * @param {string} value
 * @returns {string}
 */
export function cleanCNPJ(value) {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 14);
}

/**
 * Aplica máscara de CNPJ conforme o usuário digita
 * Ex: 12345678000190 -> 12.345.678/0001-90
 * @param {string} value
 * @returns {string}
 */
export function maskCNPJ(value) {
  const digits = cleanCNPJ(value);
  if (!digits) return '';

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

/**
 * Validação oficial de CNPJ pelo cálculo dos dígitos verificadores (Módulo 11)
 * @param {string} cnpj
 * @returns {boolean}
 */
export function validateCNPJ(cnpj) {
  const digits = cleanCNPJ(cnpj);

  if (digits.length !== 14) return false;

  // Rejeita sequências com todos os dígitos iguais conhecidas (ex: 00000000000000, 11111111111111)
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Validação do 1º Dígito Verificador
  let length = digits.length - 2;
  let numbers = digits.substring(0, length);
  const digitsCheck = digits.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digitsCheck.charAt(0))) return false;

  // Validação do 2º Dígito Verificador
  length = length + 1;
  numbers = digits.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digitsCheck.charAt(1))) return false;

  return true;
}

/**
 * Consulta dados da empresa na Receita Federal via BrasilAPI com timeout seguro
 * @param {string} cnpj
 * @returns {Promise<{
 *   success: boolean,
 *   data?: {
 *     cnpj: string,
 *     razaoSocial: string,
 *     nomeFantasia: string,
 *     situacaoCadastral: string,
 *     isAtiva: boolean,
 *     cidade: string,
 *     uf: string,
 *     cnae: string,
 *     logradouro: string,
 *     numero: string,
 *     bairro: string,
 *     cep: string,
 *     telefone: string,
 *     email: string
 *   },
 *   error?: string,
 *   notFound?: boolean,
 *   apiUnavailable?: boolean
 * }>}
 */
export async function fetchCNPJData(cnpj) {
  const digits = cleanCNPJ(cnpj);

  if (digits.length !== 14) {
    return {
      success: false,
      error: 'O CNPJ deve conter 14 dígitos numéricos.'
    };
  }

  if (!validateCNPJ(digits)) {
    return {
      success: false,
      error: 'CNPJ inválido (dígitos verificadores incorretos).'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        success: false,
        notFound: true,
        error: 'CNPJ não encontrado na base de dados da Receita Federal.'
      };
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const json = await response.json();

    const situacao = (json.descricao_situacao_cadastral || 'ATIVA').toUpperCase();
    const isAtiva = situacao === 'ATIVA';

    return {
      success: true,
      data: {
        cnpj: maskCNPJ(digits),
        razaoSocial: json.razao_social || '',
        nomeFantasia: json.nome_fantasia || json.razao_social || '',
        situacaoCadastral: situacao,
        isAtiva,
        cidade: json.municipio || '',
        uf: json.uf || 'PR',
        cnae: json.cnae_fiscal_descricao || '',
        logradouro: json.logradouro || '',
        numero: json.numero || '',
        bairro: json.bairro || '',
        cep: json.cep || '',
        telefone: json.ddd_telefone_1 || '',
        email: json.email || ''
      }
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[CNPJ Service] Falha ao consultar BrasilAPI:', err.message);

    // Fallback: o CNPJ passou na validação algorítmica de dígitos, mas a API pública oscilou
    return {
      success: false,
      apiUnavailable: true,
      error: 'Não foi possível consultar a Receita Federal em tempo real no momento (serviço offline ou limite de requisições). Você pode prosseguir anexando o Cartão CNPJ comprobatório.'
    };
  }
}
