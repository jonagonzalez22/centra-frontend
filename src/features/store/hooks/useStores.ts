import { useState, useEffect } from 'react';
import { Store } from '../types/store.types';
import { StoresService } from '../services/stores.service';

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await StoresService.getAll();
      setStores(data);
    } catch (err) {
      setError('Error al cargar las tiendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return { stores, loading, error, refetch: fetchStores };
};
