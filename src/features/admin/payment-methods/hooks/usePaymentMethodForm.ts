import { useState, useCallback } from 'react';
import { message } from 'antd';
import { PaymentMethodsService } from '../services/payment-methods.service';
import type { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../types/payment-method.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UsePaymentMethodFormReturn {
    loading: boolean;
    createPaymentMethod: (data: CreatePaymentMethodDto) => Promise<void>;
    updatePaymentMethod: (id: string, data: UpdatePaymentMethodDto) => Promise<void>;
}

interface UsePaymentMethodFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const usePaymentMethodForm = (options?: UsePaymentMethodFormOptions): UsePaymentMethodFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createPaymentMethod = useCallback(
        async (data: CreatePaymentMethodDto) => {
            setLoading(true);
            try {
                await PaymentMethodsService.create(data);
                message.success('Medio de pago creado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear el medio de pago.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updatePaymentMethod = useCallback(
        async (id: string, data: UpdatePaymentMethodDto) => {
            setLoading(true);
            try {
                await PaymentMethodsService.update(id, data);
                message.success('Medio de pago actualizado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar el medio de pago.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    return { loading, createPaymentMethod, updatePaymentMethod };
};
