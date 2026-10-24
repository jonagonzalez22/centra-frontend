export const normalizeMoneyInput = (value: string): string | null => {
    const normalized = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

    const [integer, fraction = ''] = normalized.split('.');
    return `${integer}.${fraction.padEnd(2, '0')}`;
};

const formatMoney = (value: string) => {
    const [integer, fraction = '00'] = value.split('.');
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `$ ${grouped},${fraction.padEnd(2, '0')}`;
};

export const formatMoneyInput = (value: string | number | undefined) => {
    if (value === undefined || value === '') return '';
    const rawValue = String(value);
    // Do not rewrite incomplete input such as "4," while the user is typing.
    if (!/^\d+(?:\.\d{1,2})?$/.test(rawValue)) return rawValue;
    const normalized = normalizeMoneyInput(rawValue);

    return normalized ? formatMoney(normalized).replace(/^\$\s/, '') : rawValue;
};

export const parseMoneyInput = (value: string | undefined) => {
    const rawValue = value?.replace(/[^\d,.-]/g, '') ?? '';

    return rawValue.includes(',') ? rawValue.replace(/\./g, '').replace(',', '.') : rawValue;
};
