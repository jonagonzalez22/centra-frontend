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
            measurement_unit: { code: 'kg', symbol: 'kg' },
            sale_quantity_step: '0.2500',
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

const receiptWithItems = (count: number): ReceiptData => {
    const items = Array.from({ length: count }, (_, index) => ({
        product_name: `Producto de prueba ${index + 1} con nombre comercial`,
        quantity: '1.0000' as const,
        unit_price: 600,
        subtotal: 600,
        price_list_name: 'Mayorista',
        discount_percentage: 10,
        discount_amount: 60,
        tax_amount: 0,
        measurement_unit: { code: 'u', symbol: 'u' },
    }));

    return {
        ...receipt,
        items,
        totals: {
            subtotal: count * 600,
            tax: 0,
            discount: count * 60,
            total: count * 540,
            paid_amount: count * 540,
            pending_amount: 0,
        },
    };
};

const renderedPageCount = async (receiptData: ReceiptData): Promise<number> => {
    const [{ default: pdfMake }, { default: virtualFileSystem }] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
    ]);
    pdfMake.addVirtualFileSystem(virtualFileSystem);

    const pdfDocument = pdfMake.createPdf(buildA4Document(receiptData)) as unknown as {
        getStream: () => Promise<unknown>;
    };
    const stream = await pdfDocument.getStream();
    return (stream as unknown as { _pdfMakePages: unknown[] })._pdfMakePages.length;
};

test('builds the commercial A4 document from persisted receipt data', () => {
    const document = buildA4Document(receipt);
    const content = JSON.stringify(document.content);

    expect(document.pageSize).toBe('A4');
    expect(document.pageMargins).toEqual([32, 30, 32, 26]);
    expect(content).toContain('Ferretería San Miguel');
    expect(content).toContain('CUIT 20-32571370-5');
    expect(content).toContain('San Miguel 123');
    expect(content).toContain('COMPROBANTE DE VENTA');
    expect(content).toContain('N° V-000123');
    expect(content).toContain('19/09/2026 · 11:03');
    expect(content).toContain('Sabrina Melizare');
    expect(content).toContain('Juan Pérez');
    expect(content).toContain('Tomacorriente Doble 220V con un nombre particularmente largo');
    expect(content).toContain('"headerRows":1');
    expect(content).toContain('"dontBreakRows":true');
    expect(content).toContain('Descuento');
    expect(content).toContain('Impuestos');
    expect(content).toContain('FORMAS DE PAGO');
    expect(content).toContain('Efectivo');
    expect(content).toContain('Mercado Pago');
    expect(JSON.stringify(document.footer(1, 1))).toContain('Gracias por su compra');
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
    expect(content).not.toContain('-$ 500,00');
    expect(content).not.toContain('Impuestos');
});

test('emphasizes the customer name without adding a separate block', () => {
    const document = buildA4Document(receipt);
    const customerNode = document.content[2] as {
        text: Array<{ text: string; bold?: boolean; fontSize?: number }>;
    };

    expect(customerNode.text).toEqual([
        { text: 'Cliente: ', color: '#555555' },
        { text: 'Sabrina Melizare', bold: true, color: '#111111', fontSize: 9.5 },
    ]);
    expect(JSON.stringify(customerNode)).not.toContain('noWrap');
});

test('allows a long customer name to wrap naturally in the compact customer line', () => {
    const document = buildA4Document({
        ...receipt,
        customer: { display_name: 'Mora Carolina de los Ángeles Fernández de la Fuente' },
    });

    expect(JSON.stringify(document.content[2])).toContain(
        'Mora Carolina de los Ángeles Fernández de la Fuente'
    );
    expect(JSON.stringify(document.content[2])).not.toContain('noWrap');
});

test('uses persisted snapshots to show base, discount and final line amounts', () => {
    const document = buildA4Document({
        ...receipt,
        items: [
            {
                product_name: 'Esponja cocina',
                quantity: '2.0000',
                unit_price: 600,
                subtotal: 1200,
                price_list_id: 'mayorista-historica',
                price_list_name: 'Mayorista',
                discount_percentage: 10,
                discount_amount: 120,
                tax_amount: 0,
            },
        ],
        totals: {
            subtotal: 1200,
            tax: 0,
            discount: 120,
            total: 1080,
            paid_amount: 1080,
            pending_amount: 0,
        },
    });
    const productTable = document.content[3] as {
        table: { body: Array<Array<{ text?: string; stack?: Array<{ text: string }> }>> };
    };

    expect(productTable.table.body[0].map((cell) => cell.text)).toEqual([
        'Producto',
        'Cant.',
        'Precio unit.',
        'Descuento',
        'Total',
    ]);
    expect(productTable.table.body[1][0].stack?.map((node) => node.text)).toEqual([
        'Esponja cocina',
        'Mayorista · 10%',
    ]);
    expect(productTable.table.body[1].slice(2).map((cell) => cell.text)).toEqual([
        '$ 600,00',
        '-$ 120,00',
        '$ 1.080,00',
    ]);
});

test('uses the same five-column item layout when no line has a discount', () => {
    const document = buildA4Document({
        ...receipt,
        totals: { ...receipt.totals, discount: 0 },
    });
    const productTable = document.content[3] as {
        table: { body: Array<Array<{ text: string }>> };
    };

    expect(productTable.table.body[0].map((cell) => cell.text)).toEqual([
        'Producto',
        'Cant.',
        'Precio unit.',
        'Descuento',
        'Total',
    ]);
});

test('defines a compact header for subsequent pages and a numbered footer for every page', () => {
    const document = buildA4Document(receipt);

    expect(document.header(1)).toBeNull();
    expect(JSON.stringify(document.header(2))).toContain('Ferretería San Miguel');
    expect(JSON.stringify(document.header(2))).toContain('Venta V-000123');
    expect(JSON.stringify(document.footer(1, 3))).toContain('Página 1 de 3');
    expect(document.footer(1, 3)).toMatchObject({
        alignment: 'center',
        margin: [32, 0, 32, 8],
    });
});

test('uses compact vertical padding for product, total and payment blocks', () => {
    const document = buildA4Document(receipt);
    const productTable = document.content[3] as {
        layout: { paddingBottom: () => number; paddingTop: () => number };
    };
    const closing = document.content[4] as { stack: unknown[]; unbreakable: boolean };
    const paymentTable = closing.stack[3] as {
        layout: { paddingBottom: () => number; paddingTop: () => number };
    };

    expect(productTable.layout.paddingTop()).toBe(2.5);
    expect(productTable.layout.paddingBottom()).toBe(2.5);
    expect(paymentTable.layout.paddingTop()).toBe(1.5);
    expect(paymentTable.layout.paddingBottom()).toBe(1.5);
    expect(closing.unbreakable).toBe(true);
});

test.each([
    ['3.0000', '3 kg'],
    ['3.5000', '3,5 kg'],
    ['0.7500', '0,75 kg'],
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

test.each([
    [1, 1],
    [3, 1],
    [5, 1],
    [10, 1],
    [15, 1],
    [25, 2],
])('renders %i discounted products in %i A4 page(s)', async (itemCount, expectedPages) => {
    expect(await renderedPageCount(receiptWithItems(itemCount))).toBe(expectedPages);
}, 15_000);
