import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { CashSession } from '@/entities/CashSession';

export const CashService = {
    getCurrent: async (): Promise<CashSession | null> => {
        const { data } = await api.get<ApiListResponse<CashSession | null>>(
            API_ENDPOINTS.STORE.CASH.CURRENT.URL
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

    open: async (payload: {
        opening_amount: number;
        notes?: string;
    }): Promise<CashSession> => {
        const { data } = await api.post<ApiListResponse<CashSession>>(
            API_ENDPOINTS.STORE.CASH.OPEN.URL,
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

    close: async (
        cashSessionId: string,
        payload: {
            real_amount: number;
            notes?: string;
        }
    ): Promise<CashSession> => {
        const { data } = await api.post<ApiListResponse<CashSession>>(
            API_ENDPOINTS.STORE.CASH.CLOSE(cashSessionId),
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
};
