'use client';
import { BoardForm } from '@/app/components/forms/BoardForm';
import { useUser } from '@/contexts/UserProvider';
import { createBoard } from '@/lib/firebase/boardServerActions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BoardCreate() {
    const [newBoardId, setNewBoardId] = useState('');
    const { user } = useUser();
    const router = useRouter();

    const handleCreateBoard = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (!user || !user.currentOrganizationId) {
            alert(
                'You must be logged in and belong to an organization to create a board.'
            );
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await createBoard(
            formData,
            user?.id,
            user?.currentOrganizationId
        );
        if (result.success) {
            setNewBoardId(result.data.id);
        } else {
            console.error('Error creating board:', result.data);
        }
    };

    useEffect(() => {
        if (newBoardId) {
            router.push(`/board/${newBoardId}`);
        }
    }, [newBoardId, router]);

    return (
        <div>
            <h1>Create Board</h1>
            <BoardForm user={user} onSubmit={handleCreateBoard} />
        </div>
    );
}
