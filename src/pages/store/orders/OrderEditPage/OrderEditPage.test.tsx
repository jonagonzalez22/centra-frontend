import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Dayjs } from 'dayjs';
import { vi } from 'vitest';
import { OrderEditPage } from './OrderEditPage';
import type {
    OrderDetail,
    OrderEditability,
} from '@/features/store/orders/interfaces/order.interface';

const {
    navigate,
    getById,
    getEditability,
    update,
    registerPayment,
    getCurrentCashSession,
    setCashSession,
    can,
    cashSession,
    commercialSearch,
    commercialGetById,
} = vi.hoisted(() => ({
    navigate: vi.fn(),
    getById: vi.fn(),
    getEditability: vi.fn(),
    update: vi.fn(),
    registerPayment: vi.fn(),
    getCurrentCashSession: vi.fn(),
    setCashSession: vi.fn(),
    can: vi.fn(),
    cashSession: { value: { status: 'open' } as { status: string } | null },
    commercialSearch: vi.fn(),
    commercialGetById: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
    useParams: () => ({ id: 'order-1' }),
}));

vi.mock('@/features/store/orders/services/orders.service', () => ({
    OrdersService: { getById, getEditability, update, registerPayment },
}));

vi.mock('@/features/store/cash/services/cash.service', () => ({
    CashService: { getCurrent: getCurrentCashSession },
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can }),
}));

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: (selector: (state: { user: { cash_session: { status: string } | null }; setCashSession: typeof setCashSession }) => unknown) =>
        selector({ user: { cash_session: cashSession.value }, setCashSession }),
}));

vi.mock('@/features/store/orders/components/RegisterOrderPaymentModal', () => ({
    RegisterOrderPaymentModal: ({
        open,
        pendingAmount,
        onClose,
        onSubmit,
    }: {
        open: boolean;
        pendingAmount: number;
        onClose: () => void;
        onSubmit: (payload: { store_payment_method_id: string; amount: number }) => Promise<void>;
    }) =>
        open ? (
            <div role="dialog" aria-label="Registrar pago">
                <span>Saldo para cobrar: {pendingAmount}</span>
                <button
                    type="button"
                    onClick={() => void onSubmit({ store_payment_method_id: 'cash-1', amount: 100 })}
                >
                    Confirmar pago
                </button>
                <button type="button" onClick={onClose}>
                    Cancelar pago
                </button>
            </div>
        ) : null,
}));

vi.mock('@/features/store/orders/services/commercial-products.service', () => ({
    CommercialProductsService: { search: commercialSearch, getById: commercialGetById },
}));

vi.mock('@/features/store/orders/components/OrderStatusBadge', () => ({
    OrderStatusBadge: () => <span>Abierto</span>,
}));

interface DatePickerProps {
    value?: Dayjs | null;
    onChange?: (date: Dayjs | null) => void;
}

interface SelectProps {
    value?: string;
    onChange?: (value: string) => void;
    options?: { label: string; value: string }[];
    'aria-label'?: string;
}

vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    const dayjs = (await import('dayjs')).default;

    return {
        ...actual,
        DatePicker: ({ value, onChange }: DatePickerProps) => (
            <input
                aria-label="Fecha de entrega"
                value={value?.format('YYYY-MM-DD') ?? ''}
                onChange={(event) => onChange?.(event.target.value ? dayjs(event.target.value) : null)}
            />
        ),
        Select: ({ value, onChange, options, 'aria-label': ariaLabel }: SelectProps) => (
            <select
                aria-label={ariaLabel}
                value={value ?? ''}
                onChange={(event) => onChange?.(event.target.value)}
            >
                <option value="">Seleccionar motivo</option>
                {options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ),
    };
});

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
            quantity: "10.0000",
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
    delivery_summary: { has_pending_delivery: false, pending_delivery_quantity: "0.0000", items: [] },
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
            current_quantity: '10.0000',
            delivered_quantity: "4.0000",
            active_committed_quantity: '3.0000',
            minimum_quantity: '7.0000',
            editable_quantity: '3.0000',
        },
    ],
} satisfies OrderEditability;

beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    getById.mockResolvedValue(order);
    getEditability.mockResolvedValue(editability);
    update.mockResolvedValue(order);
    registerPayment.mockResolvedValue(order);
    getCurrentCashSession.mockResolvedValue({ id: 'cash-1', status: 'open' });
    can.mockImplementation((permission: string) => permission === 'orders.collect');
    cashSession.value = { status: 'open' };
    commercialSearch.mockResolvedValue([]);
    commercialGetById.mockResolvedValue({
        id: 'product-2',
        name: 'Producto B',
        sku: 'SKU-B',
        barcode: '7790000000006',
        price: 250,
        available_stock: "5.0000",
    });
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
    expect(screen.queryByRole('button', { name: 'Eliminar Producto A' })).not.toBeInTheDocument();
    expect(screen.getByText(editability.delivery_date_block_message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reprogramar fecha de entrega' })).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
});

test('shows the reprogram action and opens the delivery date modal when editability allows it', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    expect(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Fecha de entrega')).not.toBeInTheDocument();
    expect(screen.queryByText(editability.delivery_date_block_message)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));

    expect(screen.getByText('Reprogramar fecha de entrega')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de entrega')).toHaveValue('2026-09-20');
});

test('cancelling the modal does not modify the delivery date draft', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    const datePicker = screen.getByLabelText('Fecha de entrega');
    fireEvent.change(datePicker, { target: { value: '2026-09-22' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
});

test('shows validation only after applying a changed date without a reason', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-22' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));

    expect(screen.getByText('Seleccioná un motivo para reprogramar la fecha.')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
});

test('requires observation for other, applies locally, and preserves the pending draft on reopen', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: '2026-09-22' } });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), { target: { value: 'other' } });

    expect(screen.getByLabelText('Observación de reprogramación')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(screen.getByText('La observación es obligatoria cuando el motivo es otro.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Observación de reprogramación'), {
        target: { value: 'El cliente solicitó otra fecha.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));

    expect(update).not.toHaveBeenCalled();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    expect(screen.getByLabelText('Fecha de entrega')).toHaveValue('2026-09-22');
    expect(screen.getByLabelText('Motivo de reprogramación')).toHaveValue('other');
    expect(screen.getByLabelText('Observación de reprogramación')).toHaveValue(
        'El cliente solicitó otra fecha.'
    );
});

test('clears the pending date draft when it is restored to the persisted date', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: '2026-09-22' } });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));

    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
});

test('saves only the delivery date with its reason and resets the date draft from persisted data', async () => {
    const updatedOrder = { ...order, requested_delivery_date: '2026-09-22' };
    getById.mockResolvedValueOnce(order).mockResolvedValueOnce(updatedOrder);
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: '2026-09-22' } });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
        expect(update).toHaveBeenCalledWith('order-1', {
            requested_delivery_date: '2026-09-22',
            reason: 'customer_requested_reschedule',
        })
    );
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    await waitFor(() => expect(screen.getByLabelText('Fecha de entrega')).toHaveValue('2026-09-22'));
    expect(screen.getByLabelText('Motivo de reprogramación')).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));
    expect(navigate).toHaveBeenCalledWith('/tienda/ventas/pedidos');
});

test('saves item and delivery date changes in one request', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Producto A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: '2026-09-22' } });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'operational_issue' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
        expect(update).toHaveBeenCalledWith('order-1', {
            items: [{ product_id: 'product-1', quantity: "11.0000" }],
            requested_delivery_date: '2026-09-22',
            reason: 'operational_issue',
        })
    );
});

