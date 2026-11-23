import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import app from '../lib/firebase';
import {
  ROLE_CONTEXT_META,
  getPageLabel,
  normalizeRoleKey,
  findLocalHelpMatch,
  parseHelpResponseActions
} from '../data/helpKnowledgeBase';

export const MAX_HELP_MESSAGE_LENGTH = 600;
export const DAILY_LIMIT_AUTHENTICATED = 30;
export const DAILY_LIMIT_GUEST = 8;

const QUOTA_STORAGE_KEY = 'ivai_conecta_ai_help_quota_v1';
const DEFAULT_PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

let cachedAiInstance = null;

function getAiInstance() {
  if (!cachedAiInstance) {
    cachedAiInstance = getAI(app, { backend: new GoogleAIBackend() });
  }
  return cachedAiInstance;
}

function getModelCandidates() {
  const envModel = import.meta?.env?.VITE_FIREBASE_AI_MODEL;
  const primary = typeof envModel === 'string' && envModel.trim() ? envModel.trim() : DEFAULT_PRIMARY_MODEL;
  return primary === FALLBACK_MODEL ? [primary] : [primary, FALLBACK_MODEL];
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readQuotaState() {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!raw) return { date: today, count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.date === today && typeof parsed.count === 'number' && parsed.count >= 0) {
      return parsed;
    }
  } catch {
    // localStorage indisponível ou bloqueado
  }
  return { date: today, count: 0 };
}

function writeQuotaState(state) {
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora erro de escrita se armazenamento estiver cheio/bloqueado
  }
}

export function getAiQuotaStatus(isAuthenticated = false) {
  const limit = isAuthenticated ? DAILY_LIMIT_AUTHENTICATED : DAILY_LIMIT_GUEST;
  const state = readQuotaState();
  const used = Math.min(state.count, limit);
  const remaining = Math.max(0, limit - used);
  return { limit, used, remaining };
}

export function consumeAiQuota(isAuthenticated = false) {
  const limit = isAuthenticated ? DAILY_LIMIT_AUTHENTICATED : DAILY_LIMIT_GUEST;
  const state = readQuotaState();
  if (state.count >= limit) {
    return { allowed: false, limit, used: limit, remaining: 0 };
  }
  const nextCount = state.count + 1;
  writeQuotaState({ date: state.date, count: nextCount });
  return {
    allowed: true,
    limit,
    used: nextCount,
    remaining: Math.max(0, limit - nextCount)
  };
}

export function validateHelpPrompt(rawText) {
  const text = String(rawText || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return { valid: false, error: 'Digite uma dúvida para enviar.', text: '' };
  }
  if (text.length > MAX_HELP_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `A mensagem pode ter no máximo ${MAX_HELP_MESSAGE_LENGTH} caracteres.`,
      text
    };
  }
  return { valid: true, error: null, text };
}

