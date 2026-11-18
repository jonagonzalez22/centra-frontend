import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.store';
import { canAccessDriverDeliveries } from './router.utils';

/** Guards the operational driver app without granting administrative permissions. */
export function DriverAccessRoute() {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!canAccessDriverDeliveries(user)) {
        return <Navigate to="/tienda/dashboard" replace />;
    }

    return <Outlet />;
}
