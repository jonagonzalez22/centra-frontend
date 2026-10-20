import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    is_preferred: false,
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
    SupplierProductsService: {
        getAll: vi.fn(),
        getCandidates: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        bulkCreate: vi.fn(),
    },
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
        vi.mocked(SupplierProductsService.getCandidates).mockResolvedValue({
            items: [],
            total: 0,
            per_page: 20,
            current_page: 1,
            last_page: 1,
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
        expect(screen.queryByRole('button', { name: 'Marcar como preferido' })).not.toBeInTheDocument();
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

    it('updates the preferred association', async () => {
        vi.mocked(SupplierProductsService.update).mockResolvedValue(association);
        render(<SupplierProductsModal open supplier={supplier} onClose={vi.fn()} />);

        fireEvent.click(await screen.findByRole('button', { name: 'Marcar como preferido' }));
        await waitFor(() =>
            expect(SupplierProductsService.update).toHaveBeenCalledWith('supplier-1', 'association-1', {
                is_preferred: true,
            })
        );
    });

    it('selects multiple candidates and bulk associates their ids', async () => {
        const firstCandidate = {
            id: 'candidate-1',
            name: 'Detergente',
            sku: 'DET-001',
            is_active: true,
            is_sellable: false,
            stock_measurement_unit: null,
            brand: null,
        };
        const secondCandidate = { ...firstCandidate, id: 'candidate-2', name: 'Cloro' };
        vi.mocked(SupplierProductsService.getCandidates)
            .mockResolvedValueOnce({
                items: [firstCandidate, secondCandidate], total: 2, per_page: 20, current_page: 1, last_page: 1,
            });
        vi.mocked(SupplierProductsService.bulkCreate).mockResolvedValue({
            created_count: 1,
            preferred_updated_count: 0,
            skipped_existing_count: 1,
        });
        render(<SupplierProductsModal open supplier={supplier} onClose={vi.fn()} />);

        fireEvent.click(await screen.findByRole('button', { name: 'Asociar varios' }));
        await screen.findByText('Detergente');
        const dialogs = screen.getAllByRole('dialog');
        const bulkDialog = dialogs[dialogs.length - 1];
        const candidateCheckboxes = within(bulkDialog).getAllByRole('checkbox').slice(-2);
        fireEvent.click(candidateCheckboxes[0]);
        fireEvent.click(candidateCheckboxes[1]);
        expect(screen.getByText('2 productos seleccionados')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Asociar 2 productos' }));
        await waitFor(() =>
            expect(SupplierProductsService.bulkCreate).toHaveBeenCalledWith('supplier-1', [
                'candidate-1',
                'candidate-2',
            ], false)
        );
    }, 15000);
});
