import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrdersService } from '@/features/store/orders/services/orders.service';
import { useOrdersStore } from '@/features/store/orders/stores/useOrdersStore';
import OrdersPage from './OrdersPage';

vi.mock('@/features/store/orders/services/orders.service', () => ({
    OrdersService: {
        getAll: vi.fn(),
    },
}));

vi.mock('./OrdersPageView', () => ({
    default: ({
        filters,
        onFilterChange,
    }: {
        filters: { status?: string; has_pending_balance?: boolean; page?: number };
        onFilterChange: (filters: Record<string, unknown>) => void;
    }) => (
        <div>
            <span>Estado: {filters.status ?? 'Todos'}</span>
            <span>Cobranza: {filters.has_pending_balance ? 'Con saldo pendiente' : 'Todos'}</span>
            <span>Página: {filters.page}</span>
            <button onClick={() => onFilterChange({ has_pending_balance: true })}>
                Filtrar deuda
            </button>
            <button onClick={() => onFilterChange({ status: 'delivered' })}>
                Filtrar entregados
            </button>
        </div>
    ),
}));

const emptyPage = {
    items: [],
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1,
};

beforeEach(() => {
    vi.mocked(OrdersService.getAll).mockResolvedValue(emptyPage);
    useOrdersStore.setState({
        filters: {
            status: 'delivered',
            has_pending_balance: true,
            page: 4,
            per_page: 20,
        },
        pagination: { current: 4, total: 50, perPage: 20 },
    });
});

test('remount starts visually and operationally without persisted filters', async () => {
    const user = userEvent.setup();
    const firstRender = render(<OrdersPage />);

    await waitFor(() => {
        expect(screen.getByText('Estado: Todos')).toBeInTheDocument();
        expect(screen.getByText('Cobranza: Todos')).toBeInTheDocument();
        expect(screen.getByText('Página: 1')).toBeInTheDocument();
    });
    expect(OrdersService.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({
            status: undefined,
            has_pending_balance: undefined,
            page: 1,
        })
    );

    await user.click(screen.getByRole('button', { name: 'Filtrar deuda' }));
    await waitFor(() =>
        expect(OrdersService.getAll).toHaveBeenLastCalledWith(
            expect.objectContaining({ has_pending_balance: true, page: 1 })
        )
    );
    firstRender.unmount();

    render(<OrdersPage />);

    await waitFor(() => {
        expect(screen.getByText('Estado: Todos')).toBeInTheDocument();
        expect(screen.getByText('Cobranza: Todos')).toBeInTheDocument();
    });
    expect(OrdersService.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({
            status: undefined,
            has_pending_balance: undefined,
            page: 1,
        })
    );
});

test('remount also removes an explicitly selected status', async () => {
    const user = userEvent.setup();
    const firstRender = render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText('Estado: Todos')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Filtrar entregados' }));
    await waitFor(() =>
        expect(OrdersService.getAll).toHaveBeenLastCalledWith(
            expect.objectContaining({ status: 'delivered', page: 1 })
        )
    );
    firstRender.unmount();

    render(<OrdersPage />);

    await waitFor(() => expect(screen.getByText('Estado: Todos')).toBeInTheDocument());
    expect(OrdersService.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: undefined, page: 1 })
    );
});
