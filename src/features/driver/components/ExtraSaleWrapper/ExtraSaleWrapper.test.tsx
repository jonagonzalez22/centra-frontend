import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ExtraSaleWrapper } from './ExtraSaleWrapper';
import { useExtraSale } from '../../hooks/useExtraSale';

vi.mock('../../hooks/useExtraSale', () => ({ useExtraSale: vi.fn() }));

const loadSurplus = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExtraSale).mockReturnValue({
        surplusProducts: [],
        loadingSurplus: false,
        submitting: false,
        selectedQuantities: {},
        searchQuery: '',
        filteredProducts: [],
        summary: { totalProducts: 0, totalAmount: 0 },
        isValid: false,
        loadSurplus,
        setQuantity: vi.fn(),
        changeQuantity: vi.fn(),
        setSearchQuery: vi.fn(),
        submitExtraSale: vi.fn(),
        resetSelections: vi.fn(),
    });
});

test('revalidates surplus when the extra sale drawer opens', () => {
    const { rerender } = render(
        <ExtraSaleWrapper
            open={false}
            routeId="route-1"
            stopId="stop-1"
            onClose={vi.fn()}
            onSuccess={vi.fn()}
        />
    );

    expect(loadSurplus).not.toHaveBeenCalled();
    rerender(
        <ExtraSaleWrapper
            open
            routeId="route-1"
            stopId="stop-1"
            onClose={vi.fn()}
            onSuccess={vi.fn()}
        />
    );

    expect(loadSurplus).toHaveBeenCalledWith('route-1');
});

test('presents associated surplus with its commercial product, UOM and step', () => {
    const changeQuantity = vi.fn();
    vi.mocked(useExtraSale).mockReturnValue({
        surplusProducts: [],
        loadingSurplus: false,
        submitting: false,
        selectedQuantities: {},
        searchQuery: '',
        filteredProducts: [
            {
                product_id: 'child-a',
                product_name: 'Bidón Ariel 5L',
                sku: 'ARIEL-5L',
                unit_price: 100,
                available_quantity: '1.0000',
                sale_quantity_step: '1.0000',
                stock_measurement_unit: { symbol: 'u' },
            },
        ],
        summary: { totalProducts: 0, totalAmount: 0 },
        isValid: false,
        loadSurplus,
        setQuantity: vi.fn(),
        changeQuantity,
        setSearchQuery: vi.fn(),
        submitExtraSale: vi.fn(),
        resetSelections: vi.fn(),
    });

    render(
        <ExtraSaleWrapper
            open
            routeId="route-1"
            stopId="stop-1"
            onClose={vi.fn()}
            onSuccess={vi.fn()}
        />
    );

    expect(screen.getByText('Bidón Ariel 5L')).toBeInTheDocument();
    expect(screen.getByText('Disponible: 1 u')).toBeInTheDocument();
    expect(screen.queryByText('Botella Ariel 1L')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+' }));

    expect(changeQuantity).toHaveBeenCalledWith('child-a', 1);
});
