import { useState } from 'react';
import { CommercialGroupsPageView } from './CommercialGroupsPageView';
import { CommercialGroupFormModal } from '@/features/store/commercial-groups/components/CommercialGroupFormModal';
import { useCommercialGroups } from '@/features/store/commercial-groups/hooks/useCommercialGroups';
import { usePermissions } from '@/hooks/usePermissions';
import type { CommercialGroup } from '@/features/store/commercial-groups/types/commercialGroup.types';

const routeMetadata = {
    title: 'Grupos Comerciales',
    description: 'Administrá los grupos comerciales de tu tienda',
    breadcrumbs: [
        { label: 'Tienda', path: '/tienda/dashboard' },
        { label: 'Clientes' },
        { label: 'Grupos Comerciales' },
    ],
};

export const CommercialGroupsPage = () => {
    const groupsState = useCommercialGroups();
    const { can } = usePermissions();
    const canCreateGroup = can('commercial_groups.create');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<CommercialGroup | undefined>(undefined);

    const handleEdit = (group: CommercialGroup) => {
        setSelectedGroup(group);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedGroup(undefined);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedGroup(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedGroup(undefined);
        groupsState.refetch();
    };

    return (
        <>
            <CommercialGroupsPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                canCreateGroup={canCreateGroup}
                error={groupsState.error}
                groups={groupsState.groups}
                loading={groupsState.loading}
                pagination={groupsState.pagination}
                onRefetch={groupsState.refetch}
                onEdit={handleEdit}
                onCreate={handleCreate}
                onDelete={groupsState.deleteGroup}
            />
            <CommercialGroupFormModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                group={selectedGroup}
            />
        </>
    );
};
