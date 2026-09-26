export interface CommercialProductSearchItem {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
}

export interface CommercialProductDetail extends CommercialProductSearchItem {
    price: number;
    available_stock: DecimalString;
}
import type { DecimalString } from '@/types/decimal';
