import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalesService } from '@/features/store/sales/services/sales.service';
import { RegisterOrderPaymentModal } from './RegisterOrderPaymentModal';

vi.mock('@/features/store/sales/services/sales.service', () => ({
    SalesService: { getPaymentMethods: vi.fn() },
}));

beforeEach(() => {
    vi.mocked(SalesService.getPaymentMethods).mockResolvedValue([
        {
            id: 'global-cash',
            store_payment_method_id: 'cash-1',
            name: 'Efectivo',
            code: 'cash',
            icon: null,
            is_active: true,
            is_enabled: true,
            custom_name: null,
            requires_reference: false,
            account_details: null,
            sort_order: 0,
        },
    ]);
});

test('allows submitting a partial payment with one method', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
        <RegisterOrderPaymentModal
            open
            pendingAmount={15600}
            onClose={vi.fn()}
            onSubmit={onSubmit}
        />
    );

    await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Efectivo'));
    await user.type(screen.getByRole('spinbutton'), '10000');
    await user.click(screen.getByRole('button', { name: 'Registrar pago' }));

    await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
            store_payment_method_id: 'cash-1',
            amount: 10000,
        })
    );
});

test('keeps an amount above the pending balance and disables submission', async () => {
    const user = userEvent.setup();
    render(
        <RegisterOrderPaymentModal
            open
            pendingAmount={2200}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
        />
    );

    const amountInput = screen.getByRole('spinbutton');
    await user.type(amountInput, '30000');
    await user.tab();

    expect(amountInput).toHaveValue('30000.00');
    expect(
        await screen.findByText('El importe no puede superar el saldo pendiente de $ 2.200.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeDisabled();
});

test.each([2200, 1000])('accepts a valid amount of %s', async (amount) => {
    const user = userEvent.setup();
    render(
        <RegisterOrderPaymentModal
            open
            pendingAmount={2200}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
        />
    );

    await user.type(screen.getByRole('spinbutton'), String(amount));

    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeEnabled();
});
