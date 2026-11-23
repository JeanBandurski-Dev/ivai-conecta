import { describe, expect, it, vi, beforeEach } from 'vitest';

const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../lib/firebase.js', () => ({
  db: {},
  functions: {},
  auth: {
    currentUser: {
      uid: 'freelancer_uid_1',
      email: 'freela@ivaiconecta.com.br',
    },
  },
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => vi.fn()),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
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

import { addService, updateService, deleteService } from './servicesService.js';

describe('servicesService', () => {
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
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
});
