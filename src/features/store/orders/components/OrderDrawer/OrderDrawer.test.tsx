import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderDrawer from './OrderDrawer';
import type { OrderDetail } from '../../interfaces/order.interface';

let canCollect = true;

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({
        can: (permission: string) => permission === 'orders.collect' && canCollect,
    }),
}));
vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: (selector: (state: unknown) => unknown) =>
        selector({
            user: { cash_session: { id: 'cash-1', status: 'open' } },
            setCashSession: vi.fn(),
        }),
}));

const order = {
    id: 'order-1',
    operation_number: 'P-000023',
    type: 'order',
    status: 'delivered',
    requested_delivery_date: '2026-09-08',
    delivery_time_from: null,
    delivery_time_to: null,
    subtotal: 15600,
    tax: 0,
    discount: 0,
    total: 15600,
    paid_amount: 0,
    pending_amount: 15600,
    completed_at: null,
    created_at: '2026-09-08 10:00:00',
    updated_at: '2026-09-08 10:00:00',
    branch_id: null,
    created_by: { id: 'user-1', name: 'Jonathan' },
    customer: { id: 'customer-1', name: 'Dina Capuzello', phone: null },
    delivery_address: null,
    items: [],
    payments: [],
    events: [],
    history: [],
    route_ids: [],
    delivery_summary: { has_pending_delivery: false, pending_delivery_quantity: 0, items: [] },
} satisfies OrderDetail;

beforeEach(() => {
    canCollect = true;
});

test('shows collect action in payments tab, not in the general footer', async () => {
    const user = userEvent.setup();
    render(<OrderDrawer open order={order} loading={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Registrar pago' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Ítems y pagos' }));

    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeInTheDocument();
    expect(screen.getByText('Total pagado')).toBeInTheDocument();
    expect(screen.getByText('Saldo pendiente')).toBeInTheDocument();
});

test('keeps the requested delivery date but does not show a delivery time slot', () => {
    render(<OrderDrawer open order={order} loading={false} onClose={vi.fn()} />);

    expect(screen.getByText('Fecha de entrega')).toBeInTheDocument();
    expect(screen.getByText('08/09/2026')).toBeInTheDocument();
    expect(screen.queryByText('Franja horaria')).not.toBeInTheDocument();
    expect(screen.queryByText('Sin franja asignada')).not.toBeInTheDocument();
});

test('hides collect action when there is no pending balance', async () => {
    const user = userEvent.setup();
    render(
        <OrderDrawer
            open
            order={{ ...order, pending_amount: 0 }}
            loading={false}
            onClose={vi.fn()}
        />
    );
    await user.click(screen.getByRole('tab', { name: 'Ítems y pagos' }));
    expect(screen.queryByRole('button', { name: 'Registrar pago' })).not.toBeInTheDocument();
});

test('hides collect action without orders.collect permission', async () => {
    const user = userEvent.setup();
    canCollect = false;
    render(<OrderDrawer open order={order} loading={false} onClose={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Ítems y pagos' }));

    expect(screen.queryByRole('button', { name: 'Registrar pago' })).not.toBeInTheDocument();
});
