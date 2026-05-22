import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { FeaturesService } from '../services/features.service';
import type { Feature, FeaturesFilters } from '../types/feature.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface FeaturesPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseFeaturesReturn {
    features: Feature[];
    loading: boolean;
    error: string | null;
    pagination: FeaturesPagination;
    refetch: (filters?: FeaturesFilters) => void;
    deleteFeature: (id: string) => Promise<void>;
}

export const useFeatures = (): UseFeaturesReturn => {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<FeaturesPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const currentPageRef = useRef(1);

    const fetchFeatures = useCallback(async (filters: FeaturesFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await FeaturesService.getAll(filters);
            setFeatures(response.items);
            currentPageRef.current = response.current_page;
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar las funcionalidades.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(
        (filters: FeaturesFilters = {}) => {
            fetchFeatures({ page: 1, ...filters });
        },
        [fetchFeatures]
    );

    const deleteFeature = useCallback(
        async (id: string) => {
            try {
                await FeaturesService.delete(id);
                message.success('Funcionalidad eliminada correctamente.');
                fetchFeatures({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar la funcionalidad.');
                throw err;
            }
        },
        [fetchFeatures]
    );

    useEffect(() => {
        fetchFeatures({ page: 1 });
    }, [fetchFeatures]);

    return { features, loading, error, pagination, refetch, deleteFeature };
};