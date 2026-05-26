import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface CanDoProps {
    permission: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export const CanDo = ({ permission, children, fallback = null }: CanDoProps) => {
    const { can } = usePermissions();

    if (!can(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
