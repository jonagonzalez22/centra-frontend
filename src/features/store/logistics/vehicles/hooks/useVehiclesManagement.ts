import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { VehicleManagementService } from '../services/vehicles.service';
import type { VehiclesFilters, VehiclesListResponse } from '../interfaces/vehicle.interface';

const DEFAULT_PER_PAGE = 15;

export const useVehiclesManagement = () => {
    const [data, setData] = useState<VehiclesListResponse>({
        items: [],
        total: 0,
        per_page: DEFAULT_PER_PAGE,
        current_page: 1,
        last_page: 1,
    });
    const [filters, setFiltersState] = useState<VehiclesFilters>({
        page: 1,
        per_page: DEFAULT_PER_PAGE,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const fetchVehicles = useCallback(async (nextFilters: VehiclesFilters) => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);
        try {
            const response = await VehicleManagementService.getAll(nextFilters);
            if (requestId === requestIdRef.current) setData(response);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'No se pudieron cargar los vehículos.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            if (requestId === requestIdRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles(filters);
    }, [fetchVehicles, filters]);

    const setFilters = (changes: Omit<VehiclesFilters, 'page' | 'per_page'>) => {
        setFiltersState((current) => {
            const next = { ...current, ...changes, page: 1 };
            return Object.keys(next).every(
                (key) =>
                    next[key as keyof VehiclesFilters] === current[key as keyof VehiclesFilters]
            )
                ? current
                : next;
        });
    };
    const setPage = (page: number, perPage = filters.per_page ?? DEFAULT_PER_PAGE) => {
        setFiltersState((current) => ({ ...current, page, per_page: perPage }));
    };
    const refresh = () => fetchVehicles(filters);

    return { ...data, filters, loading, error, setFilters, setPage, refresh };
};
