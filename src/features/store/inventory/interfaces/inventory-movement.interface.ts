export type MovementType = 'input' | 'output' | 'adjustment';
import type { DecimalString } from '@/types/decimal';

export interface InventoryMovementProduct {
    id: string;
    name: string;
    sku: string;
}

export interface InventoryMovementUser {
    id: string;
    name: string;
}

export interface InventoryMovement {
    id: string;
    product_id: string;
    type: MovementType;
    quantity: DecimalString;
    previous_stock: DecimalString;
    current_stock: DecimalString;
    concept: string;
    user_id: string;
    created_at: string;
    product: InventoryMovementProduct;
    user: InventoryMovementUser;
}

export interface CreateStockMovementDto {
    product_id: string;
    type: MovementType;
    quantity: DecimalString;
    concept: string;
}

export interface InventoryMovementsFilters {
    page?: number;
    per_page?: number;
    product_id?: string;
    user_id?: string;
    type?: MovementType;
    date_from?: string;
    date_to?: string;
}

export interface InventoryMovementsResponse {
    items: InventoryMovement[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}
