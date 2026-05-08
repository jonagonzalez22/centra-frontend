import { Layout } from 'antd';
import { ReactNode } from 'react';
import { siderStyle, headerStyle, contentStyle } from './StoreLayout.style';
import { SidebarMenu } from '@/components/Navigation/SidebarMenu';
import { AppHeader } from '@/components/Navigation/AppHeader';

const { Header, Sider, Content } = Layout;

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
        <Layout style={{ minHeight: '100vh' }}>
            <Sider style={siderStyle}>
                <SidebarMenu items={items} isMobile={false} isOpen={false} selectedKey="/stock" />
            </Sider>

            <Layout>
                <Header style={headerStyle}>
                    <AppHeader title="Lista de tiendas" user={user} isMobile={false} />
                </Header>

                <Content style={contentStyle}>{children}</Content>
            </Layout>
        </Layout>
    );
};
