import { describe, expect, it } from 'vitest';
import { calculatePOSPaymentAmounts } from './posPaymentAmounts';

describe('calculatePOSPaymentAmounts', () => {
  it('applies exact cash without change', () => {
    const result = calculatePOSPaymentAmounts([
      { id: 'cash', amount: 18500, isCash: true },
    ], 18500);

    expect(result).toMatchObject({ appliedTotal: 18500, cashReceived: 18500, change: 0, remaining: 0 });
    expect(result.payments).toEqual([
      expect.objectContaining({ id: 'cash', receivedAmount: 18500, appliedAmount: 18500 }),
    ]);
  });

  it('caps cash applied to the operation total and returns the excess as change', () => {
    const result = calculatePOSPaymentAmounts([
      { id: 'cash', amount: 20000, isCash: true },
    ], 18500);

    expect(result).toMatchObject({ appliedTotal: 18500, cashReceived: 20000, change: 1500, remaining: 0 });
    expect(result.payments[0]).toMatchObject({ appliedAmount: 18500 });
  });

  it('keeps an insufficient cash payment as a partial applied payment', () => {
    const result = calculatePOSPaymentAmounts([
      { id: 'cash', amount: 10000, isCash: true },
    ], 18500);

    expect(result).toMatchObject({ appliedTotal: 10000, change: 0, remaining: 8500 });
  });

  it('uses cash only for the balance left after non-cash payments', () => {
    const result = calculatePOSPaymentAmounts([
      { id: 'transfer', amount: 8000, isCash: false },
      { id: 'cash', amount: 15000, isCash: true },
    ], 20000);

    expect(result).toMatchObject({ appliedTotal: 20000, cashReceived: 15000, change: 3000, remaining: 0 });
    expect(result.payments).toEqual([
      expect.objectContaining({ id: 'transfer', appliedAmount: 8000 }),
      expect.objectContaining({ id: 'cash', appliedAmount: 12000 }),
    ]);
  });

  it('preserves cents while applying a discounted total', () => {
    const result = calculatePOSPaymentAmounts([
      { id: 'cash', amount: 900, isCash: true },
    ], 869.25);

    expect(result).toMatchObject({ appliedTotal: 869.25, cashReceived: 900, change: 30.75, remaining: 0 });
  });
});
