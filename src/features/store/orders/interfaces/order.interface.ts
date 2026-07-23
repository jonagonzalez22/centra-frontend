export interface OrderCustomer {
    id: string;
    name: string;
    phone: string | null;
    email?: string | null;
}

export interface OrderDeliveryAddress {
    locality: string;
    street?: string;
    full_address?: string;
    id?: string;
    number?: string;
    province?: string;
    notes?: string | null;
}

export interface OrderListItem {
    id: string;
    operation_number: string;
    type: 'order';
    status: 'open' | 'confirmed' | 'cancelled' | 'closed';
    requested_delivery_date: string | null;
    delivery_time_from: string | null;
    delivery_time_to: string | null;
    total: number;
    paid_amount: number;
    pending_amount: number;
    items_count: number;
    customer: OrderCustomer;
    delivery_address: Pick<OrderDeliveryAddress, 'locality' | 'street' | 'full_address'> | null;
    branch_id: string | null;
}

export interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
}

export interface OrderPayment {
    id: string;
    amount: number;
    reference: string | null;
    payment_details: unknown | null;
    store_payment_method: {
        id: string;
        name: string;
        code: string;
    };
}

export interface OrderEvent {
    id: string;
    event_type: string;
    previous_date: string | null;
    new_date: string | null;
    previous_status: string | null;
    new_status: string | null;
    reason: string | null;
    reason_code: string | null;
    reason_note: string | null;
    observation: string | null;
    old_values: { status: string | null; date: string | null } | null;
    new_values: { status: string | null; date: string | null } | null;
    user: { id: string; name: string };
    created_at: string;
}

export interface OrderDetail {
    id: string;
    operation_number: string;
    type: 'order';
    status: 'open' | 'confirmed' | 'cancelled' | 'closed';
    requested_delivery_date: string | null;
    delivery_time_from: string | null;
    delivery_time_to: string | null;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paid_amount: number;
    pending_amount: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    branch_id: string | null;
    created_by: { id: string; name: string };
    customer: OrderCustomer;
    delivery_address: OrderDeliveryAddress | null;
    items: OrderItem[];
    payments: OrderPayment[];
    events: OrderEvent[];
}

export interface OrderFilters {
    date?: string | null;
    date_from?: string;
    date_to?: string;
    operation_number?: string;
    customer_name?: string;
    locality?: string;
    status?: string;
    page?: number;
    per_page?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface OrdersState {
    orders: OrderListItem[];
    selectedOrder: OrderDetail | null;
    filters: OrderFilters;
    pagination: { current: number; total: number; perPage: number };
    loading: boolean;
    loadingDetail: boolean;
    drawerOpen: boolean;
    fetchOrders: () => Promise<void>;
    fetchOrderDetail: (id: string) => Promise<void>;
    setFilters: (filters: Partial<OrderFilters>) => void;
    resetFilters: () => void;
    openDrawer: (id: string) => Promise<void>;
    closeDrawer: () => void;
    rescheduleOrder: (id: string, payload: { new_date: string; reason: string; observation?: string }) => Promise<void>;
}
