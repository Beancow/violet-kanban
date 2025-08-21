import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

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
): import('zustand').UseBoundStore<StoreApi<AuthState>> {
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
        );
    }
    return create<AuthState>()(creator);
}

let _authStore: import('zustand').UseBoundStore<StoreApi<AuthState>> | null =
    null;

export function initializeAuthStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_authStore) {
        _authStore = createAuthStore(persistEnabled);
    }
    return _authStore;
}

export function getAuthStoreIfReady():
    | import('zustand').UseBoundStore<StoreApi<AuthState>>
    | null {
    return _authStore;
}

export function getOrCreateAuthStore(): import('zustand').UseBoundStore<
    StoreApi<AuthState>
> {
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

export const useAuthStore = (() => {
    const store = getOrCreateAuthStore();
    return store;
})();

// Auth listener is intentionally not registered at module-eval time.
// Use `AuthStoreProvider` (client) to register onAuthStateChanged inside a useEffect.
