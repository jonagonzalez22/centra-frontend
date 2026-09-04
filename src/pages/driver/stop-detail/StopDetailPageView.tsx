import { useMemo, useRef } from 'react';
import { Alert, Button, Spin, Tag } from 'antd';
import { ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import type {
    CollectionPreview,
    StopDetail,
    RouteStopStatus,
} from '@/features/driver/interfaces/driver.interface';
import { OrderBalanceSummary } from '@/components/driver';
import { useStopDetailItems } from '@/features/driver/hooks/useStopDetailItems';
import { useCollectionPreview } from '@/features/driver/hooks/useCollectionPreview';
import { StopDetailCard } from '@/features/driver/components/StopDetailCard';
import { StopDetailFooter } from '@/features/driver/components/StopDetailFooter';
import { formatCurrency } from '@/utils/formatters';
import './StopDetailPage.css';

// ── Props ───────────────────────────────────────────────────────────────────────

interface DeliverPayload {
    items: Array<{
        route_stop_item_id: string;
        quantity_delivered: number;
        quantity_released_for_extra_sale: number;
        rejection_reason_id?: string | null;
    }>;
    gps?: { lat: number; lon: number };
    payments?: Array<{ store_payment_method_id: string; amount: number; reference?: string }>;
}

export interface StopDetailPageViewProps {
    stop: StopDetail | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    rejectionReasons: import('@/features/driver/services/driver.service').RejectionReason[];
    completing: boolean;
    onDeliver: (payload: DeliverPayload, preview: CollectionPreview | null) => Promise<void>;
    onFailedDelivery: () => void;
    onExtraSaleClick: () => void;
    hasAvailableSurplus: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────────

const STOP_STATUS_COLORS: Record<RouteStopStatus, string> = {
    pending: 'warning',
    arrived: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'default',
};

const STOP_STATUS_LABELS: Record<RouteStopStatus, string> = {
    pending: 'Pendiente',
    arrived: 'Llegó',
    completed: 'Entregado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
};

// ── Component ───────────────────────────────────────────────────────────────────

export const StopDetailPageView = ({
    stop,
    loading,
    error,
    onRefresh,
    rejectionReasons,
    completing,
    onDeliver,
    onFailedDelivery,
    onExtraSaleClick,
    hasAvailableSurplus,
}: StopDetailPageViewProps) => {
    const productsListRef = useRef<HTMLDivElement>(null);

    const itemsState = useStopDetailItems({
        stopId: stop?.id,
        items: stop?.items,
        rejectionReasons,
        stopStatus: stop?.status,
        completing,
    });
    const previewItems = useMemo(
        () =>
            (stop?.items ?? []).map((item) => ({
                route_stop_item_id: item.route_stop_item_id,
                quantity_delivered: itemsState.quantitiesDelivered[item.id] ?? item.quantity_loaded,
            })),
        [itemsState.quantitiesDelivered, stop?.items]
    );
    const stopIsResolved =
        stop?.status === 'completed' || stop?.status === 'failed' || stop?.status === 'cancelled';
    const collectionPreview = useCollectionPreview({
        stopId: stop?.id ?? '',
        items: previewItems,
        enabled: !!stop?.order && !stopIsResolved,
    });

    // ── Guards ──────────────────────────────────────────────────────────────
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

    if (!stop) {
        return (
            <div className="p-4">
                <Alert type="warning" message="Parada no encontrada." showIcon />
            </div>
        );
    }

    // ── Derived ────────────────────────────────────────────────────────────
    const isCompleted =
        stop.status === 'completed' || stop.status === 'failed' || stop.status === 'cancelled';
    const hasPendingCollections = stop.collections.some((c) => c.status === 'declared');
    const buttonLabel =
        itemsState.touchedItemIds.size === 0 && itemsState.deliveryState.allFull
            ? 'Entregar todo'
            : 'Confirmar entrega parcial';

    // ── Handlers ────────────────────────────────────────────────────────────
    const handlePrimaryClick = async () => {
        if (!itemsState.canConfirm || !itemsState.canDeliver) return;

        const gps = await new Promise<{ lat: number; lon: number } | undefined>((resolve) => {
            if (!navigator.geolocation) return resolve(undefined);
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                () => resolve(undefined),
                { timeout: 5000 }
            );
        });

        const payload: DeliverPayload = {
            items: stop.items.map((item) => {
                // quantity_loaded = 0 items: not loaded in depot, always 0, no reason
                if (item.quantity_loaded === 0) {
                    return {
                        route_stop_item_id: item.route_stop_item_id,
                        quantity_delivered: 0,
                        quantity_released_for_extra_sale: 0,
                        rejection_reason_id: null,
                    };
                }
                return {
                    route_stop_item_id: item.route_stop_item_id,
                    quantity_delivered:
                        itemsState.quantitiesDelivered[item.id] ?? item.quantity_loaded,
                    quantity_released_for_extra_sale: itemsState.quantitiesReleased[item.id] ?? 0,
                    rejection_reason_id:
                        itemsState.quantitiesDelivered[item.id] < item.quantity_loaded
                            ? (itemsState.rejectionReasonsByItem[item.id] ?? null)
                            : null,
                };
            }),
            gps,
        };

        await onDeliver(payload, collectionPreview.preview);
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="stopDetailPage">
            {/* Header */}
            <div className="stopDetailHeader">
                <button className="stopDetailBackBtn" onClick={() => history.back()}>
                    ← Volver
                </button>
            </div>

            {/* Context */}
            <div className="stopDetailContext">
                <div className="stopDetailContextName">{stop.contact_name ?? 'Cliente'}</div>
                <div className="stopDetailContextMeta">
                    <span className="stopDetailContextSequence">Parada #{stop.sequence}</span>
                    <Tag color={STOP_STATUS_COLORS[stop.status]}>
                        {STOP_STATUS_LABELS[stop.status]}
                    </Tag>
                </div>
            </div>

            <div className="stopDetailPageContent pb-40">
                {/* Payment info */}
                <div className="stopDetailPaymentLabel">Información de pago</div>
                <OrderBalanceSummary
                    order={stop.order}
                    variant="full"
                    collectionPreview={collectionPreview.preview}
                    previewLoading={collectionPreview.loading}
                    previewError={collectionPreview.error}
                    onRetryPreview={collectionPreview.retry}
                />

                {/* Notes */}
                {stop.notes && (
                    <div className="stopDetailNotes">
                        <FileTextOutlined className="stopDetailNotesIcon" />
                        <div className="stopDetailNotesContent">
                            <div className="stopDetailNotesLabel">Observaciones</div>
                            <div className="stopDetailNotesText">{stop.notes}</div>
                        </div>
                    </div>
                )}

                {/* Products header */}
                <div className="stopDetailProductsHeader">
                    <div className="stopDetailProductsLabel">
                        Productos a entregar ({stop.items.length})
                    </div>
                    {stop.items.length > 0 && (
                        <div className="stopDetailProgress">
                            {itemsState.progressCount.completed} de {itemsState.progressCount.total}{' '}
                            revisados
                        </div>
                    )}
                </div>

                {/* Products list */}
                <div className="stopDetailSection">
                    {stop.items.length === 0 ? (
                        <div className="text-sm text-gray-400 py-4 text-center">
                            Sin productos cargados
                        </div>
                    ) : (
                        <div className="stopDetailProductsWrapper" ref={productsListRef}>
                            <div className="stopDetailProductsList">
                                {stop.items.map((item) => (
                                    <StopDetailCard
                                        key={item.id}
                                        item={item}
                                        data={itemsState.getItem(item.id)!}
                                        rejectionReasonId={
                                            itemsState.rejectionReasonsByItem[item.id]
                                        }
                                        reasonOptions={rejectionReasons}
                                        canDeliver={itemsState.canDeliver}
                                        onSetQuantity={itemsState.setQuantity}
                                        onSetReleasedQuantity={itemsState.setReleasedQuantity}
                                        onToggleConfirm={itemsState.toggleConfirm}
                                        onSetRejectionReason={itemsState.setRejectionReason}
                                        onMarkReasonTouched={itemsState.markReasonTouched}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Collections */}
                {stop.collections.length > 0 && (
                    <div className="stopDetailSection">
                        <div className="stopDetailSectionTitle">
                            Cobros declarados ({stop.collections.length})
                        </div>
                        {hasPendingCollections && (
                            <Alert
                                message="Los cobros declarados se encuentran pendientes de verificación y no están descontados del saldo a cobrar."
                                type="info"
                                showIcon
                                className="stopDetailCollectionsNotice"
                            />
                        )}
                        <div className="stopDetailCollectionsList">
                            {stop.collections.map((col) => (
                                <div key={col.id} className="stopDetailCollectionRow">
                                    <div>
                                        <div className="stopDetailCollectionMethod">
                                            {col.method}
                                        </div>
                                        <div className="stopDetailCollectionStatus">
                                            {col.status}
                                        </div>
                                    </div>
                                    <div className="stopDetailCollectionAmount">
                                        {formatCurrency(col.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <StopDetailFooter
                canDeliver={itemsState.canDeliver}
                canConfirm={itemsState.canConfirm}
                completing={completing}
                isCompleted={isCompleted}
                buttonLabel={buttonLabel}
                onPrimaryClick={handlePrimaryClick}
                onFailedDeliveryClick={onFailedDelivery}
                onExtraSaleClick={onExtraSaleClick}
                showExtraSale={hasAvailableSurplus && !isCompleted}
            />
        </div>
    );
};
