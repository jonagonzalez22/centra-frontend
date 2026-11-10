import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from './moneyInput';

describe('money input helpers', () => {
    it('formats integer and decimal values with two decimal places', () => {
        expect(formatMoneyInput('2000')).toBe('2.000,00');
        expect(formatMoneyInput('2000.50')).toBe('2.000,50');
    });

    it('parses currency presentation into a clean decimal string and drops arbitrary text', () => {
        expect(parseMoneyInput('$ 2.000,50')).toBe('2000.50');
        expect(parseMoneyInput('1.200')).toBe('1200');
        expect(parseMoneyInput('1.200.000')).toBe('1200000');
        expect(parseMoneyInput('1200,50')).toBe('1200.50');
        expect(parseMoneyInput('asdfasdf')).toBe('');
    });

    it('normalizes values for the API without floats', () => {
        expect(normalizeMoneyInput('2000')).toBe('2000.00');
        expect(normalizeMoneyInput('2000,50')).toBe('2000.50');
        expect(normalizeMoneyInput(parseMoneyInput('1200'))).toBe('1200.00');
        expect(normalizeMoneyInput(parseMoneyInput('1200,50'))).toBe('1200.50');
    });
});
