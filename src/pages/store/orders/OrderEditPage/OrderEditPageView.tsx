import { LockOutlined } from '@ant-design/icons';
import { Alert, Descriptions, Tag, Tooltip } from 'antd';
import Card from '@/components/Card/Card';
import { OrderStatusBadge } from '@/features/store/orders/components/OrderStatusBadge';
import type {
    OrderDetail,
    OrderEditability,
    OrderEditabilityItem,
} from '@/features/store/orders/interfaces/order.interface';
import { formatCurrency, formatDate, formatDateShort } from '@/utils/formatters';

interface Props {
    order: OrderDetail;
    editability: OrderEditability;
}

const editabilityFor = (
    editability: OrderEditability,
    productId: string
): OrderEditabilityItem | undefined =>
    editability.items.find((item) => item.product_id === productId);

export const OrderEditPageView = ({ order, editability }: Props) => {
    const pendingAmount = order.pending_amount ?? Math.max(0, order.total - order.paid_amount);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold m-0">Editar pedido {order.operation_number}</h1>
                <p className="text-gray-500 mt-1">
                    Gestión del pedido. Los controles de edición estarán disponibles próximamente.
                </p>
            </div>

            {!editability.editable && (
                <Alert
                    type="warning"
                    showIcon
                    message="Este pedido no puede editarse."
                    description={editability.block_message || 'El pedido no está disponible para edición.'}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card title="Productos del pedido">
                        <div className="space-y-3">
                            {order.items.map((item) => {
                                const restrictions = editabilityFor(editability, item.product_id);

                                return (
                                    <div
                                        key={item.id}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                            <div>
                                                <p className="font-semibold mb-1">{item.product_name}</p>
                                                <p className="text-sm text-gray-600 m-0">
                                                    Cantidad actual: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-sm sm:text-right">
                                                <p className="m-0">{formatCurrency(item.price)} c/u</p>
                                                <p className="font-semibold m-0">
                                                    {formatCurrency(item.subtotal)}
                                                </p>
                                            </div>
                                        </div>

                                        {restrictions &&
                                            (restrictions.delivered_quantity > 0 ||
                                                restrictions.active_committed_quantity > 0) && (
                                                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                                    {restrictions.delivered_quantity > 0 && (
                                                        <Tag>Entregadas: {restrictions.delivered_quantity}</Tag>
                                                    )}
                                                    {restrictions.active_committed_quantity > 0 && (
                                                        <Tag color="blue">
                                                            Comprometidas: {restrictions.active_committed_quantity}
                                                        </Tag>
                                                    )}
                                                    <Tag color="gold">
                                                        Cantidad mínima: {restrictions.minimum_quantity}
                                                    </Tag>
                                                </div>
                                            )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card title="Información del pedido">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Cliente">{order.customer.name}</Descriptions.Item>
                            <Descriptions.Item label="Pedido">{order.operation_number}</Descriptions.Item>
                            <Descriptions.Item label="Estado">
                                <OrderStatusBadge status={order.status} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Creado">
                                {formatDate(order.created_at)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Fecha de entrega">
                                <span className="inline-flex items-center gap-1">
                                    {formatDateShort(order.requested_delivery_date)}
                                    {!editability.delivery_date_editable && (
                                        <Tooltip title={editability.delivery_date_block_message || undefined}>
                                            <LockOutlined className="text-amber-600" />
                                        </Tooltip>
                                    )}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                        {!editability.delivery_date_editable &&
                            editability.delivery_date_block_message && (
                                <p className="text-xs text-amber-700 mt-3 mb-0">
                                    {editability.delivery_date_block_message}
                                </p>
                            )}
                    </Card>

                    <Card title="Resumen económico">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-semibold">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pagado</span>
                                <span>{formatCurrency(order.paid_amount)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                                <span>Saldo pendiente</span>
                                <span className={pendingAmount > 0 ? 'text-amber-600' : ''}>
                                    {formatCurrency(pendingAmount)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
