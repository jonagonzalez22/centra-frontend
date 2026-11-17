import {
    activateSession,
    clearActiveSession,
    getCurrentSessionGeneration,
    getSessionStoreId,
    getSessionForRequest,
    handleUnauthorizedResponse,
    registerSessionInvalidator,
    sessionAuthStorageKey,
    synchronizeSessionFromStorage,
} from './sessionContext';

const sessionStorageValue = (userId: number, storeId: number, token: string) =>
    JSON.stringify({ state: { isAuthenticated: true, token, user: { id: userId, store_id: storeId } } });

describe('sessionContext', () => {
    beforeEach(() => {
        localStorage.clear();
        clearActiveSession('logout');
    });

    test('blocks requests when persisted credentials diverge from the displayed identity', () => {
        const invalidator = vi.fn();
        registerSessionInvalidator(invalidator);
        localStorage.setItem(sessionAuthStorageKey, sessionStorageValue(1, 10, 'token-a'));
        activateSession({ userId: 1, storeId: 10, token: 'token-a' });

        localStorage.setItem(sessionAuthStorageKey, sessionStorageValue(2, 20, 'token-b'));

        expect(getSessionForRequest()).toEqual({ session: null, blocked: true });
        expect(invalidator).toHaveBeenCalledWith({
            reason: 'credential-mismatch',
            clearPersistedAuth: false,
            redirectToLogin: true,
        });
    });

    test('keeps the first private request active when login only includes user.store', () => {
        const invalidator = vi.fn();
        registerSessionInvalidator(invalidator);
        const user = { id: 1, store: { id: 'store-a' } };

        // This is the real login shape: `store_id` is absent, but `store.id`
        // identifies the active store. Persist writes that same user object.
        activateSession({
            userId: user.id,
            storeId: getSessionStoreId(user),
            token: 'token-a',
        });
        localStorage.setItem(
            sessionAuthStorageKey,
            JSON.stringify({ state: { isAuthenticated: true, token: 'token-a', user } })
        );

        expect(getSessionForRequest()).toMatchObject({
            blocked: false,
            session: { userId: 1, storeId: 'store-a', token: 'token-a' },
        });
        expect(invalidator).not.toHaveBeenCalled();
    });

    test('ignores a 401 belonging to an older session generation', () => {
        const invalidator = vi.fn();
        registerSessionInvalidator(invalidator);
        const oldGeneration = activateSession({ userId: 1, storeId: 10, token: 'token-a' });
        activateSession({ userId: 2, storeId: 20, token: 'token-b' });

        handleUnauthorizedResponse(oldGeneration);

        expect(invalidator).not.toHaveBeenCalled();
        expect(getCurrentSessionGeneration()).not.toBe(oldGeneration);
    });

    test('invalidates the current session after its own 401 response', () => {
        const invalidator = vi.fn();
        registerSessionInvalidator(invalidator);
        const currentGeneration = activateSession({ userId: 1, storeId: 10, token: 'token-a' });

        handleUnauthorizedResponse(currentGeneration);

        expect(invalidator).toHaveBeenCalledWith({
            reason: 'unauthorized',
            clearPersistedAuth: true,
            redirectToLogin: true,
        });
    });

    test('invalidates a tab when the shared auth storage changes identity', () => {
        const invalidator = vi.fn();
        registerSessionInvalidator(invalidator);
        activateSession({ userId: 1, storeId: 10, token: 'token-a' });

        synchronizeSessionFromStorage(sessionStorageValue(2, 20, 'token-b'));

        expect(invalidator).toHaveBeenCalledWith({
            reason: 'storage-change',
            clearPersistedAuth: false,
            redirectToLogin: true,
        });
    });
});
