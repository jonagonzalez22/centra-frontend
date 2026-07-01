import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    CommercialGroup,
    CommercialGroupsFilters,
    CommercialGroupsListResponse,
    CreateCommercialGroupDto,
    UpdateCommercialGroupDto,
} from '../types/commercialGroup.types';

export const CommercialGroupsService = {
    getAll: async (filters: CommercialGroupsFilters = {}): Promise<CommercialGroupsListResponse> => {
        const { data } = await api.get<ApiListResponse<CommercialGroupsListResponse>>(
            API_ENDPOINTS.STORE.COMMERCIAL_GROUPS.URL,
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

    create: async (dto: CreateCommercialGroupDto): Promise<CommercialGroup> => {
        const { data } = await api.post<ApiListResponse<CommercialGroup>>(
            API_ENDPOINTS.STORE.COMMERCIAL_GROUPS.URL,
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

    update: async (id: string, dto: UpdateCommercialGroupDto): Promise<CommercialGroup> => {
        const { data } = await api.put<ApiListResponse<CommercialGroup>>(
            `${API_ENDPOINTS.STORE.COMMERCIAL_GROUPS.URL}/${id}`,
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
            `${API_ENDPOINTS.STORE.COMMERCIAL_GROUPS.URL}/${id}`
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
