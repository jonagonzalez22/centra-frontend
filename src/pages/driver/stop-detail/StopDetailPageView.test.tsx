import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach } from 'vitest';
import { StopDetailPageView } from './StopDetailPageView';
import type { StopDetail } from '@/features/driver/interfaces/driver.interface';

const preview = {
    order_total: 500,
    delivered_value_current_stop: 300,
    delivered_value_cumulative: 300,
    verified_paid_amount: 0,
    pending_declared_amount: 0,
    amount_to_collect_now: 300,
};

let activePreview: typeof preview | null = preview;

vi.mock('@/features/driver/hooks/useCollectionPreview', () => ({
    useCollectionPreview: () => ({
        preview: activePreview,
        loading: false,
        error: null,
        retry: vi.fn(),
    }),
}));

beforeEach(() => {
    activePreview = preview;
});

const stop: StopDetail = {
    id: 'stop-1',
    route_id: 'route-1',
    sequence: 1,
    status: 'pending',
    address: 'Calle 1',
    delivery_reference: null,
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
            quantity_planned: '5.0000',
            quantity_loaded: '5.0000',
            quantity_delivered: '0.0000',
            quantity_released_for_extra_sale: '0.0000',
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
            hasAvailableSurplus={false}
        />
    );

    await user.click(screen.getByLabelText('Reducir cantidad entregada de Pintura Látex'));
    await user.click(screen.getByLabelText('Reducir cantidad entregada de Pintura Látex'));
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Cliente rechazó'));
    await user.click(screen.getByLabelText('Reducir disponibilidad de Pintura Látex'));
    await user.click(screen.getByRole('button', { name: 'Confirmar entrega parcial' }));

    expect(onDeliver).toHaveBeenCalledWith(
        {
            items: [
                {
                    route_stop_item_id: 'item-1',
                    quantity_delivered: '3.0000',
                    quantity_released_for_extra_sale: '1.0000',
                    rejection_reason_id: 'safe',
                },
            ],
            gps: undefined,
        },
        preview
    );
});

test('shows the complete delivery address reference without rendering logistics notes', () => {
    activePreview = null;

    render(
        <StopDetailPageView
            stop={{
                ...stop,
                delivery_reference:
                    'Casa de color marrón con blanco. Tocar timbre lateral al portón.',
            }}
            loading={false}
            error={null}
            onRefresh={vi.fn()}
            rejectionReasons={[]}
            completing={false}
            onDeliver={vi.fn()}
            onFailedDelivery={vi.fn()}
            onExtraSaleClick={vi.fn()}
            hasAvailableSurplus={false}
        />
    );

    expect(screen.getByText('Referencia para la entrega')).toBeInTheDocument();
    expect(
        screen.getByText('Casa de color marrón con blanco. Tocar timbre lateral al portón.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Observaciones')).not.toBeInTheDocument();
});

test('keeps delivery controls editable while the stop is pending', () => {
    render(
        <StopDetailPageView
            stop={stop}
            loading={false}
            error={null}
            onRefresh={vi.fn()}
            rejectionReasons={[]}
            completing={false}
            onDeliver={vi.fn()}
            onFailedDelivery={vi.fn()}
            onExtraSaleClick={vi.fn()}
            hasAvailableSurplus={false}
        />
    );

    expect(screen.getByLabelText('Reducir cantidad entregada de Pintura Látex')).toBeEnabled();
    expect(
        screen.getByLabelText('Aumentar cantidad entregada de Pintura Látex')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entregar todo' })).toBeInTheDocument();
});

test('keeps declared collections concrete while hiding internal payment verification details', () => {
    render(
        <StopDetailPageView
            stop={{
                ...stop,
                items: [{ ...stop.items[0], stock_measurement_unit: { symbol: 'u' } }],
                collections: [
                    {
                        id: 'collection-1',
                        method: 'QR / Billetera',
                        amount: 2500,
                        status: 'declared',
                        declared_at: null,
                    },
                ],
            }}
            loading={false}
            error={null}
            onRefresh={vi.fn()}
            rejectionReasons={[]}
            completing={false}
            onDeliver={vi.fn()}
            onFailedDelivery={vi.fn()}
            onExtraSaleClick={vi.fn()}
            hasAvailableSurplus={false}
        />
    );

    expect(screen.queryByText('Pagado confirmado')).not.toBeInTheDocument();
    expect(
        screen.queryByText(/Los cobros declarados se encuentran pendientes de verificación/)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Cobros declarados/)).toBeInTheDocument();
    const collection = screen.getByText('QR / Billetera').closest(
        '.stopDetailCollectionRow'
    ) as HTMLElement | null;
    expect(collection).not.toBeNull();
    expect(within(collection!).getByText('Pendiente')).toBeInTheDocument();
    expect(within(collection!).getByText(/2.500/)).toBeInTheDocument();
    expect(screen.getByText('Pintura Látex')).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText('SKU: P-1')).toBeInTheDocument();
    expect(screen.getByText('Unidad: u')).toBeInTheDocument();
    expect(screen.getByText(/100\/u/)).toBeInTheDocument();
});

