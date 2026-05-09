import { SidebarMenu } from '@/components/Navigation/SidebarMenu';
import { AppHeader } from '@/components/Navigation/AppHeader';
import { useLocation } from 'react-router-dom';
import { Grid, Layout } from 'antd';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import './AppLayout.css';

const { Content } = Layout;

export interface AppLayoutProps {
    title: string;
    menuItems: { key: string; label: string }[];
    children?: ReactNode;
}

export const AppLayout = ({ title, menuItems, children }: AppLayoutProps) => {
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const isMobile = screens.xs === true && screens.md === false;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const user = {
        name: 'Admin User',
        role: 'admin',
    };

    return (
        <Layout className="appLayout">
            <SidebarMenu
                items={menuItems}
                isMobile={isMobile}
                isOpen={isMobile && isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                selectedKey={location.pathname}
            />
            <Layout className="appMainLayout">
                <AppHeader
                    title={title}
                    user={user}
                    isMobile={isMobile}
                    onToggleMenu={() => setIsMenuOpen(true)}
                />
                <Content className="appMainContent">
                    {children ? children : <Outlet />}
                </Content>
            </Layout>
        </Layout>
    );
};