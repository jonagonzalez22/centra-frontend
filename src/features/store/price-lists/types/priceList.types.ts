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

export const formatDiscountPercentage = (value: string): string => {
    const normalized = value.replace(',', '.');
    const [integer = '0', decimal = ''] = normalized.split('.');
    const trimmedDecimal = decimal.replace(/0+$/, '');

    return `${integer}${trimmedDecimal ? `,${trimmedDecimal}` : ''}%`;
};
