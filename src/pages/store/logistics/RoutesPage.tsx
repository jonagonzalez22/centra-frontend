import { useRoutes } from '@/features/store/logistics/hooks/useRoutes';
import { RoutesPageView } from './RoutesPageView';
import { usePermissions } from '@/hooks/usePermissions';

const routeMetadata = {
    title: 'Rutas de Logística',
    description: 'Gestiona las rutas de entrega de tu tienda',
    breadcrumbs: [
        { label: 'Tienda', path: '/tienda/dashboard' },
        { label: 'Logística' },
    ],
};

export const RoutesPage = () => {
    const routesState = useRoutes();
    const { can } = usePermissions();

    return (
        <RoutesPageView
            title={routeMetadata.title}
            description={routeMetadata.description}
            breadcrumbs={routeMetadata.breadcrumbs}
            canManageRoutes={can('logistics.routes.view')}
            error={routesState.error}
            items={routesState.items}
            loading={routesState.loading}
            pagination={routesState.pagination}
            setPage={routesState.setPage}
            setPerPage={routesState.setPerPage}
        />
    );
};
