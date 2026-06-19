import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { CategoriesService } from '../services/categories.service';
import type { Category, CategoriesFilters } from '../interfaces/category.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface CategoriesPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseCategoriesReturn {
    categories: Category[];
    loading: boolean;
    error: string | null;
    pagination: CategoriesPagination;
    refetch: (filters?: CategoriesFilters) => void;
    deleteCategory: (id: string) => Promise<void>;
}

export const useCategories = (): UseCategoriesReturn => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<CategoriesPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const currentPageRef = useRef(1);

    const fetchCategories = useCallback(async (filters: CategoriesFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await CategoriesService.getAll(filters);
            setCategories(response.items);
            currentPageRef.current = response.current_page;
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar las categorías.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(
        (filters: CategoriesFilters = {}) => {
            fetchCategories({ page: 1, ...filters });
        },
        [fetchCategories]
    );

    const deleteCategory = useCallback(
        async (id: string) => {
            try {
                await CategoriesService.delete(id);
                message.success('Categoría eliminada correctamente.');
                fetchCategories({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar la categoría.');
                throw err;
            }
        },
        [fetchCategories]
    );

    useEffect(() => {
        fetchCategories({ page: 1 });
    }, [fetchCategories]);

    return { categories, loading, error, pagination, refetch, deleteCategory };
};