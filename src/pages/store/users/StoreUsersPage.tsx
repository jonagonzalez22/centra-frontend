import { useState } from 'react';
import { StoreUsersPageView } from './StoreUsersPageView';
import { StoreUserModal } from '@/features/store/users/components/StoreUserModal';
import { PermissionDrawer } from '@/features/store/users/components/PermissionDrawer';
import { useStoreUsers } from '@/features/store/users/hooks/useStoreUsers';
import { StoreUsersProvider } from '@/features/store/users/contexts/StoreUsersProvider';
import type { User } from '@/entities/User';
import { usePermissions } from '@/hooks/usePermissions';

const routeMetadata = {
    title: 'Gestión de Usuarios',
    description: 'Administrá los usuarios de tu tienda',
    breadcrumbs: [{ label: 'Tienda', path: '/tienda/dashboard' }, { label: 'Usuarios' }],
};

export const StoreUsersPage = () => {
    const usersState = useStoreUsers();
    const { can } = usePermissions();
    const canCreateUser = can('store_users.create');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [permDrawerOpen, setPermDrawerOpen] = useState(false);
    const [selectedPermUser, setSelectedPermUser] = useState<User | undefined>(undefined);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedUser(undefined);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedUser(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedUser(undefined);
        usersState.refetch();
    };

    const handleManagePermissions = (user: User) => {
        setSelectedPermUser(user);
        setPermDrawerOpen(true);
    };

    const handlePermDrawerClose = () => {
        setPermDrawerOpen(false);
        setSelectedPermUser(undefined);
    };

    const handlePermDrawerSuccess = () => {
        setPermDrawerOpen(false);
        setSelectedPermUser(undefined);
    };

    return (
        <StoreUsersProvider value={usersState}>
            <StoreUsersPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                canCreateUser={canCreateUser}
                error={usersState.error}
                onEdit={handleEdit}
                onCreate={handleCreate}
                onDelete={usersState.deleteUser}
                onToggleActive={usersState.toggleActive}
                onManagePermissions={handleManagePermissions}
            />
            <StoreUserModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                user={selectedUser}
            />
            <PermissionDrawer
                open={permDrawerOpen}
                onClose={handlePermDrawerClose}
                onSuccess={handlePermDrawerSuccess}
                user={selectedPermUser ?? null}
            />
        </StoreUsersProvider>
    );
};
