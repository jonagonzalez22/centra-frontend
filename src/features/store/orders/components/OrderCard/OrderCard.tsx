import { useState } from 'react';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { OrderStatusBadge } from '../OrderStatusBadge';
import { RescheduleModal } from '../RescheduleModal';
import { useOrdersStore } from '../../stores/useOrdersStore';
import type { OrderListItem } from '../../interfaces/order.interface';
import { formatCurrency, formatDateShort, formatTimeSlot } from '@/utils/formatters';

interface OrderCardProps {
    order: OrderListItem;
    onClick: () => void;
}

const isReschedulable = (status: string): boolean =>
    status === 'open' || status === 'confirmed';

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
    const rescheduleOrder = useOrdersStore((s) => s.rescheduleOrder);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);

    const handleReschedule = async (values: {
        new_date: string;
        reason: string;
        observation?: string;
    }) => {
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

    const actionMenuItems: MenuProps['items'] = [
        {
            key: 'detail',
            label: 'Ver detalle',
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onClick();
            },
        },
        {
            key: 'reschedule',
            label: isReschedulable(order.status) ? (
                <CanDo permission="orders.edit" fallback={
                    <Tooltip title="No tenés permisos para reprogramar">
                        <span className="text-gray-400">Reprogramar fecha</span>
                    </Tooltip>
                }>
                    <span>Reprogramar fecha</span>
                </CanDo>
            ) : (
                <Tooltip title="Solo pedidos activos">
                    <span className="text-gray-400">Reprogramar fecha</span>
                </Tooltip>
            ),
            disabled: !isReschedulable(order.status),
            onClick: (e) => {
                e.domEvent.stopPropagation();
                if (isReschedulable(order.status)) {
                    setRescheduleOpen(true);
                }
            },
        },
        {
            key: 'cancel',
            label: (
                <Tooltip title="Próximamente">
                    <span className="text-gray-400">Cancelar pedido</span>
                </Tooltip>
            ),
            disabled: true,
            onClick: (e) => e.domEvent.stopPropagation(),
        },
    ];

    return (
        <>
            <div
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors"
                onClick={onClick}
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">{order.operation_number}</span>
                        <OrderStatusBadge status={order.status} />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
                            <Button variant="default" label="Acciones ▾" />
                        </Dropdown>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 text-sm text-gray-600">
                    <span>{order.customer.name}</span>
                    <span>
                        {order.delivery_address?.locality || (
                            <span className="text-gray-400">Sin localidad</span>
                        )}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 text-sm text-gray-600 mt-1">
                    <span>
                        {order.requested_delivery_date
                            ? formatDateShort(order.requested_delivery_date)
                            : 'Sin fecha'}
                    </span>
                    <span>
                        {formatTimeSlot(order.delivery_time_from, order.delivery_time_to)}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-6 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                        {order.items_count} {order.items_count === 1 ? 'ítem' : 'ítems'}
                    </span>
                    <span className="text-sm font-semibold">
                        Total: {formatCurrency(order.total)}
                    </span>
                    <span
                        className={`text-sm font-semibold ${
                            order.pending_amount > 0 ? 'text-amber-600' : ''
                        }`}
                    >
                        Pendiente: {formatCurrency(order.pending_amount)}
                    </span>
                </div>
            </div>

            <RescheduleModal
                open={rescheduleOpen}
                currentDate={order.requested_delivery_date}
                loading={rescheduling}
                onConfirm={handleReschedule}
                onClose={() => setRescheduleOpen(false)}
            />
        </>
    );
};

export default OrderCard;
