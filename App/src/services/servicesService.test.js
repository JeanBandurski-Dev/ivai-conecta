import { describe, expect, it, vi, beforeEach } from 'vitest';

const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const onSnapshotMock = vi.fn(() => () => {});
const collectionMock = vi.fn((_db, name) => ({ __collection: name }));
const docMock = vi.fn((_db, col, id) => ({ __collection: col, id }));
const queryMock = vi.fn((colRef, ...constraints) => ({ __collection: colRef.__collection, constraints }));
const whereMock = vi.fn((field, op, value) => ({ field, op, value }));

const { authState, callableFnMock } = vi.hoisted(() => ({
  authState: {
    currentUser: {
      uid: 'freelancer_uid_1',
      email: 'freela@ivaiconecta.com.br',
    },
  },
  callableFnMock: vi.fn(),
}));
let authChangeHandler = null;
const onAuthStateChangedMock = vi.fn((_authObj, cb) => {
  authChangeHandler = cb;
  return () => {};
});

vi.mock('../lib/firebase.js', () => ({
  db: {},
  functions: {},
  auth: authState,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => onAuthStateChangedMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => (...args) => callableFnMock(...args)),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args) => collectionMock(...args),
  doc: (...args) => docMock(...args),
  updateDoc: (...args) => updateDocMock(...args),
  onSnapshot: (...args) => onSnapshotMock(...args),
  setDoc: (...args) => setDocMock(...args),
  query: (...args) => queryMock(...args),
  where: (...args) => whereMock(...args),
}));

vi.mock('../repositories/index.js', () => ({
  serviceRepository: {
    create: (...args) => createMock(...args),
    update: (...args) => updateMock(...args),
    delete: (...args) => deleteMock(...args),
    subscribeToServices: vi.fn(() => () => {}),
  },
  serviceOrderRepository: {
    subscribe: vi.fn(() => () => {}),
  },
}));

import {
  addService,
  updateService,
  deleteService,
  createServiceOrder,
  submitServiceReview,
  subscribeToServiceOrders,
} from './servicesService.js';

