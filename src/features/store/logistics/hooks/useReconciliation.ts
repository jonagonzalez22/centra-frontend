import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { ReconciliationService } from '../services/reconciliation.service';
import type {
    RouteReconciliationSummary,
    RouteReconciliationCollection,
    RouteReconciliationCollectionGroup,
    RouteReconciliationStop,
    RouteReconciliationStopItem,
    RouteReconciliationDetailItem,
    RouteReconciliationProductGroup,
    RejectCollectionPayload,
    ResolveDiscrepancyPayload,
    ResolveDiscrepanciesBatchPayload,
    DiscrepancyResolutionType,
} from '../interfaces/reconciliation.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseReconciliationReturn {
    summary: RouteReconciliationSummary | null;
    collections: RouteReconciliationCollection[];
    collectionGroups: RouteReconciliationCollectionGroup[];
    stops: RouteReconciliationStop[];
    allItems: RouteReconciliationStopItem[];
    discrepancies: RouteReconciliationStopItem[];
    discrepancyGroups: RouteReconciliationProductGroup[];
    pendingCollectionsCount: number;
    pendingDiscrepanciesCount: number;
    loading: boolean;
    actionLoading: string | false;
    error: string | null;
    fetchSummary: () => Promise<void>;
    verifyCollection: (collectionId: string) => Promise<void>;
    verifyCollectionGroup: (paymentMethodId: string) => Promise<void>;
    rejectCollection: (collectionId: string, reason: string) => Promise<void>;
    resolveDiscrepancies: (payload: ResolveDiscrepancyPayload) => Promise<void>;
    resolveDiscrepancy: (discrepancyId: string, resolutionType: DiscrepancyResolutionType, quantityToResolve: number, notes?: string) => Promise<void>;
    resolveDiscrepanciesBatch: (payload: ResolveDiscrepanciesBatchPayload) => Promise<void>;
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
    const collectionGroups = summary?.collection_groups ?? [];

    const allItems = useMemo(() => {
        if (!summary?.stops) return [];
        return summary.stops.flatMap((stop: RouteReconciliationStop) => stop.items || []);
    }, [summary]);

    const discrepancies = useMemo(() => {
        if (!summary?.stops) return [];
        return summary.stops.flatMap((stop: RouteReconciliationStop) =>
            (stop.items || []).filter(
                (item: RouteReconciliationStopItem) =>
                    item.difference !== 0 ||
                    (item.discrepancy !== null && item.discrepancy.resolution_type !== 'extra_sale')
            )
        );
    }, [summary]);

    const discrepancyGroups = useMemo(() => {
        if (!summary?.stops) return [];

        const detailItems = summary.stops.flatMap((stop: RouteReconciliationStop) =>
            (stop.items || [])
                .filter(
                    (item: RouteReconciliationStopItem) =>
                        item.difference !== 0 ||
                        (item.discrepancy !== null && item.discrepancy.resolution_type !== 'extra_sale')
                )
                .map((item: RouteReconciliationStopItem): RouteReconciliationDetailItem => ({
                    ...item,
                    stop_id: stop.stop_id,
                    sequence: stop.sequence,
                    order_id: stop.order?.id ?? null,
                    order_number: stop.order?.operation_number ?? null,
                    customer_name: stop.order?.customer_name ?? null,
                }))
        );

        return Object.values(
            detailItems.reduce<Record<string, RouteReconciliationDetailItem[]>>((groups, item) => {
                groups[item.product_id] = [...(groups[item.product_id] ?? []), item];
                return groups;
            }, {})
        )
            .map((items): RouteReconciliationProductGroup => {
                const pendingItems = items.filter(
                    (item) => item.difference > 0 && !item.discrepancy?.resolution_type
                );
                const resolvedItems = items.filter(
                    (item) => item.difference > 0 && Boolean(item.discrepancy?.resolution_type)
                );
                const resolutionTypes = new Set(
                    resolvedItems.map((item) => item.discrepancy?.resolution_type).filter(Boolean)
                );
                const containsExtraSale = items.some(
                    (item) =>
                        item.extra_sale_allocated > 0 ||
                        item.discrepancy?.resolution_type === 'extra_sale'
                );
                const hasUnsupportedDifference = items.some((item) => item.difference <= 0);
                const status =
                    resolutionTypes.size > 1
                        ? 'mixed'
                        : pendingItems.length > 0 && resolvedItems.length > 0
                          ? 'partial'
                          : pendingItems.length > 0
                            ? 'pending'
                            : 'resolved';

                return {
                    product_id: items[0].product_id,
                    product_name: items[0].product_name,
                    total_difference: items.reduce((total, item) => total + Math.max(0, item.difference), 0),
                    affected_orders_count: new Set(items.map((item) => item.order_id).filter(Boolean)).size,
                    affected_stops_count: new Set(items.map((item) => item.stop_id)).size,
                    status,
                    contains_extra_sale: containsExtraSale,
                    can_batch_resolve:
                        pendingItems.length > 0 &&
                        resolvedItems.length === 0 &&
                        !containsExtraSale &&
                        !hasUnsupportedDifference,
                    items,
                };
            })
            .sort((left, right) => left.product_name.localeCompare(right.product_name));
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
                const payload: RejectCollectionPayload = { reason };
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

    const verifyCollectionGroup = useCallback(async (paymentMethodId: string) => {
        try {
            setActionLoading(`group-${paymentMethodId}`);
            await ReconciliationService.verifyCollectionGroup(routeId, paymentMethodId);
            message.success('Cobranzas verificadas exitosamente.');
            await fetchSummary();
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al verificar las cobranzas.');
            throw err;
        } finally {
            setActionLoading(false);
        }
    }, [routeId, fetchSummary]);

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

    const resolveDiscrepanciesBatch = useCallback(
        async (payload: ResolveDiscrepanciesBatchPayload) => {
            try {
                setActionLoading('resolve-discrepancies-batch');
                await ReconciliationService.resolveDiscrepanciesBatch(routeId, payload);
                message.success('Discrepancias resueltas exitosamente.');
                await fetchSummary();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'No se pudieron resolver las discrepancias.');
                await fetchSummary();
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
        collectionGroups,
        stops: summary?.stops ?? [],
        allItems,
        discrepancies,
        discrepancyGroups,
        pendingCollectionsCount,
        pendingDiscrepanciesCount,
        loading,
        actionLoading,
        error,
        fetchSummary,
        verifyCollection,
        verifyCollectionGroup,
        rejectCollection,
        resolveDiscrepancies,
        resolveDiscrepancy,
        resolveDiscrepanciesBatch,
        finalize,
    };
};
