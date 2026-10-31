import { getPaymentOriginLabel } from './paymentOrigin';

test.each([
    ['pos_sale', 'Venta por mostrador'],
    ['order_deposit', 'Seña de pedido'],
    ['manual_collection', 'Pago de pedido'],
    ['route_collection', 'Cobranza de ruta'],
    ['unknown', 'Sin identificar'],
])('maps %s payment origin', (origin, expected) => {
    expect(getPaymentOriginLabel(origin)).toBe(expected);
});
