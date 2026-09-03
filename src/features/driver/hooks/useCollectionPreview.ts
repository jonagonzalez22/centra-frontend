import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CollectionPreview } from '../interfaces/driver.interface';
import { DriverService } from '../services/driver.service';

interface PreviewItem {
    route_stop_item_id: string;
    quantity_delivered: number;
}

interface UseCollectionPreviewOptions {
    stopId: string;
    items: PreviewItem[];
    enabled: boolean;
}

export const useCollectionPreview = ({ stopId, items, enabled }: UseCollectionPreviewOptions) => {
    const [preview, setPreview] = useState<CollectionPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryToken, setRetryToken] = useState(0);
    const requestIdRef = useRef(0);
    const serializedItems = JSON.stringify(items);
    const retry = useCallback(() => setRetryToken((value) => value + 1), []);

    useEffect(() => {
        if (!enabled || !stopId || items.length === 0) {
            setPreview(null);
            setLoading(false);
            setError(null);
            return;
        }

        const requestId = ++requestIdRef.current;
        const controller = new AbortController();
        setPreview(null);
        setLoading(true);
        setError(null);

        const timeoutId = window.setTimeout(async () => {
            try {
                const result = await DriverService.previewCollection(
                    stopId,
                    JSON.parse(serializedItems) as PreviewItem[],
                    controller.signal
                );
                if (requestId === requestIdRef.current) setPreview(result);
            } catch (err) {
                if (controller.signal.aborted || requestId !== requestIdRef.current) return;
                const apiError = err as ApiError;
                setError(apiError.message || 'No se pudo calcular el monto a cobrar.');
            } finally {
                if (requestId === requestIdRef.current) setLoading(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [enabled, items.length, retryToken, serializedItems, stopId]);

    return { preview, loading, error, retry };
};
