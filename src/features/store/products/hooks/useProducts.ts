import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { ProductsService } from '../services/products.service';
import { CategoriesService } from '@/features/store/categories/services/categories.service';
import type {
    Product,
    ProductsFilters,
    ProductsListResponse,
} from '../interfaces/product.interface';
import type { Category } from '@/features/store/categories/interfaces/category.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface ProductsPagination {
    current: number;
    total: number;
    pageSize: number;
    totalPages: number;
}

export interface UseProductsReturn {
    items: Product[];
    loading: boolean;
    error: string | null;
    pagination: ProductsPagination;
    filters: ProductsFilters;
    categories: Category[];
    categoriesLoading: boolean;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    setFilters: (filters: ProductsFilters) => void;
    refresh: () => void;
    deleteProduct: (id: string) => Promise<void>;
}

const DEFAULT_PER_PAGE = 15;

export const useProducts = (): UseProductsReturn => {
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<ProductsPagination>({
        current: 1,
        total: 0,
        pageSize: DEFAULT_PER_PAGE,
        totalPages: 0,
    });
    const [filters, setFiltersState] = useState<ProductsFilters>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
    
    const currentPageRef = useRef(1);
    const currentPerPageRef = useRef(DEFAULT_PER_PAGE);

    const fetchCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const response = await CategoriesService.getAll({ per_page: 100 });
            setCategories(response.items);
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    const fetchProducts = useCallback(async (currentFilters: ProductsFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const apiFilters = {
                ...currentFilters,
                page: currentFilters.page ?? 1,
                per_page: currentFilters.per_page ?? DEFAULT_PER_PAGE,
            };
            const response: ProductsListResponse = await ProductsService.getAll(apiFilters);
            setItems(response.items);
            currentPageRef.current = response.current_page;
            currentPerPageRef.current = apiFilters.per_page;
            setPagination({
                current: response.current_page,
                total: response.total,
                pageSize: apiFilters.per_page,
                totalPages: response.last_page,
            });
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar los productos.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const setPage = useCallback((page: number) => {
        setFiltersState((prev) => ({ ...prev, page }));
        fetchProducts({ ...filters, page });
    }, [filters, fetchProducts]);

    const setPerPage = useCallback((perPage: number) => {
        setFiltersState((prev) => ({ ...prev, per_page: perPage, page: 1 }));
        fetchProducts({ ...filters, per_page: perPage, page: 1 });
    }, [filters, fetchProducts]);

    const setFilters = useCallback((newFilters: ProductsFilters) => {
        const filtersWithPage = { ...newFilters, page: 1 };
        setFiltersState(filtersWithPage);
        fetchProducts(filtersWithPage);
    }, [fetchProducts]);

    const refresh = useCallback(() => {
        fetchProducts({ ...filters, page: currentPageRef.current });
    }, [filters, fetchProducts]);

    const deleteProduct = useCallback(async (id: string) => {
        try {
            await ProductsService.delete(id);
            message.success('Producto eliminado correctamente.');
            const lastPage = Math.ceil(pagination.total / currentPerPageRef.current);
            const targetPage = currentPageRef.current > lastPage ? lastPage : currentPageRef.current;
            if (targetPage !== currentPageRef.current) {
                currentPageRef.current = targetPage;
                setFiltersState((prev) => ({ ...prev, page: targetPage }));
            }
            fetchProducts({ ...filters, page: targetPage });
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al eliminar el producto.');
            throw err;
        }
    }, [filters, pagination.total, fetchProducts]);

    useEffect(() => {
        fetchProducts({ page: 1, per_page: DEFAULT_PER_PAGE });
        fetchCategories();
    }, [fetchProducts, fetchCategories]);

    return {
        items,
        loading,
        error,
        pagination,
        filters,
        categories,
        categoriesLoading,
        setPage,
        setPerPage,
        setFilters,
        refresh,
        deleteProduct,
    };
};

export { DEFAULT_PER_PAGE };
