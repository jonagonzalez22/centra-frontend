import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ReconciliationService } from '../services/reconciliation.service';
import { useReconciliation } from './useReconciliation';
import type { RouteReconciliationSummary } from '../interfaces/reconciliation.interface';

vi.mock('../services/reconciliation.service', () => ({
    ReconciliationService: { getSummary: vi.fn() },
}));

const getSummary = vi.mocked(ReconciliationService.getSummary);

const summary: RouteReconciliationSummary = {
    route_id: 'route-1',
    status: 'awaiting_reconciliation',
    operational_date: '2026-09-10',
    vehicle: 'Camión 1',
    driver: 'Chofer',
    collection_groups: [],
    totals: { declared_amount: 0, pending_amount: 0, verified_amount: 0, rejected_amount: 0 },
    can_close: false,
    stops: [
        {
            stop_id: 'stop-1',
            sequence: 1,
            status: 'completed',
            order: {
                id: 'order-1',
                operation_number: 'P-000001',
                customer_name: 'Dina Capuzello',
                total_amount: 0,
                paid_amount: 0,
                pending_balance: 0,
            },
            collections: [],
            items: [
                {
                    route_stop_item_id: 'item-1',
                    product_id: 'product-d',
                    product_name: 'Producto D',
                    quantity_loaded: 3,
                    quantity_delivered: 1,
                    difference: 2,
                    extra_sale_allocated: 0,
                    discrepancy: null,
                },
            ],
        },
        {
            stop_id: 'stop-2',
            sequence: 2,
            status: 'completed',
            order: {
                id: 'order-2',
                operation_number: 'P-000002',
                customer_name: 'Juan Pérez',
                total_amount: 0,
                paid_amount: 0,
                pending_balance: 0,
            },
            collections: [],
            items: [
                {
                    route_stop_item_id: 'item-2',
                    product_id: 'product-d',
                    product_name: 'Producto D',
                    quantity_loaded: 4,
                    quantity_delivered: 1,
                    difference: 3,
                    extra_sale_allocated: 0,
                    discrepancy: null,
                },
            ],
        },
    ],
};

describe('useReconciliation', () => {
    beforeEach(() => vi.clearAllMocks());

    test('groups same-product discrepancies while preserving stop and order context', async () => {
        getSummary.mockResolvedValue(summary);
        const { result } = renderHook(() => useReconciliation('route-1'));

        await act(async () => result.current.fetchSummary());
        await waitFor(() => expect(result.current.discrepancyGroups).toHaveLength(1));

        expect(result.current.discrepancyGroups[0]).toMatchObject({
            product_id: 'product-d',
            total_difference: 5,
            affected_orders_count: 2,
            status: 'pending',
            can_batch_resolve: true,
        });
        expect(result.current.discrepancyGroups[0].items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    route_stop_item_id: 'item-1',
                    order_number: 'P-000001',
                    customer_name: 'Dina Capuzello',
                }),
                expect.objectContaining({
                    route_stop_item_id: 'item-2',
                    order_number: 'P-000002',
                    customer_name: 'Juan Pérez',
                }),
            ])
        );
    });

    test('hides zero-difference technical extra-sale discrepancies from actionable groups', async () => {
        getSummary.mockResolvedValue({
            ...summary,
            stops: [
                {
                    ...summary.stops[0],
                    items: [
                        {
                            ...summary.stops[0].items[0],
                            difference: 0,
                            discrepancy: {
                                id: 'discrepancy-extra-sale',
                                resolution_type: 'extra_sale',
                                notes: null,
                                resolved_at: '2026-09-10T12:00:00Z',
                            },
                        },
                    ],
                },
            ],
        });
        const { result } = renderHook(() => useReconciliation('route-1'));

        await act(async () => result.current.fetchSummary());

        expect(result.current.discrepancyGroups).toHaveLength(0);
        expect(result.current.pendingDiscrepanciesCount).toBe(0);
    });
});
