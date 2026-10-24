import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { message } from 'antd';
import { PurchaseDocumentsSection } from './PurchaseDocumentsSection';
import {
    PurchasesService,
    type PurchaseDocument,
    type PurchaseStatus,
} from '@/features/store/purchases/purchases.service';

vi.mock('@/features/store/purchases/purchases.service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/features/store/purchases/purchases.service')>()),
    PurchasesService: { createDocument: vi.fn(), updateDocument: vi.fn(), deleteDocument: vi.fn() },
}));
vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/Modal/Modal', () => ({
    default: ({
        open,
        title,
        children,
        footer,
    }: {
        open: boolean;
        title: string;
        children: ReactNode;
        footer: ReactNode;
    }) =>
        open ? (
            <div role="dialog" aria-label={title}>
                <h2>{title}</h2>
                {children}
                {footer}
            </div>
        ) : null,
}));

const doc: PurchaseDocument = {
    id: 'doc-1',
    type: 'invoice',
    number: 'A 0001-00001234',
    issued_at: '2026-10-23',
    total_amount: '125000.00',
    notes: 'Factura original',
    created_at: '2026-10-23T12:00:00Z',
    created_by: { id: 'user-1', name: 'Ana' },
};
const renderSection = (
    status: PurchaseStatus = 'ordered',
    initialDocuments: PurchaseDocument[] = []
) =>
    render(
        <PurchaseDocumentsSection
            purchaseId="purchase-1"
            status={status}
            initialDocuments={initialDocuments}
        />
    );

