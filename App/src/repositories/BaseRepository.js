/**
 * @file BaseRepository.js
 * @description Repositório base com operações universais para o Cloud Firestore.
 * Padroniza tratamento de exceções, criação de referências, paginação e real-time listeners.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export class RepositoryError extends Error {
  constructor(message, code = 'REPOSITORY_ERROR', originalError = null) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Trata erros do Firebase Firestore mapeando para erros padronizados.
 * @param {Error} error
 * @param {string} operation
 * @param {string} collectionName
 * @returns {RepositoryError}
 */
export function handleFirestoreError(error, operation, collectionName) {
  const code = error?.code || 'unknown';
  let friendlyMessage = `Erro na operação '${operation}' na coleção '${collectionName}': ${error.message}`;

  if (code.includes('permission-denied')) {
    friendlyMessage = `Permissão negada ao acessar '${collectionName}' (${operation}). Verifique as regras de segurança.`;
  } else if (code.includes('not-found')) {
    friendlyMessage = `Registro não encontrado em '${collectionName}'.`;
  } else if (code.includes('unavailable')) {
    friendlyMessage = `Serviço temporariamente indisponível para '${collectionName}'. Operando em modo offline.`;
  }

  return new RepositoryError(friendlyMessage, code, error);
}

export class BaseRepository {
  /**
   * @param {string} collectionName
   */
  constructor(collectionName) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('BaseRepository requer um nome de coleção válido.');
    }
    this.collectionName = collectionName;
  }

  /**
   * Obtém a referência da coleção.
   */
  get collectionRef() {
    return collection(db, this.collectionName);
  }

  /**
   * Obtém a referência de um documento específico.
   * @param {string} id
   */
  getDocRef(id) {
    if (!id) throw new RepositoryError('ID do documento é obrigatório', 'INVALID_ID');
    return doc(db, this.collectionName, String(id).trim());
  }

  /**
   * Busca um documento por ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!id) return null;
    try {
      const snap = await getDoc(this.getDocRef(id));
      if (!snap.exists()) return null;
      return { id: snap.id, firestoreId: snap.id, ...snap.data() };
    } catch (err) {
      throw handleFirestoreError(err, 'findById', this.collectionName);
    }
  }

  /**
   * Busca todos os documentos da coleção com filtros opcionais.
   * @param {Array} queryConstraints - Cláusulas where, orderBy, limit
   * @returns {Promise<Array<Object>>}
   */
  async findAll(queryConstraints = []) {
    try {
      const q = queryConstraints.length > 0
        ? query(this.collectionRef, ...queryConstraints)
        : this.collectionRef;

      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data(),
      }));
    } catch (err) {
      throw handleFirestoreError(err, 'findAll', this.collectionName);
    }
  }

  /**
   * Cria um novo documento na coleção.
   * @param {Object} data - Dados a serem inseridos
   * @param {string|null} customId - ID customizado opcional
   * @returns {Promise<Object>}
   */
  async create(data, customId = null) {
    if (!data || typeof data !== 'object') {
      throw new RepositoryError('Dados inválidos para criação.', 'INVALID_DATA');
    }

    try {
      const payload = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _timestamp: serverTimestamp(),
      };

      if (customId) {
        const idStr = String(customId).trim();
        const docRef = this.getDocRef(idStr);
        await setDoc(docRef, payload, { merge: true });
        return { id: idStr, firestoreId: idStr, ...payload };
      } else {
        const docRef = await addDoc(this.collectionRef, payload);
        return { id: docRef.id, firestoreId: docRef.id, ...payload };
      }
    } catch (err) {
      throw handleFirestoreError(err, 'create', this.collectionName);
    }
  }

  /**
   * Atualiza campos de um documento existente.
   * @param {string} id
   * @param {Object} partialData
   * @returns {Promise<Object>}
   */
  async update(id, partialData) {
    if (!id) throw new RepositoryError('ID do documento é obrigatório para atualização', 'INVALID_ID');
    if (!partialData || typeof partialData !== 'object') {
      throw new RepositoryError('Dados parciais inválidos para atualização', 'INVALID_DATA');
    }

    try {
      const docRef = this.getDocRef(id);
      const payload = {
        ...partialData,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, payload);
      return { id: String(id), firestoreId: String(id), ...payload };
    } catch (err) {
      throw handleFirestoreError(err, 'update', this.collectionName);
    }
  }

  /**
   * Salva ou mescla um documento com ID conhecido (Upsert).
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async set(id, data) {
    if (!id) throw new RepositoryError('ID é obrigatório para setDoc', 'INVALID_ID');
    try {
      const docRef = this.getDocRef(id);
      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, payload, { merge: true });
      return { id: String(id), firestoreId: String(id), ...payload };
    } catch (err) {
      throw handleFirestoreError(err, 'set', this.collectionName);
    }
  }

  /**
   * Remove um documento por ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    if (!id) throw new RepositoryError('ID é obrigatório para exclusão', 'INVALID_ID');
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      throw handleFirestoreError(err, 'delete', this.collectionName);
    }
  }

  /**
   * Assina atualizações em tempo real com limpeza automática (Unsubscribe).
   * @param {Function} onNext - Callback invocado a cada emissão
   * @param {Function} [onError] - Callback de erro
   * @param {Array} [queryConstraints] - Cláusulas de query opcionais
   * @returns {Function} Unsubscribe function
   */
  subscribe(onNext, onError = null, queryConstraints = []) {
    if (typeof onNext !== 'function') {
      throw new RepositoryError('onNext deve ser uma função.', 'INVALID_CALLBACK');
    }

    try {
      const q = queryConstraints.length > 0
        ? query(this.collectionRef, ...queryConstraints)
        : this.collectionRef;

      return onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(d => ({
            id: d.id,
            firestoreId: d.id,
            ...d.data(),
          }));
          onNext(items);
        },
        (error) => {
          const handled = handleFirestoreError(error, 'subscribe', this.collectionName);
          if (typeof onError === 'function') {
            onError(handled);
          } else {
            console.warn(`[Repository: ${this.collectionName}] Falha no listener:`, handled.message);
          }
        }
      );
    } catch (err) {
      const handled = handleFirestoreError(err, 'subscribe_init', this.collectionName);
      if (typeof onError === 'function') onError(handled);
      return () => {};
    }
  }
}
