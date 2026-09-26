import { describe, expect, it } from 'vitest';
import {
    addDecimalStrings,
    compareDecimalStrings,
    formatQuantityForDisplay,
    isPositiveDecimal,
    isZeroDecimal,
    normalizeDecimalString,
    subtractDecimalStrings,
} from './quantity';

describe('quantity helpers', () => {
    it('normalizes and compares fixed-scale decimal strings exactly', () => {
        expect(normalizeDecimalString('1.25')).toBe('1.2500');
        expect(compareDecimalStrings('1.2500', '1.2499')).toBe(1);
        expect(compareDecimalStrings('0.0001', '0.0001')).toBe(0);
    });

    it('adds and subtracts without Number arithmetic', () => {
        expect(addDecimalStrings('2.0000', '1.2500')).toBe('3.2500');
        expect(subtractDecimalStrings('5.0000', '0.1250')).toBe('4.8750');
        expect(isZeroDecimal('0.0000')).toBe(true);
        expect(isPositiveDecimal('0.0001')).toBe(true);
    });

    it('formats quantities without exposing trailing zeroes', () => {
        expect(formatQuantityForDisplay('10.0000')).toBe('10');
        expect(formatQuantityForDisplay('10.5000')).toBe('10,5');
        expect(formatQuantityForDisplay('10.2500')).toBe('10,25');
        expect(formatQuantityForDisplay('0.1250')).toBe('0,125');
    });
});
