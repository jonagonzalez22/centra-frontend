import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    addItem,
    updateItemQuantity,
    deleteItem,
    changeItemPriceList,
    getActivePriceLists,
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
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    deleteItem: vi.fn(),
    changeItemPriceList: vi.fn(),
    getActivePriceLists: vi.fn(),
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
    OrdersService: {
        getById,
        getEditability,
        update,
        addItem,
        updateItemQuantity,
        deleteItem,
        changeItemPriceList,
        registerPayment,
    },
}));

vi.mock('@/features/store/price-lists/services/priceLists.service', () => ({
    PriceListsService: { getActive: getActivePriceLists },
}));

vi.mock('@/features/store/cash/services/cash.service', () => ({
    CashService: { getCurrent: getCurrentCashSession },
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can }),
}));

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: (
        selector: (state: {
            user: { cash_session: { status: string } | null };
            setCashSession: typeof setCashSession;
        }) => unknown
    ) => selector({ user: { cash_session: cashSession.value }, setCashSession }),
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
                    onClick={() =>
                        void onSubmit({ store_payment_method_id: 'cash-1', amount: 100 })
                    }
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
    options?: { label: string; value: string; disabled?: boolean }[];
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
                onChange={(event) =>
                    onChange?.(event.target.value ? dayjs(event.target.value) : null)
                }
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
                    <option key={option.value} value={option.value} disabled={option.disabled}>
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
            quantity: '10.0000',
            price: 100,
            subtotal: 1000,
            tax_amount: 0,
            discount_amount: 0,
            price_list_id: null,
            price_list_name: null,
            discount_percentage: 0,
            stock_measurement_unit: { code: 'unit', symbol: 'u' },
            sale_quantity_step: '1.0000',
        },
    ],
    payments: [],
    events: [],
    history: [],
    route_ids: [],
    delivery_summary: {
        has_pending_delivery: false,
        pending_delivery_quantity: '0.0000',
        items: [],
    },
} satisfies OrderDetail;

afterEach(() => cleanup());

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
            delivered_quantity: '4.0000',
            active_committed_quantity: '3.0000',
            minimum_quantity: '7.0000',
            editable_quantity: '3.0000',
            sale_quantity_step: '1.0000',
            commercial_available_quantity: '5.0000',
            maximum_editable_quantity: '15.0000',
            stock_measurement_unit: { code: 'unit', name: 'Unidad', symbol: 'u' },
        },
    ],
} satisfies OrderEditability;

beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    getById.mockReset();
    getById.mockResolvedValue(order);
    getEditability.mockResolvedValue(editability);
    update.mockResolvedValue(order);
    addItem.mockResolvedValue(order);
    updateItemQuantity.mockResolvedValue(order);
    deleteItem.mockResolvedValue(order);
    changeItemPriceList.mockResolvedValue(order);
    getActivePriceLists.mockResolvedValue([
        { id: 'list-wholesale', name: 'Mayorista', discount_percentage: '10.00', is_active: true },
        {
            id: 'list-zero',
            name: 'Convenio Empresa X',
            discount_percentage: '0.00',
            is_active: true,
        },
    ]);
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
        available_stock: '5.0000',
        commercial_available_quantity: '5.0000',
        sale_quantity_step: '1.0000',
        stock_measurement_unit: { code: 'unit', name: 'Unidad', symbol: 'u' },
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
    expect(screen.queryByText('Descuentos')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar Producto A' })).not.toBeInTheDocument();
    expect(screen.getByText(editability.delivery_date_block_message)).toBeInTheDocument();
    expect(
        screen.queryByRole('button', { name: 'Reprogramar fecha de entrega' })
    ).not.toBeInTheDocument();
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

    expect(
        screen.getByRole('button', { name: 'Reprogramar fecha de entrega' })
    ).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-22' },
    });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'other' },
    });

    expect(screen.getByLabelText('Observación de reprogramación')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(
        screen.getByText('La observación es obligatoria cuando el motivo es otro.')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Observación de reprogramación'), {
        target: { value: 'El cliente solicitó otra fecha.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));

    expect(update).not.toHaveBeenCalled();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

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
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-22' },
    });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));

    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
}, 10000);

test('keeps a delivery date change pending without a global save action', async () => {
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
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    expect(screen.getByLabelText('Fecha de entrega')).toHaveValue('2026-09-22');
    expect(screen.getByLabelText('Motivo de reprogramación')).toHaveValue(
        'customer_requested_reschedule'
    );
});

