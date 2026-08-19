import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { DriverService } from '../services/driver.service';
import type {
    DeliveryRoute,
    StorePaymentMethod,
} from '../interfaces/driver.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseActiveRouteReturn {
    route: DeliveryRoute | null;
    paymentMethods: StorePaymentMethod[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useActiveRoute = (): UseActiveRouteReturn => {
    const [route, setRoute] = useState<DeliveryRoute | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await DriverService.getActiveRoute();

            if (!result) {
                setRoute(null);
                setPaymentMethods([]);
                return;
            }

            setRoute(result.route);
            setPaymentMethods(result.available_payment_methods ?? []);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar la ruta activa.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return {
        route,
        paymentMethods,
        loading,
        error,
        refresh: fetch,
    };
};
