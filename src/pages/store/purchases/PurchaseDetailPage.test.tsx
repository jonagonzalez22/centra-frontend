import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PurchaseDetailPage } from './PurchaseDetailPage';
import { PurchasesService } from '@/features/store/purchases/purchases.service';

let canEdit = true;
let canCancel = true;
let canReceive = true;
let canClose = true;
vi.mock('@/features/store/purchases/purchases.service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/features/store/purchases/purchases.service')>()),
    PurchasesService: {
        getAll: vi.fn(),
        getById: vi.fn(),
        order: vi.fn(),
        cancel: vi.fn(),
        close: vi.fn(),
        downloadPdf: vi.fn(),
    },
}));
vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ permission, children }: { permission: string; children: React.ReactNode }) =>
        permission === 'purchases.edit'
            ? canEdit
                ? children
                : null
            : permission === 'purchases.cancel'
              ? canCancel
                  ? children
                  : null
              : permission === 'purchases.receive'
                ? canReceive
                    ? children
                    : null
                : permission === 'purchases.close'
                  ? canClose
                      ? children
                      : null
                  : children,
}));
const detail = {
    id: 'purchase-1',
    purchase_number: 'OC-000001',
    purchase_type: 'order' as const,
    status: 'draft' as const,
    supplier: { id: 's', business_name: 'Proveedor histórico', tax_id: null },
    total: '10.00',
    ordered_at: null,
    cancelled_at: null,
    created_at: '2026-10-20 10:00:00',
    notes: 'Nota histórica',
    items: [
        {
            id: 'i',
            product_id: 'p',
            product_name: 'Producto histórico',
            product_sku: 'SKU-H',
            supplier_code: 'EXT-H',
            supplier_product_name: null,
            measurement_unit_code: 'unit',
            measurement_unit_symbol: 'u',
            quantity_ordered: '2.0000',
            quantity_received: '0.0000',
            quantity_pending: '2.0000',
            unit_price: '5.00',
            subtotal: '10.00',
        },
    ],
};
const renderDetail = () =>
    render(
        <MemoryRouter initialEntries={['/tienda/compras/purchase-1']}>
            <Routes>
                <Route path="/tienda/compras/:id" element={<PurchaseDetailPage />} />
            </Routes>
        </MemoryRouter>
    );