test('persists item changes immediately without a global save action', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Producto A · Común' })
    );
    await screen.findByText('Cantidad actualizada.');
    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-22' },
    });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'operational_issue' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));

    await waitFor(() =>
        expect(updateItemQuantity).toHaveBeenCalledWith('order-1', 'line-1', '11.0000')
    );
    expect(update).not.toHaveBeenCalled();
});

test('quantity steppers update the persisted line through operation_item_id', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Producto A · Común' })
    );
    await waitFor(() =>
        expect(updateItemQuantity).toHaveBeenCalledWith('order-1', 'line-1', '11.0000')
    );
    expect(update).not.toHaveBeenCalled();
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

test('adds a commercial product through the explicit endpoint with the selected list', async () => {
    commercialSearch.mockResolvedValue([
        { id: 'product-2', name: 'Producto B', sku: 'SKU-B', barcode: '7790000000006' },
    ]);

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.change(screen.getByLabelText('Buscar producto por nombre, SKU o código de barras'), {
        target: { value: 'Producto B' },
    });

    await waitFor(() => expect(commercialSearch).toHaveBeenCalledWith({ q: 'Producto B' }));
    const addButton = await screen.findByRole('button', { name: /Agregar Producto B/ });
    fireEvent.mouseDown(addButton);
    await waitFor(() => expect(commercialGetById).toHaveBeenCalledWith('product-2'));
    await waitFor(() =>
        expect(addItem).toHaveBeenCalledWith('order-1', {
            product_id: 'product-2',
            quantity: '1.0000',
            price_list_id: null,
        })
    );

    expect(update).not.toHaveBeenCalled();
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

    await waitFor(() =>
        expect(commercialSearch).toHaveBeenCalledWith({ barcode: '7790000000006' })
    );
    await waitFor(() => expect(commercialGetById).toHaveBeenCalledWith('product-2'));
    await waitFor(() =>
        expect(addItem).toHaveBeenCalledWith('order-1', {
            product_id: 'product-2',
            quantity: '1.0000',
            price_list_id: null,
        })
    );
});

test('displays backend validation errors from item quantity mutation', async () => {
    updateItemQuantity.mockRejectedValue({
        message: 'Error de validación.',
        errors: { items: ['No hay stock suficiente.'] },
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');
    fireEvent.click(screen.getByRole('button', { name: 'Reducir cantidad de Producto A · Común' }));

    expect(await screen.findByText('No hay stock suficiente.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
});

test('enforces minimum quantity locally and allows removing a product with minimum zero', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        items: [
            {
                ...editability.items[0],
                current_quantity: 1,
                minimum_quantity: 0,
                delivered_quantity: '0.0000',
                active_committed_quantity: 0,
            },
        ],
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Producto A · Común' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar' }));

    await waitFor(() => expect(deleteItem).toHaveBeenCalledWith('order-1', 'line-1'));
});

test('keeps an eliminable product when its quantity field is temporarily empty', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        items: [
            {
                ...editability.items[0],
                current_quantity: 1,
                minimum_quantity: 0,
                delivered_quantity: '0.0000',
                active_committed_quantity: 0,
            },
        ],
    });
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    const quantityInput = screen.getByRole('spinbutton', {
        name: 'Cantidad de Producto A · Común',
    });
    fireEvent.change(quantityInput, { target: { value: '' } });
    fireEvent.keyDown(quantityInput, { key: 'Enter' });
    fireEvent.blur(quantityInput);

    expect(screen.getByText('Producto A')).toBeInTheDocument();
    await waitFor(() =>
        expect(
            screen.getByRole('spinbutton', { name: 'Cantidad de Producto A · Común' })
        ).toHaveValue('10')
    );
    expect(screen.getByRole('button', { name: 'Eliminar Producto A · Común' })).toBeInTheDocument();
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

test('disables payment while an item request or delivery date change is pending', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    updateItemQuantity.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Producto A · Común' })
    );
    expect(screen.getByRole('button', { name: 'Agregar pago' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-22' },
    });
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
    expect(screen.getAllByText('$ 1.000')).toHaveLength(3);
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

test('item edits persist immediately and do not leave a local draft on navigation', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Producto A · Común' })
    );
    await waitFor(() =>
        expect(updateItemQuantity).toHaveBeenCalledWith('order-1', 'line-1', '11.0000')
    );
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

    expect(navigate).toHaveBeenCalledWith('/tienda/ventas/pedidos');
    expect(screen.queryByText('Hay cambios sin guardar')).not.toBeInTheDocument();
});

