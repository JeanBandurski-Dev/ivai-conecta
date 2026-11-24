// Central public/private file storage adapter for Ivaí Conecta.
import { db, auth } from '../lib/firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateAuthUser } from './authService.js';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
let _storageBucketUnavailable = false;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function getStorageErrorMessage(error) {
  return error?.message || 'Não foi possível concluir o armazenamento do arquivo. Tente novamente.';
}

function isSupportedImageFile(file) {
  if (!file) return false;
  const mime = String(file.type || '').toLowerCase().trim();
  if (ALLOWED_IMAGE_MIME_TYPES.has(mime)) return true;
  if (mime.startsWith('image/')) return true;
  const ext = String(file.name || '').split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

const IMAGEKIT_AUTH_ENDPOINT =
  String(import.meta.env?.VITE_IMAGEKIT_UPLOAD_AUTH_ENDPOINT || '').trim() || '/api/imagekit-auth';
const IMAGEKIT_DELETE_ENDPOINT =
  String(import.meta.env?.VITE_IMAGEKIT_DELETE_ENDPOINT || '').trim() || '/api/imagekit-delete';

async function getFirebaseIdToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado.');
  if (typeof currentUser.getIdToken !== 'function') {
    throw new Error('Sessão Firebase inválida.');
  }
  return currentUser.getIdToken();
}

export async function uploadPublicImageToImageKit(file, uid, folder, kind = 'post') {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('A imagem excede o limite máximo permitido de 10MB.');
  }
  if (!isSupportedImageFile(file)) {
    throw new Error('Formato inválido. Por favor, envie uma imagem (JPG, PNG, WEBP ou GIF).');
  }

  const idToken = await getFirebaseIdToken();
  const authResponse = await fetch(IMAGEKIT_AUTH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ uid, folder, kind }),
  });
  if (!authResponse.ok) {
    const payload = await authResponse.json().catch(() => ({}));
    throw new Error(payload.error || 'O serviço de imagens não está configurado.');
  }

  const authData = await authResponse.json();
  if (!authData.publicKey || !authData.token || !authData.signature || !authData.expire) {
    throw new Error('Resposta inválida do serviço de imagens.');
  }

  const extension = String(file.name || '').split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  const form = new FormData();
  form.append('file', file);
  form.append('fileName', `${kind}_${Date.now()}.${extension}`);
  form.append('publicKey', authData.publicKey);
  form.append('signature', authData.signature);
  form.append('expire', String(authData.expire));
  form.append('token', authData.token);
  form.append('folder', authData.folder);
  form.append('useUniqueFileName', 'true');
  form.append('isPrivateFile', 'false');

  const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: form,
  });
  const payload = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    throw new Error(payload.message || 'Falha ao enviar a imagem.');
  }
  if (!payload.url || !payload.fileId) {
    throw new Error('O serviço de imagens não retornou a URL do arquivo.');
  }
  return { url: payload.url, fileId: payload.fileId };
}

export async function deletePublicImage(fileId, uid) {
  if (!fileId || String(fileId).startsWith('data:')) return { success: true };
  const idToken = await getFirebaseIdToken();
  const response = await fetch(IMAGEKIT_DELETE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ uid, fileId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Não foi possível excluir a imagem anterior.');
  }
  return { success: true };
}

export async function getPrivateDocumentUrl(privateReference) {
  if (!privateReference || !String(privateReference).startsWith('supabase://')) {
    return { success: false, error: 'O documento não possui uma referência privada suportada.' };
  }
  try {
    const idToken = await getFirebaseIdToken();
    const response = await fetch('/api/supabase-private-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ privateReference }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível abrir o documento privado.');
    }
    return { success: true, url: payload.url };
  } catch (error) {
    return { success: false, error: getStorageErrorMessage(error) };
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader indisponível'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image API indisponível'));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Arquivo de imagem inválido ou corrompido.'));
    img.src = src;
  });
}

/**
 * Redimensiona e comprime a imagem no navegador para caber com segurança no Firestore e localStorage
 * quando o Firebase Storage não estiver disponível.
 */
