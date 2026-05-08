import { Grid, Layout } from 'antd';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { SidebarMenu } from '@/components/Navigation/SidebarMenu';
import { AppHeader } from '@/components/Navigation/AppHeader';
import './StoreLayout.css';

const { Content } = Layout;

interface IStoreLayoutProps {
    children: ReactNode;
}

export const StoreLayout = ({ children }: IStoreLayoutProps) => {
    const screens = Grid.useBreakpoint();
    const isMobile = screens.xs === true && screens.md === false;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    return (
        <Layout className="storeLayout">
            <SidebarMenu
                items={items}
                isMobile={isMobile}
                isOpen={isMobile && isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                selectedKey="/stock"
            />

            <Layout className="storeMainLayout">
                <AppHeader
                    title="Lista de tiendas"
                    user={user}
                    isMobile={isMobile}
                    onToggleMenu={() => setIsMenuOpen(true)}
                />

                <Content className="storeMainContent">{children}</Content>
            </Layout>
        </Layout>
    );
};
