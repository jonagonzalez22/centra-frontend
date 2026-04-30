import { siderStyle, headerStyle, contentStyle } from './AdminLayout.style';
import { SidebarMenu } from '@/components/Navigation/SidebarMenu';
import { AppHeader } from '@/components/Navigation/AppHeader';
import { useAuthStore } from '@/store/useAuthStore.store';
import { useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content, Header, Sider } = Layout;

/* interface IAdminLayoutProps {
    children: ReactNode;
} */

export const AdminLayout = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const items = [
        {
            key: '/admin',
            label: 'Dashboard',
        },
        {
            key: '/admin/stores',
            label: 'Tiendas',
        },
        {
            key: '/admin/plans',
            label: 'Planes',
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
                <SidebarMenu items={items} isMobile={false} selectedKey="/admin" />
            </Sider>

            <Layout>
                <Header style={headerStyle}>
                    <AppHeader
                        title="Backoffice Admin"
                        user={user}
                        isMobile={false}
                        onLogout={handleLogout}
                    />
                </Header>
                <Content style={contentStyle}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
