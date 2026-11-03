import { formatCompactCurrency, formatCurrency } from './formatters';

describe('formatCompactCurrency', () => {
    it('keeps amounts below one million in their complete form', () => {
        expect(formatCompactCurrency(950000)).toEqual({
            display: formatCurrency(950000),
            exact: formatCurrency(950000),
            compact: false,
        });
    });

    it('compacts millions without losing the exact value', () => {
        expect(formatCompactCurrency(1250000)).toEqual({
            display: '$ 1,25 M',
            exact: formatCurrency(1250000),
            compact: true,
        });
    });
});
