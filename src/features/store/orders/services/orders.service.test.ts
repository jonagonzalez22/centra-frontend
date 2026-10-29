import api from '@/api/api.config';
import { OrdersService } from './orders.service';

vi.mock('@/api/api.config');

const emptyResponse = {
    data: {
        status: 'success',
        message: '',
        errors: null,
        data: {
            items: [],
            total: 0,
            per_page: 20,
            current_page: 1,
            last_page: 1,
        },
    },
};

beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue(emptyResponse);
});

test('omits status and collection filters by default', async () => {
    await OrdersService.getAll({ page: 1, per_page: 20 });

    expect(api.get).toHaveBeenCalledWith('/v1/store/orders', {
        params: { per_page: 20, page: 1 },
    });
});

test.each(['open', 'delivered', 'partially_delivered'])(
    'sends an explicitly selected %s status',
    async (status) => {
        await OrdersService.getAll({ status });

        expect(api.get).toHaveBeenCalledWith('/v1/store/orders', {
            params: expect.objectContaining({ status, per_page: 20, page: 1 }),
        });
    }
);

test('omits status when all states are selected', async () => {
    await OrdersService.getAll({ status: '' });

    expect(api.get).toHaveBeenCalledWith('/v1/store/orders', {
        params: { per_page: 20, page: 1 },
    });
});

test('sends pending balance filter to backend', async () => {
    await OrdersService.getAll({ status: 'delivered', has_pending_balance: true });

    expect(api.get).toHaveBeenCalledWith('/v1/store/orders', {
        params: expect.objectContaining({ status: 'delivered', has_pending_balance: 1 }),
    });
});

test('adds items with the selected nullable price list', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'success', data: { id: 'order-1' } } });
    await OrdersService.addItem('order-1', {
        product_id: 'product-1', quantity: '2.0000', price_list_id: null,
    });
    expect(api.post).toHaveBeenCalledWith('/v1/store/orders/order-1/items', {
        product_id: 'product-1', quantity: '2.0000', price_list_id: null,
    });
});

test('mutates a persisted item by operation item id for quantity, price list and deletion', async () => {
    const response = { data: { status: 'success', data: { id: 'order-1' } } };
    vi.mocked(api.patch).mockResolvedValue(response);
    vi.mocked(api.delete).mockResolvedValue(response);

    await OrdersService.updateItemQuantity('order-1', 'operation-item-1', '4.0000');
    await OrdersService.changeItemPriceList('order-1', 'operation-item-1', 'list-1');
    await OrdersService.deleteItem('order-1', 'operation-item-1');

    expect(api.patch).toHaveBeenNthCalledWith(1, '/v1/store/orders/order-1/items/operation-item-1', { quantity: '4.0000' });
    expect(api.patch).toHaveBeenNthCalledWith(2, '/v1/store/orders/order-1/items/operation-item-1/price-list', { price_list_id: 'list-1' });
    expect(api.delete).toHaveBeenCalledWith('/v1/store/orders/order-1/items/operation-item-1');
});

test('posts a single payment to the order endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'success', data: { id: 'order-1' } } });
    await OrdersService.registerPayment('order-1', {
        store_payment_method_id: 'method-1',
        amount: 10000,
    });
    expect(api.post).toHaveBeenCalledWith('/v1/store/orders/order-1/payments', {
        store_payment_method_id: 'method-1',
        amount: 10000,
    });
});
