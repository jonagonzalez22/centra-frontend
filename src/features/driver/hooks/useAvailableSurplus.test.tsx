import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DriverService } from '../services/driver.service';
import { useAvailableSurplus } from './useAvailableSurplus';
import type { SurplusProduct } from '../interfaces/driver.interface';

vi.mock('../services/driver.service', () => ({
    DriverService: { getAvailableSurplus: vi.fn() },
}));

const getAvailableSurplus = vi.mocked(DriverService.getAvailableSurplus);
const product = (availableQuantity: number): SurplusProduct => ({
    product_id: 'product-1',
    product_name: 'Pintura',
    sku: 'P-1',
    unit_price: 100,
    available_quantity: availableQuantity,
});

describe('useAvailableSurplus', () => {
    beforeEach(() => vi.clearAllMocks());

    test.each([
        ['an empty response', []],
        ['products with zero availability', [product(0)]],
    ])('does not expose availability for %s', async (_label, response) => {
        getAvailableSurplus.mockResolvedValue(response as SurplusProduct[]);
        const { result } = renderHook(() =>
            useAvailableSurplus({ routeId: 'route-1', stopId: 'stop-1', enabled: true })
        );

        expect(result.current.loading).toBe(true);
        expect(result.current.hasAvailableSurplus).toBe(false);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.hasAvailableSurplus).toBe(false);
    });

    test('exposes availability only after a successful response with positive quantity', async () => {
        getAvailableSurplus.mockResolvedValue([product(2)]);
        const { result } = renderHook(() =>
            useAvailableSurplus({ routeId: 'route-1', stopId: 'stop-1', enabled: true })
        );

        expect(result.current.hasAvailableSurplus).toBe(false);
        await waitFor(() => expect(result.current.hasAvailableSurplus).toBe(true));
    });

    test('keeps availability hidden when the request fails', async () => {
        getAvailableSurplus.mockRejectedValue({ message: 'No disponible' });
        const { result } = renderHook(() =>
            useAvailableSurplus({ routeId: 'route-1', stopId: 'stop-1', enabled: true })
        );

        await waitFor(() => expect(result.current.error).toBe('No disponible'));
        expect(result.current.loading).toBe(false);
        expect(result.current.hasAvailableSurplus).toBe(false);
    });

    test('reloads for route or stop changes and ignores an older response', async () => {
        let resolveFirst!: (products: SurplusProduct[]) => void;
        const firstRequest = new Promise<SurplusProduct[]>((resolve) => {
            resolveFirst = resolve;
        });
        getAvailableSurplus
            .mockReturnValueOnce(firstRequest)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([product(1)]);

        const { result, rerender } = renderHook(
            ({ routeId, stopId }) =>
                useAvailableSurplus({ routeId, stopId, enabled: true }),
            { initialProps: { routeId: 'route-1', stopId: 'stop-1' } }
        );

        rerender({ routeId: 'route-2', stopId: 'stop-2' });
        await waitFor(() => expect(getAvailableSurplus).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => resolveFirst([product(9)]));
        expect(result.current.hasAvailableSurplus).toBe(false);

        rerender({ routeId: 'route-2', stopId: 'stop-3' });
        await waitFor(() => expect(result.current.hasAvailableSurplus).toBe(true));
        expect(getAvailableSurplus).toHaveBeenLastCalledWith('route-2');
    });

    test('refreshes availability and hides the action after surplus is consumed', async () => {
        getAvailableSurplus.mockResolvedValueOnce([product(1)]).mockResolvedValueOnce([]);
        const { result } = renderHook(() =>
            useAvailableSurplus({ routeId: 'route-1', stopId: 'stop-1', enabled: true })
        );

        await waitFor(() => expect(result.current.hasAvailableSurplus).toBe(true));
        act(() => result.current.refresh());
        expect(result.current.hasAvailableSurplus).toBe(false);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.hasAvailableSurplus).toBe(false);
        expect(getAvailableSurplus).toHaveBeenCalledTimes(2);
    });
});
