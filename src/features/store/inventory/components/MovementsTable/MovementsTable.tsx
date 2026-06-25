import { useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { useInventoryMovementsContext } from '../../context/InventoryMovementsContext';
import { formatDate } from '@/utils/formatters';
import type {
    InventoryMovement,
    MovementType,
} from '../../interfaces/inventory-movement.interface';
import './MovementsTable.css';

type ResponsiveList = ('md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'sm' | 'xs')[];

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

export const MovementsTable = () => {
    const { items, loading, pagination, setPage, setPerPage } = useInventoryMovementsContext();

    const handlePageChange = useCallback(
        (page: number, pageSize: number) => {
            if (pageSize !== pagination.pageSize) {
                setPerPage(pageSize);
            } else {
                setPage(page);
            }
        },
        [pagination.pageSize, setPage, setPerPage]
    );

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
            responsive: ['md'] as ResponsiveList,
            render: (value: string) => formatDate(value),
        },
        {
            title: 'Producto',
            key: 'product',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const movement = record as unknown as InventoryMovement;
                return movement.product?.name;
            },
        },
        {
            title: 'SKU',
            key: 'product_sku',
            responsive: ['md'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const movement = record as unknown as InventoryMovement;
                return movement.product?.sku ?? '—';
            },
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
                    <div className="movementsTableTypeCell">
                        <span className={`movementsTableTag movementsTableTag${config.color}`}>
                            <Icon size={12} />
                            {config.label}
                        </span>
                    </div>
                );
            },
        },
        {
            title: 'Concepto',
            dataIndex: 'concept',
            key: 'concept',
            responsive: ['lg'] as ResponsiveList,
        },
        {
            title: 'Usuario',
            key: 'user',
            responsive: ['md'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const movement = record as unknown as InventoryMovement;
                return movement.user?.name ?? '—';
            },
        },
    ];

    return (
        <CanDo permission="inventory.view">
            <Table
                columns={columns as unknown as Parameters<typeof Table>[0]['columns']}
                dataSource={items as unknown as Record<string, unknown>[]}
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '15', '25', '50'],
                    showTotal: (total, range) => `${range[0]} - ${range[1]} de ${total}`,
                }}
                onChange={(paginationConfig) => {
                    handlePageChange(
                        paginationConfig.current ?? 1,
                        paginationConfig.pageSize ?? 15
                    );
                }}
                scroll={{ x: 'max-content' }}
                size="small"
            />
        </CanDo>
    );
};
