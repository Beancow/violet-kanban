'use client';

import { useEffect } from 'react';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import { useAuth } from '@/components/AuthProvider';
import { Box, Card, Heading, Text } from '@radix-ui/themes';

const uiConfig: firebaseui.auth.Config = {
    signInFlow: 'popup',
    signInSuccessUrl: '/',
    signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
        EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
        signInSuccessWithAuthResult: () => {
            return false;
        },
    },
};

export default function LoginPage() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            const ui =
                firebaseui.auth.AuthUI.getInstance() ||
                new firebaseui.auth.AuthUI(firebaseAuth);
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    }, [loading, user]);

    if (loading || user) {
        return null;
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
