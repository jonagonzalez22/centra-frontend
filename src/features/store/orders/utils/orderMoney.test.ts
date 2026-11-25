import { describe, expect, it } from 'vitest';
import { getOrderItemTotal } from './orderMoney';

describe('getOrderItemTotal', () => {
    it('uses the persisted subtotal, tax, and discount components', () => {
        expect(getOrderItemTotal({ subtotal: 950, tax_amount: 0, discount_amount: 80.75 }))
            .toBe(869.25);
        expect(getOrderItemTotal({ subtotal: 100, tax_amount: 21, discount_amount: 10 }))
            .toBe(111);
    });
});