test('does not ask to confirm navigation after an item mutation is persisted', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Producto A · Común' })
    );
    await waitFor(() => expect(updateItemQuantity).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

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
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-22' },
    });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

    expect(screen.getByText('Hay cambios sin guardar')).toBeInTheDocument();
}, 10000);

test('does not use a product draft to decide whether navigation is blocked', async () => {
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Producto A · Común' })
    );
    await waitFor(() => expect(updateItemQuantity).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Volver a pedidos/ }));

    expect(screen.queryByText('Hay cambios sin guardar')).not.toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/tienda/ventas/pedidos');
});

test('registers beforeunload only while the editor has pending changes', async () => {
    getEditability.mockResolvedValue({
        ...editability,
        delivery_date_editable: true,
        delivery_date_block_reason: null,
        delivery_date_block_message: null,
    });
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    addEventListenerSpy.mockClear();
    removeEventListenerSpy.mockClear();
    expect(addEventListenerSpy.mock.calls.some(([eventName]) => eventName === 'beforeunload')).toBe(
        false
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-22' },
    });
    fireEvent.change(screen.getByLabelText('Motivo de reprogramación'), {
        target: { value: 'customer_requested_reschedule' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    await waitFor(() =>
        expect(
            addEventListenerSpy.mock.calls.some(([eventName]) => eventName === 'beforeunload')
        ).toBe(true)
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar fecha de entrega' }));
    fireEvent.change(screen.getByLabelText('Fecha de entrega'), {
        target: { value: '2026-09-20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    await waitFor(() =>
        expect(
            removeEventListenerSpy.mock.calls.some(([eventName]) => eventName === 'beforeunload')
        ).toBe(true)
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
}, 10000);

test('selector starts at Común, changes only the next product, and submits its price_list_id', async () => {
    commercialSearch.mockResolvedValue([
        { id: 'product-2', name: 'Producto B', sku: 'SKU-B', barcode: '7790000000006' },
    ]);
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    const nextList = screen.getByRole('combobox', { name: 'Lista para agregar' });
    const existingLineList = screen.getByRole('combobox', {
        name: 'Lista de precios de Producto A · Común',
    });
    expect(nextList).toHaveValue('__common__');
    expect(existingLineList).toHaveValue('__common__');
    expect(screen.getByText('Lista para agregar')).toBeInTheDocument();
    expect(screen.queryByText('Para próximos productos')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Descuento:/)).not.toBeInTheDocument();

    fireEvent.change(nextList, { target: { value: 'list-wholesale' } });
    expect(existingLineList).toHaveValue('__common__');
    expect(screen.getAllByRole('option', { name: 'Común' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('option', { name: 'Mayorista · 10%' }).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Buscar producto por nombre, SKU o código de barras'), {
        target: { value: 'Producto B' },
    });
    await waitFor(() => expect(commercialSearch).toHaveBeenCalledWith({ q: 'Producto B' }));
    fireEvent.mouseDown(await screen.findByRole('button', { name: /Agregar Producto B/ }));
    await waitFor(() =>
        expect(addItem).toHaveBeenCalledWith('order-1', {
            product_id: 'product-2',
            quantity: '1.0000',
            price_list_id: 'list-wholesale',
        })
    );
});

test('same product lines use operation_item_id for quantity, price-list changes and deletion', async () => {
    const twoLines = {
        ...order,
        items: [
            order.items[0],
            {
                ...order.items[0],
                id: 'line-2',
                quantity: '2.0000',
                price_list_id: 'list-wholesale',
                price_list_name: 'Mayorista',
                discount_percentage: 10,
                discount_amount: 20,
                subtotal: 200,
            },
        ],
    } satisfies OrderDetail;
    getById.mockResolvedValue(twoLines);
    updateItemQuantity.mockResolvedValue(twoLines);
    changeItemPriceList.mockResolvedValue(twoLines);
    getEditability.mockResolvedValue({
        ...editability,
        items: [
            {
                ...editability.items[0],
                current_quantity: '12.0000',
                minimum_quantity: '0.0000',
                maximum_editable_quantity: '15.0000',
            },
        ],
    });
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    expect(
        screen.getByRole('combobox', { name: 'Lista de precios de Producto A · Común' })
    ).toHaveValue('__common__');
    expect(
        screen.getByRole('combobox', { name: 'Lista de precios de Producto A · Mayorista · 10%' })
    ).toHaveValue('list-wholesale');
    expect(screen.getAllByRole('option', { name: 'Mayorista · 10%' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Descuento: -/)).toHaveClass('text-emerald-700');

    fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Producto A · Común' })
    );
    await waitFor(() =>
        expect(updateItemQuantity).toHaveBeenCalledWith('order-1', 'line-1', '11.0000')
    );
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));

    fireEvent.change(
        screen.getByRole('combobox', { name: 'Lista de precios de Producto A · Mayorista · 10%' }),
        {
            target: { value: '__common__' },
        }
    );
    await waitFor(() =>
        expect(changeItemPriceList).toHaveBeenCalledWith('order-1', 'line-2', null)
    );
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(3));
    expect(
        screen.getByRole('button', { name: 'Eliminar Producto A · Mayorista · 10%' })
    ).toBeInTheDocument();
}, 15000);

test('deletes only the selected persisted line when the product exists under two lists', async () => {
    const twoLines = {
        ...order,
        items: [
            order.items[0],
            {
                ...order.items[0],
                id: 'line-2',
                quantity: '2.0000',
                price_list_id: 'list-wholesale',
                price_list_name: 'Mayorista',
                discount_percentage: 10,
            },
        ],
    } satisfies OrderDetail;
    getById.mockResolvedValue(twoLines);
    deleteItem.mockResolvedValue({ ...order, items: [twoLines.items[1]] });
    getEditability.mockResolvedValue({
        ...editability,
        items: [
            {
                ...editability.items[0],
                current_quantity: '12.0000',
                minimum_quantity: '0.0000',
                maximum_editable_quantity: '15.0000',
            },
        ],
    });
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Producto A · Común' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar' }));
    await waitFor(() => expect(deleteItem).toHaveBeenCalledWith('order-1', 'line-1'));
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));
}, 15000);

