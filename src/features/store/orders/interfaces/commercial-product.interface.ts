import type { DecimalString } from '@/types/decimal';

export interface CommercialProductSearchItem {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    commercial_available_quantity: DecimalString;
    sale_quantity_step: DecimalString;
    stock_measurement_unit: {
        code: string;
        name: string;
        symbol: string;
    } | null;
}

export interface CommercialProductDetail extends CommercialProductSearchItem {
    price: number;
    available_stock: DecimalString;
}
