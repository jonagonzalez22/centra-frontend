import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import type { FilterOptions, Store, StoresFilters } from '../types/store.types';
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
    filterOptions: FilterOptions | null;
    filterOptionsLoading: boolean;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
            return (err as { message: string }).message;
        }
        if ('data' in err && (err as { data?: { message?: string } }).data?.message) {
            return (err as { data: { message: string } }).data.message;
        }
    }
    return fallback;
};

export const useStores = (): UseStoresReturn => {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<StoresPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [filterOptionsLoading, setFilterOptionsLoading] = useState<boolean>(true);

    const fetchFilterOptions = useCallback(async () => {
        setFilterOptionsLoading(true);
        try {
            const options = await StoresService.getFilterOptions();
            setFilterOptions(options);
        } catch (err) {
            const errorMessage = getErrorMessage(err, 'Error al cargar opciones de filtro');
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setFilterOptionsLoading(false);
        }
    }, []);

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
        } catch (err) {
            const errorMessage = getErrorMessage(err, 'Error al cargar las tiendas');
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
        fetchFilterOptions();
    }, [fetchStores, fetchFilterOptions]);

    return { stores, loading, error, pagination, refetch, filterOptions, filterOptionsLoading };
};