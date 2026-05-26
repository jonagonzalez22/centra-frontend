import { DashboardPageView } from './DashboardPageView';
import { useDashboard } from '@/features/admin/dashboard/hooks/useDashboard';

const routeMetadata = {
    title: 'Dashboard',
    description: 'Resumen del sistema',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Dashboard' },
    ],
};

export const DashboardPage = () => {
    const dashboardState = useDashboard();

    return (
        <DashboardPageView
            title={routeMetadata.title}
            description={routeMetadata.description}
            breadcrumbs={routeMetadata.breadcrumbs}
            data={dashboardState.data}
            loading={dashboardState.loading}
            error={dashboardState.error}
        />
    );
};