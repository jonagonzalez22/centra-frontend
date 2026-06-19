import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    Category,
    CategoriesFilters,
    CategoriesListResponse,
    CreateCategoryDto,
    UpdateCategoryDto,
} from '../interfaces/category.interface';

export const CategoriesService = {
    getAll: async (filters: CategoriesFilters = {}): Promise<CategoriesListResponse> => {
        const { data } = await api.get<ApiListResponse<CategoriesListResponse>>(
            API_ENDPOINTS.STORE.CATEGORIES.URL,
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

    create: async (dto: CreateCategoryDto): Promise<Category> => {
        const { data } = await api.post<ApiListResponse<Category>>(
            API_ENDPOINTS.STORE.CATEGORIES.URL,
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

    update: async (id: string, dto: UpdateCategoryDto): Promise<Category> => {
        const { data } = await api.put<ApiListResponse<Category>>(
            `${API_ENDPOINTS.STORE.CATEGORIES.URL}/${id}`,
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
            `${API_ENDPOINTS.STORE.CATEGORIES.URL}/${id}`
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