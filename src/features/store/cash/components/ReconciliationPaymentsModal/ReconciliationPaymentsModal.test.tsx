import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CashService } from '../../services/cash.service';
import { ReconciliationPaymentsModal } from './ReconciliationPaymentsModal';

vi.mock('../../services/cash.service', () => ({
    CashService: { getReconciliationPayments: vi.fn() },
}));

const method = {
    store_payment_method_id: 'method-1',
    name: 'Transferencia',
    code: 'bank_transfer',
    payment_count: 2,
    total: 9000,
};

const page = {
    payment_method: { id: 'method-1', name: 'Transferencia', code: 'bank_transfer' },
    items: [
        {
            id: 'payment-1',
            amount: 8800,
            reference: '12345678',
            created_at: '2026-09-10 15:30:00',
            origin: 'manual_collection',
            payment_details: { origin: 'manual_collection' },
            operation: { id: 'operation-1', operation_number: 'P-000023', type: 'order' },
            registered_by: { id: 'user-1', name: 'Jonathan' },
        },
        {
            id: 'payment-2',
            amount: 200,
            reference: null,
            created_at: '2026-09-10 16:00:00',
            origin: null,
            payment_details: null,
            operation: { id: 'operation-2', operation_number: 'V-000024', type: 'sale' },
            registered_by: null,
        },
    ],
    total: 12,
    per_page: 10,
    current_page: 1,
    last_page: 2,
};

beforeEach(() => {
    vi.mocked(CashService.getReconciliationPayments).mockResolvedValue(page);
});

test('loads and renders individual payment traceability with historical fallbacks', async () => {
    render(
        <ReconciliationPaymentsModal sessionId="cash-1" paymentMethod={method} onClose={vi.fn()} />
    );
    expect(screen.getByLabelText('Cargando detalle de pagos')).toBeInTheDocument();
    expect(await screen.findByText('P-000023')).toBeInTheDocument();
    expect(screen.getByText('$ 8.800')).toBeInTheDocument();
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('Pago posterior en tienda')).toBeInTheDocument();
    expect(screen.getByText('Jonathan')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('No informado')).toBeInTheDocument();
    expect(CashService.getReconciliationPayments).toHaveBeenCalledWith('cash-1', 'method-1', 1, 10);
});

test('pagination fetches the requested page', async () => {
    const user = userEvent.setup();
    render(
        <ReconciliationPaymentsModal sessionId="cash-1" paymentMethod={method} onClose={vi.fn()} />
    );
    await screen.findByText('P-000023');
    await user.click(screen.getByTitle('2'));
    await waitFor(() =>
        expect(CashService.getReconciliationPayments).toHaveBeenLastCalledWith(
            'cash-1',
            'method-1',
            2,
            10
        )
    );
});

test('shows error and empty states without closing the parent reconciliation', async () => {
    const onClose = vi.fn();
    vi.mocked(CashService.getReconciliationPayments).mockRejectedValueOnce({
        message: 'Error de red',
    });
    const { unmount } = render(
        <ReconciliationPaymentsModal sessionId="cash-1" paymentMethod={method} onClose={onClose} />
    );
    expect(await screen.findByText('Error de red')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    unmount();

    vi.mocked(CashService.getReconciliationPayments).mockResolvedValueOnce({
        ...page,
        items: [],
        total: 0,
        last_page: 1,
    });
    render(
        <ReconciliationPaymentsModal sessionId="cash-1" paymentMethod={method} onClose={onClose} />
    );
    expect(
        await screen.findByText('No hay pagos registrados para este medio.')
    ).toBeInTheDocument();
});
