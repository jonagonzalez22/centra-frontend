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
                const updatedRoute = await RoutesService.addStops(routeId, orderId);
                setRoute(updatedRoute);
                message.success('Pedido agregado a la ruta correctamente.');
                if (updatedRoute?.operational_date) {
                    await refreshOrders(updatedRoute.operational_date);
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
                const updatedRoute = await RoutesService.addStops(routeId, orderId, reason);
                setRoute(updatedRoute);
                message.success('Pedido excepcional agregado a la ruta correctamente.');
                if (updatedRoute?.operational_date) {
                    await refreshOrders(updatedRoute.operational_date);
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
    };
};
