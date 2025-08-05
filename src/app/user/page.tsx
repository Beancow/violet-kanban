'use client';
import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { useUser } from '@/contexts/UserProvider';

export default function UserPage() {
    const { user } = useUser();

    if (!user)
        return (
            <div>
                <h1>User Page</h1>
                <p>Please log in to see your boards.</p>
            </div>
        );

    const { name: displayName } = user;
    return (
        <div>
            <h1>{displayName ?? 'User Page'}</h1>
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
