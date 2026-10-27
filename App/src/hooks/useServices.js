/**
 * @file useServices.js
 * @description Custom hook para consumo reativo e gerenciamento de serviços prestados por freelancers e alunos.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getServices,
  subscribeToServices,
  addService,
  updateService,
  deleteService,
} from '../services/servicesService.js';

/**
 * Hook para listar, assinar e manipular serviços com controle de estado.
 * @param {string} [city='Todas as Cidades']
 * @returns {{
 *   services: Array<Object>,
 *   isLoading: boolean,
 *   error: string|null,
 *   refresh: () => void,
 *   createService: (data: Object) => Promise<Object>,
 *   editService: (id: string|number, data: Object) => Promise<Object>,
 *   removeService: (id: string|number) => Promise<Array<Object>>
 * }}
 */
export function useServices(city = 'Todas as Cidades') {
  const [services, setServices] = useState(() => getServices(city));
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

    const initial = getServices(city);
    if (isMounted && Array.isArray(initial) && initial.length > 0) {
      setServices(initial);
      setIsLoading(false);
    }

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 6000);

    const unsubscribe = subscribeToServices(city, (updatedServices) => {
      if (!isMounted) return;
      clearTimeout(timer);
      if (Array.isArray(updatedServices)) {
        setServices(updatedServices);
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

  const createService = useCallback(async (serviceData) => {
    const created = await addService(serviceData);
    refresh();
    return created;
  }, [refresh]);

  const editService = useCallback(async (id, serviceData) => {
    const updated = await updateService(id, serviceData);
    refresh();
    return updated;
  }, [refresh]);

  const removeService = useCallback(async (id) => {
    const updatedList = await deleteService(id);
    refresh();
    return updatedList;
  }, [refresh]);

  return {
    services: Array.isArray(services) ? services : [],
    isLoading,
    error,
    refresh,
    createService,
    editService,
    removeService,
  };
}

export default useServices;
