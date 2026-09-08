import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CancelPendingDeliveryModal from './CancelPendingDeliveryModal';

const items = [{
    product_id: 'product-1',
    product_name: 'Cinta Métrica',
    sku: 'C-1',
    ordered_quantity: 2,
    delivered_quantity: 1,
    pending_quantity: 1,
    planned_active_quantity: 0,
    unassigned_pending_quantity: 1,
}];

test('lists the complete remainder and requires a reason before confirming once', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
        <CancelPendingDeliveryModal
            open
            items={items}
            loading={false}
            onClose={vi.fn()}
            onConfirm={onConfirm}
        />
    );

    expect(screen.getByText('Cinta Métrica')).toBeInTheDocument();
    expect(screen.getByText('1 unidad')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar pendiente' }));
    expect(await screen.findByText('El motivo es obligatorio.')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Cliente ya no necesita la mercadería'), 'No entregar');
    await user.click(screen.getByRole('button', { name: 'Cancelar pendiente' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith('No entregar');
});
