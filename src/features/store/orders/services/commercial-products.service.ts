import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    CommercialProductDetail,
    CommercialProductSearchItem,
} from '../interfaces/commercial-product.interface';

const unwrap = <T>(data: ApiListResponse<T>): T => {
    if (data.status === 'error') {
        throw {
            status: 0,
            message: data.message,
            errors: data.errors ?? undefined,
        } as ApiError;
    }

    return data.data;
};

export const CommercialProductsService = {
    search: async (params: { q?: string; barcode?: string }): Promise<CommercialProductSearchItem[]> => {
        const { data } = await api.get<ApiListResponse<CommercialProductSearchItem[]>>(
            API_ENDPOINTS.STORE.OPERATIONS.PRODUCTS.SEARCH,
            { params }
        );

        return unwrap(data);
    },

    getById: async (id: string): Promise<CommercialProductDetail> => {
        const { data } = await api.get<ApiListResponse<CommercialProductDetail>>(
            API_ENDPOINTS.STORE.OPERATIONS.PRODUCTS.DETAIL(id)
        );

        return unwrap(data);
    },
};
