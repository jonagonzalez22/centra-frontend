import { useState } from 'react';
import { Alert, Spin, Card, Tag, Button, Tabs, Empty, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import {
    CarOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { formatDateShort } from '@/utils/formatters';
import type { DeliveryRoute } from '@/features/driver/interfaces/driver.interface';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import './DriverRoutesPage.css';

const STATUS_COLORS: Record<string, string> = {
    draft: 'default',
    planned: 'blue',
    loaded: 'cyan',
    dispatched: 'orange',
    awaiting_reconciliation: 'purple',
    completed: 'green',
    cancelled: 'red',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    planned: 'Planificada',
    loaded: 'Cargada',
    dispatched: 'En camino',
    awaiting_reconciliation: 'Pend. Conciliación',
    completed: 'Completada',
    cancelled: 'Cancelada',
};

const formatTime = (time: string | null | undefined): string => {
    if (!time) return '';
    // Handle HH:mm:ss or HH:mm format
    const [h, m] = time.split(':');
    return `${h}:${m} hs`;
};

interface DriverRoutesPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    activeRoute: DeliveryRoute | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    onRoutePress: (route: DeliveryRoute) => void;
}

const ActiveRouteCard = ({
    route,
    onPress,
}: {
    route: DeliveryRoute;
    onPress: () => void;
}) => {
    const completedStops = route.stops.filter(
        (s) => s.status === 'completed' || s.status === 'failed'
    ).length;
    const totalStops = route.stops.length;
    const progressPct = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

    const nextStop = route.stops.find(
        (s) => s.status === 'pending' || s.status === 'arrived'
    );

    const etaDisplay = (() => {
        if (!nextStop) return null;
        if (nextStop.notification_window_start && nextStop.notification_window_end) {
            return `${formatTime(nextStop.notification_window_start)} – ${formatTime(nextStop.notification_window_end)}`;
        }
        return nextStop.estimated_arrival_at
            ? new Date(nextStop.estimated_arrival_at).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : null;
    })();

    return (
        <Card
            hoverable
            onClick={onPress}
            className="mb-4 cursor-pointer"
            styles={{ body: { padding: 0 } }}
        >
            {/* Card Header */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-base font-semibold text-[#093764]">
                            #{route.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <ClockCircleOutlined />
                            {formatDateShort(route.operational_date)}
                            {route.departure_time && ` · Partida ${formatTime(route.departure_time)}`}
                        </div>
                    </div>
                    <Tag color={STATUS_COLORS[route.status] ?? 'default'}>
                        {STATUS_LABELS[route.status] ?? route.status}
                    </Tag>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <CarOutlined />
                    <span>
                        {route.vehicle?.name ?? '—'}{' '}
                        {route.vehicle?.plate && `(${route.vehicle.plate})`}
                    </span>
                </div>

                {/* ETA Banner */}
                {etaDisplay && (
                    <div className="text-sm font-medium text-[#093764] bg-blue-50 rounded px-3 py-2 mb-3">
                        ⏰ Próxima: {etaDisplay}
                    </div>
                )}

                {/* Progress bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>
                            {completedStops} de {totalStops} paradas completadas
                        </span>
                    </div>
                    <div className="driverRouteProgressBar">
                        <div
                            className="driverRouteProgressFill"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* CTA Footer */}
            <div
                className="driverRouteCtaFooter"
                onClick={(e) => {
                    e.stopPropagation();
                    onPress();
                }}
            >
                <span className="font-medium text-sm">
                    {route.status === 'dispatched' ? 'Continuar Reparto' : 'Ver Hoja de Ruta'}
                </span>
                <RightOutlined />
            </div>
        </Card>
    );
};

export const DriverRoutesPageView = ({
    title,
    breadcrumbs,
    activeRoute,
    loading,
    error,
    onRefresh,
    onRoutePress,
}: DriverRoutesPageViewProps) => {
    const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert
                    type="error"
                    message={error}
                    showIcon
                    action={
                        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                            Reintentar
                        </Button>
                    }
                />
            </div>
        );
    }

    const tabs = [
        {
            key: 'active',
            label: 'Activa',
            children: (
                <div className="pt-2">
                    {activeRoute ? (
                        <ActiveRouteCard
                            route={activeRoute}
                            onPress={() => onRoutePress(activeRoute)}
                        />
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No tenés una ruta activa en este momento."
                            className="mt-8"
                        />
                    )}
                </div>
            ),
        },
        {
            key: 'all',
            label: 'Historial',
            children: (
                <div className="pt-2">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Historial de rutas en desarrollo."
                        className="mt-8"
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="driverRoutesPage">
            <div className="driverRoutesPageHeader">
                <Breadcrumb
                    className="driverRoutesPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? (
                            <Link to={item.path}>{item.label}</Link>
                        ) : (
                            item.label
                        ),
                    }))}
                />
                <h1 className="driverRoutesPageTitle">{title}</h1>
            </div>

            <div className="p-4">
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'active' | 'all')}
                    items={tabs}
                    size="large"
                />
            </div>
        </div>
    );
};