test('renders an inactive list snapshot without offering it as an active selection', async () => {
    getById.mockResolvedValue({
        ...order,
        items: [
            {
                ...order.items[0],
                price_list_id: 'list-inactive',
                price_list_name: 'Mayorista anterior',
                discount_percentage: 10,
                discount_amount: 100,
            },
        ],
    });
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    expect(screen.queryByText('Mayorista anterior · 10%')).not.toBeInTheDocument();
    const inactiveOption = screen.getByRole('option', {
        name: 'Mayorista anterior · 10% · Inactiva',
    });
    expect(inactiveOption).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Lista para agregar' })).not.toHaveDisplayValue(
        'Mayorista anterior · 10% · Inactiva'
    );
});

test('keeps a real 0% PriceList distinct from virtual Común', async () => {
    getById.mockResolvedValue({
        ...order,
        items: [
            order.items[0],
            {
                ...order.items[0],
                id: 'line-zero',
                price_list_id: 'list-zero',
                price_list_name: 'Convenio Empresa X',
                discount_percentage: 0,
            },
        ],
    });
    getEditability.mockResolvedValue({
        ...editability,
        items: [
            {
                ...editability.items[0],
                current_quantity: '20.0000',
                minimum_quantity: '0.0000',
                maximum_editable_quantity: '25.0000',
            },
        ],
    });
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    expect(
        screen.getByRole('combobox', { name: 'Lista de precios de Producto A · Común' })
    ).toHaveValue('__common__');
    expect(
        screen.getByRole('combobox', {
            name: 'Lista de precios de Producto A · Convenio Empresa X · 0%',
        })
    ).toHaveValue('list-zero');
    expect(
        screen.getAllByRole('option', { name: 'Convenio Empresa X · 0%' }).length
    ).toBeGreaterThan(0);
});

test('shows backend rejection for a stale or inactive list and leaves its snapshot unchanged', async () => {
    getById.mockResolvedValue({
        ...order,
        items: [
            {
                ...order.items[0],
                price_list_id: 'list-inactive',
                price_list_name: 'Mayorista anterior',
                discount_percentage: 10,
            },
        ],
    });
    changeItemPriceList.mockRejectedValue({
        response: { data: { message: 'La lista de precios está inactiva.' } },
    });
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.change(
        screen.getByRole('combobox', {
            name: 'Lista de precios de Producto A · Mayorista anterior · 10%',
        }),
        {
            target: { value: '__common__' },
        }
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
        'La lista de precios está inactiva.'
    );
    expect(screen.queryByText('Mayorista anterior · 10%')).not.toBeInTheDocument();
});

