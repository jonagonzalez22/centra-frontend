import { Layout } from 'antd';
import type { ReactNode } from 'react';
import { SidebarMenu } from '@/components/Navigation/SidebarMenu';
import { AppHeader } from '@/components/Navigation/AppHeader';
import './StoreLayout.css';

const { Content } = Layout;

interface IStoreLayoutProps {
    children: ReactNode;
}

export const StoreLayout = ({ children }: IStoreLayoutProps) => {
    const items = [
        {
            key: 'store/stock',
            label: 'Stock',
        },
        {
            key: 'store/pos',
            label: 'POS',
        },
        {
            key: 'store/orders',
            label: 'Pedidos',
        },
    ];

    //TODO: esto se cambiara por el hook useAuthStore
    const user = {
        name: 'Admin User',
        role: 'admin',
    };

    //isMobile luego se refactorizara para que sea responsive
    return (
        <Layout className="storeLayout">
            <SidebarMenu items={items} isMobile={false} isOpen={false} selectedKey="/stock" />

            <Layout className="storeMainLayout">
                <AppHeader title="Lista de tiendas" user={user} isMobile={false} />

                <Content className="storeMainContent">{children}</Content>
            </Layout>
        </Layout>
    );
};
