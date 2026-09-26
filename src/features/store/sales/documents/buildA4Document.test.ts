import type { ReceiptData } from '../interfaces/sale.interface';
import { buildA4Document } from './buildA4Document';

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

test('builds the commercial A4 document from persisted receipt data', () => {
    const document = buildA4Document(receipt);
    const content = JSON.stringify(document.content);

    expect(document.pageSize).toBe('A4');
    expect(document.pageMargins).toEqual([45, 52, 45, 54]);
    expect(content).toContain('Ferretería San Miguel');
    expect(content).toContain('CUIT 20-32571370-5');
    expect(content).toContain('San Miguel 123');
    expect(content).toContain('COMPROBANTE DE VENTA');
    expect(content).toContain('Nro. de venta: V-000123');
    expect(content).toContain('Fecha: 19/09/2026');
    expect(content).toContain('Hora: 11:03');
    expect(content).toContain('Sabrina Melizare');
    expect(content).toContain('Juan Pérez');
    expect(content).toContain('Tomacorriente Doble 220V con un nombre particularmente largo');
    expect(content).toContain('"headerRows":1');
    expect(content).toContain('"dontBreakRows":true');
    expect(content).toContain('Descuento');
    expect(content).toContain('Impuestos');
    expect(content).toContain('FORMAS DE PAGO');
    expect(content).toContain('"Método"');
    expect(content).toContain('"Importe"');
    expect(content).toContain('Efectivo');
    expect(content).toContain('Mercado Pago');
    expect(content).toContain('GRACIAS POR SU COMPRA');
});

test('omits optional customer, discount and tax nodes when they do not apply', () => {
    const document = buildA4Document({
        ...receipt,
        customer: null,
        totals: { ...receipt.totals, discount: 0, tax: 0 },
    });
    const content = JSON.stringify(document.content);

    expect(content).not.toContain('Sabrina Melizare');
    expect(content).not.toContain('Consumidor final');
    expect(content).not.toContain('Descuento');
    expect(content).not.toContain('Impuestos');
});

test('defines a compact header for subsequent pages and a numbered footer for every page', () => {
    const document = buildA4Document(receipt);

    expect(document.header(1)).toBeNull();
    expect(JSON.stringify(document.header(2))).toContain('Ferretería San Miguel');
    expect(JSON.stringify(document.header(2))).toContain('Venta V-000123');
    expect(JSON.stringify(document.footer(1, 3))).toContain('Página 1 de 3');
});

test('uses compact vertical padding for product and payment tables only', () => {
    const document = buildA4Document(receipt);
    const productTable = document.content[3] as {
        layout: { paddingBottom: () => number; paddingTop: () => number };
    };
    const paymentTable = (document.content[4] as { stack: unknown[] }).stack[3] as {
        layout: { paddingBottom: () => number; paddingTop: () => number };
    };

    expect(productTable.layout.paddingTop()).toBe(3);
    expect(productTable.layout.paddingBottom()).toBe(3);
    expect(paymentTable.layout.paddingTop()).toBe(3);
    expect(paymentTable.layout.paddingBottom()).toBe(3);
});

test.each([
    ['3.0000', '3'],
    ['3.5000', '3,5'],
])('formats A4 quantity %s as %s', (quantity, displayedQuantity) => {
    const document = buildA4Document({
        ...receipt,
        items: [
            {
                ...receipt.items[0],
                quantity,
            },
        ],
    });
    const productTable = document.content[3] as {
        table: { body: Array<Array<{ text: string }>> };
    };

    expect(productTable.table.body[1][1].text).toBe(displayedQuantity);
});
