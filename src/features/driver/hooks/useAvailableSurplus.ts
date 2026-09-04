import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { SurplusProduct } from '../interfaces/driver.interface';
import { DriverService } from '../services/driver.service';

interface UseAvailableSurplusOptions {
    routeId: string;
    stopId: string;
    enabled: boolean;
}

export const useAvailableSurplus = ({
    routeId,
    stopId,
    enabled,
}: UseAvailableSurplusOptions) => {
    const [result, setResult] = useState<{
        key: string | null;
        surplus: SurplusProduct[];
        error: string | null;
    }>({ key: null, surplus: [], error: null });
    const [refreshToken, setRefreshToken] = useState(0);
    const requestIdRef = useRef(0);
    const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);
    const queryKey = `${routeId}:${stopId}:${refreshToken}`;

    useEffect(() => {
        const requestId = ++requestIdRef.current;

        if (!enabled || !routeId || !stopId) return;

        void DriverService.getAvailableSurplus(routeId)
            .then((products) => {
                if (requestId === requestIdRef.current) {
                    setResult({ key: queryKey, surplus: products, error: null });
                }
            })
            .catch((err: ApiError) => {
                if (requestId !== requestIdRef.current) return;
                setResult({
                    key: queryKey,
                    surplus: [],
                    error: err.message || 'No se pudo consultar la disponibilidad para Venta Extra.',
                });
            });
    }, [enabled, queryKey, routeId, stopId]);

    const hasCurrentResult = enabled && result.key === queryKey;
    const surplus = hasCurrentResult ? result.surplus : [];
    const error = hasCurrentResult ? result.error : null;
    const loading = enabled && !!routeId && !!stopId && !hasCurrentResult;

    const hasAvailableSurplus =
        !loading && !error && surplus.some((product) => product.available_quantity > 0);

    return { surplus, loading, error, hasAvailableSurplus, refresh };
};
