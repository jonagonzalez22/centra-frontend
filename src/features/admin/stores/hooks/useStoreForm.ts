import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { StoresService } from '../services/stores.service';
import type { CreateStoreDto, Store, UpdateStoreDto } from '../types/store.types';

interface UseStoreFormReturn {
    loading: boolean;
    createStore: (data: CreateStoreDto) => Promise<void>;
    updateStore: (id: string, data: UpdateStoreDto) => Promise<void>;
    reset: () => void;
}

interface UseStoreFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useStoreForm = (options?: UseStoreFormOptions): UseStoreFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createStore = useCallback(
        async (data: CreateStoreDto) => {
            setLoading(true);
            try {
                await StoresService.create(data);
                message.success('Tienda creada correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear la tienda.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updateStore = useCallback(
        async (id: string, data: UpdateStoreDto) => {
            setLoading(true);
            try {
                await StoresService.update(id, data);
                message.success('Tienda actualizada correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar la tienda.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const reset = useCallback(() => {
        setLoading(false);
    }, []);

    return { loading, createStore, updateStore, reset };
};

export const buildInitialValuesFromStore = (store: Store): Partial<CreateStoreDto> => ({
    name: store.name,
    email: store.email ?? undefined,
    is_active: store.is_active,
    business_type_id: store.business_type?.id,
    plan_id: store.plan?.id,
    cuit: store.cuit,
    address: store.address,
    state: store.state,
    city: store.city,
    country: store.country,
    phone: store.phone,
    url_logo: store.url_logo ?? undefined,
    inactive_reason: store.inactive_reason ?? undefined,
    inactive_at: store.inactive_at ?? undefined,
});