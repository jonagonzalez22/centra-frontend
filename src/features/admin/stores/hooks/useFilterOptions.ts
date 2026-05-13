import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { StoresService } from '../services/stores.service';
import type { FilterOptions } from '../types/store.types';

interface UseFilterOptionsReturn {
    filterOptions: FilterOptions | null;
    loading: boolean;
    error: string | null;
}

export const useFilterOptions = (): UseFilterOptionsReturn => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFilterOptions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options = await StoresService.getFilterOptions();
            setFilterOptions(options);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar opciones de filtro';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    return { filterOptions, loading, error };
};