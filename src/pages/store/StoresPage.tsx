import { Alert, Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { StoreSearchBar } from '@/features/store/components/StoreSearchBar';
import { StoresTable } from '@/features/store/components/StoresTable';
import { useStores } from '@/features/store/hooks/useStores';
import type { Store } from '@/features/store/types/store.types';
import { getPageNavigation, type PageBreadcrumbItem } from '@/router/router.utils';
import './StoresPage.css';

interface StoresPageViewProps {
    title: string;
    breadcrumbs: PageBreadcrumbItem[];
    stores: Store[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const StoresPageView = ({
    title,
    breadcrumbs,
    stores,
    loading,
    error,
    refetch,
}: StoresPageViewProps) => {
    return (
        <div className="storesPage">
            <div className="storesPageHeader">
                <h1 className="storesPageTitle">{title}</h1>

                <Breadcrumb
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />
            </div>

            <StoreSearchBar onFilter={refetch} onReset={refetch} />

            {error && (
                <Alert className="storesPageAlert" type="error" description={error} showIcon />
            )}

            <StoresTable stores={stores} loading={loading} />
        </div>
    );
};

export const StoresPage = () => {
    const { stores, loading, error, refetch } = useStores();
    const location = useLocation();
    const pageNavigation = getPageNavigation(location.pathname);

    return (
        <StoresPageView
            title={pageNavigation.title}
            breadcrumbs={pageNavigation.breadcrumbs}
            stores={stores}
            loading={loading}
            error={error}
            refetch={refetch}
        />
    );
};
