/**
 * @file useApplications.js
 * @description Custom hook para consumo reativo e gerenciamento de candidaturas do usuário.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserApplications,
  subscribeToApplications,
  applyToJob,
} from '../services/jobsService.js';

/**
 * Hook para listar, assinar e submeter candidaturas em tempo real.
 * @param {Object|string|null} candidateUserOrUid
 * @returns {{
 *   applications: Array<Object>,
 *   isLoading: boolean,
 *   error: string|null,
 *   refresh: () => void,
 *   apply: (jobId: string|number, userPayload?: Object) => Promise<Object>,
 *   hasApplied: (jobId: string|number) => boolean
 * }}
 */
export function useApplications(candidateUserOrUid) {
  const [applications, setApplications] = useState(() => {
    const id = typeof candidateUserOrUid === 'object' ? candidateUserOrUid?.uid : candidateUserOrUid;
    return getUserApplications(id);
  });
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

    const initial = getUserApplications(
      typeof candidateUserOrUid === 'object' ? candidateUserOrUid?.uid : candidateUserOrUid
    );
    if (isMounted && Array.isArray(initial)) {
      setApplications(initial);
      setIsLoading(false);
    }

    const unsubscribe = subscribeToApplications(candidateUserOrUid, (updatedApps) => {
      if (!isMounted) return;
      if (Array.isArray(updatedApps)) {
        setApplications(updatedApps);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [candidateUserOrUid, tick]);

  const apply = useCallback(async (jobId, userPayload = null) => {
    const targetUser = userPayload || (typeof candidateUserOrUid === 'object' ? candidateUserOrUid : null);
    const result = await applyToJob(jobId, targetUser);
    refresh();
    return result;
  }, [candidateUserOrUid, refresh]);

  const hasApplied = useCallback((jobId) => {
    if (!jobId) return false;
    const targetId = String(jobId);
    return applications.some(a =>
      String(a.jobId) === targetId ||
      String(a.firestoreJobId) === targetId ||
      String(a.originalJobId) === targetId
    );
  }, [applications]);

  return {
    applications: Array.isArray(applications) ? applications : [],
    isLoading,
    error,
    refresh,
    apply,
    hasApplied,
  };
}

export default useApplications;
