import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { RoutesService } from '../services/routes.service';
import type {
    DeliveryRoute,
    EligibleOrder,
    EligibleOrderLocality,
    EligibleOrdersFilters,
    EligibleOrdersListResponse,
} from '../interfaces/route.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

const DEFAULT_PER_PAGE = 15;
const emptyEligibleOrders = (): EligibleOrdersListResponse => ({
    items: [],
    total: 0,
    per_page: DEFAULT_PER_PAGE,
    current_page: 1,
    last_page: 1,
});
type EligibleFilters = Pick<EligibleOrdersFilters, 'search' | 'locality_id'>;

export interface UseRouteDetailReturn {
    route: DeliveryRoute | null;
    dailyOrders: EligibleOrder[];
    exceptionalOrders: EligibleOrder[];
    dailyOrdersPagination: EligibleOrdersListResponse;
    exceptionalOrdersPagination: EligibleOrdersListResponse;
    eligibleFilters: EligibleFilters;
    eligibleLocalities: EligibleOrderLocality[];
    loading: boolean;
    dailyOrdersLoading: boolean;
    exceptionalOrdersLoading: boolean;
    error: string | null;
    refresh: () => void;
    setEligibleFilters: (filters: EligibleFilters) => void;
    setEligiblePage: (tab: 'daily' | 'exceptional', page: number) => void;
    addStop: (orderId: string) => Promise<void>;
    addExceptionalStop: (orderId: string, reason: string) => Promise<void>;
    removeStop: (stopId: string) => Promise<void>;
    updateDepartureTime: (departureTime: string) => Promise<void>;
    updateRouteName: (routeName: string) => Promise<void>;
    planRoute: () => Promise<void>;
    reorderStops: (stopIds: string[]) => Promise<void>;
    recalculate: () => Promise<void>;
    optimizeRoute: () => Promise<void>;
    revertRoute: (reason: string) => Promise<void>;
    dispatchRoute: () => Promise<void>;
}

