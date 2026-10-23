import type { DecimalString } from '@/types/decimal';

export interface ProductCategory {
    id: string;
    name: string;
}
export interface ProductBrand { id: string; name: string; is_active: boolean; }

export interface MeasurementUnit {
    id: string;
    code: string;
    name: string;
    symbol: string;
    category: string;
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
    stock_measurement_unit_id: string | null;
    stock_measurement_unit: MeasurementUnit | null;
    stock_source_product?: Pick<Product, 'id' | 'name' | 'sku' | 'stock_measurement_unit'> | null;
    stock_consumption_quantity?: DecimalString | null;
    sale_quantity_step: DecimalString;
    commercial_available_quantity: DecimalString;
    is_active: boolean;
    is_sellable: boolean;
    category: ProductCategory;
    brand?: ProductBrand | null;
    parent_product_id: string | null;
    created_at: string;
    updated_at: string;
}

/** Lightweight active product result used when selecting a stock source. */
export interface ProductSourceCandidate {
    id: string;
    name: string;
    sku: string;
    stock_source_product_id: string | null;
    stock_measurement_unit: Pick<MeasurementUnit, 'id' | 'code' | 'name' | 'symbol' | 'category'> | null;
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
    stock_measurement_unit_id: string;
    sale_quantity_step: DecimalString;
    stock_source_product_id?: string | null;
    stock_consumption_quantity?: DecimalString | null;
    uses_external_stock?: boolean;
    is_active?: boolean;
    is_sellable?: boolean;
    category_id: string;
    brand_id?: string | null;
    suppliers?: InitialProductSupplierDto[];
}

export interface InitialProductSupplierDto {
    supplier_id: string;
    supplier_code?: string | null;
    supplier_product_name?: string | null;
    is_preferred?: boolean;
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
    brand_id?: string;
    name?: string;
    sku?: string;
    is_active?: boolean;
    is_sellable?: boolean;
    stock_type?: 'own' | 'shared';
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
}

export interface ProductsSearchValues {
    name?: string;
    sku?: string;
    category_id?: string;
    brand_id?: string;
    is_active?: boolean;
    is_sellable?: boolean;
    stock_type?: 'own' | 'shared';
}
