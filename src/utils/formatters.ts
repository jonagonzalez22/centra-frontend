export const formatDate = (date: string | null): string => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

export const formatDateShort = (date: string | null): string => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatDateBrief = (dateString: string): string => {
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(dateString));
};

export const formatMonthShort = (month: string): string => {
    return new Intl.DateTimeFormat('es-ES', {
        month: 'short',
        year: '2-digit',
    }).format(new Date(month + '-01'));
};