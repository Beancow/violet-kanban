'use client';

import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { BoardForm } from '@/app/components/forms/BoardForm';
import { Board } from '@/types/appState.type';
import LoadingPage from '@/components/LoadingPage';
import { useAppToast } from '@/hooks/useToast';
import { useSync } from '@/contexts/SyncProvider';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function CreateBoardPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const { authUser } = useAuth();
    const { currentOrganizationId, loading: orgsLoading } = useOrganizations();
    const { showToast } = useAppToast();
    const { addActionToQueue: addAction } = useSync();
    const [boards, setBoards] = useLocalStorage<Board[]>('boards', []);

    const handleCreateBoard = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !authUser || !currentOrganizationId) {
            showToast('Error', 'You must be logged in and belong to an organization to create a board.');
            return;
        }

        const formData = new FormData(event.currentTarget);
        const newBoardId = `temp_${new Date().getTime()}`;
        
        const boardData: Board = {
            id: newBoardId,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            organizationId: currentOrganizationId,
            ownerId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [],
        };

        // Optimistic UI update
        setBoards([...boards, boardData]);

        // Add to sync queue with the correct payload structure
        addAction({
            type: 'create-board',
            payload: { data: boardData, tempId: newBoardId },
            timestamp: new Date().toISOString(),
        });

        showToast('Success', 'Board created successfully! Syncing in background...');
        router.push('/boards');
    };

    if (userLoading || orgsLoading) {
        return <LoadingPage />;
    }

    return (
        <BoardForm user={user} onSubmit={handleCreateBoard} />
    );
}