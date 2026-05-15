import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { StoresService } from '../services/stores.service';
import type { Store } from '../types/store.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseStoreReturn {
    store: Store | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useStore = (id: string | undefined): UseStoreReturn => {
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStore = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await StoresService.getById(id);
            setStore(data);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'No se pudo cargar la tienda.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStore();
    }, [fetchStore]);

    return { store, loading, error, refetch: fetchStore };
};