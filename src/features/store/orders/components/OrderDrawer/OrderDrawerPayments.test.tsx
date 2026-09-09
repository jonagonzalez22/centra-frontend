import { render, screen } from '@testing-library/react';
import OrderDrawerPayments from './OrderDrawerPayments';

test('shows individual payment traceability and total paid', () => {
    render(
        <OrderDrawerPayments
            loading={false}
            paidAmount={10000}
            pendingAmount={5600}
            canCollect
            onRegisterPayment={vi.fn()}
            payments={[
                {
                    id: 'payment-1',
                    amount: 10000,
                    reference: 'ABC123',
                    payment_details: null,
                    created_at: '2026-09-10 10:00:00',
                    origin: 'manual_collection',
                    registered_by: { id: 'user-1', name: 'Jonathan' },
                    cash_session: { id: 'cash-1', status: 'open' },
                    store_payment_method: { id: 'method-1', name: 'Efectivo', code: 'cash' },
                },
            ]}
        />
    );

    expect(screen.getByText('Total pagado')).toBeInTheDocument();
    expect(screen.getByText('Saldo pendiente')).toBeInTheDocument();
    expect(screen.getAllByText('$ 10.000')).toHaveLength(2);
    expect(screen.getByText('$ 5.600')).toBeInTheDocument();
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
    expect(screen.getByText('Referencia: ABC123')).toBeInTheDocument();
    expect(screen.getByText('Pago posterior en tienda')).toBeInTheDocument();
    expect(screen.getByText('Registrado por Jonathan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeInTheDocument();
});
