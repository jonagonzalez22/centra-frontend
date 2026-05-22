import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import type { Plan } from '../types/plan.types';
import { PlansService } from '../services/plans.service';

export interface PlansPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UsePlansReturn {
    plans: Plan[];
    loading: boolean;
    error: string | null;
    pagination: PlansPagination;
    refetch: () => void;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
            return (err as { message: string }).message;
        }
        if ('data' in err && (err as { data?: { message?: string } }).data?.message) {
            return (err as { data: { message: string } }).data.message;
        }
    }
    return fallback;
};

export const usePlans = (): UsePlansReturn => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PlansPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });

    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await PlansService.getAll();
            setPlans(response.items);
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const errorMessage = getErrorMessage(err, 'Error al cargar los planes.');
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        fetchPlans();
    }, [fetchPlans]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    return { plans, loading, error, pagination, refetch };
};
