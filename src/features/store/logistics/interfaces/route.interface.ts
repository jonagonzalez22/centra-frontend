export type RouteStatus =
    | 'draft'
    | 'planned'
    | 'loaded'
    | 'dispatched'
    | 'awaiting_reconciliation'
    | 'completed'
    | 'cancelled';

export interface RouteVehicle {
    id: string;
    name: string;
    plate: string;
    type: string;
    capacity_kg: number;
    is_active: boolean;
    inactivation_reason: string | null;
    inactivation_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface RouteDriver {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
}

export interface RouteStopOrder {
    id: string;
    operation_number: string;
    requested_delivery_date: string;
    customer: null;
}

export interface RouteStop {
    id: string;
    route_id: string;
    sequence: number;
    status: string;
    logistics_notes: string | null;
    estimated_arrival_at: string | null;
    travel_duration_seconds: number | null;
    order: RouteStopOrder | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    gps_lat: string | null;
    gps_lon: string | null;
    signature_uri: string | null;
    evidence_uris: null;
}

export interface DeliveryRoute {
    id: string;
    store_id: string;
    operational_date: string;
    status: RouteStatus;
    observations: string | null;
    created_by: string;
    planned_at: string | null;
    departure_time: string;
    encoded_polyline: string | null;
    unload_time_minutes_snapshot: number | null;
    loaded_at: string | null;
    loaded_by: string | null;
    dispatched_at: string | null;
    dispatched_by: string | null;
    processed_at: string | null;
    processed_by: string | null;
    requires_recalculation: boolean;
    vehicle: RouteVehicle | null;
    driver: RouteDriver | null;
    stops: RouteStop[];
    created_at: string;
    updated_at: string;
}

export interface RoutesListResponse {
    items: DeliveryRoute[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface CreateRouteDto {
    operational_date: string;
    vehicle_id: string;
    driver_id: string;
    observations?: string;
}

export interface RoutesFilters {
    page?: number;
    per_page?: number;
    status?: RouteStatus;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
}
