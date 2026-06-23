import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    InventoryMovement,
    CreateStockMovementDto,
    InventoryMovementsFilters,
    InventoryMovementsResponse,
} from '../interfaces/inventory-movement.interface';

export const InventoryMovementsService = {
    getAll: async (
        filters: InventoryMovementsFilters = {}
    ): Promise<InventoryMovementsResponse> => {
        const { data } = await api.get<ApiListResponse<InventoryMovementsResponse>>(
            API_ENDPOINTS.STORE.STOCK_MOVEMENTS.URL,
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

    getByProduct: async (productId: string, limit: number = 10): Promise<InventoryMovement[]> => {
        const { data } = await api.get<ApiListResponse<InventoryMovementsResponse>>(
            API_ENDPOINTS.STORE.STOCK_MOVEMENTS.URL,
            { params: { product_id: productId, per_page: limit } }
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

    create: async (dto: CreateStockMovementDto): Promise<InventoryMovement> => {
        const { data } = await api.post<ApiListResponse<InventoryMovement>>(
            API_ENDPOINTS.STORE.STOCK_ADJUST.URL,
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
};
