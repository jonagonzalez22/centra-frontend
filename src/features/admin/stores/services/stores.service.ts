import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { CreateStoreDto, StoresFilters, Store, StoresListResponse } from '../types/store.types';

export const StoresService = {
    getStores: async (filters: StoresFilters = {}): Promise<StoresListResponse> => {
        const { data } = await api.get<ApiListResponse<StoresListResponse>>(
            API_ENDPOINTS.ADMIN.STORES.URL,
            { params: filters }
        );

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        return data.data;
    },

    getById: async (id: string): Promise<Store> => {
        const { data } = await api.get<ApiListResponse<Store>>(
            `${API_ENDPOINTS.ADMIN.STORES.URL}/${id}`
        );

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        return data.data;
    },

    create: async (storeData: CreateStoreDto): Promise<Store> => {
        const { data } = await api.post<ApiListResponse<Store>>(
            API_ENDPOINTS.ADMIN.STORES.URL,
            storeData
        );

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        return data.data;
    },
};