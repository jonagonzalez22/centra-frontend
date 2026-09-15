import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { OrderEditPage } from './OrderEditPage';
import type {
    OrderDetail,
    OrderEditability,
} from '@/features/store/orders/interfaces/order.interface';

const { getById, getEditability } = vi.hoisted(() => ({
    getById: vi.fn(),
    getEditability: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'order-1' }),
}));

vi.mock('@/features/store/orders/services/orders.service', () => ({
    OrdersService: { getById, getEditability },
}));

vi.mock('@/features/store/orders/components/OrderStatusBadge', () => ({
    OrderStatusBadge: () => <span>Abierto</span>,
}));

const order = {
    id: 'order-1',
    operation_number: 'P-000123',
    type: 'order',
    status: 'open',
    requested_delivery_date: '2026-09-20',
    delivery_time_from: null,
    delivery_time_to: null,
    subtotal: 1000,
    tax: 0,
    discount: 0,
    total: 1000,
    paid_amount: 200,
    pending_amount: 800,
    completed_at: null,
    created_at: '2026-09-15 10:00:00',
    updated_at: '2026-09-15 10:00:00',
    branch_id: null,
    created_by: { id: 'user-1', name: 'Usuario' },
    customer: { id: 'customer-1', name: 'Cliente', phone: null },
    delivery_address: null,
    items: [
        {
            id: 'line-1',
            product_id: 'product-1',
            product_name: 'Producto A',
            quantity: 10,
            price: 100,
            subtotal: 1000,
            tax_amount: 0,
            discount_amount: 0,
        },
    ],
    payments: [],
    events: [],
    history: [],
    route_ids: [],
    delivery_summary: { has_pending_delivery: false, pending_delivery_quantity: 0, items: [] },
} satisfies OrderDetail;

const editability = {
    order_id: 'order-1',
    status: 'open',
    editable: true,
    block_reason: null,
    block_message: null,
    paid_amount: 200,
    delivery_date_editable: false,
    delivery_date_block_reason: 'active_route_commitment',
    delivery_date_block_message:
        'La fecha de entrega no puede modificarse porque el pedido tiene mercadería comprometida en una ruta activa.',
    items: [
        {
            product_id: 'product-1',
            product_name: 'Producto A',
            current_quantity: 10,
            delivered_quantity: 4,
            active_committed_quantity: 3,
            minimum_quantity: 7,
            editable_quantity: 3,
        },
    ],
} satisfies OrderEditability;

beforeEach(() => {
    getById.mockResolvedValue(order);
    getEditability.mockResolvedValue(editability);
});

test('loads the order and editability, then shows read-only restrictions', async () => {
    render(<OrderEditPage />);

    await screen.findByText('Editar pedido P-000123');

    expect(screen.getByRole('button', { name: /Volver a pedidos/ })).toBeInTheDocument();
    expect(getById).toHaveBeenCalledWith('order-1');
    expect(getEditability).toHaveBeenCalledWith('order-1');
    expect(screen.getByText('Producto A')).toBeInTheDocument();
    expect(screen.getByText('Entregadas: 4')).toBeInTheDocument();
    expect(screen.getByText('Comprometidas: 3')).toBeInTheDocument();
    expect(screen.getByText('Cantidad mínima: 7')).toBeInTheDocument();
    expect(screen.getByText(editability.delivery_date_block_message)).toBeInTheDocument();
});

test('shows global read-only feedback from editability', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        editable: false,
        block_reason: 'active_extra_sale',
        block_message: 'El pedido tiene una venta extra activa en una ruta operativa.',
    });

    render(<OrderEditPage />);

    await waitFor(() => {
        expect(screen.getByText('Este pedido no puede editarse.')).toBeInTheDocument();
    });
    expect(
        screen.getByText('El pedido tiene una venta extra activa en una ruta operativa.')
    ).toBeInTheDocument();
});
