import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { StoreUserSearchBar } from '@/features/store/users/components/StoreUserSearchBar';
import { StoreUsersTable } from '@/features/store/users/components/StoreUsersTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { User } from '@/entities/User';
import './StoreUsersPage.css';

interface StoreUsersPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    canCreateUser: boolean;
    error: string | null;
    onEdit: (user: User) => void;
    onCreate: () => void;
    onDelete: (id: number) => Promise<void>;
    onToggleActive: (id: number, isActive: boolean) => Promise<void>;
}

export const StoreUsersPageView = ({
    title,
    description,
    breadcrumbs,
    canCreateUser,
    error,
    onEdit,
    onCreate,
    onDelete,
    onToggleActive,
}: StoreUsersPageViewProps) => {
    return (
        <div className="storeUsersPage">
            <div className="storeUsersPageHeader">
                <Breadcrumb
                    className="storeUsersPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="storeUsersPageHeaderTop">
                    <div className="storeUsersPageHeaderText">
                        <h1 className="storeUsersPageTitle">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="storeUsersPageDescription">{description}</p>
                    </div>
                    {canCreateUser && (
                        <CanDo permission="store_users.create">
                            <Button
                                variant="primary"
                                label="Nuevo Usuario"
                                icon={<PlusOutlined />}
                                action={onCreate}
                            />
                        </CanDo>
                    )}
                </div>
            </div>

            <StoreUserSearchBar />

            {error && (
                <Alert className="storeUsersPageAlert" type="error" description={error} showIcon />
            )}

            <StoreUsersTable
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
            />
        </div>
    );
};
