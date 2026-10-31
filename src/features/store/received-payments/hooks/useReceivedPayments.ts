import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReceivedPaymentsService } from '../services/received-payments.service';
import type {
    ReceivedPayment,
    ReceivedPaymentsFilters,
} from '../interfaces/received-payment.interface';

const INITIAL_FILTERS: ReceivedPaymentsFilters = { page: 1, per_page: 20 };

export const useReceivedPayments = () => {
    const [payments, setPayments] = useState<ReceivedPayment[]>([]);
    const [filters, setFiltersState] = useState<ReceivedPaymentsFilters>(INITIAL_FILTERS);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current: 1, total: 0, perPage: 20 });
    const requestId = useRef(0);

    const fetchPayments = useCallback(async (nextFilters: ReceivedPaymentsFilters) => {
        const currentRequest = ++requestId.current;
        setLoading(true);
        try {
            const result = await ReceivedPaymentsService.getAll(nextFilters);
            if (currentRequest !== requestId.current) return;
            setPayments(result.items);
            setPagination({
                current: result.current_page,
                total: result.total,
                perPage: result.per_page,
            });
        } catch (error) {
            if (currentRequest !== requestId.current) return;
            message.error(
                (error as { message?: string }).message || 'No se pudieron cargar los pagos.'
            );
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPayments(filters);
    }, [fetchPayments, filters]);

    const setFilters = useCallback((changes: Partial<ReceivedPaymentsFilters>) => {
        setFiltersState((current) => ({ ...current, ...changes, page: changes.page ?? 1 }));
    }, []);
    const resetFilters = useCallback(() => setFiltersState(INITIAL_FILTERS), []);

    return { payments, filters, loading, pagination, setFilters, resetFilters };
};
