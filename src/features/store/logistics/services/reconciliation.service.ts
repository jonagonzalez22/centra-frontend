import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    RouteReconciliationSummary,
    RouteReconciliationCollection,
    RejectCollectionPayload,
    ResolveDiscrepancyPayload,
} from '../interfaces/reconciliation.interface';

export const ReconciliationService = {
    getSummary: async (routeId: string): Promise<RouteReconciliationSummary> => {
        const { data } = await api.get<ApiListResponse<RouteReconciliationSummary>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.RECONCILIATION.SUMMARY(routeId)
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

    verifyCollection: async (routeId: string, collectionId: string): Promise<RouteReconciliationCollection> => {
        const { data } = await api.post<ApiListResponse<RouteReconciliationCollection>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.RECONCILIATION.VERIFY_COLLECTION(routeId, collectionId)
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

    rejectCollection: async (
        routeId: string,
        collectionId: string,
        payload: RejectCollectionPayload
    ): Promise<RouteReconciliationCollection> => {
        const { data } = await api.post<ApiListResponse<RouteReconciliationCollection>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.RECONCILIATION.REJECT_COLLECTION(routeId, collectionId),
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

    resolveDiscrepancies: async (routeId: string, payload: ResolveDiscrepancyPayload): Promise<void> => {
        const { data } = await api.post<ApiListResponse<null>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.RECONCILIATION.RESOLVE_DISCREPANCIES(routeId),
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
    },

    finalize: async (routeId: string): Promise<void> => {
        const { data } = await api.post<ApiListResponse<null>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.RECONCILIATION.FINALIZE(routeId)
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
};
