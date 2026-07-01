import { useState, useCallback } from 'react';
import { message } from 'antd';
import { CommercialGroupsService } from '../services/commercialGroups.service';
import type { CreateCommercialGroupDto, UpdateCommercialGroupDto } from '../types/commercialGroup.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseCommercialGroupFormReturn {
    loading: boolean;
    createGroup: (data: CreateCommercialGroupDto) => Promise<void>;
    updateGroup: (id: string, data: UpdateCommercialGroupDto) => Promise<void>;
}

interface UseCommercialGroupFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useCommercialGroupForm = (options?: UseCommercialGroupFormOptions): UseCommercialGroupFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createGroup = useCallback(
        async (data: CreateCommercialGroupDto) => {
            setLoading(true);
            try {
                await CommercialGroupsService.create(data);
                message.success('Grupo comercial creado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear el grupo comercial.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updateGroup = useCallback(
        async (id: string, data: UpdateCommercialGroupDto) => {
            setLoading(true);
            try {
                await CommercialGroupsService.update(id, data);
                message.success('Grupo comercial actualizado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar el grupo comercial.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    return { loading, createGroup, updateGroup };
};
