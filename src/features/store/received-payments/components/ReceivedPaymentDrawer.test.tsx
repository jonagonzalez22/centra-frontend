import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { ReceivedPaymentDrawer } from './ReceivedPaymentDrawer';
import type { ReceivedPayment } from '../interfaces/received-payment.interface';

let canReverse = false;

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({
        can: (permission: string) => permission === 'payments.reverse' && canReverse,
    }),
}));

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
    reversal: { allowed: false, reason: 'route_collection' },
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

afterEach(() => {
    canReverse = false;
    cleanup();
});

test.each([
    ['manual_collection', 'active', true],
    ['order_deposit', 'active', true],
    ['pos_sale', 'active', false],
    ['route_collection', 'active', false],
    ['manual_collection', 'reversed', false],
] as const)(
    'shows reversal only for eligible %s payments with active status',
    (origin, status, visible) => {
        canReverse = true;
        render(
            <ReceivedPaymentDrawer
                payment={{
                    ...payment,
                    origin,
                    status,
                    reversal: visible
                        ? { allowed: true, reason: null }
                        : {
                              allowed: false,
                              reason: status === 'reversed' ? 'already_reversed' : 'pos_sale',
                          },
                    route: origin === 'route_collection' ? payment.route : null,
                }}
                open
                onClose={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: 'Anular pago' })).toBe(
            visible ? screen.getByRole('button', { name: 'Anular pago' }) : null
        );
    }
);

test('does not show reversal without payments.reverse', () => {
    render(
        <ReceivedPaymentDrawer
            payment={{ ...payment, origin: 'manual_collection', status: 'active', route: null }}
            open
            onClose={vi.fn()}
        />
    );

    expect(screen.queryByRole('button', { name: 'Anular pago' })).not.toBeInTheDocument();
});

test('shows contextual reversal guidance for POS and route payments', () => {
    canReverse = true;
    const { rerender } = render(
        <ReceivedPaymentDrawer
            payment={{
                ...payment,
                origin: 'pos_sale',
                status: 'active',
                reversal: { allowed: false, reason: 'pos_sale' },
                route: null,
            }}
            open
            onClose={vi.fn()}
        />
    );

    expect(
        screen.getByText(/Este pago pertenece a una venta. Para revertir la operación/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Anular pago' })).not.toBeInTheDocument();

    rerender(
        <ReceivedPaymentDrawer
            payment={{
                ...payment,
                origin: 'route_collection',
                status: 'active',
                reversal: { allowed: false, reason: 'route_collection' },
            }}
            open
            onClose={vi.fn()}
        />
    );

    expect(
        screen.getByText(
            'Este pago proviene de una cobranza de ruta conciliada y no puede anularse.'
        )
    ).toBeInTheDocument();
});

test('does not expose reversal guidance without permission', () => {
    render(
        <ReceivedPaymentDrawer
            payment={{
                ...payment,
                origin: 'pos_sale',
                status: 'active',
                reversal: { allowed: false, reason: 'pos_sale' },
                route: null,
            }}
            open
            onClose={vi.fn()}
        />
    );

    expect(
        screen.queryByText(/Este pago pertenece a una venta. Para revertir la operación/)
    ).not.toBeInTheDocument();
});
