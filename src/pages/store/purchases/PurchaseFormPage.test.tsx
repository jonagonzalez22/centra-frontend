import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PurchaseFormPage } from './PurchaseFormPage';
import { PurchasesService } from '@/features/store/purchases/purchases.service';
import { SuppliersService } from '@/features/store/suppliers/suppliers.service';
import { SupplierProductsService } from '@/features/store/suppliers/supplierProducts.service';

vi.mock('@/features/store/purchases/purchases.service', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/store/purchases/purchases.service')>()), PurchasesService: { getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), order: vi.fn(), cancel: vi.fn() } }));
vi.mock('@/features/store/suppliers/suppliers.service', () => ({ SuppliersService: { getAll: vi.fn() } }));
vi.mock('@/features/store/suppliers/supplierProducts.service', () => ({ SupplierProductsService: { getAll: vi.fn(), getCandidates: vi.fn(), update: vi.fn(), bulkCreate: vi.fn() } }));

let canEditSupplierProducts = true;
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: (permission: string) => permission !== 'suppliers.edit' || canEditSupplierProducts }) }));

const supplier = { id: 'supplier-1', business_name: 'Limpieza Clorito', tax_id: '30-123', contact_name: null, phone: null, email: null, address: null, notes: null, is_active: true, created_at: '', updated_at: '' };
const association = { id: 'association-1', supplier_code: 'CL-55', supplier_product_name: 'Cloro proveedor', is_preferred: false, product: { id: 'product-1', name: 'Cloro granel', sku: 'LQUI-4', is_active: true, is_sellable: false, stock_source_product_id: null, stock_measurement_unit: { id: 'uom-1', code: 'liter', name: 'Litro', symbol: 'L', category: 'volume' } }, created_at: '', updated_at: '' };
const association2 = { ...association, id: 'association-2', supplier_code: 'CL-56', product: { ...association.product, id: 'product-2', name: 'Jabón Dove x 5 litros', sku: 'JAB-5' } };
const association3 = { ...association, id: 'association-3', supplier_code: null, product: { ...association.product, id: 'product-3', name: 'Detergente', sku: 'DET-1' } };
const associatedCandidate = { id: 'product-1', name: 'Cloro granel', sku: 'LQUI-4', is_active: true, is_sellable: false, is_associated: true, supplier_product: { id: 'association-1', supplier_code: 'CL-55', supplier_product_name: 'Cloro proveedor', is_preferred: true }, stock_measurement_unit: association.product.stock_measurement_unit, brand: null };
const unassociatedCandidate = { id: 'product-4', name: 'Papel higiénico', sku: 'PAP-4', is_active: true, is_sellable: false, is_associated: false, supplier_product: null, stock_measurement_unit: association.product.stock_measurement_unit, brand: null };
const created = { id: 'purchase-1', purchase_number: 'OC-000001', purchase_type: 'order' as const, status: 'draft' as const, supplier: { id: supplier.id, business_name: supplier.business_name, tax_id: supplier.tax_id }, total: '20.00', ordered_at: null, cancelled_at: null, created_at: '', notes: null, items: [] };

const option = (text: string) => screen.getAllByText(text).find((node) => node.closest('.ant-select-item-option'))!;
const Location = () => <div data-testid="location">{useLocation().pathname}</div>;
const renderForm = (path = '/tienda/compras/nueva') => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/tienda/compras/nueva" element={<PurchaseFormPage />} /><Route path="/tienda/compras/:id/editar" element={<PurchaseFormPage />} /><Route path="/tienda/compras/:id" element={<div>Detalle</div>} /></Routes><Location /></MemoryRouter>);

