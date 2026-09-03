import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderBalanceSummary } from './OrderBalanceSummary';

test('starts collapsed, expands all economic details and can collapse again', async () => {
    const user = userEvent.setup();
    render(
        <OrderBalanceSummary
            variant="full"
            order={{ total: 100000, paid_amount: 10000, pending_amount: 90000 }}
            collectionPreview={{
                order_total: 100000,
                delivered_value_current_stop: 30000,
                delivered_value_cumulative: 70000,
                verified_paid_amount: 10000,
                pending_declared_amount: 15000,
                amount_to_collect_now: 45000,
            }}
        />
    );

    expect(screen.getByText('A cobrar ahora')).toBeInTheDocument();
    expect(screen.getByText(/45\.000/)).toBeInTheDocument();
    expect(screen.queryByText('Total actual del pedido')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    expect(screen.getByText('Total actual del pedido')).toBeInTheDocument();
    expect(screen.getByText('Entregado en esta visita')).toBeInTheDocument();
    expect(screen.getByText('Entregado acumulado')).toBeInTheDocument();
    expect(screen.getByText('Pagado confirmado')).toBeInTheDocument();
    expect(screen.getByText('Cobros en verificación')).toBeInTheDocument();
    expect(screen.getByText('Pendientes de verificación.')).toBeInTheDocument();
    expect(screen.getAllByText('A cobrar ahora')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Ocultar detalle' }));
    expect(screen.queryByText('Total actual del pedido')).not.toBeInTheDocument();
});

test('does not keep showing stale preview while recalculating', () => {
    render(
        <OrderBalanceSummary
            variant="full"
            order={{ total: 5000, paid_amount: 0, pending_amount: 5000 }}
            collectionPreview={null}
            previewLoading
        />
    );

    expect(screen.getByText('Actualizando importe…')).toBeInTheDocument();
    expect(screen.queryByText('A cobrar ahora')).not.toBeInTheDocument();
});
