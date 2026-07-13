import { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { StorePaymentMethodsService } from '../services/store-payment-methods.service';
import type { StorePaymentMethod, UpdateStorePaymentMethodDto } from '../interfaces/store-payment-method.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseStorePaymentMethodsReturn {
    paymentMethods: StorePaymentMethod[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseStorePaymentMethodFormReturn {
    saving: boolean;
    updateMethod: (id: string, dto: UpdateStorePaymentMethodDto) => Promise<void>;
}

export const useStorePaymentMethods = (): UseStorePaymentMethodsReturn => {
    const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMethods = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const methods = await StorePaymentMethodsService.getAll();
            setPaymentMethods(methods);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Error al cargar medios de pago.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMethods();
    }, [fetchMethods]);

    return { paymentMethods, loading, error, refetch: fetchMethods };
};

export const useStorePaymentMethodForm = (
    onSuccess?: () => void
): UseStorePaymentMethodFormReturn => {
    const [saving, setSaving] = useState(false);

    const updateMethod = useCallback(
        async (id: string, dto: UpdateStorePaymentMethodDto) => {
            setSaving(true);
            try {
                await StorePaymentMethodsService.update(id, dto);
                message.success('Medio de pago actualizado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al actualizar el medio de pago.');
            } finally {
                setSaving(false);
            }
        },
        [onSuccess]
    );

    return { saving, updateMethod };
};
