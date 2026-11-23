import { describe, expect, it, vi, beforeEach } from 'vitest';

const setDocMock = vi.fn().mockResolvedValue(undefined);
const docMock = vi.fn((_db, col, id) => ({ col, id }));
const updateAuthUserMock = vi.fn().mockResolvedValue({});

vi.mock('../lib/firebase.js', () => ({
  storage: {},
  db: {},
  auth: { currentUser: { uid: 'user_123' } },
  googleProvider: {},
  functions: {},
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage, path) => ({ path })),
  uploadBytesResumable: vi.fn(() => {
    const handlers = {};
    const task = {
      snapshot: { ref: {} },
      cancel: vi.fn(),
      on: vi.fn((_evt, _progress, onError) => {
        handlers.onError = onError;
        setTimeout(() => {
          onError({ code: 'storage/unknown', message: 'Not Found' });
        }, 0);
      }),
    };
    return task;
  }),
  getDownloadURL: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args) => docMock(...args),
  setDoc: (...args) => setDocMock(...args),
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
    updateAuthUserMock.mockClear();
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

  it('uploads cover image to banner without overwriting avatar when Storage is unavailable', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const file = new File(['dummy-image'], 'capa.png', { type: 'image/png' });
    // Polyfill FileReader for Node test environment
    globalThis.FileReader = class {
      readAsDataURL() {
        this.result = dataUrl;
        setTimeout(() => this.onload?.(), 0);
      }
    };

    const res = await uploadUserProfilePicture(file, 'user_123', 'cover');

    expect(res.success).toBe(true);
    expect(res.kind).toBe('cover');
    expect(res.storageMode).toBe('compressed');
    expect(res.url).toBe(dataUrl);

    expect(setDocMock).toHaveBeenCalledTimes(1);
    const [, writtenData] = setDocMock.mock.calls[0];
    expect(writtenData.banner).toBe(dataUrl);
    expect(writtenData.avatar).toBeUndefined();

    expect(updateAuthUserMock).toHaveBeenCalledWith({ banner: dataUrl });
  });

  it('uploads avatar image to avatar/photoURL without touching banner', async () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2w==';
    const file = new File(['dummy-avatar'], 'perfil.jpg', { type: 'image/jpeg' });
    globalThis.FileReader = class {
      readAsDataURL() {
        this.result = dataUrl;
        setTimeout(() => this.onload?.(), 0);
      }
    };

    const res = await uploadUserProfilePicture(file, 'user_123', 'avatar');

    expect(res.success).toBe(true);
    expect(res.kind).toBe('avatar');
    expect(res.url).toBe(dataUrl);

    const [, writtenData] = setDocMock.mock.calls[0];
    expect(writtenData.avatar).toBe(dataUrl);
    expect(writtenData.photoURL).toBe(dataUrl);
    expect(writtenData.banner).toBeUndefined();

    expect(updateAuthUserMock).toHaveBeenCalledWith({
      avatar: dataUrl,
      photoURL: dataUrl,
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
});
