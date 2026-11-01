import type {
    PaymentReversalBlockReason,
    PaymentReversalReasonCode,
} from '../interfaces/received-payment.interface';

export const paymentReversalReasons: Array<{
    value: PaymentReversalReasonCode;
    label: string;
}> = [
    { value: 'payment_error', label: 'Pago registrado por error' },
    { value: 'duplicate_payment', label: 'Pago duplicado' },
    { value: 'wrong_amount', label: 'Importe incorrecto' },
    { value: 'wrong_payment_method', label: 'Medio de pago incorrecto' },
    { value: 'other', label: 'Otro' },
];

export const paymentReversalReasonLabel = (reasonCode: string | null | undefined): string =>
    paymentReversalReasons.find((reason) => reason.value === reasonCode)?.label ?? '—';

const reversalBlockMessages: Record<PaymentReversalBlockReason, string> = {
    already_reversed: 'Este pago ya fue anulado.',
    pos_sale: 'Este pago pertenece a una venta. Cancelá la venta desde Historial de ventas.',
    route_collection: 'Este pago proviene de una cobranza de ruta conciliada y no puede anularse.',
    route_collection_linked:
        'Este pago proviene de una cobranza de ruta conciliada y no puede anularse.',
    cash_session_closed: 'No se puede anular porque la caja asociada ya no está abierta.',
    cash_session_not_operational: 'No se puede anular porque la caja asociada ya no está abierta.',
    operation_cancelled: 'No se puede anular porque la operación está cancelada.',
    operation_closed: 'No se puede anular porque la operación está cerrada.',
    origin_not_reversible: 'El origen de este pago no admite anulación individual.',
};

export const paymentReversalBlockMessage = (reason: PaymentReversalBlockReason | null): string =>
    (reason && reversalBlockMessages[reason]) || 'Este pago no se puede anular individualmente.';

export const paymentReversalDrawerMessage = (reason: PaymentReversalBlockReason | null): string => {
    if (reason === 'pos_sale') {
        return 'Este pago pertenece a una venta. Para revertir la operación, cancelá la venta desde Historial de ventas.';
    }

    if (reason === 'route_collection' || reason === 'route_collection_linked') {
        return 'Este pago proviene de una cobranza de ruta conciliada y no puede anularse.';
    }

    return paymentReversalBlockMessage(reason);
};
