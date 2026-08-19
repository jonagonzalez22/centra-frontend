// ── Driver Module Types ─────────────────────────────────────────────────────────

export type RouteStopStatus = 'pending' | 'arrived' | 'completed' | 'failed' | 'cancelled';

export interface DriverVehicle {
    id: string;
    name: string;
    plate: string;
}

export interface DriverUser {
    id: string;
    name: string;
}

export interface CustomerAddress {
    street: string;
    number: string;
    latitude: number | null;
    longitude: number | null;
    locality: string | null;
}

export interface Customer {
    name: string;
    document: string | null;
    phone: string | null;
}

export interface OrderSummary {
    id: string;
    operation_number: string;
    total_amount: number;
    paid_amount: number;
    pending_balance: number;
    requested_delivery_date: string;
    customer: Customer;
    address: CustomerAddress | null;
}

export interface RouteStopItem {
    id: string;
    product_id: string;
    product_name: string;
    sku: string;
    quantity_planned: number;
    quantity_loaded: number;
    quantity_delivered: number;
}

export interface RouteStop {
    id: string;
    route_id: string;
    sequence: number;
    status: RouteStopStatus;
    logistics_notes: string | null;
    estimated_arrival_at: string | null;
    travel_duration_seconds: number | null;
    notified_at: string | null;
    completed_at: string | null;
    gps_lat: string | null;
    gps_lon: string | null;
    signature_uri: string | null;
    evidence_uris: string[];
    notification_window_start: string | null;
    notification_window_end: string | null;
    notification_window_day: string | null;
    notification_window_start_raw_iso: string | null;
    notification_window_end_raw_iso: string | null;
    notification_window_raw_eta: string | null;
    order: OrderSummary | null;
    items: RouteStopItem[];
}

export interface DeliveryRoute {
    id: string;
    store_id: string;
    operational_date: string;
    status: string;
    departure_time: string | null;
    vehicle: DriverVehicle | null;
    driver: DriverUser | null;
    stops: RouteStop[];
}

export interface StorePaymentMethod {
    id: string;
    name: string;
    code: string;
    requires_reference: boolean;
}

export interface ActiveRouteResponse {
    status: 'success';
    message: string | null;
    data: {
        route: DeliveryRoute;
        available_payment_methods: StorePaymentMethod[];
    };
    errors: null;
}

export interface RouteDriverViewResponse {
    status: 'success';
    message: string | null;
    data: {
        route: DeliveryRoute;
        available_payment_methods: StorePaymentMethod[];
    };
    errors: null;
}

export interface OrderAmounts {
    total: number;
    paid_amount: number;
    pending_amount: number;
}

export interface RouteStopsCustomer {
    name: string | null;
    phone: string | null;
}

export interface RouteStopsAddress {
    street: string | null;
    locality: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
}

export interface RouteStopsItem {
    id: string;
    sequence: number;
    status: RouteStopStatus;
    customer: RouteStopsCustomer;
    address: RouteStopsAddress | null;
    notification_window_start: string | null;
    notification_window_end: string | null;
    order: OrderAmounts | null; // null = sin datos del pedido
}

export interface RouteStopsResponse {
    status: 'success';
    message: string | null;
    data: RouteStopsItem[];
    errors: null;
}

export interface StopDetailItem {
    id: string;
    route_stop_item_id: string;
    product_id: string;
    product_name: string;
    sku: string;
    quantity_planned: number;
    quantity_loaded: number;
    quantity_delivered: number;
    is_extra: boolean;
    notes: string | null;
}

export interface StopCollection {
    id: string;
    status: string;
    amount: number;
    method: string;
    declared_at: string | null;
}

export interface StopDetail {
    id: string;
    route_id: string;
    sequence: number;
    status: RouteStopStatus;
    address: string;
    contact_name: string | null;
    contact_phone: string | null;
    timezone: string | null;
    eta: string | null;
    notification_window_start: string | null;
    notification_window_end: string | null;
    notes: string | null;
    items: StopDetailItem[];
    collections: StopCollection[];
    order: OrderAmounts | null; // null = sin datos del pedido
}

export interface StopDetailResponse {
    status: 'success';
    message: string | null;
    data: StopDetail;
    errors: null;
}
