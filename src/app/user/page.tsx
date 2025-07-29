'use client';
import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { useAppState } from '@/components/AppStateProvider';
import { WebWorkerTest } from '@/components/WebWorkerTest';

export default function UserPage() {
    const { user, setUser } = useAppState();

    if (!user) {
        return (
            <>
                <p>Please log in to see your boards.</p>
                <Button
                    variant='solid'
                    size='2'
                    color='green'
                    onClick={() =>
                        setUser({
                            id: '1',
                            name: 'John Doe',
                            email: 'john.doe@example.com',
                            photoURL: 'https://example.com/photo.jpg',
                            currentBoardId: '1752771419502',
                            currentOrganizationId: '1',
                        })
                    }
                >
                    Set User
                </Button>
            </>
        );
    }
    const { id: uid, name: displayName } = user;
    return (
        <div>
            <h1>{displayName ?? 'User Page'}</h1>
            <p>List of boards</p>
            {user ?
                <span>
                    <p>Welcome, {displayName}!</p>

                    <Button variant='solid' size='2' color='green'>
                        <Link href={`/user/${uid}/boards`}>
                            Go to your Boards
                        </Link>
                    </Button>
                </span>
            :   <span>
                    <p>Please log in to see your boards.</p>
                    <Button
                        variant='solid'
                        size='2'
                        color='green'
                        onClick={() =>
                            setUser({
                                id: '1',
                                name: 'John Doe',
                                email: 'john.doe@example.com',
                                photoURL: 'https://example.com/photo.jpg',
                                currentBoardId: '1752771419502',
                                currentOrganizationId: '1',
                            })
                        }
                    >
                        Set User
                    </Button>
                </span>
            }
            <WebWorkerTest />
        </div>
    );
}
