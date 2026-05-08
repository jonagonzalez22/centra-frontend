import { SidebarMenu } from '@/components/Navigation/SidebarMenu';
import { AppHeader } from '@/components/Navigation/AppHeader';
import { useLocation } from 'react-router-dom';
import { Grid, Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import './AdminLayout.css';

const { Content } = Layout;

export const AdminLayout = () => {
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const isMobile = screens.xs === true && screens.md === false;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // TODO: Filtrar los items del menu segun permisos/rol del usuario.
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

    return (
        <Layout className="adminLayout">
            <SidebarMenu
                items={items}
                isMobile={isMobile}
                isOpen={isMobile && isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                selectedKey={location.pathname}
            />
            <Layout className="adminMainLayout">
                <AppHeader
                    title="Backoffice Admin"
                    user={user}
                    isMobile={isMobile}
                    onToggleMenu={() => setIsMenuOpen(true)}
                />
                <Content className="adminMainContent">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
