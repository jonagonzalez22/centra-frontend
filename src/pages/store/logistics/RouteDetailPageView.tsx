import { useState } from 'react';
import { Alert, Spin, Tag, Descriptions, Popconfirm, Button as AntButton } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableRowSelection } from 'antd/es/table/interface';
import Table from '@/components/Table/Table';
import Tabs from '@/components/Tabs/Tabs';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { ExceptionalAssignModal } from './components/ExceptionalAssignModal';
import type { DeliveryRoute, EligibleOrder, RouteStop } from '@/features/store/logistics/interfaces/route.interface';
import { formatDateShort } from '@/utils/formatters';
import './RouteDetailPage.css';

const statusColors: Record<string, string> = {
    draft: 'default',
    planned: 'blue',
    loaded: 'cyan',
    dispatched: 'orange',
    awaiting_reconciliation: 'purple',
    completed: 'green',
    cancelled: 'red',
};

const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    planned: 'Planificada',
    loaded: 'Cargada',
    dispatched: 'Despachada',
    awaiting_reconciliation: 'Pend. Conciliación',
    completed: 'Completada',
    cancelled: 'Cancelada',
};

interface RouteDetailPageViewProps {
    route: DeliveryRoute | null;
    dailyOrders: EligibleOrder[];
    exceptionalOrders: EligibleOrder[];
    loading: boolean;
    dailyOrdersLoading: boolean;
    exceptionalOrdersLoading: boolean;
    error: string | null;
    onAddStop: (orderId: string) => Promise<void>;
    onAddExceptionalStop: (orderId: string, reason: string) => Promise<void>;
    onRemoveStop: (stopId: string) => Promise<void>;
}

