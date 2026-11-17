const AUTH_STORAGE_KEY = 'centra-auth-storage';

export interface SessionIdentity {
    userId: number | string;
    storeId: number | string | null;
    token: string;
}

interface ActiveSession extends SessionIdentity {
    generation: number;
}

export type SessionInvalidationReason = 'logout' | 'login-transition' | 'unauthorized' | 'storage-change' | 'credential-mismatch';

type SessionInvalidator = (options: {
    reason: SessionInvalidationReason;
    clearPersistedAuth: boolean;
    redirectToLogin: boolean;
}) => void;

let activeSession: ActiveSession | null = null;
let generation = 0;
let invalidator: SessionInvalidator | null = null;

const isBrowser = () => typeof window !== 'undefined';

/**
 * The login payload historically provides the store through `user.store`, while
 * restored payloads can also contain `user.store_id`.  Both representations
 * describe the same session identity and must be normalized before comparing
 * credentials.
 */
export function getSessionStoreId(user: {
    store_id?: number | string | null;
    store?: { id?: number | string } | null;
}): number | string | null {
    return user.store_id ?? user.store?.id ?? null;
}

function readPersistedIdentity(raw: string | null): SessionIdentity | null {
    if (!raw) return null;

    try {
        const state = JSON.parse(raw)?.state;
        const token = state?.token;
        const user = state?.user;
        if (!token || !user || user.id === undefined) return null;

        return {
            token,
            userId: user.id,
            storeId: getSessionStoreId(user),
        };
    } catch {
        return null;
    }
}

function sameIdentity(left: SessionIdentity | null, right: SessionIdentity | null): boolean {
    return !!left && !!right
        && left.token === right.token
        && String(left.userId) === String(right.userId)
        && String(left.storeId) === String(right.storeId);
}

function invalidate(options: Parameters<SessionInvalidator>[0]): void {
    generation += 1;
    activeSession = null;
    invalidator?.(options);
}

export function registerSessionInvalidator(callback: SessionInvalidator): void {
    invalidator = callback;
}

export function activateSession(identity: SessionIdentity): number {
    generation += 1;
    activeSession = { ...identity, generation };
    return generation;
}

export function clearActiveSession(reason: Extract<SessionInvalidationReason, 'logout' | 'login-transition'>): void {
    generation += 1;
    activeSession = null;

    if (reason === 'login-transition') {
        invalidator?.({ reason, clearPersistedAuth: true, redirectToLogin: false });
    }
}

export function restorePersistedSession(identity: Omit<SessionIdentity, 'token'> & { token: string } | null): void {
    if (!identity) {
        generation += 1;
        activeSession = null;
        return;
    }

    activateSession(identity);
}

export function getCurrentSessionGeneration(): number {
    return activeSession?.generation ?? generation;
}

export function isCurrentSession(generationToCheck: number): boolean {
    // Stores can be initialized before the auth store hydrates.  Once a session
    // boundary has happened, the generation still prevents an older callback
    // from writing into the new state even when no session is currently active.
    return activeSession
        ? activeSession.generation === generationToCheck
        : generation === generationToCheck;
}

export function getSessionForRequest(): { session: ActiveSession | null; blocked: boolean } {
    const persisted = isBrowser()
        ? readPersistedIdentity(window.localStorage.getItem(AUTH_STORAGE_KEY))
        : null;

    if (activeSession === null && persisted) {
        activeSession = { ...persisted, generation: ++generation };
    }

    if (activeSession && !sameIdentity(activeSession, persisted)) {
        invalidate({
            reason: 'credential-mismatch',
            clearPersistedAuth: false,
            redirectToLogin: true,
        });
        return { session: null, blocked: true };
    }

    return { session: activeSession, blocked: false };
}

export function handleUnauthorizedResponse(requestGeneration: number | undefined): void {
    if (requestGeneration === undefined || !isCurrentSession(requestGeneration)) return;

    invalidate({
        reason: 'unauthorized',
        clearPersistedAuth: true,
        redirectToLogin: true,
    });
}

export function synchronizeSessionFromStorage(newValue: string | null): void {
    if (!activeSession) return;

    if (!sameIdentity(activeSession, readPersistedIdentity(newValue))) {
        invalidate({
            reason: 'storage-change',
            clearPersistedAuth: false,
            redirectToLogin: true,
        });
    }
}

export const sessionAuthStorageKey = AUTH_STORAGE_KEY;
