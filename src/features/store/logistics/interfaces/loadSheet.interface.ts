export interface LoadSheetProductSummary {
    product_id: string;
    product_name: string;
    total_planned: number;
    total_loaded: number;
}

export interface LoadSheetStopItem {
    route_stop_item_id: string;
    product_id: string;
    product_name: string;
    quantity_planned: number;
    quantity_loaded: number;
}

export interface LoadSheetStop {
    stop_id: string;
    sequence: number;
    order_number: string | null;
    customer_name: string | null;
    items: LoadSheetStopItem[];
}

export interface LoadSheetData {
    route_id: string;
    status: string;
    operational_date: string;
    by_product: LoadSheetProductSummary[];
    by_stop: LoadSheetStop[];
    total_items: number;
}

export interface ConfirmLoadItem {
    route_stop_item_id: string;
    quantity_loaded: number;
    reason?: string;
    notes?: string;
}

export interface ConfirmLoadPayload {
    items: ConfirmLoadItem[];
}

export interface ConfirmLoadResponse {
    id: string;
    status: string;
}

export interface BulkLoadProduct {
    product_id: string;
    quantity_loaded: number;
    reason?: string;
    notes?: string;
}

export interface BulkLoadPayload {
    products: BulkLoadProduct[];
}

export interface AdjustItemEntry {
    route_stop_item_id: string;
    quantity_loaded: number;
    reason?: string;
    notes?: string;
}

export interface AdjustItemsPayload {
    product_id: string;
    items: AdjustItemEntry[];
}
