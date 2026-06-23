import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';

export interface StoreUser {
    id: string;
    name: string;
    email: string;
}

export interface StoreUsersResponse {
    items: StoreUser[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export const StoreUsersService = {
    getAll: async (): Promise<StoreUser[]> => {
        const { data } = await api.get<ApiListResponse<StoreUsersResponse>>(
            API_ENDPOINTS.STORE.USERS.URL
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
