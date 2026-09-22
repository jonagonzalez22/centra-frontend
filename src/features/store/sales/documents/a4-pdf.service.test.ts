import { afterEach, beforeEach, vi } from 'vitest';
import type { ReceiptData } from '../interfaces/sale.interface';
import { createA4ReceiptPdf, printA4PdfBlob } from './a4-pdf.service';

const addVirtualFileSystem = vi.fn();
const getBlob = vi.fn();
const createPdf = vi.fn(() => ({ getBlob }));
const virtualFileSystem = { 'Roboto-Regular.ttf': 'font-data' };

vi.mock('pdfmake/build/pdfmake', () => ({
    default: { addVirtualFileSystem, createPdf },
}));

vi.mock('pdfmake/build/vfs_fonts', () => ({
    default: virtualFileSystem,
}));

const receipt: ReceiptData = {
    store: {
        name: 'Ferretería San Miguel',
        cuit: null,
        address: null,
        city: null,
        state: null,
        timezone: 'America/Argentina/Buenos_Aires',
    },
    operation: {
        id: 'sale-1',
        operation_number: 'V-000123',
        type: 'sale',
        status: 'confirmed',
        occurred_at: '2026-09-19T11:03:41-03:00',
        cashier: null,
    },
    customer: null,
    items: [],
    totals: { subtotal: 0, tax: 0, discount: 0, total: 0, paid_amount: 0, pending_amount: 0 },
    payments: [],
};

beforeEach(() => {
    addVirtualFileSystem.mockReset();
    createPdf.mockClear();
    getBlob.mockReset();
    getBlob.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
});

afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('iframe').forEach((iframe) => iframe.remove());
});

test('loads the pdfmake virtual fonts and generates an A4 PDF blob', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    getBlob.mockResolvedValue(blob);

    await expect(createA4ReceiptPdf(receipt)).resolves.toBe(blob);

    expect(addVirtualFileSystem).toHaveBeenCalledWith(virtualFileSystem);
    expect(createPdf).toHaveBeenCalledWith(
        expect.objectContaining({
            pageSize: 'A4',
            pageMargins: [45, 52, 45, 54],
        })
    );
    expect(getBlob).toHaveBeenCalledOnce();
});

test('prints from a temporary iframe and cleans its blob URL after printing', async () => {
    const createObjectURL = vi.fn(() => 'blob:receipt-a4');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const focus = vi.fn();
    const print = vi.fn();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue({
        addEventListener,
        focus,
        print,
        removeEventListener,
    } as unknown as Window);

    const printing = printA4PdfBlob(new Blob(['pdf'], { type: 'application/pdf' }));
    const iframe = document.querySelector('iframe');

    expect(iframe).toBeInTheDocument();
    iframe?.dispatchEvent(new Event('load'));
    await expect(printing).resolves.toBeUndefined();

    expect(focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
    expect(addEventListener).toHaveBeenCalledWith('afterprint', expect.any(Function), {
        once: true,
    });

    window.dispatchEvent(new Event('afterprint'));

    expect(document.querySelector('iframe')).not.toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:receipt-a4');
});

test('surfaces PDF generation failures to the caller', async () => {
    getBlob.mockRejectedValueOnce(new Error('No se pudo generar el PDF.'));

    await expect(createA4ReceiptPdf(receipt)).rejects.toThrow('No se pudo generar el PDF.');
});
