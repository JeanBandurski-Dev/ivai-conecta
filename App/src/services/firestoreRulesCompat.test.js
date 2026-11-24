import { describe, expect, it, vi, beforeEach } from 'vitest';

const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const addDocMock = vi.fn();
const getDocMock = vi.fn();
const getDocsMock = vi.fn();
const onSnapshotMock = vi.fn(() => () => {});
const collectionMock = vi.fn((_db, name) => ({ __collection: name }));
const docMock = vi.fn((_db, col, id) => ({ __collection: col, id }));
const queryMock = vi.fn((colRef, ...constraints) => ({ __collection: colRef.__collection, constraints }));
const whereMock = vi.fn((field, op, value) => ({ field, op, value }));

vi.mock('../lib/firebase.js', () => ({
  db: {},
  functions: {},
  auth: {
    currentUser: {
      uid: 'user_uid_1',
      email: 'usuario@ifpr.edu.br',
    },
  },
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => vi.fn()),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args) => collectionMock(...args),
  doc: (...args) => docMock(...args),
  getDoc: (...args) => getDocMock(...args),
  getDocs: (...args) => getDocsMock(...args),
  addDoc: (...args) => addDocMock(...args),
  setDoc: (...args) => setDocMock(...args),
  updateDoc: (...args) => updateDocMock(...args),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  limit: vi.fn((n) => ({ limit: n })),
  orderBy: vi.fn((f, dir) => ({ orderBy: f, dir })),
  arrayUnion: vi.fn((v) => v),
  increment: vi.fn((v) => v),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  onSnapshot: (...args) => onSnapshotMock(...args),
  query: (...args) => queryMock(...args),
  where: (...args) => whereMock(...args),
}));

import { ApplicationRepository } from '../repositories/ApplicationRepository.js';
import { getOrCreateChat, sendChatMessage } from './chatService.js';
import {
  subscribeToEndorsementRequests,
  subscribeToStudentEndorsementRequests,
} from './talentsService.js';

describe('firestore.rules compatibility fixes', () => {
  beforeEach(() => {
    setDocMock.mockReset().mockResolvedValue();
    updateDocMock.mockReset().mockResolvedValue();
    addDocMock.mockReset().mockResolvedValue({ id: 'msg_1' });
    getDocMock.mockReset().mockResolvedValue({ exists: () => false });
    getDocsMock.mockReset().mockResolvedValue({ docs: [], empty: true });
    onSnapshotMock.mockClear();
    collectionMock.mockClear();
    docMock.mockClear();
    queryMock.mockClear();
    whereMock.mockClear();
  });

  it('ApplicationRepository queries applications by candidateUid instead of candidateId', async () => {
    const repo = new ApplicationRepository();
    await repo.findByCandidate('user_uid_1');
    expect(whereMock).toHaveBeenCalledWith('candidateUid', '==', 'user_uid_1');
    expect(whereMock).not.toHaveBeenCalledWith('candidateId', '==', 'user_uid_1');

    whereMock.mockClear();
    const unsub = repo.subscribeToCandidate('user_uid_1', () => {});
    expect(whereMock).toHaveBeenCalledWith('candidateUid', '==', 'user_uid_1');
    unsub();
  });

  it('ApplicationRepository falls back to direct Firestore create matching firestore.rules when Cloud Function is unavailable', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        status: 'Ativa',
        createdBy: 'company_uid_9',
        company: 'MICROSOFT',
        title: 'Desenvolvedor(a) Full Stack',
        recruiterEmail: 'notszmb@gmail.com',
      }),
    });

    const repo = new ApplicationRepository();
    const created = await repo.createApplicationAtomically(
      {
        jobId: 'job_abc',
        candidateUid: 'user_uid_1',
        candidateName: 'Candidato Normal',
        candidateRole: 'candidato',
        candidateEmail: 'usuario@ifpr.edu.br',
        company: 'MICROSOFT',
        title: 'Desenvolvedor(a) Full Stack',
        status: 'Candidatura Enviada',
      },
      'job_abc'
    );

    expect(created.id).toBe('job_abc_user_uid_1');
    expect(docMock).toHaveBeenCalledWith({}, 'jobs', 'job_abc');
    expect(setDocMock).toHaveBeenCalledTimes(1);
    const [appRef, appPayload] = setDocMock.mock.calls[0];
    expect(appRef).toEqual({ __collection: 'applications', id: 'job_abc_user_uid_1' });
    expect(appPayload.candidateUid).toBe('user_uid_1');
    expect(appPayload.candidateEmail).toBe('usuario@ifpr.edu.br');
    expect(appPayload.recruiterUid).toBe('company_uid_9');
    expect(appPayload.companyUid).toBe('company_uid_9');
    expect(appPayload.recruiterEmail).toBe('notszmb@gmail.com');
    expect(appPayload.jobId).toBe('job_abc');
    expect(appPayload.firestoreJobId).toBe('job_abc');
  });

  it('chatService creates UID-based chats using public_profiles and updates metadata via updateDoc', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Empresa Alfa', role: 'empresa', avatar: '' }),
    });

    const chatId = await getOrCreateChat(
      { uid: 'user_uid_1', email: 'usuario@ifpr.edu.br', name: 'Candidato', role: 'candidato' },
      { uid: 'company_uid_9', name: 'Empresa Alfa', role: 'empresa' },
      'Vaga: Dev'
    );

    expect(chatId).toBe('chat_uid_company_uid_9_user_uid_1');
    expect(docMock).toHaveBeenCalledWith({}, 'public_profiles', 'company_uid_9');
    expect(docMock).not.toHaveBeenCalledWith({}, 'users', 'company_uid_9');

    const chatWrite = setDocMock.mock.calls.find(([ref]) => ref.__collection === 'chats');
    expect(chatWrite).toBeTruthy();
    expect(chatWrite[1].participantUids).toEqual(['user_uid_1', 'company_uid_9']);

    await sendChatMessage(
      chatId,
      { uid: 'user_uid_1', email: 'usuario@ifpr.edu.br', name: 'Candidato', role: 'candidato' },
      'Olá, tenho interesse na oportunidade!'
    );

    expect(updateDocMock).toHaveBeenCalledTimes(1);
    expect(updateDocMock.mock.calls[0][0]).toEqual({ __collection: 'chats', id: chatId });
    expect(updateDocMock.mock.calls[0][1].lastMessage).toBe('Olá, tenho interesse na oportunidade!');
  });

  it('talentsService endorsement listeners do not run unfiltered queries on users or endorsement_requests', () => {
    const unsubProf = subscribeToEndorsementRequests(
      { uid: 'user_uid_1', email: 'usuario@ifpr.edu.br' },
      () => {}
    );
    const unsubStudent = subscribeToStudentEndorsementRequests('user_uid_1', () => {});

    // No unfiltered collection(db, 'users') or collection(db, 'endorsement_requests') passed to onSnapshot
    const unfilteredTargets = onSnapshotMock.mock.calls
      .map(([target]) => target)
      .filter((t) => t && t.__collection && !t.id && !t.constraints);

    expect(unfilteredTargets).toEqual([]);
    expect(whereMock).toHaveBeenCalledWith('profEmail', '==', 'usuario@ifpr.edu.br');
    expect(whereMock).toHaveBeenCalledWith('studentId', '==', 'user_uid_1');

    unsubProf();
    unsubStudent();
  });
});
