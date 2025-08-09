'use client';

import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { BoardForm } from '@/app/components/forms/BoardForm';
import { Board } from '@/types/appState.type';
import LoadingPage from '@/components/LoadingPage';

export default function CreateBoardPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const { authUser } = useAuth();
    const { currentOrganizationId, loading: orgsLoading } = useOrganizations();

    const handleCreateBoard = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('CreateBoardPage: user:', user);
        console.log('CreateBoardPage: authUser:', authUser);
        console.log('CreateBoardPage: currentOrganizationId:', currentOrganizationId);
        if (!user || !authUser || !currentOrganizationId) {
            alert('You must be logged in and belong to an organization to create a board.');
            return;
        }

        const formData = new FormData(event.currentTarget);
        
        const boardData: Omit<Board, 'id'> = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            organizationId: currentOrganizationId, // Use the current organization ID
            ownerId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [],
        };

        const result = await fetch('/api/boards/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Organization-Id': currentOrganizationId,
            },
            body: JSON.stringify({ data: boardData }),
        }).then(res => res.json());

        if (result.success) {
            alert('Board created successfully!');
            router.push('/boards'); // Redirect to boards list
        } else {
            alert(`Error creating board: ${result.error?.message}`);
        }
    };

    if (userLoading || orgsLoading) {
        return <LoadingPage />;
    }

    return (
        <BoardForm user={user} onSubmit={handleCreateBoard} />
    );
}