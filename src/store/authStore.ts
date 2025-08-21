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
export function getOrCreateAuthStore(): import('zustand').UseBoundStore<
    StoreApi<AuthState>
> {
    if (!_authStore) {
        const persistEnabled = typeof window !== 'undefined';
        _authStore = createAuthStore(persistEnabled);
    }
    return _authStore;
}

export const useAuthStore = getOrCreateAuthStore();

// Listen for auth state changes and update store only in browser/runtime
if (typeof window !== 'undefined' && firebaseAuth && onAuthStateChanged) {
    onAuthStateChanged(firebaseAuth, async (user) => {
        useAuthStore.getState().setAuthUser(user as FirebaseUser | null);
        useAuthStore.getState().setLoading(false);
        if (user && (user as FirebaseUser).getIdToken) {
            const token = await (user as FirebaseUser).getIdToken();
            useAuthStore.getState().setIdToken(token);
        } else {
            useAuthStore.getState().setIdToken(null);
        }
    });
}
