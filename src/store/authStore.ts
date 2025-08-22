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
    throw new Error('STORE_DISABLED: createAuthStore is disabled during migration checks');
}

let _authStore: StoreApi<AuthState> | null = null;

export function initializeAuthStore(
    persistEnabled = typeof window !== 'undefined'
) {
    throw new Error('STORE_DISABLED: initializeAuthStore is disabled during migration checks');
}

export function getAuthStoreIfReady(): StoreApi<AuthState> | null {
    throw new Error('STORE_DISABLED: getAuthStoreIfReady is disabled during migration checks');
}

export function getOrCreateAuthStore(): StoreApi<AuthState> {
    throw new Error('STORE_DISABLED: getOrCreateAuthStore is disabled during migration checks');
}

export function createAuthStoreForTest() {
    throw new Error('STORE_DISABLED: createAuthStoreForTest is disabled during migration checks');
}

// Lazy UseBoundStore wrapper for components. Mirrors other stores so
// non-React code can call `getOrCreateAuthStore()` and React components can call `useAuthStore`.
export const useAuthStore: import('zustand').UseBoundStore<
    StoreApi<AuthState>
> = ((..._args: Array<unknown>) => {
    throw new Error('STORE_DISABLED: useAuthStore is disabled during migration checks');
}) as unknown as import('zustand').UseBoundStore<StoreApi<AuthState>>;

// Auth listener is intentionally not registered at module-eval time.