export function buildHelpSystemInstruction({
  pathname = '/',
  userRole = 'visitante',
  isAuthenticated = false
} = {}) {
  const roleKey = normalizeRoleKey(userRole);
  const roleMeta = ROLE_CONTEXT_META[roleKey] || ROLE_CONTEXT_META.visitante;
  const pageLabel = getPageLabel(pathname);

  return [
    'Você é o Assistente Oficial do Ivaí Conecta, uma plataforma regional de empregabilidade, estágios, talentos e serviços locais do Vale do Ivaí (Ivaiporã, Jardim Alegre, São João do Ivaí, Manoel Ribas e região), desenvolvida como projeto de extensão com participação de instituições locais (IFPR Campus Ivaiporã, UENP, UNIVALE, ACISI).',
    '',
    'CONTEXTO ATUAL DO USUÁRIO (sem dados pessoais):',
    `- Perfil: ${roleMeta.label} (${roleMeta.summary})`,
    `- Página atual: ${pageLabel} (${pathname})`,
    `- Sessão: ${isAuthenticated ? 'Usuário autenticado' : 'Visitante (não logado)'}`,
    '',
    'MAPA REAL DA PLATAFORMA (NUNCA invente rotas ou botões inexistentes):',
    '- "/" : Início / Dashboard com resumo de oportunidades e destaques regionais.',
    '- "/vagas" : Vagas & Match (busca e candidatura em vagas e estágios da região).',
    '- "/minhas-vagas" : Minhas Candidaturas (para aluno/candidato acompanhar status) ou Gestão de Vagas (para empresa).',
    '- "/gerenciamento-vagas" : Painel completo da empresa para publicar vagas (com busca de cargo via CBO), gerenciar etapas e avaliar candidatos.',
    '- "/talentos" : Banco de Talentos (exclusivo para contas Empresa pesquisarem perfis de alunos/candidatos).',
    '- "/servicos" : Serviços Locais (catálogo para contratar ou divulgar serviços como Freelancer).',
    '- "/perfil" : Perfil de Aluno/Candidato (onde edita bio, formação, experiências, habilidades e exporta o Currículo em PDF).',
    '- "/empresa" | "/freelancer" | "/professor" : Perfis específicos por tipo de conta.',
    '- "/configuracoes" : Aba "links", "verification" (validação estudantil por e-mail institucional para alunos), "company" (validação CNPJ para empresas), "account", "notifications", "privacy".',
    '- "/login" : Entrar ou criar conta (e-mail/senha ou Google) e "Esqueci minha senha".',
    '- "/completar-perfil" : Finalizar dados do perfil após o primeiro acesso.',
    '- Chat em tempo real : Ícone de balão de conversa no topo da barra de navegação (para usuários logados).',
    '',
    'REGRAS DE COMPORTAMENTO E SEGURANÇA:',
    '1. Responda sempre em português do Brasil, com tom acolhedor, objetivo e prático (frases curtas e listas quando útil).',
    '2. Fale APENAS sobre o uso do Ivaí Conecta, carreira/currículo/entrevistas, descrição de vagas/CBO ou divulgação de serviços locais.',
    '3. Se o usuário perguntar algo totalmente fora desse escopo (programação genérica, política, tarefas escolares não ligadas a carreira/plataforma, etc.), recuse com educação e redirecione para como você pode ajudar no Ivaí Conecta.',
    '4. NUNCA peça senhas, CPF, RG, códigos de verificação ou dados bancários.',
    '5. Quando fizer sentido levar o usuário a uma tela do site, adicione no máximo 2 marcadores no final da resposta neste formato exato:',
    '   [[ACAO:/rota|Texto curto do botão]]',
    '   Ou, se o usuário estiver autenticado e precisar abrir o chat da plataforma: [[CHAT|Abrir Chat]]',
    '   Use apenas rotas da lista acima.'
  ].join('\n');
}

/**
 * Normaliza o histórico de conversa para o formato aceito pelo Gemini startChat:
 * precisa iniciar com uma mensagem de 'user' e alternar 'user' e 'model'.
 */