export async function compressImageFileToDataUrl(file, options = {}) {
  const isCover = Boolean(options.isCover);
  const maxWidth = options.maxWidth || (isCover ? 1280 : 420);
  const maxHeight = options.maxHeight || (isCover ? 480 : 420);
  const maxChars = options.maxChars || (isCover ? 260000 : 140000);

  const rawDataUrl = await readFileAsDataUrl(file);
  if (!rawDataUrl) {
    throw new Error('Não foi possível ler a imagem selecionada.');
  }

  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    if (rawDataUrl.length <= maxChars) return rawDataUrl;
    throw new Error('A imagem é muito grande para salvamento sem compressão.');
  }

  try {
    const img = await loadImageElement(rawDataUrl);
    const origW = img.naturalWidth || img.width || maxWidth;
    const origH = img.naturalHeight || img.height || maxHeight;

    const scale = Math.min(1, maxWidth / origW, maxHeight / origH);
    let targetW = Math.max(1, Math.round(origW * scale));
    let targetH = Math.max(1, Math.round(origH * scale));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (rawDataUrl.length <= maxChars) return rawDataUrl;
      throw new Error('Contexto gráfico indisponível para redimensionamento.');
    }

    const mimeCandidates = ['image/webp', 'image/jpeg'];
    const qualitySteps = [0.84, 0.72, 0.58, 0.45, 0.34];

    for (let attempt = 0; attempt < 2; attempt += 1) {
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      for (const mime of mimeCandidates) {
        for (const quality of qualitySteps) {
          const result = canvas.toDataURL(mime, quality);
          if (result && result.startsWith('data:image/') && result.length <= maxChars) {
            return result;
          }
        }
      }

      // Reduz dimensões em 25% caso ainda exceda o limite
      targetW = Math.max(160, Math.round(targetW * 0.75));
      targetH = Math.max(120, Math.round(targetH * 0.75));
    }

    // Última tentativa com qualidade mínima em JPEG
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const fallbackJpeg = canvas.toDataURL('image/jpeg', 0.3);
    if (fallbackJpeg && fallbackJpeg.length <= maxChars) {
      return fallbackJpeg;
    }

    throw new Error('A imagem selecionada excede o limite de tamanho após compressão.');
  } catch (err) {
    if (rawDataUrl.length <= maxChars) {
      return rawDataUrl;
    }
    throw err;
  }
}

/**
 * Faz o upload da foto de perfil (`avatar`) ou imagem de capa (`cover` / `banner`) do usuário.
 * Tenta Firebase Storage primeiro e aplica fallback resiliente com compressão em Canvas + Firestore
 * caso o bucket de Storage esteja indisponível.
 *
 * @param {File} file - Arquivo de imagem selecionado pelo usuário
 * @param {string} uid - Identificador único do usuário
 * @param {'avatar'|'cover'|'banner'} [kind='avatar'] - Tipo da imagem (perfil ou capa)
 * @returns {Promise<{success: boolean, url?: string, kind?: string, storageMode?: 'cloud'|'compressed', error?: string}>}
 */
