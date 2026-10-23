import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProductsService } from '../../services/products.service';
import { PurchasePriceHistoryTab } from './PurchasePriceHistoryTab';

vi.mock('../../services/products.service', () => ({
    ProductsService: { getPurchasePriceHistory: vi.fn() },
}));

const renderTab = () => render(<MemoryRouter><PurchasePriceHistoryTab productId="product-1" /></MemoryRouter>);

describe('PurchasePriceHistoryTab', () => {
    beforeEach(() => {
        vi.mocked(ProductsService.getPurchasePriceHistory).mockReset();
    });

    it('renders grouped supplier prices, formatted amounts, dates, and SPA purchase links', async () => {
        vi.mocked(ProductsService.getPurchasePriceHistory).mockResolvedValue([
            {
                supplier: { id: 'supplier-1', business_name: 'Distribuidora Norte' },
                prices: [
                    { purchase_id: 'purchase-1', purchase_number: 'OC-000042', date: '2026-10-18 10:00:00', unit_price: '12000.00' },
                    { purchase_id: 'purchase-2', purchase_number: 'OC-000031', date: '2026-10-03 10:00:00', unit_price: '11500.00' },
                ],
            },
            {
                supplier: { id: 'supplier-2', business_name: 'Química Mendoza' },
                prices: [{ purchase_id: 'purchase-3', purchase_number: 'OC-000038', date: '2026-10-08 10:00:00', unit_price: '10800.00' }],
            },
        ]);

        renderTab();

        expect(await screen.findByText('Distribuidora Norte')).toBeInTheDocument();
        expect(screen.getByText('Química Mendoza')).toBeInTheDocument();
        expect(screen.getByText(/12\.000,00/)).toBeInTheDocument();
        expect(screen.getByText('18/10/2026')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'OC-000042' })).toHaveAttribute('href', '/tienda/compras/purchase-1');
    });

    it('uses the standard spinner while the history is loading', () => {
        vi.mocked(ProductsService.getPurchasePriceHistory).mockReturnValue(new Promise(() => {}));
        const { container } = renderTab();

        expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });

    it('shows the informative empty state', async () => {
        vi.mocked(ProductsService.getPurchasePriceHistory).mockResolvedValue([]);
        renderTab();

        expect(await screen.findByText('Este producto todavía no tiene precios de compra registrados.')).toBeInTheDocument();
    });

    it('keeps the tab open and retries after an API error', async () => {
        vi.mocked(ProductsService.getPurchasePriceHistory)
            .mockRejectedValueOnce({ message: 'No se pudo cargar.' })
            .mockResolvedValueOnce([]);
        renderTab();

        expect(await screen.findByText('No se pudo cargar.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

        await waitFor(() => expect(ProductsService.getPurchasePriceHistory).toHaveBeenCalledTimes(2));
        expect(await screen.findByText('Este producto todavía no tiene precios de compra registrados.')).toBeInTheDocument();
    });
});
