import { act, renderHook } from '@testing-library/react';
import { DriverService } from '../services/driver.service';
import { useCollectionPreview } from './useCollectionPreview';

vi.mock('../services/driver.service', () => ({
    DriverService: { previewCollection: vi.fn() },
}));

const firstPreview = {
    order_total: 5000,
    delivered_value_current_stop: 5000,
    delivered_value_cumulative: 5000,
    verified_paid_amount: 0,
    pending_declared_amount: 0,
    amount_to_collect_now: 5000,
};

test('debounces preview requests and requests backend values for delivered quantities', async () => {
    vi.useFakeTimers();
    vi.mocked(DriverService.previewCollection).mockResolvedValue(firstPreview);

    const { result } = renderHook(() =>
        useCollectionPreview({
            stopId: 'stop-1',
            items: [{ route_stop_item_id: 'item-1', quantity_delivered: 3 }],
            enabled: true,
        })
    );

    expect(result.current.loading).toBe(true);
    expect(DriverService.previewCollection).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(300));

    expect(result.current.preview).toEqual(firstPreview);
    expect(DriverService.previewCollection).toHaveBeenCalledWith(
        'stop-1',
        [{ route_stop_item_id: 'item-1', quantity_delivered: 3 }],
        expect.any(AbortSignal)
    );
    vi.useRealTimers();
});

test('aborts obsolete requests and only exposes the newest preview', async () => {
    vi.useFakeTimers();
    let resolveFirst: ((value: typeof firstPreview) => void) | undefined;
    vi.mocked(DriverService.previewCollection)
        .mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveFirst = resolve;
                })
        )
        .mockResolvedValueOnce({ ...firstPreview, amount_to_collect_now: 3000 });

    const { result, rerender } = renderHook(
        ({ quantity }) =>
            useCollectionPreview({
                stopId: 'stop-1',
                items: [{ route_stop_item_id: 'item-1', quantity_delivered: quantity }],
                enabled: true,
            }),
        { initialProps: { quantity: 5 } }
    );

    await act(async () => vi.advanceTimersByTimeAsync(300));
    rerender({ quantity: 3 });
    expect(result.current.preview).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(result.current.preview?.amount_to_collect_now).toBe(3000);

    await act(async () => resolveFirst?.(firstPreview));
    expect(result.current.preview?.amount_to_collect_now).toBe(3000);
    vi.useRealTimers();
});
