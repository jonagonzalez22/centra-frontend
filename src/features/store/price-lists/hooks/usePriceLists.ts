import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { PriceListsService } from '../services/priceLists.service';
import type { PriceList, PriceListPayload, PriceListsFilters } from '../types/priceList.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export const usePriceLists = () => {
    const [items, setItems] = useState<PriceList[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [filters, setFilters] = useState<PriceListsFilters>({});

    const load = useCallback(
        async (nextFilters: PriceListsFilters, isInitialLoad = false) => {
            if (isInitialLoad) setLoading(true);
            else setFetching(true);
            try {
                const response = await PriceListsService.getAll({ ...nextFilters, per_page: 100 });
                setItems(response.items);
            } catch (error) {
                message.error(
                    (error as ApiError).message || 'No se pudieron cargar las listas de precios.'
                );
            } finally {
                if (isInitialLoad) setLoading(false);
                else setFetching(false);
            }
        },
        []
    );

    useEffect(() => {
        void load({}, true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const applyFilters = useCallback(
        (nextFilters: PriceListsFilters) => {
            setFilters(nextFilters);
            void load(nextFilters);
        },
        [load]
    );

    const save = useCallback(
        async (priceList: PriceList | null, payload: PriceListPayload) => {
            if (priceList) await PriceListsService.update(priceList.id, payload);
            else await PriceListsService.create(payload);
            await load(filters);
        },
        [filters, load]
    );

    const remove = useCallback(
        async (id: string) => {
            await PriceListsService.delete(id);
            await load(filters);
        },
        [filters, load]
    );

    return { items, loading, fetching, filters, applyFilters, save, remove };
};
