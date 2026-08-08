import { useState, useCallback } from 'react';
import { message } from 'antd';
import { RoutesService } from '../services/routes.service';
import type { LoadSheetData, ConfirmLoadPayload, BulkLoadPayload } from '../interfaces/loadSheet.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseLoadSheetReturn {
    loadSheet: LoadSheetData | null;
    loading: boolean;
    confirming: boolean;
    bulkLoading: boolean;
    load: () => Promise<void>;
    confirmLoad: (payload: ConfirmLoadPayload) => Promise<void>;
    bulkLoad: (payload: BulkLoadPayload) => Promise<void>;
}

export const useLoadSheet = (routeId: string): UseLoadSheetReturn => {
    const [loadSheet, setLoadSheet] = useState<LoadSheetData | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await RoutesService.getLoadSheet(routeId);
            setLoadSheet(data);
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al cargar la hoja de carga.');
        } finally {
            setLoading(false);
        }
    }, [routeId]);

    const confirmLoad = useCallback(
        async (payload: ConfirmLoadPayload) => {
            try {
                setConfirming(true);
                await RoutesService.confirmLoad(routeId, payload);
                message.success('Carga confirmada exitosamente.');
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al confirmar la carga.');
                throw err;
            } finally {
                setConfirming(false);
            }
        },
        [routeId]
    );

    const bulkLoad = useCallback(
        async (payload: BulkLoadPayload) => {
            try {
                setBulkLoading(true);
                await RoutesService.bulkLoad(routeId, payload);
                message.success('Carga confirmada exitosamente.');
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al confirmar la carga.');
                throw err;
            } finally {
                setBulkLoading(false);
            }
        },
        [routeId]
    );

    return { loadSheet, loading, confirming, bulkLoading, load, confirmLoad, bulkLoad };
};
