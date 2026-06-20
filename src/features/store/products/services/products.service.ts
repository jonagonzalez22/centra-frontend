import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    Product,
    CreateProductDto,
    UpdateProductDto,
    ProductsFilters,
    ProductsListResponse,
} from '../interfaces/product.interface';

export const ProductsService = {
    getAll: async (filters: ProductsFilters = {}): Promise<ProductsListResponse> => {
        const { data } = await api.get<ApiListResponse<ProductsListResponse>>(
            API_ENDPOINTS.STORE.PRODUCTS.URL,
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

    getById: async (id: string): Promise<Product> => {
        const { data } = await api.get<ApiListResponse<Product>>(
            `${API_ENDPOINTS.STORE.PRODUCTS.URL}/${id}`
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

    create: async (dto: CreateProductDto): Promise<Product> => {
        const { data } = await api.post<ApiListResponse<Product>>(
            API_ENDPOINTS.STORE.PRODUCTS.URL,
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

    update: async (id: string, dto: UpdateProductDto): Promise<Product> => {
        const { data } = await api.put<ApiListResponse<Product>>(
            `${API_ENDPOINTS.STORE.PRODUCTS.URL}/${id}`,
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
            `${API_ENDPOINTS.STORE.PRODUCTS.URL}/${id}`
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

    generateSku: async (params?: { category_id?: string; name?: string }): Promise<string> => {
        const { data } = await api.get<ApiListResponse<{ sku: string }>>(
            `${API_ENDPOINTS.STORE.PRODUCTS.URL}/generate-sku`,
            { params }
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data.sku;
    },
};
