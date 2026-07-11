import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    PaymentMethod,
    PaymentMethodsFilters,
    PaymentMethodsListResponse,
    CreatePaymentMethodDto,
    UpdatePaymentMethodDto,
} from '../types/payment-method.types';

export const PaymentMethodsService = {
    getAll: async (filters: PaymentMethodsFilters = {}): Promise<PaymentMethodsListResponse> => {
        const { data } = await api.get<ApiListResponse<PaymentMethodsListResponse>>(
            API_ENDPOINTS.ADMIN.PAYMENT_METHODS.URL,
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

    create: async (dto: CreatePaymentMethodDto): Promise<PaymentMethod> => {
        const { data } = await api.post<ApiListResponse<PaymentMethod>>(
            API_ENDPOINTS.ADMIN.PAYMENT_METHODS.URL,
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

    update: async (id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> => {
        const { data } = await api.put<ApiListResponse<PaymentMethod>>(
            `${API_ENDPOINTS.ADMIN.PAYMENT_METHODS.URL}/${id}`,
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

    delete: async (id: string): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<null>>(
            `${API_ENDPOINTS.ADMIN.PAYMENT_METHODS.URL}/${id}`
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
