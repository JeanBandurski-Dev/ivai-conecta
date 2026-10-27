/**
 * @file useJobs.js
 * @description Custom hook para consumo reativo e gerenciamento de vagas de emprego.
 */

import { useState, useEffect, useCallback } from 'react';
import { getJobs, subscribeToJobs } from '../services/jobsService.js';

/**
 * Hook para listar e assinar vagas em tempo real com controle de ciclo de vida e estado.
 * @param {string} [city='Todas as Cidades']
 * @returns {{
 *   jobs: Array<Object>,
 *   isLoading: boolean,
 *   error: string|null,
 *   refresh: () => void
 * }}
 */
export function useJobs(city = 'Todas as Cidades') {
  const [jobs, setJobs] = useState(() => getJobs(city));
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

    // Emissão imediata do cache síncrono somente se houver registros
    const cached = getJobs(city);
    if (isMounted && Array.isArray(cached) && cached.length > 0) {
      setJobs(cached);
      setIsLoading(false);
    }

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 6000);

    const unsubscribe = subscribeToJobs(city, (updatedJobs) => {
      if (!isMounted) return;
      clearTimeout(timer);
      if (Array.isArray(updatedJobs)) {
        setJobs(updatedJobs);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [city, tick]);

  return {
    jobs: Array.isArray(jobs) ? jobs : [],
    isLoading,
    error,
    refresh,
  };
}

export default useJobs;
