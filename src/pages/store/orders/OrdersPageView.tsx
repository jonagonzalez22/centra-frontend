import { Empty, Pagination, Skeleton } from 'antd';
import { CalendarDays, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/Button';
import { MetricCard } from '@/components/MetricCard';
import { OrderFilters } from '@/features/store/orders/components/OrderFilters';
import { OrderCard } from '@/features/store/orders/components/OrderCard';
import { OrderDrawer } from '@/features/store/orders/components/OrderDrawer';
import { formatCurrency, formatDateLong } from '@/utils/formatters';
import type {
    OrderFilters as OrderFiltersType,
    OrderListItem,
    OrderDetail,
} from '@/features/store/orders/interfaces/order.interface';

interface OrdersPageViewProps {
    orders: OrderListItem[];
    loading: boolean;
    loadingDetail: boolean;
    filters: OrderFiltersType;
    pagination: { current: number; total: number; perPage: number };
    drawerOpen: boolean;
    selectedOrder: OrderDetail | null;
    onFilterChange: (filters: Partial<OrderFiltersType>) => void;
    onResetFilters: () => void;
    onPageChange: (page: number) => void;
    onOpenDrawer: (id: string) => void;
    onCloseDrawer: () => void;
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const isToday = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    // "YYYY-MM-DD" se interpreta como UTC → corregimos con T00:00:00
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    return d.getTime() === TODAY.getTime();
};

const groupByDate = (orders: OrderListItem[]) => {
    const groups: Map<string, OrderListItem[]> = new Map();
    for (const order of orders) {
        const key = order.requested_delivery_date ?? 'Sin fecha';
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(order);
    }
    return groups;
};

const OrdersPageView: React.FC<OrdersPageViewProps> = ({
    orders,
    loading,
    loadingDetail,
    filters,
    pagination,
    drawerOpen,
    selectedOrder,
    onFilterChange,
    onResetFilters,
    onPageChange,
    onOpenDrawer,
    onCloseDrawer,
}) => {
    const todayCount = orders.filter((o) => isToday(o.requested_delivery_date)).length;
    const pendingCount = orders.filter((o) => o.pending_amount > 0).length;
    const totalPending = orders.reduce((sum, o) => sum + o.pending_amount, 0);

    const hasDateFilter = !!filters.date;
    const dateGroups = !hasDateFilter ? groupByDate(orders) : null;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold m-0">Pedidos</h1>
                <p className="text-gray-500 mt-1">Gestión de pedidos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <MetricCard
                    title="Para hoy"
                    value={loading ? 0 : todayCount}
                    icon={CalendarDays}
                    loading={loading}
                />
                <MetricCard
                    title="Pendientes de cobro"
                    value={loading ? 0 : pendingCount}
                    icon={AlertCircle}
                    loading={loading}
                />
                <MetricCard
                    title="Monto pendiente total"
                    value={loading ? formatCurrency(0) : formatCurrency(totalPending)}
                    icon={DollarSign}
                    loading={loading}
                />
            </div>

            <OrderFilters
                onFilterChange={onFilterChange}
                onReset={onResetFilters}
                loading={loading}
            />

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Empty description="No se encontraron pedidos" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                        <Button
                            variant="primary"
                            label="Limpiar filtros"
                            action={onResetFilters}
                        />
                    </Empty>
                </div>
            ) : dateGroups ? (
                <div className="space-y-6">
                    {Array.from(dateGroups.entries()).map(([date, dateOrders]) => (
                        <div key={date}>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                                {date === 'Sin fecha'
                                    ? 'Sin fecha'
                                    : formatDateLong(date)}
                            </h3>
                            <div className="space-y-2">
                                {dateOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onClick={() => onOpenDrawer(order.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onClick={() => onOpenDrawer(order.id)}
                        />
                    ))}
                </div>
            )}

            {pagination.total > 20 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        current={pagination.current}
                        total={pagination.total}
                        pageSize={pagination.perPage}
                        onChange={onPageChange}
                        showSizeChanger={false}
                    />
                </div>
            )}

            <OrderDrawer
                open={drawerOpen}
                order={selectedOrder}
                loading={loadingDetail}
                onClose={onCloseDrawer}
            />
        </div>
    );
};

export default OrdersPageView;
