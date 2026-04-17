import { User } from '@/entities/User';
import { authService } from '@/features/auth/services/auth.service';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    logIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            logIn: async (email, password) => {
                try {
                    set({ loading: true });
                    const response = await authService.logIn(email, password);
                    const { token, ...user } = response.data;
                    set({
                        isAuthenticated: true,
                        user,
                        token,
                        loading: false,
                    });
                } catch (error) {
                    set({ loading: false });
                    throw error;
                }
            },
            logout: async () => {
                try {
                    await authService.logOut();
                } finally {
                    set({ user: null, token: null, isAuthenticated: false });
                    useAuthStore.persist.clearStorage();
                }
            },
        }),
        {
            name: 'entra-auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
