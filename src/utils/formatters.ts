/**
 * Convierte un string de fecha de la API a un objeto Date local.
 * Las fechas "YYYY-MM-DD" sin hora son interpretadas por JS como UTC midnight,
 * lo que produce un desfase de -1 día en zonas UTC-3 (Argentina).
 * Agregando T00:00:00 forzamos la interpretación en hora local.
 */
const toLocalDate = (dateStr: string): Date => {
    // Date-only: 2026-07-31 → interpretado como UTC → se corrige
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + 'T00:00:00');
    }
    // Datetime: 2026-07-23 10:30:00 → ya se interpreta como local
    return new Date(dateStr);
};

export const formatDate = (date: string | null): string => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(toLocalDate(date));
};

export const formatDateShort = (date: string | null): string => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(toLocalDate(date));
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatCurrencyWithCents = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const formatDateBrief = (dateString: string): string => {
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(toLocalDate(dateString));
};

export const formatMonthShort = (month: string): string => {
    return new Intl.DateTimeFormat('es-ES', {
        month: 'short',
        year: '2-digit',
    }).format(toLocalDate(month + '-01'));
};

export const formatDateLong = (date: string | null): string => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(toLocalDate(date));
};

export const formatTimeSlot = (from: string | null, to: string | null): string => {
    if (!from || !to) return 'Sin franja asignada';
    return `${from} - ${to}`;
};
