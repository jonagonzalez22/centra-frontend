import { Collapse, Descriptions, Empty, Spin, Timeline } from 'antd';
import Table from '@/components/Table/Table';
import Tag from '@/components/Tag/Tag';
import { formatDate, formatDateShort } from '@/utils/formatters';
import type {
    OrderHistoryDetails,
    OrderHistoryDiscrepancy,
    OrderHistoryEntry,
    OrderHistoryItem,
} from '../../interfaces/order.interface';

interface OrderDrawerHistoryProps {
    history: OrderHistoryEntry[];
    loading: boolean;
}

const RESOLUTION_LABELS: Record<string, string> = {
    returned: 'Devuelto a depósito',
    rejected_by_customer: 'Rechazado por cliente',
    missing: 'Faltante / extraviado',
    damaged: 'Dañado / merma',
    pending_redelivery: 'Pendiente de reentrega',
    extra_sale: 'Venta extra',
    other: 'Otro',
};

const REASON_LABELS: Record<string, string> = {
    customer_requested_reschedule: 'Solicitud del cliente',
    customer_absent: 'Cliente ausente',
    address_closed: 'Domicilio cerrado',
    weather_conditions: 'Condiciones climáticas',
    operational_issue: 'Problema operativo',
    customer_cancelled: 'Cancelado por cliente',
    payment_failed: 'Pago fallido',
    out_of_stock: 'Sin stock',
    pricing_error: 'Error de precio',
    duplicate_order: 'Pedido duplicado',
    other: 'Otro',
};

const discrepancySummary = (discrepancy: OrderHistoryDiscrepancy): string => {
    const resolution = discrepancy.resolution_type
        ? (RESOLUTION_LABELS[discrepancy.resolution_type] ?? discrepancy.resolution_type)
        : 'Sin resolver';

    return `${discrepancy.quantity} — ${resolution}`;
};

const DeliveryDetails = ({ details }: { details: OrderHistoryDetails }) => {
    const items = details.items ?? [];
    const columns = [
        {
            title: 'Producto',
            key: 'product_name',
            render: (_: unknown, record?: Record<string, unknown>) =>
                (record as unknown as OrderHistoryItem).product_name || 'Producto',
        },
        { title: 'Plan.', dataIndex: 'quantity_planned', key: 'quantity_planned', width: 70 },
        { title: 'Carg.', dataIndex: 'quantity_loaded', key: 'quantity_loaded', width: 70 },
        { title: 'Entreg.', dataIndex: 'quantity_delivered', key: 'quantity_delivered', width: 80 },
    ];

    return (
        <div className="space-y-3">
            {(details.driver || details.reconciled_by) && (
                <Descriptions column={1} size="small">
                    {details.driver && (
                        <Descriptions.Item label="Conductor">
                            {details.driver.name}
                        </Descriptions.Item>
                    )}
                    {details.reconciled_by && (
                        <Descriptions.Item label="Conciliado por">
                            {details.reconciled_by.name}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            )}

            <Table
                columns={columns}
                dataSource={items as unknown as Record<string, unknown>[]}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
            />

            {items.some((item) => item.discrepancies.length > 0) && (
                <div>
                    <div className="font-medium text-xs mb-2">Discrepancias</div>
                    <div className="space-y-2">
                        {items.flatMap((item) =>
                            item.discrepancies.map((discrepancy) => (
                                <div
                                    key={discrepancy.id}
                                    className="rounded border border-gray-200 px-3 py-2 text-xs"
                                >
                                    <div className="font-medium">
                                        {item.product_name || 'Producto'}
                                    </div>
                                    <div className="text-gray-600">
                                        {discrepancySummary(discrepancy)}
                                    </div>
                                    {discrepancy.notes && (
                                        <div className="text-gray-500">{discrepancy.notes}</div>
                                    )}
                                    {discrepancy.resolved_by && (
                                        <div className="text-gray-400 mt-1">
                                            {discrepancy.resolved_by.name}
                                            {discrepancy.resolved_at &&
                                                ` — ${formatDate(discrepancy.resolved_at)}`}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const CommercialDetails = ({ details }: { details: OrderHistoryDetails }) => (
    <Descriptions column={1} size="small">
        {details.previous_date && details.new_date && (
            <Descriptions.Item label="Fecha de entrega">
                {formatDateShort(details.previous_date)} → {formatDateShort(details.new_date)}
            </Descriptions.Item>
        )}
        {details.reason_code && (
            <Descriptions.Item label="Motivo">
                {REASON_LABELS[details.reason_code] ?? details.reason_code}
            </Descriptions.Item>
        )}
        {details.reason_note && (
            <Descriptions.Item label="Detalle">{details.reason_note}</Descriptions.Item>
        )}
    </Descriptions>
);

const EventDetails = ({ event }: { event: OrderHistoryEntry }) => {
    if (!event.details) return null;

    const isDelivery = (event.details.items?.length ?? 0) > 0;

    return (
        <Collapse
            ghost
            size="small"
            className="mt-1"
            items={[
                {
                    key: 'details',
                    label: 'Ver detalle',
                    children: isDelivery ? (
                        <DeliveryDetails details={event.details} />
                    ) : (
                        <CommercialDetails details={event.details} />
                    ),
                },
            ]}
        />
    );
};

const OrderDrawerHistory: React.FC<OrderDrawerHistoryProps> = ({ history, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spin />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <Empty description="Sin historial registrado" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        );
    }

    return (
        <Timeline
            items={history.map((event) => ({
                color: event.status === 'provisional' ? 'orange' : 'blue',
                children: (
                    <div className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{event.title}</span>
                            {event.status === 'provisional' && (
                                <Tag color="orange">Provisional</Tag>
                            )}
                        </div>

                        {event.description && (
                            <div className="text-gray-600">{event.description}</div>
                        )}

                        {event.route && (
                            <div className="text-gray-500 text-xs mt-1">
                                Ruta {event.route.label}
                            </div>
                        )}

                        <div className="text-gray-400 text-xs mt-1">
                            {event.user && `${event.user.name} — `}
                            {formatDate(event.occurred_at)}
                        </div>

                        <EventDetails event={event} />
                    </div>
                ),
            }))}
        />
    );
};

export default OrderDrawerHistory;
