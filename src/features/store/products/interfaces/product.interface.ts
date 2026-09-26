export interface ProductCategory {
    id: string;
    name: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    description: string | null;
    price: string | number;
    cost: string | number | null;
    stock: DecimalString;
    stock_reserved: DecimalString;
    available_stock: DecimalString;
    stock_min: DecimalString;
    is_active: boolean;
    category: ProductCategory;
    parent_product_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateProductDto {
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    price: string | number;
    cost?: string | number | null;
    stock?: DecimalString;
    stock_min: DecimalString;
    is_active?: boolean;
    category_id: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductsListResponse {
    items: Product[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface ProductsFilters {
    page?: number;
    per_page?: number;
    category_id?: string;
    name?: string;
    sku?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
}

export interface ProductsSearchValues {
    name?: string;
    sku?: string;
    category_id?: string;
    is_active?: boolean;
}
import type { DecimalString } from '@/types/decimal';
