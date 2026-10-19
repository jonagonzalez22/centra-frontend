import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { ProductBrand } from '@/features/store/products/interfaces/product.interface';

export const BrandsService = {
    getAll: async (params: { per_page?: number; is_active?: boolean; name?: string } = {}) => {
        const { is_active, ...rest } = params;
        const queryParams = {
            ...rest,
            ...(is_active === undefined ? {} : { is_active: is_active ? 1 : 0 }),
        };
        const { data } = await api.get<ApiListResponse<{ items: ProductBrand[] }>>(API_ENDPOINTS.STORE.BRANDS.URL, { params: queryParams });
        return data.data.items;
    },
    create: async (payload: Pick<ProductBrand, 'name' | 'is_active'>) => (await api.post<ApiListResponse<ProductBrand>>(API_ENDPOINTS.STORE.BRANDS.URL, payload)).data.data,
    update: async (id: string, payload: Partial<Pick<ProductBrand, 'name' | 'is_active'>>) => (await api.put<ApiListResponse<ProductBrand>>(`${API_ENDPOINTS.STORE.BRANDS.URL}/${id}`, payload)).data.data,
    delete: async (id: string) => { await api.delete(`${API_ENDPOINTS.STORE.BRANDS.URL}/${id}`); },
};