test('refreshes authoritative rows after a price-list mutation merges two lines', async () => {
    const twoLines = {
        ...order,
        items: [
            order.items[0],
            {
                ...order.items[0],
                id: 'line-2',
                quantity: '2.0000',
                price_list_id: 'list-wholesale',
                price_list_name: 'Mayorista',
                discount_percentage: 10,
            },
        ],
    } satisfies OrderDetail;
    const mergedOrder = {
        ...order,
        items: [
            {
                ...order.items[0],
                id: 'line-2',
                quantity: '12.0000',
                price_list_id: 'list-wholesale',
                price_list_name: 'Mayorista',
                discount_percentage: 10,
            },
        ],
    } satisfies OrderDetail;
    getById.mockImplementation(() =>
        Promise.resolve(changeItemPriceList.mock.calls.length > 0 ? mergedOrder : twoLines)
    );
    changeItemPriceList.mockResolvedValue(mergedOrder);
    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    fireEvent.change(
        screen.getByRole('combobox', { name: 'Lista de precios de Producto A · Común' }),
        {
            target: { value: 'list-wholesale' },
        }
    );
    await waitFor(() =>
        expect(changeItemPriceList).toHaveBeenCalledWith('order-1', 'line-1', 'list-wholesale')
    );
    await screen.findByText('Lista de precios actualizada.');
    await waitFor(() =>
        expect(
            screen.getAllByRole('combobox', { name: /Lista de precios de Producto A/ })
        ).toHaveLength(1)
    );
    expect(getById).toHaveBeenCalledTimes(2);
    await waitFor(() =>
        expect(
            screen.getByRole('spinbutton', { name: 'Cantidad de Producto A · Mayorista · 10%' })
        ).toHaveValue('12')
    );
});

test('shows the line price with its snapshot unit without changing the authoritative subtotal', async () => {
    getById.mockResolvedValue({
        ...order,
        items: [
            {
                ...order.items[0],
                product_name: 'Unidad',
                price: 600,
                subtotal: 510,
                discount_amount: 90,
                stock_measurement_unit: { code: 'unit', symbol: 'u' },
            },
            {
                ...order.items[0],
                id: 'line-liter',
                product_id: 'product-liter',
                product_name: 'Detergente suelto',
                quantity: '0.5000',
                price: 2000,
                subtotal: 1000,
                stock_measurement_unit: { code: 'liter', symbol: 'L' },
            },
            {
                ...order.items[0],
                id: 'line-kilogram',
                product_id: 'product-kilogram',
                product_name: 'Harina',
                price: 3000,
                subtotal: 3000,
                stock_measurement_unit: { code: 'kilogram', symbol: 'kg' },
            },
            {
                ...order.items[0],
                id: 'line-meter',
                product_id: 'product-meter',
                product_name: 'Cable',
                price: 1500,
                subtotal: 1500,
                stock_measurement_unit: { code: 'meter', symbol: 'm' },
            },
        ],
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    const lineTexts = screen
        .getAllByText(/^Precio:/)
        .map((element) => element.textContent?.replace(/\s/g, ''));
    expect(lineTexts).toEqual(
        expect.arrayContaining([
            'Precio:$600/u',
            'Precio:$2.000/L',
            'Precio:$3.000/kg',
            'Precio:$1.500/m',
        ])
    );
    expect(
        screen
            .getByText('Detergente suelto')
            .parentElement?.parentElement?.textContent?.replace(/\s/g, '')
    ).toContain('Subtotal:$1.000');
    expect(screen.getByText(/Descuento: -/)).toHaveClass('text-emerald-700');
});

test('shows the authoritative economic summary and no global save button', async () => {
    getById.mockResolvedValue({
        ...order,
        subtotal: 45350,
        discount: 1300,
        total: 44050,
        paid_amount: 0,
        pending_amount: 44050,
    });

    render(<OrderEditPage />);
    await screen.findByText('Editar pedido P-000123');

    expect(screen.getByText('Subtotal').parentElement?.textContent?.replace(/\s/g, '')).toBe(
        'Subtotal$45.350'
    );
    expect(screen.getByText('Descuentos').parentElement?.textContent?.replace(/\s/g, '')).toBe(
        'Descuentos-$1.300'
    );
    expect(screen.getByText('Total').parentElement?.textContent?.replace(/\s/g, '')).toBe(
        'Total$44.050'
    );
    expect(screen.getByText('Pagado').parentElement?.textContent?.replace(/\s/g, '')).toBe(
        'Pagado$0'
    );
    expect(screen.getByText('Saldo pendiente').parentElement?.textContent?.replace(/\s/g, '')).toBe(
        'Saldopendiente$44.050'
    );
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
});
