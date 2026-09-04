import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { message } from 'antd';
import { useStopDetail } from '@/features/driver/hooks/useStopDetail';
import {
    DriverService,
    type CompleteStopPayload,
    type RejectionReason,
} from '@/features/driver/services/driver.service';
import { StopDetailPageView } from './StopDetailPageView';
import { DeliveryDecisionModal } from '@/features/driver/components/DeliveryDecisionModal';
import { StopPaymentModal } from '@/features/driver/components/StopPaymentModal';
import { FailedDeliveryModal } from '@/features/driver/components/FailedDeliveryModal';
import { ExtraSaleWrapper } from '@/features/driver/components/ExtraSaleWrapper';
import { useAvailableSurplus } from '@/features/driver/hooks/useAvailableSurplus';
import type { CollectionPreview } from '@/features/driver/interfaces/driver.interface';

export const StopDetailPage = () => {
    const { stopId } = useParams<{ routeId: string; stopId: string }>();
    const stopDetail = useStopDetail(stopId ?? '');
    const stopIsActionable =
        stopDetail.stop?.status === 'pending' || stopDetail.stop?.status === 'arrived';
    const availableSurplus = useAvailableSurplus({
        routeId: stopDetail.stop?.route_id ?? '',
        stopId: stopDetail.stop?.id ?? stopId ?? '',
        enabled: stopIsActionable,
    });
    const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);

    // Modal state
    const [decisionModalOpen, setDecisionModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [failedDeliveryModalOpen, setFailedDeliveryModalOpen] = useState(false);
    const [extraSaleOpen, setExtraSaleOpen] = useState(false);

    // Pending delivery payload (constructed in view, stored here for modal handlers)
    const [pendingPayload, setPendingPayload] = useState<CompleteStopPayload | null>(null);
    const [pendingPreview, setPendingPreview] = useState<CollectionPreview | null>(null);

    // Fetch rejection reasons
    useEffect(() => {
        DriverService.getRejectionReasons()
            .then(setRejectionReasons)
            .catch(() => {
                // Silent fail — not critical
            });
    }, []);

    // ── Orchestrator actions ─────────────────────────────────────────────────

    const handleDeliver = useCallback(
        async (
            payload: {
                items: Array<{
                    route_stop_item_id: string;
                    quantity_delivered: number;
                    quantity_released_for_extra_sale: number;
                    rejection_reason_id?: string | null;
                }>;
                gps?: { lat: number; lon: number };
                payments?: Array<{
                    store_payment_method_id: string;
                    amount: number;
                    reference?: string;
                }>;
            },
            preview: CollectionPreview | null
        ) => {
            if (!stopDetail.stop) return;

            if (preview && preview.amount_to_collect_now > 0) {
                // Store payload and show decision modal
                const completePayload: CompleteStopPayload = {
                    status: 'completed',
                    items: payload.items,
                    gps: payload.gps,
                };
                setPendingPayload(completePayload);
                setPendingPreview(preview);
                setDecisionModalOpen(true);
            } else {
                // Direct delivery
                const completePayload: CompleteStopPayload = {
                    status: 'completed',
                    items: payload.items,
                    gps: payload.gps,
                };
                await stopDetail.completeStop(completePayload);
            }
        },
        [stopDetail]
    );

    const handleDecisionDeliver = useCallback(async () => {
        if (!pendingPayload) return;
        setDecisionModalOpen(false);
        await stopDetail.completeStop(pendingPayload);
        setPendingPayload(null);
        setPendingPreview(null);
    }, [pendingPayload, stopDetail]);

    const handleDecisionCollect = useCallback(() => {
        setDecisionModalOpen(false);
        setPaymentModalOpen(true);
    }, []);

    const handlePaymentConfirm = useCallback(
        async (
            payments: Array<{ store_payment_method_id: string; amount: number; reference?: string }>
        ) => {
            if (!pendingPayload) return;
            const completePayload: CompleteStopPayload = {
                ...pendingPayload,
                payments,
            };
            setPaymentModalOpen(false);
            await stopDetail.completeStop(completePayload);
            setPendingPayload(null);
            setPendingPreview(null);
        },
        [pendingPayload, stopDetail]
    );

    const handleFailedDelivery = useCallback(
        async (rejectionReasonId: string, quantitiesReleased: Record<string, number>) => {
            if (!stopDetail.stop) return;
            const completePayload: CompleteStopPayload = {
                status: 'failed',
                items: stopDetail.stop.items.map((item) => ({
                    route_stop_item_id: item.route_stop_item_id,
                    quantity_delivered: 0,
                    quantity_released_for_extra_sale: quantitiesReleased[item.id] ?? 0,
                })),
                rejection_reason_id: rejectionReasonId,
            };
            await stopDetail.completeStop(completePayload);
            message.success('Entrega fallida registrada.');
            setFailedDeliveryModalOpen(false);
        },
        [stopDetail]
    );

    const amountToCollectNow = pendingPreview?.amount_to_collect_now ?? 0;

    return (
        <>
            <StopDetailPageView
                key={stopDetail.stop?.id}
                stop={stopDetail.stop}
                loading={stopDetail.loading}
                error={stopDetail.error}
                onRefresh={stopDetail.refresh}
                rejectionReasons={rejectionReasons}
                completing={stopDetail.completing}
                onDeliver={handleDeliver}
                onFailedDelivery={() => setFailedDeliveryModalOpen(true)}
                onExtraSaleClick={() => setExtraSaleOpen(true)}
                hasAvailableSurplus={availableSurplus.hasAvailableSurplus}
            />

            {stopDetail.stop && (
                <ExtraSaleWrapper
                    open={extraSaleOpen}
                    routeId={stopDetail.stop.route_id}
                    stopId={stopDetail.stop.id}
                    onClose={() => setExtraSaleOpen(false)}
                    onSuccess={() => {
                        stopDetail.refresh();
                        availableSurplus.refresh();
                    }}
                />
            )}

            <DeliveryDecisionModal
                open={decisionModalOpen}
                amountToCollectNow={amountToCollectNow}
                onDeliver={handleDecisionDeliver}
                onCollect={handleDecisionCollect}
                onCancel={() => {
                    setDecisionModalOpen(false);
                    setPendingPayload(null);
                    setPendingPreview(null);
                }}
                loading={stopDetail.completing}
            />

            <StopPaymentModal
                open={paymentModalOpen}
                amountToCollectNow={amountToCollectNow}
                onClose={() => {
                    setPaymentModalOpen(false);
                    setPendingPayload(null);
                    setPendingPreview(null);
                }}
                onConfirm={handlePaymentConfirm}
            />

            <FailedDeliveryModal
                open={failedDeliveryModalOpen}
                rejectionReasons={rejectionReasons}
                items={stopDetail.stop?.items ?? []}
                loading={stopDetail.completing}
                onConfirm={handleFailedDelivery}
                onClose={() => setFailedDeliveryModalOpen(false)}
            />
        </>
    );
};
