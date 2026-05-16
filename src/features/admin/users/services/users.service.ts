import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { UsersFilters, UsersListResponse } from '../types/user.types';

export const UsersService = {
    getUsers: async (filters: UsersFilters = {}): Promise<UsersListResponse> => {
        const { data } = await api.get<ApiListResponse<UsersListResponse>>(
            API_ENDPOINTS.ADMIN.USERS.URL,
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

    delete: async (id: number): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<void>>(
            `${API_ENDPOINTS.ADMIN.USERS.URL}/${id}`
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