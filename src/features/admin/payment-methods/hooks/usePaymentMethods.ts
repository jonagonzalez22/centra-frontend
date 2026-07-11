import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { PaymentMethodsService } from '../services/payment-methods.service';
import type { PaymentMethod, PaymentMethodsFilters } from '../types/payment-method.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface PaymentMethodsPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UsePaymentMethodsReturn {
    paymentMethods: PaymentMethod[];
    loading: boolean;
    error: string | null;
    pagination: PaymentMethodsPagination;
    refetch: (filters?: PaymentMethodsFilters) => void;
    deletePaymentMethod: (id: string) => Promise<void>;
}

export const usePaymentMethods = (): UsePaymentMethodsReturn => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaymentMethodsPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const currentPageRef = useRef(1);

    const fetchPaymentMethods = useCallback(async (filters: PaymentMethodsFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await PaymentMethodsService.getAll(filters);
            setPaymentMethods(response.items);
            currentPageRef.current = response.current_page;
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar los medios de pago.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(
        (filters: PaymentMethodsFilters = {}) => {
            fetchPaymentMethods({ page: 1, ...filters });
        },
        [fetchPaymentMethods]
    );

    const deletePaymentMethod = useCallback(
        async (id: string) => {
            try {
                await PaymentMethodsService.delete(id);
                message.success('Medio de pago eliminado correctamente.');
                fetchPaymentMethods({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar el medio de pago.');
                throw err;
            }
        },
        [fetchPaymentMethods]
    );

    useEffect(() => {
        fetchPaymentMethods({ page: 1 });
    }, [fetchPaymentMethods]);

    return { paymentMethods, loading, error, pagination, refetch, deletePaymentMethod };
};
