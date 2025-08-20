import { create } from 'zustand';
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

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            authUser: null,
            loading: true,
            idToken: null,
            setAuthUser: (user) => set({ authUser: user }),
            setLoading: (loading) => set({ loading }),
            setIdToken: (token) => set({ idToken: token }),
            logout: async () => {
                await firebaseAuth.signOut();
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
        }),
        { name: 'violet-kanban-auth-storage' }
    )
);

// Listen for auth state changes and update store
onAuthStateChanged(firebaseAuth, async (user) => {
    useAuthStore.getState().setAuthUser(user);
    useAuthStore.getState().setLoading(false);
    if (user && user.getIdToken) {
        const token = await user.getIdToken();
        useAuthStore.getState().setIdToken(token);
    } else {
        useAuthStore.getState().setIdToken(null);
    }
});
