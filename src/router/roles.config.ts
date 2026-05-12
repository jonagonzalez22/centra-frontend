import { UserRole } from '@/entities/User';

interface RoleConfig {
    homePath: string;
    allowedPaths: string[];
    priority: number;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
    SUPER_ADMIN: {
        homePath: '/admin',
        allowedPaths: ['/admin'],
        priority: 1,
    },
    STORE_ADMIN: {
        homePath: '/tienda',
        allowedPaths: ['/dashboard', '/tienda'],
        priority: 2,
    },
    BACKOFFICE_USER: {
        homePath: '/admin',
        allowedPaths: ['/admin'],
        priority: 3,
    },
};
