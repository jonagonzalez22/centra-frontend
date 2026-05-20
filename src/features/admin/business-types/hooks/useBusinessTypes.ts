import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { BusinessTypesService } from '../services/business-types.service';
import type { BusinessType, BusinessTypesFilters } from '../types/business-type.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface BusinessTypesPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseBusinessTypesReturn {
    businessTypes: BusinessType[];
    loading: boolean;
    error: string | null;
    pagination: BusinessTypesPagination;
    refetch: (filters?: BusinessTypesFilters) => void;
    deleteBusinessType: (id: number) => Promise<void>;
}

export const useBusinessTypes = (): UseBusinessTypesReturn => {
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<BusinessTypesPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const currentPageRef = useRef(1);

    const fetchBusinessTypes = useCallback(async (filters: BusinessTypesFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await BusinessTypesService.getAll(filters);
            setBusinessTypes(response.items);
            currentPageRef.current = response.current_page;
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar los tipos de negocio.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(
        (filters: BusinessTypesFilters = {}) => {
            fetchBusinessTypes({ page: 1, ...filters });
        },
        [fetchBusinessTypes]
    );

    const deleteBusinessType = useCallback(
        async (id: number) => {
            try {
                await BusinessTypesService.delete(id);
                message.success('Tipo de negocio eliminado correctamente.');
                fetchBusinessTypes({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar el tipo de negocio.');
                throw err;
            }
        },
        [fetchBusinessTypes]
    );

    useEffect(() => {
        fetchBusinessTypes({ page: 1 });
    }, [fetchBusinessTypes]);

    return { businessTypes, loading, error, pagination, refetch, deleteBusinessType };
};