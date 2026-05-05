import { SidebarMenu } from '@/components/Navigation/SidebarMenu';
import { AppHeader } from '@/components/Navigation/AppHeader';
import { useAuthStore } from '@/store/useAuthStore.store';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import './AdminLayout.css';

const { Content } = Layout;

/* interface IAdminLayoutProps {
    children: ReactNode;
} */

export const AdminLayout = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

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
        <Layout className="adminLayout">
            <SidebarMenu items={items} isMobile={false} selectedKey={location.pathname} />
            <Layout className="adminMainLayout">
                <AppHeader
                    title="Backoffice Admin"
                    user={user}
                    isMobile={false}
                    onLogout={handleLogout}
                />
                <Content className="adminMainContent">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
