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
        <div className="tw-flex tw-flex-col tw-h-full">
            <div className="tw-p-6 tw-text-xl tw-font-bold tw-text-blue-600">CENTRA</div>
            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={items}
                className="tw-border-none [&_.ant-menu-title-content]:tw-flex [&_.ant-menu-title-content]:tw-justify-start"
            />
        </div>
    );

    if (isMobile) {
        return (
            <Drawer
                placement="left"
                onClose={onClose}
                open={isOpen}
                bodyStyle={{ padding: 0 }}
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
            className="tw-hidden md:tw-block tw-h-screen tw-sticky tw-top-0 tw-left-0 tw-shadow-sm"
        >
            {menuContent}
        </Sider>
    );
};
