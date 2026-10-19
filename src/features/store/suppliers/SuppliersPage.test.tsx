import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SuppliersPage } from './SuppliersPage';
import { SuppliersService, type Supplier } from './suppliers.service';

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

vi.mock('./suppliers.service', () => ({
    SuppliersService: {
        getAll: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));
vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ children }: { children: React.ReactNode }) => children,
}));

describe('SuppliersPage', () => {
    it('opens the supplier drawer from the view action', async () => {
        vi.mocked(SuppliersService.getAll).mockResolvedValue([supplier]);
        vi.mocked(SuppliersService.getById).mockResolvedValue(supplier);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <SuppliersPage />
            </MemoryRouter>
        );
        expect(
            await screen.findByRole('button', { name: 'Productos del proveedor' })
        ).toBeInTheDocument();
        await user.click(await screen.findByRole('button', { name: 'Ver detalle' }));

        expect(await screen.findByText('Detalle de Proveedor')).toBeInTheDocument();
        expect(SuppliersService.getById).toHaveBeenCalledWith(supplier.id);
    });
});
