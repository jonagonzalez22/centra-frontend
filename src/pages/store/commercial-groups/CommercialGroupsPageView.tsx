import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { CommercialGroupSearchBar } from '@/features/store/commercial-groups/components/CommercialGroupSearchBar';
import { CommercialGroupsTable } from '@/features/store/commercial-groups/components/CommercialGroupsTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { CommercialGroup, CommercialGroupsFilters } from '@/features/store/commercial-groups/types/commercialGroup.types';

interface CommercialGroupsPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    canCreateGroup: boolean;
    error: string | null;
    groups: CommercialGroup[];
    loading: boolean;
    pagination: { current: number; total: number; pageSize: number };
    onRefetch: (filters?: CommercialGroupsFilters) => void;
    onEdit: (group: CommercialGroup) => void;
    onCreate: () => void;
    onDelete: (id: string) => Promise<void>;
}

export const CommercialGroupsPageView = ({
    title,
    description,
    breadcrumbs,
    canCreateGroup,
    error,
    groups,
    loading,
    pagination,
    onRefetch,
    onEdit,
    onCreate,
    onDelete,
}: CommercialGroupsPageViewProps) => {
    const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
        onRefetch({ page: pag.current, per_page: pag.pageSize });
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <Breadcrumb
                    className="mb-2"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="m-0 text-2xl font-bold text-centra-primary">
                            {title.charAt(0).toUpperCase()}{title.slice(1)}
                        </h1>
                        <p className="m-0 text-sm text-centra-text/60">{description}</p>
                    </div>
                    {canCreateGroup && (
                        <CanDo permission="commercial_groups.create">
                            <Button
                                variant="primary"
                                label="Nuevo Grupo Comercial"
                                icon={<PlusOutlined />}
                                action={onCreate}
                            />
                        </CanDo>
                    )}
                </div>
            </div>

            <CommercialGroupSearchBar loading={loading} refetch={onRefetch} />

            {error && (
                <Alert className="mb-4 py-2 text-sm" type="error" description={error} showIcon />
            )}

            <CommercialGroupsTable
                groups={groups}
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    );
};
