import { Alert, Spin, Card, Button, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    PhoneOutlined,
    RightOutlined,
    MessageOutlined,
} from '@ant-design/icons';
import type { RouteStopsItem, RouteStopStatus } from '@/features/driver/interfaces/driver.interface';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import { OrderBalanceSummary } from '@/components/driver';
import './RouteSheetPage.css';

const SEQUENCE_CLASS: Record<RouteStopStatus, string> = {
    pending: 'sequencePending',
    arrived: 'sequenceArrived',
    completed: 'sequenceCompleted',
    failed: 'sequenceFailed',
    cancelled: 'sequencePending',
};

const formatTime = (time: string | null | undefined): string => {
    if (!time) return '';
    const [h, m] = time.split(':');
    return `${h}:${m} hs`;
};

interface RouteSheetPageViewProps {
    title: string;
    breadcrumbs: PageBreadcrumbItem[];
    stops: RouteStopsItem[];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    onStopPress: (stopId: string) => void;
}

const StopCard = ({ stop, onPress }: { stop: RouteStopsItem; onPress: () => void }) => {
    const windowDisplay =
        stop.notification_window_start && stop.notification_window_end
            ? `${formatTime(stop.notification_window_start)} – ${formatTime(stop.notification_window_end)}`
            : null;

    const mapsUrl = stop.address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`
        : null;

    const whatsappUrl = stop.contact_phone
        ? `https://wa.me/${stop.contact_phone.replace(/\D/g, '')}`
        : null;

    const phoneUrl = stop.contact_phone ? `tel:${stop.contact_phone}` : null;

    return (
        <Card
            hoverable
            onClick={onPress}
            className="routeSheetStopCard mb-3"
            styles={{ body: { padding: 0 } }}
        >
            {/* Main content row */}
            <div className="flex gap-3 p-4">
                {/* Sequence badge */}
                <div className={`routeSheetStopSequence ${SEQUENCE_CLASS[stop.status]}`}>
                    {stop.status === 'completed' || stop.status === 'failed' ? (
                        <span style={{ fontSize: 12 }}>✓</span>
                    ) : (
                        stop.sequence
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Customer name — priority #1 */}
                    <div className="routeSheetStopCustomer">
                        {stop.contact_name ?? 'Cliente'}
                    </div>

                    {/* Address — priority #2 */}
                    {stop.address && (
                        <div className="routeSheetStopAddress">
                            <EnvironmentOutlined className="routeSheetStopIcon" />
                            <span>{stop.address}</span>
                        </div>
                    )}

                    {/* Schedule — priority #3 */}
                    {windowDisplay && (
                        <div className="routeSheetStopMeta">
                            <ClockCircleOutlined className="routeSheetStopIcon" />
                            <span>{windowDisplay}</span>
                        </div>
                    )}

                    {/* Payment badge */}
                    <OrderBalanceSummary order={stop.order ?? null} variant="compact" />
                </div>

                {/* Chevron */}
                <div className="flex items-center flex-shrink-0">
                    <RightOutlined className="text-gray-400" />
                </div>
            </div>

            {/* Contact buttons — horizontal 3-column grid */}
            <div className="routeSheetStopCardFooter">
                {mapsUrl && (
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="routeSheetContactBtn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <EnvironmentOutlined />
                        <span>Maps</span>
                    </a>
                )}
                {whatsappUrl && (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="routeSheetContactBtn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MessageOutlined />
                        <span>WhatsApp</span>
                    </a>
                )}
                {phoneUrl && (
                    <a
                        href={phoneUrl}
                        className="routeSheetContactBtn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <PhoneOutlined />
                        <span>Llamar</span>
                    </a>
                )}
            </div>
        </Card>
    );
};

export const RouteSheetPageView = ({
    title,
    stops,
    loading,
    error,
    onRefresh,
    onStopPress,
}: RouteSheetPageViewProps) => {
    const navigate = useNavigate();

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

    const completedStops = stops.filter(
        (s) => s.status === 'completed' || s.status === 'failed'
    ).length;
    const totalStops = stops.length;
    const progressPct = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

    return (
        <div className="routeSheetPage">
            {/* Header with back button */}
            <div className="routeSheetPageHeader">
                <div className="routeSheetPageHeaderTop">
                    <button
                        className="routeSheetBackBtn"
                        onClick={() => navigate('/tienda/conductor/rutas')}
                    >
                        <span className="routeSheetBackBtnIcon">←</span>
                        <span>Volver</span>
                    </button>
                    <div className="routeSheetPageHeaderText">
                        <h1 className="routeSheetPageTitle">{title}</h1>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* Progress bar — clean, no percentage */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>
                            {completedStops} de {totalStops} paradas completadas
                        </span>
                    </div>
                    <div className="routeSheetProgressBar">
                        <div
                            className="routeSheetProgressFill"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                {/* Stops list */}
                {stops.length === 0 ? (
                    <Empty description="Esta ruta no tiene paradas asignadas." />
                ) : (
                    stops.map((stop) => (
                        <StopCard
                            key={stop.id}
                            stop={stop}
                            onPress={() => onStopPress(stop.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