export const RouteDetailPageView = ({
    route,
    dailyOrders,
    exceptionalOrders,
    loading,
    dailyOrdersLoading,
    exceptionalOrdersLoading,
    error,
    onAddStop,
    onAddExceptionalStop,
    onRemoveStop,
}: RouteDetailPageViewProps) => {
    const [selectedDailyIds, setSelectedDailyIds] = useState<string[]>([]);
    const [addingDaily, setAddingDaily] = useState(false);
    const [removingStopId, setRemovingStopId] = useState<string | null>(null);
    const [exceptionalModalOpen, setExceptionalModalOpen] = useState(false);
    const [selectedExceptionalOrder, setSelectedExceptionalOrder] = useState<EligibleOrder | null>(null);
    const [exceptionalAdding, setExceptionalAdding] = useState(false);

    if (loading) return <Spin size="large" />;
    if (error) return <Alert type="error" message={error} showIcon />;
    if (!route) return <Alert type="warning" message="Ruta no encontrada." showIcon />;

    const isDraft = route.status === 'draft';
    const routeNum = `#${route.id.substring(0, 8).toUpperCase()}`;
    const activeStops = route.stops.filter((s) => s.status !== 'cancelled');

    const stopsColumns = [
        { title: 'Sec.', dataIndex: 'sequence', key: 'sequence', width: 60 },
        {
            title: 'Pedido',
            key: 'order',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                return stop.order?.operation_number || '—';
            },
        },
        {
            title: 'Cliente',
            key: 'customer',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                const customer = stop.order?.customer as { name: string } | null | undefined;
                return customer?.name || '—';
            },
        },
        {
            title: 'Dirección',
            key: 'address',
            responsive: ['lg'] as ('lg')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                const customer = stop.order?.customer as { address: string | null } | null | undefined;
                return customer?.address || '—';
            },
        },
        {
            title: 'Estado',
            key: 'status',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                const label = statusLabels[stop.status] || stop.status;
                const color = statusColors[stop.status] || 'default';
                return <Tag color={color}>{label}</Tag>;
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 80,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                if (!isDraft) return null;
                return (
                    <CanDo permission="logistics.routes.manage">
                        <Popconfirm
                            title="¿Quitar parada?"
                            description="El pedido volverá a estar disponible."
                            onConfirm={() => handleRemoveStop(stop.id)}
                            okText="Quitar"
                            cancelText="Cancelar"
                            okButtonProps={{ danger: true }}
                        >
                            <AntButton
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                loading={removingStopId === stop.id}
                                aria-label="Quitar parada"
                            />
                        </Popconfirm>
                    </CanDo>
                );
            },
        },
    ];

    const dailyColumns = [
        { title: 'Pedido', dataIndex: 'operation_number', key: 'operation_number' },
        {
            title: 'Cliente',
            key: 'customer',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const order = record as unknown as EligibleOrder;
                return order.customer?.name || '—';
            },
        },
        {
            title: 'Fecha Entrega',
            key: 'delivery_date',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const order = record as unknown as EligibleOrder;
                return formatDateShort(order.requested_delivery_date);
            },
        },
    ];

    const exceptionalColumns = [
        { title: 'Pedido', dataIndex: 'operation_number', key: 'operation_number' },
        {
            title: 'Cliente',
            key: 'customer',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const order = record as unknown as EligibleOrder;
                return order.customer?.name || '—';
            },
        },
        {
            title: 'Fecha Pactada',
            key: 'delivery_date',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const order = record as unknown as EligibleOrder;
                if (!order.requested_delivery_date) return 'Sin fecha pactada';
                return formatDateShort(order.requested_delivery_date);
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 160,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const order = record as unknown as EligibleOrder;
                return (
                    <Button
                        variant="default"
                        label="Asignar excepcional"
                        action={() => {
                            setSelectedExceptionalOrder(order);
                            setExceptionalModalOpen(true);
                        }}
                    />
                );
            },
        },
    ];

    const dailyRowSelection: TableRowSelection<Record<string, unknown>> = {
        selectedRowKeys: selectedDailyIds,
        onChange: (keys) => setSelectedDailyIds(keys as string[]),
    };

    const handleAddDailyStops = async () => {
        if (selectedDailyIds.length === 0) return;
        setAddingDaily(true);
        try {
            for (const orderId of selectedDailyIds) {
                await onAddStop(orderId);
            }
            setSelectedDailyIds([]);
        } finally {
            setAddingDaily(false);
        }
    };

    const handleRemoveStop = async (stopId: string) => {
        setRemovingStopId(stopId);
        try {
            await onRemoveStop(stopId);
        } finally {
            setRemovingStopId(null);
        }
    };

    return (
        <div className="routeDetailPage">
            <div className="routeDetailHeader">
                <h1 className="routeDetailTitle">{routeNum}</h1>
                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="Fecha">
                        {formatDateShort(route.operational_date)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Conductor">
                        {route.driver?.name || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vehículo">
                        {route.vehicle?.name || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Estado">
                        <Tag color={statusColors[route.status] || 'default'}>
                            {statusLabels[route.status] || route.status}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Paradas">{activeStops.length}</Descriptions.Item>
                </Descriptions>
            </div>

            <div className="routeDetailSection">
                <h2 className="routeDetailSectionTitle">Paradas de la Ruta</h2>
                <Table
                    columns={stopsColumns}
                    dataSource={activeStops as unknown as Record<string, unknown>[]}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    size="small"
                />
            </div>

            {isDraft && (
                <div className="routeDetailSection">
                    <Tabs
                        defaultActiveKey="daily"
                        items={[
                            {
                                key: 'daily',
                                label: 'Pedidos del día',
                                children: (
                                    <div>
                                        <p className="routeDetailTabDescription">
                                            Pedidos con entrega pactada para el{' '}
                                            {route.operational_date
                                                ? formatDateShort(route.operational_date)
                                                : '—'}
                                        </p>
                                        <div className="routeDetailSectionHeader">
                                            <div />
                                            <Button
                                                variant="primary"
                                                label="Asignar a Ruta"
                                                loading={addingDaily}
                                                disabled={selectedDailyIds.length === 0}
                                                action={handleAddDailyStops}
                                            />
                                        </div>
                                        <Table
                                            columns={dailyColumns}
                                            dataSource={dailyOrders as unknown as Record<string, unknown>[]}
                                            rowSelection={dailyRowSelection}
                                            loading={dailyOrdersLoading}
                                            pagination={false}
                                            scroll={{ x: 'max-content' }}
                                            size="small"
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: 'exceptional',
                                label: 'Pedidos excepcionales',
                                children: (
                                    <div>
                                        <p className="routeDetailTabDescription">
                                            Pedidos con una fecha de entrega diferente a la fecha
                                            operativa de esta ruta.
                                        </p>
                                        <Table
                                            columns={exceptionalColumns}
                                            dataSource={exceptionalOrders as unknown as Record<string, unknown>[]}
                                            loading={exceptionalOrdersLoading}
                                            pagination={false}
                                            scroll={{ x: 'max-content' }}
                                            size="small"
                                        />
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            )}

            <ExceptionalAssignModal
                open={exceptionalModalOpen}
                order={selectedExceptionalOrder}
                routeOperationalDate={route.operational_date}
                loading={exceptionalAdding}
                onClose={() => {
                    setExceptionalModalOpen(false);
                    setSelectedExceptionalOrder(null);
                }}
                onConfirm={async (reason) => {
                    if (!selectedExceptionalOrder) return;
                    setExceptionalAdding(true);
                    try {
                        await onAddExceptionalStop(selectedExceptionalOrder.id, reason);
                        setExceptionalModalOpen(false);
                        setSelectedExceptionalOrder(null);
                    } finally {
                        setExceptionalAdding(false);
                    }
                }}
            />
        </div>
    );
};
