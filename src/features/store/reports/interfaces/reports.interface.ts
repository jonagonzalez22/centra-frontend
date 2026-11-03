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

export interface OrdersTakenMetric {
    amount: number;
    count: number;
}

export interface DeliveriesCompletedMetric {
    count: number;
}

export interface CollectedMetric {
    amount: number;
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
