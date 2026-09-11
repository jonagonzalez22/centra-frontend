import { useCallback, useEffect, useState } from 'react';
import type { CashOverview, CashPendingPage, CashSessionBlind } from '@/entities/CashSession';
import { OpenCashModal } from '@/features/store/cash/components/OpenCashModal';
import { ReconciliationModal } from '@/features/store/cash/components/ReconciliationModal';
import { SubmitCashModal } from '@/features/store/cash/components/SubmitCashModal';
import { CashService } from '@/features/store/cash/services/cash.service';
import { usePermissions } from '@/hooks/usePermissions';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { useAuthStore } from '@/store/useAuthStore.store';
import { CashPageView } from './CashPageView';

export const CashPage = () => {
    const { user, setCashSession } = useAuthStore();
    const { can } = usePermissions();
    const [overview, setOverview] = useState<CashOverview | null>(null);
    const [pending, setPending] = useState<CashPendingPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openModalOpen, setOpenModalOpen] = useState(false);
    const [submitSession, setSubmitSession] = useState<CashSessionBlind | null>(null);
    const [reconciliationId, setReconciliationId] = useState<string | null>(null);
    const canClose = can('cash.close');

    const loadPending = useCallback(
        async (page = 1) => {
            if (!canClose) return;
            setPendingLoading(true);
            try {
                setPending(await CashService.getPendingReconciliations(page));
            } catch (caught) {
                setError(
                    (caught as ApiError).message || 'No se pudieron cargar los arqueos pendientes.'
                );
            } finally {
                setPendingLoading(false);
            }
        },
        [canClose]
    );

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const nextOverview = await CashService.getOverview();
            setOverview(nextOverview);
            setCashSession(nextOverview.current);
            await loadPending(1);
        } catch (caught) {
            setError((caught as ApiError).message || 'Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    }, [loadPending, setCashSession]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    const handleMutationSuccess = () => {
        setOpenModalOpen(false);
        setSubmitSession(null);
        setReconciliationId(null);
        void refetch();
    };

    return (
        <>
            <CashPageView
                loading={loading}
                error={error}
                overview={overview}
                canOpen={can('cash.open')}
                canSubmit={can('cash.submit')}
                canClose={canClose}
                pending={pending}
                pendingLoading={pendingLoading}
                currentUserId={user?.id}
                onOpenCash={() => setOpenModalOpen(true)}
                onSubmitCash={setSubmitSession}
                onReconcile={setReconciliationId}
                onPendingPageChange={(page) => void loadPending(page)}
                onRetry={() => void refetch()}
            />
            <OpenCashModal
                open={openModalOpen}
                onClose={() => setOpenModalOpen(false)}
                onSuccess={handleMutationSuccess}
            />
            <SubmitCashModal
                session={submitSession}
                onClose={() => setSubmitSession(null)}
                onSuccess={handleMutationSuccess}
            />
            <ReconciliationModal
                sessionId={reconciliationId}
                onClose={() => setReconciliationId(null)}
                onSuccess={handleMutationSuccess}
            />
        </>
    );
};
