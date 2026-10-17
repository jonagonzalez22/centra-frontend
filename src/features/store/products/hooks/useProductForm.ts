import { useCallback, useState } from 'react';
import { message } from 'antd';
import { ProductsService } from '../services/products.service';
import type {
    Product,
    CreateProductDto,
    UpdateProductDto,
} from '../interfaces/product.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseProductFormProps {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export interface UseProductFormReturn {
    loading: boolean;
    createProduct: (dto: CreateProductDto) => Promise<void>;
    updateProduct: (id: string, dto: UpdateProductDto) => Promise<void>;
}

export const useProductForm = ({ onSuccess, onError }: UseProductFormProps): UseProductFormReturn => {
    const [loading, setLoading] = useState(false);

    const createProduct = useCallback(async (dto: CreateProductDto) => {
        try {
            setLoading(true);
            await ProductsService.create(dto);
            message.success('Producto creado correctamente.');
            onSuccess?.();
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                onError?.(apiError.errors);
                message.error(apiError.message);
                throw err;
            }
            message.error(apiError.message || 'Error al crear el producto.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [onSuccess, onError]);

    const updateProduct = useCallback(async (id: string, dto: UpdateProductDto) => {
        try {
            setLoading(true);
            await ProductsService.update(id, dto);
            message.success('Producto actualizado correctamente.');
            onSuccess?.();
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                onError?.(apiError.errors);
                message.error(apiError.message);
                throw err;
            }
            message.error(apiError.message || 'Error al actualizar el producto.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [onSuccess, onError]);

    return { loading, createProduct, updateProduct };
};

export const buildInitialValuesFromProduct = (product: Product): CreateProductDto => {
    return {
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? undefined,
        description: product.description ?? undefined,
        price: product.price,
        cost: product.cost ?? undefined,
        stock: product.stock,
        stock_min: product.stock_min,
        stock_measurement_unit_id: product.stock_measurement_unit_id ?? '',
        sale_quantity_step: product.sale_quantity_step ?? '1.0000',
        stock_source_product_id: product.stock_source_product?.id ?? null,
        stock_consumption_quantity: product.stock_consumption_quantity ?? null,
        uses_external_stock: product.stock_source_product !== null,
        is_active: product.is_active,
        category_id: product.category.id,
    };
};
