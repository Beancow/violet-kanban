'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import {
    Box,
    Card,
    Heading,
    Text,
    Button,
    Flex,
    TextField,
} from '@radix-ui/themes';
import { usePathname } from 'next/navigation';

function InlineLogin() {
    const auth = useAuth();
    const [error, setError] = useState<string | null>(null);

    const handleGoogle = async () => {
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(firebaseAuth, provider);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    if (auth.loading || auth.authUser) return null;

    return (
        <Box
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: 'var(--gray-2)',
            }}
        >
            <Card size='4' style={{ width: '400px' }}>
                <Heading as='h1' size='6' align='center' mb='2'>
                    Welcome
                </Heading>
                <Text as='p' align='center' color='gray' mb='5'>
                    Sign in to continue to the Kanban Board
                </Text>
                {error && (
                    <Text size='2' color='red' mb='3'>
                        {error}
                    </Text>
                )}
                <Flex direction='column' gap='3'>
                    <Button variant='soft' onClick={handleGoogle}>
                        Sign In with Google
                    </Button>
                </Flex>
            </Card>
        </Box>
    );
}

export default function AuthGuard() {
    const auth = useAuth();
    const pathname = usePathname() || '/';

    // Watch for storage changes in other tabs/windows and for focus events
    // so we can react when the auth storage key is removed (e.g., user
    // cleared site storage). If storage is removed but the provider still
    // reports `hasAuth`, force a logout so the guard will render the
    // login UI.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const STORAGE_KEY = 'violet-kanban-auth-v1';

        const checkAndLogoutIfStorageCleared = () => {
            try {
                const raw = window.localStorage.getItem(STORAGE_KEY);
                if (!raw && auth && auth.hasAuth) {
                    // force sign-out so provider and guard reflect cleared storage
                    void auth.logout();
                }
            } catch (err) {
                // non-fatal: surface in dev and capture to Sentry in prod
                if (process.env.NODE_ENV !== 'production')
                    console.debug('[AuthGuard] storage check failed', err);
            }
        };

        const onStorage = (e: StorageEvent) => {
            try {
                // If the auth storage key was removed in another tab/window,
                // trigger logout in this context so UI updates.
                if (e.key === null) {
                    // storage.clear() called
                    checkAndLogoutIfStorageCleared();
                } else if (e.key === STORAGE_KEY && e.newValue === null) {
                    checkAndLogoutIfStorageCleared();
                }
            } catch (err) {
                if (process.env.NODE_ENV !== 'production')
                    console.debug('[AuthGuard] onStorage handler failed', err);
            }
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener('focus', checkAndLogoutIfStorageCleared);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', checkAndLogoutIfStorageCleared);
        };
    }, [auth]);

    // Basic whitelist so we don't block internal routes or the login page itself
    const whitelisted = useMemo(() => {
        return (
            pathname === '/user/register' ||
            pathname === '/' ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/_next') ||
            pathname.startsWith('/static')
        );
    }, [pathname]);

    // While auth provider is loading, show nothing (loading handled by provider).
    if (auth.loading) return null;

    // If whitelisted routes, render children by returning null here so app continues.
    if (whitelisted) return null;

    // If user present, allow children to render by returning null (App renders children normally).
    if (auth.authUser) return null;

    // Not authenticated: render minimal inline login UI.
    return <InlineLogin />;
}
