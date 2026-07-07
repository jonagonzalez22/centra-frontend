import api from '@/api/api.config';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CatalogApiResponse } from '../types/catalog.types';
export const CatalogService = {
    get: async <T>(catalogName: string): Promise<T[]> => {
        const { data } = await api.get<CatalogApiResponse<T>>(`/v1/catalogs/${catalogName}`);

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: (data.errors as Record<string, string[]>) ?? undefined,
            };
            throw error;
        }

        return data.data.items;
    },
};
