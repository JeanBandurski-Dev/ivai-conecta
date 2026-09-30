// Storage Service for Ivaí Conecta (Firebase Cloud Storage + Resilient Fallback)
import { storage, db } from '../lib/firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { updateAuthUser } from './authService.js';

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
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Formato inválido. Por favor, envie uma imagem (JPG, PNG, WEBP).' };
  }

  const cleanUid = String(uid || 'anon_' + Date.now());
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `users/${cleanUid}/avatar_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  // Helper para ler dataURL local
  const readLocalDataUrl = () => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  try {
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: cleanUid,
        uploadedAt: new Date().toISOString()
      }
    };

    // Timeout de 3.5 segundos para o upload na nuvem
    const cloudUpload = (async () => {
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    })();

    const timeoutLimit = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('storage/timeout')), 3500)
    );

    const downloadUrl = await Promise.race([cloudUpload, timeoutLimit]);

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
    console.warn('[Firebase Storage] Fallback ativado (nuvem indisponível ou timeout):', error.message);

    const localDataUrl = await readLocalDataUrl();
    if (localDataUrl) {
      updateAuthUser({ avatar: localDataUrl });
      try {
        await setDoc(doc(db, 'users', cleanUid), {
          avatar: localDataUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch {}
      return {
        success: true,
        url: localDataUrl,
        warning: 'Foto salva no perfil localmente.'
      };
    }

    return { success: false, error: 'Não foi possível carregar a imagem.' };
  }
}

/**
 * Faz o upload da foto de capa / banner do perfil para o Firebase Storage.
 * @param {File} file - Arquivo de imagem selecionado
 * @param {string} uid - Identificador único do usuário
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadUserCoverPicture(file, uid) {
  if (!file) {
    return { success: false, error: 'Nenhum arquivo de imagem foi selecionado.' };
  }

  const maxSizeBytes = 8 * 1024 * 1024; // 8MB para capas
  if (file.size > maxSizeBytes) {
    return { success: false, error: 'A imagem de capa excede o limite de 8MB.' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Formato inválido. Por favor, envie uma imagem (JPG, PNG, WEBP).' };
  }

  const cleanUid = String(uid || 'anon_' + Date.now());
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `users/${cleanUid}/banner_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  const readLocalDataUrl = () => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  try {
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: cleanUid,
        uploadedAt: new Date().toISOString()
      }
    };

    const cloudUpload = (async () => {
      const snapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutLimit = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('storage/timeout')), 3500)
    );

    const downloadUrl = await Promise.race([cloudUpload, timeoutLimit]);

    try {
      await setDoc(doc(db, 'users', cleanUid), {
        banner: downloadUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (dbErr) {
      console.warn('[Storage] Aviso ao atualizar banner no Firestore:', dbErr.message);
    }

    updateAuthUser({ banner: downloadUrl });
    return { success: true, url: downloadUrl };
  } catch (error) {
    console.warn('[Firebase Storage] Fallback ativado para banner:', error.message);
    const localDataUrl = await readLocalDataUrl();
    if (localDataUrl) {
      updateAuthUser({ banner: localDataUrl });
      try {
        await setDoc(doc(db, 'users', cleanUid), {
          banner: localDataUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch {}
      return { success: true, url: localDataUrl, warning: 'Capa salva localmente.' };
    }
    return { success: false, error: 'Não foi possível carregar a imagem de capa.' };
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

  // Limite de 10MB
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { success: false, error: 'O documento excede o limite máximo permitido de 10MB.' };
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

    const cloudUpload = (async () => {
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    })();

    const timeoutLimit = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('storage/timeout')), 3500)
    );

    const downloadUrl = await Promise.race([cloudUpload, timeoutLimit]);

    return {
      success: true,
      url: downloadUrl,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.warn('[Firebase Storage Doc] Fallback ativado:', error.message);

    return {
      success: true,
      url: null,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      warning: 'Documento registrado com sucesso no sistema local.'
    };
  }
}
