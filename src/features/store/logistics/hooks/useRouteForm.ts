import { useCallback, useState } from 'react';
import { message } from 'antd';
import { RoutesService } from '../services/routes.service';
import type { CreateRouteDto, DeliveryRoute } from '../interfaces/route.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseRouteFormProps {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export interface UseRouteFormReturn {
    loading: boolean;
    createRoute: (dto: CreateRouteDto) => Promise<DeliveryRoute>;
}

export const useRouteForm = ({ onSuccess, onError }: UseRouteFormProps): UseRouteFormReturn => {
    const [loading, setLoading] = useState(false);

    const createRoute = useCallback(
        async (dto: CreateRouteDto) => {
            try {
                setLoading(true);
                const route = await RoutesService.create(dto);
                message.success('Ruta creada correctamente.');
                onSuccess?.();
                return route;
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    onError?.(apiError.errors);
                    message.error(apiError.message);
                    throw err;
                }
                message.error(apiError.message || 'Error al crear la ruta.');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    return { loading, createRoute };
};
