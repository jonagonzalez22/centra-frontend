import dayjs, { type Dayjs } from 'dayjs';

export type QuickPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'previous_month';
export type DateRange = [Dayjs, Dayjs];

export const rangeForQuickPeriod = (period: QuickPeriod): DateRange => {
    const now = dayjs();

    switch (period) {
        case 'today':
            return [now, now];
        case 'yesterday': {
            const yesterday = now.subtract(1, 'day');
            return [yesterday, yesterday];
        }
        case 'week':
            return [now.startOf('week'), now];
        case 'previous_month': {
            const previous = now.subtract(1, 'month');
            return [previous.startOf('month'), previous.endOf('month')];
        }
        case 'month':
            return [now.startOf('month'), now];
    }
};
