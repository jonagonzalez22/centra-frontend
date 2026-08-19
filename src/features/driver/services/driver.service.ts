import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ActiveRouteResponse, RouteStopsResponse, StopDetailResponse } from '../interfaces/driver.interface';

export const DriverService = {
    /**
     * GET /v1/driver/active-route
     * Returns the dispatched route assigned to the authenticated driver.
     * Returns null if no active route exists (404).
     */
    getActiveRoute: async (): Promise<ActiveRouteResponse['data'] | null> => {
        try {
            const { data } = await api.get<ActiveRouteResponse>(
                API_ENDPOINTS.DRIVER.ACTIVE_ROUTE.URL
            );

            if (data.status === 'success') {
                return data.data;
            }

            // status === 'error'
            const error: ApiError = {
                status: 0,
                message: data.message ?? 'Error inesperado',
                errors: data.errors ?? undefined,
            };
            throw error;
        } catch (err) {
            if (err && typeof err === 'object' && 'response' in err && (err as { response?: { status?: number } }).response?.status === 404) {
                return null;
            }
            throw err;
        }
    },

    /**
     * GET /v1/driver/routes/{routeId}/stops
     * Returns the list of stops for a route assigned to the driver.
     */
    getRouteStops: async (routeId: string): Promise<RouteStopsResponse['data']> => {
        const { data } = await api.get<RouteStopsResponse>(
            API_ENDPOINTS.DRIVER.ROUTE_STOPS(routeId)
        );

        if (data.status === 'success') {
            return data.data;
        }

        const error: ApiError = {
            status: 0,
            message: data.message ?? 'Error inesperado',
            errors: data.errors ?? undefined,
        };
        throw error;
    },

    /**
     * GET /v1/driver/stops/{stopId}
     * Returns full detail of a stop including items.
     */
    getStopDetail: async (stopId: string): Promise<StopDetailResponse['data']> => {
        const { data } = await api.get<StopDetailResponse>(
            API_ENDPOINTS.DRIVER.STOP_DETAIL(stopId)
        );

        if (data.status === 'success') {
            return data.data;
        }

        const error: ApiError = {
            status: 0,
            message: data.message ?? 'Error inesperado',
            errors: data.errors ?? undefined,
        };
        throw error;
    },
};
