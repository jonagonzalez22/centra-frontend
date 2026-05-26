import { useState } from 'react';
import { UsersPageView } from './UsersPageView';
import { UserModal } from '@/features/admin/users/components/UserModal';
import { useUsers } from '@/features/admin/users/hooks/useUsers';
import { UsersProvider } from '@/features/admin/users/contexts/UsersProvider';
import type { User } from '@/entities/User';
import { usePermissions } from '@/hooks/usePermissions';

const routeMetadata = {
    title: 'Gestión de Usuarios',
    description: 'Administra los usuarios del sistema',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Usuarios' },
    ],
};

export const UsersPage = () => {
    const usersState = useUsers();
    const { can } = usePermissions();
    const canCreateUser = can('users.create');

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
        <UsersProvider value={usersState}>
            <UsersPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                canCreateUser={canCreateUser}
                error={usersState.error}
                onEdit={handleEdit}
                onCreate={handleCreate}
                onDelete={usersState.deleteUser}
            />
            <UserModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                user={selectedUser}
                filterOptions={usersState.filterOptions}
                filterOptionsLoading={usersState.filterOptionsLoading}
            />
        </UsersProvider>
    );
};