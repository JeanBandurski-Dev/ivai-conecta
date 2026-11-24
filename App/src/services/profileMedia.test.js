import { describe, expect, it, vi, beforeEach } from 'vitest';

const setDocMock = vi.fn().mockResolvedValue(undefined);
const docMock = vi.fn((_db, col, id) => ({ col, id }));
const getDocMock = vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
const updateAuthUserMock = vi.fn().mockResolvedValue({});

vi.mock('../lib/firebase.js', () => ({
  storage: {},
  db: {},
  auth: { currentUser: { uid: 'user_123', getIdToken: vi.fn().mockResolvedValue('test-token') } },
  googleProvider: {},
  functions: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args) => docMock(...args),
  setDoc: (...args) => setDocMock(...args),
  getDoc: (...args) => getDocMock(...args),
  deleteField: () => '__DELETE_FIELD__',
}));

vi.mock('./authService.js', () => ({
  updateAuthUser: (...args) => updateAuthUserMock(...args),
}));

import { buildPublicProfilePayload } from './publicProfileSync.js';
import { uploadUserProfilePicture } from './storageService.js';

describe('publicProfileSync & storageService', () => {
  beforeEach(() => {
    setDocMock.mockClear();
    docMock.mockClear();
    getDocMock.mockClear();
    updateAuthUserMock.mockClear();
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/imagekit-auth')) {
        return {
          ok: true,
          json: async () => ({
            publicKey: 'test-public-key',
            token: 'test-token',
            signature: 'test-signature',
            expire: 4102444800,
            folder: 'ivai-conecta/users/user_123',
          }),
        };
      }
      if (String(url).includes('upload.imagekit.io')) {
        return {
          ok: true,
          json: async () => ({
            url: 'https://ik.imagekit.io/test/uploaded.jpg',
            fileId: 'test-file-id',
          }),
        };
      }
      return { ok: false, json: async () => ({ error: 'Erro de teste.' }) };
    });
  });

  it('preserves base64 data URLs without truncating them at 2048 chars', () => {
    const fakeAvatar = `data:image/webp;base64,${'A'.repeat(3000)}`;
    const fakeBanner = `data:image/jpeg;base64,${'B'.repeat(4000)}`;

    const payload = buildPublicProfilePayload('u_1', {
      role: 'aluno',
      name: 'Maria Silva',
      avatar: fakeAvatar,
      banner: fakeBanner,
    });

    expect(payload.avatar).toBe(fakeAvatar);
    expect(payload.banner).toBe(fakeBanner);
    expect(payload.photoURL).toBe('');
  });

  it('includes company fields and deletes cnpj for empresa role', () => {
    const payload = buildPublicProfilePayload('emp_1', {
      role: 'empresa',
      razaoSocial: 'Ivaí Tech Ltda',
      nomeFantasia: 'Ivaí Tech',
      avatar: 'https://example.com/logo.png',
      coverImage: 'https://example.com/cover.png',
      cnpj: '12.345.678/0001-90',
    });

    expect(payload.role).toBe('empresa');
    expect(payload.avatar).toBe('https://example.com/logo.png');
    expect(payload.banner).toBe('https://example.com/cover.png');
    expect(payload.cnpj).toBe('__DELETE_FIELD__');
  });

  it('uploads cover image to ImageKit and writes banner fields', async () => {
    const dataUrl = 'https://ik.imagekit.io/test/uploaded.jpg';
    const file = new File(['dummy-image'], 'capa.png', { type: 'image/png' });

    const res = await uploadUserProfilePicture(file, 'user_123', 'cover');

    expect(res.success).toBe(true);
    expect(res.kind).toBe('cover');
    expect(res.storageMode).toBe('imagekit');
    expect(res.url).toBe(dataUrl);

    expect(setDocMock).toHaveBeenCalledTimes(2);
    const [, writtenUserData] = setDocMock.mock.calls[0];
    expect(writtenUserData.banner).toBe(dataUrl);
    expect(writtenUserData.avatar).toBeUndefined();
    const [, writtenPublicData] = setDocMock.mock.calls[1];
    expect(writtenPublicData.banner).toBe(dataUrl);
    expect(writtenPublicData.uid).toBe('user_123');

    expect(updateAuthUserMock).toHaveBeenCalledWith({
      banner: dataUrl,
      bannerFileId: 'test-file-id',
    });
  });

  it('uploads avatar image to ImageKit and writes avatar/photoURL', async () => {
    const dataUrl = 'https://ik.imagekit.io/test/uploaded.jpg';
    const file = new File(['dummy-avatar'], 'perfil.jpg', { type: 'image/jpeg' });

    const res = await uploadUserProfilePicture(file, 'user_123', 'avatar');

    expect(res.success).toBe(true);
    expect(res.kind).toBe('avatar');
    expect(res.url).toBe(dataUrl);

    expect(setDocMock).toHaveBeenCalledTimes(2);
    const [, writtenUserData] = setDocMock.mock.calls[0];
    expect(writtenUserData.avatar).toBe(dataUrl);
    expect(writtenUserData.photoURL).toBe(dataUrl);
    expect(writtenUserData.banner).toBeUndefined();
    const [, writtenPublicData] = setDocMock.mock.calls[1];
    expect(writtenPublicData.avatar).toBe(dataUrl);
    expect(writtenPublicData.photoURL).toBe(dataUrl);
    expect(writtenPublicData.uid).toBe('user_123');

    expect(updateAuthUserMock).toHaveBeenCalledWith({
      avatar: dataUrl,
      photoURL: dataUrl,
      avatarFileId: 'test-file-id',
    });
  });

  it('rejects unsupported file formats and oversized files', async () => {
    const pdfFile = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const badTypeRes = await uploadUserProfilePicture(pdfFile, 'user_123', 'avatar');
    expect(badTypeRes.success).toBe(false);

    const bigFile = { name: 'huge.png', type: 'image/png', size: 11 * 1024 * 1024 };
    const bigRes = await uploadUserProfilePicture(bigFile, 'user_123', 'cover');
    expect(bigRes.success).toBe(false);
  });

  it('falls back to compressed DataURL when ImageKit endpoint is unavailable', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 405,
      json: async () => {
        throw new Error('Unexpected end of JSON input');
      },
    }));

    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2w==';
    globalThis.FileReader = class {
      readAsDataURL() {
        this.result = dataUrl;
        setTimeout(() => this.onload?.(), 0);
      }
    };

    const file = new File(['dummy-avatar'], 'aluno.jpg', { type: 'image/jpeg' });
    const res = await uploadUserProfilePicture(file, 'user_123', 'avatar');

    expect(res.success).toBe(true);
    expect(res.storageMode).toBe('compressed');
    expect(res.url).toBe(dataUrl);
    expect(setDocMock).toHaveBeenCalledTimes(2);
    const [, publicData] = setDocMock.mock.calls[1];
    expect(publicData.avatar).toBe(dataUrl);
    expect(publicData.photoURL).toBe('');
  });
});
