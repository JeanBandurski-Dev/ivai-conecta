import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockSendMessageStream = vi.fn();
const mockStartChat = vi.fn(() => ({
  sendMessageStream: mockSendMessageStream
}));

vi.mock('../lib/firebase', () => ({
  default: { name: 'mock-app' }
}));

vi.mock('firebase/ai', () => ({
  getAI: vi.fn(() => ({ app: 'mock-ai' })),
  getGenerativeModel: vi.fn(() => ({
    startChat: mockStartChat
  })),
  GoogleAIBackend: vi.fn()
}));

import {
  validateHelpPrompt,
  normalizeChatHistory,
  buildHelpSystemInstruction,
  getAiQuotaStatus,
  consumeAiQuota,
  askAiHelp,
  MAX_HELP_MESSAGE_LENGTH,
  DAILY_LIMIT_GUEST,
  DAILY_LIMIT_AUTHENTICATED
} from './aiHelpService';

describe('aiHelpService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });

  it('validates prompt length and empty inputs', () => {
    expect(validateHelpPrompt('   ').valid).toBe(false);
    expect(validateHelpPrompt('a'.repeat(MAX_HELP_MESSAGE_LENGTH + 1)).valid).toBe(false);
    expect(validateHelpPrompt('  Como funciona   o match? ').text).toBe('Como funciona o match?');
  });

  it('normalizes chat history so it starts with user and alternates roles', () => {
    const normalized = normalizeChatHistory([
      { sender: 'assistant', text: 'Olá inicial' },
      { sender: 'user', text: 'Primeira dúvida' },
      { sender: 'user', text: 'Complemento' },
      { sender: 'assistant', text: 'Resposta' },
      { sender: 'user', text: 'Última sem resposta ainda' }
    ]);

    expect(normalized).toEqual([
      { role: 'user', parts: [{ text: 'Primeira dúvida\nComplemento' }] },
      { role: 'model', parts: [{ text: 'Resposta' }] }
    ]);
  });

  it('builds system instruction with contextual role and route without personal data', () => {
    const prompt = buildHelpSystemInstruction({
      pathname: '/gerenciamento-vagas',
      userRole: 'empresa',
      isAuthenticated: true
    });
    expect(prompt).toContain('Empresa / Recrutador');
    expect(prompt).toContain('Gestão de Vagas (/gerenciamento-vagas)');
    expect(prompt).toContain('Ivaí Conecta');
  });

  it('streams AI response and extracts safe action buttons', async () => {
    async function* fakeStream() {
      yield { text: () => 'Você pode editar seu currículo no perfil. ' };
      yield { text: () => '[[ACAO:/perfil|Ir para Meu Perfil]]' };
    }

    mockSendMessageStream.mockResolvedValueOnce({
      stream: fakeStream(),
      response: Promise.resolve({
        text: () => 'Você pode editar seu currículo no perfil. [[ACAO:/perfil|Ir para Meu Perfil]]'
      })
    });

    const streamedChunks = [];
    const result = await askAiHelp({
      question: 'Onde edito meu currículo?',
      history: [],
      pathname: '/vagas',
      userRole: 'aluno',
      isAuthenticated: true,
      onChunk: (partial) => streamedChunks.push(partial)
    });

    expect(result.source).toBe('ai');
    expect(result.text).toBe('Você pode editar seu currículo no perfil.');
    expect(result.actions).toEqual([{ type: 'navigate', to: '/perfil', label: 'Ir para Meu Perfil' }]);
    expect(result.remainingQuota).toBe(DAILY_LIMIT_AUTHENTICATED - 1);
    expect(streamedChunks.length).toBeGreaterThan(0);
  });

  it('retries fallback model on 500 high demand error and succeeds', async () => {
    async function* fakeStream() {
      yield { text: () => 'Resposta rápida do modelo alternativo.' };
    }

    mockSendMessageStream
      .mockRejectedValueOnce(new Error('[500 Internal Server Error] high demand'))
      .mockResolvedValueOnce({
        stream: fakeStream(),
        response: Promise.resolve({ text: () => 'Resposta rápida do modelo alternativo.' })
      });

    const result = await askAiHelp({
      question: 'Como funciona o match?',
      history: [],
      pathname: '/vagas',
      userRole: 'aluno',
      isAuthenticated: true
    });

    expect(result.source).toBe('ai');
    expect(result.text).toBe('Resposta rápida do modelo alternativo.');
    expect(mockSendMessageStream).toHaveBeenCalledTimes(2);
  });

  it('falls back to local knowledge base without consuming quota when AI fails', async () => {
    mockSendMessageStream.mockRejectedValue(new Error('PERMISSION_DENIED: AI Logic disabled'));

    const before = getAiQuotaStatus(true).remaining;
    const result = await askAiHelp({
      question: 'como faço para apagar minha conta no site ?',
      history: [],
      pathname: '/',
      userRole: 'freelancer',
      isAuthenticated: true
    });

    expect(result.source).toBe('local-fallback');
    expect(result.text).toContain('excluir sua conta');
    expect(result.actions.some((a) => a.to === '/configuracoes?tab=account')).toBe(true);
    expect(getAiQuotaStatus(true).remaining).toBe(before);
  });

  it('enforces daily guest quota when localStorage is available', () => {
    if (typeof localStorage === 'undefined') return;
    expect(getAiQuotaStatus(false).remaining).toBe(DAILY_LIMIT_GUEST);
    for (let i = 0; i < DAILY_LIMIT_GUEST; i += 1) {
      expect(consumeAiQuota(false).allowed).toBe(true);
    }
    expect(consumeAiQuota(false).allowed).toBe(false);
  });
});
