import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { StoreSearchBar } from '@/features/admin/stores/components/StoreSearchBar';
import { StoresTable } from '@/features/admin/stores/components/StoresTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { Store } from '@/features/admin/stores/types/store.types';
import './StoresPage.css';

interface StoresPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    canCreateStore: boolean;
    error: string | null;
    onEdit: (store: Store) => void;
    onCreate: () => void;
    onView: (storeId: string) => void;
}

export const StoresPageView = ({
    title,
    description,
    breadcrumbs,
    canCreateStore,
    error,
    onEdit,
    onCreate,
    onView,
}: StoresPageViewProps) => {
    return (
        <div className="storesPage">
            <div className="storesPageHeader">
                <Breadcrumb
                    className="storesPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="storesPageHeaderTop">
                    <div className="storesPageHeaderText">
                        <h1 className="storesPageTitle">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="storesPageDescription">{description}</p>
                    </div>
                    {canCreateStore && (
                        <Button
                            variant="primary"
                            label="Nueva Tienda"
                            icon={<PlusOutlined />}
                            action={onCreate}
                        />
                    )}
                </div>
            </div>

            <StoreSearchBar />

            {error && (
                <Alert className="storesPageAlert" type="error" description={error} showIcon />
            )}

            <StoresTable onEdit={onEdit} onView={onView} />
        </div>
    );
};