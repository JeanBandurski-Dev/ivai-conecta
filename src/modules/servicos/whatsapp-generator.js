/**
 * IVAÍ CONECTA - GERADOR DE LINKS DE CONTATO DIRETO VIA WHATSAPP
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

/**
 * Gera URL dinâmica para a API do WhatsApp (wa.me) formatando o número e a mensagem padrão.
 * @param {string} phone - Número de telefone (formato local ou internacional)
 * @param {string} serviceName - Nome do serviço prestado
 * @param {string} providerName - Nome do prestador/empresa
 * @param {string} city - Cidade de atuação no Vale do Ivaí
 * @returns {string} URL completa wa.me
 */
export function generateWhatsAppLink(phone = '', serviceName = '', providerName = '', city = '') {
  // Limpa caracteres não numéricos
  let cleanPhone = String(phone).replace(/\D/g, '');

  // Adiciona código do país (55 - Brasil) caso omitido
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = `55${cleanPhone}`;
  }

  const message = `Olá ${providerName}! Encontrei seu serviço de "${serviceName}" em ${city} através da plataforma Ivaí Conecta. Gostaria de solicitar um orçamento.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
