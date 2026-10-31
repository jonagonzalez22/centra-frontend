import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    ReceivedPaymentsFilters,
    ReceivedPaymentFilterOptions,
    ReceivedPaymentsResponse,
} from '../interfaces/received-payment.interface';

export const ReceivedPaymentsService = {
    getFilterOptions: async (): Promise<ReceivedPaymentFilterOptions> => {
        const { data } = await api.get<ApiListResponse<ReceivedPaymentFilterOptions>>(
            API_ENDPOINTS.STORE.RECEIVED_PAYMENTS.FILTER_OPTIONS
        );
        if (data.status === 'error') {
            throw {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            } as ApiError;
        }
        return data.data;
    },

    getAll: async (filters: ReceivedPaymentsFilters): Promise<ReceivedPaymentsResponse> => {
        const params = Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
        );
        const { data } = await api.get<ApiListResponse<ReceivedPaymentsResponse>>(
            API_ENDPOINTS.STORE.RECEIVED_PAYMENTS.URL,
            { params }
        );
        if (data.status === 'error') {
            throw {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            } as ApiError;
        }
        return data.data;
    },
};
