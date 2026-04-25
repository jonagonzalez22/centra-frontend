import { UserRole } from '@/entities/User';
import { useAuthStore } from '@/store/useAuthStore.store';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getHomePath } from './router.utils';

interface ProtectedRouteProps {
    allowedRoles: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
        return <Navigate to={getHomePath(user.roles)} replace />;
    }

    return <Outlet />;
}
