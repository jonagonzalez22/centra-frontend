import { useEffect } from 'react';
import { useOrdersStore } from '@/features/store/orders/stores/useOrdersStore';
import OrdersPageView from './OrdersPageView';

const OrdersPage: React.FC = () => {
    const fetchOrders = useOrdersStore((s) => s.fetchOrders);
    const orders = useOrdersStore((s) => s.orders);
    const loading = useOrdersStore((s) => s.loading);
    const loadingDetail = useOrdersStore((s) => s.loadingDetail);
    const filters = useOrdersStore((s) => s.filters);
    const pagination = useOrdersStore((s) => s.pagination);
    const drawerOpen = useOrdersStore((s) => s.drawerOpen);
    const selectedOrder = useOrdersStore((s) => s.selectedOrder);
    const setFilters = useOrdersStore((s) => s.setFilters);
    const resetFilters = useOrdersStore((s) => s.resetFilters);
    const openDrawer = useOrdersStore((s) => s.openDrawer);
    const closeDrawer = useOrdersStore((s) => s.closeDrawer);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
        <OrdersPageView
            orders={orders}
            loading={loading}
            loadingDetail={loadingDetail}
            filters={filters}
            pagination={pagination}
            drawerOpen={drawerOpen}
            selectedOrder={selectedOrder}
            onFilterChange={setFilters}
            onResetFilters={resetFilters}
            onPageChange={(page: number) => setFilters({ page })}
            onOpenDrawer={openDrawer}
            onCloseDrawer={closeDrawer}
        />
    );
};

export default OrdersPage;
