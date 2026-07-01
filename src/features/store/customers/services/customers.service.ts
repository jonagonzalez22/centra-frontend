import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    Customer,
    CustomersFilters,
    CustomersListResponse,
} from '../types/customer.types';

export const CustomersService = {
    getAll: async (filters: CustomersFilters = {}): Promise<CustomersListResponse> => {
        const { data } = await api.get<ApiListResponse<CustomersListResponse>>(
            API_ENDPOINTS.STORE.CUSTOMERS.URL,
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

    getById: async (id: number): Promise<Customer> => {
        const { data } = await api.get<ApiListResponse<Customer>>(
            `${API_ENDPOINTS.STORE.CUSTOMERS.URL}/${id}`
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

    delete: async (id: number): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<null>>(
            `${API_ENDPOINTS.STORE.CUSTOMERS.URL}/${id}`
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
