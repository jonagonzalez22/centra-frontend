import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    BusinessType,
    BusinessTypesFilters,
    BusinessTypesListResponse,
    CreateBusinessTypeDto,
    UpdateBusinessTypeDto,
} from '../types/business-type.types';

export const BusinessTypesService = {
    getAll: async (filters: BusinessTypesFilters = {}): Promise<BusinessTypesListResponse> => {
        const { data } = await api.get<ApiListResponse<BusinessTypesListResponse>>(
            API_ENDPOINTS.ADMIN.BUSINESS_TYPES.URL,
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

    create: async (dto: CreateBusinessTypeDto): Promise<BusinessType> => {
        const { data } = await api.post<ApiListResponse<BusinessType>>(
            API_ENDPOINTS.ADMIN.BUSINESS_TYPES.URL,
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

    update: async (id: number, dto: UpdateBusinessTypeDto): Promise<BusinessType> => {
        const { data } = await api.put<ApiListResponse<BusinessType>>(
            `${API_ENDPOINTS.ADMIN.BUSINESS_TYPES.URL}/${id}`,
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

    delete: async (id: number): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<null>>(
            `${API_ENDPOINTS.ADMIN.BUSINESS_TYPES.URL}/${id}`
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
