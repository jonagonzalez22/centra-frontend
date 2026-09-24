import type { CancelSaleDTO } from '../interfaces/sale.interface';

export const cancellationReasons: Array<{
    value: CancelSaleDTO['reason_code'];
    label: string;
}> = [
    { value: 'payment_failed', label: 'Pago fallido' },
    { value: 'pricing_error', label: 'Error de precio' },
    { value: 'duplicate_order', label: 'Venta duplicada' },
    { value: 'customer_cancelled', label: 'Solicitud del cliente' },
    { value: 'other', label: 'Otro' },
];

export const cancellationReasonLabel = (reasonCode: string | null | undefined): string =>
    cancellationReasons.find((reason) => reason.value === reasonCode)?.label ?? reasonCode ?? '—';
