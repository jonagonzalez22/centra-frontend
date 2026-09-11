import { useState, useCallback } from 'react';
import { message } from 'antd';
import { CashService } from '../services/cash.service';
import { useAuthStore } from '@/store/useAuthStore.store';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CashSession } from '@/entities/CashSession';

interface UseCashSessionFormReturn {
    loading: boolean;
    openCashSession: (data: { opening_amount: number; notes?: string }) => Promise<void>;
    submitCashSession: (
        sessionId: string,
        data: { declared_amount: number; declaration_notes?: string }
    ) => Promise<void>;
}

interface UseCashSessionFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

function persistCashSession(session: CashSession | null): void {
    const raw = localStorage.getItem('centra-auth-storage');
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.user) {
            parsed.state.user.cash_session = session;
            localStorage.setItem('centra-auth-storage', JSON.stringify(parsed));
        }
    } catch {
        /* ignore parse errors */
    }
}

export const useCashSessionForm = (
    options?: UseCashSessionFormOptions
): UseCashSessionFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);
    const { setCashSession } = useAuthStore();

    const openCashSession = useCallback(
        async (data: { opening_amount: number; notes?: string }) => {
            setLoading(true);
            try {
                const session = await CashService.open(data);
                setCashSession(session);
                persistCashSession(session);
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

    const submitCashSession = useCallback(
        async (
            sessionId: string,
            data: { declared_amount: number; declaration_notes?: string }
        ) => {
            setLoading(true);
            try {
                await CashService.submit(sessionId, data);
                setCashSession(null);
                persistCashSession(null);
                message.success('Caja enviada a control correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al enviar la caja a control.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError, setCashSession]
    );

    return { loading, openCashSession, submitCashSession };
};
