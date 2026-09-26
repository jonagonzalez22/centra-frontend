import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { SalesHistoryPage } from './SalesHistoryPage';
import { SalesService } from '@/features/store/sales/services/sales.service';
import { printTicketReceipt } from '@/features/store/sales/documents/ticket-print.service';

let permissions = ['sales_history.view', 'sales_history.print'];

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can: (permission: string) => permissions.includes(permission) }),
}));
vi.mock('@/features/store/sales/services/sales.service', () => ({
    SalesService: {
        getHistory: vi.fn(),
        getSaleById: vi.fn(),
        getSalesReceipt: vi.fn(),
        cancelSale: vi.fn(),
    },
}));
vi.mock('@/features/store/sales/documents/ticket-print.service', () => ({
    printTicketReceipt: vi.fn(),
}));

const response = {
    items: [
        {
            id: 'sale-1',
            operation_number: 'V-000028',
            type: 'sale' as const,
            status: 'confirmed',
            total: 166130,
            customer_display_name: 'Sabrina Melizare',
            created_at: '2026-09-22 12:39:00',
            subtotal: 166130,
            tax: 0,
            discount: 0,
            created_by: { id: 'user-1', name: 'Juan Pérez' },
        },
    ],
    total: 1,
    per_page: 15,
    current_page: 1,
    last_page: 1,
};

beforeEach(() => {
    vi.clearAllMocks();
    permissions = ['sales_history.view', 'sales_history.print'];
    vi.mocked(SalesService.getHistory).mockResolvedValue(response);
    vi.mocked(printTicketReceipt).mockReset();
    vi.mocked(SalesService.cancelSale).mockReset();
});

test('lists sales and exposes print actions in the overflow menu with sales_history.print', async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );
    expect(await screen.findByText('V-000028')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Acciones de V-000028' }));
    expect(screen.queryByText('Ver detalle')).not.toBeInTheDocument();
    expect(screen.getByText('Imprimir ticket')).toBeInTheDocument();
    expect(screen.getByText('Imprimir A4')).toBeInTheDocument();
    await waitFor(() => expect(SalesService.getHistory).toHaveBeenCalled());
});

test('delegates ticket reprinting to the isolated ticket service', async () => {
    const user = userEvent.setup();
    const receipt = {
        store: {
            name: 'Ferretería San Miguel',
            cuit: null,
            address: null,
            city: null,
            state: null,
            timezone: 'America/Argentina/Buenos_Aires',
        },
        operation: {
            id: 'sale-1',
            operation_number: 'V-000028',
            type: 'sale' as const,
            status: 'confirmed' as const,
            occurred_at: '2026-09-22T12:39:00-03:00',
            cashier: null,
        },
        customer: null,
        items: [],
        totals: { subtotal: 0, tax: 0, discount: 0, total: 0, paid_amount: 0, pending_amount: 0 },
        payments: [],
    };
    vi.mocked(SalesService.getSalesReceipt).mockResolvedValue(receipt);
    vi.mocked(printTicketReceipt).mockResolvedValue(undefined);
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Acciones de V-000028' }));
    await user.click(screen.getByText('Imprimir ticket'));

    await waitFor(() => expect(printTicketReceipt).toHaveBeenCalledWith(receipt));
    expect(document.body).not.toHaveClass('receipt-print-mode-ticket');
});

test('renders sale dates in 24-hour format without a meridiem', async () => {
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    expect(await screen.findByText('22/09/2026 12:39')).toBeInTheDocument();
    expect(screen.queryByText(/a\. m\.|p\. m\./i)).not.toBeInTheDocument();
});

test('uses the same 24-hour format in the sale detail drawer', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.getSaleById).mockResolvedValue({
        ...response.items[0],
        items: [],
        payments: [],
        history: [],
    });
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Ver detalle de V-000028' }));

    expect(await screen.findByText('PRODUCTOS')).toBeInTheDocument();
    expect(screen.getAllByText('22/09/2026 12:39').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: 'Imprimir ticket' })).toHaveClass('ant-btn-default');
    expect(screen.getByRole('button', { name: 'Imprimir A4' })).toHaveClass('ant-btn-default');
});

test.each([
    ['3.0000', '3'],
    ['3.5000', '3,5'],
])('formats sale detail quantity %s as %s', async (quantity, displayedQuantity) => {
    const user = userEvent.setup();
    vi.mocked(SalesService.getSaleById).mockResolvedValue({
        ...response.items[0],
        items: [
            {
                id: 'item-1',
                product_name: 'Silicona Transparente 280ml',
                quantity,
                price: 7930,
                subtotal: 23790,
                tax_amount: 0,
                discount_amount: 0,
            },
        ],
        payments: [],
        history: [],
    });
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Ver detalle de V-000028' }));

    const productRow = (await screen.findByText('Silicona Transparente 280ml')).closest('tr');

    expect(productRow).toHaveTextContent(displayedQuantity);
    expect(productRow).not.toHaveTextContent(quantity);
});

