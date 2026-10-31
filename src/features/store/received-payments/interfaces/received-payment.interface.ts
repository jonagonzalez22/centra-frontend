export type ReceivedPaymentOrigin =
    | 'pos_sale'
    | 'order_deposit'
    | 'manual_collection'
    | 'route_collection'
    | 'unknown';

export type ReceivedPaymentStatus = 'active' | 'reversed';

export interface ReceivedPaymentUser {
    id: string;
    name: string;
}

export interface ReceivedPayment {
    id: string;
    amount: number;
    reference: string | null;
    status: ReceivedPaymentStatus;
    created_at: string | null;
    reversed_at: string | null;
    store_payment_method_id: string;
    payment_method: { id: string | null; name: string | null; code: string | null } | null;
    operation: { id: string; operation_number: string; type: string } | null;
    customer: { id: string | null; display_name: string | null };
    origin: ReceivedPaymentOrigin;
    registered_by: ReceivedPaymentUser | null;
    reversed_by: ReceivedPaymentUser | null;
    route: {
        id: string | null;
        route_stop_id: string;
        route_stop_collection_id: string;
        declared_by: ReceivedPaymentUser | null;
        declared_at: string | null;
        verified_by: ReceivedPaymentUser | null;
        verified_at: string | null;
        driver: ReceivedPaymentUser | null;
    } | null;
}

export interface ReceivedPaymentsFilters {
    date_from?: string;
    date_to?: string;
    operation_number?: string;
    customer?: string;
    store_payment_method_id?: string;
    origin?: ReceivedPaymentOrigin;
    status?: ReceivedPaymentStatus;
    collected_by?: string;
    per_page?: number;
    page?: number;
}

export interface ReceivedPaymentsResponse {
    items: ReceivedPayment[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface ReceivedPaymentMethodFilterOption {
    id: string;
    name: string | null;
    code: string | null;
    is_enabled: boolean;
}

export interface ReceivedPaymentFilterOptions {
    payment_methods: ReceivedPaymentMethodFilterOption[];
    collectors: ReceivedPaymentUser[];
}
