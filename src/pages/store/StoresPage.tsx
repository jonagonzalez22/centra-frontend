import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

import { StoreSearchBar } from '@/features/store/components/StoreSearchBar';
import { StoresTable } from '@/features/store/components/StoresTable';
import { useStores } from '@/features/store/hooks/useStores';
import './StoresPage.css';

export const StoresPage = () => {
    const { stores, loading, error, refetch } = useStores();

    return (
        <div className="storesPage">
            <div className="storesPageHeader">
                <h1 className="storesPageTitle">Gestión de Tiendas</h1>

                <Breadcrumb
                    items={[
                        {
                            title: <Link to="/admin/dashboard">Admin</Link>,
                        },
                        {
                            title: 'Tiendas',
                        },
                    ]}
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
