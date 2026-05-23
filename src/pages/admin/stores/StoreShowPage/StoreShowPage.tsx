import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumb, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tabs } from '@/components/Tabs';
import { StoreInfoTab } from '@/features/admin/stores/components/StoreInfoTab';
import { ChangePlanModal } from '@/features/admin/stores/components/ChangePlanModal';
import { StoreUserTable } from '@/features/admin/users/components/StoreUserTable';
import { useStore } from '@/features/admin/stores/hooks/useStore';
import { useState } from 'react';
import './StoreShowPage.css';

export const StoreShowPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { store, loading, error, refetch } = useStore(id);
    const [changePlanOpen, setChangePlanOpen] = useState(false);

    const handleChangePlanSuccess = () => {
        setChangePlanOpen(false);
        refetch();
    };

    if (loading) {
        return (
            <div className="storeShowPageLoading">
                <Spin size="large" />
            </div>
        );
    }

    if (error || !store || !id) {
        navigate('/admin/tiendas', { replace: true });
        return null;
    }

    const tabItems = [
        {
            key: 'general',
            label: 'Información General',
            children: <StoreInfoTab store={store} onChangePlan={() => setChangePlanOpen(true)} />,
        },
        {
            key: 'users',
            label: 'Usuarios',
            children: <StoreUserTable storeId={id} />,
        },
    ];

    return (
        <div className="storeShowPage">
            <div className="storeShowPageHeader">
                <Breadcrumb
                    className="storeShowPageBreadcrumb"
                    items={[
                        { title: <Link to="/admin/dashboard">Admin</Link> },
                        { title: <Link to="/admin/tiendas">Tiendas</Link> },
                        { title: store.name },
                    ]}
                />
                <div className="storeShowPageHeaderTop">
                    <Button
                        variant="default"
                        label="Volver"
                        icon={<ArrowLeftOutlined />}
                        action={() => navigate('/admin/tiendas')}
                    />
                </div>
            </div>

            <Card>
                <Tabs items={tabItems} defaultActiveKey="general" />
            </Card>

            <ChangePlanModal
                open={changePlanOpen}
                onClose={() => setChangePlanOpen(false)}
                onSuccess={handleChangePlanSuccess}
                storeId={id!}
                currentPlanId={store?.plan?.id}
            />
        </div>
    );
};