test('shows the standard drawer loader while the detail request is pending and clears it on resolution', async () => {
    const user = userEvent.setup();
    let resolveDetail: (value: Awaited<ReturnType<typeof SalesService.getSaleById>>) => void;
    const detailRequest = new Promise<Awaited<ReturnType<typeof SalesService.getSaleById>>>(
        (resolve) => {
            resolveDetail = resolve;
        }
    );
    vi.mocked(SalesService.getSaleById).mockReturnValue(detailRequest);
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Ver detalle de V-000028' }));

    expect(screen.getByTestId('sale-detail-loading')).toHaveClass('py-16');
    expect(
        screen.getByTestId('sale-detail-loading').querySelector('.ant-spin-lg')
    ).toBeInTheDocument();
    expect(screen.queryByText('PRODUCTOS')).not.toBeInTheDocument();

    resolveDetail!({ ...response.items[0], items: [], payments: [], history: [] });

    expect(await screen.findByText('PRODUCTOS')).toBeInTheDocument();
    expect(screen.queryByTestId('sale-detail-loading')).not.toBeInTheDocument();
});

test('sorts by date server-side while preserving active filters and page size', async () => {
    const user = userEvent.setup();
    const { container } = render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await screen.findByText('V-000028');
    await user.type(screen.getByPlaceholderText('Nro. de venta'), 'V-000');
    const dateColumn = Array.from(container.querySelectorAll('th')).find(
        (column) => column.textContent === 'Fecha'
    );
    expect(dateColumn).toBeTruthy();
    await user.click(dateColumn!);

    await waitFor(() => {
        expect(SalesService.getHistory).toHaveBeenLastCalledWith(
            expect.objectContaining({
                operation_number: 'V-000',
                page: 1,
                per_page: 15,
                sort_by: 'created_at',
                sort_direction: 'asc',
            })
        );
    });
});

test('preserves the active server-side sort when changing page', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.getHistory).mockResolvedValue({ ...response, total: 30, last_page: 2 });
    const { container } = render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await screen.findByText('V-000028');
    const secondPage = container.querySelector('.ant-pagination-item-2');
    expect(secondPage).toBeTruthy();
    await user.click(secondPage!);

    await waitFor(() => {
        expect(SalesService.getHistory).toHaveBeenLastCalledWith(
            expect.objectContaining({
                page: 2,
                per_page: 15,
                sort_by: 'created_at',
                sort_direction: 'desc',
            })
        );
    });
});

test('keeps consultation available and hides print actions without sales_history.print', async () => {
    permissions = ['sales_history.view'];
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );
    expect(await screen.findByText('V-000028')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acciones de V-000028' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver detalle de V-000028' })).toBeInTheDocument();
});

test('sales.cancel enables only cancellation, not reprint actions', async () => {
    permissions = ['sales_history.view', 'sales.cancel'];
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    expect(await screen.findByText('V-000028')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Acciones de V-000028' }));
    expect(screen.getByText('Cancelar venta')).toBeInTheDocument();
    expect(screen.queryByText('Imprimir ticket')).not.toBeInTheDocument();
    expect(screen.queryByText('Imprimir A4')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver detalle de V-000028' })).toBeInTheDocument();
});

test('renders the compact filter bar and exposes an accessible clear action', async () => {
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );
    await screen.findByText('V-000028');
    expect(screen.getByPlaceholderText('Nro. de venta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Desde')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hasta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument();
});

test('renders cancelled sales with the Spanish status tag', async () => {
    vi.mocked(SalesService.getHistory).mockResolvedValue({
        ...response,
        items: [{ ...response.items[0], status: 'cancelled' }],
    });

    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    expect(await screen.findByText('Cancelada')).toBeInTheDocument();
});

test('shows sale cancellation only for confirmed sales when sales.cancel is granted', async () => {
    const user = userEvent.setup();
    permissions = ['sales_history.view', 'sales_history.print', 'sales.cancel'];
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Acciones de V-000028' }));
    expect(screen.getByText('Cancelar venta')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar venta'));
    expect(screen.getByText('Cancelar venta V-000028')).toBeInTheDocument();
    expect(screen.getByText(/Esta acción restaurará el stock/i)).toBeInTheDocument();
});

test('hides sale cancellation without sales.cancel', async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Acciones de V-000028' }));
    expect(screen.queryByText('Cancelar venta')).not.toBeInTheDocument();
});

test('hides sale cancellation for cancelled sales', async () => {
    const user = userEvent.setup();
    permissions = ['sales_history.view', 'sales_history.print', 'sales.cancel'];
    vi.mocked(SalesService.getHistory).mockResolvedValue({
        ...response,
        items: [{ ...response.items[0], status: 'cancelled' }],
    });
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );
    await user.click(await screen.findByRole('button', { name: 'Acciones de V-000028' }));
    expect(screen.queryByText('Cancelar venta')).not.toBeInTheDocument();
});

test('refreshes the list after the cancel modal succeeds', async () => {
    const user = userEvent.setup();
    permissions = ['sales_history.view', 'sales_history.print', 'sales.cancel'];
    vi.mocked(SalesService.cancelSale).mockResolvedValue({
        ...response.items[0],
        status: 'cancelled',
        items: [],
        payments: [],
        history: [],
    });
    render(
        <MemoryRouter>
            <SalesHistoryPage />
        </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: 'Acciones de V-000028' }));
    await user.click(screen.getByText('Cancelar venta'));
    const modal = screen.getByRole('dialog');
    await user.click(within(modal).getByRole('combobox'));
    await user.click(await screen.findByText('Error de precio'));
    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));

    await waitFor(() =>
        expect(SalesService.cancelSale).toHaveBeenCalledWith('sale-1', {
            reason_code: 'pricing_error',
        })
    );
    await waitFor(() => expect(SalesService.getHistory).toHaveBeenCalledTimes(2));
}, 15_000);
