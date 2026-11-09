export interface ReportPeriod {
    date_from: string;
    date_to: string;
    timezone: string;
}

export interface PosSalesMetric {
    amount: number;
    count: number;
    average_ticket: number;
}

export interface RealizedSalesMetric {
    amount: number;
    channels: {
        pos: { amount: number; percentage: number };
        orders: { amount: number; percentage: number };
    };
}

export interface OrdersTakenMetric {
    amount: number;
    count: number;
}

export interface DeliveriesCompletedMetric {
    count: number;
}

export interface CollectedMetric {
    amount: number;
    channels: { pos_amount: number; orders_amount: number };
}

export interface InventoryAlerts {
    low_stock_count: number;
    out_of_stock_count: number;
}

export interface CurrentReportState {
    pending_balance: { amount: number };
    inventory_alerts: InventoryAlerts;
    attention: {
        partially_delivered_orders: number;
        delivered_with_balance: number;
        routes_pending_reconciliation: number;
    };
}

export interface ReportsSummary {
    period: ReportPeriod;
    metrics: {
        pos_sales: PosSalesMetric;
        realized_sales: RealizedSalesMetric;
        orders_taken: OrdersTakenMetric;
        deliveries_completed: DeliveriesCompletedMetric;
        collected: CollectedMetric;
    };
    current: CurrentReportState;
}

export interface ReportsSummaryParams {
    date_from: string;
    date_to: string;
}

export interface PaymentsSeriesPoint {
    date: string;
    collected_amount: number;
}

export interface OrdersSeriesPoint {
    date: string;
    orders_taken_count: number;
    deliveries_count: number;
}

export interface RealizedSalesSeriesPoint {
    date: string;
    pos_amount: number;
    orders_amount: number;
    total_amount: number;
}

export interface TopProductAnalytics {
    product_id: string;
    name: string;
    operations_count: number;
}

export interface PaymentMethodAnalytics {
    payment_method_id: string;
    name: string;
    amount: number;
    count: number;
}

export interface ReportsAnalytics {
    period: ReportPeriod;
    realized_sales_series: RealizedSalesSeriesPoint[];
    payments_series: PaymentsSeriesPoint[];
    orders_series: OrdersSeriesPoint[];
    payment_methods: PaymentMethodAnalytics[];
    top_products: TopProductAnalytics[];
}

export type ReportsAnalyticsParams = ReportsSummaryParams;
