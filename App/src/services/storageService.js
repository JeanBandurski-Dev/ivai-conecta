// Storage Service for Ivaí Conecta (Firebase Cloud Storage + Resilient Image Compression Fallback)
import { storage, db, auth } from '../lib/firebase.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { updateAuthUser } from './authService.js';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function getStorageErrorMessage(error) {
  if (error?.code === 'storage/unauthorized') {
    return 'Permissão negada pelo armazenamento. Verifique sua conta e tente novamente.';
  }
  if (error?.code === 'storage/canceled' || error?.message === 'storage/timeout') {
    return 'O envio excedeu o tempo limite e foi cancelado.';
  }
  return 'Não foi possível concluir o armazenamento do arquivo. Tente novamente.';
}

function isSupportedImageFile(file) {
  if (!file) return false;
  const mime = String(file.type || '').toLowerCase().trim();
  if (ALLOWED_IMAGE_MIME_TYPES.has(mime)) return true;
  if (mime.startsWith('image/')) return true;
  const ext = String(file.name || '').split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

function uploadToStorage(storageRef, file, metadata, timeoutMs) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, metadata);
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        task.cancel();
      } catch {
        // Ignora erro de cancelamento
      }
      reject(new Error('storage/timeout'));
    }, timeoutMs);

    task.on(
      'state_changed',
      () => {},
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(error);
      },
      async () => {
        if (settled) return;
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(downloadUrl);
        } catch (error) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      }
    );
  });
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

  const rawExt = String(file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
  const fileExt = IMAGE_EXTENSIONS.has(rawExt) ? rawExt : 'jpg';
  const prefix = normalizedKind === 'cover' ? 'cover' : 'avatar';
  const filePath = `users/${cleanUid}/${prefix}_${Date.now()}.${fileExt}`;

  let finalUrl = null;
  let storageMode = 'cloud';

  try {
    const storageRef = ref(storage, filePath);
    const metadata = {
      contentType: file.type || (fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg'),
      customMetadata: {
        kind: normalizedKind,
        uploadedBy: cleanUid,
        uploadedAt: new Date().toISOString(),
      },
    };

    const downloadUrl = await uploadToStorage(storageRef, file, metadata, 12 * 1000);
    if (typeof downloadUrl === 'string' && /^https?:\/\//i.test(downloadUrl)) {
      finalUrl = downloadUrl;
    }
  } catch (cloudError) {
    console.warn(`[Firebase Storage] Upload de ${normalizedKind} indisponível, ativando compressão resiliente:`, cloudError?.message || cloudError?.code);
  }

  if (!finalUrl) {
    try {
      finalUrl = await compressImageFileToDataUrl(file, {
        isCover: normalizedKind === 'cover',
      });
      storageMode = 'compressed';
    } catch (fallbackErr) {
      console.error(`[Storage Fallback] Falha ao processar imagem (${normalizedKind}):`, fallbackErr);
      return {
        success: false,
        error: fallbackErr?.message || 'Não foi possível processar a imagem selecionada.',
      };
    }
  }

  const patch =
    normalizedKind === 'cover'
      ? { banner: finalUrl }
      : { avatar: finalUrl, photoURL: finalUrl };

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
    await updateAuthUser(patch);
  } catch (authErr) {
    console.warn(`[Storage] Aviso ao sincronizar sessão local (${normalizedKind}):`, authErr?.message);
  }

  return {
    success: true,
    url: finalUrl,
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

  const cleanUid = String(uid || 'anon_' + Date.now());
  const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `users/${cleanUid}/docs/${docType}_${Date.now()}_${cleanFilename}`;
  const storageRef = ref(storage, filePath);

  try {
    const metadata = {
      contentType: file.type || 'application/pdf',
      customMetadata: {
        docType,
        originalName: file.name,
        uploadedBy: cleanUid,
        uploadedAt: new Date().toISOString(),
      },
    };

    const downloadUrl = await uploadToStorage(storageRef, file, metadata, 60 * 1000);
    if (typeof downloadUrl !== 'string' || !/^https:\/\//i.test(downloadUrl)) {
      throw new Error('storage/url-not-confirmed');
    }

    return {
      success: true,
      url: downloadUrl,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.warn('[Firebase Storage Doc] Upload falhou:', error.message);
    return {
      success: false,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      error: getStorageErrorMessage(error),
    };
  }
}
