export interface PriceList {
    id: string;
    name: string;
    discount_percentage: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PriceListsResponse {
    items: PriceList[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface PriceListsFilters {
    search?: string;
    is_active?: boolean;
    per_page?: number;
}

export interface PriceListPayload {
    name: string;
    discount_percentage: string;
    is_active: boolean;
}

export type PriceListExportSelectionMode = 'filtered' | 'selected';
export type PriceListExportPricingMode = 'general' | 'price_list';

export interface PriceListExportFilters {
    search?: string;
    category_id?: string;
    brand_id?: string;
    include_out_of_stock?: boolean;
}

export interface PriceListExportRequest {
    pricing_mode: PriceListExportPricingMode;
    price_list_id?: string;
    selection_mode: PriceListExportSelectionMode;
    product_ids?: string[];
    filters?: PriceListExportFilters;
}

export interface PriceListExportProduct {
    id: string;
    name: string;
    sku: string;
    category: { id: string; name: string } | null;
    brand: { id: string; name: string } | null;
    measurement_unit: { code: string; name: string; symbol: string };
    list_price: string;
    discount_percentage: string;
    discount_amount: string;
    final_price: string;
    commercial_available_quantity: string;
}

export interface PriceListExportData {
    store: {
        name: string | null;
        logo_url: string | null;
        phone: string | null;
        address: string | null;
    };
    pricing_mode: PriceListExportPricingMode;
    price_list: { id: string; name: string; discount_percentage: string } | null;
    generated_at: string;
    products: PriceListExportProduct[];
    summary: {
        product_count: number;
        excluded_product_count: number;
        include_out_of_stock: boolean;
    };
    excluded_product_ids: string[];
}

export const formatDiscountPercentage = (value: string): string => {
    const normalized = value.replace(',', '.');
    const [integer = '0', decimal = ''] = normalized.split('.');
    const trimmedDecimal = decimal.replace(/0+$/, '');

    return `${integer}${trimmedDecimal ? `,${trimmedDecimal}` : ''}%`;
};
