import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { CustomersService } from '../services/customers.service';
import type { Customer } from '../types/customer.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseCustomerReturn {
    customer: Customer | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useCustomer = (id: string | undefined): UseCustomerReturn => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCustomer = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await CustomersService.getById(id);
            setCustomer(data);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'No se pudo cargar el cliente.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCustomer();
    }, [fetchCustomer]);

    return { customer, loading, error, refetch: fetchCustomer };
};
