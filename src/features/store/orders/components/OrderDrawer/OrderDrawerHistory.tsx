import { Empty, Spin, Timeline } from 'antd';
import { formatDate, formatDateShort } from '@/utils/formatters';
import type { OrderEvent } from '../../interfaces/order.interface';

interface OrderDrawerHistoryProps {
    events: OrderEvent[];
    loading: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    delivery_date_changed: 'Fecha reprogramada',
    order_cancelled: 'Pedido cancelado',
    created: 'Pedido creado',
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

const getEventTypeLabel = (eventType: string): string => {
    return EVENT_TYPE_LABELS[eventType] ?? eventType;
};

const getReasonLabel = (reasonCode: string | null): string => {
    return reasonCode ? (REASON_LABELS[reasonCode] ?? reasonCode) : '';
};

const OrderDrawerHistory: React.FC<OrderDrawerHistoryProps> = ({ events, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spin />
            </div>
        );
    }

    if (events.length === 0) {
        return <Empty description="Sin historial registrado" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    const sortedEvents = [...events].reverse();

    return (
        <Timeline
            items={sortedEvents.map((event) => ({
                color: 'blue',
                children: (
                    <div className="text-sm">
                        <div className="font-medium">{getEventTypeLabel(event.event_type)}</div>

                        {event.reason_code && (
                            <div className="text-gray-600">
                                {getReasonLabel(event.reason_code)}
                                {event.reason_note && ` — ${event.reason_note}`}
                            </div>
                        )}

                        {event.previous_date && event.new_date && (
                            <div className="text-gray-500 text-xs mt-1">
                                Fecha: {formatDateShort(event.previous_date)} →{' '}
                                {formatDateShort(event.new_date)}
                            </div>
                        )}

                        {event.observation && (
                            <div className="text-gray-500 text-xs mt-1">{event.observation}</div>
                        )}

                        <div className="text-gray-400 text-xs mt-1">
                            {event.user.name} — {formatDate(event.created_at)}
                        </div>
                    </div>
                ),
            }))}
        />
    );
};

export default OrderDrawerHistory;
