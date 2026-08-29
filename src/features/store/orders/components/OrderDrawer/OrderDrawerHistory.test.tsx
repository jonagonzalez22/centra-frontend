import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderDrawerHistory from './OrderDrawerHistory';
import type { OrderHistoryEntry } from '../../interfaces/order.interface';

const entry = (overrides: Partial<OrderHistoryEntry> = {}): OrderHistoryEntry => ({
    id: 'history-1',
    type: 'order_created',
    occurred_at: '2026-09-04 15:32:00',
    title: 'Pedido creado',
    description: null,
    status: 'confirmed',
    user: { id: 'user-1', name: 'Ana Pérez' },
    route: null,
    details: null,
    ...overrides,
});

describe('OrderDrawerHistory', () => {
    test('renders creation and route assignment as a compact timeline', () => {
        render(
            <OrderDrawerHistory
                loading={false}
                history={[
                    entry(),
                    entry({
                        id: 'assignment-1',
                        type: 'route_assigned',
                        title: 'Asignado a ruta',
                        route: {
                            id: '12345678-route',
                            label: '#12345678',
                            status: 'planned',
                            operational_date: '2026-09-04',
                        },
                    }),
                ]}
            />
        );

        expect(screen.getByText('Pedido creado')).toBeInTheDocument();
        expect(screen.getByText('Asignado a ruta')).toBeInTheDocument();
        expect(screen.getByText('Ruta #12345678')).toBeInTheDocument();
    });

    test('marks reported deliveries provisional and keeps products collapsed', async () => {
        const user = userEvent.setup();
        render(
            <OrderDrawerHistory
                loading={false}
                history={[
                    entry({
                        id: 'delivery-1',
                        type: 'delivery_reported',
                        title: 'Entrega informada',
                        description: 'Pendiente de conciliación',
                        status: 'provisional',
                        route: {
                            id: 'route-1',
                            label: '#RUTA0001',
                            status: 'awaiting_reconciliation',
                            operational_date: '2026-09-04',
                        },
                        details: {
                            driver: { id: 'driver-1', name: 'Juan Pérez' },
                            items: [
                                {
                                    id: 'item-1',
                                    product_id: 'product-1',
                                    product_name: 'Cemento 50kg',
                                    quantity_planned: 10,
                                    quantity_loaded: 10,
                                    quantity_delivered: 8,
                                    discrepancies: [],
                                },
                                {
                                    id: 'item-2',
                                    product_id: 'product-2',
                                    product_name: 'Arena fina',
                                    quantity_planned: 5,
                                    quantity_loaded: 5,
                                    quantity_delivered: 5,
                                    discrepancies: [],
                                },
                            ],
                        },
                    }),
                ]}
            />
        );

        expect(screen.getByText('Entrega informada')).toBeInTheDocument();
        expect(screen.getByText('Pendiente de conciliación')).toBeInTheDocument();
        expect(screen.getByText('Provisional')).toBeInTheDocument();
        expect(screen.queryByText('Cemento 50kg')).not.toBeInTheDocument();
        expect(screen.queryByText('Arena fina')).not.toBeInTheDocument();

        await user.click(screen.getByText('Ver detalle'));

        expect(screen.getByText('Cemento 50kg')).toBeInTheDocument();
        expect(screen.getByText('Arena fina')).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    test('shows reconciled discrepancy information only inside delivery details', async () => {
        const user = userEvent.setup();
        render(
            <OrderDrawerHistory
                loading={false}
                history={[
                    entry({
                        id: 'delivery-2',
                        type: 'delivery_reconciled_partial',
                        title: 'Entrega parcial conciliada',
                        description: 'Queda mercadería pendiente',
                        details: {
                            reconciled_by: { id: 'admin-1', name: 'María López' },
                            items: [
                                {
                                    id: 'item-1',
                                    product_id: 'product-1',
                                    product_name: 'Cemento 50kg',
                                    quantity_planned: 10,
                                    quantity_loaded: 10,
                                    quantity_delivered: 8,
                                    discrepancies: [
                                        {
                                            id: 'discrepancy-1',
                                            quantity: 2,
                                            resolution_type: 'pending_redelivery',
                                            status: 'resolved',
                                            notes: 'Entregar mañana',
                                            resolved_by: {
                                                id: 'admin-1',
                                                name: 'María López',
                                            },
                                            resolved_at: '2026-09-04 16:00:00',
                                        },
                                    ],
                                },
                            ],
                        },
                    }),
                ]}
            />
        );

        expect(screen.getByText('Entrega parcial conciliada')).toBeInTheDocument();
        expect(screen.getByText('Queda mercadería pendiente')).toBeInTheDocument();
        expect(screen.queryByText('Pendiente de reentrega')).not.toBeInTheDocument();

        await user.click(screen.getByText('Ver detalle'));

        expect(screen.getByText('2 — Pendiente de reentrega')).toBeInTheDocument();
        expect(screen.getByText('Entregar mañana')).toBeInTheDocument();
    });

    test('renders existing commercial events with their detail', async () => {
        const user = userEvent.setup();
        render(
            <OrderDrawerHistory
                loading={false}
                history={[
                    entry({
                        id: 'event-1',
                        type: 'delivery_date_changed',
                        title: 'Fecha de entrega reprogramada',
                        details: {
                            previous_date: '2026-09-04',
                            new_date: '2026-09-06',
                            reason_code: 'customer_requested_reschedule',
                        },
                    }),
                ]}
            />
        );

        expect(screen.getByText('Fecha de entrega reprogramada')).toBeInTheDocument();
        await user.click(screen.getByText('Ver detalle'));
        expect(screen.getByText('Solicitud del cliente')).toBeInTheDocument();
    });

    test('renders the empty fallback when history is empty', () => {
        render(<OrderDrawerHistory loading={false} history={[]} />);

        expect(screen.getByText('Sin historial registrado')).toBeInTheDocument();
    });
});
