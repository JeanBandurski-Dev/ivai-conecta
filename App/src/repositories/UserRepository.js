/**
 * @file UserRepository.js
 * @description Repositório de dados para a coleção 'users' (Estudantes, Empresas, Freelancers, Professores, Instituições e Admins).
 */

import { where, query, getDocs } from 'firebase/firestore';
import { BaseRepository, handleFirestoreError } from './BaseRepository.js';
import { normalizeUserDTO, validateUserUpdateDTO } from '../models/UserDTO.js';
import { UserRole } from '../models/enums.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Busca um usuário pelo seu UID e retorna o DTO normalizado.
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findUserById(uid) {
    if (!uid) return null;
    const raw = await this.findById(uid);
    return raw ? normalizeUserDTO(raw) : null;
  }

  /**
   * Busca um usuário pelo e-mail institucional ou pessoal.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).toLowerCase().trim();
    try {
      const q = query(this.collectionRef, where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docSnap = snap.docs[0];
      return normalizeUserDTO({ id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() });
    } catch (err) {
      throw handleFirestoreError(err, 'findUserByEmail', this.collectionName);
    }
  }

  /**
   * Busca usuários por papel/role no sistema.
   * @param {string} role - UserRole (aluno, empresa, freelancer, etc.)
   * @returns {Promise<Array<Object>>}
   */
  async findUsersByRole(role) {
    if (!role) return [];
    try {
      const q = query(this.collectionRef, where('role', '==', String(role).toLowerCase()));
      const snap = await getDocs(q);
      return snap.docs.map(d => normalizeUserDTO({ id: d.id, firestoreId: d.id, ...d.data() }));
    } catch (err) {
      throw handleFirestoreError(err, 'findUsersByRole', this.collectionName);
    }
  }

  /**
   * Salva ou atualiza os dados completos de um usuário (Upsert por UID).
   * @param {string} uid
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async saveUser(uid, userData) {
    const id = String(uid || userData?.uid || userData?.id).trim();
    const normalized = normalizeUserDTO({ ...userData, id, uid: id });
    await this.set(id, normalized);
    return normalized;
  }

  /**
   * Atualiza parcialmente os dados do perfil do usuário.
   * @param {string} uid
   * @param {Object} partialData
   * @returns {Promise<Object>}
   */
  async updateUserProfile(uid, partialData) {
    const id = String(uid).trim();
    const validation = validateUserUpdateDTO(partialData);
    if (!validation.isValid) {
      throw new Error(`Dados inválidos para atualização de perfil: ${validation.errors.join(', ')}`);
    }

    await this.update(id, partialData);
    return this.findUserById(id);
  }

  /**
   * Assina atualizações em tempo real da coleção 'users'.
   * @param {Function} onUsersUpdated
   * @param {Function} [onError]
   * @returns {Function} Unsubscribe
   */
  subscribeToAllUsers(onUsersUpdated, onError = null) {
    return this.subscribe(
      (docs) => {
        const normalizedList = docs.map(normalizeUserDTO);
        onUsersUpdated(normalizedList);
      },
      onError
    );
  }

  /**
   * Assina talentos/estudantes em tempo real.
   * @param {Function} onTalentsUpdated
   * @param {Function} [onError]
   * @returns {Function} Unsubscribe
   */
  subscribeToTalents(onTalentsUpdated, onError = null) {
    const constraints = [where('role', '==', UserRole.ALUNO)];
    return this.subscribe(
      (docs) => {
        const normalizedList = docs.map(normalizeUserDTO);
        onTalentsUpdated(normalizedList);
      },
      onError,
      constraints
    );
  }
}

export const userRepository = new UserRepository();
