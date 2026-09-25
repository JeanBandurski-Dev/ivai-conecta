import useAppStore from '../store/useAppStore';

/**
 * showConfirm
 * Dispara uma caixa de confirmação customizada com base no design system.
 * Retorna uma Promise que resolve em `true` se o usuário confirmar ou `false` se cancelar.
 *
 * @param {Object|string} options - Opções do modal ou mensagem direta em string
 * @param {string} [options.title='Confirmação'] - Título do diálogo
 * @param {string} options.message - Mensagem de texto explicativa
 * @param {string} [options.confirmText='Confirmar'] - Rótulo do botão principal
 * @param {string} [options.cancelText='Cancelar'] - Rótulo do botão de cancelamento
 * @param {'primary'|'danger'|'warning'|'success'|'info'} [options.variant='primary'] - Estilo visual
 * @param {string} [options.badge] - Badge ou tag contextual no cabeçalho
 * @returns {Promise<boolean>}
 */
export const showConfirm = (options) => {
  return useAppStore.getState().showConfirm(options);
};

/**
 * showAlert
 * Dispara um alerta informativo padronizado sem opção de cancelamento.
 * Retorna uma Promise que resolve quando o usuário clicar no botão de confirmação.
 *
 * @param {Object|string} options - Opções do modal ou mensagem direta em string
 * @param {string} [options.title='Aviso'] - Título do diálogo
 * @param {string} options.message - Mensagem explicativa
 * @param {string} [options.confirmText='Entendi'] - Rótulo do botão
 * @param {'info'|'primary'|'warning'|'danger'|'success'} [options.variant='info'] - Estilo visual
 * @returns {Promise<boolean>}
 */
export const showAlert = (options) => {
  return useAppStore.getState().showAlert(options);
};

/**
 * closeConfirm
 * Fecha programaticamente qualquer diálogo aberto no momento.
 *
 * @param {boolean} [result=false] - Valor a resolver na Promise pendente
 */
export const closeConfirm = (result = false) => {
  useAppStore.getState().closeConfirm(result);
};

export default {
  showConfirm,
  showAlert,
  closeConfirm,
};
