import { Layout, Menu, Drawer } from 'antd';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    User as LucideUser,
    CreditCard,
    Settings,
    FolderTree,
    Package,
    ArrowLeftRight,
    UsersRound,
} from 'lucide-react';
import './SidebarMenu.css';
import { useAuthStore } from '@/store/useAuthStore.store';
import { hasFeature } from '@/utils/features';
import type { FeatureCode, User } from '@/entities/User';

const { Sider } = Layout;

type MenuContext = 'admin' | 'store' | 'both';

type MenuItem = {
    label: string;
    key: string;
    icon?: React.ReactNode;
    feature?: FeatureCode;
    permission?: string;
    context: MenuContext;
    children?: MenuItem[];
};

interface SidebarMenuProps {
    isMobile: boolean;
    isOpen: boolean;
    onClose?: () => void;
    selectedKey: string;
}

const ICON_SIZE = 16;

const menuItems: MenuItem[] = [
    {
        label: 'Dashboard',
        key: '/admin/dashboard',
        icon: <LayoutDashboard size={ICON_SIZE} />,
        context: 'admin',
    },
    {
        label: 'Tiendas',
        key: '/admin/tiendas',
        icon: <Store size={ICON_SIZE} />,
        context: 'admin',
        permission: 'stores.view',
    },
    {
        label: 'Usuarios',
        key: '/admin/usuarios',
        icon: <LucideUser size={ICON_SIZE} />,
        context: 'admin',
        permission: 'users.view',
    },
    {
        label: 'Planes',
        key: '/admin/planes',
        icon: <CreditCard size={ICON_SIZE} />,
        context: 'admin',
        permission: 'plans.view',
    },
    {
        label: 'Configuraciones',
        key: '/admin/configuraciones',
        icon: <Settings size={ICON_SIZE} />,
        context: 'admin',
        permission: 'settings.view',
        children: [
            {
                label: 'Tipos de Negocio',
                key: '/admin/configuraciones/tipos-de-negocio',
                context: 'admin',
            },
            {
                label: 'Funcionalidades',
                key: '/admin/configuraciones/funcionalidades',
                context: 'admin',
            },
            {
                label: 'Roles y Permisos',
                key: '/admin/configuraciones/roles',
                context: 'admin',
            },
        ],
    },
    {
        label: 'Dashboard',
        key: '/tienda/dashboard',
        icon: <LayoutDashboard size={ICON_SIZE} />,
        context: 'store',
    },
    {
        label: 'Usuarios',
        key: '/tienda/usuarios',
        icon: <LucideUser size={ICON_SIZE} />,
        context: 'store',
        permission: 'store_users.view',
        feature: 'multi_user',
    },
    {
        label: 'Categorías',
        key: '/tienda/categorias',
        icon: <FolderTree size={ICON_SIZE} />,
        context: 'store',
        feature: 'categories',
    },
    {
        label: 'Inventario',
        key: '/tienda/productos',
        icon: <Package size={ICON_SIZE} />,
        context: 'store',
        feature: 'inventory',
    },
    {
        label: 'Movimientos',
        key: '/tienda/inventario/movimientos',
        icon: <ArrowLeftRight size={ICON_SIZE} />,
        context: 'store',
        feature: 'inventory',
        permission: 'inventory.view',
    },
    {
        label: 'Clientes',
        key: '/tienda/clientes',
        icon: <UsersRound size={ICON_SIZE} />,
        context: 'store',
        feature: 'customers',
        children: [
            {
                label: 'Grupos Comerciales',
                key: '/tienda/clientes/grupos',
                context: 'store',
                permission: 'commercial_groups.view',
            },
        ],
    },
];

function filterMenuItems(
    items: MenuItem[],
    user: User | null,
    currentContext: MenuContext
): MenuItem[] {
    if (!user) return [];

    return items.reduce<MenuItem[]>((acc, item) => {
        if (item.context !== 'both' && item.context !== currentContext) return acc;
        if (item.permission && !user.permissions.includes(item.permission)) return acc;
        if (item.feature && !hasFeature(user, item.feature)) return acc;

        const filtered: MenuItem = { ...item };

        if (item.children && item.children.length > 0) {
            filtered.children = filterMenuItems(item.children, user, currentContext);
            if (filtered.children.length === 0) return acc;
        }

        acc.push(filtered);
        return acc;
    }, []);
}

function collectSubMenuKeys(items: MenuItem[]): string[] {
    const keys: string[] = [];
    for (const item of items) {
        if (item.children && item.children.length > 0) {
            keys.push(item.key);
            keys.push(...collectSubMenuKeys(item.children));
        }
    }
    return keys;
}

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

        return filterMenuItems(menuItems, user, currentContext);
    }, [user]);

    const submenuKeys = useMemo(
        () => collectSubMenuKeys(menuItemPermissions),
        [menuItemPermissions]
    );

    const [openKeys, setOpenKeys] = useState<string[]>(() =>
        submenuKeys.filter((key) => selectedKey.startsWith(key + '/') || selectedKey === key)
    );

    useLayoutEffect(() => {
        const relevantParents = submenuKeys.filter(
            (key) => selectedKey.startsWith(key + '/') || selectedKey === key
        );
        if (relevantParents.length > 0) {
            import('react-dom').then(({ flushSync }) => {
                flushSync(() => {
                    setOpenKeys((prev) => [...new Set([...prev, ...relevantParents])]);
                });
            });
        }
    }, [selectedKey, submenuKeys]);

    const handleOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
    };

    const menuContent = (
        <div className="sidebarMenuContent">
            <div className="sidebarMenuBrand">CENTRA</div>

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                openKeys={openKeys}
                onOpenChange={handleOpenChange}
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
