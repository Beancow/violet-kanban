'use client';
import { Flex, Button } from '@radix-ui/themes';
import Breadcrumbs from './Breadcrumbs';
import OrganizationSelector from './OrganizationSelector';
import UserMenu from './UserMenu';
import { useAuth } from '@/providers/AuthProvider';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/firebase-config';

export default function Header() {
    const auth = useAuth();
    return (
        <Flex
            align='center'
            justify='between'
            p='2'
            style={{ borderBottom: '1px solid var(--gray-a5)' }}
        >
            <Flex align='center' gap='3'>
                <Breadcrumbs />
            </Flex>
            <Flex align='center' gap='3'>
                {auth.hasAuth ? (
                    <>
                        <OrganizationSelector />
                        <UserMenu />
                    </>
                ) : (
                    <Button
                        variant='soft'
                        onClick={async () => {
                            const provider = new GoogleAuthProvider();
                            try {
                                await signInWithPopup(firebaseAuth, provider);
                            } catch (err) {
                                // ignore, login UI/flow will surface errors elsewhere
                                console.error('Google sign-in failed', err);
                            }
                        }}
                    >
                        Sign In with Google
                    </Button>
                )}
            </Flex>
        </Flex>
    );
}
