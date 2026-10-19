import { render, screen } from '@testing-library/react';
import { SupplierDrawer } from './SupplierDrawer';
import { SuppliersService, type Supplier } from '../../suppliers.service';

const supplier: Supplier = {
    id: 'supplier-1',
    business_name: 'Distribuidora Norte',
    tax_id: '30-12345678-9',
    contact_name: 'Ana Pérez',
    phone: '261 555-0100',
    email: 'ana@norte.test',
    address: 'San Martín 123',
    notes: 'Entrega los martes',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

let canEdit = true;

vi.mock('../../suppliers.service', () => ({ SuppliersService: { getById: vi.fn() } }));
vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ permission, children }: { permission: string; children: React.ReactNode }) =>
        permission !== 'suppliers.edit' || canEdit ? children : null,
}));

describe('SupplierDrawer', () => {
    beforeEach(() => {
        canEdit = true;
        vi.mocked(SuppliersService.getById).mockResolvedValue(supplier);
    });

    it('shows supplier details, status, and the edit action', async () => {
        render(<SupplierDrawer open onClose={vi.fn()} supplierId={supplier.id} onEdit={vi.fn()} />);

        expect(await screen.findByText('Distribuidora Norte')).toBeInTheDocument();
        expect(screen.getByText('30-12345678-9')).toBeInTheDocument();
        expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
        expect(screen.getByText('261 555-0100')).toBeInTheDocument();
        expect(screen.getByText('ana@norte.test')).toBeInTheDocument();
        expect(screen.getByText('San Martín 123')).toBeInTheDocument();
        expect(screen.getByText('Entrega los martes')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    });

    it('uses an em dash for empty values and hides edit without permission', async () => {
        canEdit = false;
        vi.mocked(SuppliersService.getById).mockResolvedValue({
            ...supplier,
            tax_id: null,
            contact_name: null,
            phone: null,
            email: null,
            address: null,
            notes: null,
            is_active: false,
        });

        render(<SupplierDrawer open onClose={vi.fn()} supplierId={supplier.id} onEdit={vi.fn()} />);

        expect(await screen.findByText('Inactivo')).toBeInTheDocument();
        expect(screen.getAllByText('—')).toHaveLength(6);
        expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    });
});
