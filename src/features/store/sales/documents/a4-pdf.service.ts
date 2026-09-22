import type { ReceiptData } from '../interfaces/sale.interface';
import { buildA4Document } from './buildA4Document';

const PRINT_CLEANUP_TIMEOUT_MS = 60_000;

export const createA4ReceiptPdf = async (receipt: ReceiptData): Promise<Blob> => {
    const [{ default: pdfMake }, { default: virtualFileSystem }] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
    ]);

    pdfMake.addVirtualFileSystem(virtualFileSystem);

    return pdfMake.createPdf(buildA4Document(receipt)).getBlob();
};

export const printA4PdfBlob = (pdfBlob: Blob): Promise<void> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(pdfBlob);
        const iframe = document.createElement('iframe');
        let completed = false;
        let printWindow: Window | null = null;

        const cleanup = () => {
            if (completed) return;

            completed = true;
            window.clearTimeout(cleanupTimer);
            window.removeEventListener('afterprint', cleanup);
            printWindow?.removeEventListener('afterprint', cleanup);
            iframe.remove();
            URL.revokeObjectURL(url);
        };

        const fail = (error: Error) => {
            cleanup();
            reject(error);
        };

        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.border = '0';
        iframe.style.height = '0';
        iframe.style.position = 'fixed';
        iframe.style.visibility = 'hidden';
        iframe.style.width = '0';

        iframe.addEventListener(
            'load',
            () => {
                try {
                    printWindow = iframe.contentWindow;

                    if (!printWindow) {
                        fail(new Error('No se pudo preparar la impresión del comprobante A4.'));
                        return;
                    }

                    printWindow.addEventListener('afterprint', cleanup, { once: true });
                    printWindow.focus();
                    printWindow.print();
                    resolve();
                } catch {
                    fail(new Error('No se pudo iniciar la impresión del comprobante A4.'));
                }
            },
            { once: true }
        );

        window.addEventListener('afterprint', cleanup, { once: true });
        const cleanupTimer = window.setTimeout(cleanup, PRINT_CLEANUP_TIMEOUT_MS);
        iframe.src = url;
        document.body.appendChild(iframe);
    });
