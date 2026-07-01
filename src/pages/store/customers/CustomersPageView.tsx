import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { CustomersSearchBar } from '@/features/store/customers/components/CustomersSearchBar';
import { CustomersTable } from '@/features/store/customers/components/CustomersTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { Customer, CustomersFilters } from '@/features/store/customers/types/customer.types';
import type { CommercialGroup } from '@/features/store/commercial-groups/types/commercialGroup.types';

interface CustomersPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    error: string | null;
    customers: Customer[];
    loading: boolean;
    pagination: { current: number; total: number; pageSize: number };
    onRefetch: (filters?: CustomersFilters) => void;
    onDelete: (id: number) => Promise<void>;
    commercialGroups: CommercialGroup[];
    groupsLoading: boolean;
}

export const CustomersPageView = ({
    title,
    description,
    breadcrumbs,
    error,
    customers,
    loading,
    pagination,
    onRefetch,
    onDelete,
    commercialGroups,
    groupsLoading,
}: CustomersPageViewProps) => {
    const handleTableChange = (page: number, pageSize: number) => {
        onRefetch({ page, per_page: pageSize });
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
                    <CanDo permission="customers.create">
                        <Link to="/tienda/clientes/nuevo">
                            <Button
                                variant="primary"
                                label="Nuevo Cliente"
                                icon={<PlusOutlined />}
                            />
                        </Link>
                    </CanDo>
                </div>
            </div>

            <CustomersSearchBar
                loading={loading}
                refetch={onRefetch}
                commercialGroups={commercialGroups}
                groupsLoading={groupsLoading}
            />

            {error && (
                <Alert className="mb-4 py-2 text-sm" type="error" description={error} showIcon />
            )}

            <CustomersTable
                customers={customers}
                loading={loading}
                pagination={pagination}
                onPageChange={handleTableChange}
                onDelete={onDelete}
            />
        </div>
    );
};
