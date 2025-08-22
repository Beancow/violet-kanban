'use client';

import { useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
} from 'firebase/auth';
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
import { useRouter } from 'next/navigation';
import { useAuthProvider } from '@/providers/AuthProvider';
import LoadingPage from '@/components/LoadingPage';

export default function LoginPage() {
    const auth = useAuthProvider();
    const authUser = auth.authUser;
    const loading = auth.loading;
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && authUser) {
            router.push('/user');
        }
    }, [authUser, loading, router]);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            router.push('/user');
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(firebaseAuth, provider);
            router.push('/user');
        } catch (err) {
            setError((err as Error).message);
        }
    };

    if (loading || authUser) {
        return <LoadingPage dataType='user' />;
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
                <form onSubmit={handleLogin}>
                    <Flex direction='column' gap='3'>
                        <TextField.Root
                            placeholder='Email'
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField.Root
                            placeholder='Password'
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                            <Text size='2' color='red'>
                                {error}
                            </Text>
                        )}
                        <Button type='submit'>Sign In</Button>
                    </Flex>
                </form>
                <Flex direction='column' gap='3' mt='4'>
                    <Button variant='soft' onClick={handleGoogleSignIn}>
                        Sign In with Google
                    </Button>
                </Flex>
            </Card>
        </Box>
    );
}
