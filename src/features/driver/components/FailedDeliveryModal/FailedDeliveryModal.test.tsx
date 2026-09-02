import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FailedDeliveryModal } from './FailedDeliveryModal';
import type { StopDetailItem } from '../../interfaces/driver.interface';

const items: StopDetailItem[] = [
    {
        id: 'item-x',
        route_stop_item_id: 'item-x',
        product_id: 'product-x',
        product_name: 'Pintura Látex de nombre muy largo para pantalla móvil',
        sku: 'X',
        quantity_planned: 5,
        quantity_loaded: 5,
        quantity_delivered: 0,
        quantity_released_for_extra_sale: 0,
        unit_price: 100,
        is_extra: false,
        notes: null,
    },
    {
        id: 'item-y',
        route_stop_item_id: 'item-y',
        product_id: 'product-y',
        product_name: 'Rodillo',
        sku: 'Y',
        quantity_planned: 3,
        quantity_loaded: 3,
        quantity_delivered: 0,
        quantity_released_for_extra_sale: 0,
        unit_price: 50,
        is_extra: false,
        notes: null,
    },
];

const reasons = [
    { id: 'safe', code: 'customer_absent', label: 'Cliente ausente', suggest_extra_sale: true },
    { id: 'damaged', code: 'damaged_goods', label: 'Mercadería dañada', suggest_extra_sale: false },
];

const selectReason = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText(label));
};

test('reuses the failed modal and suggests every loaded quantity for a configured reason', async () => {
    const user = userEvent.setup();
    render(
        <FailedDeliveryModal
            open
            rejectionReasons={reasons}
            items={items}
            loading={false}
            onConfirm={vi.fn()}
            onClose={vi.fn()}
        />
    );

    expect(screen.getByText('No se pudo entregar')).toBeInTheDocument();
    expect(screen.queryByText('Disponibilidad para Venta Extra')).not.toBeInTheDocument();

    await selectReason(user, 'Cliente ausente');

    expect(screen.getByText('Disponibilidad para Venta Extra')).toBeInTheDocument();
    expect(screen.getByText('Máximo: 5')).toBeInTheDocument();
    expect(screen.getByText('Máximo: 3')).toBeInTheDocument();
});

test('recalculates suggestions when the global reason changes and allows independent adjustment', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
        <FailedDeliveryModal
            open
            rejectionReasons={reasons}
            items={items}
            loading={false}
            onConfirm={onConfirm}
            onClose={vi.fn()}
        />
    );

    await selectReason(user, 'Cliente ausente');
    await user.click(screen.getByLabelText(`Reducir disponibilidad de ${items[0].product_name}`));

    await user.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenLastCalledWith('safe', { 'item-x': 4, 'item-y': 3 });

    await selectReason(user, 'Mercadería dañada');
    await user.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenLastCalledWith('damaged', { 'item-x': 0, 'item-y': 0 });
});
