import { queryClient } from '@/api/queryClient';
import { useOrdersStore } from '@/features/store/orders/stores/useOrdersStore';
import { usePOSStore } from '@/features/store/sales/stores/usePOSStore';
import { clearPrivateSessionState } from './clearPrivateSessionState';

describe('clearPrivateSessionState', () => {
    beforeEach(() => {
        queryClient.clear();
        usePOSStore.getState().resetPOS();
        useOrdersStore.getState().resetOrders();
    });

    test('clears the complete POS draft, order data, and authenticated query cache', () => {
        usePOSStore.setState({
            items: [{ product_id: 'product-a' }] as never,
            customer: { id: 'customer-a' } as never,
            customer_display_name: 'Cliente anterior',
            payments: [{ amount: 100 }] as never,
            selected_price_list_id: 'list-a',
            selected_price_list_name: 'Mayorista',
            selected_discount_percentage: 10,
            available_price_lists: [{ id: 'list-a' }] as never,
            type: 'order',
            requested_delivery_date: '2026-12-01',
        });
        useOrdersStore.setState({
            orders: [{ id: 'order-a' }] as never,
            selectedOrder: { id: 'order-a' } as never,
            drawerOpen: true,
        });
        queryClient.setQueryData(['reports', 'summary', 1, 10, '2026-11-01', '2026-11-30'], {
            private: true,
        });

        clearPrivateSessionState();

        expect(usePOSStore.getState()).toMatchObject({
            items: [],
            customer: null,
            customer_display_name: null,
            payments: [],
            selected_price_list_id: null,
            selected_price_list_name: null,
            selected_discount_percentage: 0,
            available_price_lists: [],
            type: 'sale',
            requested_delivery_date: null,
        });
        expect(useOrdersStore.getState()).toMatchObject({
            orders: [],
            selectedOrder: null,
            drawerOpen: false,
        });
        expect(queryClient.getQueryData(['reports', 'summary', 1, 10, '2026-11-01', '2026-11-30'])).toBeUndefined();
    });
});
