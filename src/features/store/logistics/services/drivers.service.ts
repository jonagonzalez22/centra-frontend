import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { RouteDriver } from '../interfaces/route.interface';

export const DriversService = {
    getAll: async (): Promise<RouteDriver[]> => {
        const { data } = await api.get<ApiListResponse<{ items: RouteDriver[] }>>(
            API_ENDPOINTS.STORE.LOGISTICS.DRIVERS.URL
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data.items;
    },
};
