import { queryClient } from '@/api/queryClient';
import { useOrdersStore } from '@/features/store/orders/stores/useOrdersStore';
import { usePOSStore } from '@/features/store/sales/stores/usePOSStore';

/** Clears only data derived from an authenticated store session. */
export function clearPrivateSessionState(): void {
    usePOSStore.getState().resetPOS();
    useOrdersStore.getState().resetOrders();

    // React Query ignores results from cancelled queries. Clearing immediately
    // also prevents a newly mounted identity from reading an old cache entry.
    void queryClient.cancelQueries();
    queryClient.clear();
}
