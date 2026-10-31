const PAYMENT_ORIGIN_LABELS: Record<string, string> = {
    pos_sale: 'Venta por mostrador',
    order_deposit: 'Seña de pedido',
    manual_collection: 'Pago de pedido',
    route_collection: 'Cobranza de ruta',
    unknown: 'Sin identificar',
};

export const getPaymentOriginLabel = (origin: string | null | undefined): string =>
    origin ? (PAYMENT_ORIGIN_LABELS[origin] ?? origin) : 'Sin identificar';
