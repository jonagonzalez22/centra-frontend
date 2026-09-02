import { act, renderHook } from '@testing-library/react';
import { useStopDetailItems } from './useStopDetailItems';
import type { StopDetailItem } from '../interfaces/driver.interface';
import type { RejectionReason } from '../services/driver.service';

const item: StopDetailItem = {
    id: 'item-1',
    route_stop_item_id: 'item-1',
    product_id: 'product-1',
    product_name: 'Pintura Látex',
    sku: 'P-1',
    quantity_planned: 5,
    quantity_loaded: 5,
    quantity_delivered: 0,
    quantity_released_for_extra_sale: 0,
    unit_price: 100,
    is_extra: false,
    notes: null,
};

const reasons: RejectionReason[] = [
    { id: 'safe', code: 'customer_absent', label: 'Cliente ausente', suggest_extra_sale: true },
    { id: 'damaged', code: 'damaged_goods', label: 'Mercadería dañada', suggest_extra_sale: false },
];

const renderItemsHook = () =>
    renderHook(() =>
        useStopDetailItems({
            stopId: 'stop-1',
            items: [item],
            rejectionReasons: reasons,
            stopStatus: 'pending',
            completing: false,
        })
    );

test('suggests the full remainder only after selecting a configured reason', () => {
    const { result } = renderItemsHook();

    act(() => result.current.setQuantity(item.id, 3));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(0);

    act(() => result.current.setRejectionReason(item.id, 'safe'));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(2);
});

test('suggests zero for a non-sellable reason and lets the driver adjust a mixed case', () => {
    const { result } = renderItemsHook();

    act(() => {
        result.current.setQuantity(item.id, 3);
        result.current.setRejectionReason(item.id, 'damaged');
    });
    expect(result.current.getItem(item.id)?.releasedQty).toBe(0);

    act(() => result.current.setReleasedQuantity(item.id, 1));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(1);
});

test('changing the reason recalculates the suggestion in both directions', () => {
    const { result } = renderItemsHook();

    act(() => result.current.setQuantity(item.id, 3));
    act(() => result.current.setRejectionReason(item.id, 'safe'));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(2);

    act(() => result.current.setRejectionReason(item.id, 'damaged'));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(0);

    act(() => result.current.setRejectionReason(item.id, 'safe'));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(2);
});

test('increasing delivered clamps released and a full delivery resets it to zero', () => {
    const { result } = renderItemsHook();

    act(() => result.current.setQuantity(item.id, 2));
    act(() => result.current.setRejectionReason(item.id, 'safe'));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(3);

    act(() => result.current.setQuantity(item.id, 4));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(1);

    act(() => result.current.setQuantity(item.id, 5));
    expect(result.current.getItem(item.id)?.releasedQty).toBe(0);
    expect(result.current.getItem(item.id)?.isReduced).toBe(false);
});

test('released quantity never exceeds the current remainder', () => {
    const { result } = renderItemsHook();

    act(() => result.current.setQuantity(item.id, 3));
    act(() => result.current.setReleasedQuantity(item.id, 99));

    expect(result.current.getItem(item.id)?.releasedQty).toBe(2);
});
