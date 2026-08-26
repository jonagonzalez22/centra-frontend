import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Alert } from 'antd';
import { useReconciliation } from '@/features/store/logistics/hooks/useReconciliation';
import { RouteReconciliationPageView } from './RouteReconciliationPageView';

export const RouteReconciliationPage = () => {
    const { id: routeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { summary, collections, stops, discrepancies, pendingCollectionsCount, pendingDiscrepanciesCount, loading, actionLoading, error, fetchSummary, verifyCollection, rejectCollection, resolveDiscrepancy } =
        useReconciliation(routeId!);

    const handleBack = useCallback(() => {
        navigate(`/tienda/logistica/rutas/${routeId}`);
    }, [navigate, routeId]);

    useEffect(() => {
        void fetchSummary();
    }, [fetchSummary]);

    return (
        <Spin spinning={loading} size="large">
            {error ? (
                <Alert type="error" message={error} showIcon />
            ) : (
                <RouteReconciliationPageView
                    summary={summary}
                    collections={collections}
                    stops={stops ?? []}
                    discrepancies={discrepancies}
                    pendingCollectionsCount={pendingCollectionsCount}
                    pendingDiscrepanciesCount={pendingDiscrepanciesCount}
                    loading={loading}
                    actionLoading={actionLoading}
                    routeId={routeId}
                    onVerify={verifyCollection}
                    onReject={rejectCollection}
                    onResolveDiscrepancy={resolveDiscrepancy}
                    onBack={handleBack}
                />
            )}
        </Spin>
    );
};