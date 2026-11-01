import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import type { ReceivedPayment } from '../interfaces/received-payment.interface';
import { ReceivedPaymentsList } from './ReceivedPaymentsList';

let canReverse = true;

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({
        can: (permission: string) => permission === 'payments.reverse' && canReverse,
    }),
}));

const payment = (overrides: Partial<ReceivedPayment> = {}): ReceivedPayment => ({
    id: 'payment-1',
    amount: 10000,
    reference: 'REF-1',
    status: 'active',
    created_at: '2026-10-31 14:35:00',
    reversed_at: null,
    store_payment_method_id: 'method-1',
    payment_method: { id: 'method-1', name: 'Efectivo', code: 'cash' },
    operation: { id: 'order-1', operation_number: 'P-000022', type: 'order' },
    customer: { id: 'customer-1', display_name: 'Sandra López' },
    origin: 'manual_collection',
    reversal: { allowed: true, reason: null },
    registered_by: { id: 'user-1', name: 'Ana' },
    reversed_by: null,
    route: null,
    ...overrides,
});

const renderList = (item = payment()) => {
    const onOpen = vi.fn();
    const onReverse = vi.fn();
    render(
        <ReceivedPaymentsList
            payments={[item]}
            loading={false}
            page={1}
            total={1}
            perPage={20}
            hasFilters={false}
            onPageChange={vi.fn()}
            onOpen={onOpen}
            onReverse={onReverse}
        />
    );

    return { onOpen, onReverse };
};

beforeEach(() => {
    canReverse = true;
});

test('shows detail and enabled reversal actions for an eligible payment', async () => {
    const user = userEvent.setup();
    const { onOpen, onReverse } = renderList();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));
    await user.click(screen.getByRole('button', { name: 'Anular pago' }));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'payment-1' }));
    expect(onReverse).toHaveBeenCalledWith(expect.objectContaining({ id: 'payment-1' }));
    expect(document.querySelector('.anticon-undo')).toBeInTheDocument();
});

test.each([
    [
        'pos_sale',
        'pos_sale',
        'Este pago pertenece a una venta. Cancelá la venta desde Historial de ventas.',
    ],
    [
        'route_collection',
        'route_collection',
        'Este pago proviene de una cobranza de ruta conciliada y no puede anularse.',
    ],
    ['manual_collection', 'already_reversed', 'Este pago ya fue anulado.'],
] as const)(
    'shows a disabled reversal with its explanation for %s',
    async (origin, reason, tooltip) => {
        const user = userEvent.setup();
        const item = payment({
            origin,
            status: reason === 'already_reversed' ? 'reversed' : 'active',
            reversal: { allowed: false, reason },
        });
        renderList(item);

        const rollback = screen.getByRole('button', { name: 'Anular pago' });
        expect(rollback).toBeDisabled();
        await user.hover(rollback.parentElement!);
        expect(await screen.findByText(tooltip)).toBeInTheDocument();
    }
);

test('hides reversal without permission while retaining the detail action', () => {
    canReverse = false;
    renderList();

    expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Anular pago' })).not.toBeInTheDocument();
});

test('does not open detail from a desktop row click outside the actions', async () => {
    const user = userEvent.setup();
    const { onOpen } = renderList();

    await user.click(document.querySelector('.received-payments-table .ant-table-row td')!);

    expect(onOpen).not.toHaveBeenCalled();
});

test('keeps mobile cards free of inline action buttons', () => {
    renderList();

    const cards = document.querySelector('.md\\:hidden');
    expect(
        within(cards as HTMLElement).queryByRole('button', { name: 'Anular pago' })
    ).not.toBeInTheDocument();
    expect(
        within(cards as HTMLElement).queryByRole('button', { name: 'Ver detalle' })
    ).not.toBeInTheDocument();
});
