import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type {
    PriceList,
    PriceListPayload,
    PriceListsFilters,
    PriceListsResponse,
} from '../types/priceList.types';

export const PriceListsService = {
    getActive: async (): Promise<PriceList[]> => {
        const { data } = await api.get<ApiListResponse<PriceListsResponse>>(
            API_ENDPOINTS.STORE.PRICE_LISTS.ACTIVE
        );
        if (data.status === 'error') throw { status: 0, message: data.message, errors: data.errors ?? undefined } as ApiError;
        return data.data.items;
    },
    getAll: async (filters: PriceListsFilters = {}): Promise<PriceListsResponse> => {
        const { is_active, ...rest } = filters;
        const { data } = await api.get<ApiListResponse<PriceListsResponse>>(
            API_ENDPOINTS.STORE.PRICE_LISTS.URL,
            {
                params: {
                    ...rest,
                    ...(is_active === undefined ? {} : { is_active: is_active ? 1 : 0 }),
                },
            }
        );
        return data.data;
    },
    create: async (payload: PriceListPayload): Promise<PriceList> => {
        const { data } = await api.post<ApiListResponse<PriceList>>(
            API_ENDPOINTS.STORE.PRICE_LISTS.URL,
            payload
        );
        return data.data;
    },
    update: async (id: string, payload: PriceListPayload): Promise<PriceList> => {
        const { data } = await api.put<ApiListResponse<PriceList>>(
            `${API_ENDPOINTS.STORE.PRICE_LISTS.URL}/${id}`,
            payload
        );
        return data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`${API_ENDPOINTS.STORE.PRICE_LISTS.URL}/${id}`);
    },
};
