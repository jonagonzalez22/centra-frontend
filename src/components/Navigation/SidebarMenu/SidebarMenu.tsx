import { Layout, Menu, Drawer } from 'antd';
import React from 'react';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface SidebarMenuProps {
    items: MenuItem[];
    isMobile: boolean;
    isOpen?: boolean;
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
    const menuContent = (
        <div className="flex flex-col h-full">
            <div className="p-6 text-xl font-bold text-blue-600">CENTRA</div>

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={items}
                className="border-none [&_.ant-menu-title-content]:flex [&_.ant-menu-title-content]:justify-start"
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
            className="hidden md:block h-screen sticky top-0 left-0 shadow-sm"
        >
            {menuContent}
        </Sider>
    );
};
