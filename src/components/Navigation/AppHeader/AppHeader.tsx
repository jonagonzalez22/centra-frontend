import { Layout, Button, Dropdown } from 'antd';
import { MenuOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import React from 'react';
import { UserAvatar } from '../UserAvatar';

const { Header } = Layout;

interface User {
    name: string;
    role: string;
    avatarUrl?: string;
}

interface AppHeaderProps {
    title: string;
    user: User;
    isMobile: boolean;
    onToggleMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, user, isMobile, onToggleMenu }) => {
    const items = [
        { key: 'profile', label: 'Mi Perfil', icon: <UserOutlined /> },
        { key: 'logout', label: 'Cerrar Sesión', icon: <LogoutOutlined />, danger: true },
    ];

    return (
        <Header className="tw-bg-white tw-px-4 md:tw-px-8 tw-flex tw-items-center tw-justify-between tw-shadow-sm tw-z-10">
            <div className="tw-flex tw-items-center tw-gap-4">
                {isMobile && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={onToggleMenu}
                        className="tw-text-lg"
                    />
                )}
                <h1 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-gray-800">{title}</h1>
            </div>

            <Dropdown menu={{ items }} placement="bottomRight" arrow>
                <div className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-opacity-80 tw-transition-opacity tw-pl-3 tw-border-l tw-border-gray-200">
                    {!isMobile && (
                        <div className="tw-flex tw-flex-col tw-items-end tw-leading-tight">
                            <span className="tw-font-semibold tw-text-gray-800 tw-text-sm">
                                {user.name}
                            </span>
                            <span className="tw-text-gray-500 tw-text-xs">{user.role}</span>
                        </div>
                    )}

                    <UserAvatar name={user.name} />
                </div>
            </Dropdown>
        </Header>
    );
};
