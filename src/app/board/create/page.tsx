'use client';
import { BoardForm } from '@/app/components/forms/BoardForm';
import { useUser } from '@/contexts/UserProvider';
import { createBoard } from '@/lib/firebase/boardServerActions';
import { useRouter } from 'next/navigation';
import { useBoards } from '@/contexts/BoardsProvider';

import { useRequireOrganization } from '@/hooks/useRequireOrganization';

export default function BoardCreate() {
    useRequireOrganization();
    const { user, currentOrganizationId } = useUser();
    const { addBoard } = useBoards();
    const router = useRouter();

    const handleCreateBoard = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (!user || !currentOrganizationId) {
            alert(
                'You must be logged in and belong to an organization to create a board.'
            );
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await createBoard(
            formData,
            user?.id,
            currentOrganizationId
        );
        if (result.success) {
            addBoard(result.data);
            router.push(`/board/${result.data.id}`);
        } else {
            console.error('Error creating board:', result.data);
        }
    };

    return (
        <div>
            <h1>Create Board</h1>
            <BoardForm user={user} onSubmit={handleCreateBoard} />
        </div>
    );
}
