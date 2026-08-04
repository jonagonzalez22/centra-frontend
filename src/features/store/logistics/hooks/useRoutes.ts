import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { RoutesService } from '../services/routes.service';
import type { DeliveryRoute, RoutesFilters, RoutesListResponse } from '../interfaces/route.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface RoutesPagination {
    current: number;
    total: number;
    pageSize: number;
    totalPages: number;
}

export interface UseRoutesReturn {
    items: DeliveryRoute[];
    loading: boolean;
    error: string | null;
    pagination: RoutesPagination;
    filters: RoutesFilters;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    setFilters: (filters: RoutesFilters) => void;
    refresh: () => void;
}

const DEFAULT_PER_PAGE = 15;

export const useRoutes = (): UseRoutesReturn => {
    const [items, setItems] = useState<DeliveryRoute[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<RoutesPagination>({
        current: 1,
        total: 0,
        pageSize: DEFAULT_PER_PAGE,
        totalPages: 0,
    });
    const [filters, setFiltersState] = useState<RoutesFilters>({});

    const currentPageRef = useRef(1);

    const fetchRoutes = useCallback(async (currentFilters: RoutesFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const apiFilters = {
                ...currentFilters,
                page: currentFilters.page ?? 1,
                per_page: currentFilters.per_page ?? DEFAULT_PER_PAGE,
            };
            const response: RoutesListResponse = await RoutesService.getAll(apiFilters);
            setItems(response.items);
            currentPageRef.current = response.current_page;
            setPagination({
                current: response.current_page,
                total: response.total,
                pageSize: apiFilters.per_page,
                totalPages: response.last_page,
            });
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar las rutas.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const setPage = useCallback(
        (page: number) => {
            setFiltersState((prev) => ({ ...prev, page }));
            fetchRoutes({ ...filters, page });
        },
        [filters, fetchRoutes]
    );

    const setPerPage = useCallback(
        (perPage: number) => {
            setFiltersState((prev) => ({ ...prev, per_page: perPage, page: 1 }));
            fetchRoutes({ ...filters, per_page: perPage, page: 1 });
        },
        [filters, fetchRoutes]
    );

    const setFilters = useCallback(
        (newFilters: RoutesFilters) => {
            const filtersWithPage = { ...newFilters, page: 1 };
            setFiltersState(filtersWithPage);
            fetchRoutes(filtersWithPage);
        },
        [fetchRoutes]
    );

    const refresh = useCallback(() => {
        fetchRoutes({ ...filters, page: currentPageRef.current });
    }, [filters, fetchRoutes]);

    useEffect(() => {
        fetchRoutes({ page: 1, per_page: DEFAULT_PER_PAGE });
    }, [fetchRoutes]);

    return {
        items,
        loading,
        error,
        pagination,
        filters,
        setPage,
        setPerPage,
        setFilters,
        refresh,
    };
};
