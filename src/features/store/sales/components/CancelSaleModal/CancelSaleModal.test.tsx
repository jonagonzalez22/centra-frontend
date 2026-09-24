import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { message } from 'antd';
import { beforeEach, vi } from 'vitest';
import { SalesService } from '../../services/sales.service';
import { CancelSaleModal } from './CancelSaleModal';

vi.mock('../../services/sales.service', () => ({
    SalesService: { cancelSale: vi.fn() },
}));

const sale = {
    id: 'sale-1',
    operation_number: 'V-000028',
    type: 'sale' as const,
    status: 'confirmed',
    total: 166130,
    customer_display_name: null,
    created_at: '2026-09-22 12:39:00',
    subtotal: 166130,
    tax: 0,
    discount: 0,
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof CancelSaleModal>> = {}) => {
    const props = {
        sale,
        open: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        ...overrides,
    };

    return { ...render(<CancelSaleModal {...props} />), props };
};

const selectReason = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    const modal = screen.getByRole('dialog');
    await user.click(within(modal).getByRole('combobox'));
    await user.click(await screen.findByText(label));
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SalesService.cancelSale).mockReset();
    vi.spyOn(message, 'error').mockImplementation(vi.fn());
    vi.spyOn(message, 'success').mockImplementation(vi.fn());
});

test('requires a cancellation reason and a detail only for Other', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));
    expect(await screen.findByText('El motivo de cancelación es obligatorio.')).toBeInTheDocument();

    await selectReason(user, 'Otro');
    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));
    expect(
        await screen.findByText('El detalle es obligatorio cuando el motivo es Otro.')
    ).toBeInTheDocument();
});

test('submits once, reports success, and notifies the parent with the sale id', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    let resolveCancellation: () => void;
    vi.mocked(SalesService.cancelSale).mockReturnValue(
        new Promise((resolve) => {
            resolveCancellation = () => resolve({ ...sale, items: [], payments: [], history: [] });
        })
    );
    renderModal({ onSuccess, onClose });

    await selectReason(user, 'Error de precio');
    const submit = screen.getByRole('button', { name: 'Cancelar venta' });
    await user.click(submit);
    await user.click(submit);

    expect(SalesService.cancelSale).toHaveBeenCalledOnce();
    resolveCancellation!();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('sale-1'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(message.success).toHaveBeenCalledWith('Venta cancelada exitosamente.');
});

test('keeps the modal and form values for a functional 422 error', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.cancelSale).mockRejectedValue({
        status: 422,
        message: 'La venta no puede cancelarse porque la caja asociada ya fue cerrada.',
        errors: { cash: ['La caja asociada está cerrada.'] },
    });
    const { props } = renderModal();

    await selectReason(user, 'Otro');
    const modal = screen.getByRole('dialog');
    const detail = within(modal).getByRole('textbox');
    await user.type(detail, 'Error de carga');
    await user.click(within(modal).getByRole('button', { name: 'Cancelar venta' }));

    expect(
        await within(modal).findByText(
            'La venta no puede cancelarse porque la caja asociada ya fue cerrada.'
        )
    ).toBeInTheDocument();
    expect(detail).toHaveValue('Error de carga');
    expect(props.onClose).not.toHaveBeenCalled();
    expect(message.error).not.toHaveBeenCalled();
});

test('uses the first backend field error for a 422 response without a message', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.cancelSale).mockRejectedValue({
        status: 422,
        errors: { cash: ['La caja no está abierta.'] },
    });
    renderModal();

    await selectReason(user, 'Error de precio');
    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));

    expect(await screen.findByText('La caja no está abierta.')).toBeInTheDocument();
});

test('treats a scoped sale 404 as functional and a generic 404 as technical', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.cancelSale)
        .mockRejectedValueOnce({
            status: 404,
            message: 'Venta no encontrada.',
            errors: { id: ['La venta no existe o no pertenece a tu tienda.'] },
        })
        .mockRejectedValueOnce({ status: 404, message: 'Recurso no encontrado.' });
    renderModal();

    await selectReason(user, 'Error de precio');
    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));
    expect(await screen.findByText('Venta no encontrada.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));
    await waitFor(() =>
        expect(message.error).toHaveBeenCalledWith(
            'No se pudo completar la cancelación. Intentá nuevamente.'
        )
    );
    expect(screen.queryByText('Recurso no encontrado.')).not.toBeInTheDocument();
});

test.each([
    { label: 'network', error: { status: 0, message: 'Error de conexión con el servidor' } },
    { label: 'timeout', error: { code: 'ECONNABORTED', message: 'timeout' } },
    { label: 'server', error: { status: 500, message: 'Error inesperado' } },
])('sends $label errors to global feedback without an internal alert', async ({ error }) => {
    const user = userEvent.setup();
    vi.mocked(SalesService.cancelSale).mockRejectedValue(error);
    renderModal();

    await selectReason(user, 'Error de precio');
    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));

    await waitFor(() => expect(message.error).toHaveBeenCalledOnce());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('clears a business error when retrying and resets its state when reopened', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.cancelSale)
        .mockRejectedValueOnce({ status: 422, message: 'La caja no está abierta.' })
        .mockReturnValueOnce(new Promise(() => undefined));
    const { props, rerender } = renderModal();

    await selectReason(user, 'Error de precio');
    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));
    expect(await screen.findByText('La caja no está abierta.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar venta' }));
    expect(screen.queryByText('La caja no está abierta.')).not.toBeInTheDocument();

    rerender(<CancelSaleModal {...props} open={false} />);
    rerender(<CancelSaleModal {...props} open />);
    expect(screen.queryByText('La caja no está abierta.')).not.toBeInTheDocument();
});
