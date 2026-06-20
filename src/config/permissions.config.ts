export type PermissionContext = 'admin' | 'store' | 'unknown';

export const PREFIX_TO_CONTEXT: Record<string, PermissionContext> = {
    plans: 'admin',
    features: 'admin',
    roles: 'admin',
    permissions: 'admin',
    'business-types': 'admin',
    backoffice_users: 'admin',
    users: 'admin',
    settings: 'admin',
    stores: 'store',
    categories: 'store',
    products: 'store',
    inventory: 'store',
    pos: 'store',
    sales: 'store',
    clients: 'store',
    deliveries: 'store',
};

export const MODULE_DISPLAY_NAMES: Record<string, string> = {
    plans: 'Planes',
    features: 'Funcionalidades',
    roles: 'Roles',
    permissions: 'Permisos',
    'business-types': 'Tipos de Negocio',
    backoffice_users: 'Usuarios Backoffice',
    users: 'Usuarios',
    settings: 'Configuraciones',
    stores: 'Tiendas',
    categories: 'Categorías',
    products: 'Productos',
    inventory: 'Stock',
    pos: 'Punto de Venta',
    sales: 'Ventas',
    clients: 'Clientes',
    deliveries: 'Deliveries',
};

export const getPermissionContext = (permissionCode: string): PermissionContext => {
    const prefix = permissionCode.split('.')[0];
    return PREFIX_TO_CONTEXT[prefix] ?? 'unknown';
};

export const getPermissionContextLabel = (context: PermissionContext): string => {
    switch (context) {
        case 'admin':
            return 'Sistema';
        case 'store':
            return 'Tienda';
        case 'unknown':
            return 'Sin clasificar';
    }
};

export const inferDefaultTab = (roleName: string): 'store' | 'admin' | 'all' => {
    if (roleName.startsWith('STORE_')) return 'store';
    if (roleName === 'SUPER_ADMIN' || roleName === 'BACKOFFICE_USER') return 'admin';
    return 'all';
};
