import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import ticketPrintStyles from '../components/TicketReceipt/TicketReceipt.css?inline';
import { TicketReceipt } from '../components/TicketReceipt';
import type { ReceiptData } from '../interfaces/sale.interface';

const PRINT_CLEANUP_TIMEOUT_MS = 60_000;

const createTicketDocument = (iframe: HTMLIFrameElement): Document => {
    const document = iframe.contentDocument;

    if (!document) {
        throw new Error('No se pudo preparar la impresión del ticket.');
    }

    document.open();
    document.write(
        '<!doctype html><html><head></head><body><div id="ticket-print-root"></div></body></html>'
    );
    document.close();

    const style = document.createElement('style');
    style.textContent = ticketPrintStyles;
    document.head.appendChild(style);

    return document;
};

export const printTicketReceipt = (receipt: ReceiptData): Promise<void> =>
    new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        let root: Root | null = null;
        let printWindow: Window | null = null;
        let completed = false;
        let cleanupTimer: number | undefined;

        const cleanup = () => {
            if (completed) return;

            completed = true;
            if (cleanupTimer !== undefined) window.clearTimeout(cleanupTimer);
            window.removeEventListener('afterprint', cleanup);
            printWindow?.removeEventListener('afterprint', cleanup);
            root?.unmount();
            iframe.remove();
        };

        const fail = (error: Error) => {
            cleanup();
            reject(error);
        };

        try {
            iframe.setAttribute('aria-hidden', 'true');
            iframe.style.border = '0';
            iframe.style.height = '0';
            iframe.style.position = 'fixed';
            iframe.style.visibility = 'hidden';
            iframe.style.width = '0';
            document.body.appendChild(iframe);

            const ticketDocument = createTicketDocument(iframe);
            printWindow = iframe.contentWindow;
            const mountNode = ticketDocument.getElementById('ticket-print-root');

            if (!printWindow || !mountNode) {
                fail(new Error('No se pudo preparar la impresión del ticket.'));
                return;
            }

            root = createRoot(mountNode);
            flushSync(() => root?.render(<TicketReceipt receipt={receipt} />));

            printWindow.addEventListener('afterprint', cleanup, { once: true });
            window.addEventListener('afterprint', cleanup, { once: true });
            cleanupTimer = window.setTimeout(cleanup, PRINT_CLEANUP_TIMEOUT_MS);

            const requestFrame =
                printWindow.requestAnimationFrame?.bind(printWindow) ??
                window.requestAnimationFrame.bind(window);

            requestFrame(() => {
                try {
                    printWindow?.focus();
                    printWindow?.print();
                    resolve();
                } catch {
                    fail(new Error('No se pudo iniciar la impresión del ticket.'));
                }
            });
        } catch {
            fail(new Error('No se pudo preparar la impresión del ticket.'));
        }
    });
