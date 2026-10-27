import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PriceListsPage } from './PriceListsPage';

const mockSave = vi.fn();
const mockRemove = vi.fn();
const mockApplyFilters = vi.fn();
let mockFetching = false;
let mockItems = [
    {
        id: '1',
        name: 'Mayorista',
        discount_percentage: '7.50',
        is_active: true,
        created_at: '',
        updated_at: '',
    },
    {
        id: '2',
        name: 'Revendedor',
        discount_percentage: '10.00',
        is_active: false,
        created_at: '',
        updated_at: '',
    },
];

vi.mock('@/features/store/price-lists/hooks/usePriceLists', () => ({
    usePriceLists: () => ({
        items: mockItems,
        loading: false,
        fetching: mockFetching,
        filters: {},
        applyFilters: mockApplyFilters,
        save: mockSave,
        remove: mockRemove,
    }),
}));
vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderPage = () =>
    render(
        <MemoryRouter>
            <PriceListsPage />
        </MemoryRouter>
    );

describe('PriceListsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetching = false;
        mockItems = [
            {
                id: '1',
                name: 'Mayorista',
                discount_percentage: '7.50',
                is_active: true,
                created_at: '',
                updated_at: '',
            },
            {
                id: '2',
                name: 'Revendedor',
                discount_percentage: '10.00',
                is_active: false,
                created_at: '',
                updated_at: '',
            },
        ];
    });

    test('renders formatted discounts and status', () => {
        renderPage();
        expect(screen.getAllByText('7,5%').length).toBeGreaterThan(0);
        expect(screen.getAllByText('10%').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Activa').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inactiva').length).toBeGreaterThan(0);
    });

    test('shows the configured empty state', () => {
        mockItems = [];
        renderPage();
        expect(
            screen.getAllByText('No hay listas de precios configuradas.').length
        ).toBeGreaterThan(0);
        expect(screen.getByText('Nueva lista')).toBeInTheDocument();
        expect(screen.queryByText('Crear lista')).not.toBeInTheDocument();
        expect(
            screen.queryByText(
                'El precio común utiliza el precio de venta del producto y no requiere configuración.'
            )
        ).not.toBeInTheDocument();
    });

    test('opens the create modal and saves normalized decimal input', async () => {
        renderPage();
        fireEvent.click(screen.getByText('Nueva lista'));
        fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Distribuidor' } });
        fireEvent.change(screen.getByLabelText('Descuento'), { target: { value: '12,25' } });
        fireEvent.click(screen.getByText('Crear lista'));

        await vi.waitFor(() =>
            expect(mockSave).toHaveBeenCalledWith(null, {
                name: 'Distribuidor',
                discount_percentage: '12.25',
                is_active: true,
            })
        );
    });

    test('debounces search without losing the input value or focus', async () => {
        vi.useFakeTimers();
        renderPage();

        const searchInput = screen.getByLabelText('Búsqueda');
        searchInput.focus();
        fireEvent.change(searchInput, { target: { value: 'M' } });
        fireEvent.change(searchInput, { target: { value: 'Ma' } });
        fireEvent.change(searchInput, { target: { value: 'Mayorista' } });

        expect(searchInput).toHaveValue('Mayorista');
        expect(document.activeElement).toBe(searchInput);
        expect(mockApplyFilters).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(349);
        expect(mockApplyFilters).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(mockApplyFilters).toHaveBeenCalledOnce();
        expect(mockApplyFilters).toHaveBeenCalledWith({ search: 'Mayorista', is_active: undefined });

        vi.useRealTimers();
    });

    test('applies the state filter immediately', async () => {
        renderPage();

        fireEvent.mouseDown(screen.getByLabelText('Estado'));
        fireEvent.click(await screen.findByText('Activas'));

        expect(mockApplyFilters).toHaveBeenCalledWith({ search: undefined, is_active: true });
    });

    test('keeps filters mounted during a refetch and clears pending searches immediately', async () => {
        vi.useFakeTimers();
        const view = renderPage();
        const searchInput = screen.getByLabelText('Búsqueda');

        fireEvent.change(searchInput, { target: { value: 'Mayorista' } });
        mockFetching = true;
        view.rerender(
            <MemoryRouter>
                <PriceListsPage />
            </MemoryRouter>
        );

        expect(screen.getByLabelText('Búsqueda')).toBeInTheDocument();
        expect(screen.getByLabelText('Búsqueda')).not.toBeDisabled();

        fireEvent.click(screen.getByText('Limpiar'));
        expect(screen.getByLabelText('Búsqueda')).toHaveValue('');
        expect(mockApplyFilters).toHaveBeenCalledWith({});

        mockApplyFilters.mockClear();
        await vi.advanceTimersByTimeAsync(350);
        expect(mockApplyFilters).not.toHaveBeenCalled();

        vi.useRealTimers();
    });
});
