import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    RoutesFilters,
    RoutesListResponse,
    CreateRouteDto,
    UpdateRouteDto,
    DeliveryRoute,
    EligibleOrder,
    EligibleOrdersFilters,
} from '../interfaces/route.interface';

export const RoutesService = {
    getAll: async (filters: RoutesFilters = {}): Promise<RoutesListResponse> => {
        const { data } = await api.get<ApiListResponse<RoutesListResponse>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.URL,
            { params: filters }
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    getById: async (id: string): Promise<DeliveryRoute> => {
        const { data } = await api.get<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.DETAIL(id)
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    getEligibleOrders: async (filters?: EligibleOrdersFilters): Promise<EligibleOrder[]> => {
        const { data } = await api.get<ApiListResponse<{ items: EligibleOrder[] }>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.ELIGIBLE_ORDERS.URL,
            { params: filters }
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data.items;
    },

    create: async (dto: CreateRouteDto): Promise<DeliveryRoute> => {
        const { data } = await api.post<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.URL,
            dto
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    addStops: async (routeId: string, orderId: string, reason?: string): Promise<DeliveryRoute> => {
        const payload: { order_id: string; reason?: string } = { order_id: orderId };
        if (reason) payload.reason = reason;

        const { data } = await api.post<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.STOPS(routeId),
            payload
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    removeStop: async (routeId: string, stopId: string): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<null>>(
            API_ENDPOINTS.STORE.LOGISTICS.STOPS.DELETE(routeId, stopId)
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }
    },

    update: async (id: string, dto: UpdateRouteDto): Promise<DeliveryRoute> => {
        const { data } = await api.put<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.DETAIL(id),
            dto
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    plan: async (routeId: string, departureTime: string): Promise<DeliveryRoute> => {
        const { data } = await api.post<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.PLAN(routeId),
            { departure_time: departureTime }
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    reorderStops: async (routeId: string, stopIds: string[]): Promise<DeliveryRoute> => {
        const { data } = await api.put<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.REORDER(routeId),
            { stop_ids: stopIds }
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    recalculate: async (routeId: string): Promise<DeliveryRoute> => {
        const { data } = await api.post<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.RECALCULATE(routeId)
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    optimizeRoute: async (routeId: string): Promise<DeliveryRoute> => {
        const { data } = await api.post<ApiListResponse<DeliveryRoute>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.OPTIMIZE(routeId)
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },
};
