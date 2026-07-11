import { useState, useCallback } from 'react';
import { message } from 'antd';
import { CashService } from '../services/cash.service';
import { useAuthStore } from '@/store/useAuthStore.store';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseCashSessionFormReturn {
    loading: boolean;
    openCashSession: (data: { opening_amount: number; notes?: string }) => Promise<void>;
    closeCashSession: (data: { real_amount: number; notes?: string }) => Promise<void>;
}

interface UseCashSessionFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useCashSessionForm = (
    options?: UseCashSessionFormOptions
): UseCashSessionFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);
    const { cash_session, setCashSession } = useAuthStore();

    const openCashSession = useCallback(
        async (data: { opening_amount: number; notes?: string }) => {
            setLoading(true);
            try {
                const session = await CashService.open(data);
                setCashSession(session);
                message.success('Caja abierta correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al abrir la caja.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError, setCashSession]
    );

    const closeCashSession = useCallback(
        async (data: { real_amount: number; notes?: string }) => {
            if (!cash_session?.id) {
                message.error('No hay una sesión de caja activa.');
                return;
            }
            setLoading(true);
            try {
                const session = await CashService.close(cash_session.id, data);
                setCashSession(session);
                message.success('Caja cerrada correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al cerrar la caja.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError, setCashSession, cash_session]
    );

    return { loading, openCashSession, closeCashSession };
};