describe('PurchaseFormPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        canEditSupplierProducts = true;
        vi.mocked(SuppliersService.getAll).mockResolvedValue([supplier]);
        vi.mocked(SupplierProductsService.getAll).mockResolvedValue({ items: [association], total: 1, per_page: 20, current_page: 1, last_page: 1 });
        vi.mocked(SupplierProductsService.getCandidates).mockResolvedValue({ items: [associatedCandidate, unassociatedCandidate], total: 2, per_page: 20, current_page: 1, last_page: 1 });
        vi.mocked(SupplierProductsService.bulkCreate).mockResolvedValue({ created_count: 1, preferred_updated_count: 0, skipped_existing_count: 0 });
        vi.mocked(SupplierProductsService.update).mockResolvedValue(association);
        vi.mocked(PurchasesService.create).mockResolvedValue(created);
    });

    it('uses the standard spinner while loading a purchase for editing', async () => {
        let resolvePurchase!: (value: typeof created) => void;
        vi.mocked(PurchasesService.getById).mockImplementationOnce(() => new Promise<typeof created>((resolve) => { resolvePurchase = resolve; }));
        renderForm('/tienda/compras/purchase-1/editar');
        expect(screen.getByTestId('purchase-page-loading')).toBeInTheDocument();
        expect(screen.queryByText('Cargando compra...')).not.toBeInTheDocument();
        resolvePurchase(created);
        expect(await screen.findByRole('heading', { name: 'Editar compra' })).toBeInTheDocument();
    });

    it('starts an order draft and keeps products disabled until a supplier is selected', () => {
        renderForm();
        expect(screen.getByRole('heading', { name: 'Nueva compra' })).toBeInTheDocument();
        expect(screen.getAllByText('Nueva compra')).not.toHaveLength(0);
        expect(screen.queryByRole('link', { name: /^OC-/ })).not.toBeInTheDocument();
        expect(screen.getByText('Orden de compra')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Buscar producto' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Agregar varios/ })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Buscar en todos los productos' })).not.toBeInTheDocument();
        expect(screen.queryByText('Selecciona un proveedor para agregar productos.')).not.toBeInTheDocument();
        expect(screen.getByText('Selecciona un proveedor para comenzar a agregar productos.')).toBeInTheDocument();
    });

    it('searches supplier products, adds an exact line and creates only the draft payload', async () => {
        const user = userEvent.setup();
        renderForm();
        const supplierInput = screen.getByRole('combobox', { name: 'Proveedor' });
        await user.type(supplierInput, 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        expect(screen.getByRole('button', { name: 'Buscar en todos los productos' })).toBeVisible();

        const productInput = screen.getByRole('combobox', { name: 'Buscar producto' });
        await user.type(productInput, 'Cloro');
        await waitFor(() => expect(SupplierProductsService.getAll).toHaveBeenCalledWith('supplier-1', expect.objectContaining({ search: 'Cloro' })));
        fireEvent.click(option('Cloro granel'));
        expect(await screen.findByText('CL-55')).toBeInTheDocument();
        expect(productInput).toHaveValue('');
        expect(screen.getByRole('spinbutton', { name: 'Cantidad de Cloro granel' })).toHaveValue('1');
        expect(screen.getByRole('button', { name: 'Reducir cantidad de Cloro granel' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Aumentar cantidad de Cloro granel' })).toBeEnabled();
        const priceInput = screen.getByRole('spinbutton', { name: 'Precio de Cloro granel' });
        expect(priceInput).toHaveValue('');
        expect(priceInput).toHaveAttribute('placeholder', 'Precio');
        expect(screen.getByText(/Total parcial.*—/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
        expect(PurchasesService.create).not.toHaveBeenCalled();
        expect(screen.getByText('Ingresa el precio unitario.', { selector: '.text-red-600' })).toBeInTheDocument();

        const quantityInput = screen.getByRole('spinbutton', { name: 'Cantidad de Cloro granel' });
        fireEvent.change(quantityInput, { target: { value: '0.1250' } });
        expect(quantityInput).toHaveValue('0,125');
        fireEvent.change(quantityInput, { target: { value: '1,5' } });
        expect(quantityInput).toHaveValue('1,5');
        fireEvent.change(quantityInput, { target: { value: '2.5000' } });
        expect(screen.getByRole('spinbutton', { name: 'Cantidad de Cloro granel' })).toHaveValue('2,5');
        fireEvent.change(priceInput, { target: { value: '8.00' } });
        expect(await screen.findByText('$ 20,00')).toBeInTheDocument();
        fireEvent.change(screen.getByRole('textbox', { name: 'Notas' }), { target: { value: 'Entrega lunes' } });
        await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));

        await waitFor(() => expect(PurchasesService.create).toHaveBeenCalledWith({ supplier_id: 'supplier-1', purchase_type: 'order', notes: 'Entrega lunes', items: [{ product_id: 'product-1', quantity: '2.5000', unit_price: '8.00' }] }));
        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/tienda/compras/purchase-1'));
    }, 30000);

    it('clears the product search selection after adding and allows the next product without duplicates', async () => {
        const user = userEvent.setup();
        vi.mocked(SupplierProductsService.getAll).mockImplementation(async (_supplierId, params = {}) => ({
            items: params.search === 'Jabón' ? [association2] : [association, association2],
            total: 2,
            per_page: 20,
            current_page: 1,
            last_page: 1,
        }));
        renderForm();
        const supplierInput = screen.getByRole('combobox', { name: 'Proveedor' });
        await user.type(supplierInput, 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));

        const productInput = screen.getByRole('combobox', { name: 'Buscar producto' });
        await user.type(productInput, 'Cloro');
        await waitFor(() => expect(SupplierProductsService.getAll).toHaveBeenLastCalledWith('supplier-1', expect.objectContaining({ search: 'Cloro' })));
        await screen.findByText('Cloro granel');
        fireEvent.click(option('Cloro granel'));
        expect(await screen.findByRole('spinbutton', { name: 'Cantidad de Cloro granel' })).toHaveValue('1');
        expect(productInput).toHaveValue('');
        expect(productInput).toHaveFocus();
        expect(screen.queryByText('Cloro granel', { selector: '.ant-select-selection-item' })).not.toBeInTheDocument();

        await user.type(productInput, 'Jabón');
        await screen.findByText('Jabón Dove x 5 litros');
        fireEvent.click(option('Jabón Dove x 5 litros'));
        expect(await screen.findByRole('spinbutton', { name: 'Cantidad de Jabón Dove x 5 litros' })).toHaveValue('1');

        await user.type(productInput, 'Cloro');
        await waitFor(() => expect(SupplierProductsService.getAll).toHaveBeenLastCalledWith('supplier-1', expect.objectContaining({ search: 'Cloro' })));
        expect(screen.queryByText('Cloro granel', { selector: '.ant-select-item-option-content' })).not.toBeInTheDocument();
        expect(screen.getAllByRole('spinbutton', { name: /Cantidad de Cloro granel/ })).toHaveLength(1);
    }, 20000);

    it('searches all valid products and associates an unassociated product before adding it', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));

        await user.click(screen.getByRole('button', { name: 'Buscar en todos los productos' }));
        const productInput = screen.getByRole('combobox', { name: 'Buscar producto' });
        await user.type(productInput, 'Papel');
        await waitFor(() => expect(SupplierProductsService.getCandidates).toHaveBeenCalledWith('supplier-1', expect.objectContaining({ search: 'Papel', include_associated: 1 })));
        expect(await screen.findByText('No asociado')).toBeInTheDocument();
        fireEvent.click(option('Papel higiénico'));

        await waitFor(() => expect(SupplierProductsService.bulkCreate).toHaveBeenCalledWith('supplier-1', ['product-4']));
        expect(await screen.findByRole('spinbutton', { name: 'Cantidad de Papel higiénico' })).toHaveValue('1');
        const paperCard = screen.getByTestId('purchase-mobile-line-product-4');
        expect(within(paperCard).getByRole('button', { name: 'Agregar código proveedor de Papel higiénico' })).toBeInTheDocument();
        expect(within(paperCard).getAllByText('—')).toHaveLength(1);
        expect(productInput).toHaveValue('');
    }, 30000);

    it('preserves existing supplier metadata when a global result is already associated', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.click(screen.getByRole('button', { name: 'Buscar en todos los productos' }));
        const productInput = screen.getByRole('combobox', { name: 'Buscar producto' });
        await user.type(productInput, 'Cloro');
        await waitFor(() => expect(SupplierProductsService.getCandidates).toHaveBeenCalledWith('supplier-1', expect.objectContaining({ include_associated: 1 })));
        fireEvent.click(option('Cloro granel'));

        expect(await screen.findByText('CL-55')).toBeInTheDocument();
        expect(screen.getByText(/Cloro proveedor/)).toBeInTheDocument();
        expect(SupplierProductsService.bulkCreate).not.toHaveBeenCalled();
    }, 30000);

    it('updates a supplier code from a draft line and refreshes the local value', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.type(screen.getByRole('combobox', { name: 'Buscar producto' }), 'Cloro');
        await screen.findByText('Cloro granel');
        fireEvent.click(option('Cloro granel'));

        await user.click(screen.getByRole('button', { name: 'Editar código proveedor de Cloro granel' }));
        const codeInput = await screen.findByRole('textbox', { name: 'Código proveedor de Cloro granel' });
        await user.clear(codeInput);
        await user.type(codeInput, ' JBRD-001 ');
        vi.mocked(SupplierProductsService.update).mockResolvedValue({ ...association, supplier_code: 'JBRD-001' });
        await user.click(screen.getByRole('button', { name: 'Guardar' }));

        await waitFor(() => expect(SupplierProductsService.update).toHaveBeenCalledWith('supplier-1', 'association-1', { supplier_code: 'JBRD-001' }));
        expect(await screen.findByText('JBRD-001')).toBeInTheDocument();
    }, 30000);

    it('normalizes a cleared supplier code to null', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.type(screen.getByRole('combobox', { name: 'Buscar producto' }), 'Cloro');
        await screen.findByText('Cloro granel');
        fireEvent.click(option('Cloro granel'));

        await user.click(screen.getByRole('button', { name: 'Editar código proveedor de Cloro granel' }));
        await user.clear(await screen.findByRole('textbox', { name: 'Código proveedor de Cloro granel' }));
        vi.mocked(SupplierProductsService.update).mockResolvedValue({ ...association, supplier_code: null });
        await user.click(screen.getByRole('button', { name: 'Guardar' }));
        await waitFor(() => expect(SupplierProductsService.update).toHaveBeenCalledWith('supplier-1', 'association-1', { supplier_code: null }));
        const card = screen.getByTestId('purchase-mobile-line-product-1');
        expect(within(card).getByRole('button', { name: 'Agregar código proveedor de Cloro granel' })).toBeInTheDocument();
        expect(within(card).getAllByText('—')).toHaveLength(1);
    }, 30000);

    it('keeps the previous local value and editor open when supplier code update fails', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.type(screen.getByRole('combobox', { name: 'Buscar producto' }), 'Cloro');
        await screen.findByText('Cloro granel');
        fireEvent.click(option('Cloro granel'));

        await user.click(screen.getByRole('button', { name: 'Editar código proveedor de Cloro granel' }));
        const codeInput = await screen.findByRole('textbox', { name: 'Código proveedor de Cloro granel' });
        await user.clear(codeInput);
        await user.type(codeInput, 'FALLA');
        vi.mocked(SupplierProductsService.update).mockRejectedValue({ response: { data: { message: 'No se pudo actualizar el código.' } } });
        await user.click(screen.getByRole('button', { name: 'Guardar' }));
        expect(await screen.findByRole('textbox', { name: 'Código proveedor de Cloro granel' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('FALLA')).toBeInTheDocument();
        expect(screen.getByText('CL-55')).toBeInTheDocument();
    }, 30000);

    it('keeps supplier codes read-only without suppliers.edit permission', async () => {
        canEditSupplierProducts = false;
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.type(screen.getByRole('combobox', { name: 'Buscar producto' }), 'Cloro');
        await screen.findByText('Cloro granel');
        fireEvent.click(option('Cloro granel'));

        expect(await screen.findByText('CL-55')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /código proveedor de Cloro granel/ })).not.toBeInTheDocument();
    }, 30000);

    it('keeps a missing supplier code read-only without suppliers.edit permission', async () => {
        canEditSupplierProducts = false;
        const user = userEvent.setup();
        vi.mocked(SupplierProductsService.getAll).mockResolvedValue({ items: [association3], total: 1, per_page: 20, current_page: 1, last_page: 1 });
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.type(screen.getByRole('combobox', { name: 'Buscar producto' }), 'Detergente');
        await screen.findByText('Detergente');
        fireEvent.click(option('Detergente'));
        const card = screen.getByTestId('purchase-mobile-line-product-3');
        expect(within(card).getAllByText('—')).toHaveLength(2);
        expect(within(card).queryByRole('button', { name: 'Agregar código proveedor de Detergente' })).not.toBeInTheDocument();
    }, 30000);

    it('asks before changing supplier with lines and clears them after confirmation', async () => {
        const user = userEvent.setup();
        vi.mocked(SuppliersService.getAll).mockResolvedValue([supplier, { ...supplier, id: 'supplier-2', business_name: 'Otro proveedor' }]);
        renderForm();
        const supplierInput = screen.getByRole('combobox', { name: 'Proveedor' });
        await user.type(supplierInput, 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        const productInput = screen.getByRole('combobox', { name: 'Buscar producto' });
        await user.type(productInput, 'Cloro');
        await waitFor(() => expect(SupplierProductsService.getAll).toHaveBeenCalled());
        fireEvent.click(option('Cloro granel'));

        await user.clear(supplierInput);
        await user.type(supplierInput, 'Otro');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenLastCalledWith({ search: 'Otro', is_active: true }));
        fireEvent.click(option('Otro proveedor'));
        expect(await screen.findByText('¿Cambiar proveedor?')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Cambiar proveedor' }));
        expect(screen.getByText('No hay productos agregados a la compra.')).toBeInTheDocument();
    }, 30000);

    it('prepopulates and updates only draft purchases', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({ ...created, notes: 'Histórica', items: [{ id: 'item-1', product_id: 'product-1', product_name: 'Cloro granel', product_sku: 'LQUI-4', supplier_code: 'CL-55', supplier_product_name: null, measurement_unit_code: 'liter', measurement_unit_symbol: 'L', quantity_ordered: '2.0000', quantity_received: '0.0000', quantity_pending: '2.0000', unit_price: '10.00', subtotal: '20.00' }] });
        vi.mocked(PurchasesService.update).mockResolvedValue(created);
        renderForm('/tienda/compras/purchase-1/editar');
        expect(await screen.findByRole('heading', { name: 'Editar compra' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Histórica')).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Cantidad de Cloro granel' })).toHaveValue('2');
        expect(screen.getByRole('spinbutton', { name: 'Precio de Cloro granel' })).toHaveValue('10,00');
        await userEvent.setup().click(screen.getByRole('button', { name: 'Guardar borrador' }));
        await waitFor(() => expect(PurchasesService.update).toHaveBeenCalledWith('purchase-1', { supplier_id: 'supplier-1', purchase_type: 'order', notes: 'Histórica', items: [{ product_id: 'product-1', quantity: '2.0000', unit_price: '10.00' }] }));
    });

    it('shows the purchase number in the edit breadcrumb and links back to detail', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({ ...created, items: [] });
        renderForm('/tienda/compras/purchase-1/editar');
        const detailLink = await screen.findByRole('link', { name: 'OC-000001' });
        expect(detailLink).toHaveAttribute('href', '/tienda/compras/purchase-1');
        expect(screen.getByText('Editar')).toBeInTheDocument();
        await userEvent.setup().click(detailLink);
        expect(screen.getByTestId('location')).toHaveTextContent('/tienda/compras/purchase-1');
    });

    it('removes a mobile purchase line through the existing delete action', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.type(screen.getByRole('combobox', { name: 'Buscar producto' }), 'Cloro');
        await screen.findByText('Cloro granel');
        fireEvent.click(option('Cloro granel'));
        await user.click(screen.getByRole('button', { name: 'Eliminar Cloro granel' }));
        expect(screen.getByText('No hay productos agregados a la compra.')).toBeInTheDocument();
    }, 30000);

    it('allows supplier-code editing in a direct draft', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({
            ...created,
            purchase_type: 'direct',
            items: [{ id: 'item-1', product_id: 'product-1', product_name: 'Cloro granel', product_sku: 'LQUI-4', supplier_code: 'CL-55', supplier_product_name: null, measurement_unit_code: 'liter', measurement_unit_symbol: 'L', quantity_ordered: '2.0000', quantity_received: '0.0000', quantity_pending: '2.0000', unit_price: '10.00', subtotal: '20.00' }],
        });
        renderForm('/tienda/compras/purchase-1/editar');
        expect(await screen.findByRole('heading', { name: 'Editar compra' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Editar código proveedor de Cloro granel' })).toBeInTheDocument();
    });

    it('redirects non-draft purchases to their detail instead of editing them', async () => {
        vi.mocked(PurchasesService.getById).mockResolvedValue({ ...created, status: 'ordered' });
        renderForm('/tienda/compras/purchase-1/editar');
        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/tienda/compras/purchase-1'));
    });

    it('adds multiple supplier products locally and resets the bulk modal after confirmation', async () => {
        const user = userEvent.setup();
        vi.mocked(SupplierProductsService.getAll).mockResolvedValue({ items: [association, association2], total: 2, per_page: 20, current_page: 1, last_page: 1 });
        renderForm();
        const supplierInput = screen.getByRole('combobox', { name: 'Proveedor' });
        await user.type(supplierInput, 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));

        await user.click(screen.getByRole('button', { name: /Agregar varios/ }));
        expect(await screen.findByText('Agregar productos a la compra')).toBeInTheDocument();
        await waitFor(() => expect(SupplierProductsService.getAll).toHaveBeenLastCalledWith('supplier-1', { page: 1, per_page: 20 }));
        await user.click(screen.getByRole('checkbox', { name: 'Cloro granel' }));
        await user.click(screen.getByRole('checkbox', { name: 'Jabón Dove x 5 litros' }));
        expect(screen.getByText('2 productos seleccionados')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Agregar 2 productos' }));

        await waitFor(() => expect(screen.getAllByRole('spinbutton')).toHaveLength(4));
        expect(screen.getAllByText('Cloro granel')).toHaveLength(2);
        expect(screen.getAllByText('Jabón Dove x 5 litros')).toHaveLength(2);
        expect(screen.getAllByDisplayValue('1')).toHaveLength(2);
        expect(screen.getAllByPlaceholderText('Precio')).toHaveLength(2);
        screen.getAllByRole('spinbutton', { name: /Precio de/ }).forEach((input) => expect(input).toHaveValue(''));
        expect(screen.getByText(/Total parcial.*—/)).toBeInTheDocument();
        expect(PurchasesService.create).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: /Agregar varios/ }));
        expect(await screen.findByText('0 productos seleccionados')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Ya agregado: Cloro granel' })).toBeDisabled();
    }, 30000);

    it('preserves bulk selection while changing server pages and search results', async () => {
        const user = userEvent.setup();
        vi.mocked(SupplierProductsService.getAll).mockImplementation(async (_supplierId, params = {}) => {
            if (params.search) return { items: [association3], total: 1, per_page: params.per_page ?? 20, current_page: 1, last_page: 1 };
            if (params.page === 2) return { items: [association2], total: 21, per_page: 20, current_page: 2, last_page: 2 };
            return { items: [association], total: 21, per_page: 20, current_page: 1, last_page: 2 };
        });
        renderForm();
        const supplierInput = screen.getByRole('combobox', { name: 'Proveedor' });
        await user.type(supplierInput, 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.click(screen.getByRole('button', { name: /Agregar varios/ }));
        await screen.findByRole('checkbox', { name: 'Cloro granel' });
        await user.click(screen.getByRole('checkbox', { name: 'Cloro granel' }));

        await user.click(screen.getByTitle('Next Page'));
        await waitFor(() => expect(SupplierProductsService.getAll).toHaveBeenLastCalledWith('supplier-1', { search: undefined, page: 2, per_page: 20 }));
        await screen.findByRole('checkbox', { name: 'Jabón Dove x 5 litros' });
        expect(screen.getByText('1 producto seleccionado')).toBeInTheDocument();
        await user.click(screen.getByRole('checkbox', { name: 'Jabón Dove x 5 litros' }));

        await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'Det');
        await waitFor(() => expect(SupplierProductsService.getAll).toHaveBeenLastCalledWith('supplier-1', { search: 'Det', page: 1, per_page: 20 }), { timeout: 2000 });
        await screen.findByRole('checkbox', { name: 'Detergente' });
        expect(screen.getByText('2 productos seleccionados')).toBeInTheDocument();
        await user.click(screen.getByRole('checkbox', { name: 'Detergente' }));
        expect(screen.getByText('3 productos seleccionados')).toBeInTheDocument();
    }, 45000);

    it('associates only missing global bulk selections before adding all selected lines', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByRole('combobox', { name: 'Proveedor' }), 'Lim');
        await waitFor(() => expect(SuppliersService.getAll).toHaveBeenCalledWith({ search: 'Lim', is_active: true }));
        fireEvent.click(option('Limpieza Clorito'));
        await user.click(screen.getByRole('button', { name: /Agregar varios/ }));
        const searchLabel = await screen.findByText('Buscar productos');
        const scopeLabel = screen.getByText('Productos a mostrar');
        expect(searchLabel.compareDocumentPosition(scopeLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        await user.click(screen.getByText('Todos los productos'));
        await waitFor(() => expect(SupplierProductsService.getCandidates).toHaveBeenCalledWith('supplier-1', expect.objectContaining({ include_associated: 1 })));
        await user.click(screen.getByRole('checkbox', { name: 'Cloro granel' }));
        await user.click(screen.getByRole('checkbox', { name: 'Papel higiénico' }));
        expect(screen.getByText('Los productos no asociados se vincularán automáticamente a este proveedor.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Agregar 2 productos' }));
        await waitFor(() => expect(SupplierProductsService.bulkCreate).toHaveBeenCalledWith('supplier-1', ['product-4']));
        expect(await screen.findByRole('spinbutton', { name: 'Cantidad de Papel higiénico' })).toHaveValue('1');
        expect(screen.getByRole('spinbutton', { name: 'Cantidad de Cloro granel' })).toHaveValue('1');
        expect(screen.getByText('CL-55')).toBeInTheDocument();
        expect(screen.getByText(/Cloro proveedor/)).toBeInTheDocument();
    }, 30000);

    it('shows existing draft products as unavailable in the bulk selector and cancel does not change them', async () => {
        const user = userEvent.setup();
        vi.mocked(PurchasesService.getById).mockResolvedValue({ ...created, items: [{ id: 'line-1', product_id: 'product-1', product_name: 'Cloro granel', product_sku: 'LQUI-4', supplier_code: 'CL-55', supplier_product_name: null, measurement_unit_code: 'liter', measurement_unit_symbol: 'L', quantity_ordered: '2.0000', quantity_received: '0.0000', quantity_pending: '2.0000', unit_price: '10.00', subtotal: '20.00' }] });
        vi.mocked(SupplierProductsService.getAll).mockResolvedValue({ items: [association], total: 1, per_page: 20, current_page: 1, last_page: 1 });
        renderForm('/tienda/compras/purchase-1/editar');
        await screen.findByRole('heading', { name: 'Editar compra' });
        await user.click(screen.getByRole('button', { name: /Agregar varios/ }));
        expect((await screen.findAllByText('Ya agregado'))).toHaveLength(2);
        expect(screen.getByRole('checkbox', { name: 'Ya agregado: Cloro granel' })).toBeDisabled();
        await user.click(screen.getAllByRole('button', { name: /^Cancelar$/ })[1]);
        expect(screen.getByRole('spinbutton', { name: 'Cantidad de Cloro granel' })).toHaveValue('2');
        await user.click(screen.getByRole('button', { name: /Agregar varios/ }));
        expect(await screen.findByText('0 productos seleccionados')).toBeInTheDocument();
    }, 30000);
});
