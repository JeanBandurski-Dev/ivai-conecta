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

  it('matches local FAQ articles for common platform questions', () => {
    const match = findLocalHelpMatch('Como faço para baixar meu currículo em PDF?', {
      userRole: 'aluno',
      isAuthenticated: true
    });
    expect(match).not.toBeNull();
    expect(match.id).toBe('curriculo-pdf');
    expect(match.actions.some((a) => a.to === '/perfil')).toBe(true);
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
