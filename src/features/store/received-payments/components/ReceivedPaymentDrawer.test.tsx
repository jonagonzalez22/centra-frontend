import { render, screen } from '@testing-library/react';
import { ReceivedPaymentDrawer } from './ReceivedPaymentDrawer';
import type { ReceivedPayment } from '../interfaces/received-payment.interface';

const payment: ReceivedPayment = {
    id: 'payment-1',
    amount: 10000,
    reference: 'TRX-1',
    status: 'reversed',
    created_at: '2026-10-31 14:35:00',
    reversed_at: '2026-10-31 15:00:00',
    store_payment_method_id: 'method-1',
    payment_method: { id: 'method-1', name: 'Efectivo', code: 'cash' },
    operation: { id: 'order-1', operation_number: 'P-000022', type: 'order' },
    customer: { id: null, display_name: null },
    origin: 'route_collection',
    registered_by: null,
    reversed_by: { id: 'user-2', name: 'María' },
    route: {
        id: 'route-1',
        route_stop_id: 'stop-1',
        route_stop_collection_id: 'collection-1',
        driver: { id: 'driver-1', name: 'Pedro' },
        declared_by: { id: 'user-3', name: 'Laura' },
        declared_at: '2026-10-31 13:00:00',
        verified_by: { id: 'user-4', name: 'Sebastián' },
        verified_at: '2026-10-31 14:00:00',
    },
};

test('shows reversed and route audit details without technical ids', () => {
    render(<ReceivedPaymentDrawer payment={payment} open onClose={vi.fn()} />);
    expect(screen.getByText('Revertido')).toBeInTheDocument();
    expect(screen.getByText('Consumidor final')).toBeInTheDocument();
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getAllByText('Cobranza de ruta')).toHaveLength(2);
    expect(screen.getByText('Sebastián')).toBeInTheDocument();
    expect(screen.queryByText('route-1')).not.toBeInTheDocument();
});
