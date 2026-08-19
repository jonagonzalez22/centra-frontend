import { useAuthStore } from '@/store/useAuthStore.store';
import { Navigate, Outlet } from 'react-router-dom';

interface PermissionRouteProps {
    permission: string;
    redirectTo?: string;
}

export function PermissionRoute({
    permission,
    redirectTo = '/admin/dashboard',
}: PermissionRouteProps) {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    const hasPermission = user.permissions.includes(permission);

    if (!hasPermission) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
}
