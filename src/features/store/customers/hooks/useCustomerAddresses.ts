import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { CustomerAddressesService } from '../services/customerAddresses.service';
import type {
    CustomerAddress,
    CreateCustomerAddressDto,
    UpdateCustomerAddressDto,
} from '../types/customerAddress.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseCustomerAddressesReturn {
    addresses: CustomerAddress[];
    loading: boolean;
    refetch: () => void;
    createAddress: (dto: CreateCustomerAddressDto) => Promise<void>;
    updateAddress: (id: string, dto: UpdateCustomerAddressDto) => Promise<void>;
    deleteAddress: (id: string) => Promise<void>;
}

export const useCustomerAddresses = (
    customerId: string
): UseCustomerAddressesReturn => {
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await CustomerAddressesService.getAll(customerId);
            setAddresses(data);
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al cargar los domicilios.');
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const createAddress = useCallback(
        async (dto: CreateCustomerAddressDto) => {
            try {
                await CustomerAddressesService.create(customerId, dto);
                message.success('Domicilio creado correctamente.');
                fetchAddresses();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    throw err;
                }
                message.error(apiError.message || 'Error al crear el domicilio.');
                throw err;
            }
        },
        [customerId, fetchAddresses]
    );

    const updateAddress = useCallback(
        async (id: string, dto: UpdateCustomerAddressDto) => {
            try {
                await CustomerAddressesService.update(customerId, id, dto);
                message.success('Domicilio actualizado correctamente.');
                fetchAddresses();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    throw err;
                }
                message.error(apiError.message || 'Error al actualizar el domicilio.');
                throw err;
            }
        },
        [customerId, fetchAddresses]
    );

    const deleteAddress = useCallback(
        async (id: string) => {
            try {
                await CustomerAddressesService.delete(customerId, id);
                message.success('Domicilio eliminado correctamente.');
                fetchAddresses();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar el domicilio.');
                throw err;
            }
        },
        [customerId, fetchAddresses]
    );

    return {
        addresses,
        loading,
        refetch: fetchAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
    };
};
