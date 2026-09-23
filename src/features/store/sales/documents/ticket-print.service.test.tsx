import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { ReceiptData } from '../interfaces/sale.interface';
import { printTicketReceipt } from './ticket-print.service';

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

const setupIframeWindow = (print = vi.fn()) => {
    const iframeWindow = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        focus: vi.fn(),
        print,
        requestAnimationFrame: (callback: FrameRequestCallback) => {
            callback(0);
            return 1;
        },
    } as unknown as Window;

    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue(iframeWindow);

    return { iframeWindow, print };
};

beforeEach(() => {
    vi.restoreAllMocks();
});

afterEach(() => {
    document.querySelectorAll('iframe').forEach((iframe) => iframe.remove());
    vi.restoreAllMocks();
});

test('renders the ticket in a temporary iframe without changing the host document print mode', async () => {
    const { iframeWindow, print } = setupIframeWindow();
    const hostRoot = document.createElement('div');
    hostRoot.id = 'root';
    document.body.appendChild(hostRoot);

    const printing = printTicketReceipt(receipt);
    const iframe = document.querySelector('iframe');

    expect(iframe).toBeInTheDocument();
    expect(iframe?.contentDocument?.getElementById('ticket-print-root')).toBeInTheDocument();
    expect(
        iframe?.contentDocument?.querySelector('[data-testid="ticket-receipt"]')
    ).toHaveTextContent('Ferretería San Miguel');
    expect(iframe?.contentDocument?.querySelector('style')).toBeInTheDocument();
    expect(document.body).not.toHaveClass('receipt-print-mode-ticket');
    expect(document.body).not.toHaveStyle({ width: '58mm' });
    expect(hostRoot).not.toHaveStyle({ display: 'none' });

    await expect(printing).resolves.toBeUndefined();
    expect(iframeWindow.focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
    expect(iframeWindow.addEventListener).toHaveBeenCalledWith('afterprint', expect.any(Function), {
        once: true,
    });

    window.dispatchEvent(new Event('afterprint'));

    expect(document.querySelector('iframe')).not.toBeInTheDocument();
    hostRoot.remove();
});

test('cleans the iframe when printing fails', async () => {
    setupIframeWindow(
        vi.fn(() => {
            throw new Error('print failed');
        })
    );

    await expect(printTicketReceipt(receipt)).rejects.toThrow(
        'No se pudo iniciar la impresión del ticket.'
    );

    expect(document.querySelector('iframe')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('receipt-print-mode-ticket');
});
