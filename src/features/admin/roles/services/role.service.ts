import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    Role,
    RolesListResponse,
    PermissionsListResponse,
    UpdateRoleDto,
    SyncPermissionsDto,
    PermissionsFilters,
} from '../types/role.types';

export const RolesService = {
    getAll: async (): Promise<RolesListResponse> => {
        const { data } = await api.get<ApiListResponse<RolesListResponse>>(
            API_ENDPOINTS.ADMIN.ROLES.URL
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

    getById: async (id: string): Promise<Role> => {
        const { data } = await api.get<ApiListResponse<Role>>(
            `${API_ENDPOINTS.ADMIN.ROLES.URL}/${id}`
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

    update: async (id: string, dto: UpdateRoleDto): Promise<Role> => {
        const { data } = await api.put<ApiListResponse<Role>>(
            `${API_ENDPOINTS.ADMIN.ROLES.URL}/${id}`,
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

    getPermissions: async (
        filters?: PermissionsFilters
    ): Promise<PermissionsListResponse> => {
        const { data } = await api.get<ApiListResponse<PermissionsListResponse>>(
            API_ENDPOINTS.ADMIN.PERMISSIONS.URL,
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

    syncPermissions: async (roleId: string, dto: SyncPermissionsDto): Promise<void> => {
        const { data } = await api.post<ApiListResponse<null>>(
            `${API_ENDPOINTS.ADMIN.ROLES.URL}/${roleId}/sync-permissions`,
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