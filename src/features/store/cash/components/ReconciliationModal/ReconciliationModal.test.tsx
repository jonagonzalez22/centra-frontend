import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CashService } from '../../services/cash.service';
import { ReconciliationModal } from './ReconciliationModal';

vi.mock('../../services/cash.service', () => ({
    CashService: { getReconciliation: vi.fn(), getReconciliationPayments: vi.fn(), close: vi.fn() },
}));

const detail = {
    id: 'cash-1',
    status: 'pending_reconciliation' as const,
    business_date: '2026-09-10',
    opening_amount: 20000,
    expected_amount: 50000,
    declared_amount: 49500,
    opened_at: '2026-09-10 08:00:00',
    submitted_at: '2026-09-10 18:00:00',
    declaration_notes: 'Sobre cerrado',
    cashier: { id: 'cashier-1', name: 'Juan' },
    cash_income: 30000,
    total_collected: 38000,
    payment_count: 4,
    operation_count: 3,
    totals_by_payment_method: [
        {
            store_payment_method_id: 'cash',
            name: 'Efectivo',
            code: 'cash',
            payment_count: 2,
            total: 30000,
        },
        {
            store_payment_method_id: 'transfer',
            name: 'Transferencia',
            code: 'bank_transfer',
            payment_count: 1,
            total: 8000,
        },
    ],
};

beforeEach(() => {
    vi.mocked(CashService.getReconciliation).mockResolvedValue(detail);
    vi.mocked(CashService.close).mockResolvedValue();
    vi.mocked(CashService.getReconciliationPayments).mockResolvedValue({
        payment_method: { id: 'transfer', name: 'Transferencia', code: 'bank_transfer' },
        items: [],
        total: 0,
        per_page: 10,
        current_page: 1,
        last_page: 1,
    });
});

test('separates physical cash, other methods and total collected', async () => {
    render(<ReconciliationModal sessionId="cash-1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    await screen.findByText('Juan');
    expect(screen.getByRole('heading', { name: 'Efectivo' })).toBeInTheDocument();
    expect(screen.getByText('Monto inicial')).toBeInTheDocument();
    expect(screen.getByText('Cobrado en efectivo')).toBeInTheDocument();
    expect(screen.getByText('Efectivo esperado')).toBeInTheDocument();
    expect(screen.getByText('Declarado por cajero')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Otros medios de pago' })).toBeInTheDocument();
    expect(screen.getByText('Transferencia')).toBeInTheDocument();
    expect(screen.getByText('$ 8.000')).toBeInTheDocument();
    expect(screen.getByText('Total cobrado')).toBeInTheDocument();
    expect(screen.getByText('$ 38.000')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Ver detalle' })).toHaveLength(1);
});

test.each([
    ['49500', 'Faltante: $ 500'],
    ['50300', 'Sobrante: $ 300'],
])('shows difference and requires notes for %s', async (amount, label) => {
    const user = userEvent.setup();
    render(<ReconciliationModal sessionId="cash-1" onClose={vi.fn()} onSuccess={vi.fn()} />);
    await screen.findByText('Juan');
    await user.type(screen.getByRole('spinbutton'), amount);
    expect(screen.getByText(label)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar arqueo y cerrar' }));
    expect(
        await screen.findByText('Debe ingresar una observación para registrar una diferencia.')
    ).toBeInTheDocument();
    expect(CashService.close).not.toHaveBeenCalled();
});

test('allows exact reconciliation without notes and refreshes after close', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<ReconciliationModal sessionId="cash-1" onClose={vi.fn()} onSuccess={onSuccess} />);
    await screen.findByText('Juan');
    await user.type(screen.getByRole('spinbutton'), '50000');
    expect(screen.getByText('Sin diferencia')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar arqueo y cerrar' }));
    await waitFor(() =>
        expect(CashService.close).toHaveBeenCalledWith('cash-1', { real_amount: 50000 })
    );
    expect(onSuccess).toHaveBeenCalled();
});
