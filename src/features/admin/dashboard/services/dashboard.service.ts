import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { DashboardStats } from '../interfaces/dashboard.interface';

export const DashboardService = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        const { data } = await api.get<ApiListResponse<DashboardStats>>(
            API_ENDPOINTS.ADMIN.DASHBOARD.URL
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