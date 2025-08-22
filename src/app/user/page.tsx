'use client';
import Link from 'next/link';
import { Button, Flex } from '@radix-ui/themes';
import { useAuthProvider } from '@/providers/AuthProvider';
import LoadingPage from '@/components/LoadingPage';

export default function UserPage() {
    const auth = useAuthProvider();
    const user = auth.authUser;

    if (!user) return <LoadingPage dataType='user' />;

    const displayName = user?.displayName ?? user?.email ?? 'User';
    return (
        <div>
            <Flex
                direction='row'
                align='center'
                gap='3'
                style={{ marginBottom: 24 }}
            >
                <h1>{displayName ?? 'User Page'}</h1>
            </Flex>
            <p>List of boards</p>
            {user && (
                <span>
                    <p>Welcome, {displayName}!</p>
                    <Button variant='solid' size='2' color='green'>
                        <Link href={`/boards`}>Go to your Boards</Link>
                    </Button>
                </span>
            )}
        </div>
    );
}
