import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StopDetailPageView } from './StopDetailPageView';
import type { StopDetail } from '@/features/driver/interfaces/driver.interface';

const stop: StopDetail = {
    id: 'stop-1',
    route_id: 'route-1',
    sequence: 1,
    status: 'pending',
    address: 'Calle 1',
    contact_name: 'Cliente',
    contact_phone: null,
    timezone: 'America/Argentina/Mendoza',
    eta: null,
    notification_window_start: null,
    notification_window_end: null,
    notes: null,
    collections: [],
    order: { total: 500, paid_amount: 500, pending_amount: 0 },
    items: [
        {
            id: 'item-1',
            route_stop_item_id: 'item-1',
            product_id: 'product-1',
            product_name: 'Pintura Látex',
            sku: 'P-1',
            quantity_planned: 5,
            quantity_loaded: 5,
            quantity_delivered: 0,
            quantity_released_for_extra_sale: 0,
            unit_price: 100,
            is_extra: false,
            notes: null,
        },
    ],
};

test('partial delivery payload contains the final released quantity', async () => {
    const user = userEvent.setup();
    const onDeliver = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
            getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
                error({} as GeolocationPositionError),
        },
    });

    render(
        <StopDetailPageView
            stop={stop}
            loading={false}
            error={null}
            onRefresh={vi.fn()}
            rejectionReasons={[
                {
                    id: 'safe',
                    code: 'rejected_by_customer',
                    label: 'Cliente rechazó',
                    suggest_extra_sale: true,
                },
            ]}
            completing={false}
            onDeliver={onDeliver}
            onFailedDelivery={vi.fn()}
            onExtraSaleClick={vi.fn()}
        />
    );

    await user.click(screen.getByLabelText('Reducir cantidad entregada de Pintura Látex'));
    await user.click(screen.getByLabelText('Reducir cantidad entregada de Pintura Látex'));
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Cliente rechazó'));
    await user.click(screen.getByLabelText('Reducir disponibilidad de Pintura Látex'));
    await user.click(screen.getByRole('button', { name: 'Confirmar entrega parcial' }));

    expect(onDeliver).toHaveBeenCalledWith({
        items: [
            {
                route_stop_item_id: 'item-1',
                quantity_delivered: 3,
                quantity_released_for_extra_sale: 1,
                rejection_reason_id: 'safe',
            },
        ],
        gps: undefined,
    });
});
