import { Alert, Spin, Card, Button, Empty, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    PhoneOutlined,
    RightOutlined,
    MessageOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import type { RouteStopsItem, RouteStopStatus } from '@/features/driver/interfaces/driver.interface';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import { formatCurrency } from '@/utils/formatters';
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

    // Preferir coordenadas si están disponibles, si no dirección
    const mapsUrl = (stop.address?.latitude && stop.address?.longitude)
        ? `https://www.google.com/maps/dir/?api=1&destination=${stop.address.latitude},${stop.address.longitude}`
        : stop.address?.street
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address.street)}`
            : null;

    // Dirección completa con localidad
    const localityName = typeof stop.address?.locality === 'object'
        ? (stop.address?.locality as { name?: string } | null)?.name
        : (stop.address?.locality as string | null);
    const street = typeof stop.address === 'object' ? stop.address?.street : stop.address;
    const fullAddress = street
        ? [street, localityName].filter(Boolean).join(', ')
        : null;

    const contactPhone = stop.customer?.phone ?? '';
    const normalizedPhone = contactPhone.replace(/\D/g, '');
    const hasValidPhone = normalizedPhone.length >= 7;
    const whatsappUrl = hasValidPhone ? `https://wa.me/${normalizedPhone}` : null;
    const phoneUrl = hasValidPhone ? `tel:${contactPhone}` : null;
    const actionCount = Number(Boolean(mapsUrl)) + Number(Boolean(whatsappUrl)) + Number(Boolean(phoneUrl));

    return (
        <Card
            hoverable
            onClick={onPress}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onPress();
                }
            }}
            className="routeSheetStopCard mb-3"
            styles={{ body: { padding: 0 } }}
            role="button"
            tabIndex={0}
            aria-label={`Ver detalle de la parada ${stop.sequence} de ${stop.customer?.name ?? 'cliente'}`}
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
                        {stop.customer?.name ?? 'Cliente'}
                    </div>

                    {/* Address — priority #2 */}
                    {fullAddress && (
                        <div className="routeSheetStopAddress">
                            <EnvironmentOutlined className="routeSheetStopIcon" />
                            <span>{fullAddress}</span>
                        </div>
                    )}

                    {stop.delivery_reference && (
                        <div className="routeSheetStopReference">
                            <InfoCircleOutlined aria-hidden="true" />
                            <div className="routeSheetStopReferenceText">
                                {stop.delivery_reference}
                            </div>
                        </div>
                    )}

                    {/* Logistics notes */}
                    {stop.address?.notes && (
                        <div className="routeSheetStopNotes">
                            <span className="routeSheetStopNotesText">{stop.address.notes}</span>
                        </div>
                    )}

                    {(windowDisplay || stop.order) && (
                        <div className="routeSheetStopSecondary">
                            {windowDisplay && (
                                <div className="routeSheetStopMeta">
                                    <ClockCircleOutlined className="routeSheetStopIcon" />
                                    <span>{windowDisplay}</span>
                                </div>
                            )}
                            {stop.order && (
                                <div
                                    className={`routeSheetStopBalance ${
                                        stop.order.pending_amount > 0
                                            ? 'routeSheetStopBalance--pending'
                                            : 'routeSheetStopBalance--paid'
                                    }`}
                                >
                                    {stop.order.pending_amount > 0 ? (
                                        <>
                                            <span>Saldo:</span>{' '}
                                            <strong>{formatCurrency(stop.order.pending_amount)}</strong>
                                        </>
                                    ) : (
                                        <span>Pedido pagado</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Chevron */}
                <div className="flex items-center flex-shrink-0">
                    <RightOutlined className="text-gray-400" />
                </div>
            </div>

            <div
                className={`routeSheetStopCardFooter routeSheetStopCardFooter--${actionCount}-actions`}
            >
                {mapsUrl && (
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="routeSheetFooterAction"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Maps"
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
                        className="routeSheetFooterAction"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Contactar por WhatsApp"
                    >
                        <MessageOutlined />
                        <span>WhatsApp</span>
                    </a>
                )}
                {phoneUrl && (
                    <a
                        href={phoneUrl}
                        className="routeSheetFooterAction"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Llamar al cliente"
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

    const pendingStops = stops.filter(
        (s) => s.status === 'pending' || s.status === 'arrived'
    );
    const completedStops = stops.filter(
        (s) => s.status === 'completed' || s.status === 'failed'
    );
    const totalStops = stops.length;
    const completedCount = completedStops.length;
    const progressPct = totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;

    const renderStopsList = (stopsList: RouteStopsItem[]) => {
        if (stopsList.length === 0) {
            return <Empty description="No hay paradas en esta categoría." />;
        }
        return stopsList.map((stop) => (
            <StopCard
                key={stop.id}
                stop={stop}
                onPress={() => onStopPress(stop.id)}
            />
        ));
    };

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
                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>
                            {completedCount} de {totalStops} paradas completadas
                        </span>
                    </div>
                    <div className="routeSheetProgressBar">
                        <div
                            className="routeSheetProgressFill"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    defaultActiveKey="pending"
                    items={[
                        {
                            key: 'pending',
                            label: `Pendientes (${pendingStops.length})`,
                            children: renderStopsList(pendingStops),
                        },
                        {
                            key: 'completed',
                            label: `Completados (${completedStops.length})`,
                            children: renderStopsList(completedStops),
                        },
                    ]}
                />
            </div>
        </div>
    );
};
