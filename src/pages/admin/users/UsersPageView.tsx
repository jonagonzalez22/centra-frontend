import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { UserSearchBar } from '@/features/admin/users/components/UserSearchBar';
import { UsersTable } from '@/features/admin/users/components/UsersTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { User } from '@/entities/User';
import './UsersPage.css';

interface UsersPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    canCreateUser: boolean;
    error: string | null;
    onEdit: (user: User) => void;
    onCreate: () => void;
    onDelete: (id: number) => Promise<void>;
}

export const UsersPageView = ({
    title,
    description,
    breadcrumbs,
    canCreateUser,
    error,
    onEdit,
    onCreate,
    onDelete,
}: UsersPageViewProps) => {
    return (
        <div className="usersPage">
            <div className="usersPageHeader">
                <Breadcrumb
                    className="usersPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="usersPageHeaderTop">
                    <div className="usersPageHeaderText">
                        <h1 className="usersPageTitle">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="usersPageDescription">{description}</p>
                    </div>
                    {canCreateUser && (
                        <Button
                            variant="primary"
                            label="Nuevo Usuario"
                            icon={<PlusOutlined />}
                            action={onCreate}
                        />
                    )}
                </div>
            </div>

            <UserSearchBar />

            {error && (
                <Alert className="usersPageAlert" type="error" description={error} showIcon />
            )}

            <UsersTable onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
};