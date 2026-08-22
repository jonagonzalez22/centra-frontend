import { useState, useMemo } from 'react';
import { Descriptions, Dropdown, Spin, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import Drawer from '@/components/Drawer/Drawer';
import Tabs from '@/components/Tabs/Tabs';
import { Button } from '@/components/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { OrderStatusBadge } from '../OrderStatusBadge';
import { RescheduleModal } from '../RescheduleModal';
import { OrderCancellationModal } from '../OrderCancellationModal';
import { useOrdersStore } from '../../stores/useOrdersStore';
import OrderDrawerItems from './OrderDrawerItems';
import OrderDrawerPayments from './OrderDrawerPayments';
import OrderDrawerHistory from './OrderDrawerHistory';
import type { OrderDetail } from '../../interfaces/order.interface';
import type { TabsItem } from '@/components/Tabs/Tabs';
import { formatCurrency, formatDate, formatDateShort, formatTimeSlot } from '@/utils/formatters';

interface OrderDrawerProps {
    open: boolean;
    order: OrderDetail | null;
    loading: boolean;
    onClose: () => void;
}

const TAB_CONTENT_MAX_HEIGHT = 'calc(100vh - 180px)';

const isReschedulable = (status: string): boolean =>
    status === 'open' || status === 'confirmed';

const isCancellable = (status: string): boolean => status === 'open';

const isAssignedToRoute = (routeIds?: string[]): boolean =>
    (routeIds?.length ?? 0) > 0;

const OrderDrawer: React.FC<OrderDrawerProps> = ({ open, order, loading, onClose }) => {
    const { can } = usePermissions();
    const canEdit = can('orders.edit');

    const rescheduleOrder = useOrdersStore((s) => s.rescheduleOrder);
    const cancelOrder = useOrdersStore((s) => s.cancelOrder);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const handleReschedule = async (values: {
        new_date: string;
        reason: string;
        observation?: string;
    }) => {
        if (!order) return;
        setRescheduling(true);
        try {
            await rescheduleOrder(order.id, values);
            setRescheduleOpen(false);
        } catch {
            // Error ya manejado en el store
        } finally {
            setRescheduling(false);
        }
    };

    const handleCancel = async (values: {
        reason_code: string;
        reason_note?: string;
    }) => {
        if (!order) return;
        setCancelling(true);
        try {
            await cancelOrder(order.id, values);
            setCancelOpen(false);
        } catch {
            // Error ya manejado en el store
        } finally {
            setCancelling(false);
        }
    };

    const canReschedule = order && isReschedulable(order.status) && !isAssignedToRoute(order.route_ids);
    const canCancel = order && isCancellable(order.status) && !isAssignedToRoute(order.route_ids);

    const actionMenuItems: MenuProps['items'] = useMemo(() => {
        const items: MenuProps['items'] = [];
        const assignedToRoute = order && isAssignedToRoute(order.route_ids);

        if (canEdit) {
            items.push({
                key: 'reschedule',
                label: assignedToRoute ? (
                    <Tooltip title="Pedido asignado a una ruta">
                        <span className="text-gray-400">Reprogramar fecha</span>
                    </Tooltip>
                ) : canReschedule ? (
                    <span>Reprogramar fecha</span>
                ) : (
                    <Tooltip title="Solo pedidos activos">
                        <span className="text-gray-400">Reprogramar fecha</span>
                    </Tooltip>
                ),
                disabled: !canReschedule,
                onClick: () => {
                    if (canReschedule) {
                        setRescheduleOpen(true);
                    }
                },
            });
        }

        if (canEdit) {
            items.push({
                key: 'cancel',
                label: assignedToRoute ? (
                    <Tooltip title="Pedido asignado a una ruta">
                        <span className="text-gray-400">Cancelar pedido</span>
                    </Tooltip>
                ) : canCancel ? (
                    <span className="text-red-600">Cancelar pedido</span>
                ) : (
                    <Tooltip title="Solo pedidos abiertos">
                        <span className="text-gray-400">Cancelar pedido</span>
                    </Tooltip>
                ),
                disabled: !canCancel,
                onClick: () => {
                    if (canCancel) {
                        setCancelOpen(true);
                    }
                },
            });
        }

        return items;
    }, [canEdit, canReschedule, canCancel, order]);

    const footer = (
        <div className="flex justify-between">
            <div>
                <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
                    <Button variant="default" label="Acciones" />
                </Dropdown>
            </div>
            <Button variant="default" label="Cerrar" action={onClose} />
        </div>
    );

    const buildTabItems = (order: OrderDetail): TabsItem[] => [
        {
            key: 'detail',
            label: 'Detalle',
            children: (
                <div
                    className="space-y-4 overflow-y-auto pr-1"
                    style={{ maxHeight: TAB_CONTENT_MAX_HEIGHT }}
                >
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Creado">
                            {formatDate(order.created_at)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Creado por">
                            {order.created_by.name}
                        </Descriptions.Item>
                        {order.branch_id && (
                            <Descriptions.Item label="Sucursal">
                                {order.branch_id}
                            </Descriptions.Item>
                        )}
                    </Descriptions>

                    <div>
                        <h4 className="font-semibold text-sm mb-2">Cliente y entrega</h4>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="Cliente">
                                {order.customer.name}
                            </Descriptions.Item>
                            {order.customer.phone && (
                                <Descriptions.Item label="Teléfono">
                                    {order.customer.phone}
                                </Descriptions.Item>
                            )}
                            {order.customer.email && (
                                <Descriptions.Item label="Email">
                                    {order.customer.email}
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Dirección de entrega">
                                {order.delivery_address?.full_address || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Fecha de entrega">
                                {order.requested_delivery_date
                                    ? formatDateShort(order.requested_delivery_date)
                                    : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Franja horaria">
                                {formatTimeSlot(
                                    order.delivery_time_from,
                                    order.delivery_time_to
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-2">Totales</h4>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="Subtotal">
                                {formatCurrency(order.subtotal)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Descuento">
                                {formatCurrency(order.discount)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Impuesto">
                                {formatCurrency(order.tax)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Total">
                                <span className="font-semibold">
                                    {formatCurrency(order.total)}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Pagado">
                                {formatCurrency(order.paid_amount)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Pendiente">
                                <span
                                    className={
                                        order.pending_amount > 0
                                            ? 'font-semibold text-amber-600'
                                            : ''
                                    }
                                >
                                    {formatCurrency(order.pending_amount)}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                </div>
            ),
        },
        {
            key: 'items',
            label: 'Ítems y pagos',
            children: (
                <div
                    className="space-y-4 overflow-y-auto pr-1"
                    style={{ maxHeight: TAB_CONTENT_MAX_HEIGHT }}
                >
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Ítems</h4>
                        <OrderDrawerItems items={order.items} loading={false} />
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-2">Pagos</h4>
                        <OrderDrawerPayments payments={order.payments} loading={false} />
                    </div>
                </div>
            ),
        },
        {
            key: 'history',
            label: 'Historial',
            children: (
                <div
                    className="overflow-y-auto pr-1"
                    style={{ maxHeight: TAB_CONTENT_MAX_HEIGHT }}
                >
                    <OrderDrawerHistory events={order.events} loading={false} />
                </div>
            ),
        },
    ];

    return (
        <>
            <Drawer
                open={open}
                onClose={onClose}
                title={order ? order.operation_number : 'Pedido'}
                width={520}
                loading={loading}
                footer={footer}
                extra={order ? <OrderStatusBadge status={order.status} /> : null}
            >
                {loading && !order ? (
                    <div className="flex justify-center py-16">
                        <Spin size="large" />
                    </div>
                ) : !order ? null : (
                    <Tabs items={buildTabItems(order)} defaultActiveKey="detail" />
                )}
            </Drawer>

            <RescheduleModal
                open={rescheduleOpen}
                currentDate={order?.requested_delivery_date ?? null}
                loading={rescheduling}
                onConfirm={handleReschedule}
                onClose={() => setRescheduleOpen(false)}
            />

            <OrderCancellationModal
                open={cancelOpen}
                order={order}
                loading={cancelling}
                onConfirm={handleCancel}
                onClose={() => setCancelOpen(false)}
            />
        </>
    );
};

export default OrderDrawer;
