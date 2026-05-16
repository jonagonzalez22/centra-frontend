import { Layout, Menu, Drawer } from 'antd';
import React, { useMemo } from 'react';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import './SidebarMenu.css';
import { useAuthStore } from '@/store/useAuthStore.store';
import { hasFeature } from '@/utils/features';
import { FeatureCode } from '@/entities/User';

const { Sider } = Layout;

type MenuContext = 'admin' | 'store' | 'both';

type MenuItem = {
    label: string;
    key: string;
    feature?: FeatureCode;
    permission?: string;
    context: MenuContext;
};

interface SidebarMenuProps {
    isMobile: boolean;
    isOpen: boolean;
    onClose?: () => void;
    selectedKey: string;
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', key: '/admin/dashboard', context: 'admin' },
    {
        label: 'Tiendas',
        key: '/admin/tiendas',
        context: 'admin',
        permission: 'stores.view',
    },
    {
        label: 'Usuarios',
        key: '/admin/usuarios',
        context: 'admin',
        permission: 'users.view',
    },
    {
        label: 'Planes',
        key: '/admin/planes',
        context: 'admin',
        permission: 'stores.view',
    },
    { label: 'Dashboard', key: '/tienda/dashboard', context: 'store' },
    { label: 'Punto de Venta', key: '/tienda/pos', context: 'store', feature: 'pos' },
    { label: 'Inventario', key: '/tienda/stock', context: 'store', feature: 'inventory' },
];

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
    isMobile,
    isOpen,
    onClose,
    selectedKey,
}) => {
    const { user } = useAuthStore();

    const navigate = useNavigate();

    const handleMenuClick: MenuProps['onClick'] = (event) => {
        navigate(event.key);
        onClose?.();
    };

    const menuItemPermissions = useMemo(() => {
        if (!user) return [];

        const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
        const isBackofficeUser = user.roles.includes('BACKOFFICE_USER');

        const currentContext: MenuContext = isSuperAdmin || isBackofficeUser ? 'admin' : 'store';

        return menuItems.filter((item: MenuItem) => {
            if (item.context !== 'both' && item.context !== currentContext) {
                return false;
            }

            if (item.permission && !user.permissions.includes(item.permission)) {
                return false;
            }

            if (item.feature && !hasFeature(user, item.feature)) {
                return false;
            }

            return true;
        });
    }, [user]);

    const menuContent = (
        <div className="sidebarMenuContent">
            <div className="sidebarMenuBrand">CENTRA</div>

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItemPermissions}
                onClick={handleMenuClick}
                className="sidebarMenuNavigation"
            />
        </div>
    );

    if (isMobile) {
        return (
            <Drawer
                placement="left"
                onClose={onClose}
                open={isOpen}
                styles={{ body: { padding: 0 } }}
                width={260}
                closable={false}
            >
                {menuContent}
            </Drawer>
        );
    }

    return (
        <Sider theme="light" breakpoint="lg" width={260} className="sidebarMenuDesktopContainer">
            {menuContent}
        </Sider>
    );
};
