import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GeneratePriceListPage } from './GeneratePriceListPage';
import { PriceListsService } from '@/features/store/price-lists/services/priceLists.service';
import { ProductsService } from '@/features/store/products/services/products.service';
import { CategoriesService } from '@/features/store/categories/services/categories.service';
import { BrandsService } from '@/features/store/brands/services/brands.service';
import { createPriceListPdf } from '@/features/store/price-lists/documents/priceListPdf.service';
import { printA4PdfBlob } from '@/features/store/sales/documents/a4-pdf.service';

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can: (permission: string) => permission === 'inventory.view' }),
}));
vi.mock('@/features/store/price-lists/services/priceLists.service', () => ({
    PriceListsService: { getAll: vi.fn(), exportData: vi.fn() },
}));
vi.mock('@/features/store/products/services/products.service', () => ({
    ProductsService: { getAll: vi.fn() },
}));
vi.mock('@/features/store/categories/services/categories.service', () => ({
    CategoriesService: { getOperationalOptions: vi.fn() },
}));
vi.mock('@/features/store/brands/services/brands.service', () => ({
    BrandsService: { getOperationalOptions: vi.fn() },
}));
vi.mock('@/features/store/price-lists/documents/priceListPdf.service', () => ({
    createPriceListPdf: vi.fn(),
}));
vi.mock('@/features/store/sales/documents/a4-pdf.service', () => ({ printA4PdfBlob: vi.fn() }));

const exportData = {
    store: { name: 'Centra', logo_url: null, phone: null, address: null },
    pricing_mode: 'price_list' as const,
    price_list: { id: 'list-1', name: 'Mayorista', discount_percentage: '10.00' },
    generated_at: '2026-11-23T10:00:00-03:00',
    products: [
        {
            id: 'product-1',
            name: 'Agua',
            sku: 'AGUA-1',
            category: null,
            brand: null,
            measurement_unit: { code: 'l', name: 'Litro', symbol: 'L' },
            list_price: '10.05',
            discount_percentage: '10.00',
            discount_amount: '1.01',
            final_price: '9.04',
            commercial_available_quantity: '1.0000',
        },
    ],
    summary: { product_count: 1, excluded_product_count: 0, include_out_of_stock: true },
    excluded_product_ids: [],
};

const renderPage = () =>
    render(
        <MemoryRouter>
            <QueryClientProvider
                client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
            >
                <GeneratePriceListPage />
            </QueryClientProvider>
        </MemoryRouter>
    );

const selectPriceListMode = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('combobox', { name: 'Precios' }));
    await user.click(screen.getByText('Mayorista · 10%'));
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PriceListsService.getAll).mockResolvedValue({
        items: [
            {
                id: 'list-1',
                name: 'Mayorista',
                discount_percentage: '10.00',
                is_active: true,
                created_at: '',
                updated_at: '',
            },
        ],
        total: 1,
        per_page: 100,
        current_page: 1,
        last_page: 1,
    });
    vi.mocked(CategoriesService.getOperationalOptions).mockResolvedValue([
        { id: 'category-1', name: 'Bebidas', description: null, is_active: true },
    ]);
    vi.mocked(BrandsService.getOperationalOptions).mockResolvedValue([
        { id: 'brand-1', name: 'Centra', is_active: true },
    ]);
    vi.mocked(ProductsService.getAll).mockResolvedValue({
        items: [
            { id: 'product-1', name: 'Agua', sku: 'AGUA-1' },
            { id: 'product-2', name: 'Jugo', sku: 'JUGO-1' },
        ],
        total: 22,
        per_page: 20,
        current_page: 1,
        last_page: 2,
    } as never);
    vi.mocked(PriceListsService.exportData).mockResolvedValue(exportData);
    vi.mocked(createPriceListPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    vi.mocked(printA4PdfBlob).mockResolvedValue();
    vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:price-list'),
        revokeObjectURL: vi.fn(),
    });
});

test('keeps custom selections when filters change and sends selected IDs to the backend', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectPriceListMode(user);
    await user.click(screen.getByLabelText('Selección personalizada'));
    await user.click(await screen.findByRole('checkbox', { name: /Agua/ }));
    expect(screen.getByText('1 seleccionado')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o código'), {
        target: { value: 'jugo' },
    });
    expect(screen.getByText('1 seleccionado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Vista previa/ }));
    await waitFor(() =>
        expect(PriceListsService.exportData).toHaveBeenCalledWith(
            expect.objectContaining({
                pricing_mode: 'price_list',
                price_list_id: 'list-1',
                selection_mode: 'selected',
                product_ids: ['product-1'],
                filters: { include_out_of_stock: true },
            })
        )
    );
    expect(createPriceListPdf).toHaveBeenCalledWith(exportData, { groupByCategory: true });
    expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeEnabled();
});