test('does not search short text and uses the commercial catalog for name search', async () => {
    commercialSearch.mockResolvedValueOnce([
        { id: 'product-2', name: 'Producto B', sku: 'SKU-B', barcode: '7790000000006' },
    ]);

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');
    vi.useFakeTimers();

    fireEvent.change(screen.getByLabelText('Buscar producto por nombre, SKU o código de barras'), {
        target: { value: 'P' },
    });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(350);
    });
    expect(commercialSearch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Buscar producto por nombre, SKU o código de barras'), {
        target: { value: 'Producto' },
    });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(350);
    });

    expect(commercialSearch).toHaveBeenCalledWith({ q: 'Producto' });
    expect(screen.getByRole('button', { name: 'Agregar Producto B' })).toBeInTheDocument();
});

test('adds a commercial product, keeps one row per product, and saves grouped final state', async () => {
    commercialSearch.mockResolvedValue([
        { id: 'product-2', name: 'Producto B', sku: 'SKU-B', barcode: '7790000000006' },
    ]);

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.change(screen.getByLabelText('Buscar producto por nombre, SKU o código de barras'), {
        target: { value: 'Producto B' },
    });

    const addButton = await screen.findByRole('button', { name: 'Agregar Producto B' });
    fireEvent.mouseDown(addButton);
    await waitFor(() => expect(commercialGetById).toHaveBeenCalledWith('product-2'));
    expect(await screen.findByText(/Precio actual:.*Stock disponible: 5/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Producto A' }));
    expect(screen.getByText('El total definitivo se recalculará al guardar.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
        expect(update).toHaveBeenCalledWith('order-1', {
            items: [
                { product_id: 'product-1', quantity: "11.0000" },
                { product_id: 'product-2', quantity: "1.0000" },
            ],
        })
    );
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));
});

test('selects the barcode result with Enter through the commercial detail flow', async () => {
    commercialSearch.mockResolvedValue([
        { id: 'product-2', name: 'Producto B', sku: 'SKU-B', barcode: '7790000000006' },
    ]);

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    const searchInput = screen.getByLabelText('Buscar producto por nombre, SKU o código de barras');
    fireEvent.change(searchInput, { target: { value: '7790000000006' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => expect(commercialSearch).toHaveBeenCalledWith({ barcode: '7790000000006' }));
    await waitFor(() => expect(commercialGetById).toHaveBeenCalledWith('product-2'));
    expect(await screen.findByText(/Precio actual:.*Stock disponible: 5/)).toBeInTheDocument();
});

test('preserves the draft and displays backend validation errors', async () => {
    update.mockRejectedValue({
        message: 'Error de validación.',
        errors: { items: ['No hay stock suficiente.'] },
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');
    fireEvent.click(screen.getByRole('button', { name: 'Reducir cantidad de Producto A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('No hay stock suficiente.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9')).toBeInTheDocument();
});

test('enforces minimum quantity locally and allows removing a product with minimum zero', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        items: [
            {
                ...editability.items[0],
                current_quantity: 1,
                minimum_quantity: 0,
                delivered_quantity: "0.0000",
                active_committed_quantity: 0,
            },
        ],
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Producto A' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar' }));

    expect(await screen.findByText('El pedido debe conservar al menos un producto.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
});

test('keeps an eliminable product when its quantity field is temporarily empty', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        items: [
            {
                ...editability.items[0],
                current_quantity: 1,
                minimum_quantity: 0,
                delivered_quantity: "0.0000",
                active_committed_quantity: 0,
            },
        ],
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    const quantityInput = screen.getByRole('spinbutton', { name: 'Cantidad de Producto A' });
    fireEvent.change(quantityInput, { target: { value: '' } });
    fireEvent.keyDown(quantityInput, { key: 'Enter' });
    fireEvent.blur(quantityInput);

    expect(screen.getByText('Producto A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar Producto A' })).toBeInTheDocument();
});

test('shows the payment action only to users who can collect and when there is a pending balance', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    expect(screen.getByRole('button', { name: 'Agregar pago' })).toBeEnabled();

    can.mockReturnValue(false);
    render(<OrderEditPage />);
    await screen.findAllByText('Editar pedido P-000123');
    expect(screen.getAllByRole('button', { name: 'Agregar pago' })).toHaveLength(1);
});

test('disables payment while product or delivery date changes are pending', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Producto A' }));
    expect(screen.getByRole('button', { name: 'Agregar pago' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Reducir cantidad de Producto A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: '2026-09-22' } });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));

    expect(screen.getByRole('button', { name: 'Agregar pago' })).toBeDisabled();
}, 10000);