export function normalizeChatHistory(messages = []) {
  const valid = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.sender === 'user' || m.sender === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-10);

  const firstUserIdx = valid.findIndex((m) => m.sender === 'user');
  if (firstUserIdx === -1) return [];

  const sliced = valid.slice(firstUserIdx);
  const alternating = [];

  for (const item of sliced) {
    const role = item.sender === 'user' ? 'user' : 'model';
    const last = alternating[alternating.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${item.text.trim()}`;
    } else {
      alternating.push({ role, parts: [{ text: item.text.trim() }] });
    }
  }

  // O histórico passado ao startChat não deve terminar em 'user' se vamos enviar nova mensagem em seguida
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
  }

  return alternating;
}

function classifyAiError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  if (message.includes('permission_denied') || message.includes('api has not been used') || message.includes('disabled') || message.includes('ai logic')) {
    return 'not_provisioned';
  }
  if (message.includes('quota') || message.includes('429') || message.includes('resource_exhausted')) {
    return 'quota_exceeded';
  }
  if (message.includes('not found') || message.includes('404') || message.includes('unsupported')) {
    return 'model_unavailable';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('offline')) {
    return 'network';
  }
  return 'unknown';
}

function buildFallbackResponse({ question, userRole, isAuthenticated, reason }) {
  const localMatch = findLocalHelpMatch(question, { userRole, isAuthenticated });

  if (localMatch) {
    const prefix =
      reason === 'quota_limit'
        ? 'Você atingiu o limite diário de perguntas livres para a IA, mas encontrei este guia rápido para ajudar:\n\n'
        : '';
    return {
      text: `${prefix}**${localMatch.title}**\n\n${localMatch.answer}`,
      actions: localMatch.actions,
      source: 'local-fallback',
      reason
    };
  }

  const defaultActions = isAuthenticated
    ? [
        { type: 'navigate', to: '/vagas', label: 'Ver Vagas' },
        { type: 'navigate', to: '/configuracoes', label: 'Configurações' }
      ]
    : [
        { type: 'navigate', to: '/vagas', label: 'Explorar Vagas' },
        { type: 'navigate', to: '/login', label: 'Entrar / Criar Conta' }
      ];

  const messageByReason =
    reason === 'quota_limit'
      ? 'Você atingiu o limite diário de perguntas livres para a IA hoje. Use os atalhos de ajuda rápida acima ou navegue diretamente pelas páginas abaixo.'
      : 'No momento a resposta por IA não pôde ser concluída, mas você pode usar os atalhos contextuais acima ou acessar diretamente as áreas principais do Ivaí Conecta.';

  return {
    text: messageByReason,
    actions: defaultActions,
    source: 'local-fallback',
    reason
  };
}

export async function askAiHelp({
  question,
  history = [],
  pathname = '/',
  userRole = 'visitante',
  isAuthenticated = false,
  onChunk
}) {
  const validation = validateHelpPrompt(question);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const quota = consumeAiQuota(isAuthenticated);
  if (!quota.allowed) {
    return {
      ...buildFallbackResponse({
        question: validation.text,
        userRole,
        isAuthenticated,
        reason: 'quota_limit'
      }),
      remainingQuota: 0
    };
  }

  const systemInstruction = buildHelpSystemInstruction({ pathname, userRole, isAuthenticated });
  const chatHistory = normalizeChatHistory(history);
  const candidates = getModelCandidates();
  let lastError = null;

  for (const modelName of candidates) {
    try {
      const ai = getAiInstance();
      const model = getGenerativeModel(ai, {
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: 0.45,
          topP: 0.9,
          maxOutputTokens: 700
        }
      });

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessageStream(validation.text);

      let accumulated = '';
      for await (const chunk of result.stream) {
        const piece = typeof chunk.text === 'function' ? chunk.text() : '';
        if (piece) {
          accumulated += piece;
          if (typeof onChunk === 'function') {
            const { cleanText } = parseHelpResponseActions(accumulated, { isAuthenticated });
            onChunk(cleanText);
          }
        }
      }

      if (!accumulated.trim()) {
        const finalResponse = await result.response;
        accumulated = typeof finalResponse?.text === 'function' ? finalResponse.text() : '';
      }

      const { cleanText, actions } = parseHelpResponseActions(accumulated, { isAuthenticated });
      if (!cleanText) {
        throw new Error('Resposta vazia do modelo');
      }

      return {
        text: cleanText,
        actions,
        source: 'ai',
        model: modelName,
        remainingQuota: quota.remaining
      };
    } catch (err) {
      lastError = err;
      const errType = classifyAiError(err);
      if (errType !== 'model_unavailable') {
        break;
      }
    }
  }

  const errorReason = classifyAiError(lastError);
  if (import.meta?.env?.DEV) {
    console.warn('[aiHelpService] Fallback para guia local:', errorReason, lastError?.message || lastError);
  }

  return {
    ...buildFallbackResponse({
      question: validation.text,
      userRole,
      isAuthenticated,
      reason: errorReason
    }),
    remainingQuota: quota.remaining
  };
}
