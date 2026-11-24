import { describe, expect, it } from 'vitest';
import {
  AUTHORIZED_STUDENT_DOMAINS,
  validateStudentEmail,
  isAuthorizedStudentInstitutionEmail,
} from './studentVerificationService';

describe('studentVerificationService', () => {
  it('accepts UENP as an officially authorized institution', () => {
    expect(AUTHORIZED_STUDENT_DOMAINS).toContain('uenp.edu.br');
    expect(validateStudentEmail('aluno@uenp.edu.br').isValid).toBe(true);
  });

  it('accepts UTFPR, UEL, UEM and IFPR as authorized institutions', () => {
    expect(validateStudentEmail('estudante@estudante.ifpr.edu.br').isValid).toBe(true);
    expect(validateStudentEmail('aluno@utfpr.edu.br').isValid).toBe(true);
    expect(validateStudentEmail('aluno@uel.br').isValid).toBe(true);
    expect(validateStudentEmail('aluno@uem.br').isValid).toBe(true);
  });

  it('accepts any valid higher education .edu.br domain', () => {
    expect(isAuthorizedStudentInstitutionEmail('aluno@faculdade-qualquer.edu.br')).toBe(true);
    expect(validateStudentEmail('aluno@faculdade-qualquer.edu.br').isValid).toBe(true);
  });

  it('rejects personal email domains', () => {
    expect(validateStudentEmail('aluno@gmail.com').isValid).toBe(false);
    expect(validateStudentEmail('aluno@hotmail.com').isValid).toBe(false);
  });

  it('rejects unrecognized institutions', () => {
    expect(validateStudentEmail('aluno@instituicao-exemplo.com').isValid).toBe(false);
  });
});
