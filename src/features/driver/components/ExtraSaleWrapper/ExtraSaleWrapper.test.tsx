import { render } from '@testing-library/react';
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
        summary: { totalUnits: 0, totalProducts: 0, totalAmount: 0 },
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
