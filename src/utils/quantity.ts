import type { DecimalString } from '@/types/decimal';

const SCALE = 4;
const FACTOR = 10n ** BigInt(SCALE);
const INPUT = /^-?\d+(?:\.\d{1,4})?$/;

function toScaled(value: DecimalString | number): bigint {
    const raw = typeof value === 'number' ? String(value) : value;
    if (!INPUT.test(raw)) {
        throw new Error('Cantidad decimal inválida.');
    }

    const negative = raw.startsWith('-');
    const unsigned = negative ? raw.slice(1) : raw;
    const [integer, fraction = ''] = unsigned.split('.');
    const scaled = BigInt(integer) * FACTOR + BigInt(fraction.padEnd(SCALE, '0'));

    return negative ? -scaled : scaled;
}

function fromScaled(value: bigint): DecimalString {
    const negative = value < 0n;
    const unsigned = negative ? -value : value;
    const integer = unsigned / FACTOR;
    const fraction = (unsigned % FACTOR).toString().padStart(SCALE, '0');

    return `${negative ? '-' : ''}${integer.toString()}.${fraction}`;
}

export function normalizeDecimalString(value: DecimalString | number): DecimalString {
    return fromScaled(toScaled(value));
}

export function compareDecimalStrings(left: DecimalString | number, right: DecimalString | number): number {
    const a = toScaled(left);
    const b = toScaled(right);
    return a === b ? 0 : a > b ? 1 : -1;
}

export function addDecimalStrings(left: DecimalString | number, right: DecimalString | number): DecimalString {
    return fromScaled(toScaled(left) + toScaled(right));
}

export function subtractDecimalStrings(left: DecimalString | number, right: DecimalString | number): DecimalString {
    return fromScaled(toScaled(left) - toScaled(right));
}

export function minDecimalStrings(left: DecimalString | number, right: DecimalString | number): DecimalString {
    return compareDecimalStrings(left, right) <= 0 ? normalizeDecimalString(left) : normalizeDecimalString(right);
}

export function maxDecimalStrings(left: DecimalString | number, right: DecimalString | number): DecimalString {
    return compareDecimalStrings(left, right) >= 0 ? normalizeDecimalString(left) : normalizeDecimalString(right);
}

export function isZeroDecimal(value: DecimalString | number): boolean {
    return compareDecimalStrings(value, '0.0000') === 0;
}

export function isPositiveDecimal(value: DecimalString | number): boolean {
    return compareDecimalStrings(value, '0.0000') > 0;
}

export function isNegativeDecimal(value: DecimalString | number): boolean {
    return compareDecimalStrings(value, '0.0000') < 0;
}

/** Human-oriented display; domain values stay fixed-scale DecimalString. */
export function formatQuantityForDisplay(value: DecimalString | number, locale = 'es-AR'): string {
    const normalized = normalizeDecimalString(value);
    const negative = normalized.startsWith('-');
    const unsigned = negative ? normalized.slice(1) : normalized;
    const [integer, fraction] = unsigned.split('.');
    const trimmedFraction = fraction.replace(/0+$/, '');
    const groupedInteger = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(BigInt(integer));

    if (!trimmedFraction) {
        return `${negative ? '-' : ''}${groupedInteger}`;
    }

    const separator = new Intl.NumberFormat(locale).formatToParts(1.1)
        .find((part) => part.type === 'decimal')?.value ?? ',';

    return `${negative ? '-' : ''}${groupedInteger}${separator}${trimmedFraction}`;
}
