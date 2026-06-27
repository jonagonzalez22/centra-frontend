import { useState } from 'react';
import { StoreUsersPageView } from './StoreUsersPageView';
import { StoreUserModal } from '@/features/store/users/components/StoreUserModal';
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
            />
            <StoreUserModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                user={selectedUser}
            />
        </StoreUsersProvider>
    );
};
