import { Layout, Menu, Drawer } from 'antd';
import React from 'react';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import './SidebarMenu.css';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface SidebarMenuProps {
    items: MenuItem[];
    isMobile: boolean;
    isOpen: boolean;
    onClose?: () => void;
    selectedKey: string;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
    items,
    isMobile,
    isOpen,
    onClose,
    selectedKey,
}) => {
    const navigate = useNavigate();

    const handleMenuClick: MenuProps['onClick'] = (event) => {
        navigate(event.key);
        onClose?.();
    };

    const menuContent = (
        <div className="sidebarMenuContent">
            <div className="sidebarMenuBrand">CENTRA</div>

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={items}
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
        <Sider
            theme="light"
            breakpoint="lg"
            width={260}
            className="sidebarMenuDesktopContainer"
        >
            {menuContent}
        </Sider>
    );
};
