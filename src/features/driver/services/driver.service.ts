import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { getCurrentSessionGeneration, getSessionForRequest } from '@/security/sessionContext';
import type { DecimalString } from '@/types/decimal';
import type {
    ActiveRouteResponse,
    RouteStopsResponse,
    StopDetailResponse,
    SurplusProduct,
    SurplusProductsResponse,
    AddExtraSalePayload,
    AddExtraSaleResponse,
    CollectionPreview,
} from '../interfaces/driver.interface';
import type { CommercialPaymentMethod } from '@features/store/payment-methods/interfaces/commercial-payment-method.interface';

let activeRouteRequest: {
    sessionGeneration: number;
    promise: Promise<ActiveRouteResponse['data'] | null>;
} | null = null;

export interface CompleteStopPayload {
    status: 'completed' | 'failed';
    items: Array<{
        route_stop_item_id: string;
        quantity_delivered: DecimalString;
        quantity_released_for_extra_sale: DecimalString;
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
    code: string;
    label: string;
    suggest_extra_sale: boolean;
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
    getActiveRoute: (): Promise<ActiveRouteResponse['data'] | null> => {
        const { session } = getSessionForRequest();
        const sessionGeneration = session?.generation ?? getCurrentSessionGeneration();

        // React StrictMode mounts effects twice in development. Sharing the in-flight
        // request keeps that diagnostic behavior from issuing the same API call twice,
        // without ever sharing a response across session changes.
        if (activeRouteRequest?.sessionGeneration === sessionGeneration) {
            return activeRouteRequest.promise;
        }

        const request = (async () => {
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
                // The API interceptor normalizes Axios errors into ApiError, so there
                // is no `response` property left here. On this endpoint, 404 is the
                // documented, expected absence of a dispatched route.
                if ((err as Partial<ApiError>)?.status === 404) {
                    return null;
                }
                throw err;
            }
        })().finally(() => {
            if (activeRouteRequest?.promise === request) {
                activeRouteRequest = null;
            }
        });

        activeRouteRequest = { sessionGeneration, promise: request };

        return request;
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

    previewCollection: async (
        stopId: string,
        items: Array<{ route_stop_item_id: string; quantity_delivered: DecimalString }>,
        signal?: AbortSignal
    ): Promise<CollectionPreview> => {
        const { data } = await api.post<{
            status: 'success' | 'error';
            data: CollectionPreview;
            message?: string;
            errors?: unknown;
        }>(API_ENDPOINTS.DRIVER.STOP_COLLECTION_PREVIEW(stopId), { items }, { signal });

        if (data.status === 'success') return data.data;

        const error: ApiError = {
            status: 0,
            message: data.message ?? 'Error al calcular el monto a cobrar.',
            errors: data.errors as ApiError['errors'],
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
     * GET /api/v1/driver/payment-methods
     * Returns enabled payment methods for the store.
     */
    getPaymentMethods: async (): Promise<CommercialPaymentMethod[]> => {
        const { data } = await api.get<{
            status: string;
            data: { items: CommercialPaymentMethod[] };
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

        return data.data.items;
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

    /**
     * GET /v1/driver/routes/{routeId}/available-surplus
     * Returns products with available surplus stock in the vehicle.
     */
    getAvailableSurplus: async (routeId: string): Promise<SurplusProduct[]> => {
        const { data } = await api.get<SurplusProductsResponse>(
            API_ENDPOINTS.DRIVER.ROUTE_SURPLUS(routeId)
        );

        if (data.status === 'success') {
            return data.data.surplus;
        }

        const error: ApiError = {
            status: 0,
            message: data.message ?? 'Error al cargar excedentes disponibles.',
            errors: data.errors ?? undefined,
        };
        throw error;
    },

    /**
     * POST /v1/driver/stops/{stopId}/extra-sales
     * Registers extra sale items for a stop.
     */
    addExtraSale: async (
        stopId: string,
        payload: AddExtraSalePayload
    ): Promise<AddExtraSaleResponse['data']> => {
        const { data } = await api.post<AddExtraSaleResponse>(
            API_ENDPOINTS.DRIVER.STOP_EXTRA_SALES(stopId),
            payload
        );

        if (data.status === 'success') {
            return data.data;
        }

        const apiError: ApiError = {
            status: 0,
            message: data.message ?? 'Error al registrar la venta extra.',
            errors: data.errors ?? undefined,
        };
        throw apiError;
    },
};
