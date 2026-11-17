import { OrdersService } from '../services/orders.service';
import { useOrdersStore } from './useOrdersStore';
import { activateSession, clearActiveSession } from '@/security/sessionContext';

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

test('reset removes private data and invalidates pending order requests', () => {
    useOrdersStore.setState({
        orders: [{ id: 'order-a' } as never],
        selectedOrder: { id: 'order-a' } as never,
        filters: { status: 'delivered', page: 3, per_page: 20 },
        pagination: { current: 3, total: 50, perPage: 20 },
        loading: true,
        loadingDetail: true,
        drawerOpen: true,
    });

    useOrdersStore.getState().resetOrders();

    expect(useOrdersStore.getState()).toMatchObject({
        orders: [],
        selectedOrder: null,
        filters: expect.objectContaining({ page: 1, status: undefined }),
        pagination: { current: 1, total: 0, perPage: 20 },
        loading: false,
        loadingDetail: false,
        drawerOpen: false,
    });
});

test('keeps results from the most recent filter request when responses arrive out of order', async () => {
    let resolveFirst: ((value: typeof emptyPage) => void) | undefined;
    let resolveSecond: ((value: typeof emptyPage) => void) | undefined;
    vi.mocked(OrdersService.getAll)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));

    useOrdersStore.setState({
        filters: { operation_number: 'P-1', page: 1, per_page: 20 },
        pagination: { current: 1, total: 0, perPage: 20 },
        orders: [],
    });
    const firstRequest = useOrdersStore.getState().fetchOrders();

    useOrdersStore.setState({ filters: { operation_number: 'P-2', page: 1, per_page: 20 } });
    const secondRequest = useOrdersStore.getState().fetchOrders();
    resolveSecond?.({ ...emptyPage, items: [{ id: 'latest' } as never] });
    await secondRequest;
    resolveFirst?.({ ...emptyPage, items: [{ id: 'stale' } as never] });
    await firstRequest;

    expect(useOrdersStore.getState().orders).toEqual([{ id: 'latest' }]);
});

test('does not write a delayed response from a previous authenticated session', async () => {
    let resolveRequest: ((value: typeof emptyPage) => void) | undefined;
    vi.mocked(OrdersService.getAll).mockImplementationOnce(
        () => new Promise((resolve) => { resolveRequest = resolve; })
    );
    useOrdersStore.setState({ orders: [], filters: { page: 1, per_page: 20 } });
    activateSession({ userId: 1, storeId: 10, token: 'token-a' });

    const request = useOrdersStore.getState().fetchOrders();
    activateSession({ userId: 2, storeId: 20, token: 'token-b' });
    useOrdersStore.getState().resetOrders();
    resolveRequest?.({ ...emptyPage, items: [{ id: 'order-from-a' } as never] });
    await request;

    expect(useOrdersStore.getState().orders).toEqual([]);
    clearActiveSession('logout');
});
