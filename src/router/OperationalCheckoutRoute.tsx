import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.store';
import { canAccessOperationalCheckout } from '@/utils/operationalAccess';

/** Grants the shared checkout UI without conflating POS and Orders permissions. */
export function OperationalCheckoutRoute() {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    return canAccessOperationalCheckout(user) ? <Outlet /> : <Navigate to="/tienda/dashboard" replace />;
}
