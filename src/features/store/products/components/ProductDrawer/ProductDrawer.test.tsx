import { render, screen } from '@testing-library/react';
import { ProductDrawer } from './ProductDrawer';
import { ProductsService } from '../../services/products.service';

vi.mock('../../services/products.service', () => ({
    ProductsService: {
        getById: vi.fn(),
    },
}));
vi.mock('@/features/store/inventory/components/StockHistoryTab', () => ({ StockHistoryTab: () => null }));
vi.mock('@/features/store/inventory/components/StockAdjustmentModal', () => ({ StockAdjustmentModal: () => null }));
vi.mock('@/components/auth/CanDo', () => ({ CanDo: ({ children }: { children: React.ReactNode }) => children }));

describe('ProductDrawer UOM information', () => {
    it('shows the unit, step, and physical/commercial stock values', async () => {
        vi.mocked(ProductsService.getById).mockResolvedValue({
            id: 'product-1',
            name: 'Jabón',
            sku: 'JAB-1',
            barcode: null,
            description: null,
            price: 100,
            cost: null,
            stock: '48.8750',
            stock_reserved: '0.0000',
            available_stock: '48.8750',
            commercial_available_quantity: '48.7500',
            stock_min: '10.0000',
            stock_measurement_unit_id: 'kg-1',
            stock_measurement_unit: { id: 'kg-1', code: 'kg', name: 'Kilogramo', symbol: 'kg', category: 'weight' },
            sale_quantity_step: '0.2500',
            is_active: true,
            category: { id: 'category-1', name: 'Limpieza' },
            parent_product_id: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
        });

        render(<ProductDrawer open onClose={vi.fn()} productId="product-1" />);

        expect(await screen.findByText('Kilogramo (kg)')).toBeInTheDocument();
        expect(screen.getAllByText('48,875 kg')).toHaveLength(1);
        expect(screen.getByText('48,75 kg')).toBeInTheDocument();
        expect(screen.getByText('0,25 kg')).toBeInTheDocument();
        expect(screen.getByText('Cantidad mínima de venta')).toBeInTheDocument();
        expect(screen.getByText('Disponible para vender')).toBeInTheDocument();
        expect(screen.queryByText('Stock Disponible')).not.toBeInTheDocument();
        expect(screen.queryByText('Stock Comercial Disponible')).not.toBeInTheDocument();
    });
});
