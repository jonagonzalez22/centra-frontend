import { useParams, useNavigate } from 'react-router-dom';
import { useRouteSheet } from '@/features/driver/hooks/useRouteSheet';
import { RouteSheetPageView } from './RouteSheetPageView';

const routeMetadata = {
    title: 'Hoja de Ruta',
    breadcrumbs: [
        { label: 'Tienda', path: '/tienda/dashboard' },
        { label: 'Conductor', path: '/tienda/conductor/rutas' },
        { label: 'Hoja de Ruta' },
    ],
};

export const RouteSheetPage = () => {
    const { routeId } = useParams<{ routeId: string }>();
    const navigate = useNavigate();
    const routeSheetState = useRouteSheet(routeId ?? '');

    const handleStopPress = (stopId: string) => {
        navigate(`/tienda/conductor/parada/${routeId}/${stopId}`);
    };

    return (
        <RouteSheetPageView
            title={routeMetadata.title}
            breadcrumbs={routeMetadata.breadcrumbs}
            stops={routeSheetState.stops}
            loading={routeSheetState.loading}
            error={routeSheetState.error}
            onRefresh={routeSheetState.refresh}
            onStopPress={handleStopPress}
        />
    );
};
