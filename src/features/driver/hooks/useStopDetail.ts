import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { DriverService } from '../services/driver.service';
import type { StopDetail } from '../interfaces/driver.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseStopDetailReturn {
    stop: StopDetail | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useStopDetail = (stopId: string): UseStopDetailReturn => {
    const [stop, setStop] = useState<StopDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await DriverService.getStopDetail(stopId);
            setStop(result);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar el detalle de la parada.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [stopId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return {
        stop,
        loading,
        error,
        refresh: fetch,
    };
};