test('omits the payment section entirely when the preview has no visible content', () => {
    activePreview = null;
    render(
        <StopDetailPageView
            stop={{
                ...stop,
                collections: [
                    {
                        id: 'collection-1',
                        method: 'Efectivo',
                        amount: 2500,
                        status: 'declared',
                        declared_at: null,
                    },
                ],
            }}
            loading={false}
            error={null}
            onRefresh={vi.fn()}
            rejectionReasons={[]}
            completing={false}
            onDeliver={vi.fn()}
            onFailedDelivery={vi.fn()}
            onExtraSaleClick={vi.fn()}
            hasAvailableSurplus={false}
        />
    );

    expect(screen.queryByText('Información de pago')).not.toBeInTheDocument();
    expect(document.querySelector('.orderBalanceFull')).not.toBeInTheDocument();
    expect(screen.getByText(/Productos a entregar/)).toBeInTheDocument();
    expect(screen.getByText(/Cobros declarados/)).toBeInTheDocument();
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
});

test.each(['pending', 'arrived'] as const)(
    'shows Venta Extra for an actionable %s stop with surplus',
    (status) => {
        render(
            <StopDetailPageView
                stop={{ ...stop, status }}
                loading={false}
                error={null}
                onRefresh={vi.fn()}
                rejectionReasons={[]}
                completing={false}
                onDeliver={vi.fn()}
                onFailedDelivery={vi.fn()}
                onExtraSaleClick={vi.fn()}
                hasAvailableSurplus
            />
        );

        expect(screen.getByRole('button', { name: 'Venta Extra' })).toBeInTheDocument();
    }
);

test.each(['completed', 'failed', 'cancelled'] as const)(
    'hides Venta Extra for a resolved %s stop even with surplus',
    (status) => {
        render(
            <StopDetailPageView
                stop={{ ...stop, status }}
                loading={false}
                error={null}
                onRefresh={vi.fn()}
                rejectionReasons={[]}
                completing={false}
                onDeliver={vi.fn()}
                onFailedDelivery={vi.fn()}
                onExtraSaleClick={vi.fn()}
                hasAvailableSurplus
            />
        );

        expect(screen.queryByRole('button', { name: 'Venta Extra' })).not.toBeInTheDocument();
    }
);

test('shows the persisted partial delivery after a stop is completed', () => {
    render(
        <StopDetailPageView
            stop={{
                ...stop,
                status: 'completed',
                items: [
                    {
                        ...stop.items[0],
                        product_name: 'Esponja cocina',
                        quantity_planned: '2.0000',
                        quantity_loaded: '2.0000',
                        quantity_delivered: '1.0000',
                        quantity_released_for_extra_sale: '0.0000',
                        rejection_reason: {
                            id: 'customer-rejected',
                            label: 'Mercadería rechazada por el cliente',
                        },
                    },
                ],
            }}
            loading={false}
            error={null}
            onRefresh={vi.fn()}
            rejectionReasons={[]}
            completing={false}
            onDeliver={vi.fn()}
            onFailedDelivery={vi.fn()}
            onExtraSaleClick={vi.fn()}
            hasAvailableSurplus={false}
        />
    );

    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.queryByText('2/2')).not.toBeInTheDocument();
    expect(screen.queryByText('0 de 1 revisados')).not.toBeInTheDocument();
    expect(screen.getByText('1 unidad no entregada')).toBeInTheDocument();
    expect(screen.getByText('Mercadería rechazada por el cliente')).toBeInTheDocument();
    expect(
        screen.queryByLabelText('Reducir cantidad entregada de Esponja cocina')
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(
        screen.queryByRole('button', { name: 'Confirmar entrega parcial' })
    ).not.toBeInTheDocument();
});

test('keeps a completed full delivery at its persisted quantity', () => {
    render(
        <StopDetailPageView
            stop={{
                ...stop,
                status: 'completed',
                items: [
                    {
                        ...stop.items[0],
                        quantity_planned: '2.0000',
                        quantity_loaded: '2.0000',
                        quantity_delivered: '2.0000',
                    },
                ],
            }}
            loading={false}
            error={null}
            onRefresh={vi.fn()}
            rejectionReasons={[]}
            completing={false}
            onDeliver={vi.fn()}
            onFailedDelivery={vi.fn()}
            onExtraSaleClick={vi.fn()}
            hasAvailableSurplus={false}
        />
    );

    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.queryByText('No entregado:')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entregar todo' })).not.toBeInTheDocument();
});
