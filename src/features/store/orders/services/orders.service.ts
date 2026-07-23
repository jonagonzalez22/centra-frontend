import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    OrderDetail,
    OrderFilters,
    OrderListItem,
    PaginatedResponse,
} from '../interfaces/order.interface';

export const OrdersService = {
    getAll: async (filters: OrderFilters): Promise<PaginatedResponse<OrderListItem>> => {
        // El backend acepta UN solo valor de status (enum: open|confirmed|cancelled|closed).
        // Si no se envía el parámetro, el backend aplica por defecto open+confirmed.
        // 'open,confirmed' no es válido como valor → lo tratamos como "usar default".
        const effectiveStatus =
            filters.status && filters.status !== 'open,confirmed' && filters.status !== ''
                ? filters.status
                : undefined;

        const params: Record<string, string | number | undefined> = {
            date: filters.date ?? undefined,
            date_from: filters.date_from,
            date_to: filters.date_to,
            operation_number: filters.operation_number,
            customer_name: filters.customer_name,
            locality: filters.locality,
            status: effectiveStatus,
            per_page: filters.per_page ?? 20,
            page: filters.page ?? 1,
        };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        const { data } = await api.get<ApiListResponse<PaginatedResponse<OrderListItem>>>(
            API_ENDPOINTS.STORE.ORDERS.URL,
            { params }
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

    getById: async (id: string): Promise<OrderDetail> => {
        const { data } = await api.get<ApiListResponse<OrderDetail>>(
            `${API_ENDPOINTS.STORE.ORDERS.URL}/${id}`
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

    reschedule: async (
        id: string,
        payload: { new_date: string; reason: string; observation?: string }
    ): Promise<OrderDetail> => {
        const { data } = await api.put<ApiListResponse<OrderDetail>>(
            API_ENDPOINTS.STORE.ORDERS.RESCHEDULE(id),
            payload
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
