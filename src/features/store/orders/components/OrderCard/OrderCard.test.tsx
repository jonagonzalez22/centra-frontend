import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import OrderCard from './OrderCard';
import { formatDateShort } from '@/utils/formatters';
import type { OrderListItem } from '../../interfaces/order.interface';

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can: () => false }),
}));
vi.mock('../../stores/useOrdersStore', () => ({
    useOrdersStore: (selector: (state: unknown) => unknown) =>
        selector({ rescheduleOrder: vi.fn(), cancelOrder: vi.fn() }),
}));
vi.mock('../OrderStatusBadge', () => ({
    OrderStatusBadge: () => <span>Abierto</span>,
}));
vi.mock('../RescheduleModal', () => ({ RescheduleModal: () => null }));
vi.mock('../OrderCancellationModal', () => ({ OrderCancellationModal: () => null }));

const order: OrderListItem = {
    id: 'order-1',
    operation_number: 'P-000023',
    type: 'order',
    status: 'open',
    requested_delivery_date: '2026-09-17',
    delivery_time_from: null,
    delivery_time_to: null,
    total: 15600,
    paid_amount: 0,
    pending_amount: 15600,
    items_count: 1,
    customer: { id: 'customer-1', name: 'Dina Capuzello', phone: null },
    delivery_address: { locality: 'Mendoza', full_address: 'San Martín 123' },
    branch_id: null,
    route_ids: [],
    has_pending_delivery: true,
    pending_delivery_quantity: 1,
};

test('shows the requested delivery date without a time-slot placeholder', () => {
    render(<OrderCard order={order} onClick={vi.fn()} />);

    expect(screen.getByText(formatDateShort(order.requested_delivery_date))).toBeInTheDocument();
    expect(screen.queryByText('Franja horaria')).not.toBeInTheDocument();
    expect(screen.queryByText('Sin franja asignada')).not.toBeInTheDocument();
    expect(screen.getByText('Dina Capuzello')).toBeInTheDocument();
});
