export type CollectionStatus = 'declared' | 'verified' | 'rejected';

export type DiscrepancyResolutionType =
    | 'returned'
    | 'rejected_by_customer'
    | 'missing'
    | 'damaged'
    | 'pending_redelivery'
    | 'other';

export interface RouteReconciliationCollection {
    id: string;
    stop_id: string;
    operation_number: string | null;
    customer_name: string | null;
    amount: number;
    payment_method: {
        id: string;
        name: string;
    } | null;
    status: CollectionStatus;
    rejection_reason: string | null;
    verified_at: string | null;
    verified_by: string | null;
    created_at: string;
}

export interface RouteReconciliationDiscrepancy {
    id: string;
    route_stop_id: string;
    product_id: string;
    product_name: string;
    sku: string | null;
    quantity_loaded: number;
    quantity_delivered: number;
    difference_quantity: number;
    resolution_type: DiscrepancyResolutionType | null;
    notes: string | null;
    processed_at: string | null;
}

export interface RouteReconciliationTotals {
    total_declared_amount: number;
    total_verified_amount: number;
    total_rejected_amount: number;
    pending_collections_count: number;
    pending_discrepancies_count: number;
}

export interface RouteReconciliationSummary {
    route_id: string;
    status: string;
    totals: RouteReconciliationTotals;
    collections: RouteReconciliationCollection[];
    discrepancies: RouteReconciliationDiscrepancy[];
}

export interface RejectCollectionPayload {
    rejection_reason: string;
}

export interface ResolveDiscrepancyItemPayload {
    discrepancy_id: string;
    resolution_type: DiscrepancyResolutionType;
    notes?: string;
}

export interface ResolveDiscrepanciesPayload {
    discrepancies: ResolveDiscrepancyItemPayload[];
}
