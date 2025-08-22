import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { isUseBoundStore } from './factoryHelpers';

interface AuthState {
    authUser: FirebaseUser | null;
    loading: boolean;
    idToken: string | null;
    setAuthUser: (user: FirebaseUser | null) => void;
    setLoading: (loading: boolean) => void;
    setIdToken: (token: string | null) => void;
    logout: () => Promise<void>;
    refreshIdToken: () => Promise<void>;
}

export function createAuthStore(
    persistEnabled = true
): import('zustand').StoreApi<AuthState> {
    const creator: StateCreator<AuthState> = (set, get) => ({
        authUser: null,
        loading: true,
        idToken: null,
        setAuthUser: (user: FirebaseUser | null) => set({ authUser: user }),
        setLoading: (loading: boolean) => set({ loading }),
        setIdToken: (token: string | null) => set({ idToken: token }),
        logout: async () => {
            if (firebaseAuth && firebaseAuth.signOut) {
                await firebaseAuth.signOut();
            }
            set({ authUser: null, idToken: null });
        },
        refreshIdToken: async () => {
            const user = get().authUser;
            if (user && user.getIdToken) {
                const token = await user.getIdToken(true);
                set({ idToken: token });
            } else {
                set({ idToken: null });
            }
        },
    });

    if (persistEnabled) {
        return create<AuthState>()(
            persist(creator, { name: 'violet-kanban-auth-storage' })
        ) as unknown as StoreApi<AuthState>;
    }
    return create<AuthState>()(creator) as unknown as StoreApi<AuthState>;
}

let _authStore: StoreApi<AuthState> | null = null;

export function initializeAuthStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_authStore) {
        _authStore = createAuthStore(persistEnabled);
    }
    return _authStore;
}

export function getAuthStoreIfReady(): StoreApi<AuthState> | null {
    return _authStore;
}

export function getOrCreateAuthStore(): StoreApi<AuthState> {
    if (!_authStore) {
        throw new Error(
            'Auth store not initialized. Call initializeAuthStore() from AuthStoreProvider before using non-React APIs.'
        );
    }
    return _authStore;
}

export function createAuthStoreForTest() {
    return createAuthStore(false);
}

// Lazy UseBoundStore wrapper for components. Mirrors other stores so
// non-React code can call `getOrCreateAuthStore()` and React components can call `useAuthStore`.
export const useAuthStore: import('zustand').UseBoundStore<
    StoreApi<AuthState>
> = ((...args: Array<unknown>) => {
    const store = getOrCreateAuthStore();
    if (isUseBoundStore<AuthState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: AuthState) => unknown)
            | undefined;
        return (
            store as unknown as (
                selector?: (s: AuthState) => unknown
            ) => unknown
        )(selector);
    }
    const selector = args[0] as unknown;
    const storeApi = store as StoreApi<AuthState>;
    if (typeof selector === 'function') {
        return (selector as (s: AuthState) => unknown)(storeApi.getState());
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<AuthState>>;

// Auth listener is intentionally not registered at module-eval time.
// Use `AuthStoreProvider` (client) to register onAuthStateChanged inside a useEffect.
