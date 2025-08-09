'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingPage from '@/components/LoadingPage';

export default function PostLoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Replace the current history entry instead of pushing a new one
        router.replace('/user');
    }, [router]);

    // Render a loading page while the redirect is in progress
    return <LoadingPage />;
}
