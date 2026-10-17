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

    it('keeps the low-stock alert and physical stock adjustment for an own-stock product', async () => {
        vi.mocked(ProductsService.getById).mockResolvedValue({
            id: 'own-product',
            name: 'Producto propio',
            sku: 'PROPIO-1',
            barcode: null,
            description: null,
            price: 100,
            cost: null,
            stock: '1.0000',
            stock_reserved: '0.0000',
            available_stock: '1.0000',
            commercial_available_quantity: '1.0000',
            stock_min: '2.0000',
            stock_measurement_unit_id: 'unit-1',
            stock_measurement_unit: { id: 'unit-1', code: 'unit', name: 'Unidad', symbol: 'u', category: 'unit' },
            sale_quantity_step: '1.0000',
            is_active: true,
            category: { id: 'category-1', name: 'General' },
            parent_product_id: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
        });

        render(<ProductDrawer open onClose={vi.fn()} productId="own-product" />);

        expect(await screen.findByText('Stock bajo')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ajustar Stock' })).toBeInTheDocument();
    });

    it('shows shared-stock information without a physical-stock alert or adjustment action', async () => {
        vi.mocked(ProductsService.getById).mockResolvedValue({
            id: 'child-product',
            name: 'Bidón asociado',
            sku: 'BIDON-5L',
            barcode: null,
            description: null,
            price: 100,
            cost: null,
            stock: '0.0000',
            stock_reserved: '0.0000',
            available_stock: '0.0000',
            commercial_available_quantity: '2.0000',
            stock_min: '10.0000',
            stock_measurement_unit_id: 'unit-1',
            stock_measurement_unit: { id: 'unit-1', code: 'unit', name: 'Unidad', symbol: 'u', category: 'unit' },
            stock_source_product: {
                id: 'source-product',
                name: 'Ariel granel',
                sku: 'ARIEL-GR',
                stock_measurement_unit: { id: 'liter-1', code: 'l', name: 'Litro', symbol: 'L', category: 'volume' },
            },
            stock_consumption_quantity: '5.0000',
            sale_quantity_step: '1.0000',
            is_active: true,
            category: { id: 'category-1', name: 'Limpieza' },
            parent_product_id: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
        });

        const { container } = render(<ProductDrawer open onClose={vi.fn()} productId="child-product" />);

        expect(await screen.findByText('Stock compartido')).toBeInTheDocument();
        expect(screen.getByText('Ariel granel')).toBeInTheDocument();
        expect(screen.getByText('5 L por 1 u')).toBeInTheDocument();
        expect(screen.getByText('2 u')).toBeInTheDocument();
        expect(screen.queryByText('Stock bajo')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Ajustar Stock' })).not.toBeInTheDocument();
        expect(container.querySelector('.productDrawerSectionDanger')).not.toBeInTheDocument();
    });
});
