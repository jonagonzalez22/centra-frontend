import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type {
    ActiveRouteResponse,
    RouteStopsResponse,
    StopDetailResponse,
} from '../interfaces/driver.interface';
import type { StorePaymentMethod } from '@features/store/payment-methods/interfaces/store-payment-method.interface';

export interface CompleteStopPayload {
    status: 'completed' | 'failed';
    items: Array<{
        route_stop_item_id: string;
        quantity_delivered: number;
        rejection_reason_id?: string | null;
    }>;
    gps?: {
        lat: number;
        lon: number;
    };
    evidence_uris?: string[];
    payments?: Array<{
        store_payment_method_id: string;
        amount: number;
        reference?: string;
    }>;
    rejection_reason_id?: string;
}

export interface RejectionReason {
    id: string;
    label: string;
}

export interface CompleteStopResponse {
    status: 'success';
    message: string | null;
    data: {
        stop_id: string;
        completed_at: string;
    };
    errors: null;
}

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
            if (
                err &&
                typeof err === 'object' &&
                'response' in err &&
                (err as { response?: { status?: number } }).response?.status === 404
            ) {
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

    /**
     * POST /v1/driver/stops/{stopId}/complete
     * Completes a stop with optional payment registration.
     */
    completeStop: async (
        stopId: string,
        payload: CompleteStopPayload
    ): Promise<CompleteStopResponse['data']> => {
        const { data } = await api.post<CompleteStopResponse>(
            API_ENDPOINTS.DRIVER.STOP_COMPLETE(stopId),
            payload
        );

        if (data.status === 'success') {
            return data.data;
        }

        const apiError: ApiError = {
            status: 0,
            message: data.message ?? 'Error al completar la parada.',
            errors: data.errors ?? undefined,
        };
        throw apiError;
    },

    /**
     * GET /api/v1/store/payment-methods
     * Returns enabled payment methods for the store.
     */
    getPaymentMethods: async (): Promise<StorePaymentMethod[]> => {
        const { data } = await api.get<{
            status: string;
            data: { items: StorePaymentMethod[] };
            message?: string;
            errors?: unknown;
        }>(API_ENDPOINTS.DRIVER.STOP_PAYMENT_METHODS.URL);

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message ?? 'Error al cargar métodos de pago.',
                errors: data.errors as ApiError['errors'],
            };
            throw error;
        }

        return data.data.items.filter((pm) => pm.is_enabled);
    },

    /**
     * GET /v1/store/logistics/rejection-reasons
     * Returns the catalog of rejection reasons for failed/partial deliveries.
     */
    getRejectionReasons: async (): Promise<RejectionReason[]> => {
        const { data } = await api.get<{
            status: string;
            data: RejectionReason[];
            message?: string;
            errors?: unknown;
        }>(API_ENDPOINTS.DRIVER.STOP_REJECTION_REASONS.URL);

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message ?? 'Error al cargar motivos de rechazo.',
                errors: data.errors as ApiError['errors'],
            };
            throw error;
        }

        return data.data;
    },
};
