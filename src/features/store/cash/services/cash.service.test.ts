import api from '@/api/api.config';
import { CashService } from './cash.service';

vi.mock('@/api/api.config');
const mockedApi = vi.mocked(api) as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
};

const success = <T>(data: T) => ({
    data: { status: 'success' as const, message: 'ok', data, errors: null },
});

test('uses the cash workflow endpoints and payloads', async () => {
    mockedApi.get.mockResolvedValueOnce(
        success({ current: null, stale_open: [], pending_reconciliation: [] })
    );
    await CashService.getOverview();
    expect(mockedApi.get).toHaveBeenLastCalledWith('/v1/store/cash/overview');

    mockedApi.post.mockResolvedValueOnce(success({ id: 'c1' }));
    await CashService.submit('c1', { declared_amount: 49500, declaration_notes: 'Sobre' });
    expect(mockedApi.post).toHaveBeenLastCalledWith('/v1/store/cash/c1/submit', {
        declared_amount: 49500,
        declaration_notes: 'Sobre',
    });

    mockedApi.get.mockResolvedValueOnce(
        success({ items: [], total: 0, per_page: 10, current_page: 1, last_page: 1 })
    );
    await CashService.getPendingReconciliations(2, 10);
    expect(mockedApi.get).toHaveBeenLastCalledWith('/v1/store/cash/pending-reconciliation', {
        params: { page: 2, per_page: 10 },
    });

    mockedApi.get.mockResolvedValueOnce(success({ id: 'c1' }));
    await CashService.getReconciliation('c1');
    expect(mockedApi.get).toHaveBeenLastCalledWith('/v1/store/cash/c1/reconciliation');

    mockedApi.get.mockResolvedValueOnce(
        success({ items: [], total: 0, per_page: 10, current_page: 1, last_page: 1 })
    );
    await CashService.getReconciliationPayments('c1', 'method-1', 2, 10);
    expect(mockedApi.get).toHaveBeenLastCalledWith(
        '/v1/store/cash/c1/reconciliation/payment-methods/method-1/payments',
        { params: { page: 2, per_page: 10 } }
    );

    mockedApi.post.mockResolvedValueOnce(success({ id: 'c1' }));
    await CashService.close('c1', { real_amount: 49500, reconciliation_notes: 'Controlado' });
    expect(mockedApi.post).toHaveBeenLastCalledWith('/v1/store/cash/c1/close', {
        real_amount: 49500,
        reconciliation_notes: 'Controlado',
    });
});
