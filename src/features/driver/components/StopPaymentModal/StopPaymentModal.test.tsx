import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DriverService } from '../../services/driver.service';
import { StopPaymentModal } from './StopPaymentModal';

vi.mock('../../services/driver.service', () => ({
    DriverService: { getPaymentMethods: vi.fn() },
}));

const paymentMethod = {
    id: 'cash',
    store_payment_method_id: 'cash',
    name: 'Efectivo',
    code: 'cash',
    icon: null,
    is_active: true,
    is_enabled: true,
    custom_name: null,
    requires_reference: false,
    account_details: null,
    sort_order: 1,
};

test('keeps raw monetary input editable and calculates cents using integer arithmetic', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    vi.mocked(DriverService.getPaymentMethods).mockResolvedValue([paymentMethod]);

    render(
        <StopPaymentModal
            open
            amountToCollectNow={142500}
            onClose={vi.fn()}
            onConfirm={onConfirm}
        />
    );

    expect(await screen.findByText('Máximo disponible')).toBeInTheDocument();
    expect(screen.getByText('Cobrado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Efectivo'));

    const input = screen.getByLabelText('Monto del cobro 1');
    await user.type(input, '142500.50');
    expect(input).toHaveValue('142500.50');

    await user.clear(input);
    await user.type(input, '1.02');
    expect(input).toHaveValue('1.02');
    expect(screen.getByText(/142\.498,98/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar y Entregar' }));
    expect(onConfirm).toHaveBeenCalledWith([{ store_payment_method_id: 'cash', amount: 1.02 }]);
});

test('blocks amounts above amount_to_collect_now and still allows partial payments', async () => {
    const user = userEvent.setup();
    vi.mocked(DriverService.getPaymentMethods).mockResolvedValue([paymentMethod]);

    render(
        <StopPaymentModal open amountToCollectNow={10.01} onClose={vi.fn()} onConfirm={vi.fn()} />
    );

    await user.click(await screen.findByRole('combobox'));
    await user.click(await screen.findByText('Efectivo'));
    const input = screen.getByLabelText('Monto del cobro 1');

    await user.type(input, '10.02');
    expect(
        screen.getByText('El monto no puede superar el máximo de esta entrega.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar y Entregar' })).toBeDisabled();

    await user.clear(input);
    await user.type(input, '5.01');
    expect(screen.getByRole('button', { name: 'Confirmar y Entregar' })).toBeEnabled();
    expect(screen.getByText(/5,00/)).toBeInTheDocument();
});
