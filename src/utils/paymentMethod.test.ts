import { describe, expect, test } from 'vitest';
import { getPaymentMethodDisplayName } from './paymentMethod';

describe('getPaymentMethodDisplayName', () => {
    test('prefers the configured visible name', () => {
        expect(getPaymentMethodDisplayName({ payment_method_name: 'QR / Billetera', payment_method_custom_name: 'Mercado pago' })).toBe('Mercado pago');
    });

    test('uses the base name when the visible name is null, undefined, or empty', () => {
        expect(getPaymentMethodDisplayName({ payment_method_name: 'Efectivo', payment_method_custom_name: null })).toBe('Efectivo');
        expect(getPaymentMethodDisplayName({ payment_method_name: 'Efectivo', visible_name: '   ' })).toBe('Efectivo');
    });
});
