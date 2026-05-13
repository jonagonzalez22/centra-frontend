import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { CreateStoreDto, FilterOptions, StoresFilters, Store, StoresListResponse } from '../types/store.types';

export const StoresService = {
    getStores: async (filters: StoresFilters = {}): Promise<StoresListResponse> => {
        const { data } = await api.get<ApiListResponse<StoresListResponse>>(
            API_ENDPOINTS.ADMIN.STORES.URL,
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

    getById: async (id: string): Promise<Store> => {
        const { data } = await api.get<ApiListResponse<Store>>(
            `${API_ENDPOINTS.ADMIN.STORES.URL}/${id}`
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

    create: async (storeData: CreateStoreDto): Promise<Store> => {
        const { data } = await api.post<ApiListResponse<Store>>(
            API_ENDPOINTS.ADMIN.STORES.URL,
            storeData
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

    getFilterOptions: async (): Promise<FilterOptions> => {
        const { data } = await api.get<ApiListResponse<FilterOptions>>(
            API_ENDPOINTS.ADMIN.STORES.FILTER_OPTIONS
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