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
    payment_methods: 'admin',
    stores: 'admin',
    store_users: 'store',
    categories: 'store',
    products: 'store',
    inventory: 'store',
    pos: 'store',
    sales: 'store',
    clients: 'store',
    deliveries: 'store',
    commercial_groups: 'store',
    customer_addresses: 'store',
    customer_contacts: 'store',
    customers: 'store',
    geography: 'store',
    cash: 'store',
    orders: 'store',
    store_payment_methods: 'store',
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
    store_users: 'Usuarios de Tienda',
    categories: 'Categorías',
    products: 'Productos',
    inventory: 'Stock',
    pos: 'Punto de Venta',
    sales: 'Ventas',
    clients: 'Clientes',
    deliveries: 'Deliveries',
    commercial_groups: 'Gupos Comerciales',
    customer_addresses: 'Direcciones de Clientes',
    customer_contacts: 'Contactos de Clientes',
    customers: 'Clientes',
    geography: 'Geografía',
    cash: 'Caja',
    payment_methods: 'Métodos de Pago',
    orders: 'Pedidos',
    store_payment_methods: 'Métodos de Pago de Tienda',
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