test('invalidates the preview when document options change and reports excluded products', async () => {
    const user = userEvent.setup();
    vi.mocked(PriceListsService.exportData).mockResolvedValue({
        ...exportData,
        excluded_product_ids: ['product-2'],
        summary: { ...exportData.summary, excluded_product_count: 1 },
    });
    renderPage();
    await selectPriceListMode(user);
    await user.click(screen.getByRole('button', { name: /Vista previa/ }));
    await screen.findByText(/fueron excluidos/);
    expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeEnabled();

    await user.click(screen.getByRole('switch', { name: 'Agrupar por categoría' }));
    expect(createPriceListPdf).toHaveBeenCalledTimes(1);
});

test('does not apply a stale export response after the configuration changes while loading', async () => {
    let resolveExport: ((value: typeof exportData) => void) | undefined;
    vi.mocked(PriceListsService.exportData).mockReturnValueOnce(
        new Promise((resolve) => {
            resolveExport = resolve;
        })
    );
    const user = userEvent.setup();
    renderPage();
    await selectPriceListMode(user);
    await user.click(screen.getByRole('button', { name: /Vista previa/ }));
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o código'), {
        target: { value: 'nuevo' },
    });
    resolveExport?.(exportData);

    await waitFor(() => expect(createPriceListPdf).not.toHaveBeenCalled());
});

test('prevents a second generation while the export request is pending', async () => {
    let resolveExport: ((value: typeof exportData) => void) | undefined;
    vi.mocked(PriceListsService.exportData).mockReturnValueOnce(
        new Promise((resolve) => {
            resolveExport = resolve;
        })
    );
    const user = userEvent.setup();
    renderPage();
    await selectPriceListMode(user);

    await user.dblClick(screen.getByRole('button', { name: /Vista previa/ }));
    expect(PriceListsService.exportData).toHaveBeenCalledTimes(1);

    resolveExport?.(exportData);
    await waitFor(() =>
        expect(createPriceListPdf).toHaveBeenCalledWith(exportData, { groupByCategory: true })
    );
});

test('keeps the document unavailable when the export endpoint rejects the request', async () => {
    vi.mocked(PriceListsService.exportData).mockRejectedValueOnce({
        status: 422,
        message: 'Error de validación.',
    });
    const user = userEvent.setup();
    renderPage();
    await selectPriceListMode(user);
    await user.click(screen.getByRole('button', { name: /Vista previa/ }));

    await waitFor(() => expect(createPriceListPdf).not.toHaveBeenCalled());
});

test('uses general prices by default and invalidates the preview when selecting a price list', async () => {
    const user = userEvent.setup();
    vi.mocked(PriceListsService.exportData).mockResolvedValue({
        ...exportData,
        pricing_mode: 'general',
        price_list: null,
    });
    renderPage();

    expect(screen.getByText('Precios generales (sin descuento)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Vista previa/ }));
    await waitFor(() =>
        expect(PriceListsService.exportData).toHaveBeenCalledWith(
            expect.objectContaining({ pricing_mode: 'general' })
        )
    );
    expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeEnabled();

    await user.click(screen.getByRole('combobox', { name: 'Precios' }));
    await user.click(screen.getByText('Mayorista · 10%'));
    await user.click(screen.getByRole('button', { name: /Vista previa/ }));
    await waitFor(() =>
        expect(PriceListsService.exportData).toHaveBeenLastCalledWith(
            expect.objectContaining({ pricing_mode: 'price_list', price_list_id: 'list-1' })
        )
    );
});

test('downloads and prints directly, reusing the generated Blob without opening the preview', async () => {
    const click = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Descargar PDF/ }));
    await waitFor(() => expect(createPriceListPdf).toHaveBeenCalledTimes(1));
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.queryByTitle('Vista previa del PDF')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Imprimir/ }));
    await waitFor(() => expect(printA4PdfBlob).toHaveBeenCalledTimes(1));
    expect(PriceListsService.exportData).toHaveBeenCalledTimes(1);
    expect(createPriceListPdf).toHaveBeenCalledTimes(1);
});
