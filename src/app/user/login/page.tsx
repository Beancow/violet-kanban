'use client';

import { useEffect } from 'react';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import { Box, Card, Heading, Text } from '@radix-ui/themes';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import LoadingPage from '@/components/LoadingPage';

export default function LoginPage() {
    const { authUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (authUser) {
            router.push('/user/post-login');
            return;
        }

        import('firebaseui').then(firebaseui => {
            const uiConfig: firebaseui.auth.Config = {
                signInFlow: 'popup',
                signInSuccessUrl: '/user/post-login',
                signInOptions: [
                    GoogleAuthProvider.PROVIDER_ID,
                    EmailAuthProvider.PROVIDER_ID,
                ],
                callbacks: {
                    // We don't need a callback here anymore.
                    // The useEffect hook will react to the auth state change and redirect.
                    signInSuccessWithAuthResult: () => false,
                },
            };
            const ui =
                firebaseui.auth.AuthUI.getInstance() ||
                new firebaseui.auth.AuthUI(firebaseAuth);
            ui.start('#firebaseui-auth-container', uiConfig);
        });
    }, [authUser, loading, router]);

    if (loading || authUser) {
        return <LoadingPage />;
    }

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
                <div id='firebaseui-auth-container'></div>
            </Card>
        </Box>
    );
}