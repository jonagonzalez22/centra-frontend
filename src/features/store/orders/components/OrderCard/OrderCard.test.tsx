import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import OrderCard from './OrderCard';
import { OrdersService } from '../../services/orders.service';
import { copyTextToClipboard } from '@/utils/clipboard';
import { formatDateShort } from '@/utils/formatters';
import type { OrderListItem } from '../../interfaces/order.interface';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
let canEdit = false;

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can: (permission: string) => permission === 'orders.edit' && canEdit }),
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
vi.mock('../../services/orders.service', () => ({
    OrdersService: { getShareMessage: vi.fn() },
}));
vi.mock('@/utils/clipboard', () => ({ copyTextToClipboard: vi.fn() }));

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
    pending_delivery_items_count: 1,
};

test('shows the requested delivery date without a time-slot placeholder', () => {
    render(<OrderCard order={order} onClick={vi.fn()} />);

    expect(screen.getByText(formatDateShort(order.requested_delivery_date))).toBeInTheDocument();
    expect(screen.queryByText('Franja horaria')).not.toBeInTheDocument();
    expect(screen.queryByText('Sin franja asignada')).not.toBeInTheDocument();
    expect(screen.getByText('Dina Capuzello')).toBeInTheDocument();
    expect(screen.getByText('1 ítem pendiente de entrega')).toBeInTheDocument();
});

test('shows total and pending balance with cents', () => {
    render(<OrderCard order={{ ...order, total: 869.25, pending_amount: 869.25 }} onClick={vi.fn()} />);

    expect(screen.getByText(/Total:.*869,25/)).toBeInTheDocument();
    expect(screen.getByText(/Saldo pendiente:.*869,25/)).toBeInTheDocument();
});

test('shows a delivery-address absence without falling back to the main address', () => {
    render(<OrderCard order={{ ...order, delivery_address: null }} onClick={vi.fn()} />);

    expect(screen.getByText('Sin domicilio de entrega')).toBeInTheDocument();
    expect(screen.queryByText('Sin localidad')).not.toBeInTheDocument();
});

test('distinguishes a delivery address without locality', () => {
    render(
        <OrderCard
            order={{ ...order, delivery_address: { locality: null, full_address: 'San Martín 123' } }}
            onClick={vi.fn()}
        />
    );

    expect(screen.getByText('Domicilio de entrega sin localidad')).toBeInTheDocument();
});

test('offers edit navigation only with orders.edit permission', async () => {
    canEdit = true;
    const user = userEvent.setup();
    render(<OrderCard order={order} onClick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Acciones/ }));
    await user.click(screen.getByText('Editar pedido'));

    expect(navigate).toHaveBeenCalledWith('/tienda/ventas/pedidos/order-1/editar');
    canEdit = false;
});

test('copies the official message without opening the card', async () => {
    const onClick = vi.fn();
    vi.mocked(OrdersService.getShareMessage).mockResolvedValue('detalle oficial');
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
    const user = userEvent.setup();

    render(<OrderCard order={order} onClick={onClick} />);
    const copyButton = screen.getByRole('button', { name: 'Copiar detalle del pedido' });
    await user.hover(copyButton);
    expect(await screen.findByText('Copiar detalle del pedido')).toBeInTheDocument();
    expect(copyButton).not.toHaveTextContent('Copiar');
    await user.click(copyButton);

    expect(OrdersService.getShareMessage).toHaveBeenCalledWith(order.id);
    expect(copyTextToClipboard).toHaveBeenCalledWith('detalle oficial');
    expect(await screen.findByText('Detalle copiado')).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
});

test('does not offer copy for a cancelled order', () => {
    render(<OrderCard order={{ ...order, status: 'cancelled' }} onClick={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Copiar detalle del pedido' })).not.toBeInTheDocument();
});

test('keeps the card closed and reports an API error when copy fails', async () => {
    const onClick = vi.fn();
    vi.mocked(OrdersService.getShareMessage).mockRejectedValue({ message: 'No se pudo generar.' });
    const user = userEvent.setup();

    render(<OrderCard order={order} onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Copiar detalle del pedido' }));

    expect(await screen.findByText('No se pudo generar.')).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
});

test('offers the exact message for manual copy when all automatic mechanisms fail', async () => {
    vi.mocked(OrdersService.getShareMessage).mockResolvedValue('*Pedido*\n¡Gracias!');
    vi.mocked(copyTextToClipboard).mockResolvedValue(false);
    const user = userEvent.setup();

    render(<OrderCard order={order} onClick={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Copiar detalle del pedido' }));

    expect(await screen.findByText('No pudimos copiar el mensaje automáticamente.')).toBeInTheDocument();
    expect(screen.getByLabelText('Detalle del pedido para copiar manualmente')).toHaveValue(
        '*Pedido*\n¡Gracias!'
    );
});
