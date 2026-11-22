import { describe, expect, it } from 'vitest';
import {
  AUTHORIZED_STUDENT_DOMAINS,
  validateStudentEmail,
} from './studentVerificationService';

describe('studentVerificationService', () => {
  it('accepts UENP as an officially authorized institution', () => {
    expect(AUTHORIZED_STUDENT_DOMAINS).toContain('uenp.edu.br');
    expect(validateStudentEmail('aluno@uenp.edu.br').isValid).toBe(true);
  });

  it('rejects personal email domains', () => {
    expect(validateStudentEmail('aluno@gmail.com').isValid).toBe(false);
  });

  it('rejects unrecognized institutions', () => {
    expect(validateStudentEmail('aluno@instituicao-exemplo.com').isValid).toBe(false);
  });
});
