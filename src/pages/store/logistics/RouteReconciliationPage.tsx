import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Alert } from 'antd';
import { useReconciliation } from '@/features/store/logistics/hooks/useReconciliation';
import { RouteReconciliationPageView } from './RouteReconciliationPageView';

export const RouteReconciliationPage = () => {
    const { id: routeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { summary, collections, stops, discrepancies, pendingCollectionsCount, loading, actionLoading, error, fetchSummary, verifyCollection, rejectCollection } =
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
                    loading={loading}
                    actionLoading={actionLoading}
                    routeId={routeId}
                    onVerify={verifyCollection}
                    onReject={rejectCollection}
                    onBack={handleBack}
                />
            )}
        </Spin>
    );
};