test('opens the existing payment flow only with a clean persisted order', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Agregar pago' }));

    expect(screen.getByRole('dialog', { name: 'Registrar pago' })).toBeInTheDocument();
    expect(screen.getByText('Saldo para cobrar: 800')).toBeInTheDocument();
});

test('refreshes persisted economic data after a successful payment', async () => {
    const paidOrder = { ...order, paid_amount: 1000, pending_amount: 0 };
    getById.mockResolvedValueOnce(order).mockResolvedValueOnce(paidOrder);
    registerPayment.mockResolvedValue(paidOrder);

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Agregar pago' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));

    await waitFor(() =>
        expect(registerPayment).toHaveBeenCalledWith('order-1', {
            store_payment_method_id: 'cash-1',
            amount: 100,
        })
    );
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));
    expect(setCashSession).toHaveBeenCalled();
    expect(screen.getAllByText('$ 1.000')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Agregar pago' })).not.toBeInTheDocument();
});

test('does not offer payment when the order has no pending balance', async () => {
    getById.mockResolvedValue({ ...order, paid_amount: 1000, pending_amount: 0 });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    expect(screen.queryByRole('button', { name: 'Agregar pago' })).not.toBeInTheDocument();
});

test('keeps the payment modal closed when there is no open cash session', async () => {
    cashSession.value = null;
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Agregar pago' }));

    expect(screen.queryByRole('dialog', { name: 'Registrar pago' })).not.toBeInTheDocument();
});

test('navigates back directly when there are no pending changes', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

    expect(navigate).toHaveBeenCalledWith('/tienda/ventas/pedidos');
    expect(screen.queryByText('Hay cambios sin guardar')).not.toBeInTheDocument();
});

test('confirms product changes before leaving and preserves the draft when continuing to edit', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Producto A' }));
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

    expect(screen.getByText('Hay cambios sin guardar')).toBeInTheDocument();
    expect(screen.getByText('Si salís ahora, los cambios realizados en el pedido se perderán.')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));

    expect(screen.getByRole('spinbutton', { name: 'Cantidad de Producto A' })).toHaveValue('11');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
});

test('leaves without saving after confirming pending product changes', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Producto A' }));
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Salir sin guardar' }));

    expect(navigate).toHaveBeenCalledWith('/tienda/ventas/pedidos');
});

test('confirms pending delivery date changes before leaving', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: '2026-09-22' } });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

    expect(screen.getByText('Hay cambios sin guardar')).toBeInTheDocument();
});

test('does not confirm navigation when the product draft is restored to its original state', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Producto A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reducir cantidad de Producto A' }));
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

    expect(screen.queryByText('Hay cambios sin guardar')).not.toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/tienda/ventas/pedidos');
});

test('registers beforeunload only while the editor has pending changes', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    addEventListenerSpy.mockClear();
    removeEventListenerSpy.mockClear();
    expect(addEventListenerSpy.mock.calls.some(([eventName]) => eventName === 'beforeunload')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Producto A' }));
    await waitFor(() =>
        expect(addEventListenerSpy.mock.calls.some(([eventName]) => eventName === 'beforeunload')).toBe(true)
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reducir cantidad de Producto A' }));
    await waitFor(() =>
        expect(removeEventListenerSpy.mock.calls.some(([eventName]) => eventName === 'beforeunload')).toBe(true)
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
});
