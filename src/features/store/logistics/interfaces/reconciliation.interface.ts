export type CollectionStatus = 'declared' | 'verified' | 'rejected';

export type DiscrepancyResolutionType =
    | 'returned'
    | 'rejected_by_customer'
    | 'missing'
    | 'damaged'
    | 'pending_redelivery'
    | 'other';

export interface RouteReconciliationOrder {
    id: string;
    operation_number: string;
    customer_name: string;
    total_amount: number;
    paid_amount: number;
    pending_balance: number;
}

export interface DeliveryDiscrepancy {
    id: string;
    resolution_type: DiscrepancyResolutionType;
    notes: string | null;
    resolved_at: string | null;
}

export interface RouteReconciliationStopItem {
    route_stop_item_id: string;
    product_id: string;
    product_name: string;
    quantity_loaded: number;
    quantity_delivered: number;
    difference: number;
    extra_sale_allocated: number;
    discrepancy: DeliveryDiscrepancy | null;
}

export interface RouteReconciliationCollection {
    id: string;
    status: CollectionStatus;
    amount: number;
    reference: string | null;
    notes: string | null;
    payment_method: string;
    declared_by: string;
    declared_at: string;
    verified_at: string | null;
}

export interface RouteReconciliationStop {
    stop_id: string;
    sequence: number;
    status: string;
    order: RouteReconciliationOrder;
    items: RouteReconciliationStopItem[];
    collections: RouteReconciliationCollection[];
}

export interface RouteReconciliationTotals {
    declared_amount: number;
    verified_amount: number;
    rejected_amount: number;
}

export interface RouteReconciliationSummary {
    route_id: string;
    status: string;
    operational_date: string;
    vehicle: string;
    driver: string;
    stops: RouteReconciliationStop[];
    totals: RouteReconciliationTotals;
    can_close: boolean;
}

export interface RejectCollectionPayload {
    rejection_reason: string;
}

export interface ResolveDiscrepancyPayload {
    route_stop_item_id: string;
    resolution_type: DiscrepancyResolutionType;
    quantity_to_resolve: number;
    notes?: string;
}
