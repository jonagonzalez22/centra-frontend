import { useNavigate } from 'react-router-dom';
import { useActiveRoute } from '@/features/driver/hooks/useActiveRoute';
import { DriverRoutesPageView } from './DriverRoutesPageView';
import type { DeliveryRoute } from '@/features/driver/interfaces/driver.interface';

const routeMetadata = {
    title: 'Mis Rutas',
    description: 'Rutas asignadas para hoy',
    breadcrumbs: [
        { label: 'Tienda', path: '/tienda/dashboard' },
        { label: 'Conductor' },
    ],
};

export const DriverRoutesPage = () => {
    const navigate = useNavigate();
    const activeRouteState = useActiveRoute();

    const handleRoutePress = (route: DeliveryRoute) => {
        navigate(`/tienda/conductor/ruta/${route.id}`);
    };

    return (
        <DriverRoutesPageView
            title={routeMetadata.title}
            description={routeMetadata.description}
            breadcrumbs={routeMetadata.breadcrumbs}
            activeRoute={activeRouteState.route}
            loading={activeRouteState.loading}
            error={activeRouteState.error}
            onRefresh={activeRouteState.refresh}
            onRoutePress={handleRoutePress}
        />
    );
};
