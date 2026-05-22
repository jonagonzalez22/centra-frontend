import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FeaturesService } from '../services/features.service';
import type { CreateFeatureDto, UpdateFeatureDto } from '../types/feature.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseFeatureFormReturn {
    loading: boolean;
    createFeature: (data: CreateFeatureDto) => Promise<void>;
    updateFeature: (id: string, data: UpdateFeatureDto) => Promise<void>;
}

interface UseFeatureFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useFeatureForm = (options?: UseFeatureFormOptions): UseFeatureFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createFeature = useCallback(
        async (data: CreateFeatureDto) => {
            setLoading(true);
            try {
                await FeaturesService.create(data);
                message.success('Funcionalidad creada correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear la funcionalidad.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updateFeature = useCallback(
        async (id: string, data: UpdateFeatureDto) => {
            setLoading(true);
            try {
                await FeaturesService.update(id, data);
                message.success('Funcionalidad actualizada correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar la funcionalidad.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    return { loading, createFeature, updateFeature };
};