import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { GeocodingResult } from '../interfaces/geocoding.types';

export const GeocodingService = {
    searchAddress: async (address: string): Promise<GeocodingResult> => {
        const { data } = await api.post<ApiListResponse<GeocodingResult>>(
            API_ENDPOINTS.GEOCODING.SEARCH,
            { address }
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: (data.errors as unknown as Record<string, string[]>) ?? undefined,
            };
            throw error;
        }

        return data.data;
    },
};
