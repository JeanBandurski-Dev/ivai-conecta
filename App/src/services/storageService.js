// Storage Service for Ivaí Conecta (Firebase Cloud Storage + Resilient Fallback)
import { storage, db } from '../lib/firebase.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { updateAuthUser } from './authService.js';

function getStorageErrorMessage(error) {
  if (error?.code === 'storage/unauthorized') {
    return 'Permissão negada pelo armazenamento. Verifique sua conta e tente novamente.';
  }
  if (error?.code === 'storage/canceled' || error?.message === 'storage/timeout') {
    return 'O envio excedeu o tempo limite e foi cancelado.';
  }
  return 'Não foi possível concluir o armazenamento do arquivo. Tente novamente.';
}

function uploadToStorage(storageRef, file, metadata, timeoutMs) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, metadata);
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      task.cancel();
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

/**
 * Faz o upload da foto de perfil / avatar do usuário para o Firebase Storage.
 * @param {File} file - Arquivo de imagem selecionado pelo usuário
 * @param {string} uid - Identificador único do usuário
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadUserProfilePicture(file, uid) {
  if (!file) {
    return { success: false, error: 'Nenhum arquivo de imagem foi selecionado.' };
  }

  // 1. Validação de tamanho (máximo 5MB)
  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { success: false, error: 'A foto excede o limite máximo permitido de 5MB.' };
  }

  // 2. Validação de tipo de imagem
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedImageTypes.includes(file.type)) {
    return { success: false, error: 'Formato inválido. Por favor, envie uma imagem (JPG, PNG, WEBP).' };
  }

  const cleanUid = String(uid || 'anon_' + Date.now());
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `users/${cleanUid}/avatar_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  try {
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: cleanUid,
        uploadedAt: new Date().toISOString()
      }
    };

    const downloadUrl = await uploadToStorage(storageRef, file, metadata, 60 * 1000);

    // Salvar URL no Firestore
    try {
      await setDoc(doc(db, 'users', cleanUid), {
        avatar: downloadUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (dbErr) {
      console.warn('[Storage] Aviso ao atualizar avatar no Firestore:', dbErr.message);
    }

    // Atualizar no estado local
    updateAuthUser({ avatar: downloadUrl });

    return { success: true, url: downloadUrl };
  } catch (error) {
    console.warn('[Firebase Storage] Upload de avatar falhou:', error.message);
    return { success: false, error: getStorageErrorMessage(error) };
  }
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
        uploadedAt: new Date().toISOString()
      }
    };

    const downloadUrl = await uploadToStorage(storageRef, file, metadata, 60 * 1000);
    if (typeof downloadUrl !== 'string' || !/^https:\/\//i.test(downloadUrl)) {
      throw new Error('storage/url-not-confirmed');
    }

    return {
      success: true,
      url: downloadUrl,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.warn('[Firebase Storage Doc] Upload falhou:', error.message);
    return {
      success: false,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      error: getStorageErrorMessage(error)
    };
  }
}
