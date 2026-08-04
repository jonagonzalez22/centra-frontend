import { Alert, Breadcrumb, Tag } from 'antd';
import { Link } from 'react-router-dom';
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
}

export const RoutesPageView = ({
    title,
    description,
    breadcrumbs,
    error,
    items,
    loading,
    pagination,
    setPage,
    setPerPage,
}: RoutesPageViewProps) => {
    const routeNumber = (id: string) => `#${id.substring(0, 8).toUpperCase()}`;

    const columns = [
        {
            title: 'Número de Ruta',
            key: 'route_number',
            render: (_: unknown, record?: Record<string, unknown>) =>
                routeNumber((record?.id as string) || ''),
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
                return route.stops?.length ?? 0;
            },
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const status = (record?.status as string) || '';
                return (
                    <Tag color={statusColors[status] || 'default'}>
                        {statusLabels[status] || status}
                    </Tag>
                );
            },
        },
        {
            title: 'Acciones',
            key: 'acciones',
            render: () => null,
        },
    ];

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
                </div>
            </div>

            {error && (
                <Alert className="routesPageAlert" type="error" description={error} showIcon />
            )}

            <Table
                columns={columns}
                dataSource={items as unknown as Record<string, unknown>[]}
                loading={loading}
                pagination={{
                    current: pagination.current,
                    total: pagination.total,
                    pageSize: pagination.pageSize,
                    onChange: (page, pageSize) => {
                        if (pageSize !== pagination.pageSize) {
                            setPerPage(pageSize);
                        } else {
                            setPage(page);
                        }
                    },
                }}
                scroll={{ x: 'max-content' }}
                size="small"
            />
        </div>
    );
};
