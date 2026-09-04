import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout } from 'antd';
import type { MenuProps } from 'antd';
import React from 'react';
import { UserAvatar } from '../UserAvatar';
import { useAuthStore } from '@/store/useAuthStore.store';
import { useNavigate } from 'react-router-dom';
import './AppHeader.css';

const { Header } = Layout;

interface AppHeaderProps {
    title: string;
    isMobile: boolean;
    onToggleMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, isMobile, onToggleMenu }) => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const items = [
        { key: 'profile', label: 'Mi Perfil', icon: <UserOutlined /> },
        { key: 'logout', label: 'Cerrar Sesion', icon: <LogoutOutlined />, danger: true },
    ];

    const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
        if (key === 'logout' && logout) {
            // Leave the protected location before auth state is cleared so the
            // guard cannot turn the previous session URL into a login return URL.
            navigate('/login', { replace: true, state: null });
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
                            <span className="appHeaderUserName">{user?.name || '-'}</span>
                            <span className="appHeaderUserRole">{user?.roles[0] || '-'} </span>
                        </div>
                    )}

                    <UserAvatar name={user?.name || 'User'} />
                </div>
            </Dropdown>
        </Header>
    );
};
