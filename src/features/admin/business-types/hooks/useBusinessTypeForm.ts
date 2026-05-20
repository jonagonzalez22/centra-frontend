import { useState, useCallback } from 'react';
import { message } from 'antd';
import { BusinessTypesService } from '../services/business-types.service';
import type { CreateBusinessTypeDto, UpdateBusinessTypeDto } from '../types/business-type.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseBusinessTypeFormReturn {
    loading: boolean;
    createBusinessType: (data: CreateBusinessTypeDto) => Promise<void>;
    updateBusinessType: (id: number, data: UpdateBusinessTypeDto) => Promise<void>;
}

interface UseBusinessTypeFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useBusinessTypeForm = (options?: UseBusinessTypeFormOptions): UseBusinessTypeFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createBusinessType = useCallback(
        async (data: CreateBusinessTypeDto) => {
            setLoading(true);
            try {
                await BusinessTypesService.create(data);
                message.success('Tipo de negocio creado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear el tipo de negocio.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updateBusinessType = useCallback(
        async (id: number, data: UpdateBusinessTypeDto) => {
            setLoading(true);
            try {
                await BusinessTypesService.update(id, data);
                message.success('Tipo de negocio actualizado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar el tipo de negocio.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    return { loading, createBusinessType, updateBusinessType };
};