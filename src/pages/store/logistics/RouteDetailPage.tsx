import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { useRouteDetail } from '@/features/store/logistics/hooks/useRouteDetail';
import { RouteDetailPageView } from './RouteDetailPageView';

export const RouteDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        route,
        dailyOrders,
        exceptionalOrders,
        loading,
        dailyOrdersLoading,
        exceptionalOrdersLoading,
        error,
        refresh,
        addStop,
        addExceptionalStop,
        removeStop,
        updateDepartureTime,
        planRoute,
        reorderStops,
        recalculate,
        optimizeRoute,
    } = useRouteDetail(id!);

    const handleBack = () => navigate('/tienda/logistica/rutas');

    return (
        <div className="routeDetailPageWrapper">
            <Button
                variant="default"
                label="Volver a Rutas"
                icon={<ArrowLeftOutlined />}
                action={handleBack}
            />
            <RouteDetailPageView
                route={route}
                dailyOrders={dailyOrders}
                exceptionalOrders={exceptionalOrders}
                loading={loading}
                dailyOrdersLoading={dailyOrdersLoading}
                exceptionalOrdersLoading={exceptionalOrdersLoading}
                error={error}
                onAddStop={addStop}
                onAddExceptionalStop={addExceptionalStop}
                onRemoveStop={removeStop}
                onUpdateDepartureTime={updateDepartureTime}
                onPlanRoute={planRoute}
                onReorderStops={reorderStops}
                onRecalculate={recalculate}
                onOptimizeRoute={optimizeRoute}
                onLoadSuccess={refresh}
            />
        </div>
    );
};
