import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { createA4ReceiptPdf, printA4PdfBlob } from '../../documents/a4-pdf.service';
import { printTicketReceipt } from '../../documents/ticket-print.service';
import type { ReceiptData } from '../../interfaces/sale.interface';
import { SalesService } from '../../services/sales.service';
import { SaleSuccessModal } from './SaleSuccessModal';

vi.mock('../../services/sales.service', () => ({
    SalesService: { getReceipt: vi.fn() },
}));

vi.mock('../../documents/a4-pdf.service', () => ({
    createA4ReceiptPdf: vi.fn(),
    printA4PdfBlob: vi.fn(),
}));

vi.mock('../../documents/ticket-print.service', () => ({
    printTicketReceipt: vi.fn(),
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
    vi.mocked(SalesService.getReceipt).mockReset();
    vi.mocked(createA4ReceiptPdf).mockReset();
    vi.mocked(printA4PdfBlob).mockReset();
    vi.mocked(printTicketReceipt).mockReset();
});

test('closes the completed sale modal without affecting the registered sale', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
        <SaleSuccessModal sale={{ id: 'sale-1', operation_number: 'V-000123' }} onClose={onClose} />
    );

    expect(screen.getByText('Venta registrada')).toBeInTheDocument();
    expect(screen.getByText('V-000123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir ticket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir A4' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(SalesService.getReceipt).not.toHaveBeenCalled();
});

test('loads the persisted receipt and delegates ticket printing to the isolated service', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.getReceipt).mockResolvedValue(receipt);
    vi.mocked(printTicketReceipt).mockResolvedValue(undefined);

    render(
        <SaleSuccessModal sale={{ id: 'sale-1', operation_number: 'V-000123' }} onClose={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Imprimir ticket' }));

    await waitFor(() => expect(SalesService.getReceipt).toHaveBeenCalledWith('sale-1'));
    expect(printTicketReceipt).toHaveBeenCalledWith(receipt);
    expect(document.body).not.toHaveClass('receipt-print-mode-ticket');
});

test('generates the A4 PDF, then reuses the persisted receipt for ticket printing', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.getReceipt).mockResolvedValue(receipt);
    const pdfBlob = new Blob(['pdf'], { type: 'application/pdf' });
    vi.mocked(createA4ReceiptPdf).mockResolvedValue(pdfBlob);
    vi.mocked(printA4PdfBlob).mockResolvedValue(undefined);

    render(
        <SaleSuccessModal sale={{ id: 'sale-1', operation_number: 'V-000123' }} onClose={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Imprimir A4' }));

    await waitFor(() => expect(SalesService.getReceipt).toHaveBeenCalledWith('sale-1'));
    await waitFor(() => expect(createA4ReceiptPdf).toHaveBeenCalledWith(receipt));
    expect(printA4PdfBlob).toHaveBeenCalledWith(pdfBlob);
    vi.mocked(printTicketReceipt).mockResolvedValue(undefined);
    const ticketButton = screen.getByText('Imprimir ticket').closest('button');
    expect(ticketButton).not.toBeNull();
    await waitFor(() => expect(ticketButton).toBeEnabled());
    await user.click(ticketButton!);

    await waitFor(() => expect(SalesService.getReceipt).toHaveBeenCalledTimes(1));
    expect(printTicketReceipt).toHaveBeenCalledWith(receipt);
});

test('keeps the sale successful and allows retrying when A4 PDF generation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.getReceipt).mockResolvedValue(receipt);
    const pdfBlob = new Blob(['pdf'], { type: 'application/pdf' });
    vi.mocked(createA4ReceiptPdf).mockResolvedValue(pdfBlob);
    vi.mocked(printA4PdfBlob)
        .mockRejectedValueOnce(new Error('No se pudo abrir el PDF.'))
        .mockResolvedValueOnce(undefined);

    render(
        <SaleSuccessModal sale={{ id: 'sale-1', operation_number: 'V-000123' }} onClose={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Imprimir A4' }));

    expect(
        await screen.findByText(
            'La venta fue registrada, pero no se pudo generar el comprobante A4.'
        )
    ).toBeInTheDocument();
    expect(screen.getByText('Venta registrada')).toBeInTheDocument();

    const a4Button = screen.getByText('Imprimir A4').closest('button');
    expect(a4Button).not.toBeNull();
    await waitFor(() => expect(a4Button).toBeEnabled());
    await user.click(a4Button!);

    await waitFor(() => expect(SalesService.getReceipt).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(createA4ReceiptPdf).toHaveBeenCalledOnce());
    await waitFor(() => expect(printA4PdfBlob).toHaveBeenCalledTimes(2));
});

test('keeps the sale success state open and allows retrying when receipt loading fails', async () => {
    const user = userEvent.setup();
    vi.mocked(SalesService.getReceipt)
        .mockRejectedValueOnce({ message: 'No se pudo cargar el comprobante.' })
        .mockResolvedValueOnce(receipt);

    render(
        <SaleSuccessModal sale={{ id: 'sale-1', operation_number: 'V-000123' }} onClose={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Imprimir ticket' }));

    expect(
        await screen.findByText('La venta fue registrada, pero no se pudo imprimir el ticket.')
    ).toBeInTheDocument();
    expect(screen.getByText('Venta registrada')).toBeInTheDocument();

    const printButton = screen.getByText('Imprimir ticket').closest('button');
    expect(printButton).not.toBeNull();
    await waitFor(() => expect(printButton).toBeEnabled());
    await user.click(printButton!);
    await waitFor(() => expect(SalesService.getReceipt).toHaveBeenCalledTimes(2));
});
