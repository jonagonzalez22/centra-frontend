import { describe, expect, it } from 'vitest';
import {
    addDecimalStrings,
    compareDecimalStrings,
    formatQuantityForDisplay,
    formatQuantityWithUnit,
    floorToMultipleDecimalStrings,
    isMultipleOfDecimalStrings,
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

    it('handles commercial steps exactly', () => {
        expect(isMultipleOfDecimalStrings('4.0000', '1.0000')).toBe(true);
        expect(isMultipleOfDecimalStrings('1.2500', '0.2500')).toBe(true);
        expect(isMultipleOfDecimalStrings('1.3000', '0.2500')).toBe(false);
        expect(isMultipleOfDecimalStrings('0.3000', '0.1000')).toBe(true);
        expect(isMultipleOfDecimalStrings('0.0300', '0.0100')).toBe(true);
        expect(addDecimalStrings('0.2500', '0.2500')).toBe('0.5000');
        expect(floorToMultipleDecimalStrings('1.3900', '0.2500')).toBe('1.2500');
    });

    it('formats quantities without exposing trailing zeroes', () => {
        expect(formatQuantityForDisplay('10.0000')).toBe('10');
        expect(formatQuantityForDisplay('10.5000')).toBe('10,5');
        expect(formatQuantityForDisplay('10.2500')).toBe('10,25');
        expect(formatQuantityForDisplay('0.1250')).toBe('0,125');
        expect(formatQuantityWithUnit('48.8750', 'kg')).toBe('48,875 kg');
        expect(formatQuantityWithUnit('1.0000', 'u')).toBe('1 u');
    });
});
