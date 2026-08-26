import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { ReconciliationService } from '../services/reconciliation.service';
import type {
    RouteReconciliationSummary,
    RouteReconciliationCollection,
    RouteReconciliationStop,
    RouteReconciliationStopItem,
    RejectCollectionPayload,
    ResolveDiscrepancyPayload,
    DiscrepancyResolutionType,
} from '../interfaces/reconciliation.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseReconciliationReturn {
    summary: RouteReconciliationSummary | null;
    collections: RouteReconciliationCollection[];
    stops: RouteReconciliationStop[];
    allItems: RouteReconciliationStopItem[];
    discrepancies: RouteReconciliationStopItem[];
    pendingCollectionsCount: number;
    pendingDiscrepanciesCount: number;
    loading: boolean;
    actionLoading: string | false;
    error: string | null;
    fetchSummary: () => Promise<void>;
    verifyCollection: (collectionId: string) => Promise<void>;
    rejectCollection: (collectionId: string, reason: string) => Promise<void>;
    resolveDiscrepancies: (payload: ResolveDiscrepancyPayload) => Promise<void>;
    resolveDiscrepancy: (discrepancyId: string, resolutionType: DiscrepancyResolutionType, quantityToResolve: number, notes?: string) => Promise<void>;
    finalize: () => Promise<void>;
}

export const useReconciliation = (routeId: string): UseReconciliationReturn => {
    const [summary, setSummary] = useState<RouteReconciliationSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | false>(false);
    const [error, setError] = useState<string | null>(null);

    const collections = useMemo(() => {
        if (!summary?.stops) return [];
        return summary.stops.flatMap((stop: RouteReconciliationStop) => stop.collections || []);
    }, [summary]);

    const allItems = useMemo(() => {
        if (!summary?.stops) return [];
        return summary.stops.flatMap((stop: RouteReconciliationStop) => stop.items || []);
    }, [summary]);

    const discrepancies = useMemo(() => {
        if (!summary?.stops) return [];
        return summary.stops.flatMap((stop: RouteReconciliationStop) =>
            (stop.items || []).filter((item: RouteReconciliationStopItem) => item.difference !== 0 || item.discrepancy !== null)
        );
    }, [summary]);

    const pendingCollectionsCount = useMemo(() => {
        return collections.filter((c: RouteReconciliationCollection) => c.status === 'declared').length;
    }, [collections]);

    const pendingDiscrepanciesCount = useMemo(() => {
        return discrepancies.filter((item: RouteReconciliationStopItem) => !item.discrepancy?.resolution_type).length;
    }, [discrepancies]);

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
        async (payload: ResolveDiscrepancyPayload) => {
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

    const resolveDiscrepancy = useCallback(
        async (discrepancyId: string, resolutionType: DiscrepancyResolutionType, quantityToResolve: number, notes?: string) => {
            try {
                setActionLoading(discrepancyId);
                const payload: ResolveDiscrepancyPayload = {
                    route_stop_item_id: discrepancyId,
                    resolution_type: resolutionType,
                    quantity_to_resolve: quantityToResolve,
                    notes,
                };
                await ReconciliationService.resolveDiscrepancies(routeId, payload);
                message.success('Discrepancia resuelta exitosamente.');
                await fetchSummary();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al resolver la discrepancia.');
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
        collections,
        stops: summary?.stops ?? [],
        allItems,
        discrepancies,
        pendingCollectionsCount,
        pendingDiscrepanciesCount,
        loading,
        actionLoading,
        error,
        fetchSummary,
        verifyCollection,
        rejectCollection,
        resolveDiscrepancies,
        resolveDiscrepancy,
        finalize,
    };
};
