import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { RolesPageView } from './RolesPageView';
import { RolesTable } from '@/features/admin/roles/components/RolesTable';
import { PermissionDrawer } from '@/features/admin/roles/components/PermissionDrawer';
import { RolesService } from '@/features/admin/roles/services/role.service';
import type { Role } from '@/features/admin/roles/types/role.types';

const routeMetadata = {
    title: 'Gestión de Roles y Permisos',
    description: 'Administra los roles y permisos del sistema',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Configuraciones', path: '/admin/configuraciones' },
        { label: 'Roles y Permisos' },
    ],
};

export const RolesPage = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const getErrorMessage = (err: unknown, fallback: string): string => {
        if (err && typeof err === 'object') {
            if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
                return (err as { message: string }).message;
            }
            if ('data' in err && (err as { data?: { message?: string } }).data?.message) {
                return (err as { data: { message: string } }).data.message;
            }
        }
        return fallback;
    };

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await RolesService.getAll();
            setRoles(response.items);
        } catch (err) {
            const errMsg = getErrorMessage(err, 'Error al cargar roles.');
            setError(errMsg);
            message.error(errMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleEditPermissions = (role: Role) => {
        setSelectedRole(role);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedRole(null);
    };

    const handleSuccess = () => {
        setDrawerOpen(false);
        setSelectedRole(null);
        fetchRoles();
    };

    return (
        <>
            <RolesPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                error={error}
            />
            <RolesTable
                roles={roles}
                loading={loading}
                onEditPermissions={handleEditPermissions}
            />
            <PermissionDrawer
                open={drawerOpen}
                onClose={handleCloseDrawer}
                onSuccess={handleSuccess}
                role={selectedRole}
            />
        </>
    );
};