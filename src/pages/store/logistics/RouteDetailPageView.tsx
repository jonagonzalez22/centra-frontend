import { useState } from 'react';
import {
    Alert,
    Spin,
    Tag,
    Descriptions,
    Popconfirm,
    Button as AntButton,
    TimePicker,
    Tooltip,
    Modal as AntModal,
} from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { TableRowSelection } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import Table from '@/components/Table/Table';
import Tabs from '@/components/Tabs/Tabs';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { ExceptionalAssignModal } from './components/ExceptionalAssignModal';
import { RouteMapModal } from './RouteMapModal';
import type {
    DeliveryRoute,
    EligibleOrder,
    RouteStop,
} from '@/features/store/logistics/interfaces/route.interface';
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
    onUpdateDepartureTime: (departureTime: string) => Promise<void>;
    onPlanRoute: () => Promise<void>;
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
    onUpdateDepartureTime,
    onPlanRoute,
}: RouteDetailPageViewProps) => {
    const [selectedDailyIds, setSelectedDailyIds] = useState<string[]>([]);
    const [addingDaily, setAddingDaily] = useState(false);
    const [removingStopId, setRemovingStopId] = useState<string | null>(null);
    const [exceptionalModalOpen, setExceptionalModalOpen] = useState(false);
    const [selectedExceptionalOrder, setSelectedExceptionalOrder] = useState<EligibleOrder | null>(
        null
    );
    const [exceptionalAdding, setExceptionalAdding] = useState(false);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [planning, setPlanning] = useState(false);

    if (loading) return <Spin size="large" />;
    if (error) return <Alert type="error" message={error} showIcon />;
    if (!route) return <Alert type="warning" message="Ruta no encontrada." showIcon />;

    const isDraft = route.status === 'draft';
    const isPlanned = route.status !== 'draft';
    const routeNum = `#${route.id.substring(0, 8).toUpperCase()}`;
    const activeStops = (route.stops ?? []).filter((s) => s.status !== 'cancelled');
    const hasActiveStops = activeStops.length > 0;
    const hasDepartureTime = !!route.departure_time;
    const canPlan = isDraft && hasActiveStops && hasDepartureTime;
    const hasPolyline = !!route.encoded_polyline;

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
            responsive: ['md'] as 'md'[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                const customer = stop.order?.customer as { name: string } | null | undefined;
                return customer?.name || '—';
            },
        },
        {
            title: 'Dirección',
            key: 'address',
            responsive: ['lg'] as 'lg'[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                const addr = stop.order?.address;
                if (!addr) return '—';
                return `${addr.street} ${addr.number}${addr.locality ? `, ${addr.locality}` : ''}`;
            },
        },
        ...(isPlanned
            ? [
                  {
                      title: 'Llegada est.',
                      key: 'eta',
                      width: 100,
                      render: (_: unknown, record?: Record<string, unknown>) => {
                          const stop = record as unknown as RouteStop;
                          if (!stop.estimated_arrival_at) return '--:--';
                          return dayjs(stop.estimated_arrival_at).format('HH:mm');
                      },
                  },
                  {
                      title: 'Tramo',
                      key: 'duration',
                      width: 80,
                      render: (_: unknown, record?: Record<string, unknown>) => {
                          const stop = record as unknown as RouteStop;
                          if (!stop.travel_duration_seconds) return '--';
                          const mins = Math.round(stop.travel_duration_seconds / 60);
                          return `${mins} min`;
                      },
                  },
              ]
            : []),
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
        ...(isDraft
            ? [
                  {
                      title: 'Acciones',
                      key: 'actions',
                      width: 80,
                      render: (_: unknown, record?: Record<string, unknown>) => {
                          const stop = record as unknown as RouteStop;
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
              ]
            : []),
    ];

    const dailyColumns = [
        { title: 'Pedido', dataIndex: 'operation_number', key: 'operation_number' },
        {
            title: 'Cliente',
            key: 'customer',
            responsive: ['md'] as 'md'[],
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
            responsive: ['md'] as 'md'[],
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
                    <Descriptions.Item label="Hora de salida">
                        {isDraft ? (
                            <TimePicker
                                format="HH:mm"
                                value={
                                    route.departure_time
                                        ? dayjs(route.departure_time, 'HH:mm')
                                        : null
                                }
                                onChange={async (time) => {
                                    await onUpdateDepartureTime(time ? time.format('HH:mm') : '');
                                }}
                                placeholder="Seleccionar hora"
                                style={{ width: 140 }}
                                minuteStep={5}
                                allowClear
                                needConfirm={false}
                                showNow={false}
                            />
                        ) : (
                            route.departure_time || '—'
                        )}
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
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {isPlanned && hasPolyline && (
                        <Button
                            variant="default"
                            label="Ver recorrido"
                            icon={<EnvironmentOutlined />}
                            action={() => setMapModalOpen(true)}
                        />
                    )}
                </div>
            </div>

            {isDraft && (
                <div style={{ marginBottom: 16 }}>
                    {canPlan ? (
                        <Button
                            variant="primary"
                            label="Planificar Ruta"
                            loading={planning}
                            action={() => {
                                AntModal.confirm({
                                    title: 'Planificar Ruta',
                                    icon: <ExclamationCircleOutlined />,
                                    content: (
                                        <div>
                                            <p>
                                                Se calculará el orden óptimo de entregas, los
                                                tiempos estimados de llegada y el recorrido.
                                            </p>
                                            <p>
                                                Una vez planificada, no podrá agregar ni quitar
                                                pedidos.
                                            </p>
                                            {route.departure_time && (
                                                <p>
                                                    <strong>
                                                        Hora de salida: {route.departure_time}
                                                    </strong>
                                                </p>
                                            )}
                                        </div>
                                    ),
                                    okText: 'Planificar',
                                    cancelText: 'Cancelar',
                                    onOk: async () => {
                                        setPlanning(true);
                                        try {
                                            await onPlanRoute();
                                        } catch {
                                            // Error ya mostrado por el hook, 
                                            // re-throw para que AntModal mantenga el modal abierto
                                            setPlanning(false);
                                            throw new Error();
                                        }
                                        setPlanning(false);
                                    },
                                });
                            }}
                        />
                    ) : (
                        <Tooltip
                            title={
                                !hasDepartureTime
                                    ? 'Defina la hora de salida para planificar la ruta'
                                    : ''
                            }
                        >
                            <span>
                                <Button variant="primary" label="Planificar Ruta" disabled />
                            </span>
                        </Tooltip>
                    )}
                </div>
            )}

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
                                            dataSource={
                                                dailyOrders as unknown as Record<string, unknown>[]
                                            }
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
                                            dataSource={
                                                exceptionalOrders as unknown as Record<
                                                    string,
                                                    unknown
                                                >[]
                                            }
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

            <RouteMapModal
                open={mapModalOpen}
                route={route}
                onClose={() => setMapModalOpen(false)}
            />
        </div>
    );
};
