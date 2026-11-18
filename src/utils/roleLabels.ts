const storeRoleLabels: Record<string, string> = {
    STORE_ADMIN: 'Administrador',
    STORE_USER: 'Empleado',
    STORE_DRIVER: 'Repartidor',
};

/**
 * Returns the commercial name for store roles while preserving non-store roles.
 */
export const getRoleLabel = (role?: string | null): string => {
    if (!role) return '—';

    return storeRoleLabels[role] ?? role;
};
