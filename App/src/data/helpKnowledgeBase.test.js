import { describe, expect, it } from 'vitest';
import {
  getContextualHelpTopics,
  getPageLabel,
  findLocalHelpMatch,
  parseHelpResponseActions,
  normalizeRoleKey
} from './helpKnowledgeBase';

describe('helpKnowledgeBase', () => {
  it('normalizes user role aliases consistently', () => {
    expect(normalizeRoleKey('student')).toBe('aluno');
    expect(normalizeRoleKey('company')).toBe('empresa');
    expect(normalizeRoleKey('prestador')).toBe('freelancer');
    expect(normalizeRoleKey('')).toBe('visitante');
  });

  it('returns distinct contextual topics across different routes for the same user role', () => {
    const onHome = getContextualHelpTopics({
      pathname: '/',
      userRole: 'freelancer',
      isAuthenticated: true
    }).map((t) => t.id);

    const onVagas = getContextualHelpTopics({
      pathname: '/vagas',
      userRole: 'freelancer',
      isAuthenticated: true
    }).map((t) => t.id);

    const onServicos = getContextualHelpTopics({
      pathname: '/servicos',
      userRole: 'freelancer',
      isAuthenticated: true
    }).map((t) => t.id);

    const onConfig = getContextualHelpTopics({
      pathname: '/configuracoes',
      userRole: 'freelancer',
      isAuthenticated: true
    }).map((t) => t.id);

    expect(onHome).not.toEqual(onVagas);
    expect(onVagas).not.toEqual(onServicos);
    expect(onServicos).not.toEqual(onConfig);
  });

  it('returns contextual topics tailored to empresa on gerenciamento-vagas', () => {
    const topics = getContextualHelpTopics({
      pathname: '/gerenciamento-vagas',
      userRole: 'empresa',
      isAuthenticated: true
    });
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.some((t) => t.articleId === 'publicar-vaga-cbo')).toBe(true);
    expect(topics.some((t) => t.preferAI === true)).toBe(true);
  });

  it('returns contextual topics tailored to aluno on perfil', () => {
    const topics = getContextualHelpTopics({
      pathname: '/perfil',
      userRole: 'aluno',
      isAuthenticated: true
    });
    expect(topics.some((t) => t.articleId === 'curriculo-pdf')).toBe(true);
    expect(topics.some((t) => t.articleId === 'validacao-estudantil')).toBe(true);
  });

  it('resolves readable page labels for known routes', () => {
    expect(getPageLabel('/vagas')).toBe('Vagas & Match');
    expect(getPageLabel('/gerenciamento-vagas')).toBe('Gestão de Vagas');
    expect(getPageLabel('/')).toBe('Início');
  });

  it('matches local FAQ articles including account deletion', () => {
    const resumeMatch = findLocalHelpMatch('Como faço para baixar meu currículo em PDF?', {
      userRole: 'aluno',
      isAuthenticated: true
    });
    expect(resumeMatch).not.toBeNull();
    expect(resumeMatch.id).toBe('curriculo-pdf');
    expect(resumeMatch.actions.some((a) => a.to === '/perfil')).toBe(true);

    const deleteMatch = findLocalHelpMatch('como faço para apagar minha conta no site ?', {
      userRole: 'freelancer',
      isAuthenticated: true
    });
    expect(deleteMatch).not.toBeNull();
    expect(deleteMatch.id).toBe('excluir-conta');
    expect(deleteMatch.actions.some((a) => a.to === '/configuracoes?tab=account')).toBe(true);
  });

  it('filters auth-only actions for guests and blocks unsafe routes in AI markers', () => {
    const parsedGuest = parseHelpResponseActions(
      'Acesse aqui [[ACAO:/vagas|Ver Vagas]] [[ACAO:https://evil.com|Externo]] [[CHAT|Abrir Chat]]',
      { isAuthenticated: false }
    );
    expect(parsedGuest.cleanText).toBe('Acesse aqui');
    expect(parsedGuest.actions).toEqual([
      { type: 'navigate', to: '/vagas', label: 'Ver Vagas' }
    ]);

    const parsedAuth = parseHelpResponseActions(
      'Fale com a empresa [[CHAT|Abrir Chat]] [[ACAO:/minhas-vagas|Minhas Vagas]]',
      { isAuthenticated: true }
    );
    expect(parsedAuth.actions).toEqual([
      { type: 'open_chat', label: 'Abrir Chat' },
      { type: 'navigate', to: '/minhas-vagas', label: 'Minhas Vagas' }
    ]);
  });
});
