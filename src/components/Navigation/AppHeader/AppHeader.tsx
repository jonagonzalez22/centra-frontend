import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout } from 'antd';
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
    onLogout?: () => Promise<void>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    user,
    isMobile,
    onToggleMenu,
    onLogout,
}) => {
    const items = [
        { key: 'profile', label: 'Mi Perfil', icon: <UserOutlined /> },
        { key: 'logout', label: 'Cerrar Sesion', icon: <LogoutOutlined />, danger: true },
    ];

    const handleMenuClick = async ({ key }: { key: string }) => {
        if (key === 'logout' && onLogout) {
            await onLogout();
        }
    };

    return (
        <Header className="flex h-16 items-center justify-between bg-centra-primary px-4 shadow-sm md:px-8">
            <div className="flex items-center gap-4">
                {isMobile && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={onToggleMenu}
                        className="text-lg text-white"
                    />
                )}
                <h1 className="m-0 text-lg font-semibold text-white">{title}</h1>
            </div>

            <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight" arrow>
                <div className="flex cursor-pointer items-center gap-3 border-l border-white/20 pl-4 transition-opacity hover:opacity-80">
                    {!isMobile && (
                        <div className="flex flex-col items-end leading-tight">
                            <span className="text-sm font-semibold text-white">{user.name}</span>
                            <span className="text-xs text-white/70">{user.role}</span>
                        </div>
                    )}

                    <UserAvatar name={user.name} />
                </div>
            </Dropdown>
        </Header>
    );
};
