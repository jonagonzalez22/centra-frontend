import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { RoutesService } from '../services/routes.service';
import type { DeliveryRoute, EligibleOrder } from '../interfaces/route.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseRouteDetailReturn {
    route: DeliveryRoute | null;
    dailyOrders: EligibleOrder[];
    exceptionalOrders: EligibleOrder[];
    loading: boolean;
    dailyOrdersLoading: boolean;
    exceptionalOrdersLoading: boolean;
    error: string | null;
    refresh: () => void;
    addStop: (orderId: string) => Promise<void>;
    addExceptionalStop: (orderId: string, reason: string) => Promise<void>;
    removeStop: (stopId: string) => Promise<void>;
    updateDepartureTime: (departureTime: string) => Promise<void>;
    planRoute: () => Promise<void>;
    reorderStops: (stopIds: string[]) => Promise<void>;
    recalculate: () => Promise<void>;
    optimizeRoute: () => Promise<void>;
    revertRoute: (reason: string) => Promise<void>;
}

export const useRouteDetail = (routeId: string): UseRouteDetailReturn => {
    const [route, setRoute] = useState<DeliveryRoute | null>(null);
    const [dailyOrders, setDailyOrders] = useState<EligibleOrder[]>([]);
    const [exceptionalOrders, setExceptionalOrders] = useState<EligibleOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [dailyOrdersLoading, setDailyOrdersLoading] = useState<boolean>(true);
    const [exceptionalOrdersLoading, setExceptionalOrdersLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refreshOrders = useCallback(async (operationalDate: string) => {
        const [daily, all] = await Promise.all([
            RoutesService.getEligibleOrders({ requested_delivery_date: operationalDate, exclude_route_id: routeId }),
            RoutesService.getEligibleOrders({ exclude_route_id: routeId }),
        ]);
        setDailyOrders(daily);
        setExceptionalOrders(all.filter((o) => o.requested_delivery_date !== operationalDate));
    }, [routeId]);

    const addStop = useCallback(
        async (orderId: string) => {
            try {
                await RoutesService.addStops(routeId, orderId);
                message.success('Pedido agregado a la ruta correctamente.');
                const routeData = await RoutesService.getById(routeId);
                setRoute(routeData);
                if (routeData?.operational_date) {
                    await refreshOrders(routeData.operational_date);
                }
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al agregar el pedido.');
            }
        },
        [routeId, refreshOrders]
    );

    const addExceptionalStop = useCallback(
        async (orderId: string, reason: string) => {
            try {
                await RoutesService.addStops(routeId, orderId, reason);
                message.success('Pedido excepcional agregado a la ruta correctamente.');
                const routeData = await RoutesService.getById(routeId);
                setRoute(routeData);
                if (routeData?.operational_date) {
                    await refreshOrders(routeData.operational_date);
                }
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al agregar el pedido excepcional.');
            }
        },
        [routeId, refreshOrders]
    );

    const removeStop = useCallback(
        async (stopId: string) => {
            try {
                await RoutesService.removeStop(routeId, stopId);
                message.success('Parada eliminada correctamente.');
                const routeData = await RoutesService.getById(routeId);
                setRoute(routeData);
                if (routeData?.operational_date) {
                    await refreshOrders(routeData.operational_date);
                }
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar la parada.');
            }
        },
        [routeId, refreshOrders]
    );

    const updateDepartureTime = useCallback(
        async (departureTime: string) => {
            try {
                await RoutesService.update(routeId, { departure_time: departureTime });
                const routeData = await RoutesService.getById(routeId);
                setRoute(routeData);
                message.success('Hora de salida actualizada.');
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al actualizar la hora de salida.');
            }
        },
        [routeId]
    );

    const planRoute = useCallback(async () => {
        if (!route?.departure_time) return;
        // Normalize to HH:mm (backend stores time as HH:mm:ss)
        const normalized = route.departure_time.substring(0, 5);
        try {
            await RoutesService.plan(routeId, normalized);
            const routeData = await RoutesService.getById(routeId);
            setRoute(routeData);
            message.success('Ruta planificada exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al planificar la ruta.');
            throw err;
        }
    }, [routeId, route?.departure_time]);

    const reorderStops = useCallback(
        async (stopIds: string[]) => {
            try {
                await RoutesService.reorderStops(routeId, stopIds);
                const routeData = await RoutesService.getById(routeId);
                setRoute(routeData);
                message.success('Paradas reordenadas correctamente.');
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al reordenar las paradas.');
            }
        },
        [routeId]
    );

    const recalculate = useCallback(async () => {
        try {
            const updatedRoute = await RoutesService.recalculate(routeId);
            setRoute(updatedRoute);
            message.success('Tiempos recalculados exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al recalcular la ruta.');
        }
    }, [routeId]);

    const optimizeRouteFn = useCallback(async () => {
        try {
            const updatedRoute = await RoutesService.optimizeRoute(routeId);
            setRoute(updatedRoute);
            message.success('Ruta reoptimizada exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al reoptimizar la ruta.');
        }
    }, [routeId]);

    const revertRoute = useCallback(async (reason: string) => {
        try {
            const updatedRoute = await RoutesService.revert(routeId, reason);
            setRoute(updatedRoute);
            message.success('Ruta revertida a borrador exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al revertir la ruta.');
        }
    }, [routeId]);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setDailyOrdersLoading(true);
            setExceptionalOrdersLoading(true);
            setError(null);
            const routeData = await RoutesService.getById(routeId);
            setRoute(routeData);
            setLoading(false);
            if (routeData?.operational_date) {
                await refreshOrders(routeData.operational_date);
            }
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Error al cargar la ruta.');
            message.error(apiError.message || 'Error al cargar la ruta.');
        } finally {
            setLoading(false);
            setDailyOrdersLoading(false);
            setExceptionalOrdersLoading(false);
        }
    }, [routeId, refreshOrders]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const routeData = await RoutesService.getById(routeId);
                if (cancelled) return;
                setRoute(routeData);
                setLoading(false);

                if (routeData?.operational_date) {
                    setDailyOrdersLoading(true);
                    setExceptionalOrdersLoading(true);
                    await refreshOrders(routeData.operational_date);
                }
            } catch (err) {
                if (cancelled) return;
                const apiError = err as ApiError;
                setError(apiError.message || 'Error al cargar la ruta.');
                message.error(apiError.message || 'Error al cargar la ruta.');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setDailyOrdersLoading(false);
                    setExceptionalOrdersLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeId]);

    return {
        route,
        dailyOrders,
        exceptionalOrders,
        loading,
        dailyOrdersLoading,
        exceptionalOrdersLoading,
        error,
        refresh,
        addStop,
        addExceptionalStop,
        removeStop,
        updateDepartureTime,
        planRoute,
        reorderStops,
        recalculate,
        optimizeRoute: optimizeRouteFn,
        revertRoute,
    };
};
