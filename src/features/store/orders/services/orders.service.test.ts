import api from '@/api/api.config';
import { OrdersService } from './orders.service';

vi.mock('@/api/api.config');

test('sends pending balance filter to backend', async () => {
    vi.mocked(api.get).mockResolvedValue({
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
    });

    await OrdersService.getAll({ status: 'delivered', has_pending_balance: true });

    expect(api.get).toHaveBeenCalledWith('/v1/store/orders', {
        params: expect.objectContaining({ status: 'delivered', has_pending_balance: 1 }),
    });
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
