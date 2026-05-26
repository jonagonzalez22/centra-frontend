import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { DashboardService } from '../services/dashboard.service';
import type { DashboardStats } from '../interfaces/dashboard.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseDashboardReturn {
    data: DashboardStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
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

export const useDashboard = (): UseDashboardReturn => {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await DashboardService.getDashboardStats();
            setData(response);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = getErrorMessage(apiError, 'Error al cargar el dashboard.');
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        await fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return { data, loading, error, refetch };
};