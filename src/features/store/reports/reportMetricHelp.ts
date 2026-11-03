export const reportMetricHelp = {
    pos_sales:
        'Total vendido en mostrador durante el período. No incluye pedidos ni ventas anuladas.',
    orders_taken:
        'Cantidad de pedidos registrados durante el período. Debajo se muestra el importe total de esos pedidos.',
    deliveries_completed:
        'Entregas de mercadería realizadas durante el período, sean parciales o completas.',
    collected: 'Importe total de pagos recibidos durante el período. No incluye pagos anulados.',
    average_sale: 'Importe promedio de cada venta de mostrador confirmada durante el período.',
    pending_balance:
        'Importe que actualmente queda pendiente de cobro. No depende del período seleccionado.',
    inventory_alerts: 'Productos con stock bajo o sin disponibilidad para la venta.',
    partially_delivered_orders:
        'Pedidos con parte de la mercadería entregada y una entrega todavía pendiente.',
    delivered_with_balance: 'Pedidos ya entregados que todavía tienen dinero pendiente de cobro.',
    routes_pending_reconciliation:
        'Rutas cuya rendición todavía requiere conciliación administrativa.',
} as const;

export type ReportMetricHelpKey = keyof typeof reportMetricHelp;
