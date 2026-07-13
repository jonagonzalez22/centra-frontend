import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { StorePaymentMethod, UpdateStorePaymentMethodDto } from '../interfaces/store-payment-method.interface';

interface StorePaymentMethodsListData {
    items: StorePaymentMethod[];
}

export const StorePaymentMethodsService = {
    getAll: async (): Promise<StorePaymentMethod[]> => {
        const { data } = await api.get<ApiListResponse<StorePaymentMethodsListData>>(
            API_ENDPOINTS.STORE.PAYMENT_METHODS.LIST.URL
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

    update: async (
        paymentMethodId: string,
        dto: UpdateStorePaymentMethodDto
    ): Promise<StorePaymentMethod> => {
        const { data } = await api.patch<ApiListResponse<StorePaymentMethod>>(
            API_ENDPOINTS.STORE.PAYMENT_METHODS.UPDATE(paymentMethodId),
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
};
