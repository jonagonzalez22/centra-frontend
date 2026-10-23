import api from '@/api/api.config';

export interface SupplierProductProduct {
    id: string;
    name: string;
    sku: string;
    is_active: boolean;
    is_sellable: boolean;
    stock_source_product_id: string | null;
    stock_measurement_unit: {
        id: string;
        code: string;
        name: string;
        symbol: string;
        category: string;
    } | null;
}

export interface SupplierProduct {
    id: string;
    supplier_code: string | null;
    supplier_product_name: string | null;
    is_preferred: boolean;
    product: SupplierProductProduct;
    created_at: string;
    updated_at: string;
}

export interface SupplierProductsListResponse {
    items: SupplierProduct[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface SupplierProductPayload {
    product_id: string;
    supplier_code?: string | null;
    supplier_product_name?: string | null;
    is_preferred?: boolean;
}

export interface UpdateSupplierProductPayload {
    supplier_code?: string | null;
    supplier_product_name?: string | null;
    is_preferred?: boolean;
}

export interface SupplierProductCandidate {
    id: string;
    name: string;
    sku: string;
    is_active: boolean;
    is_sellable: boolean;
    is_associated: boolean;
    supplier_product: {
        id: string;
        supplier_code: string | null;
        supplier_product_name: string | null;
        is_preferred: boolean;
    } | null;
    stock_measurement_unit: SupplierProductProduct['stock_measurement_unit'];
    brand: { id: string; name: string } | null;
}

export interface SupplierProductCandidatesResponse {
    items: SupplierProductCandidate[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface SupplierProductsBulkResponse {
    created_count: number;
    preferred_updated_count: number;
    skipped_existing_count: number;
}

export const SupplierProductsService = {
    getAll: async (
        supplierId: string,
        params: { search?: string; page?: number; per_page?: number } = {}
    ) => {
        const { data } = await api.get(`/v1/store/suppliers/${supplierId}/products`, { params });
        return data.data as SupplierProductsListResponse;
    },
    getCandidates: async (
        supplierId: string,
        params: {
            search?: string;
            q?: string;
            source_supplier_id?: string;
            include_associated?: 0 | 1;
            page?: number;
            per_page?: number;
        } = {}
    ) => {
        const { data } = await api.get(`/v1/store/suppliers/${supplierId}/products/candidates`, {
            params,
        });
        return data.data as SupplierProductCandidatesResponse;
    },
    create: async (supplierId: string, payload: SupplierProductPayload) => {
        const { data } = await api.post(`/v1/store/suppliers/${supplierId}/products`, payload);
        return data.data as SupplierProduct;
    },
    update: async (
        supplierId: string,
        supplierProductId: string,
        payload: UpdateSupplierProductPayload
    ) => {
        const { data } = await api.put(
            `/v1/store/suppliers/${supplierId}/products/${supplierProductId}`,
            payload
        );
        return data.data as SupplierProduct;
    },
    delete: async (supplierId: string, supplierProductId: string) => {
        await api.delete(`/v1/store/suppliers/${supplierId}/products/${supplierProductId}`);
    },
    bulkCreate: async (supplierId: string, productIds: string[], markAsPreferred = false) => {
        const { data } = await api.post(`/v1/store/suppliers/${supplierId}/products/bulk`, {
            product_ids: productIds,
            mark_as_preferred: markAsPreferred,
        });
        return data.data as SupplierProductsBulkResponse;
    },
};
