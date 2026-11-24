import { buildPriceListDocument } from './buildPriceListDocument';
import type { PriceListExportData } from '../types/priceList.types';

const data: PriceListExportData = {
    store: {
        name: 'Comercial Centra',
        logo_url: null,
        phone: '2615550101',
        address: 'Av. Central 123',
    },
    pricing_mode: 'price_list',
    price_list: { id: 'list-1', name: 'Mayorista', discount_percentage: '10.00' },
    generated_at: '2026-11-23T10:00:00-03:00',
    products: [
        {
            id: 'product-1',
            name: 'Agua mineral',
            sku: 'AGUA-001',
            category: { id: 'category-1', name: 'Bebidas' },
            brand: null,
            measurement_unit: { code: 'l', name: 'Litro', symbol: 'L' },
            list_price: '10.05',
            discount_percentage: '10.00',
            discount_amount: '1.01',
            final_price: '9.04',
            commercial_available_quantity: '5.0000',
        },
    ],
    summary: { product_count: 1, excluded_product_count: 0, include_out_of_stock: true },
    excluded_product_ids: [],
};

test('builds an A4 commercial list using backend monetary values and full unit label', () => {
    const document = buildPriceListDocument(data, { groupByCategory: true });
    const serialized = JSON.stringify(document);

    expect(document.pageSize).toBe('A4');
    expect(serialized).toContain('Lista de precios — Mayorista');
    expect(serialized).toContain('Código: AGUA-001 · 1 litro');
    expect(serialized).toContain('$ 10,05');
    expect(serialized).toContain('$ 9,04');
    expect(serialized).not.toContain('IVA');
});

test('builds a two-column general-price table without discount columns or empty category header rows', () => {
    const document = buildPriceListDocument(
        { ...data, pricing_mode: 'general', price_list: null },
        { groupByCategory: true }
    );
    const table = document.content.find((node) => node.table)?.table as {
        body: unknown[][];
        widths: unknown[];
    };
    const serialized = JSON.stringify(document);

    expect(table.widths).toHaveLength(2);
    expect(table.body[0]).toHaveLength(2);
    expect(table.body[1]).toHaveLength(2);
    expect(serialized).toContain('Precios generales');
    expect(serialized).toContain('Bebidas');
    expect(serialized).not.toContain('Precio de lista');
    expect(serialized).not.toContain('Desc.');
    expect(serialized).not.toContain('Precio final');
});

test('uses independent category tables with complete headers', () => {
    const secondProduct = {
        ...data.products[0],
        id: 'product-2',
        name: 'Papel A4',
        category: { id: 'category-2', name: 'Papeles' },
    };
    const document = buildPriceListDocument(
        { ...data, products: [...data.products, secondProduct] },
        { groupByCategory: true }
    );
    const tables = document.content
        .filter((node) => node.table)
        .map((node) => node.table) as Array<{
        body: Array<Array<{ text?: string; stack?: unknown[] }>>;
        headerRows: number;
    }>;
    const firstCategoryNode = document.content.find((node) => node.table) as {
        layout: { fillColor: (rowIndex: number) => string | null };
    };

    expect(tables).toHaveLength(2);
    expect(tables.map((table) => table.body[0][0].text)).toEqual(['Bebidas', 'Papeles']);
    expect(tables.every((table) => table.headerRows === 2)).toBe(true);
    expect(tables[0].body[0][0]).toEqual(
        expect.objectContaining({ alignment: 'center', bold: true, fontSize: 10.5 })
    );
    expect(firstCategoryNode.layout.fillColor(0)).toBe('#e4e4e4');
    expect(firstCategoryNode.layout.fillColor(1)).toBe('#f2f2f2');
    expect(tables[1].body[1].map((cell) => cell.text)).toEqual([
        'Producto',
        'Precio de lista',
        'Desc.',
        'Precio final',
    ]);
    expect(tables[1].body[2][0].stack).toEqual(
        expect.arrayContaining([expect.objectContaining({ text: 'Papel A4' })])
    );
});

test('groups categories once and sorts categories and products alphabetically', () => {
    const products = [
        {
            ...data.products[0],
            id: '3',
            name: 'Zanahoria',
            category: { id: 'b', name: 'Verduras' },
        },
        { ...data.products[0], id: '1', name: 'Aceite', category: { id: 'a', name: 'Almacén' } },
        { ...data.products[0], id: '2', name: 'Agua', category: { id: 'a', name: 'Almacén' } },
        { ...data.products[0], id: '4', name: 'Sin rubro', category: null },
    ];
    const document = buildPriceListDocument({ ...data, products }, { groupByCategory: true });
    const tables = document.content
        .filter((node) => node.table)
        .map((node) => node.table) as Array<{
        body: Array<Array<{ stack?: Array<{ text: string }> }>>;
    }>;
    const categoryLabels = tables
        .map((table) => table.body[0][0] as unknown as { text: string })
        .map((cell) => cell.text);
    const productNames = tables.flatMap((table) =>
        table.body.slice(2).map((row) => row[0].stack?.[0].text)
    );

    expect(categoryLabels).toEqual(['Almacén', 'Sin categoría', 'Verduras']);
    expect(productNames).toEqual(['Aceite', 'Agua', 'Sin rubro', 'Zanahoria']);
});

test('sorts all products without category separators when grouping is disabled', () => {
    const products = [
        {
            ...data.products[0],
            id: '2',
            name: 'Zanahoria',
            category: { id: 'b', name: 'Verduras' },
        },
        { ...data.products[0], id: '1', name: 'Aceite', category: { id: 'a', name: 'Almacén' } },
    ];
    const document = buildPriceListDocument({ ...data, products }, { groupByCategory: false });
    const table = document.content.find((node) => node.table)?.table as {
        body: Array<Array<{ stack?: Array<{ text: string }> }>>;
    };
    const rows = table.body.slice(1).map((row) => row[0].stack ?? []);

    expect(rows.map((stack) => stack[0].text)).toEqual(['Aceite', 'Zanahoria']);
    expect(JSON.stringify(rows)).not.toContain('Almacén');
    expect(JSON.stringify(rows)).not.toContain('Verduras');
});

test('reserves the unique availability notice for the dynamic footer on the last page', () => {
    const products = Array.from({ length: 200 }, (_, index) => ({
        ...data.products[0],
        id: `product-${index}`,
        name: `Producto ${String(index).padStart(3, '0')}`,
    }));
    const document = buildPriceListDocument({ ...data, products }, { groupByCategory: true });
    const tables = document.content.filter((node) => node.table);
    const firstTable = tables[0].table as { body: unknown[][]; headerRows: number };
    const firstFooter = document.footer(1, 2);
    const lastFooter = document.footer(2, 2);

    expect(tables).toHaveLength(1);
    expect(firstTable.headerRows).toBe(2);
    expect(firstTable.body).toHaveLength(202);
    expect(JSON.stringify(firstFooter)).not.toContain('Precios informados a la fecha de emisión');
    expect(
        JSON.stringify(lastFooter).match(/Precios informados a la fecha de emisión/g)
    ).toHaveLength(1);
});

test.each([1, 50, 200, 1000])('builds a grouped document with %i products', (count) => {
    const products = Array.from({ length: count }, (_, index) => ({
        ...data.products[0],
        id: `product-${index}`,
        name: `Producto ${String(index).padStart(4, '0')}`,
        category: { id: 'category-1', name: 'Bebidas' },
    }));
    const document = buildPriceListDocument({ ...data, products }, { groupByCategory: true });
    const table = document.content.find((node) => node.table)?.table as { body: unknown[][] };

    expect(table.body).toHaveLength(count + 2);
});
