import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
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
    Table as AntTable,
    Typography,
    Dropdown,
    Row,
    Col,
    message,
} from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, EnvironmentOutlined, EyeOutlined, HolderOutlined, ReloadOutlined, EllipsisOutlined, UndoOutlined, CheckCircleOutlined, FileTextOutlined, TruckOutlined, WhatsAppOutlined } from '@ant-design/icons';

const { Text } = Typography;
import type { TableRowSelection } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Table from '@/components/Table/Table';
import Tabs from '@/components/Tabs/Tabs';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { ExceptionalAssignModal } from './components/ExceptionalAssignModal';
import { RouteMapModal } from './RouteMapModal';
import { RouteLoadDrawer } from '@/features/store/logistics/components/RouteLoadDrawer';
import { RouteAdjustmentDrawer } from '@/features/store/logistics/components/RouteAdjustmentDrawer';
import type {
    DeliveryRoute,
    EligibleOrder,
    RouteStop,
} from '@/features/store/logistics/interfaces/route.interface';
import { formatDateShort } from '@/utils/formatters';
import { RoutesService } from '@/features/store/logistics/services/routes.service';
import { buildWhatsAppMessage } from '@/features/store/logistics/utils/whatsappMessage';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
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
    onReorderStops: (stopIds: string[]) => Promise<void>;
    onRecalculate: () => Promise<void>;
    onOptimizeRoute: () => Promise<void>;
    onRevertRoute: (reason: string) => Promise<void>;
    onDispatchRoute: () => Promise<void>;
    onLoadSuccess: () => void;
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
    onReorderStops,
    onRecalculate,
    onOptimizeRoute,
    onRevertRoute,
    onDispatchRoute,
    onLoadSuccess,
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
    const [reordering, setReordering] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [loadModalOpen, setLoadModalOpen] = useState(false);
    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [notifiedStops, setNotifiedStops] = useState<Set<string>>(new Set());

    // Compute before early returns so hooks stay in consistent order
    const activeStops = (route?.stops ?? []).filter((s) => s.status !== 'cancelled');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = activeStops.findIndex((s) => s.id === active.id);
            const newIndex = activeStops.findIndex((s) => s.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const reordered = arrayMove(activeStops, oldIndex, newIndex);
            setReordering(true);
            try {
                await onReorderStops(reordered.map((s) => s.id));
            } finally {
                setReordering(false);
            }
        },
        [activeStops, onReorderStops]
    );

    if (loading) return <Spin size="large" />;
    if (error) return <Alert type="error" message={error} showIcon />;
    if (!route) return <Alert type="warning" message="Ruta no encontrada." showIcon />;

    const isDraft = route.status === 'draft';
    const isPlanned = route.status !== 'draft';
    const routeNum = `#${route.id.substring(0, 8).toUpperCase()}`;
    const hasActiveStops = activeStops.length > 0;
    const hasDepartureTime = !!route.departure_time;
    const canPlan = isDraft && hasActiveStops && hasDepartureTime;
    const hasPolyline = !!route.encoded_polyline;
    const allowReorder =
        (isDraft || route.status === 'planned') && activeStops.length > 1;

    const stopsColumns = [
        {
            title: allowReorder ? '↕ Sec.' : 'Sec.',
            key: 'sequence',
            width: allowReorder ? 70 : 60,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                if (!allowReorder) return stop.sequence;
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, userSelect: 'none' }}>
                        <HolderOutlined style={{ fontSize: 14, color: '#999' }} />
                        {stop.sequence}
                    </span>
                );
            },
        },
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
                          if (!stop.estimated_arrival_at) {
                              return <span style={{ color: '#999' }}>--:--</span>;
                          }
                           const eta = dayjs(stop.estimated_arrival_at);
                           const roundedMinute = Math.floor(eta.minute() / 5) * 5;
                           return eta.minute(roundedMinute).second(0).format('HH:mm');
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
        {
            title: (
                <Tooltip title="Notificar siguiente pendiente">
                    <Button
                        variant="link"
                        size="small"
                        icon={<WhatsAppOutlined style={{ color: '#25D366' }} />}
                        label="Notif."
                        action={() => {
                            const next = activeStops.find(
                                (s) => !s.notified_at && !notifiedStops.has(s.id)
                            );
                            if (next) handleWhatsApp(next);
                        }}
                    />
                </Tooltip>
            ),
            key: 'whatsapp',
            width: 60,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const stop = record as unknown as RouteStop;
                const isNotified = stop.notified_at || notifiedStops.has(stop.id);
                return (
                    <Tooltip
                        title={
                            isNotified && stop.notified_at
                                ? `Notificado el ${formatDateShort(stop.notified_at)}`
                                : 'Notificar por WhatsApp'
                        }
                    >
                        <AntButton
                            type="text"
                            icon={
                                <WhatsAppOutlined
                                    style={{ color: isNotified ? '#b7eb8f' : '#25D366', fontSize: 18 }}
                                />
                            }
                            onClick={() => handleWhatsApp(stop)}
                            aria-label="Notificar WhatsApp"
                        />
                    </Tooltip>
                );
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

    const SortableRow = ({
        id,
        className,
        style,
        ...restProps
    }: {
        id: string;
        className?: string;
        style?: CSSProperties;
        [key: string]: unknown;
    }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
            useSortable({ id, disabled: !allowReorder });

        const sortableStyle: CSSProperties = {
            ...style,
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
            touchAction: 'none',
        };

        return (
            <tr
                ref={setNodeRef}
                {...restProps}
                {...attributes}
                {...listeners}
                className={className}
                style={sortableStyle}
            />
        );
    };

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

    const handleWhatsApp = async (stop: RouteStop) => {
        const phone = stop.order?.customer?.phone;
        const msg = buildWhatsAppMessage({
            customerName: stop.order?.customer?.name || 'Cliente',
            estimatedArrivalAt: stop.estimated_arrival_at,
            sequence: stop.sequence,
        });

        // Optimistic update
        setNotifiedStops((prev) => new Set(prev).add(stop.id));

        try {
            await RoutesService.markStopNotified(stop.id);
        } catch (err) {
            setNotifiedStops((prev) => {
                const next = new Set(prev);
                next.delete(stop.id);
                return next;
            });
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al marcar como notificado.');
            return;
        }

        if (phone) {
            window.open(
                `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`,
                '_blank'
            );
        }
    };

    return (
        <div className="routeDetailPage">
            <div className="routeDetailHeader">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h1 className="routeDetailTitle">{routeNum}</h1>
                    {route.status === 'planned' && (
                        <CanDo permission="logistics.routes.revert">
                            <Dropdown
                                menu={{
                                    style: { minWidth: 200 },
                                    items: [
                                        {
                                            key: 'revert',
                                            icon: <UndoOutlined />,
                                            label: 'Revertir a Borrador',
                                            danger: true,
                                        },
                                    ],
                                    onClick: ({ key }) => {
                                        if (key === 'revert') {
                                            AntModal.confirm({
                                                title: '¿Revertir a borrador?',
                                                content:
                                                    'Se eliminará la planificación técnica actual. Esta acción no se puede deshacer.',
                                                okText: 'Revertir',
                                                cancelText: 'Cancelar',
                                                okButtonProps: { danger: true },
                                                onOk: async () => {
                                                    await onRevertRoute('Reversión manual desde el panel.');
                                                },
                                            });
                                        }
                                    },
                                }}
                                trigger={['click']}
                            >
                                <AntButton icon={<EllipsisOutlined />} type="text" />
                            </Dropdown>
                        </CanDo>
                    )}
                </div>
                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="Fecha">
                        <Text strong>{formatDateShort(route.operational_date)}</Text>
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
                            route.departure_time ? <Text strong>{route.departure_time}</Text> : '—'
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Conductor">
                        <Text strong>{route.driver?.name || '—'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Vehículo">
                        <Text strong>{route.vehicle?.name || '—'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Estado">
                        <Tag color={statusColors[route.status] || 'default'}>
                            {statusLabels[route.status] || route.status}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Paradas"><Text strong>{activeStops.length}</Text></Descriptions.Item>
                </Descriptions>

                {/* ── Acciones: planned ── */}
                {route.status === 'planned' && (
                    <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                        {hasPolyline && (
                            <Col xs={12} md={7}>
                                <Button
                                    variant="default"
                                    label="Ver recorrido"
                                    icon={<EnvironmentOutlined />}
                                    action={() => setMapModalOpen(true)}
                                    block
                                />
                            </Col>
                        )}
                        <CanDo permission="logistics.routes.plan">
                            <Col xs={hasPolyline ? 12 : 24} md={hasPolyline ? 7 : 8}>
                                <Button
                                    variant="default"
                                    label="Reoptimizar"
                                    icon={<ReloadOutlined />}
                                    action={() => {
                                        AntModal.confirm({
                                            title: 'Reoptimizar Ruta',
                                            content:
                                                'Se descartará el orden manual actual y se calculará nuevamente el orden óptimo automático de las paradas. ¿Continuar?',
                                            okText: 'Reoptimizar',
                                            cancelText: 'Cancelar',
                                            onOk: async () => {
                                                await onOptimizeRoute();
                                            },
                                        });
                                    }}
                                    block
                                />
                            </Col>
                        </CanDo>
                        <CanDo permission="logistics.routes.manage">
                            <Col xs={24} md={hasPolyline ? 10 : 16}>
                                <Button
                                    variant="primary"
                                    label="Gestionar Carga"
                                    icon={<CheckCircleOutlined />}
                                    action={() => setLoadModalOpen(true)}
                                    block
                                />
                            </Col>
                        </CanDo>
                    </Row>
                )}

                {/* ── Acciones: loaded ── */}
                {route.status === 'loaded' && (
                    <Row gutter={[8, 8]} align="middle" style={{ marginTop: 12 }}>
                        {hasPolyline && (
                            <Col xs={12} md={6}>
                                <Button
                                    variant="default"
                                    size="middle"
                                    label="Ver recorrido"
                                    icon={<EnvironmentOutlined />}
                                    action={() => setMapModalOpen(true)}
                                    block
                                    style={{ overflow: 'hidden' }}
                                />
                            </Col>
                        )}
                        <Col xs={hasPolyline ? 12 : 24} md={6}>
                            <CanDo permission="logistics.routes.view">
                                <Button
                                    variant="default"
                                    size="middle"
                                    label="Hoja de Carga"
                                    icon={<FileTextOutlined />}
                                    action={() => setLoadModalOpen(true)}
                                    block
                                    style={{ overflow: 'hidden' }}
                                />
                            </CanDo>
                        </Col>
                        <Col xs={24} md={6}>
                            <CanDo permission="logistics.routes.manage">
                                <Button
                                    variant="primary"
                                    size="middle"
                                    label="Ajustar Productos por Parada"
                                    icon={<EyeOutlined />}
                                    action={() => setAdjustmentOpen(true)}
                                    block
                                />
                            </CanDo>
                        </Col>
                        <Col xs={24} md={6}>
                            <CanDo permission="logistics.routes.dispatch">
                                <Popconfirm
                                    title="¿Confirmar despacho?"
                                    description="El chofer iniciará el recorrido y ya no se podrán realizar ajustes de carga."
                                    onConfirm={() => onDispatchRoute()}
                                    okText="Despachar"
                                    cancelText="Cancelar"
                                    okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
                                >
                                    <Button
                                        variant="primary"
                                        size="middle"
                                        label="Despachar Ruta"
                                        icon={<TruckOutlined />}
                                        block
                                        style={{
                                            background: '#52c41a',
                                            borderColor: '#52c41a',
                                            color: '#fff',
                                        }}
                                    />
                                </Popconfirm>
                            </CanDo>
                        </Col>
                    </Row>
                )}

                {/* ── Acciones: dispatched ── */}
                {route.status === 'dispatched' && hasPolyline && (
                    <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                        <Col xs={24} md={6}>
                            <Button
                                variant="default"
                                size="middle"
                                label="Ver recorrido"
                                icon={<EnvironmentOutlined />}
                                action={() => setMapModalOpen(true)}
                                block
                            />
                        </Col>
                    </Row>
                )}
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={activeStops.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <AntTable
                            columns={stopsColumns}
                            dataSource={activeStops as unknown as Record<string, unknown>[]}
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            size="small"
                            loading={reordering}
                            rowKey="id"
                            components={{
                                body: {
                                    row: SortableRow,
                                },
                            }}
                            onRow={(record) =>
                                ({
                                    id: (record as Record<string, unknown>).id as string,
                                } as Record<string, unknown>)
                            }
                        />
                    </SortableContext>
                </DndContext>
            </div>

            {route.requires_recalculation && (
                <div
                    className="routeDetailSection"
                    style={{ borderColor: '#faad14', background: '#fffbe6' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <strong style={{ color: '#d48806' }}>
                                ⚠️ Orden modificado
                            </strong>
                            <p style={{ margin: '4px 0 0', color: '#666' }}>
                                El orden de las paradas ha cambiado. Es necesario recalcular
                                los tiempos de llegada.
                            </p>
                        </div>
                        <CanDo permission="logistics.routes.manage">
                            <Button
                                variant="primary"
                                label="Recalcular Tiempos"
                                loading={recalculating}
                                action={async () => {
                                    setRecalculating(true);
                                    try {
                                        await onRecalculate();
                                    } finally {
                                        setRecalculating(false);
                                    }
                                }}
                            />
                        </CanDo>
                    </div>
                </div>
            )}

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

            <RouteLoadDrawer
                open={loadModalOpen}
                routeId={route.id}
                isLoaded={route.status === 'loaded'}
                onClose={() => setLoadModalOpen(false)}
                onSuccess={() => {
                    setLoadModalOpen(false);
                    onLoadSuccess();
                }}
            />

            <RouteAdjustmentDrawer
                open={adjustmentOpen}
                routeId={route.id}
                onClose={() => setAdjustmentOpen(false)}
                onSuccess={() => {
                    setAdjustmentOpen(false);
                    onLoadSuccess();
                }}
            />
        </div>
    );
};
