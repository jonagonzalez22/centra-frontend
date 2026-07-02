import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    CustomerContact,
    CreateCustomerContactDto,
    UpdateCustomerContactDto,
} from '../types/customerContact.types';

interface ContactsListData {
    items: CustomerContact[];
}

const buildUrl = (customerId: string) =>
    API_ENDPOINTS.STORE.CUSTOMER_CONTACTS.URL.replace(':customerId', customerId);

export const CustomerContactsService = {
    getAll: async (customerId: string): Promise<CustomerContact[]> => {
        const { data } = await api.get<ApiListResponse<ContactsListData>>(
            buildUrl(customerId)
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

    create: async (
        customerId: string,
        dto: CreateCustomerContactDto
    ): Promise<CustomerContact> => {
        const { data } = await api.post<ApiListResponse<CustomerContact>>(
            buildUrl(customerId),
            { ...dto, customer_id: customerId }
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

    update: async (
        customerId: string,
        contactId: string,
        dto: UpdateCustomerContactDto
    ): Promise<CustomerContact> => {
        const { data } = await api.put<ApiListResponse<CustomerContact>>(
            `${buildUrl(customerId)}/${contactId}`,
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

    delete: async (customerId: string, contactId: string): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<null>>(
            `${buildUrl(customerId)}/${contactId}`
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
