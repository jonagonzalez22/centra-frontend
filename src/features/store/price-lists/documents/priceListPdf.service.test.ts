import { afterEach, beforeEach, vi } from 'vitest';
import type { PriceListExportData } from '../types/priceList.types';
import { createPriceListPdf } from './priceListPdf.service';

const addVirtualFileSystem = vi.fn();
const getBlob = vi.fn();
const createPdf = vi.fn(() => ({ getBlob }));
const virtualFileSystem = { 'Roboto-Regular.ttf': 'font-data' };

vi.mock('pdfmake/build/pdfmake', () => ({
    default: { addVirtualFileSystem, createPdf },
}));
vi.mock('pdfmake/build/vfs_fonts', () => ({ default: virtualFileSystem }));

const data: PriceListExportData = {
    store: {
        name: 'Comercial Centra',
        logo_url: 'https://cdn.example.test/logo.png',
        phone: '2615550101',
        address: 'Av. Central 123',
    },
    pricing_mode: 'price_list',
    price_list: { id: 'list-1', name: 'Mayorista', discount_percentage: '10.00' },
    generated_at: '2026-11-24T10:00:00-03:00',
    products: [],
    summary: { product_count: 0, excluded_product_count: 0, include_out_of_stock: true },
    excluded_product_ids: [],
};

beforeEach(() => {
    addVirtualFileSystem.mockReset();
    createPdf.mockClear();
    getBlob.mockReset();
    getBlob.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
});

afterEach(() => vi.unstubAllGlobals());

test('generates the price-list PDF without requesting the store logo', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    await createPriceListPdf(data, { groupByCategory: true });

    expect(fetch).not.toHaveBeenCalled();
    expect(addVirtualFileSystem).toHaveBeenCalledWith(virtualFileSystem);
    expect(createPdf).toHaveBeenCalledWith(
        expect.objectContaining({
            content: expect.arrayContaining([
                expect.objectContaining({
                    stack: expect.arrayContaining([
                        expect.objectContaining({ text: 'Comercial Centra' }),
                        expect.objectContaining({ text: '2615550101 · Av. Central 123' }),
                    ]),
                }),
            ]),
        })
    );
    expect(getBlob).toHaveBeenCalledOnce();
});

test('uses the same logo-free builder for general prices', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    await createPriceListPdf(
        { ...data, pricing_mode: 'general', price_list: null },
        { groupByCategory: false }
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(createPdf).toHaveBeenCalledWith(
        expect.objectContaining({
            content: expect.arrayContaining([
                expect.objectContaining({ text: 'Lista de precios — Precios generales' }),
            ]),
        })
    );
});
