import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { RoutesFilters, RoutesListResponse } from '../interfaces/route.interface';

export const RoutesService = {
    getAll: async (filters: RoutesFilters = {}): Promise<RoutesListResponse> => {
        const { data } = await api.get<ApiListResponse<RoutesListResponse>>(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.URL,
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
};
