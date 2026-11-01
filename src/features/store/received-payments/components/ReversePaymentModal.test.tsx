import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { message } from 'antd';
import { beforeEach, vi } from 'vitest';
import type { ReceivedPayment } from '../interfaces/received-payment.interface';
import { ReceivedPaymentsService } from '../services/received-payments.service';
import { ReversePaymentModal } from './ReversePaymentModal';

vi.mock('../services/received-payments.service', () => ({
    ReceivedPaymentsService: { reversePayment: vi.fn() },
}));

const payment: ReceivedPayment = {
    id: 'payment-1',
    amount: 10000,
    reference: 'TRX-1',
    status: 'active',
    created_at: '2026-10-31 14:35:00',
    reversed_at: null,
    store_payment_method_id: 'method-1',
    payment_method: { id: 'method-1', name: 'Transferencia', code: 'transfer' },
    operation: { id: 'order-1', operation_number: 'P-000022', type: 'order' },
    customer: { id: 'customer-1', display_name: 'Sandra López' },
    origin: 'manual_collection',
    reversal: { allowed: true, reason: null },
    registered_by: null,
    reversed_by: null,
    route: null,
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof ReversePaymentModal>> = {}) => {
    const props = {
        payment,
        open: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        onEligibilityError: vi.fn(),
        ...overrides,
    };

    return { props, ...render(<ReversePaymentModal {...props} />) };
};

const selectReason = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    const modal = screen.getByRole('dialog');
    await user.click(within(modal).getByRole('combobox'));
    await user.click(await screen.findByText(label));
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ReceivedPaymentsService.reversePayment).mockReset();
    vi.spyOn(message, 'success').mockImplementation(vi.fn());
});

test('requires a reason and an observation only for Other', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Anular pago' }));
    expect(await screen.findByText('El motivo de anulación es obligatorio.')).toBeInTheDocument();

    await selectReason(user, 'Otro');
    await user.click(screen.getByRole('button', { name: 'Anular pago' }));
    expect(
        await screen.findByText('La observación es obligatoria cuando el motivo es Otro.')
    ).toBeInTheDocument();
});

test('uses labels, sends only the reversal payload, and keeps the drawer context after success', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(ReceivedPaymentsService.reversePayment).mockResolvedValue({
        ...payment,
        status: 'reversed',
        reversed_at: '2026-10-31 15:00:00',
        reversed_by: { id: 'user-1', name: 'Ana' },
    });
    renderModal({ onSuccess });

    await selectReason(user, 'Pago duplicado');
    await user.click(screen.getByRole('button', { name: 'Anular pago' }));

    await waitFor(() =>
        expect(ReceivedPaymentsService.reversePayment).toHaveBeenCalledWith('payment-1', {
            reason_code: 'duplicate_payment',
        })
    );
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ status: 'reversed' }));
    expect(message.success).toHaveBeenCalledWith('Pago anulado correctamente.');
});

test('prevents duplicate submissions and disables inputs while the request is pending', async () => {
    const user = userEvent.setup();
    let resolveRequest: ((payment: ReceivedPayment) => void) | undefined;
    vi.mocked(ReceivedPaymentsService.reversePayment).mockReturnValue(
        new Promise((resolve) => {
            resolveRequest = resolve;
        })
    );
    renderModal();

    await selectReason(user, 'Pago registrado por error');
    const submit = screen.getByRole('button', { name: 'Anular pago' });
    await user.click(submit);
    await user.click(submit);

    await waitFor(() => expect(ReceivedPaymentsService.reversePayment).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();

    resolveRequest?.({ ...payment, status: 'reversed' });
    await waitFor(() => expect(message.success).toHaveBeenCalled());
});

test('shows backend errors, preserves inputs, and refreshes eligibility data', async () => {
    const user = userEvent.setup();
    const onEligibilityError = vi.fn();
    vi.mocked(ReceivedPaymentsService.reversePayment).mockRejectedValue({
        status: 422,
        message: 'La caja del pago ya no está abierta.',
    });
    renderModal({ onEligibilityError });

    await selectReason(user, 'Importe incorrecto');
    await user.type(screen.getByRole('textbox'), 'Se digitó un importe incorrecto');
    await user.click(screen.getByRole('button', { name: 'Anular pago' }));

    expect(await screen.findByText('La caja del pago ya no está abierta.')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Se digitó un importe incorrecto');
    expect(onEligibilityError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox')).not.toBeDisabled();
});

test('cancelling does not send a request', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(ReceivedPaymentsService.reversePayment).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
});
