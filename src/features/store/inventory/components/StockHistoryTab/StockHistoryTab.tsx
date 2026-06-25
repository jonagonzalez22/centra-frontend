import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spin, message } from 'antd';
import { ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import Table from '@/components/Table/Table';
import { InventoryMovementsService } from '../../services/inventoryMovements.service';
import { formatDate } from '@/utils/formatters';
import type { InventoryMovement, MovementType } from '../../interfaces/inventory-movement.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './StockHistoryTab.css';

interface StockHistoryTabProps {
    productId: string;
}

const getTypeConfig = (type: MovementType) => {
    switch (type) {
        case 'input':
            return { color: 'green', label: 'Entrada', Icon: ArrowUp };
        case 'output':
            return { color: 'red', label: 'Salida', Icon: ArrowDown };
        case 'adjustment':
            return { color: 'blue', label: 'Ajuste', Icon: ArrowLeftRight };
        default:
            return { color: 'default', label: type, Icon: ArrowLeftRight };
    }
};

export const StockHistoryTab = ({ productId }: StockHistoryTabProps) => {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovements = async () => {
            setLoading(true);
            try {
                const data = await InventoryMovementsService.getByProduct(productId, 10);
                setMovements(data);
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'No se pudo cargar el historial.');
            } finally {
                setLoading(false);
            }
        };

        fetchMovements();
    }, [productId]);

    const formatQuantity = (quantity: number, type: MovementType) => {
        if (type === 'adjustment') {
            return `${quantity >= 0 ? '+' : ''}${quantity}`;
        }
        const prefix = type === 'output' ? '-' : '+';
        return `${prefix}${Math.abs(quantity)}`;
    };

    const columns = [
        {
            title: 'Fecha',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value: string) => formatDate(value),
        },
        {
            title: 'Cantidad',
            key: 'quantity',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const movement = record as unknown as InventoryMovement;
                const isNegative = movement.type === 'output' || (movement.type === 'adjustment' && movement.quantity < 0);
                return (
                    <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
                        {formatQuantity(movement.quantity, movement.type)}
                    </span>
                );
            },
        },
        {
            title: 'Tipo',
            key: 'type',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const movement = record as unknown as InventoryMovement;
                const config = getTypeConfig(movement.type);
                const Icon = config.Icon;
                return (
                    <span className={`stockHistoryTabTag stockHistoryTabTag${config.color}`}>
                        <Icon size={12} />
                        {config.label}
                    </span>
                );
            },
        },
        {
            title: 'Concepto',
            dataIndex: 'concept',
            key: 'concept',
        },
        {
            title: 'Usuario',
            key: 'user',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const movement = record as unknown as InventoryMovement;
                return movement.user?.name ?? '—';
            },
        },
    ];

    if (loading) {
        return (
            <div className="stockHistoryTabLoading">
                <Spin size="small" />
            </div>
        );
    }

    return (
        <div className="stockHistoryTab">
            <div className="stockHistoryTabHeader">
                <span />
                <Link
                    to="/tienda/inventario/movimientos"
                    className="stockHistoryTabViewAll"
                >
                    Ver todos
                </Link>
            </div>

            {movements.length === 0 ? (
                <div className="stockHistoryTabEmpty">Sin movimientos de stock.</div>
            ) : (
                <Table
                    columns={columns as unknown as Parameters<typeof Table>[0]['columns']}
                    dataSource={movements as unknown as Record<string, unknown>[]}
                    scroll={{ x: 'max-content' }}
                    size="small"
                />
            )}
        </div>
    );
};
