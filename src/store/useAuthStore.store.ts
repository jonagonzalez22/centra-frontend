import { User } from '@/entities/User';
import { authService } from '@/features/auth/services/auth.service';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentCashSession } from '@/entities/CashSession';
import { clearPrivateSessionState } from '@/security/clearPrivateSessionState';
import {
    activateSession,
    clearActiveSession,
    getSessionStoreId,
    registerSessionInvalidator,
    restorePersistedSession,
    sessionAuthStorageKey,
    synchronizeSessionFromStorage,
} from '@/security/sessionContext';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    logIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setCashSession: (session: CurrentCashSession | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            setCashSession: (session) =>
                set((state) => ({
                    user: state.user ? { ...state.user, cash_session: session } : null,
                })),
            logIn: async (email, password) => {
                // A new login always begins a new private-session boundary.
                // CENTRA does not preserve working drafts between sessions.
                clearPrivateSessionState();
                clearActiveSession('login-transition');
                set({ isAuthenticated: false, user: null, token: null, loading: true });
                try {
                    const response = await authService.logIn(email, password);
                    const { token, user } = response.data;
                    activateSession({ token, userId: user.id, storeId: getSessionStoreId(user) });
                    set({
                        isAuthenticated: true,
                        user,
                        token,
                        loading: false,
                    });
                } catch (error) {
                    // A failed login must leave no half-restored credentials.
                    clearActiveSession('logout');
                    set({ isAuthenticated: false, user: null, token: null, loading: false });
                    useAuthStore.persist.clearStorage();
                    throw error;
                }
            },
            logout: async () => {
                try {
                    await authService.logOut();
                } finally {
                    clearPrivateSessionState();
                    clearActiveSession('logout');
                    set({ user: null, token: null, isAuthenticated: false });
                    useAuthStore.persist.clearStorage();
                }
            },
        }),
        {
            name: 'centra-auth-storage',
            partialize: (state) => {
                if (!state.isAuthenticated || !state.token) {
                    return {};
                }
                return {
                    token: state.token,
                    user: state.user,
                    isAuthenticated: state.isAuthenticated,
                };
            },
            onRehydrateStorage: () => (state) => {
                if (state?.isAuthenticated && state.token && state.user) {
                    restorePersistedSession({
                        token: state.token,
                        userId: state.user.id,
                        storeId: getSessionStoreId(state.user),
                    });
                    return;
                }

                restorePersistedSession(null);
            },
        }
    )
);

registerSessionInvalidator(({ clearPersistedAuth, redirectToLogin }) => {
    clearPrivateSessionState();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, loading: false });

    if (clearPersistedAuth) {
        useAuthStore.persist.clearStorage();
    }

    if (redirectToLogin && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
    }
});

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === sessionAuthStorageKey) {
            synchronizeSessionFromStorage(event.newValue);
        }
    });
}
