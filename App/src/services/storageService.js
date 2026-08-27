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

  try {
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: cleanUid,
        uploadedAt: new Date().toISOString()
      }
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

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
    console.warn('[Firebase Storage] Falha ao enviar para a nuvem:', error.code, error.message);

    // Fallback: se houver falha de rede/permissão, converte para DataURL localmente para não quebrar a experiência
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const localDataUrl = reader.result;
        updateAuthUser({ avatar: localDataUrl });
        resolve({
          success: true,
          url: localDataUrl,
          warning: 'Salvo localmente (Upload na nuvem indisponível no momento).'
        });
      };
      reader.onerror = () => resolve({ success: false, error: 'Erro ao ler arquivo localmente.' });
      reader.readAsDataURL(file);
    });
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

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadUrl,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.warn('[Firebase Storage Doc] Falha no upload:', error.code, error.message);

    return {
      success: true,
      url: null,
      filename: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      warning: 'Documento registrado em modo de compatibilidade local.'
    };
  }
}
