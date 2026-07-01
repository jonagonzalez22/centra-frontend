import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { CommercialGroupsService } from '../services/commercialGroups.service';
import type { CommercialGroup, CommercialGroupsFilters } from '../types/commercialGroup.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface CommercialGroupsPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseCommercialGroupsReturn {
    groups: CommercialGroup[];
    loading: boolean;
    error: string | null;
    pagination: CommercialGroupsPagination;
    refetch: (filters?: CommercialGroupsFilters) => void;
    deleteGroup: (id: string) => Promise<void>;
}

export const useCommercialGroups = (): UseCommercialGroupsReturn => {
    const [groups, setGroups] = useState<CommercialGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<CommercialGroupsPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const currentPageRef = useRef(1);

    const fetchGroups = useCallback(async (filters: CommercialGroupsFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await CommercialGroupsService.getAll(filters);
            setGroups(response.items);
            currentPageRef.current = response.current_page;
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar los grupos comerciales.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(
        (filters: CommercialGroupsFilters = {}) => {
            fetchGroups({ page: 1, ...filters });
        },
        [fetchGroups]
    );

    const deleteGroup = useCallback(
        async (id: string) => {
            try {
                await CommercialGroupsService.delete(id);
                message.success('Grupo comercial eliminado correctamente.');
                fetchGroups({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar el grupo comercial.');
                throw err;
            }
        },
        [fetchGroups]
    );

    useEffect(() => {
        fetchGroups({ page: 1 });
    }, [fetchGroups]);

    return { groups, loading, error, pagination, refetch, deleteGroup };
};
