import { Layout, Menu, Drawer } from 'antd';
import React, { useEffect, useState } from 'react';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import './SidebarMenu.css';
import { useAuthStore } from '@/store/useAuthStore.store';
import { hasFeature } from '@/utils/features';
import { FeatureCode } from '@/entities/User';

const { Sider } = Layout;

type MenuItem = {
    label: string;
    key: string;
    feature?: FeatureCode;
};

interface SidebarMenuProps {
    isMobile: boolean;
    isOpen: boolean;
    onClose?: () => void;
    selectedKey: string;
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', key: '/admin/dashboard' },
    { label: 'Tiendas', key: '/admin/stores', feature: 'stores' },
    { label: 'Punto de Venta', key: '/tienda/pos', feature: 'pos' },
    { label: 'Inventario', key: '/tienda/stock', feature: 'inventory' },
    { label: 'Mensajería', key: '/tienda/mensajes', feature: 'messaging' },
];

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
    isMobile,
    isOpen,
    onClose,
    selectedKey,
}) => {
    const { user } = useAuthStore();

    const [menuItemPermissions, setMenuItemPermissions] = useState<MenuItem[]>([]);

    const navigate = useNavigate();

    const handleMenuClick: MenuProps['onClick'] = (event) => {
        navigate(event.key);
        onClose?.();
    };

    useEffect(() => {
        const filtered = menuItems.filter((item: MenuItem) => {
            if (item.feature && !hasFeature(user, item.feature)) {
                return false;
            }
            return true;
        });
        setMenuItemPermissions(filtered);
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
