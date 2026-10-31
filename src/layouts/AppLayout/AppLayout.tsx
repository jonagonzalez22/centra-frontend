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
    children?: ReactNode;
}

export const AppLayout = ({ title, children }: AppLayoutProps) => {
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    // The desktop sidebar needs the `lg` width, not merely the `md` minimum.
    // Below Ant Design's lg breakpoint (992px), use the existing Drawer/menu
    // pattern so a persisted desktop preference cannot squeeze page content.
    const isCompactNavigation = screens.lg !== true;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <Layout className="appLayout">
            <SidebarMenu
                isMobile={isCompactNavigation}
                isOpen={isCompactNavigation && isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                selectedKey={location.pathname}
            />
            <Layout className="appMainLayout">
                <AppHeader
                    title={title}
                    isMobile={isCompactNavigation}
                    onToggleMenu={() => setIsMenuOpen(true)}
                />
                <Content className="appMainContent">{children ? children : <Outlet />}</Content>
            </Layout>
        </Layout>
    );
};
