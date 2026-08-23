import { useState, useCallback } from 'react';
import { message } from 'antd';
import { ReconciliationService } from '../services/reconciliation.service';
import type {
    RouteReconciliationSummary,
    RejectCollectionPayload,
    ResolveDiscrepanciesPayload,
} from '../interfaces/reconciliation.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseReconciliationReturn {
    summary: RouteReconciliationSummary | null;
    loading: boolean;
    actionLoading: string | false;
    error: string | null;
    fetchSummary: () => Promise<void>;
    verifyCollection: (collectionId: string) => Promise<void>;
    rejectCollection: (collectionId: string, reason: string) => Promise<void>;
    resolveDiscrepancies: (payload: ResolveDiscrepanciesPayload) => Promise<void>;
    finalize: () => Promise<void>;
}

export const useReconciliation = (routeId: string): UseReconciliationReturn => {
    const [summary, setSummary] = useState<RouteReconciliationSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | false>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ReconciliationService.getSummary(routeId);
            setSummary(data);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMsg = apiError.message || 'Error al obtener el resumen de reconciliación.';
            setError(errorMsg);
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [routeId]);

    const verifyCollection = useCallback(
        async (collectionId: string) => {
            try {
                setActionLoading(collectionId);
                await ReconciliationService.verifyCollection(routeId, collectionId);
                message.success('Cobro verificado exitosamente.');
                await fetchSummary();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al verificar el cobro.');
                throw err;
            } finally {
                setActionLoading(false);
            }
        },
        [routeId, fetchSummary]
    );

    const rejectCollection = useCallback(
        async (collectionId: string, reason: string) => {
            try {
                setActionLoading(collectionId);
                const payload: RejectCollectionPayload = { rejection_reason: reason };
                await ReconciliationService.rejectCollection(routeId, collectionId, payload);
                message.success('Cobro rechazado exitosamente.');
                await fetchSummary();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al rechazar el cobro.');
                throw err;
            } finally {
                setActionLoading(false);
            }
        },
        [routeId, fetchSummary]
    );

    const resolveDiscrepancies = useCallback(
        async (payload: ResolveDiscrepanciesPayload) => {
            try {
                setActionLoading('resolve-discrepancies');
                await ReconciliationService.resolveDiscrepancies(routeId, payload);
                message.success('Discrepancias resueltas exitosamente.');
                await fetchSummary();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al resolver las discrepancias.');
                throw err;
            } finally {
                setActionLoading(false);
            }
        },
        [routeId, fetchSummary]
    );

    const finalize = useCallback(async () => {
        try {
            setActionLoading('finalize');
            await ReconciliationService.finalize(routeId);
            message.success('Reconciliación finalizada exitosamente.');
            await fetchSummary();
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al finalizar la reconciliación.');
            throw err;
        } finally {
            setActionLoading(false);
        }
    }, [routeId, fetchSummary]);

    return {
        summary,
        loading,
        actionLoading,
        error,
        fetchSummary,
        verifyCollection,
        rejectCollection,
        resolveDiscrepancies,
        finalize,
    };
};
