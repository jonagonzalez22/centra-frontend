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
        dailyOrdersPagination,
        exceptionalOrdersPagination,
        eligibleFilters,
        eligibleLocalities,
        loading,
        dailyOrdersLoading,
        exceptionalOrdersLoading,
        error,
        setEligibleFilters,
        setEligiblePage,
        refresh,
        addStop,
        addExceptionalStop,
        removeStop,
        updateDepartureTime,
        updateRouteName,
        planRoute,
        reorderStops,
        recalculate,
        optimizeRoute,
        revertRoute,
        dispatchRoute,
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
                dailyOrdersPagination={dailyOrdersPagination}
                exceptionalOrdersPagination={exceptionalOrdersPagination}
                eligibleFilters={eligibleFilters}
                eligibleLocalities={eligibleLocalities}
                loading={loading}
                dailyOrdersLoading={dailyOrdersLoading}
                exceptionalOrdersLoading={exceptionalOrdersLoading}
                error={error}
                onEligibleFiltersChange={setEligibleFilters}
                onEligiblePageChange={setEligiblePage}
                onAddStop={addStop}
                onAddExceptionalStop={addExceptionalStop}
                onRemoveStop={removeStop}
                onUpdateDepartureTime={updateDepartureTime}
                onUpdateRouteName={updateRouteName}
                onPlanRoute={planRoute}
                onReorderStops={reorderStops}
                onRecalculate={recalculate}
                onOptimizeRoute={optimizeRoute}
                onRevertRoute={revertRoute}
                onDispatchRoute={dispatchRoute}
                onLoadSuccess={refresh}
            />
        </div>
    );
};
