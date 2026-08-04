import { useState } from 'react';
import { useRoutes } from '@/features/store/logistics/hooks/useRoutes';
import { RoutesPageView } from './RoutesPageView';
import { RouteFormModal } from '@/features/store/logistics/components/RouteFormModal/RouteFormModal';
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
    const canManageRoutes = can('logistics.routes.manage');

    const [modalOpen, setModalOpen] = useState(false);

    const handleCreate = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);

    const handleSuccess = () => {
        setModalOpen(false);
        routesState.refresh();
    };

    return (
        <>
            <RoutesPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                canManageRoutes={canManageRoutes}
                error={routesState.error}
                items={routesState.items}
                loading={routesState.loading}
                pagination={routesState.pagination}
                setPage={routesState.setPage}
                setPerPage={routesState.setPerPage}
                onCreate={handleCreate}
            />
            <RouteFormModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
            />
        </>
    );
};
