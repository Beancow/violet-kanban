'use client';
import React, { useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import { initializeAuthStore, getAuthStoreIfReady } from '@/store/authStore';

export function AuthStoreProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!firebaseAuth || !onAuthStateChanged) return;
        // Ensure store exists client-side
        try {
            initializeAuthStore();
        } catch (_) {
            // ignore
        }
        const unsub = onAuthStateChanged(
            firebaseAuth,
            async (user: FirebaseUser | null) => {
                const store = getAuthStoreIfReady();
                if (!store) return;
                store.getState().setAuthUser(user);
                store.getState().setLoading(false);
                if (
                    user &&
                    typeof (user as Partial<FirebaseUser>).getIdToken ===
                        'function'
                ) {
                    const token = await user.getIdToken();
                    store.getState().setIdToken(token);
                } else {
                    store.getState().setIdToken(null);
                }
            }
        );
        return () =>
            unsub && typeof unsub === 'function' ? unsub() : undefined;
    }, []);
    return <>{children}</>;
}

export default AuthStoreProvider;
