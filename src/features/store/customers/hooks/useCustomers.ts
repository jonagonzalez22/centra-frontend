import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { CustomersService } from '../services/customers.service';
import type { Customer, CustomersFilters } from '../types/customer.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface CustomersPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseCustomersReturn {
    customers: Customer[];
    loading: boolean;
    error: string | null;
    pagination: CustomersPagination;
    refetch: (filters?: CustomersFilters) => void;
    deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomers = (): UseCustomersReturn => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<CustomersPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const currentPageRef = useRef(1);

    const fetchCustomers = useCallback(async (filters: CustomersFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await CustomersService.getAll(filters);
            setCustomers(response.items);
            currentPageRef.current = response.current_page;
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar los clientes.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(
        (filters: CustomersFilters = {}) => {
            fetchCustomers({ page: 1, ...filters });
        },
        [fetchCustomers]
    );

    const deleteCustomer = useCallback(
        async (id: string) => {
            try {
                await CustomersService.delete(id);
                message.success('Cliente eliminado correctamente.');
                fetchCustomers({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar el cliente.');
                throw err;
            }
        },
        [fetchCustomers]
    );

    useEffect(() => {
        fetchCustomers({ page: 1 });
    }, [fetchCustomers]);

    return { customers, loading, error, pagination, refetch, deleteCustomer };
};
