/**
 * @file useTalents.js
 * @description Custom hook para consumo reativo e gerenciamento do Banco de Talentos e Professores.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getTalents,
  getVerifiedTeachers,
  subscribeToTalents,
  subscribeToTeachers,
} from '../services/talentsService.js';

/**
 * Hook para listar e assinar talentos e professores em tempo real.
 * @param {string} [city='Todas as Cidades']
 * @returns {{
 *   talents: Array<Object>,
 *   teachers: Array<Object>,
 *   isLoading: boolean,
 *   error: string|null,
 *   refresh: () => void
 * }}
 */
export function useTalents(city = 'Todas as Cidades') {
  const [talents, setTalents] = useState(() => getTalents(city));
  const [teachers, setTeachers] = useState(() => getVerifiedTeachers());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick(prev => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Carregamento síncrono inicial apenas se houver registros
    const initialTalents = getTalents(city);
    const initialTeachers = getVerifiedTeachers();
    if (isMounted) {
      if (Array.isArray(initialTalents) && initialTalents.length > 0) {
        setTalents(initialTalents);
        setIsLoading(false);
      }
      if (Array.isArray(initialTeachers) && initialTeachers.length > 0) {
        setTeachers(initialTeachers);
      }
    }

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 6000);

    const unsubTalents = subscribeToTalents(city, (updatedTalents) => {
      if (!isMounted) return;
      clearTimeout(timer);
      if (Array.isArray(updatedTalents)) setTalents(updatedTalents);
      setIsLoading(false);
    });

    const unsubTeachers = subscribeToTeachers((updatedTeachers) => {
      if (!isMounted) return;
      if (Array.isArray(updatedTeachers)) setTeachers(updatedTeachers);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (typeof unsubTalents === 'function') unsubTalents();
      if (typeof unsubTeachers === 'function') unsubTeachers();
    };
  }, [city, tick]);

  return {
    talents: Array.isArray(talents) ? talents : [],
    teachers: Array.isArray(teachers) ? teachers : [],
    isLoading,
    error,
    refresh,
  };
}

export default useTalents;
