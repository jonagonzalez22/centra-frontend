import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    CustomerAddress,
    CreateCustomerAddressDto,
    UpdateCustomerAddressDto,
} from '../types/customerAddress.types';

interface AddressesListData {
    items: CustomerAddress[];
}

const buildUrl = (customerId: string) =>
    API_ENDPOINTS.STORE.CUSTOMER_ADDRESSES.URL.replace(':customerId', customerId);

export const CustomerAddressesService = {
    getAll: async (customerId: string): Promise<CustomerAddress[]> => {
        const { data } = await api.get<ApiListResponse<AddressesListData>>(
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
        dto: CreateCustomerAddressDto
    ): Promise<CustomerAddress> => {
        const { data } = await api.post<ApiListResponse<CustomerAddress>>(
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
        addressId: string,
        dto: UpdateCustomerAddressDto
    ): Promise<CustomerAddress> => {
        const { data } = await api.put<ApiListResponse<CustomerAddress>>(
            `${buildUrl(customerId)}/${addressId}`,
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

    delete: async (customerId: string, addressId: string): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<null>>(
            `${buildUrl(customerId)}/${addressId}`
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
