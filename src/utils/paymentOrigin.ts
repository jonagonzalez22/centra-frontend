const PAYMENT_ORIGIN_LABELS: Record<string, string> = {
    pos_sale: 'Venta en caja',
    order_deposit: 'Seña de pedido',
    manual_collection: 'Pago posterior en tienda',
    route_collection: 'Cobranza de ruta',
};

export const getPaymentOriginLabel = (origin: string | null | undefined): string =>
    origin ? (PAYMENT_ORIGIN_LABELS[origin] ?? origin) : 'Origen no informado';
