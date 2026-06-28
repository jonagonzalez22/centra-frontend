import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { User } from '@/entities/User';
import type {
    StoreUsersListResponse,
    StoreUsersFilters,
    CreateStoreUserDto,
    UpdateStoreUserDto,
    StoreUsersFilterOptions,
    PermissionCatalog,
    PermissionCatalogResponse,
    SyncPermissionsDto,
    UserPermissionsResponse,
} from '../types/storeUser.types';

export const StoreUsersService = {
    getAll: async (filters: StoreUsersFilters = {}): Promise<StoreUsersListResponse> => {
        const { data } = await api.get<ApiListResponse<StoreUsersListResponse>>(
            API_ENDPOINTS.STORE.USERS.URL,
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

    getById: async (id: number): Promise<User> => {
        const { data } = await api.get<ApiListResponse<User>>(
            `${API_ENDPOINTS.STORE.USERS.URL}/${id}`
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

    create: async (userData: CreateStoreUserDto): Promise<User> => {
        const { data } = await api.post<ApiListResponse<User>>(
            API_ENDPOINTS.STORE.USERS.URL,
            userData
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

    update: async (id: number, userData: UpdateStoreUserDto): Promise<User> => {
        const { data } = await api.put<ApiListResponse<User>>(
            `${API_ENDPOINTS.STORE.USERS.URL}/${id}`,
            userData
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
            `${API_ENDPOINTS.STORE.USERS.URL}/${id}`
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

    getFilterOptions: async (): Promise<StoreUsersFilterOptions> => {
        const { data } = await api.get<ApiListResponse<StoreUsersFilterOptions>>(
            API_ENDPOINTS.STORE.USERS.FILTER_OPTIONS
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

    getPermissionCatalog: async (): Promise<PermissionCatalog> => {
        const { data } = await api.get<ApiListResponse<PermissionCatalogResponse>>(
            API_ENDPOINTS.STORE.USERS.PERMISSION_CATALOG
        );
        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }
        return data.data.groups;
    },

    getUserPermissions: async (userId: number): Promise<string[]> => {
        const { data } = await api.get<ApiListResponse<UserPermissionsResponse>>(
            `${API_ENDPOINTS.STORE.USERS.URL}/${userId}/permissions`
        );
        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }
        return data.data.permissions;
    },

    syncUserPermissions: async (userId: number, dto: SyncPermissionsDto): Promise<void> => {
        const { data } = await api.post<ApiListResponse<null>>(
            `${API_ENDPOINTS.STORE.USERS.URL}/${userId}/permissions`,
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
