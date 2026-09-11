import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Alert } from 'antd';
import { useReconciliation } from '@/features/store/logistics/hooks/useReconciliation';
import { RouteReconciliationPageView } from './RouteReconciliationPageView';

export const RouteReconciliationPage = () => {
    const { id: routeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { summary, collectionGroups, discrepancyGroups, pendingCollectionsCount, pendingDiscrepanciesCount, loading, actionLoading, error, fetchSummary, verifyCollection, verifyCollectionGroup, rejectCollection, resolveDiscrepancy, resolveDiscrepanciesBatch, finalize } =
        useReconciliation(routeId!);

    const handleBack = useCallback(() => {
        navigate(`/tienda/logistica/rutas/${routeId}`);
    }, [navigate, routeId]);

    // Redirect if route is already completed
    useEffect(() => {
        if (summary?.status === 'completed') {
            navigate(`/tienda/logistica/rutas/${routeId}`);
        }
    }, [summary?.status, navigate, routeId]);

    // Redirect if error indicates route is not in reconciliation state
    useEffect(() => {
        if (error && error.includes('no está en estado de conciliación')) {
            navigate(`/tienda/logistica/rutas/${routeId}`);
        }
    }, [error, navigate, routeId]);

    useEffect(() => {
        void fetchSummary();
    }, [fetchSummary]);

    return (
        <Spin spinning={loading} size="large">
            {error && !error.includes('no está en estado de conciliación') ? (
                <Alert type="error" message={error} showIcon />
            ) : (
                <RouteReconciliationPageView
                    summary={summary}
                    collectionGroups={collectionGroups}
                    discrepancyGroups={discrepancyGroups}
                    pendingCollectionsCount={pendingCollectionsCount}
                    pendingDiscrepanciesCount={pendingDiscrepanciesCount}
                    loading={loading}
                    actionLoading={actionLoading}
                    routeId={routeId}
                    onVerify={verifyCollection}
                    onVerifyGroup={verifyCollectionGroup}
                    onReject={rejectCollection}
                    onResolveDiscrepancy={resolveDiscrepancy}
                    onResolveDiscrepanciesBatch={resolveDiscrepanciesBatch}
                    onFinalize={finalize}
                    onBack={handleBack}
                />
            )}
        </Spin>
    );
};
