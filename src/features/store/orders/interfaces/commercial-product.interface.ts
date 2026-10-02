export interface CommercialProductSearchItem {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
}

export interface CommercialProductDetail extends CommercialProductSearchItem {
    price: number;
    available_stock: DecimalString;
    commercial_available_quantity: DecimalString;
    sale_quantity_step: DecimalString;
    stock_measurement_unit: {
        code: string;
        name: string;
        symbol: string;
    } | null;
}
import type { DecimalString } from '@/types/decimal';
