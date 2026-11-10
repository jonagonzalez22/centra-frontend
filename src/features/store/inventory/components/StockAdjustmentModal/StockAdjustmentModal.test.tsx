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
    stock_measurement_unit: {
        id: 'unit-1',
        code: 'l',
        name: 'Litro',
        symbol: 'L',
        category: 'volume',
    },
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

const renderModal = (item = product()) =>
    render(<StockAdjustmentModal open onClose={vi.fn()} product={item} />);

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
        await waitFor(() =>
            expect(screen.getByText('El concepto es obligatorio.')).toBeInTheDocument()
        );

        fireEvent.change(concept, { target: { value: 'Producción interna de cloro' } });

        await waitFor(() =>
            expect(screen.queryByText('El concepto es obligatorio.')).not.toBeInTheDocument()
        );
    });

    it('submits the written concept and preserves exact decimal payloads', async () => {
        vi.mocked(InventoryMovementsService.create).mockResolvedValue({} as never);
        renderModal();

        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tipo de Ajuste' }));
        fireEvent.click(await screen.findByText('Entrada'));
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad del ajuste' }), {
            target: { value: '0.1250' },
        });
        fireEvent.change(screen.getByRole('textbox', { name: 'Motivo / Concepto' }), {
            target: { value: 'Producción interna de cloro' },
        });

        await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

        await waitFor(() =>
            expect(InventoryMovementsService.create).toHaveBeenCalledWith({
                product_id: 'product-1',
                type: 'input',
                quantity: '0.1250',
                concept: 'Producción interna de cloro',
            })
        );
    }, 10000);

    it('shows the optional unit cost only for a positive inventory input', async () => {
        renderModal();

        expect(
            screen.queryByRole('spinbutton', { name: 'Precio de costo de las unidades ingresadas' })
        ).not.toBeInTheDocument();

        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tipo de Ajuste' }));
        fireEvent.click(await screen.findByText('Entrada'));
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad del ajuste' }), {
            target: { value: '1' },
        });

        expect(
            await screen.findByRole('spinbutton', {
                name: 'Precio de costo de las unidades ingresadas',
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText('Informalo si conocés el costo de esta mercadería.')
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('checkbox', { name: 'Actualizar el precio de costo del producto' })
        ).not.toBeInTheDocument();
    });

    it('does not show unit cost for an output', async () => {
        renderModal();

        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tipo de Ajuste' }));
        fireEvent.click(await screen.findByText('Salida'));
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad del ajuste' }), {
            target: { value: '1' },
        });

        expect(
            screen.queryByRole('spinbutton', { name: 'Precio de costo de las unidades ingresadas' })
        ).not.toBeInTheDocument();
    });

    it('parses grouped monetary input, enables the product-cost checkbox, and sends a normalized payload', async () => {
        vi.mocked(InventoryMovementsService.create).mockResolvedValue({} as never);
        renderModal();

        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tipo de Ajuste' }));
        fireEvent.click(await screen.findByText('Entrada'));
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad del ajuste' }), {
            target: { value: '2' },
        });
        fireEvent.change(
            await screen.findByRole('spinbutton', {
                name: 'Precio de costo de las unidades ingresadas',
            }),
            { target: { value: '1.200' } }
        );
        fireEvent.click(
            await screen.findByRole('checkbox', {
                name: 'Actualizar el precio de costo del producto',
            })
        );
        fireEvent.change(screen.getByRole('textbox', { name: 'Motivo / Concepto' }), {
            target: { value: 'Ingreso con costo' },
        });

        expect(
            screen.getByText('Usa este importe como nuevo costo del producto.')
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

        await waitFor(() =>
            expect(InventoryMovementsService.create).toHaveBeenCalledWith({
                product_id: 'product-1',
                type: 'input',
                quantity: '2.0000',
                concept: 'Ingreso con costo',
                unit_cost: '1200.00',
                update_product_cost: true,
            })
        );
    }, 10000);
});
