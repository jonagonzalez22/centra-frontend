import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { SupplierProductsModal } from './SupplierProductsModal';
import { SupplierProductsService, type SupplierProduct } from '../../supplierProducts.service';

const supplier = {
    id: 'supplier-1',
    business_name: 'Distribuidora Cuyo',
    tax_id: null,
    contact_name: null,
    phone: null,
    email: null,
    address: null,
    notes: null,
    is_active: true,
    created_at: '',
    updated_at: '',
};
const association: SupplierProduct = {
    id: 'association-1',
    supplier_code: 'CL-500',
    supplier_product_name: 'Hipoclorito',
    created_at: '',
    updated_at: '',
    product: {
        id: 'product-1',
        name: 'Cloro granel',
        sku: 'LQUI-000006',
        is_active: false,
        is_sellable: false,
        stock_source_product_id: null,
        stock_measurement_unit: {
            id: 'uom-1',
            code: 'l',
            name: 'Litro',
            symbol: 'L',
            category: 'volume',
        },
    },
};

let canEdit = true;

vi.mock('../../supplierProducts.service', () => ({
    SupplierProductsService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ permission, children }: { permission: string; children: React.ReactNode }) =>
        permission !== 'suppliers.edit' || canEdit ? children : null,
}));

describe('SupplierProductsModal', () => {
    beforeEach(() => {
        canEdit = true;
        vi.mocked(SupplierProductsService.getAll).mockResolvedValue({
            items: [association],
            total: 16,
            per_page: 15,
            current_page: 1,
            last_page: 2,
        });
    });

    it('hides mutation actions without suppliers.edit', async () => {
        canEdit = false;
        render(<SupplierProductsModal open supplier={supplier} onClose={vi.fn()} />);

        await screen.findByText('Cloro granel');
        expect(
            screen.queryByRole('button', { name: 'Eliminar producto del proveedor' })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Editar producto del proveedor' })
        ).not.toBeInTheDocument();
    });

    it('lists associations, preserves inactive products, and searches paginated results', async () => {
        const user = userEvent.setup();
        render(<SupplierProductsModal open supplier={supplier} onClose={vi.fn()} />);

        expect(await screen.findByText('Productos de Distribuidora Cuyo')).toBeInTheDocument();
        expect(screen.getByText('Cloro granel')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
        await user.type(screen.getByRole('textbox', { name: 'Buscar producto' }), 'cloro');
        await waitFor(() =>
            expect(SupplierProductsService.getAll).toHaveBeenLastCalledWith('supplier-1', {
                search: 'cloro',
                page: 1,
                per_page: 15,
            })
        );
    });
});
