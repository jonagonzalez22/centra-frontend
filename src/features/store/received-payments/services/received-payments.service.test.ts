import api from '@/api/api.config';
import { ReceivedPaymentsService } from './received-payments.service';

vi.mock('@/api/api.config');
const mockApi = vi.mocked(api) as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
};

test('requests the received payments endpoint with supported query parameters only', async () => {
    mockApi.get.mockResolvedValue({
        data: {
            status: 'success',
            message: '',
            data: { items: [], total: 0, per_page: 20, current_page: 1, last_page: 1 },
        },
    });
    await ReceivedPaymentsService.getAll({
        operation_number: 'P-000022',
        customer: 'Sandra',
        origin: 'manual_collection',
        status: 'active',
        page: 1,
        per_page: 20,
    });
    expect(mockApi.get).toHaveBeenCalledWith('/v1/store/received-payments', {
        params: {
            operation_number: 'P-000022',
            customer: 'Sandra',
            origin: 'manual_collection',
            status: 'active',
            page: 1,
            per_page: 20,
        },
    });
});

test('requests historical payment method filter options', async () => {
    mockApi.get.mockResolvedValue({
        data: { status: 'success', message: '', data: { payment_methods: [] } },
    });
    await ReceivedPaymentsService.getFilterOptions();
    expect(mockApi.get).toHaveBeenCalledWith('/v1/store/received-payments/filter-options');
});

test('reverses a received payment with only the supported payload', async () => {
    mockApi.post.mockResolvedValue({
        data: {
            status: 'success',
            message: 'Pago anulado exitosamente.',
            data: { id: 'payment-1', status: 'reversed' },
        },
    });

    await ReceivedPaymentsService.reversePayment('payment-1', {
        reason_code: 'duplicate_payment',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/v1/store/received-payments/payment-1/reverse', {
        reason_code: 'duplicate_payment',
    });
});