describe('PurchaseDocumentsSection', () => {
    beforeEach(() => {
        vi.mocked(PurchasesService.createDocument).mockReset();
        vi.mocked(PurchasesService.updateDocument).mockReset();
        vi.mocked(PurchasesService.deleteDocument).mockReset();
    });

    it('shows an informational empty state and opens the add form', () => {
        renderSection();
        expect(
            screen.getByText('No hay documentos del proveedor registrados.')
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
        expect(screen.getByLabelText('Número')).toBeInTheDocument();
        expect(screen.getByLabelText('Fecha de emisión')).toBeInTheDocument();
        expect(screen.getByLabelText(/Importe total/)).toBeInTheDocument();
        expect(screen.getByLabelText('Notas')).toBeInTheDocument();
    });

    it('requires invoice amount and renders a successful create', async () => {
        vi.mocked(PurchasesService.createDocument).mockResolvedValueOnce(doc);
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'A 0001-00001234' } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));
        await waitFor(() =>
            expect(screen.getByText('Ingresá el importe total.')).toBeInTheDocument()
        );
        expect(PurchasesService.createDocument).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText(/Importe total/), {
            target: { value: '125000,00' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));
        await waitFor(() =>
            expect(PurchasesService.createDocument).toHaveBeenCalledWith(
                'purchase-1',
                expect.objectContaining({
                    type: 'invoice',
                    number: 'A 0001-00001234',
                    total_amount: '125000.00',
                    issued_at: '2026-10-24',
                })
            )
        );
        expect((await screen.findAllByText('A 0001-00001234')).length).toBeGreaterThan(0);
    });

    it.each(['0', '0.00', '0,00', '-1'])('rejects %s as an invoice amount', async (amount) => {
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'FC-A-1234' } });
        fireEvent.change(screen.getByLabelText(/Importe total/), { target: { value: amount } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));

        await waitFor(() =>
            expect(
                screen.getByText(/Ingresá el importe|Ingresá un importe mayor a cero/)
            ).toBeInTheDocument()
        );
        expect(PurchasesService.createDocument).not.toHaveBeenCalled();
    });

    it('allows a delivery note without an amount', async () => {
        vi.mocked(PurchasesService.createDocument).mockResolvedValueOnce({
            ...doc,
            type: 'delivery_note',
            number: 'REM-00001',
            total_amount: null,
        });
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        fireEvent.mouseDown(screen.getByLabelText('Tipo'));
        fireEvent.click(await screen.findByText('Remito'));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'REM-00001' } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));
        await waitFor(() =>
            expect(PurchasesService.createDocument).toHaveBeenCalledWith(
                'purchase-1',
                expect.objectContaining({ type: 'delivery_note', total_amount: null })
            )
        );
        expect((await screen.findAllByText('REM-00001')).length).toBeGreaterThan(0);
    });

    it('rejects zero when a delivery note amount is supplied', async () => {
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        fireEvent.mouseDown(screen.getByLabelText('Tipo'));
        fireEvent.click(await screen.findByText('Remito'));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'REM-00001' } });
        fireEvent.change(screen.getByLabelText(/Importe total/), { target: { value: '0,00' } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));

        await waitFor(() =>
            expect(
                screen.getByText('Ingresá un importe mayor a cero con hasta 2 decimales.')
            ).toBeInTheDocument()
        );
        expect(PurchasesService.createDocument).not.toHaveBeenCalled();
    });

    it('requires an amount after changing a delivery note to an invoice', async () => {
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        fireEvent.mouseDown(screen.getByLabelText('Tipo'));
        fireEvent.click(await screen.findByText('Remito'));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'REM-00001' } });
        fireEvent.mouseDown(screen.getByLabelText('Tipo'));
        fireEvent.click(await screen.findByText('Factura'));
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));

        await waitFor(() =>
            expect(screen.getByText('Ingresá el importe total.')).toBeInTheDocument()
        );
        expect(PurchasesService.createDocument).not.toHaveBeenCalled();
    });

    it('keeps a valid amount after changing an invoice to a delivery note', async () => {
        vi.mocked(PurchasesService.createDocument).mockResolvedValueOnce({
            ...doc,
            type: 'delivery_note',
        });
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'REM-00001' } });
        fireEvent.change(screen.getByLabelText(/Importe total/), { target: { value: '1,25' } });
        fireEvent.mouseDown(screen.getByLabelText('Tipo'));
        fireEvent.click(await screen.findByText('Remito'));
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));

        await waitFor(() =>
            expect(PurchasesService.createDocument).toHaveBeenCalledWith(
                'purchase-1',
                expect.objectContaining({ type: 'delivery_note', total_amount: '1.25' })
            )
        );
    });

    it('keeps the modal open and the entered values when the API rejects a save', async () => {
        const feedback = vi.spyOn(message, 'error').mockImplementation(() => undefined as never);
        vi.mocked(PurchasesService.createDocument).mockRejectedValueOnce({
            response: { data: { message: 'No se pudo guardar el comprobante.' } },
        });
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar documento' }));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'FC-A-1234' } });
        fireEvent.change(screen.getByLabelText(/Importe total/), { target: { value: '12.50' } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar documento' }));
        await waitFor(() =>
            expect(feedback).toHaveBeenCalledWith('No se pudo guardar el comprobante.')
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Número')).toHaveValue('FC-A-1234');
    });

    it('renders desktop table columns and keeps mobile cards', () => {
        renderSection('ordered', [{ ...doc, total_amount: null, notes: null }]);

        expect(screen.getByRole('table')).toBeInTheDocument();
        ['Tipo', 'Número', 'Fecha de emisión', 'Importe', 'Notas', 'Acciones'].forEach((header) => {
            expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
        });
        expect(screen.getAllByText('—')).toHaveLength(2);
        expect(screen.getByTestId('purchase-document')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Editar documento' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Eliminar documento' })).toBeInTheDocument();
    });

    it('renders history read only for cancelled purchases and hides document actions for drafts', () => {
        const { rerender } = renderSection('cancelled', [doc]);
        expect(screen.getAllByText('A 0001-00001234')).not.toHaveLength(0);
        expect(screen.getAllByText('Factura original')).not.toHaveLength(0);
        expect(screen.queryByRole('button', { name: 'Agregar documento' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Editar documento' })).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Eliminar documento' })
        ).not.toBeInTheDocument();
        rerender(
            <PurchaseDocumentsSection
                purchaseId="purchase-1"
                status="draft"
                initialDocuments={[]}
            />
        );
        expect(
            screen.getByText(/se podrán registrar cuando la compra esté confirmada/)
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Agregar documento' })).not.toBeInTheDocument();
    });

    it('edits and deletes existing documents with confirmation', async () => {
        vi.mocked(PurchasesService.updateDocument).mockResolvedValue({
            ...doc,
            number: 'FC-A-1235',
        });
        vi.mocked(PurchasesService.deleteDocument).mockResolvedValue(undefined);
        renderSection('received', [doc]);
        const record = screen.getByTestId('purchase-document');
        fireEvent.click(within(record).getByRole('button', { name: 'Editar' }));
        fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'FC-A-1235' } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        await waitFor(() =>
            expect(PurchasesService.updateDocument).toHaveBeenCalledWith(
                'purchase-1',
                'doc-1',
                expect.objectContaining({ number: 'FC-A-1235' })
            )
        );
        expect((await screen.findAllByText('FC-A-1235')).length).toBeGreaterThan(0);
        fireEvent.click(
            within(screen.getByTestId('purchase-document')).getByRole('button', {
                name: 'Eliminar',
            })
        );
        expect(await screen.findByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
        const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar' });
        fireEvent.click(deleteButtons[deleteButtons.length - 1]);
        await waitFor(() =>
            expect(PurchasesService.deleteDocument).toHaveBeenCalledWith('purchase-1', 'doc-1')
        );
    }, 15000);
});
