import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    Plan,
    PlansListResponse,
    CreatePlanDto,
    UpdatePlanDto,
    SyncFeaturesDto,
} from '../types/plan.types';

export const PlansService = {
    getAll: async (): Promise<PlansListResponse> => {
        const { data } = await api.get<ApiListResponse<PlansListResponse>>(
            API_ENDPOINTS.ADMIN.PLANS.URL
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

    getById: async (id: string): Promise<Plan> => {
        const { data } = await api.get<ApiListResponse<Plan>>(
            `${API_ENDPOINTS.ADMIN.PLANS.URL}/${id}`
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

    create: async (dto: CreatePlanDto): Promise<Plan> => {
        const { data } = await api.post<ApiListResponse<Plan>>(
            API_ENDPOINTS.ADMIN.PLANS.URL,
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

    update: async (id: string, dto: UpdatePlanDto): Promise<Plan> => {
        const { data } = await api.put<ApiListResponse<Plan>>(
            `${API_ENDPOINTS.ADMIN.PLANS.URL}/${id}`,
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
            `${API_ENDPOINTS.ADMIN.PLANS.URL}/${id}`
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

    syncFeatures: async (planId: string, dto: SyncFeaturesDto): Promise<void> => {
        const { data } = await api.post<ApiListResponse<null>>(
            `${API_ENDPOINTS.ADMIN.PLANS.URL}/${planId}/sync-features`,
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
    },
};
