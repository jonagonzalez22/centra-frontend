import { useEffect, useState, useCallback } from 'react';
import { CashService } from '@/features/store/cash/services/cash.service';
import { useAuthStore } from '@/store/useAuthStore.store';
import { usePermissions } from '@/hooks/usePermissions';
import { CashPageView } from './CashPageView';
import { OpenCashModal } from '@/features/store/cash/components/OpenCashModal';
import { CloseCashModal } from '@/features/store/cash/components/CloseCashModal';

export const CashPage = () => {
    const { user, setCashSession } = useAuthStore();
    const cashSession = user?.cash_session ?? null;
    const { can } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [openModalOpen, setOpenModalOpen] = useState(false);
    const [closeModalOpen, setCloseModalOpen] = useState(false);

    const canOpen = can('cash.open');
    const canClose = can('cash.close');

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const session = await CashService.getCurrent();
            setCashSession(session);
        } catch {
            setCashSession(null);
        } finally {
            setLoading(false);
        }
    }, [setCashSession]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const handleOpenSuccess = () => {
        setOpenModalOpen(false);
        refetch();
    };

    const handleCloseSuccess = () => {
        setCloseModalOpen(false);
        refetch();
    };

    return (
        <>
            <CashPageView
                loading={loading}
                cashSession={cashSession}
                canOpen={canOpen}
                canClose={canClose}
                onOpenCash={() => setOpenModalOpen(true)}
                onCloseCash={() => setCloseModalOpen(true)}
            />

            <OpenCashModal
                open={openModalOpen}
                onClose={() => setOpenModalOpen(false)}
                onSuccess={handleOpenSuccess}
            />

            <CloseCashModal
                open={closeModalOpen}
                onClose={() => setCloseModalOpen(false)}
                onSuccess={handleCloseSuccess}
            />
        </>
    );
};
