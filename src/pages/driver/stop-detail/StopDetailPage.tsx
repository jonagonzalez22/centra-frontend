import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { message } from 'antd';
import { useStopDetail } from '@/features/driver/hooks/useStopDetail';
import { DriverService, type CompleteStopPayload, type RejectionReason } from '@/features/driver/services/driver.service';
import { StopDetailPageView } from './StopDetailPageView';
import { DeliveryDecisionModal } from '@/features/driver/components/DeliveryDecisionModal';
import { StopPaymentModal } from '@/features/driver/components/StopPaymentModal';
import { FailedDeliveryModal } from '@/features/driver/components/FailedDeliveryModal';
import { ExtraSaleWrapper } from '@/features/driver/components/ExtraSaleWrapper';

export const StopDetailPage = () => {
    const { stopId } = useParams<{ routeId: string; stopId: string }>();
    const stopDetail = useStopDetail(stopId ?? '');
    const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);

    // Modal state
    const [decisionModalOpen, setDecisionModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [failedDeliveryModalOpen, setFailedDeliveryModalOpen] = useState(false);
    const [extraSaleOpen, setExtraSaleOpen] = useState(false);

    // Pending delivery payload (constructed in view, stored here for modal handlers)
    const [pendingPayload, setPendingPayload] = useState<CompleteStopPayload | null>(null);

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
        async (payload: {
            items: Array<{
                route_stop_item_id: string;
                quantity_delivered: number;
                rejection_reason_id?: string | null;
            }>;
            gps?: { lat: number; lon: number };
            payments?: Array<{ store_payment_method_id: string; amount: number; reference?: string }>;
        }) => {
            if (!stopDetail.stop) return;

            const pendingAmount = stopDetail.stop.order?.pending_amount ?? 0;

            if (pendingAmount > 0) {
                // Store payload and show decision modal
                const completePayload: CompleteStopPayload = {
                    status: 'completed',
                    items: payload.items,
                    gps: payload.gps,
                };
                setPendingPayload(completePayload);
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
    }, [pendingPayload, stopDetail]);

    const handleDecisionCollect = useCallback(() => {
        setDecisionModalOpen(false);
        setPaymentModalOpen(true);
    }, []);

    const handlePaymentConfirm = useCallback(
        async (payments: Array<{ store_payment_method_id: string; amount: number; reference?: string }>) => {
            if (!pendingPayload) return;
            const completePayload: CompleteStopPayload = {
                ...pendingPayload,
                payments,
            };
            setPaymentModalOpen(false);
            await stopDetail.completeStop(completePayload);
            setPendingPayload(null);
        },
        [pendingPayload, stopDetail]
    );

    const handleFailedDelivery = useCallback(
        async (rejectionReasonId: string) => {
            if (!stopDetail.stop) return;
            const completePayload: CompleteStopPayload = {
                status: 'failed',
                items: stopDetail.stop.items.map((item) => ({
                    route_stop_item_id: item.route_stop_item_id,
                    quantity_delivered: 0,
                })),
                rejection_reason_id: rejectionReasonId,
            };
            await stopDetail.completeStop(completePayload);
            message.success('Entrega fallida registrada.');
            setFailedDeliveryModalOpen(false);
        },
        [stopDetail]
    );

    const pendingAmount = stopDetail.stop?.order?.pending_amount ?? 0;

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
            />

            {stopDetail.stop && (
                <ExtraSaleWrapper
                    open={extraSaleOpen}
                    routeId={stopDetail.stop.route_id}
                    stopId={stopDetail.stop.id}
                    onClose={() => setExtraSaleOpen(false)}
                    onSuccess={() => {
                        stopDetail.refresh();
                    }}
                />
            )}

            <DeliveryDecisionModal
                open={decisionModalOpen}
                pendingAmount={pendingAmount}
                onDeliver={handleDecisionDeliver}
                onCollect={handleDecisionCollect}
                onCancel={() => {
                    setDecisionModalOpen(false);
                    setPendingPayload(null);
                }}
                loading={stopDetail.completing}
            />

            <StopPaymentModal
                open={paymentModalOpen}
                pendingAmount={pendingAmount}
                onClose={() => {
                    setPaymentModalOpen(false);
                    setPendingPayload(null);
                }}
                onConfirm={handlePaymentConfirm}
            />

            <FailedDeliveryModal
                open={failedDeliveryModalOpen}
                rejectionReasons={rejectionReasons}
                loading={stopDetail.completing}
                onConfirm={handleFailedDelivery}
                onClose={() => setFailedDeliveryModalOpen(false)}
            />
        </>
    );
};
