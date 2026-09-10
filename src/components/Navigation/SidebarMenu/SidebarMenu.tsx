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
    Package,
    UsersRound,
    ShoppingCart,
    MapPin,
} from 'lucide-react';
import './SidebarMenu.css';
import { useAuthStore } from '@/store/useAuthStore.store';
import { hasFeature } from '@/utils/features';
import type { FeatureCode, User, UserRole } from '@/entities/User';

const { Sider } = Layout;

type MenuContext = 'admin' | 'store' | 'both';

type MenuItem = {
    label: string;
    key: string;
    icon?: React.ReactNode;
    feature?: FeatureCode;
    permission?: string;
    role?: string;
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
            {
                label: 'Medios de Pago',
                key: '/admin/configuraciones/metodos-de-pago',
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
        role: 'STORE_USER',
    },
    {
        label: 'Ventas',
        key: '/tienda/ventas/parent',
        icon: <ShoppingCart size={ICON_SIZE} />,
        context: 'store',
        role: 'STORE_USER',
        children: [
            {
                label: 'Gestión de caja',
                key: '/tienda/caja',
                context: 'store',
                feature: 'cash',
                permission: 'cash.view',
                role: 'STORE_USER',
            },
            {
                label: 'Caja',
                key: '/tienda/ventas/pos',
                context: 'store',
                feature: 'pos',
                permission: 'pos.view',
                role: 'STORE_USER',
            },
            {
                label: 'Pedidos',
                key: '/tienda/ventas/pedidos',
                context: 'store',
                feature: 'pos',
                permission: 'orders.view',
                role: 'STORE_USER',
            },
        ],
    },
    {
        label: 'Inventario',
        key: '/tienda/inventario/parent',
        icon: <Package size={ICON_SIZE} />,
        context: 'store',
        role: 'STORE_USER',
        children: [
            {
                label: 'Productos',
                key: '/tienda/productos',
                context: 'store',
                feature: 'inventory',
                permission: 'inventory.view',
                role: 'STORE_USER',
            },
            {
                label: 'Categorías',
                key: '/tienda/categorias',
                context: 'store',
                feature: 'categories',
                permission: 'categories.view',
                role: 'STORE_USER',
            },
            {
                label: 'Movimientos',
                key: '/tienda/inventario/movimientos',
                context: 'store',
                feature: 'inventory',
                permission: 'inventory.view',
                role: 'STORE_USER',
            },
        ],
    },
    {
        label: 'Logística',
        key: '/tienda/logistica/parent',
        icon: <MapPin size={ICON_SIZE} />,
        context: 'store',
        feature: 'deliveries',
        role: 'STORE_USER',
        children: [
            {
                label: 'Rutas',
                key: '/tienda/logistica/rutas',
                context: 'store',
                permission: 'logistics.routes.view',
                role: 'STORE_USER',
            },
        ],
    },
    {
        label: 'Clientes',
        key: '/tienda/clientes/parent',
        icon: <UsersRound size={ICON_SIZE} />,
        context: 'store',
        feature: 'customers',
        role: 'STORE_USER',
        children: [
            {
                label: 'Listado',
                key: '/tienda/clientes',
                context: 'store',
                permission: 'customers.view',
                role: 'STORE_USER',
            },
            {
                label: 'Grupos Comerciales',
                key: '/tienda/clientes/grupos',
                context: 'store',
                permission: 'commercial_groups.view',
                role: 'STORE_USER',
            },
        ],
    },
    {
        label: 'Configuraciones',
        key: '/tienda/configuraciones/parent',
        icon: <Settings size={ICON_SIZE} />,
        context: 'store',
        feature: 'store_settings',
        role: 'STORE_USER',
        children: [
            {
                label: 'Medios de pago',
                key: '/tienda/configuraciones/medios-de-pago',
                context: 'store',
                feature: 'store_settings',
                permission: 'store_payment_methods.view',
                role: 'STORE_USER',
            },
        ],
    },
    {
        label: 'Conductor',
        key: '/tienda/conductor/parent',
        icon: <MapPin size={ICON_SIZE} />,
        context: 'store',
        role: 'STORE_DRIVER',
        children: [
            {
                label: 'Mis Rutas',
                key: '/tienda/conductor/rutas',
                context: 'store',
                permission: 'drivers.view',
                role: 'STORE_DRIVER',
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

    const isStoreAdmin = user.roles.includes('STORE_ADMIN');

    return items.reduce<MenuItem[]>((acc, item) => {
        if (item.context !== 'both' && item.context !== currentContext) return acc;
        if (item.permission && !user.permissions.includes(item.permission)) return acc;
        if (item.feature && !hasFeature(user, item.feature)) return acc;
        // STORE_ADMIN no necesita match de role (define permisos), salvo para STORE_DRIVER
        if (item.role === 'STORE_DRIVER' && !user.roles.includes('STORE_DRIVER')) return acc;
        if (item.role && !isStoreAdmin && !user.roles.includes(item.role as UserRole)) return acc;

        const filtered: MenuItem = { ...item };

        if (item.children && item.children.length > 0) {
            filtered.children = filterMenuItems(item.children, user, currentContext);
            if (filtered.children.length === 0) return acc;
        }

        acc.push(filtered);
        return acc;
    }, []);
}

function isChildOf(parentKey: string, childKey: string): boolean {
    if (childKey === parentKey) return true;
    if (childKey.startsWith(parentKey + '/')) return true;
    const baseKey = parentKey.replace(/\/parent$/, '');
    if (baseKey !== parentKey && (childKey === baseKey || childKey.startsWith(baseKey + '/')))
        return true;
    return false;
}

function collectMatchingSubMenuKeys(items: MenuItem[], selectedKey: string): string[] {
    const keys: string[] = [];
    for (const item of items) {
        if (item.children && item.children.length > 0) {
            const nestedKeys = collectMatchingSubMenuKeys(item.children, selectedKey);
            const hasMatchingChild = item.children.some((child) =>
                isChildOf(child.key, selectedKey)
            );
            if (hasMatchingChild || nestedKeys.length > 0) {
                keys.push(item.key, ...nestedKeys);
            }
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

    const [openKeys, setOpenKeys] = useState<string[]>(() =>
        collectMatchingSubMenuKeys(menuItemPermissions, selectedKey)
    );

    useLayoutEffect(() => {
        const relevantParents = collectMatchingSubMenuKeys(menuItemPermissions, selectedKey);
        if (relevantParents.length > 0) {
            import('react-dom').then(({ flushSync }) => {
                flushSync(() => {
                    setOpenKeys((prev) => [...new Set([...prev, ...relevantParents])]);
                });
            });
        }
    }, [selectedKey, menuItemPermissions]);

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
