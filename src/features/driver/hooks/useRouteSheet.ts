import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { DriverService } from '../services/driver.service';
import type { RouteStopsItem, StorePaymentMethod } from '../interfaces/driver.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseRouteSheetReturn {
    stops: RouteStopsItem[];
    paymentMethods: StorePaymentMethod[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useRouteSheet = (routeId: string): UseRouteSheetReturn => {
    const [stops, setStops] = useState<RouteStopsItem[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await DriverService.getRouteStops(routeId);
            setStops(result);
            // Payment methods not available in this endpoint yet
            setPaymentMethods([]);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar la hoja de ruta.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [routeId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return {
        stops,
        paymentMethods,
        loading,
        error,
        refresh: fetch,
    };
};
