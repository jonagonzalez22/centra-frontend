import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { DriversService } from '../services/drivers.service';
import type { RouteDriver } from '../interfaces/route.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseDriversReturn {
    drivers: RouteDriver[];
    driversLoading: boolean;
}

export const useDrivers = (): UseDriversReturn => {
    const [drivers, setDrivers] = useState<RouteDriver[]>([]);
    const [driversLoading, setDriversLoading] = useState<boolean>(true);

    const fetchDrivers = useCallback(async () => {
        try {
            setDriversLoading(true);
            const data = await DriversService.getAll();
            setDrivers(data);
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al cargar los conductores.');
        } finally {
            setDriversLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    return { drivers, driversLoading };
};
