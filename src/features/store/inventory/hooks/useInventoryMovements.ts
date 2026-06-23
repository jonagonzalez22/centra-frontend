import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { InventoryMovementsService } from '../services/inventoryMovements.service';
import type {
    InventoryMovement,
    InventoryMovementsFilters,
    InventoryMovementsResponse,
    CreateStockMovementDto,
} from '../interfaces/inventory-movement.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface InventoryMovementsPagination {
    current: number;
    total: number;
    pageSize: number;
    totalPages: number;
}

export interface UseInventoryMovementsReturn {
    items: InventoryMovement[];
    loading: boolean;
    error: string | null;
    pagination: InventoryMovementsPagination;
    filters: InventoryMovementsFilters;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    setFilters: (filters: InventoryMovementsFilters) => void;
    refresh: () => void;
    adjustStock: (dto: CreateStockMovementDto) => Promise<void>;
}

const DEFAULT_PER_PAGE = 15;

export const useInventoryMovements = (): UseInventoryMovementsReturn => {
    const [items, setItems] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<InventoryMovementsPagination>({
        current: 1,
        total: 0,
        pageSize: DEFAULT_PER_PAGE,
        totalPages: 0,
    });
    const [filters, setFiltersState] = useState<InventoryMovementsFilters>({});

    const currentPageRef = useRef(1);
    const currentPerPageRef = useRef(DEFAULT_PER_PAGE);
    const currentFiltersRef = useRef<InventoryMovementsFilters>({});

    const fetchMovements = useCallback(async (currentFilters: InventoryMovementsFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const apiFilters = {
                ...currentFilters,
                page: currentFilters.page ?? 1,
                per_page: currentFilters.per_page ?? DEFAULT_PER_PAGE,
            };
            const response: InventoryMovementsResponse = await InventoryMovementsService.getAll(apiFilters);
            setItems(response.items);
            currentPageRef.current = response.current_page;
            currentPerPageRef.current = apiFilters.per_page;
            currentFiltersRef.current = currentFilters;
            setPagination({
                current: response.current_page,
                total: response.total,
                pageSize: apiFilters.per_page,
                totalPages: response.last_page,
            });
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar los movimientos de inventario.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const setPage = useCallback(
        (page: number) => {
            setFiltersState((prev) => ({ ...prev, page }));
            fetchMovements({ ...currentFiltersRef.current, page });
        },
        [fetchMovements]
    );

    const setPerPage = useCallback(
        (perPage: number) => {
            setFiltersState((prev) => ({ ...prev, per_page: perPage, page: 1 }));
            fetchMovements({ ...currentFiltersRef.current, per_page: perPage, page: 1 });
        },
        [fetchMovements]
    );

    const setFilters = useCallback(
        (newFilters: InventoryMovementsFilters) => {
            const filtersWithPage = { ...newFilters, page: 1 };
            setFiltersState(filtersWithPage);
            fetchMovements(filtersWithPage);
        },
        [fetchMovements]
    );

    const refresh = useCallback(() => {
        fetchMovements({ ...currentFiltersRef.current, page: currentPageRef.current });
    }, [fetchMovements]);

    const adjustStock = useCallback(
        async (dto: CreateStockMovementDto) => {
            try {
                await InventoryMovementsService.create(dto);
                message.success('Ajuste de stock realizado correctamente.');
                refresh();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al realizar el ajuste de stock.');
                throw err;
            }
        },
        [refresh]
    );

    useEffect(() => {
        fetchMovements({ page: 1, per_page: DEFAULT_PER_PAGE });
    }, [fetchMovements]);

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
        adjustStock,
    };
};

export { DEFAULT_PER_PAGE };
