import { OrdersService } from '../services/orders.service';
import { useOrdersStore } from './useOrdersStore';

vi.mock('../services/orders.service', () => ({
    OrdersService: {
        getAll: vi.fn(),
    },
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
});

test('starts without status or collection filters', async () => {
    useOrdersStore.setState({
        filters: {
            date: null,
            status: undefined,
            has_pending_balance: undefined,
            page: 1,
            per_page: 20,
        },
        pagination: { current: 1, total: 0, perPage: 20 },
    });

    await useOrdersStore.getState().fetchOrders();

    expect(OrdersService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
            status: undefined,
            has_pending_balance: undefined,
            page: 1,
            per_page: 20,
        })
    );
});

test('filter changes restart pagination at page one', () => {
    useOrdersStore.setState({
        filters: { status: undefined, page: 4, per_page: 20 },
        pagination: { current: 4, total: 100, perPage: 20 },
    });

    useOrdersStore.getState().setFilters({ status: 'delivered' });

    expect(useOrdersStore.getState().filters).toEqual(
        expect.objectContaining({ status: 'delivered', page: 1 })
    );
    expect(useOrdersStore.getState().pagination.current).toBe(1);
});

test('reset removes status and pending balance and returns to page one', () => {
    useOrdersStore.setState({
        filters: { status: 'delivered', has_pending_balance: true, page: 3, per_page: 20 },
        pagination: { current: 3, total: 50, perPage: 20 },
    });

    useOrdersStore.getState().resetFilters();

    expect(useOrdersStore.getState().filters).toEqual(
        expect.objectContaining({
            status: undefined,
            has_pending_balance: undefined,
            page: 1,
        })
    );
    expect(useOrdersStore.getState().pagination.current).toBe(1);
});

test('opening and closing the drawer preserves active filters', () => {
    useOrdersStore.setState({
        filters: { status: 'delivered', has_pending_balance: true, page: 1, per_page: 20 },
        drawerOpen: true,
        selectedOrder: null,
    });

    useOrdersStore.getState().closeDrawer();

    expect(useOrdersStore.getState().filters).toEqual(
        expect.objectContaining({ status: 'delivered', has_pending_balance: true })
    );
});
