import { render, screen } from '@testing-library/react';
import type { ReceiptData } from '../../interfaces/sale.interface';
import { TicketReceipt } from './TicketReceipt';

const receipt: ReceiptData = {
    store: {
        name: 'Ferretería San Miguel',
        cuit: '20325713705',
        address: 'San Miguel 123',
        city: 'Mendoza',
        state: 'Ciudad',
        timezone: 'America/Argentina/Buenos_Aires',
    },
    operation: {
        id: 'sale-1',
        operation_number: 'V-000123',
        type: 'sale',
        status: 'confirmed',
        occurred_at: '2026-09-19T11:03:41-03:00',
        cashier: { id: 'user-1', name: 'Juan Pérez' },
    },
    customer: { display_name: 'Sabrina Melizare' },
    items: [
        {
            product_name: 'Tomacorriente Doble 220V con un nombre particularmente largo',
            quantity: "2.0000",
            unit_price: 4500,
            subtotal: 9000,
            discount_amount: 0,
            tax_amount: 0,
        },
        {
            product_name: 'Cable taller',
            quantity: "1.0000",
            unit_price: 1000,
            subtotal: 1000,
            discount_amount: 500,
            tax_amount: 210,
        },
    ],
    totals: {
        subtotal: 10000,
        tax: 210,
        discount: 500,
        total: 9710,
        paid_amount: 9710,
        pending_amount: 0,
    },
    payments: [
        { method_name: 'Efectivo', amount: 3000 },
        { method_name: 'Mercado Pago', amount: 6710 },
    ],
};

test('renders customer, historical items, conditional totals and multiple payments', () => {
    render(<TicketReceipt receipt={receipt} />);

    expect(screen.getByText('Ferretería San Miguel')).toBeInTheDocument();
    expect(screen.getByText('CUIT 20-32571370-5')).toBeInTheDocument();
    expect(screen.getByText('San Miguel 123')).toBeInTheDocument();
    expect(screen.getByText('Venta:')).toBeInTheDocument();
    expect(screen.getByText('V-000123')).toBeInTheDocument();
    expect(screen.getByText('Fecha:')).toBeInTheDocument();
    expect(screen.getByText('19/09/2026')).toBeInTheDocument();
    expect(screen.getByText('Hora:')).toBeInTheDocument();
    expect(screen.getByText('11:03')).toBeInTheDocument();
    expect(screen.getByText('Cajero:')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Cliente:')).toBeInTheDocument();
    expect(screen.getByText('Sabrina Melizare')).toBeInTheDocument();
    expect(
        screen.getByText('Tomacorriente Doble 220V con un nombre particularmente largo')
    ).toBeInTheDocument();
    expect(screen.getByText('Descuento')).toBeInTheDocument();
    expect(screen.getByText('Impuestos')).toBeInTheDocument();
    expect(screen.getByText('PAGOS')).toBeInTheDocument();
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
    expect(screen.getByText('Mercado Pago')).toBeInTheDocument();
    expect(screen.getByText('Gracias por su compra')).toBeInTheDocument();
});

test('omits the customer, discount and taxes when the receipt does not contain them', () => {
    render(
        <TicketReceipt
            receipt={{
                ...receipt,
                customer: null,
                totals: { ...receipt.totals, discount: 0, tax: 0 },
            }}
        />
    );

    expect(screen.queryByText('Cliente:')).not.toBeInTheDocument();
    expect(screen.queryByText('Descuento')).not.toBeInTheDocument();
    expect(screen.queryByText('Impuestos')).not.toBeInTheDocument();
});

test('keeps long product and payment labels separate from large monetary amounts', () => {
    const longProduct = 'Destornillador plano profesional con mango reforzado y punta magnética';
    const longPaymentMethod = 'Transferencia bancaria Mercado Pago empresarial';

    render(
        <TicketReceipt
            receipt={{
                ...receipt,
                items: [
                    {
                        product_name: longProduct,
                        quantity: "12.0000",
                        unit_price: 128500,
                        subtotal: 1250000,
                        discount_amount: 0,
                        tax_amount: 0,
                    },
                ],
                totals: {
                    subtotal: 1250000,
                    tax: 0,
                    discount: 0,
                    total: 1250000,
                    paid_amount: 1250000,
                    pending_amount: 0,
                },
                payments: [{ method_name: longPaymentMethod, amount: 1250000 }],
            }}
        />
    );

    expect(screen.getByText(longProduct)).toHaveClass('ticket-receipt__item-name');
    expect(screen.getByText(/12 x/)).toHaveClass('ticket-receipt__item-meta');
    expect(screen.getAllByText(/1\.250\.000,00/).length).toBeGreaterThan(0);
    expect(screen.getByText(longPaymentMethod)).toHaveClass('ticket-receipt__payment-method');
    expect(screen.getByText('Gracias por su compra')).toBeInTheDocument();
});

test.each([
    ['3.0000', '3'],
    ['3.5000', '3,5'],
])('formats receipt quantity %s as %s', (quantity, displayedQuantity) => {
    render(
        <TicketReceipt
            receipt={{
                ...receipt,
                items: [
                    {
                        ...receipt.items[0],
                        quantity,
                    },
                ],
            }}
        />
    );

    expect(screen.getByText(new RegExp(`^${displayedQuantity} x`))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`${quantity} x`))).not.toBeInTheDocument();
});
