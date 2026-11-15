import { Alert, Breadcrumb, Empty, Pagination, Skeleton, Tag, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined, EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import ActionButton from '@/components/ActionButton/ActionButton';
import Table from '@/components/Table/Table';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { DeliveryRoute } from '@/features/store/logistics/interfaces/route.interface';
import { formatDateShort } from '@/utils/formatters';
import './RoutesPage.css';

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

interface RoutesPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    canManageRoutes: boolean;
    error: string | null;
    items: DeliveryRoute[];
    loading: boolean;
    pagination: {
        current: number;
        total: number;
        pageSize: number;
        totalPages: number;
    };
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    onCreate: () => void;
    onView: (route: DeliveryRoute) => void;
    navigate: (path: string) => void;
}

const routeNumber = (id: string) => `#${id.substring(0, 8).toUpperCase()}`;

const RouteStatusTag = ({ status }: { status: string }) => (
    <Tag color={statusColors[status] || 'default'}>{statusLabels[status] || status}</Tag>
);

/**
 * Keeps the action availability shared between the table and the compact card view.
 * Reconciliation deliberately mirrors the existing list rule: awaiting reconciliation only.
 */
const RouteActions = ({
    route,
    onView,
    navigate,
    variant,
}: {
    route: DeliveryRoute;
    onView: (route: DeliveryRoute) => void;
    navigate: (path: string) => void;
    variant: 'table' | 'card';
}) => {
    const canReconcile = route.status === 'awaiting_reconciliation';
    const reconcile = () => navigate(`/tienda/logistica/rutas/${route.id}/rendicion`);

    if (variant === 'card') {
        return (
            <div
                className={`routesPageCardActions${canReconcile ? ' routesPageCardActions--split' : ''}`}
            >
                <CanDo permission="logistics.routes.view">
                    <Button
                        className="routesPageCardAction"
                        variant="link"
                        label="Ver detalle"
                        icon={<EyeOutlined aria-hidden />}
                        action={() => onView(route)}
                    />
                </CanDo>
                {canReconcile && (
                    <Button
                        className="routesPageCardAction routesPageCardActionPrimary"
                        variant="link"
                        label="Conciliar"
                        icon={<DollarOutlined aria-hidden />}
                        action={reconcile}
                    />
                )}
            </div>
        );
    }

    return (
        <>
            {canReconcile && (
                <Tooltip title="Rendir Ruta">
                    <Button variant="link" size="small" icon={<DollarOutlined />} action={reconcile} />
                </Tooltip>
            )}
            <CanDo permission="logistics.routes.view">
                <ActionButton icon={<EyeOutlined />} label="Ver detalle" action={() => onView(route)} />
            </CanDo>
        </>
    );
};

export const RoutesPageView = ({
    title,
    description,
    breadcrumbs,
    canManageRoutes,
    error,
    items,
    loading,
    pagination,
    setPage,
    setPerPage,
    onCreate,
    onView,
    navigate,
}: RoutesPageViewProps) => {
    const columns = [
        {
            title: 'Número de Ruta',
            key: 'route_number',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const routeRecord = record as unknown as DeliveryRoute;
                return (
                    <a onClick={() => onView(routeRecord)} style={{ cursor: 'pointer' }}>
                        {routeNumber(routeRecord.id)}
                    </a>
                );
            },
        },
        {
            title: 'Fecha',
            dataIndex: 'operational_date',
            key: 'operational_date',
            render: (_: unknown, record?: Record<string, unknown>) =>
                formatDateShort((record?.operational_date as string) || ''),
        },
        {
            title: 'Conductor',
            key: 'driver',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const route = record as unknown as DeliveryRoute;
                return route.driver?.name || '—';
            },
        },
        {
            title: 'Vehículo',
            key: 'vehicle',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const route = record as unknown as DeliveryRoute;
                return route.vehicle?.name || '—';
            },
        },
        {
            title: 'Paradas',
            key: 'stops',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const route = record as unknown as DeliveryRoute;
                return route.operational_stops_count ?? route.stops?.length ?? 0;
            },
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const status = (record?.status as string) || '';
                return <RouteStatusTag status={status} />;
            },
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 120,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const route = record as unknown as DeliveryRoute;
                return <RouteActions route={route} onView={onView} navigate={navigate} variant="table" />;
            },
        },
    ];

    const empty = <Empty description="No hay datos" />;
    const changePage = (page: number, pageSize: number) => {
        if (pageSize !== pagination.pageSize) {
            setPerPage(pageSize);
        } else {
            setPage(page);
        }
    };

    return (
        <div className="routesPage">
            <div className="routesPageHeader">
                <Breadcrumb
                    className="routesPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="routesPageHeaderTop">
                    <div className="routesPageHeaderText">
                        <h1 className="routesPageTitle">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="routesPageDescription">{description}</p>
                    </div>

                    {canManageRoutes && (
                        <CanDo permission="logistics.routes.manage">
                            <Button
                                variant="primary"
                                label="Nueva Ruta"
                                icon={<PlusOutlined />}
                                action={onCreate}
                            />
                        </CanDo>
                    )}
                </div>
            </div>

            {error && (
                <Alert className="routesPageAlert" type="error" description={error} showIcon />
            )}

            <div className="routesPageTable">
                <Table
                    columns={columns}
                    dataSource={items as unknown as Record<string, unknown>[]}
                    loading={loading}
                    emptyText={empty}
                    pagination={{
                        current: pagination.current,
                        total: pagination.total,
                        pageSize: pagination.pageSize,
                        onChange: changePage,
                    }}
                    scroll={{ x: 'max-content' }}
                    size="small"
                />
            </div>

            <div className="routesPageMobileList" data-testid="routes-mobile-list">
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div className="routesPageCard" key={index}>
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <div className="routesPageMobileEmpty">{empty}</div>
                ) : (
                    items.map((route) => {
                        const stops = route.operational_stops_count ?? route.stops?.length ?? 0;
                        return (
                            <article className="routesPageCard" key={route.id}>
                                <header className="routesPageCardHeader">
                                    <h2 className="routesPageCardNumber">{routeNumber(route.id)}</h2>
                                    <RouteStatusTag status={route.status} />
                                </header>
                                <p className="routesPageCardMetadata">
                                    {formatDateShort(route.operational_date)} · {stops}{' '}
                                    {stops === 1 ? 'parada' : 'paradas'}
                                </p>
                                <RouteActions
                                    route={route}
                                    onView={onView}
                                    navigate={navigate}
                                    variant="card"
                                />
                            </article>
                        );
                    })
                )}
                {!loading && pagination.total > pagination.pageSize && (
                    <div className="routesPageMobilePagination">
                        <Pagination
                            current={pagination.current}
                            total={pagination.total}
                            pageSize={pagination.pageSize}
                            showSizeChanger={false}
                            onChange={changePage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