const findActionButton = async (label: string) => {
    const button = (await screen.findByText(label)).closest('button');
    if (!button) throw new Error(`No se encontró el botón ${label}.`);

    return button;
};
describe('PurchaseDetailPage', () => {
    beforeEach(() => {
        canEdit = true;
        canCancel = true;
        canReceive = true;
        canClose = true;
        vi.mocked(PurchasesService.getById).mockResolvedValue(detail);
        vi.mocked(PurchasesService.downloadPdf).mockReset();
    });
    it('uses the standard spinner while the initial detail request is pending', async () => {
        let resolvePurchase!: (value: typeof detail) => void;
        vi.mocked(PurchasesService.getById).mockImplementationOnce(
            () =>
                new Promise<typeof detail>((resolve) => {
                    resolvePurchase = resolve;
                })
        );
        renderDetail();
        expect(screen.getByTestId('purchase-page-loading')).toBeInTheDocument();
        expect(screen.queryByText('Cargando compra...')).not.toBeInTheDocument();
        resolvePurchase(detail);
        expect(await screen.findByText('Producto histórico')).toBeInTheDocument();
    });
    it('renders historical snapshots and lifecycle actions', async () => {
        renderDetail();
        expect(await screen.findByText('Producto histórico')).toBeInTheDocument();
        expect(screen.getByText('Proveedor histórico')).toBeInTheDocument();
        expect(screen.getByText('SKU-H')).toBeInTheDocument();
        expect(screen.getByText('EXT-H')).toBeInTheDocument();
        expect(screen.getAllByText('2')).not.toHaveLength(0);
        expect(screen.queryByText('2.0000')).not.toBeInTheDocument();
        expect(screen.getByText('u')).toBeInTheDocument();
        expect(screen.getAllByText('$ 5,00')).not.toHaveLength(0);
        expect(screen.getAllByText('$ 10,00')).not.toHaveLength(0);
        expect(screen.getByText('Nota histórica')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Emitir orden' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar compra' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument();
    });
    it.each(['ordered', 'partially_received', 'received', 'closed', 'cancelled'] as const)(
        'keeps PDF download visible for order in %s',
        async (status) => {
            vi.mocked(PurchasesService.getById).mockResolvedValue({ ...detail, status });
            renderDetail();
            expect(
                await screen.findByRole('button', { name: 'Descargar PDF' })
            ).toBeInTheDocument();
        }
    );
    it('does not offer PDF download for direct purchases', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            purchase_type: 'direct',
        });
        renderDetail();
        await screen.findByText('Compra directa');
        expect(screen.queryByRole('button', { name: 'Descargar PDF' })).not.toBeInTheDocument();
        expect(screen.queryByText('Copiar mensaje')).not.toBeInTheDocument();
    });
    it.each(['draft', 'ordered'] as const)(
        'offers the WhatsApp message action for an order in %s',
        async (status) => {
            vi.mocked(PurchasesService.getById).mockResolvedValue({ ...detail, status });
            renderDetail();
            expect(await findActionButton('Copiar mensaje')).toBeInTheDocument();
        }
    );
    it.each(['draft', 'ordered'] as const)(
        'offers both WhatsApp actions for %s when the supplier has a phone',
        async (status) => {
            vi.mocked(PurchasesService.getById).mockResolvedValue({
                ...detail,
                status,
                supplier: { ...detail.supplier, phone: '+54 261 555-0100' },
            });
            renderDetail();
            fireEvent.click(await findActionButton('WhatsApp'));
            expect(await screen.findByText('Abrir WhatsApp')).toBeInTheDocument();
            expect(screen.getByText('Copiar mensaje')).toBeInTheDocument();
        }
    );
    it.each(['partially_received', 'received', 'closed', 'cancelled'] as const)(
        'does not offer a WhatsApp message for %s purchases',
        async (status) => {
            vi.mocked(PurchasesService.getById).mockResolvedValue({
                ...detail,
                status,
                supplier: { ...detail.supplier, phone: '+54 261 555-0100' },
            });
            renderDetail();
            await screen.findByText(
                status === 'partially_received'
                    ? 'Parcialmente recibida'
                    : status === 'received'
                      ? 'Recibida'
                      : status === 'closed'
                        ? 'Cerrada'
                        : 'Cancelada'
            );
            expect(screen.queryByText('Copiar mensaje')).not.toBeInTheDocument();
        }
    );
    it('copies the exact draft message when the supplier has no phone', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        renderDetail();
        fireEvent.click(await findActionButton('Copiar mensaje'));
        await waitFor(() =>
            expect(writeText).toHaveBeenCalledWith(
                expect.stringContaining(
                    'borrador de la OC-000001 para confirmar disponibilidad y precios'
                )
            )
        );
        expect(writeText).toHaveBeenCalledWith(
            expect.stringMatching(
                /• 2 unid\. · \[EXT-H\] · Producto histórico · \$\s5,00\/unid\. = \$\s10,00/
            )
        );
        expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/Total estimado: \$\s10,00/));
    });
    it('shows discreet feedback when copying the message fails', async () => {
        const feedback = vi.spyOn(message, 'error').mockImplementation(() => undefined as never);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) },
            configurable: true,
        });
        renderDetail();
        fireEvent.click(await findActionButton('Copiar mensaje'));
        await waitFor(() => expect(feedback).toHaveBeenCalledWith('No se pudo copiar el mensaje.'));
        expect(screen.getByRole('heading', { name: 'OC-000001' })).toBeInTheDocument();
    });
    it('opens wa.me with the encoded message when the current supplier has a phone', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            status: 'ordered',
            supplier: { ...detail.supplier, phone: '+54 261 555-0100' },
        });
        renderDetail();
        fireEvent.click(await findActionButton('WhatsApp'));
        fireEvent.click(await screen.findByText('Abrir WhatsApp'));
        expect(open).toHaveBeenCalledWith(
            expect.stringMatching(/^https:\/\/wa\.me\/542615550100\?text=/),
            '_blank',
            'noopener,noreferrer'
        );
    });
    it('keeps the supplier phone after emitting when the order response omits it', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            supplier: { ...detail.supplier, phone: '+54 261 555-0100' },
        });
        vi.mocked(PurchasesService.order).mockResolvedValue({ ...detail, status: 'ordered' });
        renderDetail();
        fireEvent.click(await screen.findByRole('button', { name: 'Emitir orden' }));
        const confirms = screen.getAllByRole('button', { name: 'Emitir orden' });
        fireEvent.click(confirms[confirms.length - 1]);
        await waitFor(() => expect(PurchasesService.order).toHaveBeenCalledWith('purchase-1'));
        expect(await findActionButton('WhatsApp')).toBeInTheDocument();
        fireEvent.click(await findActionButton('WhatsApp'));
        expect(await screen.findByText('Abrir WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Copiar mensaje')).toBeInTheDocument();
    });
    it('downloads the order PDF and prevents an accidental second click while loading', async () => {
        let resolveDownload!: (value: { blob: Blob; filename: string }) => void;
        vi.mocked(PurchasesService.downloadPdf).mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveDownload = resolve;
                })
        );
        const createObjectUrl = vi.fn(() => 'blob:purchase-pdf');
        const revokeObjectUrl = vi.fn();
        Object.defineProperty(URL, 'createObjectURL', {
            value: createObjectUrl,
            configurable: true,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            value: revokeObjectUrl,
            configurable: true,
        });
        renderDetail();
        const button = (await screen.findByText('Descargar PDF')).closest('button');
        if (!button) throw new Error('No se encontró el botón de descarga.');
        fireEvent.click(button);
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(PurchasesService.downloadPdf).toHaveBeenCalledTimes(1);
        resolveDownload({ blob: new Blob(['pdf']), filename: 'OC-000001-BORRADOR.pdf' });
        await waitFor(() => expect(button).not.toBeDisabled());
        expect(createObjectUrl).toHaveBeenCalled();
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:purchase-pdf');
    });
    it('keeps the detail open and shows a discreet error if the PDF download fails', async () => {
        const feedback = vi.spyOn(message, 'error').mockImplementation(() => undefined as never);
        vi.mocked(PurchasesService.downloadPdf).mockRejectedValueOnce(new Error('API error'));
        renderDetail();
        fireEvent.click(await screen.findByRole('button', { name: 'Descargar PDF' }));
        await waitFor(() =>
            expect(PurchasesService.downloadPdf).toHaveBeenCalledWith(
                'purchase-1',
                'OC-000001-BORRADOR.pdf'
            )
        );
        expect(feedback).toHaveBeenCalledWith('No se pudo descargar el PDF de la orden de compra.');
        expect(screen.getByRole('heading', { name: 'OC-000001' })).toBeInTheDocument();
    });
    it('renders supplier documents in the Purchase detail', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            documents: [
                {
                    id: 'document-1',
                    type: 'invoice',
                    number: 'A 0001-00001234',
                    issued_at: '2026-10-23',
                    total_amount: '125000.00',
                    notes: 'Factura proveedor',
                    created_at: '2026-10-23 10:00:00',
                    created_by: { id: 'user-1', name: 'Ana' },
                },
            ],
        });
        renderDetail();
        expect(
            await screen.findByRole('heading', { name: 'Documentos del proveedor' })
        ).toBeInTheDocument();
        expect(screen.getAllByText('A 0001-00001234')).not.toHaveLength(0);
        expect(screen.getAllByText('Factura proveedor')).not.toHaveLength(0);
        expect(screen.getAllByText(/125\.000,00/)).not.toHaveLength(0);
    });
    it('keeps significant decimal quantity digits in the local format', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            items: [{ ...detail.items[0], quantity_ordered: '1.5000' }],
        });
        renderDetail();
        expect(await screen.findByText('1,5')).toBeInTheDocument();
        expect(screen.queryByText('1.5000')).not.toBeInTheDocument();
    });
    it('confirms order and refreshes detail', async () => {
        vi.mocked(PurchasesService.order).mockResolvedValue({ ...detail, status: 'ordered' });
        renderDetail();
        fireEvent.click(await screen.findByRole('button', { name: 'Emitir orden' }));
        const confirms = screen.getAllByText('Emitir orden');
        fireEvent.click(confirms[confirms.length - 1]);
        await waitFor(() => expect(PurchasesService.order).toHaveBeenCalledWith('purchase-1'));
        expect(await screen.findByText('Ordenada')).toBeInTheDocument();
    });
    it('hides order for direct drafts and respects action permissions', async () => {
        canEdit = false;
        canCancel = false;
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            purchase_type: 'direct',
        });
        renderDetail();
        await screen.findByText('Compra directa');
        expect(screen.queryByRole('button', { name: 'Emitir orden' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancelar compra' })).not.toBeInTheDocument();
    });
    it('hides draft edit and Emitir orden without purchases.edit while retaining permitted cancellation', async () => {
        canEdit = false;
        renderDetail();
        await screen.findByRole('heading', { name: 'OC-000001' });
        expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Emitir orden' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar compra' })).toBeInTheDocument();
    });
    it('hides Cancelar compra without purchases.cancel', async () => {
        canCancel = false;
        renderDetail();
        await screen.findByRole('heading', { name: 'OC-000001' });
        expect(screen.getByRole('button', { name: 'Emitir orden' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancelar compra' })).not.toBeInTheDocument();
    });
    it('shows Registrar recepción only in receivable states and with its permission', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({ ...detail, status: 'ordered' });
        renderDetail();
        expect(
            await screen.findByRole('button', { name: 'Registrar recepción' })
        ).toBeInTheDocument();
    });
    it('hides Registrar recepción without purchases.receive', async () => {
        canReceive = false;
        vi.mocked(PurchasesService.getById).mockResolvedValue({ ...detail, status: 'ordered' });
        renderDetail();
        await screen.findByText('Ordenada');
        expect(
            screen.queryByRole('button', { name: 'Registrar recepción' })
        ).not.toBeInTheDocument();
    });
    it('shows Cerrar compra only for partially received purchases with purchases.close', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            status: 'partially_received',
        });
        renderDetail();
        expect(await screen.findByRole('button', { name: 'Cerrar compra' })).toBeInTheDocument();
    });
    it('hides Cerrar compra without purchases.close', async () => {
        canClose = false;
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            status: 'partially_received',
        });
        renderDetail();
        await screen.findByText('Parcialmente recibida');
        expect(screen.queryByRole('button', { name: 'Cerrar compra' })).not.toBeInTheDocument();
    });
    it('confirms closing, preserves pending history, and removes lifecycle actions after success', async () => {
        const partiallyReceived = {
            ...detail,
            status: 'partially_received' as const,
            items: [
                { ...detail.items[0], quantity_received: '1.0000', quantity_pending: '1.0000' },
            ],
            receipts: [
                {
                    id: 'receipt-1',
                    receipt_number: 'REC-000001',
                    received_at: '2026-10-21 10:00:00',
                    created_at: '2026-10-21 10:00:00',
                    notes: null,
                    items: [],
                },
            ],
        };
        vi.mocked(PurchasesService.getById).mockResolvedValue(partiallyReceived);
        vi.mocked(PurchasesService.close).mockResolvedValue({
            ...partiallyReceived,
            status: 'closed',
        });
        renderDetail();
        fireEvent.click(await screen.findByRole('button', { name: 'Cerrar compra' }));
        expect(await screen.findByText(/nuevas recepciones para esta orden/i)).toBeInTheDocument();
        expect(screen.getByText('Hay 1 producto con cantidades pendientes.')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Volver'));
        expect(PurchasesService.close).not.toHaveBeenCalled();
        fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar compra' })[0]);
        const confirms = screen.getAllByRole('button', { name: 'Cerrar compra' });
        fireEvent.click(confirms[confirms.length - 1]);
        await waitFor(() => expect(PurchasesService.close).toHaveBeenCalledWith('purchase-1'));
        expect(await screen.findByText('Cerrada')).toBeInTheDocument();
        expect(screen.getAllByText('1')).not.toHaveLength(0);
        expect(
            screen.queryByRole('button', { name: 'Registrar recepción' })
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cerrar compra' })).not.toBeInTheDocument();
        expect(screen.getByText('REC-000001')).toBeInTheDocument();
    });
    it('keeps close available after a backend error', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            status: 'partially_received',
        });
        vi.mocked(PurchasesService.close).mockRejectedValue({
            response: {
                data: { message: 'Esta compra ya no puede cerrarse porque su estado cambió.' },
            },
        });
        renderDetail();
        fireEvent.click(await screen.findByRole('button', { name: 'Cerrar compra' }));
        const confirms = screen.getAllByRole('button', { name: 'Cerrar compra' });
        fireEvent.click(confirms[confirms.length - 1]);
        await waitFor(() => expect(PurchasesService.close).toHaveBeenCalledWith('purchase-1'));
        expect(screen.getByRole('button', { name: 'Cerrar compra' })).toBeInTheDocument();
    });
    it('shows cancellation only for draft or ordered purchases and confirms it', async () => {
        vi.mocked(PurchasesService.cancel).mockResolvedValue({ ...detail, status: 'cancelled' });
        renderDetail();
        fireEvent.click(await screen.findByRole('button', { name: 'Cancelar compra' }));
        fireEvent.click(screen.getByText('Volver'));
        expect(PurchasesService.cancel).not.toHaveBeenCalled();
        fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar compra' })[0]);
        const confirms = screen.getAllByRole('button', { name: 'Cancelar compra' });
        fireEvent.click(confirms[confirms.length - 1]);
        await waitFor(() => expect(PurchasesService.cancel).toHaveBeenCalledWith('purchase-1'));
        expect(await screen.findByText('Cancelada')).toBeInTheDocument();
    });
    it('shows the standard feedback when cancellation fails', async () => {
        const feedback = vi.spyOn(message, 'error').mockImplementation(() => undefined as never);
        vi.mocked(PurchasesService.cancel).mockRejectedValue(new Error('API error'));
        renderDetail();
        fireEvent.click(await screen.findByRole('button', { name: 'Cancelar compra' }));
        const confirms = screen.getAllByRole('button', { name: 'Cancelar compra' });
        fireEvent.click(confirms[confirms.length - 1]);
        await waitFor(() => expect(PurchasesService.cancel).toHaveBeenCalledWith('purchase-1'));
        expect(feedback).toHaveBeenCalledWith('No se pudo cancelar la compra.');
    });
    it('keeps cancellation available for ordered purchases but no longer allows editing or ordering', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({ ...detail, status: 'ordered' });
        renderDetail();
        await screen.findByText('Ordenada');
        expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Emitir orden' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar compra' })).toBeInTheDocument();
    });
    it.each(['partially_received', 'received', 'closed', 'cancelled'] as const)(
        'keeps receipt action only while %s is receivable',
        async (status) => {
            vi.mocked(PurchasesService.getById).mockResolvedValue({ ...detail, status });
            renderDetail();
            await screen.findByText(
                status === 'partially_received'
                    ? 'Parcialmente recibida'
                    : status === 'received'
                      ? 'Recibida'
                      : status === 'closed'
                        ? 'Cerrada'
                        : 'Cancelada'
            );
            expect(screen.queryByRole('button', { name: 'Emitir orden' })).not.toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: 'Cancelar compra' })
            ).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Registrar recepción' })).toBe(
                status === 'partially_received'
                    ? screen.getByRole('button', { name: 'Registrar recepción' })
                    : null
            );
        }
    );
    it('keeps direct drafts consultable, cancelable, and ready to receive', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            purchase_type: 'direct',
        });
        renderDetail();
        await screen.findByText('Compra directa');
        expect(screen.queryByRole('button', { name: 'Emitir orden' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar compra' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Registrar recepción' })).toBeInTheDocument();
    });
    it('renders immutable receipt history and quantity breakdown', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...detail,
            receipts: [
                {
                    id: 'receipt-1',
                    receipt_number: 'REC-000001',
                    received_at: '2026-10-21 10:00:00',
                    created_at: '2026-10-21 10:00:00',
                    notes: 'Ingreso parcial',
                    created_by: { id: 'user-1', name: 'Ana' },
                    items: [
                        {
                            id: 'receipt-item-1',
                            purchase_item_id: 'i',
                            product_id: 'p',
                            product_name: 'Producto histórico',
                            product_sku: 'SKU-H',
                            measurement_unit_code: 'unit',
                            measurement_unit_symbol: 'u',
                            quantity_received: '1.5000',
                        },
                    ],
                },
            ],
        });
        renderDetail();
        expect(await screen.findByText('REC-000001')).toBeInTheDocument();
        fireEvent.click(screen.getByText('REC-000001'));
        expect(await screen.findByText('Ingreso parcial')).toBeInTheDocument();
        expect(screen.getByText('1,5')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /editar recepción|eliminar recepción/i })
        ).not.toBeInTheDocument();
    });
});
