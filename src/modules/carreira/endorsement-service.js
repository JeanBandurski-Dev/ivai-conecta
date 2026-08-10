/**
 * IVAÍ CONECTA - SERVIÇO DE ENDOSSOS ACADÊMICOS VERIFICADOS
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

/**
 * Valida os dados de um novo parecer de endosso antes da emissão.
 * @param {Object} endorsementData - Dados do endosso enviado pelo formulário
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateEndorsement(endorsementData) {
  const { profName, profEmail, institution, discipline, quote } = endorsementData || {};

  if (!profName || profName.trim().length < 3) {
    return { isValid: false, error: 'Informe o nome completo do docente.' };
  }

  if (!profEmail || !profEmail.includes('@') || !profEmail.includes('.')) {
    return { isValid: false, error: 'Informe um e-mail corporativo/institucional válido.' };
  }

  if (!institution || institution.trim().length < 2) {
    return { isValid: false, error: 'Selecione ou informe a instituição de ensino.' };
  }

  if (!discipline || discipline.trim().length < 3) {
    return { isValid: false, error: 'Informe a disciplina ou projeto recomendado.' };
  }

  if (!quote || quote.trim().length < 15) {
    return { isValid: false, error: 'O parecer do professor deve conter pelo menos 15 caracteres.' };
  }

  return { isValid: true };
}

/**
 * Cria a estrutura de um endosso verificado pronto para salvar no banco.
 * @param {Object} data 
 * @returns {Object} Objeto de endosso estruturado
 */
export function createEndorsementPayload(data) {
  return {
    id: `endosso_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    profName: data.profName.trim(),
    profEmail: data.profEmail.trim().toLowerCase(),
    institution: data.institution.trim(),
    discipline: data.discipline.trim(),
    quote: data.quote.trim(),
    verifiedAt: new Date().toISOString(),
    isVerified: true
  };
}
