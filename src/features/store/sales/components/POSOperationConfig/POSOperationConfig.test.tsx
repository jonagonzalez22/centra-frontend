import { fireEvent, render, screen } from '@testing-library/react';
import type { Dayjs } from 'dayjs';
import { vi } from 'vitest';
import { POSOperationConfig } from './POSOperationConfig';

const store = vi.hoisted(() => ({
    requestedDeliveryDate: '2026-09-18' as string | null,
    setRequestedDeliveryDate: vi.fn(),
}));

vi.mock('../../stores/usePOSStore', () => ({
    usePOSStore: (selector: (state: unknown) => unknown) =>
        selector({
            type: 'order',
            customer: null,
            requested_delivery_date: store.requestedDeliveryDate,
            setType: vi.fn(),
            setCustomer: vi.fn(),
            setRequestedDeliveryDate: store.setRequestedDeliveryDate,
        }),
}));

vi.mock('../../hooks/useCustomerSearch', () => ({
    useCustomerSearch: () => ({ query: '', setQuery: vi.fn(), results: [], loading: false }),
}));

interface DatePickerProps {
    value?: Dayjs | null;
    format?: string;
    onChange?: (date: Dayjs | null) => void;
}

vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    const dayjs = (await import('dayjs')).default;

    return {
        ...actual,
        DatePicker: ({ value, format, onChange }: DatePickerProps) => (
            <button
                aria-label="Fecha de entrega"
                onClick={() => onChange?.(dayjs('2026-09-20'))}
            >
                {value?.format(format)}
            </button>
        ),
    };
});

beforeEach(() => {
    store.requestedDeliveryDate = '2026-09-18';
    store.setRequestedDeliveryDate.mockClear();
});

test('shows the delivery date in local format and keeps the API value in ISO format', () => {
    render(<POSOperationConfig />);

    const datePicker = screen.getByRole('button', { name: 'Fecha de entrega' });
    expect(datePicker).toHaveTextContent('18/09/2026');

    fireEvent.click(datePicker);

    expect(store.setRequestedDeliveryDate).toHaveBeenCalledWith('2026-09-20');
});