export async function uploadUserProfilePicture(file, uid, kind = 'avatar') {
  if (!file) {
    return { success: false, error: 'Nenhum arquivo de imagem foi selecionado.' };
  }

  // 1. Validação de tamanho (máximo 10MB antes de envio/compressão)
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { success: false, error: 'A imagem excede o limite máximo permitido de 10MB.' };
  }

  // 2. Validação de tipo de imagem
  if (!isSupportedImageFile(file)) {
    return { success: false, error: 'Formato inválido. Por favor, envie uma imagem (JPG, PNG, WEBP ou GIF).' };
  }

  const normalizedKind = kind === 'cover' || kind === 'banner' ? 'cover' : 'avatar';
  const cleanUid = String(uid || auth.currentUser?.uid || '').trim();
  if (!cleanUid) {
    return { success: false, error: 'Usuário não identificado. Faça login novamente.' };
  }

  let previousFileId = '';
  try {
    const [userSnapshot, publicSnapshot] = await Promise.all([
      getDoc(doc(db, 'users', cleanUid)),
      getDoc(doc(db, 'public_profiles', cleanUid)),
    ]);
    const userData = userSnapshot.exists() ? userSnapshot.data() : {};
    const publicData = publicSnapshot.exists() ? publicSnapshot.data() : {};
    previousFileId =
      normalizedKind === 'cover'
        ? String(publicData.bannerFileId || userData.bannerFileId || '')
        : String(publicData.avatarFileId || userData.avatarFileId || '');
  } catch {
    previousFileId = '';
  }

  let finalUrl = '';
  let uploadedFileId = '';
  let storageMode = 'imagekit';

  try {
    const uploaded = await uploadPublicImageToImageKit(
      file,
      cleanUid,
      `ivai-conecta/users/${cleanUid}`,
      normalizedKind
    );
    finalUrl = uploaded.url;
    uploadedFileId = uploaded.fileId || '';
  } catch (uploadError) {
    console.warn(
      `[Storage] ImageKit indisponível para ${normalizedKind}, ativando compressão resiliente:`,
      uploadError?.message
    );
    try {
      finalUrl = await compressImageFileToDataUrl(file, {
        isCover: normalizedKind === 'cover',
      });
      storageMode = 'compressed';
    } catch (fallbackErr) {
      return {
        success: false,
        error: getStorageErrorMessage(fallbackErr) || getStorageErrorMessage(uploadError),
      };
    }
  }

  const patch =
    normalizedKind === 'cover'
      ? { banner: finalUrl, ...(uploadedFileId ? { bannerFileId: uploadedFileId } : {}) }
      : {
          avatar: finalUrl,
          photoURL: finalUrl,
          ...(uploadedFileId ? { avatarFileId: uploadedFileId } : {}),
        };

  const publicPatch =
    normalizedKind === 'cover'
      ? { banner: finalUrl, ...(uploadedFileId ? { bannerFileId: uploadedFileId } : {}) }
      : {
          avatar: finalUrl,
          photoURL: storageMode === 'compressed' ? '' : finalUrl,
          ...(uploadedFileId ? { avatarFileId: uploadedFileId } : {}),
        };

  try {
    await setDoc(
      doc(db, 'users', cleanUid),
      {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (dbErr) {
    console.warn(`[Storage] Aviso ao atualizar ${normalizedKind} no Firestore:`, dbErr?.message);
  }

  try {
    await setDoc(
      doc(db, 'public_profiles', cleanUid),
      {
        ...publicPatch,
        uid: cleanUid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (publicProfileErr) {
    console.warn(`[Storage] Aviso ao atualizar ${normalizedKind} no perfil público:`, publicProfileErr?.message);
  }

  try {
    await updateAuthUser(patch);
  } catch (authErr) {
    console.warn(`[Storage] Aviso ao sincronizar sessão local (${normalizedKind}):`, authErr?.message);
  }

  if (storageMode === 'imagekit' && previousFileId && previousFileId !== uploadedFileId) {
    try {
      await deletePublicImage(previousFileId, cleanUid);
    } catch (deleteError) {
      console.warn(`[Storage] Não foi possível excluir a imagem anterior (${normalizedKind}):`, deleteError?.message);
    }
  }

  return {
    success: true,
    url: finalUrl,
    ...(uploadedFileId ? { fileId: uploadedFileId } : {}),
    kind: normalizedKind,
    storageMode,
  };
}

/**
 * Faz o upload de documentos comprobatórios (Declaração Estudantil, Cartão CNPJ, Currículo PDF).
 * @param {File} file - Arquivo (PDF ou Imagem)
 * @param {string} uid - Identificador do usuário
 * @param {'student_proof'|'cnpj_proof'|'resume'} docType - Categoria do documento
 * @returns {Promise<{success: boolean, url?: string, filename?: string, error?: string}>}
 */
export async function uploadUserDocument(file, uid, docType = 'document') {
  if (!file) {
    return { success: false, error: 'Nenhum documento foi selecionado.' };
  }
  if (!uid) {
    return { success: false, error: 'Usuário não identificado. Faça login novamente.' };
  }

  // Limite de 10MB
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { success: false, error: 'O documento excede o limite máximo permitido de 10MB.' };
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Formato inválido. Envie PDF, JPG, PNG ou WEBP.' };
  }

  const cleanUid = String(uid || '').trim();
  if (!cleanUid) {
    return { success: false, error: 'Usuário não identificado. Faça login novamente.' };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  const base64 = btoa(binary);

  try {
    const idToken = await getFirebaseIdToken();
    const response = await fetch('/api/supabase-private-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        uid: cleanUid,
        docType,
        fileName: file.name,
        contentType: file.type || 'application/pdf',
        fileBase64: base64,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'O armazenamento privado não está configurado.');
    }
    return {
      success: true,
      url: payload.privateReference,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    return {
      success: false,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      error: getStorageErrorMessage(error),
    };
  }
}
