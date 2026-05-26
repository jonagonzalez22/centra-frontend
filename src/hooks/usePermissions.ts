import { useAuthStore } from '@/store/useAuthStore.store';

export const usePermissions = () => {
    const user = useAuthStore((state) => state.user);

    const can = (permission: string): boolean => {
        return user?.permissions?.includes(permission) ?? false;
    };

    return { can };
};