export const useRouteDetail = (routeId: string): UseRouteDetailReturn => {
    const [route, setRoute] = useState<DeliveryRoute | null>(null);
    const [dailyOrdersPagination, setDailyOrdersPagination] = useState(emptyEligibleOrders);
    const [exceptionalOrdersPagination, setExceptionalOrdersPagination] =
        useState(emptyEligibleOrders);
    const [eligibleFilters, setEligibleFiltersState] = useState<EligibleFilters>({});
    const [eligibleLocalities, setEligibleLocalities] = useState<EligibleOrderLocality[]>([]);
    const [dailyPage, setDailyPage] = useState(1);
    const [exceptionalPage, setExceptionalPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [dailyOrdersLoading, setDailyOrdersLoading] = useState(true);
    const [exceptionalOrdersLoading, setExceptionalOrdersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const eligibleRequestId = useRef(0);

    const refreshOrders = useCallback(
        async (operationalDate: string) => {
            const requestId = ++eligibleRequestId.current;
            setDailyOrdersLoading(true);
            setExceptionalOrdersLoading(true);
            try {
                const shared = {
                    ...eligibleFilters,
                    exclude_route_id: routeId,
                    per_page: DEFAULT_PER_PAGE,
                };
                const [daily, exceptional] = await Promise.all([
                    RoutesService.getEligibleOrders({
                        ...shared,
                        requested_delivery_date: operationalDate,
                        page: dailyPage,
                    }),
                    RoutesService.getEligibleOrders({
                        ...shared,
                        exclude_delivery_date: operationalDate,
                        page: exceptionalPage,
                    }),
                ]);
                if (requestId !== eligibleRequestId.current) return;
                setDailyOrdersPagination(daily);
                setExceptionalOrdersPagination(exceptional);
            } catch (err) {
                if (requestId !== eligibleRequestId.current) return;
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al cargar los pedidos elegibles.');
            } finally {
                if (requestId === eligibleRequestId.current) {
                    setDailyOrdersLoading(false);
                    setExceptionalOrdersLoading(false);
                }
            }
        },
        [dailyPage, eligibleFilters, exceptionalPage, routeId]
    );

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const routeData = await RoutesService.getById(routeId);
            setRoute(routeData);
            if (routeData?.operational_date) await refreshOrders(routeData.operational_date);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Error al cargar la ruta.');
            message.error(apiError.message || 'Error al cargar la ruta.');
        } finally {
            setLoading(false);
        }
    }, [refreshOrders, routeId]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const routeData = await RoutesService.getById(routeId);
                if (!cancelled) setRoute(routeData);
            } catch (err) {
                if (cancelled) return;
                const apiError = err as ApiError;
                setError(apiError.message || 'Error al cargar la ruta.');
                message.error(apiError.message || 'Error al cargar la ruta.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [routeId]);
    useEffect(() => {
        if (route?.operational_date) refreshOrders(route.operational_date);
    }, [route?.operational_date, eligibleFilters, dailyPage, exceptionalPage, refreshOrders]);
    useEffect(() => {
        RoutesService.getEligibleOrderLocalities(routeId)
            .then(setEligibleLocalities)
            .catch(() => setEligibleLocalities([]));
    }, [routeId]);

    const setEligibleFilters = (filters: EligibleFilters) => {
        setEligibleFiltersState(filters);
        setDailyPage(1);
        setExceptionalPage(1);
    };
    const setEligiblePage = (tab: 'daily' | 'exceptional', page: number) => {
        if (tab === 'daily') setDailyPage(page);
        else setExceptionalPage(page);
    };

    const withRouteRefresh = useCallback(
        (action: () => Promise<void>, success: string, fallback: string) => async () => {
            try {
                await action();
                message.success(success);
                await refresh();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || fallback);
                throw err;
            }
        },
        [refresh]
    );
    const addStop = useCallback(
        (orderId: string) =>
            withRouteRefresh(
                async () => {
                    await RoutesService.addStops(routeId, orderId);
                },
                'Pedido agregado a la ruta correctamente.',
                'Error al agregar el pedido.'
            )(),
        [routeId, withRouteRefresh]
    );
    const addExceptionalStop = useCallback(
        (orderId: string, reason: string) =>
            withRouteRefresh(
                async () => {
                    await RoutesService.addStops(routeId, orderId, reason);
                },
                'Pedido excepcional agregado a la ruta correctamente.',
                'Error al agregar el pedido excepcional.'
            )(),
        [routeId, withRouteRefresh]
    );
    const removeStop = useCallback(
        async (stopId: string) => {
            try {
                await RoutesService.removeStop(routeId, stopId);
                message.success('Parada eliminada correctamente.');
                await refresh();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar la parada.');
            }
        },
        [refresh, routeId]
    );
    const updateDepartureTime = useCallback(
        async (departureTime: string) => {
            try {
                await RoutesService.update(routeId, { departure_time: departureTime });
                setRoute(await RoutesService.getById(routeId));
                message.success('Hora de salida actualizada.');
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al actualizar la hora de salida.');
            }
        },
        [routeId]
    );
    const updateRouteName = useCallback(
        async (routeName: string) => {
            try {
                await RoutesService.update(routeId, { route_name: routeName.trim() || null });
                setRoute(await RoutesService.getById(routeId));
                message.success('Nombre de ruta actualizado.');
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al actualizar el nombre de ruta.');
            }
        },
        [routeId]
    );
    const planRoute = useCallback(async () => {
        if (!route?.departure_time) return;
        try {
            await RoutesService.plan(routeId, route.departure_time.substring(0, 5));
            setRoute(await RoutesService.getById(routeId));
            message.success('Ruta planificada exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al planificar la ruta.');
            throw err;
        }
    }, [route?.departure_time, routeId]);
    const reorderStops = useCallback(
        async (stopIds: string[]) => {
            try {
                await RoutesService.reorderStops(routeId, stopIds);
                setRoute(await RoutesService.getById(routeId));
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
            setRoute(await RoutesService.recalculate(routeId));
            message.success('Tiempos recalculados exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al recalcular la ruta.');
        }
    }, [routeId]);
    const optimizeRoute = useCallback(async () => {
        try {
            setRoute(await RoutesService.optimizeRoute(routeId));
            message.success('Ruta reoptimizada exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al reoptimizar la ruta.');
        }
    }, [routeId]);
    const revertRoute = useCallback(
        async (reason: string) => {
            try {
                setRoute(await RoutesService.revert(routeId, reason));
                message.success('Ruta revertida a borrador exitosamente.');
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al revertir la ruta.');
            }
        },
        [routeId]
    );
    const dispatchRoute = useCallback(async () => {
        try {
            setRoute(await RoutesService.dispatch(routeId));
            message.success('Ruta despachada exitosamente.');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al despachar la ruta.');
        }
    }, [routeId]);

    return {
        route,
        dailyOrders: dailyOrdersPagination.items,
        exceptionalOrders: exceptionalOrdersPagination.items,
        dailyOrdersPagination,
        exceptionalOrdersPagination,
        eligibleFilters,
        eligibleLocalities,
        loading,
        dailyOrdersLoading,
        exceptionalOrdersLoading,
        error,
        refresh,
        setEligibleFilters,
        setEligiblePage,
        addStop,
        addExceptionalStop,
        removeStop,
        updateDepartureTime,
        updateRouteName,
        planRoute,
        reorderStops,
        recalculate,
        optimizeRoute,
        revertRoute,
        dispatchRoute,
    };
};