describe('servicesService', () => {
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    setDocMock.mockReset();
    updateDocMock.mockReset();
    callableFnMock.mockReset();
    onSnapshotMock.mockClear();
    collectionMock.mockClear();
    docMock.mockClear();
    queryMock.mockClear();
    whereMock.mockClear();
    setDocMock.mockResolvedValue();
    updateDocMock.mockResolvedValue();
  });

  it('creates service with rating 0 and reviewsCount 0 to satisfy firestore.rules', async () => {
    createMock.mockResolvedValue({ id: 'srv_123', firestoreId: 'srv_123' });

    const created = await addService({
      title: 'Suporte de TI e Redes',
      category: 'Tecnologia & TI',
      city: 'Ivaiporã',
      phone: '(43) 99999-1234',
      description: 'Atendimento técnico para empresas e residências em Ivaiporã.',
      providerName: 'Carlos Silva',
      rating: 5.0, // even if passed, must be forced to 0 on create
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const payload = createMock.mock.calls[0][0];
    expect(payload.rating).toBe(0);
    expect(payload.reviewsCount).toBe(0);
    expect(payload.createdBy).toBe('freelancer_uid_1');
    expect(payload.providerUid).toBe('freelancer_uid_1');
    expect(created.id).toBe('srv_123');
  });

  it('propagates Firestore error on addService instead of faking local creation', async () => {
    createMock.mockRejectedValue(new Error('Permissão negada ao acessar services'));

    await expect(
      addService({
        title: 'Manutenção Elétrica Residencial',
        category: 'Construção & Manutenção',
        city: 'Ivaiporã',
        phone: '(43) 99999-1234',
        description: 'Serviços elétricos residenciais e comerciais com atendimento rápido.',
      })
    ).rejects.toThrow('Permissão negada');
  });

  it('propagates Firestore error on updateService and deleteService', async () => {
    updateMock.mockRejectedValue(new Error('Permissão negada no update'));
    deleteMock.mockRejectedValue(new Error('Permissão negada no delete'));

    await expect(updateService('srv_123', { title: 'Eletricista' })).rejects.toThrow('Permissão negada no update');
    await expect(deleteService('srv_123')).rejects.toThrow('Permissão negada no delete');
  });

  it('creates service order with participantUids and authenticated clientUid', async () => {
    const order = await createServiceOrder({
      serviceId: 'srv_1',
      serviceTitle: 'Manutenção Elétrica',
      providerId: 'prov_uid_2',
      providerUid: 'prov_uid_2',
      providerName: 'João Eletricista',
      providerEmail: '',
      description: 'Preciso instalar 3 tomadas e revisar disjuntor.'
    });

    expect(order.clientUid).toBe('freelancer_uid_1');
    expect(order.clientEmail).toBe('freela@ivaiconecta.com.br');

    const ordersWrite = setDocMock.mock.calls.find(([ref]) => ref.__collection === 'service_orders');
    const chatsWrite = setDocMock.mock.calls.find(([ref]) => ref.__collection === 'chats');

    expect(ordersWrite).toBeTruthy();
    expect(chatsWrite).toBeTruthy();
    expect(chatsWrite[1].participantUids).toEqual(['freelancer_uid_1', 'prov_uid_2']);
    expect(chatsWrite[1].isServiceOrder).toBe(true);
  });

  it('throws when both service_orders and chats persistence fail in createServiceOrder', async () => {
    setDocMock.mockRejectedValue(new Error('permission-denied'));

    await expect(
      createServiceOrder({
        serviceId: 'srv_1',
        providerId: 'prov_uid_2',
        description: 'Teste de falha simultânea'
      })
    ).rejects.toThrow('permission-denied');
  });

  it('subscribes to service_orders and chats with strict rule-compliant filters', () => {
    const cb = vi.fn();
    const unsub = subscribeToServiceOrders(
      { uid: 'freelancer_uid_1', email: 'freela@ivaiconecta.com.br' },
      cb
    );

    const queriedSpecs = queryMock.mock.calls.map(([, ...constraints]) => constraints);
    const hasProviderUidFilter = queriedSpecs.some(cs => cs.some(c => c.field === 'providerUid' && c.value === 'freelancer_uid_1'));
    const hasClientUidFilter = queriedSpecs.some(cs => cs.some(c => c.field === 'clientUid' && c.value === 'freelancer_uid_1'));
    const hasParticipantUidsFilter = queriedSpecs.some(cs => cs.some(c => c.field === 'participantUids' && c.op === 'array-contains' && c.value === 'freelancer_uid_1'));

    expect(hasProviderUidFilter).toBe(true);
    expect(hasClientUidFilter).toBe(true);
    expect(hasParticipantUidsFilter).toBe(true);

    // Must not subscribe unfiltered on service_orders
    const unfilteredCalls = onSnapshotMock.mock.calls.filter(([target]) => !target.constraints);
    expect(unfilteredCalls.length).toBe(0);

    unsub();
  });

  it('skips remote service_orders/chats queries when user is another profile (visitor view)', () => {
    const cb = vi.fn();
    const unsub = subscribeToServiceOrders(
      { uid: 'other_freelancer_uid', email: 'other@ivaiconecta.com.br' },
      cb
    );

    expect(onSnapshotMock).not.toHaveBeenCalled();
    unsub();
  });

  it('attaches remote listeners once Firebase Auth finishes hydrating when currentUser starts null', () => {
    const prevUser = authState.currentUser;
    authState.currentUser = null;
    authChangeHandler = null;

    const cb = vi.fn();
    const unsub = subscribeToServiceOrders(
      { uid: 'freelancer_uid_1', email: 'freela@ivaiconecta.com.br' },
      cb
    );

    expect(onSnapshotMock).not.toHaveBeenCalled();
    expect(onAuthStateChangedMock).toHaveBeenCalledTimes(1);

    authChangeHandler({ uid: 'freelancer_uid_1', email: 'freela@ivaiconecta.com.br' });
    expect(onSnapshotMock).toHaveBeenCalled();

    authState.currentUser = prevUser;
    unsub();
  });

  it('falls back to Firestore chats and service_orders when submitServiceReview Cloud Function is not deployed', async () => {
    const undeployedErr = new Error('INTERNAL');
    undeployedErr.code = 'functions/internal';
    callableFnMock.mockRejectedValue(undeployedErr);

    // Simula regras antigas em produção rejeitando review/rating direto em service_orders, mas aceitando status/history
    updateDocMock.mockImplementation(async (ref, payload) => {
      if (ref.__collection === 'service_orders' && payload.review) {
        throw new Error('permission-denied on review field');
      }
      return undefined;
    });

    const res = await submitServiceReview('ord_999', {
      rating: 5,
      comment: 'guilherme é muito bom no atendimento',
      serviceId: 'srv_1',
      providerId: 'prov_uid_2',
      serviceTitle: 'Manutenção em Hardware',
      clientName: 'Amigo Candidato',
      clientAvatar: '',
    });

    expect(res.success).toBe(true);
    expect(res.review.rating).toBe(5);

    const chatUpdate = updateDocMock.mock.calls.find(([ref]) => ref.__collection === 'chats' && ref.id === 'ord_999');
    expect(chatUpdate).toBeTruthy();
    expect(chatUpdate[1]['serviceOrder.status']).toBe('avaliado');
    expect(chatUpdate[1]['serviceOrder.rating']).toBe(5);

    const orderStatusFallback = updateDocMock.mock.calls.find(
      ([ref, payload]) => ref.__collection === 'service_orders' && ref.id === 'ord_999' && !payload.review
    );
    expect(orderStatusFallback).toBeTruthy();
    expect(orderStatusFallback[1].status).toBe('avaliado');
  });

  it('rethrows explicit business-rule errors from submitServiceReview callable', async () => {
    const dupErr = new Error('Esta ordem já possui uma avaliação.');
    dupErr.code = 'functions/already-exists';
    callableFnMock.mockRejectedValue(dupErr);

    await expect(
      submitServiceReview('ord_999', {
        rating: 5,
        comment: 'guilherme é muito bom no atendimento',
      })
    ).rejects.toThrow('Esta ordem já possui uma avaliação.');
  });
});
