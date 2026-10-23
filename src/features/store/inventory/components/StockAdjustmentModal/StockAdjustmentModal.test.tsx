import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { InventoryMovementsService } from '../../services/inventoryMovements.service';
import type { Product } from '@/features/store/products/interfaces/product.interface';

vi.mock('../../services/inventoryMovements.service', () => ({
    InventoryMovementsService: { create: vi.fn() },
}));

const product = (overrides: Partial<Product> = {}): Product => ({
    id: 'product-1',
    name: 'Cloro',
    sku: 'CLORO-001',
    barcode: null,
    description: null,
    price: '100.00',
    cost: null,
    stock: '10.0000',
    stock_reserved: '0.0000',
    available_stock: '10.0000',
    stock_min: '0.0000',
    stock_measurement_unit_id: 'unit-1',
    stock_measurement_unit: { id: 'unit-1', code: 'l', name: 'Litro', symbol: 'L', category: 'volume' },
    stock_source_product: null,
    stock_consumption_quantity: null,
    sale_quantity_step: '1.0000',
    commercial_available_quantity: '10.0000',
    is_active: true,
    is_sellable: true,
    category: { id: 'category-1', name: 'Limpieza' },
    parent_product_id: null,
    created_at: '2026-01-01T00:00:00.000000Z',
    updated_at: '2026-01-01T00:00:00.000000Z',
    ...overrides,
});

const renderModal = (item = product()) => render(
    <StockAdjustmentModal open onClose={vi.fn()} product={item} />,
);

describe('StockAdjustmentModal', () => {
    beforeEach(() => {
        vi.mocked(InventoryMovementsService.create).mockReset();
    });

    it('formats stock quantities without trailing zeroes and displays the physical UOM', () => {
        renderModal(product({ available_stock: '2.5000' }));

        expect(screen.getAllByText('2,5 L')).toHaveLength(2);
        expect(screen.getByText('Stock Resultante')).toBeInTheDocument();
    });

    it('presents a whole fixed-scale quantity without decimal zeroes', () => {
        renderModal(product({ available_stock: '10.0000' }));

        expect(screen.getAllByText('10 L')).toHaveLength(2);
    });

    it('formats the quantity input with up to four exact decimal places', async () => {
        renderModal();
        const quantity = screen.getByRole('spinbutton', { name: 'Cantidad del ajuste' });

        fireEvent.change(quantity, { target: { value: '2.5000' } });
        fireEvent.blur(quantity);

        await waitFor(() => expect(quantity).toHaveValue('2,5'));
        expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('clears the required concept error when a valid value is entered', async () => {
        renderModal();
        const form = document.getElementById('stockAdjustmentForm');
        const concept = screen.getByRole('textbox', { name: 'Motivo / Concepto' });

        fireEvent.submit(form as HTMLFormElement);
        await waitFor(() => expect(screen.getByText('El concepto es obligatorio.')).toBeInTheDocument());

        fireEvent.change(concept, { target: { value: 'Producción interna de cloro' } });

        await waitFor(() => expect(screen.queryByText('El concepto es obligatorio.')).not.toBeInTheDocument());
    });

    it('submits the written concept and preserves exact decimal payloads', async () => {
        vi.mocked(InventoryMovementsService.create).mockResolvedValue({} as never);
        renderModal();

        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tipo de Ajuste' }));
        fireEvent.click(await screen.findByText('Entrada'));
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad del ajuste' }), { target: { value: '0.1250' } });
        fireEvent.change(screen.getByRole('textbox', { name: 'Motivo / Concepto' }), { target: { value: 'Producción interna de cloro' } });

        await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

        await waitFor(() => expect(InventoryMovementsService.create).toHaveBeenCalledWith({
            product_id: 'product-1',
            type: 'input',
            quantity: '0.1250',
            concept: 'Producción interna de cloro',
        }));
    }, 10000);
});
