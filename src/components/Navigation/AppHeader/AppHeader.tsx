import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout } from 'antd';
import type { MenuProps } from 'antd';
import React from 'react';
import { UserAvatar } from '../UserAvatar';
import { useAuthStore } from '@/store/useAuthStore.store';
import './AppHeader.css';

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
    const { logout } = useAuthStore();

    const items = [
        { key: 'profile', label: 'Mi Perfil', icon: <UserOutlined /> },
        { key: 'logout', label: 'Cerrar Sesion', icon: <LogoutOutlined />, danger: true },
    ];

    const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
        if (key === 'logout' && logout) {
            await logout();
        }
    };

    return (
        <Header className="appHeaderContainer">
            <div className="appHeaderTitleGroup">
                {isMobile && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={onToggleMenu}
                        className="appHeaderMobileMenuButton"
                    />
                )}
                <h1 className="appHeaderTitle">{title}</h1>
            </div>

            <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight" arrow>
                <div className="appHeaderUserMenuTrigger">
                    {!isMobile && (
                        <div className="appHeaderUserDetails">
                            <span className="appHeaderUserName">{user.name}</span>
                            <span className="appHeaderUserRole">{user.role}</span>
                        </div>
                    )}

                    <UserAvatar name={user.name} />
                </div>
            </Dropdown>
        </Header>
    );
};
