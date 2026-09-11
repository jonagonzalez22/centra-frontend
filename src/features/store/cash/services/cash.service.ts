import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type {
    CashOverview,
    CashPendingPage,
    CashReconciliationPaymentPage,
    CashSessionBlind,
    CashSessionOpen,
    CashSessionReconciliation,
} from '@/entities/CashSession';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';

const unwrap = <T>(response: ApiListResponse<T>): T => {
    if (response.status === 'error') {
        const error: ApiError = {
            status: 0,
            message: response.message,
            errors: response.errors ?? undefined,
        };
        throw error;
    }
    return response.data;
};

export const CashService = {
    getCurrent: async (): Promise<CashSessionOpen | null> => {
        const { data } = await api.get<ApiListResponse<CashSessionOpen | null>>(
            API_ENDPOINTS.STORE.CASH.CURRENT.URL
        );
        return unwrap(data);
    },

    getOverview: async (): Promise<CashOverview> => {
        const { data } = await api.get<ApiListResponse<CashOverview>>(
            API_ENDPOINTS.STORE.CASH.OVERVIEW.URL
        );
        return unwrap(data);
    },

    open: async (payload: { opening_amount: number; notes?: string }): Promise<CashSessionOpen> => {
        const { data } = await api.post<ApiListResponse<CashSessionOpen>>(
            API_ENDPOINTS.STORE.CASH.OPEN.URL,
            payload
        );
        return unwrap(data);
    },

    submit: async (
        cashSessionId: string,
        payload: { declared_amount: number; declaration_notes?: string }
    ): Promise<CashSessionBlind> => {
        const { data } = await api.post<ApiListResponse<CashSessionBlind>>(
            API_ENDPOINTS.STORE.CASH.SUBMIT(cashSessionId),
            payload
        );
        return unwrap(data);
    },

    getPendingReconciliations: async (page = 1, perPage = 10): Promise<CashPendingPage> => {
        const { data } = await api.get<ApiListResponse<CashPendingPage>>(
            API_ENDPOINTS.STORE.CASH.PENDING_RECONCILIATION.URL,
            { params: { page, per_page: perPage } }
        );
        return unwrap(data);
    },

    getReconciliation: async (cashSessionId: string): Promise<CashSessionReconciliation> => {
        const { data } = await api.get<ApiListResponse<CashSessionReconciliation>>(
            API_ENDPOINTS.STORE.CASH.RECONCILIATION(cashSessionId)
        );
        return unwrap(data);
    },

    getReconciliationPayments: async (
        cashSessionId: string,
        storePaymentMethodId: string,
        page = 1,
        perPage = 10
    ): Promise<CashReconciliationPaymentPage> => {
        const { data } = await api.get<ApiListResponse<CashReconciliationPaymentPage>>(
            API_ENDPOINTS.STORE.CASH.RECONCILIATION_PAYMENTS(cashSessionId, storePaymentMethodId),
            { params: { page, per_page: perPage } }
        );
        return unwrap(data);
    },

    close: async (
        cashSessionId: string,
        payload: { real_amount: number; reconciliation_notes?: string }
    ): Promise<void> => {
        const { data } = await api.post<ApiListResponse<unknown>>(
            API_ENDPOINTS.STORE.CASH.CLOSE(cashSessionId),
            payload
        );
        unwrap(data);
    },
};
