import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    Feature,
    FeaturesFilters,
    FeaturesListResponse,
    CreateFeatureDto,
    UpdateFeatureDto,
} from '../types/feature.types';

export const FeaturesService = {
    getAll: async (filters: FeaturesFilters = {}): Promise<FeaturesListResponse> => {
        const { data } = await api.get<ApiListResponse<FeaturesListResponse>>(
            API_ENDPOINTS.ADMIN.FEATURES.URL,
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

    create: async (dto: CreateFeatureDto): Promise<Feature> => {
        const { data } = await api.post<ApiListResponse<Feature>>(
            API_ENDPOINTS.ADMIN.FEATURES.URL,
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

    update: async (id: string, dto: UpdateFeatureDto): Promise<Feature> => {
        const { data } = await api.put<ApiListResponse<Feature>>(
            `${API_ENDPOINTS.ADMIN.FEATURES.URL}/${id}`,
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
            `${API_ENDPOINTS.ADMIN.FEATURES.URL}/${id}`
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