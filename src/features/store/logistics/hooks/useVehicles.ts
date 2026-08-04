import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { VehiclesService } from '../services/vehicles.service';
import type { RouteVehicle } from '../interfaces/route.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseVehiclesReturn {
    vehicles: RouteVehicle[];
    vehiclesLoading: boolean;
}

export const useVehicles = (): UseVehiclesReturn => {
    const [vehicles, setVehicles] = useState<RouteVehicle[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(true);

    const fetchVehicles = useCallback(async () => {
        try {
            setVehiclesLoading(true);
            const data = await VehiclesService.getAll();
            setVehicles(data);
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al cargar los vehículos.');
        } finally {
            setVehiclesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    return { vehicles, vehiclesLoading };
};
