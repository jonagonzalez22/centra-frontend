import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PurchasesPage } from './PurchasesPage';
import { PurchasesService } from '@/features/store/purchases/purchases.service';
import { SuppliersService } from '@/features/store/suppliers/suppliers.service';

let canCreate = true;
vi.mock('@/features/store/purchases/purchases.service', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/store/purchases/purchases.service')>()), PurchasesService: { getAll: vi.fn(), getById: vi.fn(), order: vi.fn(), cancel: vi.fn() } }));
vi.mock('@/features/store/suppliers/suppliers.service', () => ({ SuppliersService: { getAll: vi.fn() } }));
vi.mock('@/components/auth/CanDo', () => ({ CanDo: ({ permission, children }: { permission: string; children: React.ReactNode }) => permission === 'purchases.create' && !canCreate ? null : children }));

const item = { id: 'purchase-1', purchase_number: 'OC-000001', purchase_type: 'order' as const, status: 'draft' as const, supplier: { id: 'supplier-1', business_name: 'Limpieza Clorito', tax_id: null }, total: '125.50', documents_count: 0, ordered_at: null, cancelled_at: null, created_at: '2026-10-20 10:00:00' };
const option = (label: string) => screen.getAllByText(label).find((element) => element.closest('.ant-select-item-option'))!;
const CurrentPath = () => <output aria-label="Ruta actual">{useLocation().pathname}</output>;
describe('PurchasesPage', () => {
    beforeEach(() => { canCreate = true; vi.mocked(SuppliersService.getAll).mockResolvedValue([{ id: 'supplier-1', business_name: 'Limpieza Clorito', tax_id: null, contact_name: null, phone: null, email: null, address: null, notes: null, is_active: true, created_at: '', updated_at: '' }]); vi.mocked(PurchasesService.getAll).mockResolvedValue({ items: [item, { ...item, id: 'purchase-2', purchase_type: 'direct', status: 'cancelled', purchase_number: 'OC-000002', documents_count: 1 }, { ...item, id: 'purchase-3', status: 'received', purchase_number: 'OC-000003', documents_count: 2 }, { ...item, id: 'purchase-4', status: 'ordered', purchase_number: 'OC-000004', documents_count: 0 }], total: 4, per_page: 15, current_page: 1, last_page: 1 }); });
    it('renders purchases, translated values and server filters', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter initialEntries={['/tienda/compras']}><CurrentPath /><PurchasesPage /></MemoryRouter>);
        expect(await screen.findByText('Gestiona las compras y órdenes a proveedores de tu tienda')).toBeInTheDocument();
        const purchaseNumber = screen.getByRole('link', { name: 'OC-000001' });
        expect(purchaseNumber).toHaveAttribute('href', '/tienda/compras/purchase-1');
        expect(screen.getAllByRole('link', { name: 'Ver detalle' })[0]).toHaveAttribute('href', '/tienda/compras/purchase-1');
        await user.click(purchaseNumber);
        expect(screen.getByLabelText('Ruta actual')).toHaveTextContent('/tienda/compras/purchase-1');
        const newPurchase = screen.getByRole('link', { name: /Nueva compra/ });
        expect(newPurchase).toHaveAttribute('href', '/tienda/compras/nueva');
        await user.click(newPurchase);
        expect(screen.getByLabelText('Ruta actual')).toHaveTextContent('/tienda/compras/nueva');
        expect(PurchasesService.getAll).toHaveBeenCalled();
        expect(screen.getByText('Búsqueda')).toBeInTheDocument(); expect(screen.getAllByText('Documentos')).not.toHaveLength(0); expect(screen.getByPlaceholderText('Número o proveedor')).toBeInTheDocument();
        expect(screen.getAllByText('Orden de compra')).not.toHaveLength(0); expect(screen.getByText('Compra directa')).toBeInTheDocument(); expect(screen.getByText('Borrador')).toBeInTheDocument(); expect(screen.getByText('Cancelada')).toBeInTheDocument(); expect(screen.getAllByText('Limpieza Clorito')).not.toHaveLength(0); expect(screen.getByText('—')).toBeInTheDocument(); expect(screen.getByText('Sin documentos')).toBeInTheDocument(); expect(screen.getByText('1 documento')).toBeInTheDocument(); expect(screen.getByText('2 documentos')).toBeInTheDocument();
        fireEvent.change(screen.getByRole('textbox', { name: 'Buscar compras' }), { target: { value: 'OC-1' } });
        await waitFor(() => expect(PurchasesService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'OC-1', page: 1 })));
    });
    it('hides Nueva compra without purchases.create', async () => { canCreate = false; render(<MemoryRouter><PurchasesPage /></MemoryRouter>); await screen.findByText('OC-000001'); expect(screen.queryByRole('link', { name: /Nueva compra/ })).not.toBeInTheDocument(); });
    it('shows the appropriate empty states', async () => {
        vi.mocked(PurchasesService.getAll).mockResolvedValue({ items: [], total: 0, per_page: 15, current_page: 1, last_page: 1 });
        render(<MemoryRouter><PurchasesPage /></MemoryRouter>); expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled(); expect(await screen.findByText('No hay compras registradas.')).toBeInTheDocument();
        fireEvent.change(screen.getByRole('textbox', { name: 'Buscar compras' }), { target: { value: 'x' } }); expect(await screen.findByText('No encontramos compras con esos filtros.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeEnabled();
    });
    it('sends status, type and supplier filters and clears back to page one', async () => {
        const user = userEvent.setup(); render(<MemoryRouter><PurchasesPage /></MemoryRouter>); await screen.findByText('OC-000001');
        fireEvent.mouseDown(screen.getByLabelText('Estado')); fireEvent.click(option('Ordenada'));
        await waitFor(() => expect(PurchasesService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ordered', page: 1 })));
        fireEvent.mouseDown(screen.getByLabelText('Tipo')); fireEvent.click(option('Compra directa'));
        await waitFor(() => expect(PurchasesService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ purchase_type: 'direct', page: 1 })));
        fireEvent.mouseDown(screen.getByLabelText('Proveedor')); fireEvent.click(option('Limpieza Clorito'));
        await waitFor(() => expect(PurchasesService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ supplier_id: 'supplier-1', page: 1 })));
        fireEvent.mouseDown(screen.getByLabelText('Documentos')); fireEvent.click(option('Con documentos'));
        await waitFor(() => expect(PurchasesService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ documents: 'with_documents', page: 1 })));
        await user.click(screen.getByRole('button', { name: 'Limpiar' }));
        await waitFor(() => expect(PurchasesService.getAll).toHaveBeenLastCalledWith({ page: 1, per_page: 15 }));
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
    });
});
