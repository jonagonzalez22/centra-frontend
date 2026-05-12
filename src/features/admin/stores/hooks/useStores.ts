import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import type { Store, StoresFilters } from '../types/store.types';
import { StoresService } from '../services/stores.service';

export interface StoresPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseStoresReturn {
    stores: Store[];
    loading: boolean;
    error: string | null;
    pagination: StoresPagination;
    refetch: (filters?: StoresFilters) => void;
}

export const useStores = (): UseStoresReturn => {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<StoresPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });

    const fetchStores = useCallback(async (filters: StoresFilters) => {
        try {
            setLoading(true);
            setError(null);
            const response = await StoresService.getStores(filters);
            setStores(response.items);
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch {
            const errorMessage = 'Error al cargar las tiendas';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(
        (filters: StoresFilters = {}) => {
            fetchStores({ ...filters, page: 1 });
        },
        [fetchStores]
    );

    useEffect(() => {
        fetchStores({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { stores, loading, error, pagination, refetch };
};