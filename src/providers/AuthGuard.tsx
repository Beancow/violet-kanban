'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard() {
    const auth = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // When auth finished loading and no user is present, redirect to login.
        if (!auth.loading && !auth.authUser) {
            const p = pathname || '/';
            // Basic whitelist so we don't redirect login page or internal routes.
            if (
                p === '/user/login' ||
                p === '/user/register' ||
                p === '/' ||
                p.startsWith('/api') ||
                p.startsWith('/_next') ||
                p.startsWith('/static')
            ) {
                return;
            }
            router.push('/user/login');
        }
    }, [auth.loading, auth.authUser, pathname, router]);

    return null;
}
