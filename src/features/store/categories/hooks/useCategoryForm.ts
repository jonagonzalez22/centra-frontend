import { useState, useCallback } from 'react';
import { message } from 'antd';
import { CategoriesService } from '../services/categories.service';
import type { CreateCategoryDto, UpdateCategoryDto } from '../interfaces/category.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseCategoryFormReturn {
    loading: boolean;
    createCategory: (data: CreateCategoryDto) => Promise<void>;
    updateCategory: (id: string, data: UpdateCategoryDto) => Promise<void>;
}

interface UseCategoryFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useCategoryForm = (options?: UseCategoryFormOptions): UseCategoryFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createCategory = useCallback(
        async (data: CreateCategoryDto) => {
            setLoading(true);
            try {
                await CategoriesService.create(data);
                message.success('Categoría creada correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear la categoría.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updateCategory = useCallback(
        async (id: string, data: UpdateCategoryDto) => {
            setLoading(true);
            try {
                await CategoriesService.update(id, data);
                message.success('Categoría actualizada correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar la categoría.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    return { loading, createCategory, updateCategory };
};