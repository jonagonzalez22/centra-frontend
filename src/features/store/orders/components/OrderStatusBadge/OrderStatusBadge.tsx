import { Tag } from '@/components/Tag';

interface OrderStatusBadgeProps {
    status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    open: { label: 'Abierto', color: '#1677ff' },
    confirmed: { label: 'Abierto', color: '#1677ff' },
    cancelled: { label: 'Cancelado', color: '#ff4d4f' },
    closed: { label: 'Entregado', color: '#52c41a' },
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
    const config = STATUS_CONFIG[status] ?? { label: 'Desconocido', color: '#8c8c8c' };

    return <Tag color={config.color}>{config.label}</Tag>;
};

export default OrderStatusBadge;
